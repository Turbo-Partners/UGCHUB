import { Express, Request, Response } from "express";
import { db } from "../db";
import { 
  metaAdAccounts, 
  metaBusinessManagers, 
  metaAdAccountsList,
  integrationLogs,
  creatorAdPartners,
  creatorAuthLinks,
  instagramAccounts,
  instagramTaggedPosts,
  companies,
  type InsertMetaAdAccount,
  type InsertMetaBusinessManager,
  type InsertMetaAdAccountsList,
} from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import crypto from "crypto";
import { z } from "zod";

declare module 'express-session' {
  interface SessionData {
    partnershipToken?: string;
    partnershipNonce?: string;
  }
}

const META_APP_ID = process.env.META_APP_ID;
const META_APP_SECRET = process.env.META_APP_SECRET;
const PRODUCTION_URL = process.env.PRODUCTION_URL || "https://ugc.turbopartners.com.br";
const FACEBOOK_GRAPH_API_VERSION = "v21.0";
const FACEBOOK_GRAPH_BASE_URL = `https://graph.facebook.com/${FACEBOOK_GRAPH_API_VERSION}`;

function getMetaRedirectUri(req: Request): string {
  const isProduction = process.env.NODE_ENV === "production" || 
                       process.env.REPLIT_DEPLOYMENT === "1";
  
  if (isProduction) {
    return `${PRODUCTION_URL}/api/auth/meta/callback`;
  }
  
  const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  
  if (!host) {
    return `${PRODUCTION_URL}/api/auth/meta/callback`;
  }
  
  return `${protocol}://${host}/api/auth/meta/callback`;
}

