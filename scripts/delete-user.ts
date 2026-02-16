import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

const EMAIL = "PARTNERSTURBO@GMAIL.COM";

async function main() {
  console.log(`\n=== Deletando usuário ${EMAIL} e sua empresa ===\n`);

  // Find user
  const userResult = await db.execute(sql`SELECT id, name, role FROM core.users WHERE email = ${EMAIL}`);
  const user = (userResult as any).rows?.[0];
  if (!user) { console.log("Usuário não encontrado!"); process.exit(1); }
  const uid = user.id;
  console.log(`Usuário: id=${uid}, name=${user.name}, role=${user.role}`);

  // Find companies
  const compResult = await db.execute(sql`SELECT company_id FROM company.company_members WHERE user_id = ${uid}`);
  const companyIds: number[] = (compResult as any).rows?.map((r: any) => r.company_id) || [];
  console.log(`Empresas: [${companyIds.join(", ")}]`);

  // Find campaigns
  let campaignIds: number[] = [];
  for (const cid of companyIds) {
    const r = await db.execute(sql`SELECT id FROM campaign.campaigns WHERE company_id = ${cid}`);
    campaignIds.push(...((r as any).rows?.map((r: any) => r.id) || []));
  }
  console.log(`Campanhas: ${campaignIds.length}`);

  const del = async (q: string, name: string) => {
    try {
      const r = await db.execute(sql.raw(q));
      const c = (r as any).rowCount ?? 0;
      if (c > 0) console.log(`  ✓ ${name}: ${c} rows`);
    } catch (e: any) {
      if (e.message?.includes("does not exist")) return;
      console.log(`  ✗ ${name}: ${e.message?.slice(0, 120)}`);
    }
  };

  // =============================================
  // 1. CAMPAIGN DATA
  // =============================================
  if (campaignIds.length > 0) {
    const cids = campaignIds.join(",");
    console.log("\n--- Campanhas ---");
    await del(`DELETE FROM campaign.deliverable_comments WHERE deliverable_id IN (SELECT id FROM campaign.deliverables WHERE application_id IN (SELECT id FROM campaign.applications WHERE campaign_id IN (${cids})))`, "deliverable_comments");
    await del(`DELETE FROM campaign.deliverables WHERE application_id IN (SELECT id FROM campaign.applications WHERE campaign_id IN (${cids}))`, "deliverables");
    await del(`DELETE FROM campaign.applications WHERE campaign_id IN (${cids})`, "applications");
    await del(`DELETE FROM campaign.campaign_invites WHERE campaign_id IN (${cids})`, "campaign_invites");
    await del(`DELETE FROM campaign.campaign_hashtags WHERE campaign_id IN (${cids})`, "campaign_hashtags");
    await del(`DELETE FROM campaign.campaign_coupons WHERE campaign_id IN (${cids})`, "campaign_coupons");
    await del(`DELETE FROM content.campaign_inspirations WHERE campaign_id IN (${cids})`, "campaign_inspirations");
    await del(`DELETE FROM campaign.campaign_prizes WHERE campaign_id IN (${cids})`, "campaign_prizes");
    await del(`DELETE FROM campaign.campaign_creator_stats WHERE campaign_id IN (${cids})`, "campaign_creator_stats");
    await del(`DELETE FROM analytics.campaign_metric_snapshots WHERE campaign_id IN (${cids})`, "campaign_metric_snapshots");
    await del(`DELETE FROM campaign.campaign_points_rules WHERE campaign_id IN (${cids})`, "campaign_points_rules");
    await del(`DELETE FROM campaign.campaign_tags WHERE campaign_id IN (${cids})`, "campaign_tags");
    await del(`DELETE FROM campaign.campaigns WHERE id IN (${cids})`, "campaigns");
  }

  // =============================================
  // 2. COMPANY DATA
  // =============================================
  for (const cid of companyIds) {
    console.log(`\n--- Empresa ${cid} ---`);

    // campaign.* schema
    await del(`DELETE FROM campaign.campaign_templates WHERE company_id = ${cid}`, "campaign_templates");

    // misc.* schema
    await del(`DELETE FROM misc.favorite_creators WHERE company_id = ${cid}`, "favorite_creators");
    await del(`DELETE FROM misc.favorite_companies WHERE company_id = ${cid}`, "favorite_companies");
    await del(`DELETE FROM misc.hashtag_posts WHERE company_id = ${cid}`, "hashtag_posts");
    await del(`DELETE FROM misc.hashtag_searches WHERE company_id = ${cid}`, "hashtag_searches");
    await del(`DELETE FROM misc.community_invites WHERE company_id = ${cid}`, "community_invites");
    await del(`DELETE FROM misc.contact_notes WHERE company_id = ${cid}`, "contact_notes");
    await del(`DELETE FROM misc.workflow_stages WHERE brand_id = ${cid}`, "workflow_stages");
    await del(`DELETE FROM misc.post_ai_insights WHERE user_id IN (SELECT user_id FROM company.company_members WHERE company_id = ${cid})`, "post_ai_insights");

    // billing.* schema
    await del(`DELETE FROM billing.sales_tracking WHERE company_id = ${cid}`, "sales_tracking");
    await del(`DELETE FROM billing.creator_commissions WHERE company_id = ${cid}`, "creator_commissions");
    await del(`DELETE FROM billing.wallet_transactions WHERE company_id = ${cid}`, "wallet_transactions");
    await del(`DELETE FROM billing.wallet_boxes WHERE company_id = ${cid}`, "wallet_boxes");
    await del(`DELETE FROM billing.company_wallets WHERE company_id = ${cid}`, "company_wallets");
    await del(`DELETE FROM billing.payment_batches WHERE company_id = ${cid}`, "payment_batches");

    // gamification.* schema
    await del(`DELETE FROM gamification.points_ledger WHERE company_id = ${cid}`, "points_ledger");
    await del(`DELETE FROM gamification.reward_entitlements WHERE company_id = ${cid}`, "reward_entitlements");
    await del(`DELETE FROM gamification.brand_programs WHERE company_id = ${cid}`, "brand_programs");
    await del(`DELETE FROM gamification.brand_rewards WHERE company_id = ${cid}`, "brand_rewards");
    await del(`DELETE FROM gamification.brand_tier_configs WHERE company_id = ${cid}`, "brand_tier_configs");

    // brand.* schema
    await del(`DELETE FROM brand.brand_creator_tiers WHERE company_id = ${cid}`, "brand_creator_tiers");
    await del(`DELETE FROM brand.brand_creator_memberships WHERE company_id = ${cid}`, "brand_creator_memberships");
    await del(`DELETE FROM brand.brand_settings WHERE brand_id = ${cid}`, "brand_settings");
    await del(`DELETE FROM brand.brand_tags WHERE brand_id = ${cid}`, "brand_tags");

    // content.* schema
    await del(`DELETE FROM content.creator_saved_inspirations WHERE inspiration_id IN (SELECT id FROM content.inspirations WHERE brand_id = ${cid})`, "creator_saved_inspirations (brand)");
    await del(`DELETE FROM content.campaign_inspirations WHERE campaign_id IN (SELECT id FROM campaign.campaigns WHERE company_id = ${cid})`, "campaign_inspirations");
    await del(`DELETE FROM content.inspirations WHERE brand_id = ${cid}`, "inspirations");

    // messaging.* schema
    await del(`DELETE FROM messaging.message_reads WHERE conversation_id IN (SELECT id FROM messaging.conversations WHERE company_id = ${cid})`, "message_reads");
    await del(`DELETE FROM messaging.conv_messages WHERE conversation_id IN (SELECT id FROM messaging.conversations WHERE company_id = ${cid})`, "conv_messages");
    await del(`DELETE FROM messaging.conversations WHERE company_id = ${cid}`, "conversations");

    // creator.* schema (company-related)
    await del(`DELETE FROM creator.creator_discovery_profiles WHERE company_id = ${cid}`, "creator_discovery_profiles");
    await del(`DELETE FROM creator.creator_auth_links WHERE company_id = ${cid}`, "creator_auth_links");
    await del(`DELETE FROM creator.creator_ad_partners WHERE company_id = ${cid}`, "creator_ad_partners");

    // social.* schema
    await del(`DELETE FROM social.dm_send_logs WHERE company_id = ${cid}`, "dm_send_logs");
    await del(`DELETE FROM social.dm_templates WHERE company_id = ${cid}`, "dm_templates");
    await del(`DELETE FROM social.instagram_interactions WHERE company_id = ${cid}`, "instagram_interactions");
    await del(`DELETE FROM social.instagram_contacts WHERE company_id = ${cid}`, "instagram_contacts");
    await del(`DELETE FROM social.instagram_messages WHERE company_id = ${cid}`, "instagram_messages");
    await del(`DELETE FROM social.instagram_tagged_posts WHERE company_id = ${cid}`, "instagram_tagged_posts");
    await del(`DELETE FROM social.instagram_posts WHERE company_id = ${cid}`, "instagram_posts");
    await del(`DELETE FROM social.instagram_profiles WHERE company_id = ${cid}`, "instagram_profiles");
    await del(`DELETE FROM social.instagram_accounts WHERE company_id = ${cid}`, "instagram_accounts");
    await del(`DELETE FROM social.meta_ad_accounts_list WHERE company_id = ${cid}`, "meta_ad_accounts_list");
    await del(`DELETE FROM social.meta_ad_accounts WHERE company_id = ${cid}`, "meta_ad_accounts");
    await del(`DELETE FROM social.meta_business_managers WHERE company_id = ${cid}`, "meta_business_managers");
    await del(`DELETE FROM social.tiktok_profiles WHERE company_id = ${cid}`, "tiktok_profiles");
    await del(`DELETE FROM social.tiktok_videos WHERE company_id = ${cid}`, "tiktok_videos");

    // system.* schema
    await del(`DELETE FROM system.integration_logs WHERE company_id = ${cid}`, "integration_logs");
    await del(`DELETE FROM system.data_source_registry WHERE company_id = ${cid}`, "data_source_registry");
    await del(`DELETE FROM system.notifications WHERE user_id IN (SELECT user_id FROM company.company_members WHERE company_id = ${cid})`, "notifications (company users)");

    // company.* schema
    await del(`DELETE FROM company.company_user_invites WHERE company_id = ${cid}`, "company_user_invites");
    await del(`DELETE FROM company.company_members WHERE company_id = ${cid}`, "company_members");
    await del(`DELETE FROM company.companies WHERE id = ${cid}`, "company");
  }

  // =============================================
  // 3. USER DATA
  // =============================================
  console.log(`\n--- Usuário ${uid} ---`);
  await del(`DELETE FROM system.notifications WHERE user_id = ${uid}`, "notifications");
  await del(`DELETE FROM misc.problem_reports WHERE user_id = ${uid}`, "problem_reports");
  await del(`DELETE FROM creator.creator_posts WHERE user_id = ${uid}`, "creator_posts");
  await del(`DELETE FROM analytics.creator_analytics_history WHERE user_id = ${uid}`, "creator_analytics_history");
  await del(`DELETE FROM creator.creator_hashtags WHERE user_id = ${uid}`, "creator_hashtags");
  await del(`DELETE FROM gamification.creator_points WHERE creator_id = ${uid}`, "creator_points");
  await del(`DELETE FROM gamification.creator_badges WHERE creator_id = ${uid}`, "creator_badges");
  await del(`DELETE FROM gamification.creator_levels WHERE creator_id = ${uid}`, "creator_levels");
  await del(`DELETE FROM creator.creator_addresses WHERE user_id = ${uid}`, "creator_addresses");
  await del(`DELETE FROM content.creator_saved_inspirations WHERE creator_id = ${uid}`, "creator_saved_inspirations");
  await del(`DELETE FROM academy.creator_course_progress WHERE creator_id = ${uid}`, "creator_course_progress");
  await del(`DELETE FROM academy.creator_lesson_progress WHERE creator_id = ${uid}`, "creator_lesson_progress");
  await del(`DELETE FROM analytics.profile_snapshots WHERE user_id = ${uid}`, "profile_snapshots");
  await del(`DELETE FROM billing.creator_balances WHERE creator_id = ${uid}`, "creator_balances");
  await del(`DELETE FROM creator.creator_tags WHERE creator_id = ${uid}`, "creator_tags");
  await del(`DELETE FROM messaging.message_reads WHERE user_id = ${uid}`, "message_reads");
  await del(`DELETE FROM messaging.conv_messages WHERE sender_user_id = ${uid}`, "conv_messages");

  // Sessions
  await del(`DELETE FROM system.session WHERE sess::text LIKE '%"passport":{"user":${uid}}%'`, "sessions");

  // User
  await del(`DELETE FROM core.users WHERE id = ${uid}`, "user");

  console.log(`\n=== Concluído! Usuário ${EMAIL} (id=${uid}) e empresas [${companyIds.join(", ")}] deletados ===\n`);
  process.exit(0);
}

main().catch(e => { console.error("ERRO:", e); process.exit(1); });
