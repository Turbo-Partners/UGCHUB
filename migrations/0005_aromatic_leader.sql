CREATE TABLE "analytics_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"report_type" text NOT NULL,
	"title" text NOT NULL,
	"filters" jsonb,
	"data" jsonb,
	"format" text DEFAULT 'pdf' NOT NULL,
	"file_url" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "badges" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon" text NOT NULL,
	"color" text,
	"requirement" text NOT NULL,
	"required_value" integer,
	"is_secret" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"type" text DEFAULT 'article' NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text NOT NULL,
	"content" text NOT NULL,
	"image" text,
	"author" text NOT NULL,
	"author_avatar" text,
	"read_time" text,
	"featured" boolean DEFAULT false NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"meta_title" text,
	"meta_description" text,
	"meta_keywords" text[],
	"canonical_url" text,
	"og_image" text,
	"structured_data" jsonb,
	"company" text,
	"metric_value" text,
	"metric_label" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "brand_creator_tiers" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"creator_id" integer NOT NULL,
	"tier_id" integer,
	"total_brand_points" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "brand_creator_tiers_company_id_creator_id_unique" UNIQUE("company_id","creator_id")
);
--> statement-breakpoint
CREATE TABLE "brand_mentions" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"campaign_id" integer,
	"creator_id" integer,
	"application_id" integer,
	"platform" text NOT NULL,
	"post_url" text NOT NULL,
	"author_username" text,
	"author_followers" integer,
	"content" text,
	"caption" text,
	"mention_type" text DEFAULT 'manual',
	"hashtags" text[],
	"likes" integer DEFAULT 0,
	"comments" integer DEFAULT 0,
	"shares" integer DEFAULT 0,
	"views" integer DEFAULT 0,
	"reach" integer,
	"engagement" integer,
	"post_type" text,
	"thumbnail_url" text,
	"is_verified" boolean DEFAULT false,
	"posted_at" timestamp,
	"detected_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "brand_scoring_defaults" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"rules_json" jsonb,
	"caps_json" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "brand_scoring_defaults_company_id_unique" UNIQUE("company_id")
);
--> statement-breakpoint
CREATE TABLE "brand_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"slug" text NOT NULL,
	"logo_url" text,
	"primary_color" text DEFAULT '#6366f1',
	"secondary_color" text DEFAULT '#8b5cf6',
	"background_color" text DEFAULT '#ffffff',
	"text_color" text DEFAULT '#1f2937',
	"accent_color" text DEFAULT '#10b981',
	"brand_name" text NOT NULL,
	"tagline" text,
	"description" text,
	"welcome_message" text,
	"terms_and_conditions" text,
	"privacy_policy" text,
	"is_active" boolean DEFAULT true,
	"requires_approval" boolean DEFAULT true,
	"default_campaign_id" integer,
	"collect_social_profiles" boolean DEFAULT true,
	"collect_shipping_address" boolean DEFAULT true,
	"collect_payment_info" boolean DEFAULT true,
	"collect_clothing_size" boolean DEFAULT false,
	"collect_content_preferences" boolean DEFAULT false,
	"custom_fields" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "brand_settings_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "brand_tier_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"tier_name" text NOT NULL,
	"min_points" integer DEFAULT 0 NOT NULL,
	"color" text,
	"icon" text,
	"benefits_json" jsonb,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_coupons" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"creator_id" integer,
	"code" text NOT NULL,
	"discount_type" text NOT NULL,
	"discount_value" integer NOT NULL,
	"max_uses" integer,
	"current_uses" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "campaign_coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "campaign_creator_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"creator_id" integer NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"rank" integer,
	"deliverables_completed" integer DEFAULT 0 NOT NULL,
	"deliverables_on_time" integer DEFAULT 0 NOT NULL,
	"total_views" integer DEFAULT 0 NOT NULL,
	"total_engagement" integer DEFAULT 0 NOT NULL,
	"total_sales" integer DEFAULT 0 NOT NULL,
	"quality_score" integer,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "campaign_creator_stats_campaign_id_creator_id_unique" UNIQUE("campaign_id","creator_id")
);
--> statement-breakpoint
CREATE TABLE "campaign_gamification_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"mode" text DEFAULT 'ranking' NOT NULL,
	"rules_json" jsonb,
	"caps_json" jsonb,
	"window_start" timestamp,
	"window_end" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "campaign_gamification_configs_campaign_id_unique" UNIQUE("campaign_id")
);
--> statement-breakpoint
CREATE TABLE "campaign_goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"creator_id" integer,
	"goal_type" text NOT NULL,
	"target_value" integer NOT NULL,
	"current_value" integer DEFAULT 0 NOT NULL,
	"bonus_points" integer DEFAULT 0 NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "campaign_metric_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"creator_id" integer NOT NULL,
	"post_id" text NOT NULL,
	"platform" text NOT NULL,
	"post_url" text,
	"views" integer DEFAULT 0 NOT NULL,
	"likes" integer DEFAULT 0 NOT NULL,
	"comments" integer DEFAULT 0 NOT NULL,
	"last_awarded_views" integer DEFAULT 0 NOT NULL,
	"last_awarded_likes" integer DEFAULT 0 NOT NULL,
	"last_awarded_comments" integer DEFAULT 0 NOT NULL,
	"update_count" integer DEFAULT 0 NOT NULL,
	"sum_views_deltas" integer DEFAULT 0 NOT NULL,
	"sum_likes_deltas" integer DEFAULT 0 NOT NULL,
	"sum_comments_deltas" integer DEFAULT 0 NOT NULL,
	"total_points_awarded" integer DEFAULT 0 NOT NULL,
	"points_awarded_today" integer DEFAULT 0 NOT NULL,
	"last_points_date" timestamp,
	"flagged_for_review" boolean DEFAULT false NOT NULL,
	"flag_reason" text,
	"posted_at" timestamp,
	"last_snapshot_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "campaign_metric_snapshots_campaign_id_post_id_platform_unique" UNIQUE("campaign_id","post_id","platform")
);
--> statement-breakpoint
CREATE TABLE "campaign_prizes" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"type" text NOT NULL,
	"rank_position" integer,
	"milestone_points" integer,
	"reward_kind" text NOT NULL,
	"cash_amount" integer,
	"product_sku" text,
	"product_description" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_roi" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"company_id" integer NOT NULL,
	"total_spent" integer DEFAULT 0 NOT NULL,
	"total_reach" integer DEFAULT 0 NOT NULL,
	"total_engagement" integer DEFAULT 0 NOT NULL,
	"total_clicks" integer DEFAULT 0 NOT NULL,
	"total_conversions" integer DEFAULT 0 NOT NULL,
	"cost_per_engagement_cents" integer,
	"cost_per_click_cents" integer,
	"cost_per_conversion_cents" integer,
	"roi_percentage" integer,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "company_wallets" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"reserved_balance" integer DEFAULT 0 NOT NULL,
	"billing_cycle_start" timestamp,
	"billing_cycle_end" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "company_wallets_company_id_unique" UNIQUE("company_id")
);
--> statement-breakpoint
CREATE TABLE "competition_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"competition_id" integer NOT NULL,
	"creator_id" integer NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"rank" integer,
	"joined_at" timestamp DEFAULT now(),
	CONSTRAINT "competition_participants_competition_id_creator_id_unique" UNIQUE("competition_id","creator_id")
);
--> statement-breakpoint
CREATE TABLE "competitions" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"theme" text,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"prizes" jsonb,
	"rules" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "coupon_usage" (
	"id" serial PRIMARY KEY NOT NULL,
	"coupon_id" integer NOT NULL,
	"order_id" text,
	"order_value" integer,
	"discount_applied" integer,
	"customer_email" text,
	"platform" text,
	"used_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "creator_analytics_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"platform" text NOT NULL,
	"followers" integer,
	"following" integer,
	"posts" integer,
	"engagement_rate" text,
	"avg_likes" integer,
	"avg_comments" integer,
	"avg_views" integer,
	"recorded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creator_badges" (
	"id" serial PRIMARY KEY NOT NULL,
	"creator_id" integer NOT NULL,
	"badge_id" integer NOT NULL,
	"earned_at" timestamp DEFAULT now(),
	CONSTRAINT "creator_badges_creator_id_badge_id_unique" UNIQUE("creator_id","badge_id")
);
--> statement-breakpoint
CREATE TABLE "creator_balances" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"available_balance" integer DEFAULT 0 NOT NULL,
	"pending_balance" integer DEFAULT 0 NOT NULL,
	"pix_key" text,
	"pix_key_type" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "creator_balances_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "creator_commissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"creator_id" integer NOT NULL,
	"campaign_id" integer NOT NULL,
	"sales_tracking_id" integer,
	"amount" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "creator_hashtags" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"platform" text NOT NULL,
	"hashtag" text NOT NULL,
	"usage_count" integer DEFAULT 1,
	"avg_engagement" text,
	"last_used" timestamp,
	CONSTRAINT "creator_hashtags_user_id_platform_hashtag_unique" UNIQUE("user_id","platform","hashtag")
);
--> statement-breakpoint
CREATE TABLE "creator_levels" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"min_points" integer NOT NULL,
	"max_points" integer,
	"icon" text,
	"color" text,
	"benefits" text[]
);
--> statement-breakpoint
CREATE TABLE "creator_points" (
	"id" serial PRIMARY KEY NOT NULL,
	"creator_id" integer NOT NULL,
	"points" integer NOT NULL,
	"action" text NOT NULL,
	"category" text DEFAULT 'achievement' NOT NULL,
	"description" text,
	"related_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "creator_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"platform" text NOT NULL,
	"post_id" text NOT NULL,
	"post_url" text NOT NULL,
	"post_type" text,
	"caption" text,
	"thumbnail_url" text,
	"likes" integer DEFAULT 0,
	"comments" integer DEFAULT 0,
	"shares" integer DEFAULT 0,
	"views" integer DEFAULT 0,
	"saves" integer DEFAULT 0,
	"engagement_rate" text,
	"hashtags" text[],
	"mentions" text[],
	"posted_at" timestamp,
	"analyzed_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "creator_posts_user_id_platform_post_id_unique" UNIQUE("user_id","platform","post_id")
);
--> statement-breakpoint
CREATE TABLE "creator_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"campaign_id" integer NOT NULL,
	"creator_id" integer NOT NULL,
	"total_points" integer DEFAULT 0 NOT NULL,
	"rank" integer,
	"last_updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "creator_scores_campaign_id_creator_id_unique" UNIQUE("campaign_id","creator_id")
);
--> statement-breakpoint
CREATE TABLE "creator_total_points" (
	"id" serial PRIMARY KEY NOT NULL,
	"creator_id" integer NOT NULL,
	"total_points" integer DEFAULT 0 NOT NULL,
	"current_level_id" integer,
	"campaigns_completed" integer DEFAULT 0 NOT NULL,
	"on_time_deliveries" integer DEFAULT 0 NOT NULL,
	"total_views" integer DEFAULT 0 NOT NULL,
	"total_sales" integer DEFAULT 0 NOT NULL,
	"total_posts" integer DEFAULT 0 NOT NULL,
	"total_stories" integer DEFAULT 0 NOT NULL,
	"total_reels" integer DEFAULT 0 NOT NULL,
	"total_engagement" integer DEFAULT 0 NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "creator_total_points_creator_id_unique" UNIQUE("creator_id")
);
--> statement-breakpoint
CREATE TABLE "ecommerce_integrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"platform" text NOT NULL,
	"shop_url" text NOT NULL,
	"webhook_secret" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_sync_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "favorite_companies" (
	"id" serial PRIMARY KEY NOT NULL,
	"creator_id" integer NOT NULL,
	"company_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "favorite_companies_creator_id_company_id_unique" UNIQUE("creator_id","company_id")
);
--> statement-breakpoint
CREATE TABLE "feature_flags" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"enabled" boolean DEFAULT false NOT NULL,
	"module" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "feature_flags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "hashtag_tracking" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"campaign_id" integer,
	"hashtag" text NOT NULL,
	"platform" text NOT NULL,
	"post_count" integer DEFAULT 0 NOT NULL,
	"total_reach" integer DEFAULT 0 NOT NULL,
	"total_engagement" integer DEFAULT 0 NOT NULL,
	"last_updated" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "landing_page_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"brand_settings_id" integer NOT NULL,
	"user_id" integer,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"instagram_handle" text,
	"tiktok_handle" text,
	"youtube_handle" text,
	"shipping_address" text,
	"shipping_city" text,
	"shipping_state" text,
	"shipping_zip_code" text,
	"shipping_country" text DEFAULT 'Brasil',
	"clothing_size" text,
	"pix_key" text,
	"pix_key_type" text,
	"accepted_terms" boolean DEFAULT false,
	"accepted_content_usage" boolean DEFAULT false,
	"accepted_privacy_policy" boolean DEFAULT false,
	"custom_fields_data" jsonb DEFAULT '{}'::jsonb,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"utm_term" text,
	"utm_content" text,
	"referrer_url" text,
	"status" text DEFAULT 'pending',
	"converted_to_user_id" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mention_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"alert_type" text NOT NULL,
	"brand_mention_id" integer,
	"title" text NOT NULL,
	"message" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mention_trends" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"date" date NOT NULL,
	"platform" text NOT NULL,
	"total_mentions" integer DEFAULT 0 NOT NULL,
	"positive_mentions" integer DEFAULT 0 NOT NULL,
	"neutral_mentions" integer DEFAULT 0 NOT NULL,
	"negative_mentions" integer DEFAULT 0 NOT NULL,
	"total_reach" integer DEFAULT 0 NOT NULL,
	"total_engagement" integer DEFAULT 0 NOT NULL,
	"avg_sentiment_score" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "monthly_leaderboard" (
	"id" serial PRIMARY KEY NOT NULL,
	"creator_id" integer NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"rank" integer,
	"campaigns_completed" integer DEFAULT 0 NOT NULL,
	"avg_rating" text,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "monthly_leaderboard_creator_id_month_year_unique" UNIQUE("creator_id","month","year")
);
--> statement-breakpoint
CREATE TABLE "payment_batches" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_wallet_id" integer NOT NULL,
	"name" text,
	"total_amount" integer NOT NULL,
	"transaction_count" integer NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "points_ledger" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"campaign_id" integer,
	"creator_id" integer NOT NULL,
	"delta_points" integer NOT NULL,
	"reason" text NOT NULL,
	"ref_type" text,
	"ref_id" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_ai_insights" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"post_id" integer NOT NULL,
	"platform" text NOT NULL,
	"summary" text NOT NULL,
	"strengths" jsonb,
	"improvements" jsonb,
	"hashtags" jsonb,
	"best_time_to_post" text,
	"audience_insights" text,
	"content_score" integer,
	"engagement_prediction" text,
	"recommendations" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "post_ai_insights_post_id_unique" UNIQUE("post_id")
);
--> statement-breakpoint
CREATE TABLE "push_notification_recipients" (
	"id" serial PRIMARY KEY NOT NULL,
	"push_notification_id" integer NOT NULL,
	"creator_id" integer NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"sender_user_id" integer NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"action_url" text,
	"target_type" text NOT NULL,
	"target_campaign_id" integer,
	"target_creator_ids" jsonb,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "reward_entitlements" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"campaign_id" integer NOT NULL,
	"creator_id" integer NOT NULL,
	"prize_id" integer NOT NULL,
	"source_type" text NOT NULL,
	"points_at_time" integer,
	"rank_at_time" integer,
	"reward_kind" text NOT NULL,
	"cash_amount" integer,
	"product_sku" text,
	"product_description" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"wallet_transaction_id" integer,
	"shipment_id" integer,
	"approved_by" integer,
	"approved_at" timestamp,
	"rejected_by" integer,
	"rejected_at" timestamp,
	"rejection_reason" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reward_entitlements_creator_id_prize_id_unique" UNIQUE("creator_id","prize_id")
);
--> statement-breakpoint
CREATE TABLE "reward_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"entitlement_id" integer NOT NULL,
	"event_type" text NOT NULL,
	"performed_by" integer,
	"previous_status" text,
	"new_status" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales_tracking" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"creator_id" integer NOT NULL,
	"coupon_id" integer,
	"order_id" text NOT NULL,
	"order_value" integer NOT NULL,
	"commission" integer,
	"commission_rate_bps" integer,
	"platform" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"tracked_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "social_listening_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"is_auto_scan_enabled" boolean DEFAULT false NOT NULL,
	"scan_frequency" text DEFAULT 'daily' NOT NULL,
	"email_alerts_enabled" boolean DEFAULT true NOT NULL,
	"alert_on_negative_sentiment" boolean DEFAULT true NOT NULL,
	"alert_on_viral_post" boolean DEFAULT true NOT NULL,
	"alert_on_new_mention" boolean DEFAULT false NOT NULL,
	"viral_threshold" integer DEFAULT 10000 NOT NULL,
	"last_scan_at" timestamp,
	"next_scan_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "social_listening_config_company_id_unique" UNIQUE("company_id")
);
--> statement-breakpoint
CREATE TABLE "tiktok_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"tiktok_username" text,
	"tiktok_id" text,
	"followers" integer,
	"following" integer,
	"likes" integer,
	"videos" integer,
	"engagement_rate" text,
	"verified" boolean DEFAULT false,
	"bio" text,
	"avatar_url" text,
	"top_hashtags" text[],
	"last_updated" timestamp,
	CONSTRAINT "tiktok_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "tracking_keywords" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"keyword" text NOT NULL,
	"type" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "wallet_boxes" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_wallet_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text DEFAULT '#6366f1',
	"icon" text DEFAULT 'piggy-bank',
	"target_amount" integer,
	"current_amount" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_wallet_id" integer,
	"creator_balance_id" integer,
	"type" text NOT NULL,
	"amount" integer NOT NULL,
	"balance_after" integer,
	"related_user_id" integer,
	"related_campaign_id" integer,
	"wallet_box_id" integer,
	"description" text,
	"notes" text,
	"tags" text[],
	"status" text DEFAULT 'pending' NOT NULL,
	"scheduled_for" timestamp,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "seeding_status" text DEFAULT 'not_required';--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "seeding_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "seeding_received_at" timestamp;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "seeding_tracking_code" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "seeding_notes" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "cover_photo" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "category" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "is_discoverable" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "is_featured" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "tagline" text;--> statement-breakpoint