export function registerMetaMarketingRoutes(app: Express) {
  
  app.get("/api/meta/auth/url", (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const companyId = req.session.activeCompanyId;

    if (!companyId) {
      return res.status(400).json({ error: "No active company selected" });
    }

    if (!META_APP_ID) {
      return res.status(500).json({ error: "Meta App not configured" });
    }

    const state = crypto.randomBytes(32).toString("hex");
    const nonce = crypto.randomBytes(16).toString("hex");

    (req.session as any).metaOAuthState = {
      nonce: state,
      companyId,
      userId: req.user!.id,
      timestamp: Date.now(),
    };

    const redirectUri = getMetaRedirectUri(req);
    
    const scopes = [
      "ads_read",
      "ads_management",
      "business_management",
      "pages_read_engagement",
      "pages_show_list",
      "instagram_basic",
      "instagram_manage_insights",
      "instagram_manage_comments",
      "instagram_manage_messages",
      "instagram_content_publish",
      "email",
      "public_profile",
    ].join(",");

    const authUrl = `https://www.facebook.com/${FACEBOOK_GRAPH_API_VERSION}/dialog/oauth?` +
      `client_id=${META_APP_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${scopes}` +
      `&response_type=code` +
      `&state=${state}`;

    console.log(`[Meta Marketing OAuth] Generated auth URL for company ${companyId}`);
    res.json({ url: authUrl });
  });

  app.get("/api/auth/meta/callback", async (req: Request, res: Response) => {
    const { code, state, error, error_description } = req.query;
    const savedState = (req.session as any).metaOAuthState;
    const redirectBase = "/company/integrations";

    delete (req.session as any).metaOAuthState;

    if (error) {
      console.error("[Meta Marketing OAuth] Error from Meta:", error, error_description);
      return res.redirect(`${redirectBase}?error=${error}&message=${encodeURIComponent(String(error_description || ""))}`);
    }

    if (!code) {
      return res.redirect(`${redirectBase}?error=no_code`);
    }

    if (!META_APP_ID || !META_APP_SECRET) {
      console.error("[Meta Marketing OAuth] Missing Meta App credentials");
      return res.redirect(`${redirectBase}?error=server_config`);
    }

    if (!savedState || savedState.nonce !== state) {
      console.error("[Meta Marketing OAuth] State mismatch");
      return res.redirect(`${redirectBase}?error=invalid_state`);
    }

    if (Date.now() - savedState.timestamp > 5 * 60 * 1000) {
      return res.redirect(`${redirectBase}?error=state_expired`);
    }

    try {
      const redirectUri = getMetaRedirectUri(req);
      
      const tokenResponse = await fetch(
        `${FACEBOOK_GRAPH_BASE_URL}/oauth/access_token?` +
        `client_id=${META_APP_ID}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&client_secret=${META_APP_SECRET}` +
        `&code=${code}`
      );
      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        console.error("[Meta Marketing OAuth] Token error:", tokenData.error);
        return res.redirect(`${redirectBase}?error=token_exchange&message=${encodeURIComponent(tokenData.error.message || "")}`);
      }

      const shortLivedToken = tokenData.access_token;

      const llResponse = await fetch(
        `${FACEBOOK_GRAPH_BASE_URL}/oauth/access_token?` +
        `grant_type=fb_exchange_token` +
        `&client_id=${META_APP_ID}` +
        `&client_secret=${META_APP_SECRET}` +
        `&fb_exchange_token=${shortLivedToken}`
      );
      const llData = await llResponse.json();

      let longLivedToken = shortLivedToken;
      let expiresIn = 3600;

      if (llData.access_token) {
        longLivedToken = llData.access_token;
        expiresIn = llData.expires_in || 5184000;
        console.log("[Meta Marketing OAuth] Got long-lived token");
      }

      const meResponse = await fetch(
        `${FACEBOOK_GRAPH_BASE_URL}/me?fields=id,name,email&access_token=${longLivedToken}`
      );
      const meData = await meResponse.json();

      if (meData.error) {
        console.error("[Meta Marketing OAuth] Profile error:", meData.error);
        return res.redirect(`${redirectBase}?error=profile_fetch`);
      }

      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

      const existingAccount = await db.select()
        .from(metaAdAccounts)
        .where(and(
          eq(metaAdAccounts.companyId, savedState.companyId),
          eq(metaAdAccounts.metaUserId, meData.id)
        ))
        .limit(1);

      let metaAccountId: number;

      if (existingAccount.length > 0) {
        await db.update(metaAdAccounts)
          .set({
            accessToken: longLivedToken,
            accessTokenExpiresAt: expiresAt,
            metaUserName: meData.name,
            metaUserEmail: meData.email,
            scopes: ["ads_read", "ads_management", "business_management", "pages_read_engagement", "instagram_basic", "instagram_manage_insights", "instagram_manage_comments", "instagram_manage_messages", "instagram_content_publish"],
            isActive: true,
            updatedAt: new Date(),
          })
          .where(eq(metaAdAccounts.id, existingAccount[0].id));
        metaAccountId = existingAccount[0].id;
        console.log(`[Meta Marketing OAuth] Updated account for user ${meData.name}`);
      } else {
        const [newAccount] = await db.insert(metaAdAccounts).values({
          companyId: savedState.companyId,
          metaUserId: meData.id,
          metaUserName: meData.name,
          metaUserEmail: meData.email,
          accessToken: longLivedToken,
          accessTokenExpiresAt: expiresAt,
          scopes: ["ads_read", "ads_management", "business_management", "pages_read_engagement", "instagram_basic", "instagram_manage_insights", "instagram_manage_comments", "instagram_manage_messages", "instagram_content_publish"],
        }).returning({ id: metaAdAccounts.id });
        metaAccountId = newAccount.id;
        console.log(`[Meta Marketing OAuth] Created new account for user ${meData.name}`);
      }

      await syncBusinessManagersAndAdAccounts(metaAccountId, longLivedToken);

      // Redirect to account selection page
      res.redirect(`${redirectBase}?meta_connected=true&show_account_selection=true`);

    } catch (error) {
      console.error("[Meta Marketing OAuth] Error:", error);
      res.redirect(`${redirectBase}?error=server_error`);
    }
  });

  app.get("/api/meta/account", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const companyId = req.session.activeCompanyId;

    if (!companyId) {
      return res.status(400).json({ error: "No active company" });
    }

    try {
      const account = await db.select()
        .from(metaAdAccounts)
        .where(eq(metaAdAccounts.companyId, companyId))
        .limit(1);

      if (account.length === 0) {
        return res.json({ connected: false });
      }

      const businessManagers = await db.select()
        .from(metaBusinessManagers)
        .where(eq(metaBusinessManagers.metaAdAccountId, account[0].id));

      const adAccounts = await db.select()
        .from(metaAdAccountsList)
        .where(eq(metaAdAccountsList.metaAdAccountId, account[0].id));

      // Find the selected ad account
      const selectedAdAccount = adAccounts.find(a => a.isSelected);

      res.json({
        connected: true,
        account: {
          id: account[0].id,
          metaUserId: account[0].metaUserId,
          metaUserName: account[0].metaUserName,
          metaUserEmail: account[0].metaUserEmail,
          isActive: account[0].isActive,
          lastSyncAt: account[0].lastSyncAt,
          expiresAt: account[0].accessTokenExpiresAt,
          selectedAdAccountId: selectedAdAccount?.adAccountId || null,
          selectedAdAccountName: selectedAdAccount?.adAccountName || null,
        },
        businessManagers,
        adAccounts,
      });
    } catch (error) {
      console.error("[Meta Marketing] Error fetching account:", error);
      res.status(500).json({ error: "Failed to fetch account" });
    }
  });

  // Select an ad account as the primary account
  app.post("/api/meta/select-ad-account", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const companyId = req.session.activeCompanyId;
    const { adAccountId } = req.body;

    if (!companyId) {
      return res.status(400).json({ error: "No active company" });
    }

    if (!adAccountId) {
      return res.status(400).json({ error: "Ad account ID is required" });
    }

    try {
      const account = await db.select()
        .from(metaAdAccounts)
        .where(eq(metaAdAccounts.companyId, companyId))
        .limit(1);

      if (account.length === 0) {
        return res.status(404).json({ error: "No Meta account connected" });
      }

      // Validate that the ad account exists for this Meta account
      const adAccountExists = await db.select()
        .from(metaAdAccountsList)
        .where(and(
          eq(metaAdAccountsList.metaAdAccountId, account[0].id),
          eq(metaAdAccountsList.adAccountId, adAccountId)
        ))
        .limit(1);

      if (adAccountExists.length === 0) {
        return res.status(404).json({ error: "Ad account not found" });
      }

      // Use a transaction to ensure atomicity
      await db.transaction(async (tx) => {
        // First, deselect all ad accounts for this Meta account
        await tx.update(metaAdAccountsList)
          .set({ isSelected: false })
          .where(eq(metaAdAccountsList.metaAdAccountId, account[0].id));

        // Then select the specified ad account
        await tx.update(metaAdAccountsList)
          .set({ isSelected: true })
          .where(and(
            eq(metaAdAccountsList.metaAdAccountId, account[0].id),
            eq(metaAdAccountsList.adAccountId, adAccountId)
          ));
      });

      console.log(`[Meta Marketing] Selected ad account ${adAccountId} for company ${companyId}`);

      res.json({ success: true, selectedAdAccountId: adAccountId });
    } catch (error) {
      console.error("[Meta Marketing] Select ad account error:", error);
      res.status(500).json({ error: "Failed to select ad account" });
    }
  });

  app.post("/api/meta/sync", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const companyId = req.session.activeCompanyId;

    if (!companyId) {
      return res.status(400).json({ error: "No active company" });
    }

    try {
      const account = await db.select()
        .from(metaAdAccounts)
        .where(eq(metaAdAccounts.companyId, companyId))
        .limit(1);

      if (account.length === 0) {
        return res.status(404).json({ error: "No Meta account connected" });
      }

      await syncBusinessManagersAndAdAccounts(account[0].id, account[0].accessToken);

      await db.update(metaAdAccounts)
        .set({ lastSyncAt: new Date() })
        .where(eq(metaAdAccounts.id, account[0].id));

      res.json({ success: true, message: "Sync completed" });
    } catch (error) {
      console.error("[Meta Marketing] Sync error:", error);
      res.status(500).json({ error: "Sync failed" });
    }
  });

  app.get("/api/meta/insights/:adAccountId", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const companyId = req.session.activeCompanyId;
    const { adAccountId } = req.params;
    const { datePreset = "last_30d" } = req.query;

    if (!companyId) {
      return res.status(400).json({ error: "No active company" });
    }

    try {
      const account = await db.select()
        .from(metaAdAccounts)
        .where(eq(metaAdAccounts.companyId, companyId))
        .limit(1);

      if (account.length === 0) {
        return res.status(404).json({ error: "No Meta account connected" });
      }

      const insightsResponse = await fetch(
        `${FACEBOOK_GRAPH_BASE_URL}/act_${adAccountId}/insights?` +
        `fields=impressions,reach,clicks,spend,actions,cost_per_action_type,purchase_roas` +
        `&date_preset=${datePreset}` +
        `&access_token=${account[0].accessToken}`
      );
      const insightsData = await insightsResponse.json();

      if (insightsData.error) {
        console.error("[Meta Marketing] Insights error:", insightsData.error);
        return res.status(400).json({ error: insightsData.error.message });
      }

      res.json(insightsData);
    } catch (error) {
      console.error("[Meta Marketing] Insights error:", error);
      res.status(500).json({ error: "Failed to fetch insights" });
    }
  });

  app.get("/api/meta/campaigns/:adAccountId", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const companyId = req.session.activeCompanyId;
    const { adAccountId } = req.params;

    if (!companyId) {
      return res.status(400).json({ error: "No active company" });
    }

    try {
      const account = await db.select()
        .from(metaAdAccounts)
        .where(eq(metaAdAccounts.companyId, companyId))
        .limit(1);

      if (account.length === 0) {
        return res.status(404).json({ error: "No Meta account connected" });
      }

      const campaignsResponse = await fetch(
        `${FACEBOOK_GRAPH_BASE_URL}/act_${adAccountId}/campaigns?` +
        `fields=id,name,status,objective,daily_budget,lifetime_budget,created_time,insights{impressions,reach,spend,clicks}` +
        `&limit=50` +
        `&access_token=${account[0].accessToken}`
      );
      const campaignsData = await campaignsResponse.json();

      if (campaignsData.error) {
        console.error("[Meta Marketing] Campaigns error:", campaignsData.error);
        return res.status(400).json({ error: campaignsData.error.message });
      }

      res.json(campaignsData);
    } catch (error) {
      console.error("[Meta Marketing] Campaigns error:", error);
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });

  app.delete("/api/meta/disconnect", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const companyId = req.session.activeCompanyId;

    if (!companyId) {
      return res.status(400).json({ error: "No active company" });
    }

    try {
      await db.delete(metaAdAccounts)
        .where(eq(metaAdAccounts.companyId, companyId));

      res.json({ success: true, message: "Meta account disconnected" });
    } catch (error) {
      console.error("[Meta Marketing] Disconnect error:", error);
      res.status(500).json({ error: "Failed to disconnect" });
    }
  });

  // ============ SYNC ENDPOINT - Trigger all API calls for Meta verification ============
  
  app.post("/api/meta-marketing/sync", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const companyId = req.session.activeCompanyId;

    if (!companyId) {
      return res.status(400).json({ error: "No active company" });
    }

    try {
      const accounts = await db.select().from(metaAdAccounts)
        .where(eq(metaAdAccounts.companyId, companyId));

      if (accounts.length === 0) {
        return res.status(404).json({ error: "Meta account not connected" });
      }

      const account = accounts[0];
      const accessToken = account.accessToken;

      const results: { endpoint: string; status: string; data?: any; error?: string }[] = [];

      // 1. ads_read - Read ad accounts
      try {
        const adAccountsResponse = await fetch(
          `${FACEBOOK_GRAPH_BASE_URL}/me/adaccounts?fields=id,name,currency,account_status&access_token=${accessToken}`
        );
        const adAccountsData = await adAccountsResponse.json();
        
        if (adAccountsData.error) {
          results.push({ endpoint: "ads_read", status: "error", error: adAccountsData.error.message });
        } else {
          results.push({ endpoint: "ads_read", status: "success", data: { accountsCount: adAccountsData.data?.length || 0 } });
        }
      } catch (e: any) {
        results.push({ endpoint: "ads_read", status: "error", error: e.message });
      }

      // 2. ads_management - Read campaigns (proves write access scope)
      try {
        // First get the first ad account
        const adAccountsResponse = await fetch(
          `${FACEBOOK_GRAPH_BASE_URL}/me/adaccounts?fields=id&limit=1&access_token=${accessToken}`
        );
        const adAccountsData = await adAccountsResponse.json();
        
        if (adAccountsData.data && adAccountsData.data.length > 0) {
          const adAccountId = adAccountsData.data[0].id;
          const campaignsResponse = await fetch(
            `${FACEBOOK_GRAPH_BASE_URL}/${adAccountId}/campaigns?fields=id,name,status,objective&limit=10&access_token=${accessToken}`
          );
          const campaignsData = await campaignsResponse.json();
          
          if (campaignsData.error) {
            results.push({ endpoint: "ads_management", status: "error", error: campaignsData.error.message });
          } else {
            results.push({ endpoint: "ads_management", status: "success", data: { campaignsCount: campaignsData.data?.length || 0 } });
          }
        } else {
          results.push({ endpoint: "ads_management", status: "skipped", error: "No ad accounts available" });
        }
      } catch (e: any) {
        results.push({ endpoint: "ads_management", status: "error", error: e.message });
      }

      // 3. business_management - Read business managers
      try {
        const businessesResponse = await fetch(
          `${FACEBOOK_GRAPH_BASE_URL}/me/businesses?fields=id,name&access_token=${accessToken}`
        );
        const businessesData = await businessesResponse.json();
        
        if (businessesData.error) {
          results.push({ endpoint: "business_management", status: "error", error: businessesData.error.message });
        } else {
          results.push({ endpoint: "business_management", status: "success", data: { businessesCount: businessesData.data?.length || 0 } });
        }
      } catch (e: any) {
        results.push({ endpoint: "business_management", status: "error", error: e.message });
      }

      // 4. pages_show_list - Read pages
      try {
        const pagesResponse = await fetch(
          `${FACEBOOK_GRAPH_BASE_URL}/me/accounts?fields=id,name,access_token&access_token=${accessToken}`
        );
        const pagesData = await pagesResponse.json();
        
        if (pagesData.error) {
          results.push({ endpoint: "pages_show_list", status: "error", error: pagesData.error.message });
        } else {
          results.push({ endpoint: "pages_show_list", status: "success", data: { pagesCount: pagesData.data?.length || 0 } });
        }
      } catch (e: any) {
        results.push({ endpoint: "pages_show_list", status: "error", error: e.message });
      }

      // 5. pages_read_engagement - Test page read access (simpler test without insights)
      try {
        const pagesResponse = await fetch(
          `${FACEBOOK_GRAPH_BASE_URL}/me/accounts?fields=id,name,fan_count&limit=1&access_token=${accessToken}`
        );
        const pagesData = await pagesResponse.json();
        
        if (pagesData.error) {
          results.push({ endpoint: "pages_read_engagement", status: "error", error: pagesData.error.message });
        } else if (pagesData.data && pagesData.data.length > 0) {
          results.push({ endpoint: "pages_read_engagement", status: "success", data: { hasPageAccess: true, pageCount: pagesData.data.length } });
        } else {
          results.push({ endpoint: "pages_read_engagement", status: "skipped", error: "No pages available" });
        }
      } catch (e: any) {
        results.push({ endpoint: "pages_read_engagement", status: "error", error: e.message });
      }

      // Update last sync timestamp
      await db.update(metaAdAccounts)
        .set({ lastSyncAt: new Date(), updatedAt: new Date() })
        .where(eq(metaAdAccounts.id, account.id));

      // Save integration logs for each endpoint
      for (const result of results) {
        await db.insert(integrationLogs).values({
          companyId,
          platform: "meta",
          action: "sync",
          status: result.status === "success" ? "success" : result.status === "skipped" ? "skipped" : "error",
          endpoint: result.endpoint,
          details: result.data || null,
          errorMessage: result.error || null,
        });
      }

      console.log("[Meta Marketing Sync] Sync completed for company", companyId, "Results:", results);

      res.json({
        success: true,
        message: "Meta sync completed",
        results,
        syncedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("[Meta Marketing Sync] Error:", error);
      res.status(500).json({ error: "Failed to sync Meta data" });
    }
  });

  // ============ PARTNERSHIP ADS / CREATOR ADS ENDPOINTS ============

  // Helper function to get selected ad account
  async function getSelectedAdAccount(companyId: number) {
    const accounts = await db.select().from(metaAdAccounts)
      .where(eq(metaAdAccounts.companyId, companyId));
    
    if (accounts.length === 0) return null;
    
    const account = accounts[0];
    const selectedAdAccount = await db.select().from(metaAdAccountsList)
      .where(and(
        eq(metaAdAccountsList.metaAdAccountId, account.id),
        eq(metaAdAccountsList.isSelected, true)
      ));
    
    if (selectedAdAccount.length === 0) return null;
    
    return {
      metaAccount: account,
      adAccount: selectedAdAccount[0]
    };
  }

  // Get Partnership Ads (Branded Content Ads from creators)
  app.get("/api/meta-marketing/partnership-ads", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const companyId = req.session.activeCompanyId;
    if (!companyId) {
      return res.status(400).json({ error: "No active company" });
    }

    try {
      const selected = await getSelectedAdAccount(companyId);
      if (!selected) {
        return res.status(404).json({ error: "No ad account selected" });
      }

      const { metaAccount, adAccount } = selected;
      const accessToken = metaAccount.accessToken;
      const adAccountId = adAccount.adAccountId;

      // Fetch ads with partnership/branded content status
      const adsResponse = await fetch(
        `${FACEBOOK_GRAPH_BASE_URL}/act_${adAccountId}/ads?fields=id,name,status,effective_status,creative{id,name,instagram_permalink_url,effective_instagram_media_id,branded_content_sponsor_page_id,object_story_spec},insights.date_preset(last_30d){impressions,clicks,spend,ctr,cpc,reach}&filtering=[{"field":"effective_status","operator":"IN","value":["ACTIVE","PAUSED","PENDING_REVIEW"]}]&limit=50&access_token=${accessToken}`
      );
      const adsData = await adsResponse.json();

      if (adsData.error) {
        console.error("[Partnership Ads] Error:", adsData.error);
        return res.status(400).json({ error: adsData.error.message });
      }

      // Filter for true Partnership Ads - only those with branded_content_sponsor_page_id
      // This indicates creator content that is sponsored by the brand
      const partnershipAds = (adsData.data || []).filter((ad: any) => {
        const creative = ad.creative;
        // Only count as Partnership Ad if it has branded content sponsor (creator partnership)
        return creative?.branded_content_sponsor_page_id != null;
      });

      // Also fetch campaigns to see which are for creators
      const campaignsResponse = await fetch(
        `${FACEBOOK_GRAPH_BASE_URL}/act_${adAccountId}/campaigns?fields=id,name,status,objective,created_time,insights.date_preset(last_30d){impressions,reach,spend}&filtering=[{"field":"effective_status","operator":"IN","value":["ACTIVE","PAUSED"]}]&limit=50&access_token=${accessToken}`
      );
      const campaignsData = await campaignsResponse.json();

      res.json({
        partnershipAds,
        allAds: adsData.data || [],
        campaigns: campaignsData.data || [],
        adAccountId,
        adAccountName: adAccount.adAccountName,
      });
    } catch (error) {
      console.error("[Partnership Ads] Error:", error);
      res.status(500).json({ error: "Failed to fetch partnership ads" });
    }
  });

  // Get creator posts available for boosting (from Instagram Tagged Posts)
  app.get("/api/meta-marketing/creator-posts", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const companyId = req.session.activeCompanyId;
    if (!companyId) {
      return res.status(400).json({ error: "No active company" });
    }

    try {
      // Get posts where creators mentioned the brand (from Instagram Tagged Posts)
      const { instagramTaggedPosts, instagramAccounts } = await import("@shared/schema");
      const { desc } = await import("drizzle-orm");
      
      // First get the Instagram account for this company
      const igAccounts = await db.select().from(instagramAccounts)
        .where(eq(instagramAccounts.companyId, companyId));
      
      if (igAccounts.length === 0) {
        return res.json({ posts: [] });
      }
      
      const igAccountId = igAccounts[0].id;
      
      const posts = await db.select().from(instagramTaggedPosts)
        .where(eq(instagramTaggedPosts.instagramAccountId, igAccountId))
        .orderBy(desc(instagramTaggedPosts.createdAt))
        .limit(50);

      // Format for UI using correct field names
      const formattedPosts = posts.map(post => ({
        id: post.id,
        postId: post.postId,
        mediaType: post.mediaType,
        caption: post.caption,
        permalink: post.permalink,
        mediaUrl: post.mediaUrl,
        creatorUsername: post.username,
        likes: post.likes,
        comments: post.comments,
        impressions: post.impressions,
        reach: post.reach,
        engagement: post.engagement,
        emv: post.emv,
        sentiment: post.sentiment,
        sentimentScore: post.sentimentScore,
        timestamp: post.timestamp,
        canBoost: !!post.postId,
      }));

      res.json({ posts: formattedPosts });
    } catch (error) {
      console.error("[Creator Posts] Error:", error);
      res.status(500).json({ error: "Failed to fetch creator posts" });
    }
  });

  // Boost/promote a creator post as an ad
  app.post("/api/meta-marketing/boost-post", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const companyId = req.session.activeCompanyId;
    if (!companyId) {
      return res.status(400).json({ error: "No active company" });
    }

    const { postId, budget, duration, objective = "POST_ENGAGEMENT" } = req.body;

    if (!postId || !budget || !duration) {
      return res.status(400).json({ error: "postId, budget, and duration are required" });
    }

    try {
      const selected = await getSelectedAdAccount(companyId);
      if (!selected) {
        return res.status(404).json({ error: "No ad account selected" });
      }

      const { metaAccount, adAccount } = selected;
      const adAccountId = adAccount.adAccountId;

      // Get the post from tagged posts
      const { instagramTaggedPosts, instagramAccounts } = await import("@shared/schema");
      
      // First get the Instagram account for this company
      const igAccounts = await db.select().from(instagramAccounts)
        .where(eq(instagramAccounts.companyId, companyId));
      
      if (igAccounts.length === 0) {
        return res.status(404).json({ error: "Instagram account not connected" });
      }
      
      const posts = await db.select().from(instagramTaggedPosts)
        .where(and(
          eq(instagramTaggedPosts.instagramAccountId, igAccounts[0].id),
          eq(instagramTaggedPosts.id, postId)
        ));

      if (posts.length === 0) {
        return res.status(404).json({ error: "Post not found" });
      }

      const post = posts[0];

      // Note: Boosting Instagram posts requires:
      // 1. The Instagram Business Account to be connected to a Facebook Page
      // 2. The post needs to be on an IG Business account
      // 3. Partnership Ads require approval from both parties
      
      // For now, return info about requirements (full implementation needs testing with production accounts)
      res.json({
        message: "Para impulsionar posts de criadores, é necessário:",
        requirements: [
          "Conta Business do Instagram conectada a uma Página do Facebook",
          "Aprovação do criador para Partnership Ads",
          "Conta de anúncios com permissões adequadas"
        ],
        post: {
          id: post.id,
          creatorUsername: post.username,
          permalink: post.permalink,
          postId: post.postId,
        },
        adAccountId,
        suggestedWorkflow: "1. Solicitar autorização do criador via Branded Content Tool → 2. Criar anúncio com o post do criador → 3. Monitorar performance",
      });
    } catch (error) {
      console.error("[Boost Post] Error:", error);
      res.status(500).json({ error: "Failed to boost post" });
    }
  });

  // Get ad performance for creator-related campaigns
  app.get("/api/meta-marketing/creator-ads-performance", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const companyId = req.session.activeCompanyId;
    if (!companyId) {
      return res.status(400).json({ error: "No active company" });
    }

    try {
      const selected = await getSelectedAdAccount(companyId);
      if (!selected) {
        return res.status(404).json({ error: "No ad account selected" });
      }

      const { metaAccount, adAccount } = selected;
      const accessToken = metaAccount.accessToken;
      const adAccountId = adAccount.adAccountId;

      // Fetch active ads with insights
      const adsResponse = await fetch(
        `${FACEBOOK_GRAPH_BASE_URL}/act_${adAccountId}/ads?fields=id,name,status,effective_status,creative{id,name,instagram_permalink_url,thumbnail_url},insights.date_preset(last_30d){impressions,reach,clicks,spend,ctr,cpc,cpm,actions}&filtering=[{"field":"effective_status","operator":"IN","value":["ACTIVE"]}]&limit=25&access_token=${accessToken}`
      );
      const adsData = await adsResponse.json();

      if (adsData.error) {
        return res.status(400).json({ error: adsData.error.message });
      }

      // Calculate totals
      const ads = adsData.data || [];
      let totalSpend = 0;
      let totalImpressions = 0;
      let totalReach = 0;
      let totalClicks = 0;

      ads.forEach((ad: any) => {
        const insights = ad.insights?.data?.[0];
        if (insights) {
          totalSpend += parseFloat(insights.spend || 0);
          totalImpressions += parseInt(insights.impressions || 0);
          totalReach += parseInt(insights.reach || 0);
          totalClicks += parseInt(insights.clicks || 0);
        }
      });

      res.json({
        ads,
        summary: {
          totalAds: ads.length,
          totalSpend: totalSpend.toFixed(2),
          totalImpressions,
          totalReach,
          totalClicks,
          avgCTR: totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0.00",
          avgCPM: totalImpressions > 0 ? ((totalSpend / totalImpressions) * 1000).toFixed(2) : "0.00",
        },
        adAccountId,
        currency: adAccount.currency || "BRL",
      });
    } catch (error) {
      console.error("[Creator Ads Performance] Error:", error);
      res.status(500).json({ error: "Failed to fetch performance data" });
    }
  });

  // ==================== META ADS SUITE ROUTES ====================

  // Generate one-click authentication link for creators
  app.post("/api/meta-marketing/creator-auth-link", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const companyId = req.session.activeCompanyId;
    if (!companyId) {
      return res.status(400).json({ error: "No active company" });
    }

    const { instagramUsername, email, creatorId } = req.body;

    try {
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      const [link] = await db.insert(creatorAuthLinks).values({
        companyId,
        creatorId: creatorId || null,
        token,
        instagramUsername,
        email,
        expiresAt,
        redirectUrl: `/api/meta-marketing/creator-auth-callback`,
      }).returning();

      const baseUrl = PRODUCTION_URL || `https://${req.headers.host}`;
      const authLink = `${baseUrl}/creator-auth/${token}`;

      res.json({
        success: true,
        authLink,
        token,
        expiresAt,
        instagramUsername,
      });
    } catch (error) {
      console.error("[Creator Auth Link] Error:", error);
      res.status(500).json({ error: "Failed to create auth link" });
    }
  });

  // List creator auth links for a company
  app.get("/api/meta-marketing/creator-auth-links", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const companyId = req.session.activeCompanyId;
    if (!companyId) {
      return res.status(400).json({ error: "No active company" });
    }

    try {
      const links = await db.select().from(creatorAuthLinks)
        .where(eq(creatorAuthLinks.companyId, companyId))
        .orderBy(desc(creatorAuthLinks.createdAt));

      res.json({ links });
    } catch (error) {
      console.error("[Creator Auth Links] Error:", error);
      res.status(500).json({ error: "Failed to fetch auth links" });
    }
  });

  // Get creator ad partners (authorized creators)
  app.get("/api/meta-marketing/creator-partners", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const companyId = req.session.activeCompanyId;
    if (!companyId) {
      return res.status(400).json({ error: "No active company" });
    }

    try {
      const partners = await db.select().from(creatorAdPartners)
        .where(eq(creatorAdPartners.companyId, companyId))
        .orderBy(desc(creatorAdPartners.createdAt));

      const summary = {
        total: partners.length,
        active: partners.filter(p => p.status === "active").length,
        pending: partners.filter(p => p.status === "pending").length,
        expired: partners.filter(p => p.status === "expired").length,
      };

      res.json({ partners, summary });
    } catch (error) {
      console.error("[Creator Partners] Error:", error);
      res.status(500).json({ error: "Failed to fetch creator partners" });
    }
  });

  // Manually add a creator as ad partner (for testing or manual approval)
  app.post("/api/meta-marketing/creator-partners", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const companyId = req.session.activeCompanyId;
    if (!companyId) {
      return res.status(400).json({ error: "No active company" });
    }

    const { instagramUsername, instagramUserId, creatorId, status } = req.body;

    if (!instagramUsername) {
      return res.status(400).json({ error: "Instagram username required" });
    }

    try {
      const [partner] = await db.insert(creatorAdPartners).values({
        companyId,
        creatorId: creatorId || null,
        instagramUsername,
        instagramUserId: instagramUserId || null,
        status: status || "pending",
        authorizedAt: status === "active" ? new Date() : null,
      }).returning();

      res.json({ success: true, partner });
    } catch (error) {
      console.error("[Add Creator Partner] Error:", error);
      res.status(500).json({ error: "Failed to add creator partner" });
    }
  });

  // Update creator partner status
  app.patch("/api/meta-marketing/creator-partners/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const companyId = req.session.activeCompanyId;
    if (!companyId) {
      return res.status(400).json({ error: "No active company" });
    }

    const partnerId = parseInt(req.params.id);
    const { status } = req.body;

    try {
      const [updated] = await db.update(creatorAdPartners)
        .set({ 
          status, 
          updatedAt: new Date(),
          authorizedAt: status === "active" ? new Date() : undefined,
        })
        .where(and(
          eq(creatorAdPartners.id, partnerId),
          eq(creatorAdPartners.companyId, companyId)
        ))
        .returning();

      res.json({ success: true, partner: updated });
    } catch (error) {
      console.error("[Update Creator Partner] Error:", error);
      res.status(500).json({ error: "Failed to update creator partner" });
    }
  });

  // Get Meta Ads Suite dashboard metrics
  app.get("/api/meta-marketing/dashboard", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const companyId = req.session.activeCompanyId;
    if (!companyId) {
      return res.status(400).json({ error: "No active company" });
    }

    try {
      const selected = await getSelectedAdAccount(companyId);
      
      const partners = await db.select().from(creatorAdPartners)
        .where(eq(creatorAdPartners.companyId, companyId));

      let metaPerformance = null;
      if (selected) {
        try {
          const accessToken = selected.metaAccount.accessToken;
          const adAccountId = selected.adAccount.adAccountId;

          const insightsRes = await fetch(
            `${FACEBOOK_GRAPH_BASE_URL}/act_${adAccountId}/insights?fields=impressions,reach,clicks,spend,ctr,cpc,cpm,actions&date_preset=last_30d&access_token=${accessToken}`
          );
          const insightsData = await insightsRes.json();

          if (insightsData.data && insightsData.data.length > 0) {
            const data = insightsData.data[0];
            const purchases = data.actions?.find((a: any) => a.action_type === "purchase")?.value || 0;
            const revenue = parseFloat(purchases) * 100;
            const spend = parseFloat(data.spend || 0);
            
            metaPerformance = {
              impressions: parseInt(data.impressions || 0),
              reach: parseInt(data.reach || 0),
              clicks: parseInt(data.clicks || 0),
              spend: spend.toFixed(2),
              ctr: data.ctr || "0.00",
              cpc: data.cpc || "0.00",
              conversions: parseInt(purchases),
              roas: spend > 0 ? (revenue / spend).toFixed(2) : "0.00",
              engagement: parseInt(data.reach || 0),
            };
          }
        } catch (e) {
          console.error("[Dashboard] Meta performance fetch error:", e);
        }
      }

      res.json({
        connected: !!selected,
        adAccountName: selected?.adAccount.adAccountName || null,
        currency: selected?.adAccount.currency || "BRL",
        partnersSummary: {
          total: partners.length,
          active: partners.filter(p => p.status === "active").length,
          pending: partners.filter(p => p.status === "pending").length,
        },
        campaignsSummary: {
          total: 0,
          active: 0,
          draft: 0,
        },
        performance: metaPerformance,
      });
    } catch (error) {
      console.error("[Dashboard] Error:", error);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });

  // ============ PARTNERSHIP ADS ONE-CLICK AUTHENTICATION ============

  // Send Partnership Ads permission request to creator via Meta API
  app.post("/api/meta-marketing/partnership-request", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const companyId = req.session.activeCompanyId;
    if (!companyId) {
      return res.status(400).json({ error: "No active company" });
    }

    const { creatorInstagramUserId, partnerId } = req.body;

    if (!creatorInstagramUserId) {
      return res.status(400).json({ error: "Creator Instagram user ID required" });
    }

    try {
      // Get brand's Instagram Business Account
      const igAccounts = await db.select().from(instagramAccounts)
        .where(eq(instagramAccounts.companyId, companyId));

      if (igAccounts.length === 0) {
        return res.status(404).json({ error: "No Instagram Business Account connected. Connect on Integrations page." });
      }

      const brandIgAccount = igAccounts[0];
      const accessToken = brandIgAccount.accessToken;

      // Send Partnership Ads permission request via Meta API
      const requestUrl = `${FACEBOOK_GRAPH_BASE_URL}/${brandIgAccount.instagramUserId}/partnership_ads_requests`;
      
      const requestResponse = await fetch(requestUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partner_account_id: creatorInstagramUserId,
          access_token: accessToken,
        }),
      });

      const requestData = await requestResponse.json();

      if (requestData.error) {
        console.error("[Partnership Request] Meta API Error:", requestData.error);
        return res.status(400).json({ 
          error: requestData.error.message,
          errorCode: requestData.error.code,
        });
      }

      // Update partner status to "request_sent"
      if (partnerId) {
        await db.update(creatorAdPartners)
          .set({ 
            status: "request_sent",
            updatedAt: new Date(),
          })
          .where(and(
            eq(creatorAdPartners.id, partnerId),
            eq(creatorAdPartners.companyId, companyId)
          ));
      }

      res.json({ 
        success: true, 
        message: "Partnership Ads request sent! Creator will receive a DM on Instagram to approve.",
        requestId: requestData.id,
      });
    } catch (error) {
      console.error("[Partnership Request] Error:", error);
      res.status(500).json({ error: "Failed to send partnership request" });
    }
  });

  // Check Partnership Ads permission status
  app.get("/api/meta-marketing/partnership-status", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const companyId = req.session.activeCompanyId;
    if (!companyId) {
      return res.status(400).json({ error: "No active company" });
    }

    try {
      // Get brand's Instagram Business Account
      const igAccounts = await db.select().from(instagramAccounts)
        .where(eq(instagramAccounts.companyId, companyId));

      if (igAccounts.length === 0) {
        return res.status(404).json({ error: "No Instagram Business Account connected" });
      }

      const brandIgAccount = igAccounts[0];
      const accessToken = brandIgAccount.accessToken;

      // Get all partnership requests and their status
      const statusUrl = `${FACEBOOK_GRAPH_BASE_URL}/${brandIgAccount.instagramUserId}/partnership_ads_requests?fields=id,partner_account_id,status,created_time&access_token=${accessToken}`;
      
      const statusResponse = await fetch(statusUrl);
      const statusData = await statusResponse.json();

      if (statusData.error) {
        console.error("[Partnership Status] Meta API Error:", statusData.error);
        // Don't fail entirely - continue with approved partners sync
      }

      // Sync pending/request_sent requests to database
      if (statusData.data && statusData.data.length > 0) {
        for (const request of statusData.data) {
          const partnerIgId = request.partner_account_id;
          const metaStatus = request.status; // PENDING, APPROVED, DECLINED, etc.
          
          // Map Meta status to our status
          let localStatus: "pending" | "request_sent" | "active" | "expired" | "revoked" = "request_sent";
          if (metaStatus === "APPROVED") localStatus = "active";
          else if (metaStatus === "PENDING") localStatus = "request_sent";
          else if (metaStatus === "DECLINED" || metaStatus === "REVOKED") localStatus = "revoked";
          else if (metaStatus === "EXPIRED") localStatus = "expired";

          // Find existing partner by Instagram User ID
          const existing = await db.select().from(creatorAdPartners)
            .where(and(
              eq(creatorAdPartners.companyId, companyId),
              eq(creatorAdPartners.instagramUserId, partnerIgId)
            ));

          if (existing.length > 0) {
            // Only update if status changed
            if (existing[0].status !== localStatus) {
              await db.update(creatorAdPartners)
                .set({ 
                  status: localStatus,
                  updatedAt: new Date(),
                  authorizedAt: localStatus === "active" ? new Date() : existing[0].authorizedAt,
                })
                .where(eq(creatorAdPartners.id, existing[0].id));
            }
          }
        }
      }

      // Also get approved partners
      const partnersUrl = `${FACEBOOK_GRAPH_BASE_URL}/${brandIgAccount.instagramUserId}/partnership_ads_permission_owners?fields=id,username,profile_picture_url&access_token=${accessToken}`;
      
      const partnersResponse = await fetch(partnersUrl);
      const partnersData = await partnersResponse.json();

      // Sync approved partners to database
      if (partnersData.data && partnersData.data.length > 0) {
        for (const partner of partnersData.data) {
          // Check if partner exists
          const existing = await db.select().from(creatorAdPartners)
            .where(and(
              eq(creatorAdPartners.companyId, companyId),
              eq(creatorAdPartners.instagramUserId, partner.id)
            ));

          if (existing.length > 0) {
            // Update to active
            await db.update(creatorAdPartners)
              .set({ 
                status: "active",
                instagramUsername: partner.username,
                instagramProfilePic: partner.profile_picture_url,
                authorizedAt: new Date(),
                updatedAt: new Date(),
              })
              .where(eq(creatorAdPartners.id, existing[0].id));
          } else {
            // Insert new partner
            await db.insert(creatorAdPartners).values({
              companyId,
              instagramUserId: partner.id,
              instagramUsername: partner.username,
              instagramProfilePic: partner.profile_picture_url,
              status: "active",
              authorizedAt: new Date(),
            });
          }
        }
      }

      res.json({
        requests: statusData.data || [],
        approvedPartners: partnersData.data || [],
        syncedCount: (statusData.data?.length || 0) + (partnersData.data?.length || 0),
        brandAccountId: brandIgAccount.instagramUserId,
        brandUsername: brandIgAccount.username,
      });
    } catch (error) {
      console.error("[Partnership Status] Error:", error);
      res.status(500).json({ error: "Failed to check partnership status" });
    }
  });

  // Get creator's posts available for Partnership Ads
  app.get("/api/meta-marketing/creator-media/:partnerId", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const companyId = req.session.activeCompanyId;
    if (!companyId) {
      return res.status(400).json({ error: "No active company" });
    }

    const partnerId = parseInt(req.params.partnerId);

    try {
      // Get partner info
      const partners = await db.select().from(creatorAdPartners)
        .where(and(
          eq(creatorAdPartners.id, partnerId),
          eq(creatorAdPartners.companyId, companyId)
        ));

      if (partners.length === 0) {
        return res.status(404).json({ error: "Partner not found" });
      }

      const partner = partners[0];
      
      if (partner.status !== "active") {
        return res.status(400).json({ error: "Partner not authorized for Partnership Ads" });
      }

      // Get brand's Instagram account for access token
      const igAccounts = await db.select().from(instagramAccounts)
        .where(eq(instagramAccounts.companyId, companyId));

      if (igAccounts.length === 0) {
        return res.status(404).json({ error: "No Instagram Business Account connected" });
      }

      const accessToken = igAccounts[0].accessToken;

      // Get creator's media that can be used for Partnership Ads
      // This requires the creator to have granted partnership_ads permission
      const mediaUrl = `${FACEBOOK_GRAPH_BASE_URL}/${partner.instagramUserId}/media?fields=id,media_type,media_url,thumbnail_url,permalink,caption,timestamp,like_count,comments_count&limit=20&access_token=${accessToken}`;
      
      const mediaResponse = await fetch(mediaUrl);
      const mediaData = await mediaResponse.json();

      if (mediaData.error) {
        // If we can't access creator's media, show their tagged posts from our account
        const taggedPosts = await db.select().from(instagramTaggedPosts)
          .where(eq(instagramTaggedPosts.username, partner.instagramUsername || ""))
          .orderBy(desc(instagramTaggedPosts.timestamp))
          .limit(20);

        return res.json({
          source: "tagged_posts",
          media: taggedPosts.map(post => ({
            id: post.postId,
            media_type: post.mediaType,
            media_url: post.mediaUrl,
            thumbnail_url: post.mediaUrl, // Use mediaUrl as fallback
            permalink: post.permalink,
            caption: post.caption,
            timestamp: post.timestamp,
          })),
          partner: {
            id: partner.id,
            username: partner.instagramUsername,
            profilePic: partner.instagramProfilePic,
          },
        });
      }

      res.json({
        source: "creator_account",
        media: mediaData.data || [],
        partner: {
          id: partner.id,
          username: partner.instagramUsername,
          profilePic: partner.instagramProfilePic,
        },
      });
    } catch (error) {
      console.error("[Creator Media] Error:", error);
      res.status(500).json({ error: "Failed to fetch creator media" });
    }
  });

  // Create Partnership Ad via Meta API
  app.post("/api/meta-marketing/create-partnership-ad", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const companyId = req.session.activeCompanyId;
    if (!companyId) {
      return res.status(400).json({ error: "No active company" });
    }

    const { 
      campaignId,
      partnerId,
      instagramMediaId,
      displayHandle, // "both" or "creator_only"
      name,
      targeting,
      customAudienceIds,
      dailyBudget,
      optimization_goal,
    } = req.body;

    if (!partnerId || !instagramMediaId) {
      return res.status(400).json({ error: "Partner ID and Instagram media ID required" });
    }

    try {
      // Get selected ad account
      const selected = await getSelectedAdAccount(companyId);
      if (!selected) {
        return res.status(404).json({ error: "No ad account selected" });
      }

      const { metaAccount, adAccount } = selected;
      const accessToken = metaAccount.accessToken;
      const adAccountId = adAccount.adAccountId;

      // Get partner info
      const partners = await db.select().from(creatorAdPartners)
        .where(and(
          eq(creatorAdPartners.id, partnerId),
          eq(creatorAdPartners.companyId, companyId)
        ));

      if (partners.length === 0 || partners[0].status !== "active") {
        return res.status(400).json({ error: "Partner not authorized" });
      }

      const partner = partners[0];

      // Get brand's Instagram account
      const igAccounts = await db.select().from(instagramAccounts)
        .where(eq(instagramAccounts.companyId, companyId));

      if (igAccounts.length === 0) {
        return res.status(404).json({ error: "No Instagram Business Account connected" });
      }

      const brandIgAccount = igAccounts[0];

      // Step 1: Create Campaign (if not provided)
      let metaCampaignId = campaignId;
      if (!metaCampaignId) {
        const campaignResponse = await fetch(`${FACEBOOK_GRAPH_BASE_URL}/act_${adAccountId}/campaigns`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            name: name || `Partnership Ad - ${partner.instagramUsername}`,
            objective: "OUTCOME_SALES",
            special_ad_categories: "[]",
            status: "PAUSED",
            access_token: accessToken,
          }),
        });

        const campaignData = await campaignResponse.json();
        if (campaignData.error) {
          console.error("[Create Partnership Ad] Campaign error:", campaignData.error);
          return res.status(400).json({ error: campaignData.error.message });
        }
        metaCampaignId = campaignData.id;
      }

      // Step 2: Create Ad Set
      const adSetBody: Record<string, string> = {
        name: `${partner.instagramUsername} - Ad Set`,
        campaign_id: metaCampaignId,
        billing_event: "IMPRESSIONS",
        optimization_goal: optimization_goal || "OFFSITE_CONVERSIONS",
        daily_budget: String((dailyBudget || 50) * 100), // Convert to cents
        status: "PAUSED",
        targeting: JSON.stringify(targeting || {
          geo_locations: { countries: ["BR"] },
          age_min: 18,
          age_max: 65,
        }),
        access_token: accessToken,
      };

      if (customAudienceIds && customAudienceIds.length > 0) {
        adSetBody.targeting = JSON.stringify({
          ...JSON.parse(adSetBody.targeting),
          custom_audiences: customAudienceIds.map((id: string) => ({ id })),
        });
      }

      const adSetResponse = await fetch(`${FACEBOOK_GRAPH_BASE_URL}/act_${adAccountId}/adsets`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(adSetBody),
      });

      const adSetData = await adSetResponse.json();
      if (adSetData.error) {
        console.error("[Create Partnership Ad] Ad Set error:", adSetData.error);
        return res.status(400).json({ error: adSetData.error.message });
      }

      // Step 3: Create Ad Creative with Partnership Ad settings
      // Get the Facebook Page ID linked to the Instagram Business Account
      // We need to fetch this from the Meta API since it's not stored
      const pageIdResponse = await fetch(
        `${FACEBOOK_GRAPH_BASE_URL}/${brandIgAccount.instagramUserId}?fields=connected_ig_page&access_token=${accessToken}`
      );
      const pageIdData = await pageIdResponse.json();
      const facebookPageId = pageIdData.connected_ig_page?.id || brandIgAccount.facebookUserId;

      const creativeBody = {
        name: `Partnership Creative - ${partner.instagramUsername}`,
        instagram_actor_id: displayHandle === "creator_only" 
          ? partner.instagramUserId 
          : brandIgAccount.instagramUserId,
        // For Partnership Ads, we use the creator's Instagram media
        object_story_spec: {
          page_id: facebookPageId, // Facebook page linked to IG Business
          instagram_actor_id: partner.instagramUserId, // Creator's IG account
        },
        instagram_user_id: partner.instagramUserId,
        source_instagram_media_id: instagramMediaId,
        branded_content_sponsor_page_id: facebookPageId, // Brand as sponsor
        access_token: accessToken,
      };

      const creativeResponse = await fetch(`${FACEBOOK_GRAPH_BASE_URL}/act_${adAccountId}/adcreatives`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(creativeBody),
      });

      const creativeData = await creativeResponse.json();
      if (creativeData.error) {
        console.error("[Create Partnership Ad] Creative error:", creativeData.error);
        return res.status(400).json({ 
          error: creativeData.error.message,
          details: "Partnership Ads require creator authorization and proper account linking.",
        });
      }

      // Step 4: Create Ad
      const adResponse = await fetch(`${FACEBOOK_GRAPH_BASE_URL}/act_${adAccountId}/ads`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          name: `Partnership Ad - ${partner.instagramUsername}`,
          adset_id: adSetData.id,
          creative: JSON.stringify({ creative_id: creativeData.id }),
          status: "PAUSED",
          access_token: accessToken,
        }),
      });

      const adData = await adResponse.json();
      if (adData.error) {
        console.error("[Create Partnership Ad] Ad error:", adData.error);
        return res.status(400).json({ error: adData.error.message });
      }

      res.json({
        success: true,
        message: "Partnership Ad created successfully!",
        campaignId: metaCampaignId,
        adSetId: adSetData.id,
        creativeId: creativeData.id,
        adId: adData.id,
        status: "paused",
        nextSteps: [
          "Review ad in Meta Ads Manager",
          "Set final budget and schedule",
          "Activate campaign when ready",
        ],
      });
    } catch (error) {
      console.error("[Create Partnership Ad] Error:", error);
      res.status(500).json({ error: "Failed to create Partnership Ad" });
    }
  });

  // Get custom audiences for targeting
  app.get("/api/meta-marketing/audiences", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const companyId = req.session.activeCompanyId;
    if (!companyId) {
      return res.status(400).json({ error: "No active company" });
    }

    try {
      const selected = await getSelectedAdAccount(companyId);
      if (!selected) {
        return res.status(404).json({ error: "No ad account selected" });
      }

      const { metaAccount, adAccount } = selected;
      const accessToken = metaAccount.accessToken;
      const adAccountId = adAccount.adAccountId;

      // Get custom audiences
      const audiencesUrl = `${FACEBOOK_GRAPH_BASE_URL}/act_${adAccountId}/customaudiences?fields=id,name,subtype,approximate_count,data_source&limit=100&access_token=${accessToken}`;
      
      const audiencesResponse = await fetch(audiencesUrl);
      const audiencesData = await audiencesResponse.json();

      if (audiencesData.error) {
        console.error("[Audiences] Meta API Error:", audiencesData.error);
        return res.status(400).json({ error: audiencesData.error.message });
      }

      // Separate custom and lookalike audiences
      const customAudiences = (audiencesData.data || []).filter((a: any) => 
        a.subtype !== "LOOKALIKE"
      );
      const lookalikeAudiences = (audiencesData.data || []).filter((a: any) => 
        a.subtype === "LOOKALIKE"
      );

      res.json({
        customAudiences,
        lookalikeAudiences,
        total: audiencesData.data?.length || 0,
      });
    } catch (error) {
      console.error("[Audiences] Error:", error);
      res.status(500).json({ error: "Failed to fetch audiences" });
    }
  });

  // Get Partnership Ads performance metrics
  app.get("/api/meta-marketing/partnership-performance", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const companyId = req.session.activeCompanyId;
    if (!companyId) {
      return res.status(400).json({ error: "No active company" });
    }

    const datePreset = (req.query.datePreset as string) || "last_30d";

    try {
      const selected = await getSelectedAdAccount(companyId);
      if (!selected) {
        return res.status(404).json({ error: "No ad account selected" });
      }

      const { metaAccount, adAccount } = selected;
      const accessToken = metaAccount.accessToken;
      const adAccountId = adAccount.adAccountId;

      // Get all ads with branded content (Partnership Ads)
      const adsUrl = `${FACEBOOK_GRAPH_BASE_URL}/act_${adAccountId}/ads?fields=id,name,status,effective_status,creative{id,name,branded_content_sponsor_page_id,instagram_actor_id},insights.date_preset(${datePreset}){impressions,reach,clicks,spend,ctr,cpc,actions,action_values,purchase_roas}&filtering=[{"field":"effective_status","operator":"IN","value":["ACTIVE","PAUSED","PENDING_REVIEW","CAMPAIGN_PAUSED","ADSET_PAUSED"]}]&limit=100&access_token=${accessToken}`;
      
      const adsResponse = await fetch(adsUrl);
      const adsData = await adsResponse.json();

      if (adsData.error) {
        console.error("[Partnership Performance] Meta API Error:", adsData.error);
        return res.status(400).json({ error: adsData.error.message });
      }

      // Filter for true Partnership Ads
      const partnershipAds = (adsData.data || []).filter((ad: any) => 
        ad.creative?.branded_content_sponsor_page_id != null
      );

      // Calculate aggregated metrics
      let totalImpressions = 0;
      let totalReach = 0;
      let totalClicks = 0;
      let totalSpend = 0;
      let totalPurchases = 0;
      let totalRevenue = 0;

      const adMetrics = partnershipAds.map((ad: any) => {
        const insights = ad.insights?.data?.[0] || {};
        const impressions = parseInt(insights.impressions || "0");
        const reach = parseInt(insights.reach || "0");
        const clicks = parseInt(insights.clicks || "0");
        const spend = parseFloat(insights.spend || "0");
        
        // Get purchases and revenue from actions
        const purchases = (insights.actions || [])
          .find((a: any) => a.action_type === "purchase")?.value || 0;
        const revenue = (insights.action_values || [])
          .find((a: any) => a.action_type === "purchase")?.value || 0;

        totalImpressions += impressions;
        totalReach += reach;
        totalClicks += clicks;
        totalSpend += spend;
        totalPurchases += parseInt(purchases);
        totalRevenue += parseFloat(revenue);

        return {
          id: ad.id,
          name: ad.name,
          status: ad.effective_status,
          impressions,
          reach,
          clicks,
          spend: spend.toFixed(2),
          ctr: insights.ctr || "0",
          cpc: insights.cpc || "0",
          purchases: parseInt(purchases),
          revenue: parseFloat(revenue).toFixed(2),
          roas: spend > 0 ? (parseFloat(revenue) / spend).toFixed(2) : "0.00",
        };
      });

      const overallRoas = totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(2) : "0.00";
      const overallCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0.00";

      res.json({
        summary: {
          totalAds: partnershipAds.length,
          activeAds: partnershipAds.filter((a: any) => a.effective_status === "ACTIVE").length,
          impressions: totalImpressions,
          reach: totalReach,
          clicks: totalClicks,
          spend: totalSpend.toFixed(2),
          ctr: overallCtr,
          purchases: totalPurchases,
          revenue: totalRevenue.toFixed(2),
          roas: overallRoas,
        },
        ads: adMetrics,
        datePreset,
        currency: adAccount.currency || "BRL",
      });
    } catch (error) {
      console.error("[Partnership Performance] Error:", error);
      res.status(500).json({ error: "Failed to fetch performance metrics" });
    }
  });

  console.log("[Routes] Meta Marketing routes registered");
}

