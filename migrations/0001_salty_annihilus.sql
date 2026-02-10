ALTER TABLE "campaign_templates" ADD COLUMN "target_regions" text[];--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "target_regions" text[];--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "website" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "instagram" text;