ALTER TABLE "deliverables" ADD COLUMN "deliverable_type" text DEFAULT 'other';--> statement-breakpoint
ALTER TABLE "analytics_reports" ADD CONSTRAINT "analytics_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_creator_tiers" ADD CONSTRAINT "brand_creator_tiers_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_creator_tiers" ADD CONSTRAINT "brand_creator_tiers_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_creator_tiers" ADD CONSTRAINT "brand_creator_tiers_tier_id_brand_tier_configs_id_fk" FOREIGN KEY ("tier_id") REFERENCES "public"."brand_tier_configs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_mentions" ADD CONSTRAINT "brand_mentions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_mentions" ADD CONSTRAINT "brand_mentions_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_mentions" ADD CONSTRAINT "brand_mentions_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_mentions" ADD CONSTRAINT "brand_mentions_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_scoring_defaults" ADD CONSTRAINT "brand_scoring_defaults_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_settings" ADD CONSTRAINT "brand_settings_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_settings" ADD CONSTRAINT "brand_settings_default_campaign_id_campaigns_id_fk" FOREIGN KEY ("default_campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_tier_configs" ADD CONSTRAINT "brand_tier_configs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_coupons" ADD CONSTRAINT "campaign_coupons_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_coupons" ADD CONSTRAINT "campaign_coupons_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_creator_stats" ADD CONSTRAINT "campaign_creator_stats_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_creator_stats" ADD CONSTRAINT "campaign_creator_stats_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_gamification_configs" ADD CONSTRAINT "campaign_gamification_configs_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_goals" ADD CONSTRAINT "campaign_goals_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_goals" ADD CONSTRAINT "campaign_goals_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_metric_snapshots" ADD CONSTRAINT "campaign_metric_snapshots_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_metric_snapshots" ADD CONSTRAINT "campaign_metric_snapshots_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_prizes" ADD CONSTRAINT "campaign_prizes_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_roi" ADD CONSTRAINT "campaign_roi_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_roi" ADD CONSTRAINT "campaign_roi_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_wallets" ADD CONSTRAINT "company_wallets_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_participants" ADD CONSTRAINT "competition_participants_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_participants" ADD CONSTRAINT "competition_participants_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_usage" ADD CONSTRAINT "coupon_usage_coupon_id_campaign_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."campaign_coupons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_analytics_history" ADD CONSTRAINT "creator_analytics_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_badges" ADD CONSTRAINT "creator_badges_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_badges" ADD CONSTRAINT "creator_badges_badge_id_badges_id_fk" FOREIGN KEY ("badge_id") REFERENCES "public"."badges"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_balances" ADD CONSTRAINT "creator_balances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_commissions" ADD CONSTRAINT "creator_commissions_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_commissions" ADD CONSTRAINT "creator_commissions_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_commissions" ADD CONSTRAINT "creator_commissions_sales_tracking_id_sales_tracking_id_fk" FOREIGN KEY ("sales_tracking_id") REFERENCES "public"."sales_tracking"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_hashtags" ADD CONSTRAINT "creator_hashtags_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_points" ADD CONSTRAINT "creator_points_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_posts" ADD CONSTRAINT "creator_posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_scores" ADD CONSTRAINT "creator_scores_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_scores" ADD CONSTRAINT "creator_scores_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_scores" ADD CONSTRAINT "creator_scores_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_total_points" ADD CONSTRAINT "creator_total_points_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_total_points" ADD CONSTRAINT "creator_total_points_current_level_id_creator_levels_id_fk" FOREIGN KEY ("current_level_id") REFERENCES "public"."creator_levels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ecommerce_integrations" ADD CONSTRAINT "ecommerce_integrations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorite_companies" ADD CONSTRAINT "favorite_companies_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorite_companies" ADD CONSTRAINT "favorite_companies_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hashtag_tracking" ADD CONSTRAINT "hashtag_tracking_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hashtag_tracking" ADD CONSTRAINT "hashtag_tracking_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "landing_page_submissions" ADD CONSTRAINT "landing_page_submissions_brand_settings_id_brand_settings_id_fk" FOREIGN KEY ("brand_settings_id") REFERENCES "public"."brand_settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "landing_page_submissions" ADD CONSTRAINT "landing_page_submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "landing_page_submissions" ADD CONSTRAINT "landing_page_submissions_converted_to_user_id_users_id_fk" FOREIGN KEY ("converted_to_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mention_alerts" ADD CONSTRAINT "mention_alerts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mention_alerts" ADD CONSTRAINT "mention_alerts_brand_mention_id_brand_mentions_id_fk" FOREIGN KEY ("brand_mention_id") REFERENCES "public"."brand_mentions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mention_trends" ADD CONSTRAINT "mention_trends_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_leaderboard" ADD CONSTRAINT "monthly_leaderboard_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_batches" ADD CONSTRAINT "payment_batches_company_wallet_id_company_wallets_id_fk" FOREIGN KEY ("company_wallet_id") REFERENCES "public"."company_wallets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_ledger" ADD CONSTRAINT "points_ledger_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_ledger" ADD CONSTRAINT "points_ledger_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_ledger" ADD CONSTRAINT "points_ledger_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_ai_insights" ADD CONSTRAINT "post_ai_insights_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_ai_insights" ADD CONSTRAINT "post_ai_insights_post_id_creator_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."creator_posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_notification_recipients" ADD CONSTRAINT "push_notification_recipients_push_notification_id_push_notifications_id_fk" FOREIGN KEY ("push_notification_id") REFERENCES "public"."push_notifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_notification_recipients" ADD CONSTRAINT "push_notification_recipients_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_notifications" ADD CONSTRAINT "push_notifications_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_notifications" ADD CONSTRAINT "push_notifications_sender_user_id_users_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_notifications" ADD CONSTRAINT "push_notifications_target_campaign_id_campaigns_id_fk" FOREIGN KEY ("target_campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_entitlements" ADD CONSTRAINT "reward_entitlements_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_entitlements" ADD CONSTRAINT "reward_entitlements_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_entitlements" ADD CONSTRAINT "reward_entitlements_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_entitlements" ADD CONSTRAINT "reward_entitlements_prize_id_campaign_prizes_id_fk" FOREIGN KEY ("prize_id") REFERENCES "public"."campaign_prizes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_entitlements" ADD CONSTRAINT "reward_entitlements_wallet_transaction_id_wallet_transactions_id_fk" FOREIGN KEY ("wallet_transaction_id") REFERENCES "public"."wallet_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_entitlements" ADD CONSTRAINT "reward_entitlements_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_entitlements" ADD CONSTRAINT "reward_entitlements_rejected_by_users_id_fk" FOREIGN KEY ("rejected_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_events" ADD CONSTRAINT "reward_events_entitlement_id_reward_entitlements_id_fk" FOREIGN KEY ("entitlement_id") REFERENCES "public"."reward_entitlements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_events" ADD CONSTRAINT "reward_events_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_tracking" ADD CONSTRAINT "sales_tracking_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_tracking" ADD CONSTRAINT "sales_tracking_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_tracking" ADD CONSTRAINT "sales_tracking_coupon_id_campaign_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."campaign_coupons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_listening_config" ADD CONSTRAINT "social_listening_config_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tiktok_profiles" ADD CONSTRAINT "tiktok_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking_keywords" ADD CONSTRAINT "tracking_keywords_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_boxes" ADD CONSTRAINT "wallet_boxes_company_wallet_id_company_wallets_id_fk" FOREIGN KEY ("company_wallet_id") REFERENCES "public"."company_wallets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_company_wallet_id_company_wallets_id_fk" FOREIGN KEY ("company_wallet_id") REFERENCES "public"."company_wallets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_creator_balance_id_creator_balances_id_fk" FOREIGN KEY ("creator_balance_id") REFERENCES "public"."creator_balances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_related_user_id_users_id_fk" FOREIGN KEY ("related_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_related_campaign_id_campaigns_id_fk" FOREIGN KEY ("related_campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_wallet_box_id_wallet_boxes_id_fk" FOREIGN KEY ("wallet_box_id") REFERENCES "public"."wallet_boxes"("id") ON DELETE no action ON UPDATE no action;