async function fetchAllPaginatedData(initialUrl: string): Promise<any[]> {
  const allData: any[] = [];
  let nextUrl: string | null = initialUrl;
  
  while (nextUrl) {
    const res = await fetch(nextUrl);
    const json = await res.json() as any;
    
    if (json.error) {
      console.error("[Meta Marketing] Pagination error:", json.error);
      break;
    }
    
    if (json.data) {
      allData.push(...json.data);
    }
    
    nextUrl = json.paging?.next || null;
  }
  
  return allData;
}

async function syncBusinessManagersAndAdAccounts(metaAccountId: number, accessToken: string) {
  try {
    const allBusinesses = await fetchAllPaginatedData(
      `${FACEBOOK_GRAPH_BASE_URL}/me/businesses?fields=id,name&limit=500&access_token=${accessToken}`
    );

    if (allBusinesses.length > 0) {
      await db.delete(metaBusinessManagers)
        .where(eq(metaBusinessManagers.metaAdAccountId, metaAccountId));

      for (const biz of allBusinesses) {
        await db.insert(metaBusinessManagers).values({
          metaAdAccountId: metaAccountId,
          businessId: biz.id,
          businessName: biz.name,
        });
      }
      console.log(`[Meta Marketing] Synced ${allBusinesses.length} business managers (with pagination)`);
    }

    const allAdAccounts = await fetchAllPaginatedData(
      `${FACEBOOK_GRAPH_BASE_URL}/me/adaccounts?fields=id,name,currency,timezone_name,business{id,name}&limit=500&access_token=${accessToken}`
    );

    if (allAdAccounts.length > 0) {
      await db.delete(metaAdAccountsList)
        .where(eq(metaAdAccountsList.metaAdAccountId, metaAccountId));

      for (const acc of allAdAccounts) {
        await db.insert(metaAdAccountsList).values({
          metaAdAccountId: metaAccountId,
          adAccountId: acc.id.replace("act_", ""),
          adAccountName: acc.name,
          currency: acc.currency,
          timezone: acc.timezone_name,
          businessId: acc.business?.id,
        });
      }
      console.log(`[Meta Marketing] Synced ${allAdAccounts.length} ad accounts (with pagination)`);
    }

  } catch (error) {
    console.error("[Meta Marketing] Sync error:", error);
    throw error;
  }
}

