import type { Express } from "express";
import { registerMessagingRoutes } from "./messaging.routes";
import { registerUserRoutes } from "./user.routes";
import { registerCampaignRoutes } from "./campaign.routes";
import { registerInstagramRoutes } from "./instagram.routes";
import { registerMetaMarketingRoutes, registerCreatorInvitationRoutes } from "./meta-marketing.routes";
import apifyRoutes from "./apify.routes";
import enrichmentRoutes from "./enrichment.routes";
import stripeRoutes from "./stripe.routes";
import { registerBlogRoutes } from "./blog.routes";
import { registerHashtagRoutes } from "./hashtag.routes";
import { registerCommentsRoutes } from "./comments.routes";
import { registerPublishingRoutes } from "./publishing.routes";

export function registerModularRoutes(app: Express): void {
  registerUserRoutes(app);
  registerCampaignRoutes(app);
  registerMessagingRoutes(app);
  registerInstagramRoutes(app);
  registerMetaMarketingRoutes(app);
  registerCreatorInvitationRoutes(app);
  registerBlogRoutes(app);
  registerHashtagRoutes(app);
  registerCommentsRoutes(app);
  registerPublishingRoutes(app);
  
  app.use('/api/apify', apifyRoutes);
  app.use('/api/enrich', enrichmentRoutes);
  app.use('/api/stripe', stripeRoutes);
  
  console.log("[Routes] Modular routes loaded");
  console.log("[Routes] Stripe routes registered");
}