// ============================================
// CREATOR INVITATION LINKS
// ============================================

export function registerCreatorInvitationRoutes(app: Express) {
  
  // Generate invitation link for a creator
  app.post("/api/partnership/invitations", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const companyId = req.session.activeCompanyId;
    if (!companyId) {
      return res.status(400).json({ error: "No active company" });
    }

    try {
      // Validate input with Zod
      const invitationSchema = z.object({
        instagramUsername: z.string().max(30).optional(),
        email: z.string().email().optional(),
      });
      
      const parseResult = invitationSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid input", details: parseResult.error.errors });
      }
      
      const { instagramUsername, email } = parseResult.data;

      // Generate secure token
      const token = crypto.randomBytes(32).toString("hex");
      
      // Set expiration to 7 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Create invitation link
      const [invitation] = await db.insert(creatorAuthLinks).values({
        companyId,
        token,
        instagramUsername: instagramUsername || null,
        email: email || null,
        expiresAt,
        redirectUrl: "/partnership/success",
      }).returning();

      // Build the invitation URL - always use production URL for invitations
      const baseUrl = PRODUCTION_URL;

      const invitationUrl = `${baseUrl}/partnership/${token}`;

      res.json({
        success: true,
        invitation: {
          id: invitation.id,
          token: invitation.token,
          url: invitationUrl,
          expiresAt: invitation.expiresAt,
          instagramUsername: invitation.instagramUsername,
        },
      });
    } catch (error) {
      console.error("[Partnership Invitation] Error creating invitation:", error);
      res.status(500).json({ error: "Failed to create invitation" });
    }
  });

  // Get all invitation links for a company
  app.get("/api/partnership/invitations", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const companyId = req.session.activeCompanyId;
    if (!companyId) {
      return res.status(400).json({ error: "No active company" });
    }

    try {
      const invitations = await db.select().from(creatorAuthLinks)
        .where(eq(creatorAuthLinks.companyId, companyId))
        .orderBy(desc(creatorAuthLinks.createdAt));

      // Always use production URL for invitation links
      const invitationsWithUrls = invitations.map(inv => ({
        ...inv,
        url: `${PRODUCTION_URL}/partnership/${inv.token}`,
        isExpired: new Date(inv.expiresAt) < new Date(),
      }));

      res.json({ invitations: invitationsWithUrls });
    } catch (error) {
      console.error("[Partnership Invitation] Error fetching invitations:", error);
      res.status(500).json({ error: "Failed to fetch invitations" });
    }
  });

  // Public: Get invitation details by token (for landing page)
  app.get("/api/partnership/invite/:token", async (req: Request, res: Response) => {
    try {
      const { token } = req.params;

      const [invitation] = await db.select().from(creatorAuthLinks)
        .where(eq(creatorAuthLinks.token, token));

      if (!invitation) {
        return res.status(404).json({ error: "Invitation not found" });
      }

      // Check if expired
      if (new Date(invitation.expiresAt) < new Date()) {
        return res.status(410).json({ error: "Invitation expired" });
      }

      // Check if already used
      if (invitation.isUsed) {
        return res.status(410).json({ error: "Invitation already used" });
      }

      // Get company info
      const [company] = await db.select({
        id: companies.id,
        name: companies.name,
        logo: companies.logo,
      }).from(companies)
        .where(eq(companies.id, invitation.companyId));

      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }

      res.json({
        invitation: {
          token: invitation.token,
          expiresAt: invitation.expiresAt,
        },
        company: {
          id: company.id,
          name: company.name,
          logo: company.logo,
        },
      });
    } catch (error) {
      console.error("[Partnership Invitation] Error fetching invitation:", error);
      res.status(500).json({ error: "Failed to fetch invitation" });
    }
  });

  // Start OAuth flow for creator authorization
  app.get("/api/partnership/auth/:token", async (req: Request, res: Response) => {
    try {
      const { token } = req.params;

      // Validate invitation
      const [invitation] = await db.select().from(creatorAuthLinks)
        .where(eq(creatorAuthLinks.token, token));

      if (!invitation) {
        return res.redirect("/partnership/error?reason=not_found");
      }

      if (new Date(invitation.expiresAt) < new Date()) {
        return res.redirect("/partnership/error?reason=expired");
      }

      if (invitation.isUsed) {
        return res.redirect("/partnership/error?reason=used");
      }

      // Generate CSRF nonce and store in session
      const nonce = crypto.randomBytes(16).toString("hex");
      req.session.partnershipToken = token;
      req.session.partnershipNonce = nonce;

      // Build OAuth URL for Instagram Basic Display + Business
      const redirectUri = getPartnershipRedirectUri(req);
      
      // Request partnership_ads permission
      const scopes = [
        "instagram_basic",
        "instagram_manage_comments",
        "instagram_manage_insights",
        "instagram_manage_messages",
        "instagram_content_publish",
        "pages_show_list",
        "pages_read_engagement",
        "business_management",
        "public_profile",
      ].join(",");

      // State includes both token and nonce for CSRF protection
      const state = `partnership_${token}_${nonce}`;

      const authUrl = `https://www.facebook.com/${FACEBOOK_GRAPH_API_VERSION}/dialog/oauth?` +
        `client_id=${META_APP_ID}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=${scopes}` +
        `&response_type=code` +
        `&state=${state}`;

      res.redirect(authUrl);
    } catch (error) {
      console.error("[Partnership Auth] Error starting OAuth:", error);
      res.redirect("/partnership/error?reason=internal");
    }
  });

  // OAuth callback for creator authorization
  app.get("/api/partnership/callback", async (req: Request, res: Response) => {
    try {
      const { code, state, error: oauthError } = req.query;

      if (oauthError) {
        console.error("[Partnership Callback] OAuth error:", oauthError);
        return res.redirect("/partnership/error?reason=denied");
      }

      if (!code || !state) {
        return res.redirect("/partnership/error?reason=invalid");
      }

      // Extract token and nonce from state
      const stateStr = state as string;
      if (!stateStr.startsWith("partnership_")) {
        return res.redirect("/partnership/error?reason=invalid_state");
      }

      const stateParts = stateStr.replace("partnership_", "").split("_");
      if (stateParts.length !== 2) {
        return res.redirect("/partnership/error?reason=invalid_state");
      }

      const [token, nonce] = stateParts;

      // Validate CSRF nonce from session
      const sessionToken = req.session.partnershipToken;
      const sessionNonce = req.session.partnershipNonce;
      
      if (!sessionToken || !sessionNonce || sessionToken !== token || sessionNonce !== nonce) {
        console.error("[Partnership Callback] CSRF validation failed");
        return res.redirect("/partnership/error?reason=csrf_error");
      }

      // Clear session values to prevent replay
      delete req.session.partnershipToken;
      delete req.session.partnershipNonce;

      // Validate invitation
      const [invitation] = await db.select().from(creatorAuthLinks)
        .where(eq(creatorAuthLinks.token, token));

      if (!invitation || invitation.isUsed) {
        return res.redirect("/partnership/error?reason=invalid_invitation");
      }

      // Exchange code for access token
      const redirectUri = getPartnershipRedirectUri(req);
      const tokenUrl = `${FACEBOOK_GRAPH_BASE_URL}/oauth/access_token?` +
        `client_id=${META_APP_ID}` +
        `&client_secret=${META_APP_SECRET}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&code=${code}`;

      const tokenResponse = await fetch(tokenUrl);
      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        console.error("[Partnership Callback] Token exchange error:", tokenData.error);
        return res.redirect("/partnership/error?reason=token_error");
      }

      const accessToken = tokenData.access_token;

      // Get user's Instagram Business Account
      const pagesUrl = `${FACEBOOK_GRAPH_BASE_URL}/me/accounts?fields=id,name,instagram_business_account{id,username,profile_picture_url}&access_token=${accessToken}`;
      const pagesResponse = await fetch(pagesUrl);
      const pagesData = await pagesResponse.json();

      let instagramAccount = null;

      if (pagesData.data) {
        for (const page of pagesData.data) {
          if (page.instagram_business_account) {
            instagramAccount = page.instagram_business_account;
            break;
          }
        }
      }

      if (!instagramAccount) {
        return res.redirect("/partnership/error?reason=no_instagram");
      }

      // Create or update creator partner record
      const existing = await db.select().from(creatorAdPartners)
        .where(and(
          eq(creatorAdPartners.companyId, invitation.companyId),
          eq(creatorAdPartners.instagramUserId, instagramAccount.id)
        ));

      if (existing.length > 0) {
        // Update existing
        await db.update(creatorAdPartners)
          .set({
            status: "active",
            instagramUsername: instagramAccount.username,
            instagramProfilePic: instagramAccount.profile_picture_url,
            authorizedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(creatorAdPartners.id, existing[0].id));
      } else {
        // Create new partner
        await db.insert(creatorAdPartners).values({
          companyId: invitation.companyId,
          instagramUserId: instagramAccount.id,
          instagramUsername: instagramAccount.username,
          instagramProfilePic: instagramAccount.profile_picture_url,
          status: "active",
          authorizedAt: new Date(),
        });
      }

      // Mark invitation as used
      await db.update(creatorAuthLinks)
        .set({
          isUsed: true,
          usedAt: new Date(),
        })
        .where(eq(creatorAuthLinks.id, invitation.id));

      // Redirect to success page
      res.redirect(`/partnership/success?username=${encodeURIComponent(instagramAccount.username)}`);
    } catch (error) {
      console.error("[Partnership Callback] Error:", error);
      res.redirect("/partnership/error?reason=internal");
    }
  });
}

function getPartnershipRedirectUri(req: Request): string {
  const isProduction = process.env.NODE_ENV === "production" || 
                       process.env.REPLIT_DEPLOYMENT === "1";
  
  if (isProduction) {
    return `${PRODUCTION_URL}/api/partnership/callback`;
  }
  
  const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  
  if (!host) {
    return `${PRODUCTION_URL}/api/partnership/callback`;
  }
  
  return `${protocol}://${host}/api/partnership/callback`;
}
