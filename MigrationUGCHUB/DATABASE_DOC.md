# Database Documentation

## Schema Overview

- `academy`
- `analytics`
- `billing`
- `brand`
- `campaign`
- `company`
- `content`
- `core`
- `creator`
- `gamification`
- `messaging`
- `misc`
- `social`
- `system`

## Table Mapping (public -> target schema)

- `applications` → `campaign.applications`
- `badges` → `gamification.badges`
- `blog_posts` → `content.blog_posts`
- `brand_creator_memberships` → `brand.brand_creator_memberships`
- `brand_creator_tiers` → `brand.brand_creator_tiers`
- `brand_programs` → `gamification.brand_programs`
- `brand_rewards` → `gamification.brand_rewards`
- `brand_settings` → `brand.brand_settings`
- `brand_tags` → `brand.brand_tags`
- `brand_tier_configs` → `gamification.brand_tier_configs`
- `campaign_coupons` → `campaign.campaign_coupons`
- `campaign_creator_stats` → `campaign.campaign_creator_stats`
- `campaign_hashtags` → `campaign.campaign_hashtags`
- `campaign_inspirations` → `content.campaign_inspirations`
- `campaign_invites` → `campaign.campaign_invites`
- `campaign_metric_snapshots` → `analytics.campaign_metric_snapshots`
- `campaign_points_rules` → `campaign.campaign_points_rules`
- `campaign_prizes` → `campaign.campaign_prizes`
- `campaign_tags` → `campaign.campaign_tags`
- `campaign_templates` → `campaign.campaign_templates`
- `campaigns` → `campaign.campaigns`
- `community_invites` → `misc.community_invites`
- `companies` → `company.companies`
- `company_members` → `company.company_members`
- `company_user_invites` → `company.company_user_invites`
- `company_wallets` → `billing.company_wallets`
- `contact_notes` → `misc.contact_notes`
- `conv_messages` → `messaging.conv_messages`
- `conversations` → `messaging.conversations`
- `course_lessons` → `academy.course_lessons`
- `course_modules` → `academy.course_modules`
- `courses` → `academy.courses`
- `creator_ad_partners` → `creator.creator_ad_partners`
- `creator_addresses` → `creator.creator_addresses`
- `creator_analytics_history` → `analytics.creator_analytics_history`
- `creator_auth_links` → `creator.creator_auth_links`
- `creator_badges` → `gamification.creator_badges`
- `creator_balances` → `billing.creator_balances`
- `creator_commissions` → `billing.creator_commissions`
- `creator_course_progress` → `academy.creator_course_progress`
- `creator_discovery_profiles` → `creator.creator_discovery_profiles`
- `creator_hashtags` → `creator.creator_hashtags`
- `creator_lesson_progress` → `academy.creator_lesson_progress`
- `creator_levels` → `gamification.creator_levels`
- `creator_points` → `gamification.creator_points`
- `creator_posts` → `creator.creator_posts`
- `creator_saved_inspirations` → `content.creator_saved_inspirations`
- `creator_tags` → `creator.creator_tags`
- `data_source_registry` → `system.data_source_registry`
- `deliverable_comments` → `campaign.deliverable_comments`
- `deliverables` → `campaign.deliverables`
- `dm_send_logs` → `social.dm_send_logs`
- `dm_templates` → `social.dm_templates`
- `favorite_companies` → `misc.favorite_companies`
- `favorite_creators` → `misc.favorite_creators`
- `feature_flags` → `system.feature_flags`
- `hashtag_posts` → `misc.hashtag_posts`
- `hashtag_searches` → `misc.hashtag_searches`
- `inspiration_collection_items` → `content.inspiration_collection_items`
- `inspiration_collections` → `content.inspiration_collections`
- `inspirations` → `content.inspirations`
- `instagram_accounts` → `social.instagram_accounts`
- `instagram_contacts` → `social.instagram_contacts`
- `instagram_interactions` → `social.instagram_interactions`
- `instagram_messages` → `social.instagram_messages`
- `instagram_posts` → `social.instagram_posts`
- `instagram_profiles` → `social.instagram_profiles`
- `instagram_tagged_posts` → `social.instagram_tagged_posts`
- `integration_logs` → `system.integration_logs`
- `message_reads` → `messaging.message_reads`
- `meta_ad_accounts` → `social.meta_ad_accounts`
- `meta_ad_accounts_list` → `social.meta_ad_accounts_list`
- `meta_business_managers` → `social.meta_business_managers`
- `notifications` → `system.notifications`
- `payment_batches` → `billing.payment_batches`
- `points_ledger` → `gamification.points_ledger`
- `post_ai_insights` → `misc.post_ai_insights`
- `problem_reports` → `misc.problem_reports`
- `profile_snapshots` → `analytics.profile_snapshots`
- `reward_entitlements` → `gamification.reward_entitlements`
- `sales_tracking` → `billing.sales_tracking`
- `session` → `system.session`
- `tags` → `system.tags`
- `tiktok_profiles` → `social.tiktok_profiles`
- `tiktok_videos` → `social.tiktok_videos`
- `users` → `core.users`
- `wallet_boxes` → `billing.wallet_boxes`
- `wallet_transactions` → `billing.wallet_transactions`
- `workflow_stages` → `misc.workflow_stages`
- `youtube_channels` → `social.youtube_channels`
- `youtube_videos` → `social.youtube_videos`

## Table Details

### `academy.course_lessons`

Columns:
- `id`: integer NOT NULL
- `module_id`: integer NOT NULL
- `title`: text NOT NULL
- `order`: integer NOT NULL DEFAULT 0
- `content_type`: text NOT NULL DEFAULT 'text'::text
- `content`: jsonb NULL
- `duration_minutes`: integer NULL DEFAULT 5
- `created_at`: timestamp without time zone NOT NULL DEFAULT now()

Primary Keys:
- `course_lessons_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `course_lessons_module_id_course_modules_id_fk`: FOREIGN KEY (module_id) REFERENCES academy.course_modules(id) ON DELETE CASCADE

### `academy.course_modules`

Columns:
- `id`: integer NOT NULL
- `course_id`: integer NOT NULL
- `title`: text NOT NULL
- `order`: integer NOT NULL DEFAULT 0

Primary Keys:
- `course_modules_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `course_modules_course_id_courses_id_fk`: FOREIGN KEY (course_id) REFERENCES academy.courses(id) ON DELETE CASCADE

### `academy.courses`

Columns:
- `id`: integer NOT NULL
- `slug`: text NOT NULL
- `title`: text NOT NULL
- `description`: text NULL
- `level`: text NOT NULL DEFAULT 'basic'::text
- `estimated_minutes`: integer NOT NULL DEFAULT 30
- `cover_url`: text NULL
- `is_published`: boolean NOT NULL DEFAULT true
- `created_at`: timestamp without time zone NOT NULL DEFAULT now()

Primary Keys:
- `courses_pkey`: PRIMARY KEY (id)

### `academy.creator_course_progress`

Columns:
- `id`: integer NOT NULL
- `creator_id`: integer NOT NULL
- `course_id`: integer NOT NULL
- `started_at`: timestamp without time zone NOT NULL DEFAULT now()
- `completed_at`: timestamp without time zone NULL
- `progress_pct`: integer NOT NULL DEFAULT 0
- `current_lesson_id`: integer NULL
- `updated_at`: timestamp without time zone NOT NULL DEFAULT now()

Primary Keys:
- `creator_course_progress_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `creator_course_progress_course_id_courses_id_fk`: FOREIGN KEY (course_id) REFERENCES academy.courses(id) ON DELETE CASCADE
- `creator_course_progress_creator_id_users_id_fk`: FOREIGN KEY (creator_id) REFERENCES core.users(id) ON DELETE CASCADE

### `academy.creator_lesson_progress`

Columns:
- `id`: integer NOT NULL
- `creator_id`: integer NOT NULL
- `lesson_id`: integer NOT NULL
- `completed_at`: timestamp without time zone NOT NULL DEFAULT now()

Primary Keys:
- `creator_lesson_progress_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `creator_lesson_progress_creator_id_users_id_fk`: FOREIGN KEY (creator_id) REFERENCES core.users(id) ON DELETE CASCADE
- `creator_lesson_progress_lesson_id_course_lessons_id_fk`: FOREIGN KEY (lesson_id) REFERENCES academy.course_lessons(id) ON DELETE CASCADE

### `analytics.campaign_metric_snapshots`

Columns:
- `id`: integer NOT NULL
- `campaign_id`: integer NOT NULL
- `creator_id`: integer NOT NULL
- `post_id`: text NOT NULL
- `platform`: text NOT NULL
- `post_url`: text NULL
- `views`: integer NOT NULL DEFAULT 0
- `likes`: integer NOT NULL DEFAULT 0
- `comments`: integer NOT NULL DEFAULT 0
- `last_awarded_views`: integer NOT NULL DEFAULT 0
- `last_awarded_likes`: integer NOT NULL DEFAULT 0
- `last_awarded_comments`: integer NOT NULL DEFAULT 0
- `total_points_awarded`: integer NOT NULL DEFAULT 0
- `points_awarded_today`: integer NOT NULL DEFAULT 0
- `last_points_date`: timestamp without time zone NULL
- `flagged_for_review`: boolean NOT NULL DEFAULT false
- `flag_reason`: text NULL
- `posted_at`: timestamp without time zone NULL
- `last_snapshot_at`: timestamp without time zone NOT NULL DEFAULT now()
- `created_at`: timestamp without time zone NOT NULL DEFAULT now()
- `update_count`: integer NOT NULL DEFAULT 0
- `sum_views_deltas`: integer NOT NULL DEFAULT 0
- `sum_likes_deltas`: integer NOT NULL DEFAULT 0
- `sum_comments_deltas`: integer NOT NULL DEFAULT 0

Primary Keys:
- `campaign_metric_snapshots_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `campaign_metric_snapshots_campaign_id_campaigns_id_fk`: FOREIGN KEY (campaign_id) REFERENCES campaign.campaigns(id) ON DELETE CASCADE
- `campaign_metric_snapshots_creator_id_users_id_fk`: FOREIGN KEY (creator_id) REFERENCES core.users(id)

### `analytics.creator_analytics_history`

Columns:
- `id`: integer NOT NULL
- `user_id`: integer NOT NULL
- `platform`: text NOT NULL
- `followers`: integer NULL
- `following`: integer NULL
- `posts`: integer NULL
- `engagement_rate`: text NULL
- `avg_likes`: integer NULL
- `avg_comments`: integer NULL
- `avg_views`: integer NULL
- `recorded_at`: timestamp without time zone NOT NULL DEFAULT now()

Primary Keys:
- `creator_analytics_history_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `creator_analytics_history_user_id_users_id_fk`: FOREIGN KEY (user_id) REFERENCES core.users(id)

### `analytics.profile_snapshots`

Columns:
- `id`: integer NOT NULL
- `username`: text NOT NULL
- `followers_count`: integer NULL
- `follows_count`: integer NULL
- `posts_count`: integer NULL
- `engagement_rate`: text NULL
- `is_verified`: boolean NULL DEFAULT false
- `is_private`: boolean NULL DEFAULT false
- `biography`: text NULL
- `full_name`: text NULL
- `profile_pic_url`: text NULL
- `external_url`: text NULL
- `business_category`: text NULL
- `raw_data`: jsonb NULL
- `snapshot_date`: timestamp without time zone NOT NULL DEFAULT now()
- `created_at`: timestamp without time zone NOT NULL DEFAULT now()

Primary Keys:
- `profile_snapshots_pkey`: PRIMARY KEY (id)

### `billing.company_wallets`

Columns:
- `id`: integer NOT NULL
- `company_id`: integer NOT NULL
- `balance`: integer NOT NULL DEFAULT 0
- `reserved_balance`: integer NOT NULL DEFAULT 0
- `billing_cycle_start`: timestamp without time zone NULL
- `billing_cycle_end`: timestamp without time zone NULL
- `created_at`: timestamp without time zone NOT NULL DEFAULT now()
- `updated_at`: timestamp without time zone NOT NULL DEFAULT now()

Primary Keys:
- `company_wallets_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `company_wallets_company_id_companies_id_fk`: FOREIGN KEY (company_id) REFERENCES company.companies(id) ON DELETE CASCADE

### `billing.creator_balances`

Columns:
- `id`: integer NOT NULL
- `user_id`: integer NOT NULL
- `available_balance`: integer NOT NULL DEFAULT 0
- `pending_balance`: integer NOT NULL DEFAULT 0
- `pix_key`: text NULL
- `pix_key_type`: text NULL
- `created_at`: timestamp without time zone NOT NULL DEFAULT now()
- `updated_at`: timestamp without time zone NOT NULL DEFAULT now()

Primary Keys:
- `creator_balances_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `creator_balances_user_id_users_id_fk`: FOREIGN KEY (user_id) REFERENCES core.users(id) ON DELETE CASCADE

### `billing.creator_commissions`

Columns:
- `id`: integer NOT NULL
- `creator_id`: integer NOT NULL
- `campaign_id`: integer NULL
- `sales_tracking_id`: integer NULL
- `amount`: integer NOT NULL
- `status`: text NOT NULL DEFAULT 'pending'::text
- `paid_at`: timestamp without time zone NULL
- `created_at`: timestamp without time zone NULL DEFAULT now()
- `company_id`: integer NOT NULL
- `approved_at`: timestamp without time zone NULL

Primary Keys:
- `creator_commissions_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `creator_commissions_campaign_id_campaigns_id_fk`: FOREIGN KEY (campaign_id) REFERENCES campaign.campaigns(id)
- `creator_commissions_company_id_companies_id_fk`: FOREIGN KEY (company_id) REFERENCES company.companies(id)
- `creator_commissions_creator_id_users_id_fk`: FOREIGN KEY (creator_id) REFERENCES core.users(id)
- `creator_commissions_sales_tracking_id_sales_tracking_id_fk`: FOREIGN KEY (sales_tracking_id) REFERENCES billing.sales_tracking(id)

### `billing.payment_batches`

Columns:
- `id`: integer NOT NULL
- `company_wallet_id`: integer NOT NULL
- `name`: text NULL
- `total_amount`: integer NOT NULL
- `transaction_count`: integer NOT NULL
- `status`: text NOT NULL DEFAULT 'draft'::text
- `processed_at`: timestamp without time zone NULL
- `created_at`: timestamp without time zone NOT NULL DEFAULT now()
- `updated_at`: timestamp without time zone NOT NULL DEFAULT now()

Primary Keys:
- `payment_batches_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `payment_batches_company_wallet_id_company_wallets_id_fk`: FOREIGN KEY (company_wallet_id) REFERENCES billing.company_wallets(id) ON DELETE CASCADE

### `billing.sales_tracking`

Columns:
- `id`: integer NOT NULL
- `campaign_id`: integer NULL
- `creator_id`: integer NOT NULL
- `coupon_id`: integer NULL
- `order_id`: text NOT NULL
- `order_value`: integer NOT NULL
- `commission`: integer NULL
- `commission_rate_bps`: integer NULL
- `platform`: text NOT NULL
- `status`: text NOT NULL DEFAULT 'pending'::text
- `tracked_at`: timestamp without time zone NULL DEFAULT now()
- `company_id`: integer NOT NULL
- `coupon_code`: text NULL
- `external_order_id`: text NULL
- `raw_json`: jsonb NULL

Primary Keys:
- `sales_tracking_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `sales_tracking_campaign_id_campaigns_id_fk`: FOREIGN KEY (campaign_id) REFERENCES campaign.campaigns(id)
- `sales_tracking_company_id_companies_id_fk`: FOREIGN KEY (company_id) REFERENCES company.companies(id)
- `sales_tracking_coupon_id_campaign_coupons_id_fk`: FOREIGN KEY (coupon_id) REFERENCES campaign.campaign_coupons(id)
- `sales_tracking_creator_id_users_id_fk`: FOREIGN KEY (creator_id) REFERENCES core.users(id)

### `billing.wallet_boxes`

Columns:
- `id`: integer NOT NULL
- `company_wallet_id`: integer NOT NULL
- `name`: text NOT NULL
- `description`: text NULL
- `color`: text NULL DEFAULT '#6366f1'::text
- `icon`: text NULL DEFAULT 'piggy-bank'::text
- `target_amount`: integer NULL
- `current_amount`: integer NOT NULL DEFAULT 0
- `is_active`: boolean NULL DEFAULT true
- `created_at`: timestamp without time zone NOT NULL DEFAULT now()
- `updated_at`: timestamp without time zone NOT NULL DEFAULT now()

Primary Keys:
- `wallet_boxes_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `wallet_boxes_company_wallet_id_company_wallets_id_fk`: FOREIGN KEY (company_wallet_id) REFERENCES billing.company_wallets(id) ON DELETE CASCADE

### `billing.wallet_transactions`

Columns:
- `id`: integer NOT NULL
- `company_wallet_id`: integer NULL
- `creator_balance_id`: integer NULL
- `type`: text NOT NULL
- `amount`: integer NOT NULL
- `balance_after`: integer NULL
- `related_user_id`: integer NULL
- `related_campaign_id`: integer NULL
- `wallet_box_id`: integer NULL
- `description`: text NULL
- `notes`: text NULL
- `tags`: ARRAY NULL
- `status`: text NOT NULL DEFAULT 'pending'::text
- `scheduled_for`: timestamp without time zone NULL
- `processed_at`: timestamp without time zone NULL
- `created_at`: timestamp without time zone NOT NULL DEFAULT now()
- `updated_at`: timestamp without time zone NOT NULL DEFAULT now()
- `stripe_event_id`: text NULL

Primary Keys:
- `wallet_transactions_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `wallet_transactions_company_wallet_id_company_wallets_id_fk`: FOREIGN KEY (company_wallet_id) REFERENCES billing.company_wallets(id) ON DELETE CASCADE
- `wallet_transactions_creator_balance_id_creator_balances_id_fk`: FOREIGN KEY (creator_balance_id) REFERENCES billing.creator_balances(id) ON DELETE CASCADE
- `wallet_transactions_related_campaign_id_campaigns_id_fk`: FOREIGN KEY (related_campaign_id) REFERENCES campaign.campaigns(id)
- `wallet_transactions_related_user_id_users_id_fk`: FOREIGN KEY (related_user_id) REFERENCES core.users(id)
- `wallet_transactions_wallet_box_id_wallet_boxes_id_fk`: FOREIGN KEY (wallet_box_id) REFERENCES billing.wallet_boxes(id)

### `brand.brand_creator_memberships`

Columns:
- `id`: integer NOT NULL
- `company_id`: integer NOT NULL
- `creator_id`: integer NOT NULL
- `status`: text NOT NULL DEFAULT 'invited'::text
- `tier_id`: integer NULL
- `points_cache`: integer NOT NULL DEFAULT 0
- `tags`: ARRAY NULL DEFAULT '{}'::text[]
- `coupon_code`: text NULL
- `invite_id`: integer NULL
- `terms_accepted_at`: timestamp without time zone NULL
- `terms_accepted_ip`: text NULL
- `joined_at`: timestamp without time zone NULL
- `last_activity_at`: timestamp without time zone NULL
- `created_at`: timestamp without time zone NOT NULL DEFAULT now()
- `updated_at`: timestamp without time zone NOT NULL DEFAULT now()
- `source`: text NOT NULL DEFAULT 'manual'::text
- `campaign_id`: integer NULL

Primary Keys:
- `brand_creator_memberships_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `brand_creator_memberships_campaign_id_campaigns_id_fk`: FOREIGN KEY (campaign_id) REFERENCES campaign.campaigns(id)
- `brand_creator_memberships_company_id_companies_id_fk`: FOREIGN KEY (company_id) REFERENCES company.companies(id) ON DELETE CASCADE
- `brand_creator_memberships_creator_id_users_id_fk`: FOREIGN KEY (creator_id) REFERENCES core.users(id) ON DELETE CASCADE
- `brand_creator_memberships_tier_id_brand_tier_configs_id_fk`: FOREIGN KEY (tier_id) REFERENCES gamification.brand_tier_configs(id)

### `brand.brand_creator_tiers`

Columns:
- `id`: integer NOT NULL
- `company_id`: integer NOT NULL
- `creator_id`: integer NOT NULL
- `tier_id`: integer NULL
- `total_brand_points`: integer NOT NULL DEFAULT 0
- `updated_at`: timestamp without time zone NOT NULL DEFAULT now()

Primary Keys:
- `brand_creator_tiers_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `brand_creator_tiers_company_id_companies_id_fk`: FOREIGN KEY (company_id) REFERENCES company.companies(id) ON DELETE CASCADE
- `brand_creator_tiers_creator_id_users_id_fk`: FOREIGN KEY (creator_id) REFERENCES core.users(id)
- `brand_creator_tiers_tier_id_brand_tier_configs_id_fk`: FOREIGN KEY (tier_id) REFERENCES gamification.brand_tier_configs(id) ON DELETE SET NULL

### `brand.brand_settings`

Columns:
- `id`: integer NOT NULL
- `company_id`: integer NOT NULL
- `slug`: text NOT NULL
- `logo_url`: text NULL
- `primary_color`: text NULL DEFAULT '#6366f1'::text
- `secondary_color`: text NULL DEFAULT '#8b5cf6'::text
- `background_color`: text NULL DEFAULT '#ffffff'::text
- `text_color`: text NULL DEFAULT '#1f2937'::text
- `accent_color`: text NULL DEFAULT '#10b981'::text
- `brand_name`: text NOT NULL
- `tagline`: text NULL
- `description`: text NULL
- `welcome_message`: text NULL
- `terms_and_conditions`: text NULL
- `privacy_policy`: text NULL
- `is_active`: boolean NULL DEFAULT true
- `requires_approval`: boolean NULL DEFAULT true
- `default_campaign_id`: integer NULL
- `collect_social_profiles`: boolean NULL DEFAULT true
- `collect_shipping_address`: boolean NULL DEFAULT true
- `collect_payment_info`: boolean NULL DEFAULT true
- `collect_clothing_size`: boolean NULL DEFAULT false
- `collect_content_preferences`: boolean NULL DEFAULT false
- `custom_fields`: jsonb NULL DEFAULT '[]'::jsonb
- `created_at`: timestamp without time zone NOT NULL DEFAULT now()
- `updated_at`: timestamp without time zone NOT NULL DEFAULT now()

Primary Keys:
- `brand_settings_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `brand_settings_company_id_companies_id_fk`: FOREIGN KEY (company_id) REFERENCES company.companies(id) ON DELETE CASCADE
- `brand_settings_default_campaign_id_campaigns_id_fk`: FOREIGN KEY (default_campaign_id) REFERENCES campaign.campaigns(id)

### `brand.brand_tags`

Columns:
- `id`: integer NOT NULL
- `brand_id`: integer NOT NULL
- `tag_id`: integer NOT NULL
- `created_at`: timestamp without time zone NOT NULL DEFAULT now()

Primary Keys:
- `brand_tags_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `brand_tags_brand_id_companies_id_fk`: FOREIGN KEY (brand_id) REFERENCES company.companies(id) ON DELETE CASCADE
- `brand_tags_tag_id_tags_id_fk`: FOREIGN KEY (tag_id) REFERENCES system.tags(id) ON DELETE CASCADE

### `campaign.applications`

Columns:
- `id`: integer NOT NULL
- `campaign_id`: integer NOT NULL
- `creator_id`: integer NOT NULL
- `status`: text NOT NULL DEFAULT 'pending'::text
- `message`: text NULL
- `applied_at`: timestamp without time zone NULL DEFAULT now()
- `workflow_status`: text NULL
- `creator_workflow_status`: text NULL DEFAULT 'aceito'::text
- `seeding_status`: text NULL DEFAULT 'not_required'::text
- `seeding_sent_at`: timestamp without time zone NULL
- `seeding_received_at`: timestamp without time zone NULL
- `seeding_tracking_code`: text NULL
- `seeding_notes`: text NULL

Primary Keys:
- `applications_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `applications_campaign_id_campaigns_id_fk`: FOREIGN KEY (campaign_id) REFERENCES campaign.campaigns(id)
- `applications_creator_id_users_id_fk`: FOREIGN KEY (creator_id) REFERENCES core.users(id)

### `campaign.campaign_coupons`

Columns:
- `id`: integer NOT NULL
- `campaign_id`: integer NOT NULL
- `creator_id`: integer NULL
- `code`: text NOT NULL
- `discount_type`: text NOT NULL
- `discount_value`: integer NOT NULL
- `max_uses`: integer NULL
- `current_uses`: integer NOT NULL DEFAULT 0
- `expires_at`: timestamp without time zone NULL
- `is_active`: boolean NOT NULL DEFAULT true
- `created_at`: timestamp without time zone NULL DEFAULT now()

Primary Keys:
- `campaign_coupons_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `campaign_coupons_campaign_id_campaigns_id_fk`: FOREIGN KEY (campaign_id) REFERENCES campaign.campaigns(id)
- `campaign_coupons_creator_id_users_id_fk`: FOREIGN KEY (creator_id) REFERENCES core.users(id)

### `campaign.campaign_creator_stats`

Columns:
- `id`: integer NOT NULL
- `campaign_id`: integer NOT NULL
- `creator_id`: integer NOT NULL
- `points`: integer NOT NULL DEFAULT 0
- `rank`: integer NULL
- `deliverables_completed`: integer NOT NULL DEFAULT 0
- `deliverables_on_time`: integer NOT NULL DEFAULT 0
- `total_views`: integer NOT NULL DEFAULT 0
- `total_engagement`: integer NOT NULL DEFAULT 0
- `total_sales`: integer NOT NULL DEFAULT 0
- `quality_score`: integer NULL
- `updated_at`: timestamp without time zone NULL DEFAULT now()

Primary Keys:
- `campaign_creator_stats_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `campaign_creator_stats_campaign_id_campaigns_id_fk`: FOREIGN KEY (campaign_id) REFERENCES campaign.campaigns(id)
- `campaign_creator_stats_creator_id_users_id_fk`: FOREIGN KEY (creator_id) REFERENCES core.users(id)

### `campaign.campaign_hashtags`

Columns:
- `id`: integer NOT NULL
- `campaign_id`: integer NOT NULL
- `company_id`: integer NOT NULL
- `hashtag`: text NOT NULL
- `hashtag_id`: text NULL
- `is_active`: boolean NOT NULL DEFAULT true
- `last_checked_at`: timestamp without time zone NULL
- `total_posts_found`: integer NULL DEFAULT 0
- `created_at`: timestamp without time zone NOT NULL DEFAULT now()

Primary Keys:
- `campaign_hashtags_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `campaign_hashtags_campaign_id_campaigns_id_fk`: FOREIGN KEY (campaign_id) REFERENCES campaign.campaigns(id)
- `campaign_hashtags_company_id_companies_id_fk`: FOREIGN KEY (company_id) REFERENCES company.companies(id)

### `campaign.campaign_invites`

Columns:
- `id`: integer NOT NULL
- `campaign_id`: integer NOT NULL
- `company_id`: integer NOT NULL
- `creator_id`: integer NOT NULL
- `status`: text NOT NULL DEFAULT 'pending'::text
- `created_at`: timestamp without time zone NOT NULL DEFAULT now()
- `responded_at`: timestamp without time zone NULL

Primary Keys:
- `campaign_invites_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `campaign_invites_campaign_id_campaigns_id_fk`: FOREIGN KEY (campaign_id) REFERENCES campaign.campaigns(id)
- `campaign_invites_company_id_companies_id_fk`: FOREIGN KEY (company_id) REFERENCES company.companies(id)
- `campaign_invites_creator_id_users_id_fk`: FOREIGN KEY (creator_id) REFERENCES core.users(id)

### `campaign.campaign_points_rules`

Columns:
- `id`: integer NOT NULL
- `campaign_id`: integer NOT NULL
- `overrides_brand`: boolean NOT NULL DEFAULT false
- `rules_json`: jsonb NULL
- `created_at`: timestamp without time zone NOT NULL DEFAULT now()
- `updated_at`: timestamp without time zone NOT NULL DEFAULT now()

Primary Keys:
- `campaign_points_rules_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `campaign_points_rules_campaign_id_campaigns_id_fk`: FOREIGN KEY (campaign_id) REFERENCES campaign.campaigns(id) ON DELETE CASCADE

### `campaign.campaign_prizes`

Columns:
- `id`: integer NOT NULL
- `campaign_id`: integer NOT NULL
- `type`: text NOT NULL
- `rank_position`: integer NULL
- `milestone_points`: integer NULL
- `reward_kind`: text NOT NULL
- `cash_amount`: integer NULL
- `product_sku`: text NULL
- `product_description`: text NULL
- `notes`: text NULL
- `created_at`: timestamp without time zone NOT NULL DEFAULT now()

Primary Keys:
- `campaign_prizes_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `campaign_prizes_campaign_id_campaigns_id_fk`: FOREIGN KEY (campaign_id) REFERENCES campaign.campaigns(id) ON DELETE CASCADE

### `campaign.campaign_tags`

Columns:
- `id`: integer NOT NULL
- `campaign_id`: integer NOT NULL
- `tag_id`: integer NOT NULL
- `created_at`: timestamp without time zone NOT NULL DEFAULT now()

Primary Keys:
- `campaign_tags_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `campaign_tags_campaign_id_campaigns_id_fk`: FOREIGN KEY (campaign_id) REFERENCES campaign.campaigns(id) ON DELETE CASCADE
- `campaign_tags_tag_id_tags_id_fk`: FOREIGN KEY (tag_id) REFERENCES system.tags(id) ON DELETE CASCADE

### `campaign.campaign_templates`

Columns:
- `id`: integer NOT NULL
- `company_id`: integer NOT NULL
- `name`: text NOT NULL
- `description`: text NULL
- `title`: text NOT NULL
- `campaign_description`: text NOT NULL
- `requirements`: ARRAY NOT NULL
- `budget`: text NOT NULL
- `deadline`: text NOT NULL
- `creators_needed`: integer NOT NULL
- `target_niche`: ARRAY NULL
- `target_age_ranges`: ARRAY NULL
- `target_gender`: text NULL
- `briefing_text`: text NULL
- `created_at`: timestamp without time zone NOT NULL DEFAULT now()
- `updated_at`: timestamp without time zone NOT NULL DEFAULT now()
- `target_regions`: ARRAY NULL
- `structured_deliverables`: jsonb NULL DEFAULT '[]'::jsonb
- `target_platforms`: ARRAY NULL DEFAULT '{}'::text[]
- `visibility`: text NULL DEFAULT 'public'::text
- `min_tier_id`: integer NULL
- `min_points`: integer NULL DEFAULT 0
- `allowed_tiers`: jsonb NULL DEFAULT '[]'::jsonb
- `rewards_json`: jsonb NULL DEFAULT '[]'::jsonb
- `reward_mode`: text NULL DEFAULT 'ranking'::text

Primary Keys:
- `campaign_templates_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `campaign_templates_company_id_companies_id_fk`: FOREIGN KEY (company_id) REFERENCES company.companies(id)

### `campaign.campaigns`

Columns:
- `id`: integer NOT NULL
- `company_id`: integer NOT NULL
- `title`: text NOT NULL
- `description`: text NOT NULL
- `requirements`: ARRAY NOT NULL
- `budget`: text NOT NULL
- `deadline`: text NOT NULL
- `creators_needed`: integer NOT NULL
- `status`: text NOT NULL DEFAULT 'open'::text
- `created_at`: timestamp without time zone NULL DEFAULT now()
- `briefing_text`: text NULL
- `briefing_materials`: ARRAY NULL
- `target_gender`: text NULL
- `target_niche`: ARRAY NULL
- `target_age_ranges`: ARRAY NULL
- `visibility`: text NOT NULL DEFAULT 'public'::text
- `target_regions`: ARRAY NULL
- `deliverables`: ARRAY NULL DEFAULT '{}'::text[]
- `min_tier_id`: integer NULL
- `inherits_brand_rules`: boolean NOT NULL DEFAULT true
- `reward_mode`: text NULL DEFAULT 'ranking'::text
- `allow_seeding`: boolean NOT NULL DEFAULT true
- `allow_payment`: boolean NOT NULL DEFAULT true
- `min_points`: integer NULL DEFAULT 0
- `structured_deliverables`: jsonb NULL DEFAULT '[]'::jsonb
- `target_platforms`: ARRAY NULL DEFAULT '{}'::text[]
- `allowed_tiers`: jsonb NULL DEFAULT '[]'::jsonb
- `rewards_json`: jsonb NULL DEFAULT '[]'::jsonb
- `template_id`: integer NULL

Primary Keys:
- `campaigns_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `campaigns_company_id_companies_id_fk`: FOREIGN KEY (company_id) REFERENCES company.companies(id)

### `campaign.deliverable_comments`

Columns:
- `id`: integer NOT NULL
- `deliverable_id`: integer NOT NULL
- `user_id`: integer NOT NULL
- `comment`: text NOT NULL
- `created_at`: timestamp without time zone NOT NULL DEFAULT now()

Primary Keys:
- `deliverable_comments_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `deliverable_comments_deliverable_id_deliverables_id_fk`: FOREIGN KEY (deliverable_id) REFERENCES campaign.deliverables(id)
- `deliverable_comments_user_id_users_id_fk`: FOREIGN KEY (user_id) REFERENCES core.users(id)

### `campaign.deliverables`

Columns:
- `id`: integer NOT NULL
- `application_id`: integer NOT NULL
- `file_name`: text NOT NULL
- `file_url`: text NOT NULL
- `file_type`: text NULL
- `description`: text NULL
- `uploaded_at`: timestamp without time zone NOT NULL DEFAULT now()
- `deliverable_type`: text NULL DEFAULT 'other'::text

Primary Keys:
- `deliverables_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `deliverables_application_id_applications_id_fk`: FOREIGN KEY (application_id) REFERENCES campaign.applications(id)

### `company.companies`

Columns:
- `id`: integer NOT NULL
- `name`: text NOT NULL
- `slug`: text NULL
- `logo`: text NULL
- `description`: text NULL
- `created_by_user_id`: integer NOT NULL
- `created_at`: timestamp without time zone NOT NULL DEFAULT now()
- `trade_name`: text NULL
- `cnpj`: text NULL
- `phone`: text NULL
- `email`: text NULL
- `cep`: text NULL
- `street`: text NULL
- `number`: text NULL
- `neighborhood`: text NULL
- `city`: text NULL
- `state`: text NULL
- `complement`: text NULL
- `website`: text NULL
- `instagram`: text NULL
- `cover_photo`: text NULL
- `category`: text NULL
- `is_discoverable`: boolean NOT NULL DEFAULT true
- `is_featured`: boolean NOT NULL DEFAULT false
- `tagline`: text NULL
- `auto_join_community`: boolean NOT NULL DEFAULT true
- `onboarding_completed`: boolean NOT NULL DEFAULT false
- `tiktok`: text NULL
- `instagram_followers`: integer NULL
- `instagram_following`: integer NULL
- `instagram_posts`: integer NULL
- `instagram_engagement_rate`: text NULL
- `instagram_verified`: boolean NULL
- `instagram_bio`: text NULL
- `instagram_profile_pic`: text NULL
- `instagram_last_updated`: timestamp without time zone NULL
- `tiktok_followers`: integer NULL
- `tiktok_hearts`: integer NULL
- `tiktok_videos`: integer NULL
- `tiktok_verified`: boolean NULL
- `tiktok_bio`: text NULL
- `tiktok_last_updated`: timestamp without time zone NULL
- `cnpj_razao_social`: text NULL
- `cnpj_nome_fantasia`: text NULL
- `cnpj_situacao`: text NULL
- `cnpj_atividade_principal`: text NULL
- `cnpj_data_abertura`: text NULL
- `cnpj_capital_social`: text NULL
- `cnpj_natureza_juridica`: text NULL
- `cnpj_qsa`: jsonb NULL
- `cnpj_last_updated`: timestamp without time zone NULL
- `website_title`: text NULL
- `website_description`: text NULL
- `website_keywords`: ARRAY NULL
- `website_last_updated`: timestamp without time zone NULL
- `enrichment_score`: integer NULL
- `last_enriched_at`: timestamp without time zone NULL
- `website_content`: text NULL
- `website_about`: text NULL
- `website_faq`: jsonb NULL
- `website_pages`: jsonb NULL
- `website_social_links`: jsonb NULL
- `ecommerce_products`: jsonb NULL
- `ecommerce_product_count`: integer NULL
- `ecommerce_categories`: ARRAY NULL
- `ecommerce_platform`: text NULL
- `ecommerce_last_updated`: timestamp without time zone NULL
- `ai_context_summary`: text NULL
- `ai_context_last_updated`: timestamp without time zone NULL

Primary Keys:
- `companies_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `companies_created_by_user_id_users_id_fk`: FOREIGN KEY (created_by_user_id) REFERENCES core.users(id)

### `company.company_members`

Columns:
- `id`: integer NOT NULL
- `company_id`: integer NOT NULL
- `user_id`: integer NOT NULL
- `role`: text NOT NULL
- `created_at`: timestamp without time zone NOT NULL DEFAULT now()

Primary Keys:
- `company_members_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `company_members_company_id_companies_id_fk`: FOREIGN KEY (company_id) REFERENCES company.companies(id)
- `company_members_user_id_users_id_fk`: FOREIGN KEY (user_id) REFERENCES core.users(id)

### `company.company_user_invites`

Columns:
- `id`: integer NOT NULL
- `company_id`: integer NOT NULL
- `email`: text NOT NULL
- `role`: text NOT NULL
- `token`: text NOT NULL
- `invited_by_user_id`: integer NOT NULL
- `status`: text NOT NULL DEFAULT 'pending'::text
- `expires_at`: timestamp without time zone NOT NULL
- `accepted_by_user_id`: integer NULL
- `accepted_at`: timestamp without time zone NULL
- `created_at`: timestamp without time zone NOT NULL DEFAULT now()

Primary Keys:
- `company_user_invites_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `company_user_invites_accepted_by_user_id_users_id_fk`: FOREIGN KEY (accepted_by_user_id) REFERENCES core.users(id)
- `company_user_invites_company_id_companies_id_fk`: FOREIGN KEY (company_id) REFERENCES company.companies(id)
- `company_user_invites_invited_by_user_id_users_id_fk`: FOREIGN KEY (invited_by_user_id) REFERENCES core.users(id)

### `content.blog_posts`

Columns:
- `id`: integer NOT NULL
- `slug`: text NOT NULL
- `type`: text NOT NULL DEFAULT 'article'::text
- `category`: text NOT NULL DEFAULT 'dicas'::text
- `title`: text NOT NULL
- `excerpt`: text NOT NULL
- `content`: text NOT NULL
- `image`: text NULL
- `author`: text NOT NULL DEFAULT 'CreatorConnect'::text
- `author_avatar`: text NULL
- `read_time`: text NULL
- `featured`: boolean NULL DEFAULT false
- `published`: boolean NULL DEFAULT false
- `meta_title`: text NULL
- `meta_description`: text NULL
- `meta_keywords`: ARRAY NULL
- `canonical_url`: text NULL
- `og_image`: text NULL
- `structured_data`: jsonb NULL
- `company`: text NULL
- `metric_value`: text NULL
- `metric_label`: text NULL
- `created_at`: timestamp without time zone NOT NULL DEFAULT now()
- `updated_at`: timestamp without time zone NOT NULL DEFAULT now()

Primary Keys:
- `blog_posts_pkey`: PRIMARY KEY (id)

### `content.campaign_inspirations`

Columns:
- `id`: integer NOT NULL
- `campaign_id`: integer NOT NULL
- `inspiration_id`: integer NOT NULL
- `created_at`: timestamp without time zone NOT NULL DEFAULT now()

Primary Keys:
- `campaign_inspirations_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `campaign_inspirations_campaign_id_campaigns_id_fk`: FOREIGN KEY (campaign_id) REFERENCES campaign.campaigns(id) ON DELETE CASCADE
- `campaign_inspirations_inspiration_id_inspirations_id_fk`: FOREIGN KEY (inspiration_id) REFERENCES content.inspirations(id) ON DELETE CASCADE

### `content.creator_saved_inspirations`

Columns:
- `id`: integer NOT NULL
- `creator_id`: integer NOT NULL
- `inspiration_id`: integer NOT NULL
- `created_at`: timestamp without time zone NOT NULL DEFAULT now()

Primary Keys:
- `creator_saved_inspirations_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `creator_saved_inspirations_creator_id_users_id_fk`: FOREIGN KEY (creator_id) REFERENCES core.users(id) ON DELETE CASCADE
- `creator_saved_inspirations_inspiration_id_inspirations_id_fk`: FOREIGN KEY (inspiration_id) REFERENCES content.inspirations(id) ON DELETE CASCADE

### `content.inspiration_collection_items`

Columns:
- `id`: integer NOT NULL
- `collection_id`: integer NOT NULL
- `inspiration_id`: integer NOT NULL
- `created_at`: timestamp without time zone NOT NULL DEFAULT now()

Primary Keys:
- `inspiration_collection_items_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `inspiration_collection_items_collection_id_inspiration_collecti`: FOREIGN KEY (collection_id) REFERENCES content.inspiration_collections(id) ON DELETE CASCADE
- `inspiration_collection_items_inspiration_id_inspirations_id_fk`: FOREIGN KEY (inspiration_id) REFERENCES content.inspirations(id) ON DELETE CASCADE

### `content.inspiration_collections`

Columns:
- `id`: integer NOT NULL
- `creator_id`: integer NOT NULL
- `title`: text NOT NULL
- `created_at`: timestamp without time zone NOT NULL DEFAULT now()

Primary Keys:
- `inspiration_collections_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `inspiration_collections_creator_id_users_id_fk`: FOREIGN KEY (creator_id) REFERENCES core.users(id) ON DELETE CASCADE

### `content.inspirations`

Columns:
- `id`: integer NOT NULL
- `title`: text NOT NULL
- `description`: text NULL
- `platform`: text NOT NULL
- `format`: text NOT NULL
- `url`: text NOT NULL
- `thumbnail_url`: text NULL
- `tags`: ARRAY NOT NULL DEFAULT '{}'::text[]
- `niche_tags`: ARRAY NOT NULL DEFAULT '{}'::text[]
- `created_by_user_id`: integer NULL
- `created_at`: timestamp without time zone NOT NULL DEFAULT now()
- `scope`: text NOT NULL DEFAULT 'global'::text
- `brand_id`: integer NULL
- `is_published`: boolean NOT NULL DEFAULT true

Primary Keys:
- `inspirations_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `inspirations_brand_id_companies_id_fk`: FOREIGN KEY (brand_id) REFERENCES company.companies(id) ON DELETE CASCADE
- `inspirations_created_by_user_id_users_id_fk`: FOREIGN KEY (created_by_user_id) REFERENCES core.users(id)

### `core.users`

Columns:
- `id`: integer NOT NULL
- `password`: text NULL
- `role`: text NOT NULL
- `name`: text NOT NULL
- `email`: text NOT NULL
- `avatar`: text NULL
- `bio`: text NULL
- `niche`: ARRAY NULL
- `instagram`: text NULL
- `youtube`: text NULL
- `tiktok`: text NULL
- `cpf`: text NULL
- `phone`: text NULL
- `company_name`: text NULL
- `followers`: text NULL
- `is_verified`: boolean NOT NULL DEFAULT false
- `verification_token`: text NULL
- `pix_key`: text NULL
- `cep`: text NULL
- `street`: text NULL
- `number`: text NULL
- `neighborhood`: text NULL
- `city`: text NULL
- `state`: text NULL
- `complement`: text NULL
- `google_id`: text NULL
- `instagram_followers`: integer NULL
- `instagram_following`: integer NULL
- `instagram_posts`: integer NULL
- `instagram_engagement_rate`: text NULL
- `instagram_authenticity_score`: integer NULL
- `instagram_top_hashtags`: ARRAY NULL
- `instagram_last_updated`: timestamp without time zone NULL
- `instagram_verified`: boolean NULL
- `is_banned`: boolean NOT NULL DEFAULT false
- `gender`: text NULL
- `portfolio_url`: text NULL
- `reset_token`: text NULL
- `reset_token_expiry`: timestamp without time zone NULL
- `date_of_birth`: date NULL
- `created_at`: timestamp without time zone NOT NULL DEFAULT now()
- `instagram_top_posts`: jsonb NULL
- `instagram_bio`: text NULL
- `instagram_profile_pic`: text NULL
- `tiktok_followers`: integer NULL
- `tiktok_following`: integer NULL
- `tiktok_hearts`: integer NULL
- `tiktok_videos`: integer NULL
- `tiktok_engagement_rate`: text NULL
- `tiktok_verified`: boolean NULL
- `tiktok_bio`: text NULL
- `tiktok_profile_pic`: text NULL
- `tiktok_top_videos`: jsonb NULL
- `tiktok_last_updated`: timestamp without time zone NULL
- `youtube_subscribers`: integer NULL
- `youtube_total_views`: integer NULL
- `youtube_videos_count`: integer NULL
- `youtube_verified`: boolean NULL
- `youtube_channel_id`: text NULL
- `youtube_description`: text NULL
- `youtube_thumbnail`: text NULL
- `youtube_top_videos`: jsonb NULL
- `youtube_last_updated`: timestamp without time zone NULL
- `enrichment_score`: integer NULL
- `last_enriched_at`: timestamp without time zone NULL
- `enrichment_source`: text NULL

Primary Keys:
- `users_pkey`: PRIMARY KEY (id)

### `creator.creator_ad_partners`

Columns:
- `id`: integer NOT NULL
- `company_id`: integer NOT NULL
- `creator_id`: integer NULL
- `instagram_account_id`: integer NULL
- `instagram_user_id`: text NULL
- `instagram_username`: text NULL
- `instagram_profile_pic`: text NULL
- `status`: text NULL DEFAULT 'pending'::text
- `authorized_at`: timestamp without time zone NULL
- `expires_at`: timestamp without time zone NULL
- `permissions`: ARRAY NULL
- `meta_partner_id`: text NULL
- `created_at`: timestamp without time zone NULL DEFAULT now()
- `updated_at`: timestamp without time zone NULL DEFAULT now()

Primary Keys:
- `creator_ad_partners_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `creator_ad_partners_company_id_companies_id_fk`: FOREIGN KEY (company_id) REFERENCES company.companies(id) ON DELETE CASCADE
- `creator_ad_partners_creator_id_users_id_fk`: FOREIGN KEY (creator_id) REFERENCES core.users(id) ON DELETE CASCADE
- `creator_ad_partners_instagram_account_id_instagram_accounts_id_`: FOREIGN KEY (instagram_account_id) REFERENCES social.instagram_accounts(id)

### `creator.creator_addresses`

Columns:
- `id`: integer NOT NULL
- `creator_id`: integer NOT NULL
- `label`: text NULL DEFAULT 'principal'::text
- `recipient_name`: text NOT NULL
- `street`: text NOT NULL
- `number`: text NOT NULL
- `complement`: text NULL
- `neighborhood`: text NOT NULL
- `city`: text NOT NULL
- `state`: text NOT NULL
- `zip_code`: text NOT NULL
- `country`: text NULL DEFAULT 'Brasil'::text
- `phone`: text NULL
- `is_default`: boolean NULL DEFAULT true
- `created_at`: timestamp without time zone NOT NULL DEFAULT now()
- `updated_at`: timestamp without time zone NOT NULL DEFAULT now()

Primary Keys:
- `creator_addresses_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `creator_addresses_creator_id_users_id_fk`: FOREIGN KEY (creator_id) REFERENCES core.users(id) ON DELETE CASCADE

### `creator.creator_auth_links`

Columns:
- `id`: integer NOT NULL
- `company_id`: integer NOT NULL
- `creator_id`: integer NULL
- `token`: text NOT NULL
- `instagram_username`: text NULL
- `email`: text NULL
- `is_used`: boolean NULL DEFAULT false
- `used_at`: timestamp without time zone NULL
- `expires_at`: timestamp without time zone NOT NULL
- `redirect_url`: text NULL
- `created_at`: timestamp without time zone NULL DEFAULT now()

Primary Keys:
- `creator_auth_links_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `creator_auth_links_company_id_companies_id_fk`: FOREIGN KEY (company_id) REFERENCES company.companies(id) ON DELETE CASCADE
- `creator_auth_links_creator_id_users_id_fk`: FOREIGN KEY (creator_id) REFERENCES core.users(id)

### `creator.creator_discovery_profiles`

Columns:
- `id`: integer NOT NULL
- `company_id`: integer NOT NULL
- `instagram_handle`: text NOT NULL
- `display_name`: text NULL
- `avatar_url`: text NULL
- `bio`: text NULL
- `followers`: integer NULL
- `following`: integer NULL
- `posts`: integer NULL
- `engagement_rate`: text NULL
- `niche_tags`: ARRAY NULL DEFAULT '{}'::text[]
- `location`: text NULL
- `source`: text NOT NULL DEFAULT 'manual'::text
- `linked_creator_id`: integer NULL
- `last_fetched_at`: timestamp without time zone NULL
- `created_at`: timestamp without time zone NOT NULL DEFAULT now()

Primary Keys:
- `creator_discovery_profiles_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `creator_discovery_profiles_company_id_companies_id_fk`: FOREIGN KEY (company_id) REFERENCES company.companies(id) ON DELETE CASCADE
- `creator_discovery_profiles_linked_creator_id_users_id_fk`: FOREIGN KEY (linked_creator_id) REFERENCES core.users(id)

### `creator.creator_hashtags`

Columns:
- `id`: integer NOT NULL
- `user_id`: integer NOT NULL
- `platform`: text NOT NULL
- `hashtag`: text NOT NULL
- `usage_count`: integer NULL DEFAULT 1
- `avg_engagement`: text NULL
- `last_used`: timestamp without time zone NULL

Primary Keys:
- `creator_hashtags_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `creator_hashtags_user_id_users_id_fk`: FOREIGN KEY (user_id) REFERENCES core.users(id)

### `creator.creator_posts`

Columns:
- `id`: integer NOT NULL
- `user_id`: integer NOT NULL
- `platform`: text NOT NULL
- `post_id`: text NOT NULL
- `post_url`: text NOT NULL
- `post_type`: text NULL
- `caption`: text NULL
- `thumbnail_url`: text NULL
- `likes`: integer NULL DEFAULT 0
- `comments`: integer NULL DEFAULT 0
- `shares`: integer NULL DEFAULT 0
- `views`: integer NULL DEFAULT 0
- `saves`: integer NULL DEFAULT 0
- `engagement_rate`: text NULL
- `hashtags`: ARRAY NULL
- `mentions`: ARRAY NULL
- `posted_at`: timestamp without time zone NULL
- `analyzed_at`: timestamp without time zone NOT NULL DEFAULT now()
- `ai_analysis`: text NULL

Primary Keys:
- `creator_posts_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `creator_posts_user_id_users_id_fk`: FOREIGN KEY (user_id) REFERENCES core.users(id)

### `creator.creator_tags`

Columns:
- `id`: integer NOT NULL
- `creator_id`: integer NOT NULL
- `tag_id`: integer NOT NULL
- `created_at`: timestamp without time zone NOT NULL DEFAULT now()

Primary Keys:
- `creator_tags_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `creator_tags_creator_id_users_id_fk`: FOREIGN KEY (creator_id) REFERENCES core.users(id) ON DELETE CASCADE
- `creator_tags_tag_id_tags_id_fk`: FOREIGN KEY (tag_id) REFERENCES system.tags(id) ON DELETE CASCADE

### `gamification.badges`

Columns:
- `id`: integer NOT NULL
- `name`: text NOT NULL
- `description`: text NULL
- `icon`: text NOT NULL
- `color`: text NULL
- `requirement`: text NOT NULL
- `required_value`: integer NULL
- `is_secret`: boolean NOT NULL DEFAULT false
- `created_at`: timestamp without time zone NULL DEFAULT now()

Primary Keys:
- `badges_pkey`: PRIMARY KEY (id)

### `gamification.brand_programs`

Columns:
- `id`: integer NOT NULL
- `company_id`: integer NOT NULL
- `name`: text NULL DEFAULT 'Programa de Creators'::text
- `description`: text NULL
- `auto_join_community`: boolean NOT NULL DEFAULT true
- `coupon_prefix`: text NULL
- `coupon_generation_rule`: text NULL DEFAULT 'prefix_username'::text
- `requirements_json`: jsonb NULL
- `gamification_enabled`: boolean NOT NULL DEFAULT true
- `default_reward_mode`: text NULL DEFAULT 'ranking'::text
- `created_at`: timestamp without time zone NOT NULL DEFAULT now()
- `updated_at`: timestamp without time zone NOT NULL DEFAULT now()

Primary Keys:
- `brand_programs_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `brand_programs_company_id_companies_id_fk`: FOREIGN KEY (company_id) REFERENCES company.companies(id) ON DELETE CASCADE

### `gamification.brand_rewards`

Columns:
- `id`: integer NOT NULL
- `company_id`: integer NOT NULL
- `name`: text NOT NULL
- `description`: text NULL
- `type`: text NOT NULL
- `value`: integer NULL
- `image_url`: text NULL
- `sku`: text NULL
- `stock`: integer NULL
- `is_active`: boolean NOT NULL DEFAULT true
- `tier_required`: integer NULL
- `points_cost`: integer NULL
- `created_at`: timestamp without time zone NOT NULL DEFAULT now()
- `updated_at`: timestamp without time zone NOT NULL DEFAULT now()

Primary Keys:
- `brand_rewards_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `brand_rewards_company_id_companies_id_fk`: FOREIGN KEY (company_id) REFERENCES company.companies(id) ON DELETE CASCADE

### `gamification.brand_tier_configs`

Columns:
- `id`: integer NOT NULL
- `company_id`: integer NOT NULL
- `tier_name`: text NOT NULL
- `min_points`: integer NOT NULL DEFAULT 0
- `color`: text NULL
- `icon`: text NULL
- `benefits_json`: jsonb NULL
- `sort_order`: integer NOT NULL DEFAULT 0
- `created_at`: timestamp without time zone NOT NULL DEFAULT now()
- `updated_at`: timestamp without time zone NOT NULL DEFAULT now()

Primary Keys:
- `brand_tier_configs_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `brand_tier_configs_company_id_companies_id_fk`: FOREIGN KEY (company_id) REFERENCES company.companies(id) ON DELETE CASCADE

### `gamification.creator_badges`

Columns:
- `id`: integer NOT NULL
- `creator_id`: integer NOT NULL
- `badge_id`: integer NOT NULL
- `earned_at`: timestamp without time zone NULL DEFAULT now()

Primary Keys:
- `creator_badges_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `creator_badges_badge_id_badges_id_fk`: FOREIGN KEY (badge_id) REFERENCES gamification.badges(id)
- `creator_badges_creator_id_users_id_fk`: FOREIGN KEY (creator_id) REFERENCES core.users(id)

### `gamification.creator_levels`

Columns:
- `id`: integer NOT NULL
- `name`: text NOT NULL
- `min_points`: integer NOT NULL
- `max_points`: integer NULL
- `icon`: text NULL
- `color`: text NULL
- `benefits`: ARRAY NULL

Primary Keys:
- `creator_levels_pkey`: PRIMARY KEY (id)

### `gamification.creator_points`

Columns:
- `id`: integer NOT NULL
- `creator_id`: integer NOT NULL
- `points`: integer NOT NULL
- `action`: text NOT NULL
- `description`: text NULL
- `related_id`: integer NULL
- `created_at`: timestamp without time zone NULL DEFAULT now()
- `category`: text NOT NULL DEFAULT 'achievement'::text

Primary Keys:
- `creator_points_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `creator_points_creator_id_users_id_fk`: FOREIGN KEY (creator_id) REFERENCES core.users(id)

### `gamification.points_ledger`

Columns:
- `id`: integer NOT NULL
- `company_id`: integer NOT NULL
- `campaign_id`: integer NULL
- `creator_id`: integer NOT NULL
- `delta_points`: integer NOT NULL
- `ref_type`: text NULL
- `ref_id`: integer NULL
- `notes`: text NULL
- `created_at`: timestamp without time zone NOT NULL DEFAULT now()
- `event_type`: text NOT NULL
- `event_ref_id`: text NULL
- `metadata`: jsonb NULL

Primary Keys:
- `points_ledger_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `points_ledger_campaign_id_campaigns_id_fk`: FOREIGN KEY (campaign_id) REFERENCES campaign.campaigns(id) ON DELETE CASCADE
- `points_ledger_company_id_companies_id_fk`: FOREIGN KEY (company_id) REFERENCES company.companies(id) ON DELETE CASCADE
- `points_ledger_creator_id_users_id_fk`: FOREIGN KEY (creator_id) REFERENCES core.users(id)

### `gamification.reward_entitlements`

Columns:
- `id`: integer NOT NULL
- `company_id`: integer NOT NULL
- `campaign_id`: integer NOT NULL
- `creator_id`: integer NOT NULL
- `prize_id`: integer NOT NULL
- `source_type`: text NOT NULL
- `points_at_time`: integer NULL
- `rank_at_time`: integer NULL
- `reward_kind`: text NOT NULL
- `cash_amount`: integer NULL
- `product_sku`: text NULL
- `product_description`: text NULL
- `status`: text NOT NULL DEFAULT 'pending'::text
- `wallet_transaction_id`: integer NULL
- `shipment_id`: integer NULL
- `approved_by`: integer NULL
- `approved_at`: timestamp without time zone NULL
- `rejected_by`: integer NULL
- `rejected_at`: timestamp without time zone NULL
- `rejection_reason`: text NULL
- `notes`: text NULL
- `created_at`: timestamp without time zone NOT NULL DEFAULT now()
- `updated_at`: timestamp without time zone NOT NULL DEFAULT now()

Primary Keys:
- `reward_entitlements_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `reward_entitlements_approved_by_users_id_fk`: FOREIGN KEY (approved_by) REFERENCES core.users(id)
- `reward_entitlements_campaign_id_campaigns_id_fk`: FOREIGN KEY (campaign_id) REFERENCES campaign.campaigns(id) ON DELETE CASCADE
- `reward_entitlements_company_id_companies_id_fk`: FOREIGN KEY (company_id) REFERENCES company.companies(id) ON DELETE CASCADE
- `reward_entitlements_creator_id_users_id_fk`: FOREIGN KEY (creator_id) REFERENCES core.users(id)
- `reward_entitlements_prize_id_campaign_prizes_id_fk`: FOREIGN KEY (prize_id) REFERENCES campaign.campaign_prizes(id) ON DELETE CASCADE
- `reward_entitlements_rejected_by_users_id_fk`: FOREIGN KEY (rejected_by) REFERENCES core.users(id)
- `reward_entitlements_wallet_transaction_id_wallet_transactions_i`: FOREIGN KEY (wallet_transaction_id) REFERENCES billing.wallet_transactions(id)

### `messaging.conv_messages`

Columns:
- `id`: integer NOT NULL
- `conversation_id`: integer NOT NULL
- `sender_user_id`: integer NOT NULL
- `body`: text NOT NULL
- `created_at`: timestamp without time zone NOT NULL DEFAULT now()

Primary Keys:
- `conv_messages_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `conv_messages_conversation_id_conversations_id_fk`: FOREIGN KEY (conversation_id) REFERENCES messaging.conversations(id) ON DELETE CASCADE
- `conv_messages_sender_user_id_users_id_fk`: FOREIGN KEY (sender_user_id) REFERENCES core.users(id)

### `messaging.conversations`

Columns:
- `id`: integer NOT NULL
- `type`: text NOT NULL
- `brand_id`: integer NULL
- `campaign_id`: integer NULL
- `creator_id`: integer NOT NULL
- `company_id`: integer NOT NULL
- `last_message_at`: timestamp without time zone NULL
- `created_at`: timestamp without time zone NOT NULL DEFAULT now()
- `status`: text NOT NULL DEFAULT 'open'::text

Primary Keys:
- `conversations_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `conversations_brand_id_companies_id_fk`: FOREIGN KEY (brand_id) REFERENCES company.companies(id) ON DELETE CASCADE
- `conversations_campaign_id_campaigns_id_fk`: FOREIGN KEY (campaign_id) REFERENCES campaign.campaigns(id) ON DELETE CASCADE
- `conversations_company_id_companies_id_fk`: FOREIGN KEY (company_id) REFERENCES company.companies(id) ON DELETE CASCADE
- `conversations_creator_id_users_id_fk`: FOREIGN KEY (creator_id) REFERENCES core.users(id) ON DELETE CASCADE

### `messaging.message_reads`

Columns:
- `id`: integer NOT NULL
- `conversation_id`: integer NOT NULL
- `user_id`: integer NOT NULL
- `last_read_at`: timestamp without time zone NOT NULL DEFAULT now()

Primary Keys:
- `message_reads_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `message_reads_conversation_id_conversations_id_fk`: FOREIGN KEY (conversation_id) REFERENCES messaging.conversations(id) ON DELETE CASCADE
- `message_reads_user_id_users_id_fk`: FOREIGN KEY (user_id) REFERENCES core.users(id) ON DELETE CASCADE

### `misc.community_invites`

Columns:
- `id`: integer NOT NULL
- `company_id`: integer NOT NULL
- `creator_id`: integer NULL
- `email`: text NULL
- `token`: text NOT NULL
- `status`: text NOT NULL DEFAULT 'sent'::text
- `campaign_id`: integer NULL
- `metadata`: jsonb NULL
- `expires_at`: timestamp without time zone NOT NULL
- `opened_at`: timestamp without time zone NULL
- `accepted_at`: timestamp without time zone NULL
- `created_by_user_id`: integer NULL
- `created_at`: timestamp without time zone NOT NULL DEFAULT now()
- `creator_handle`: text NULL

Primary Keys:
- `community_invites_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `community_invites_campaign_id_campaigns_id_fk`: FOREIGN KEY (campaign_id) REFERENCES campaign.campaigns(id)
- `community_invites_company_id_companies_id_fk`: FOREIGN KEY (company_id) REFERENCES company.companies(id) ON DELETE CASCADE
- `community_invites_created_by_user_id_users_id_fk`: FOREIGN KEY (created_by_user_id) REFERENCES core.users(id)
- `community_invites_creator_id_users_id_fk`: FOREIGN KEY (creator_id) REFERENCES core.users(id)

### `misc.contact_notes`

Columns:
- `id`: integer NOT NULL
- `company_id`: integer NOT NULL
- `instagram_username`: text NOT NULL
- `content`: text NOT NULL
- `created_by`: integer NOT NULL
- `created_at`: timestamp without time zone NOT NULL DEFAULT now()
- `updated_at`: timestamp without time zone NOT NULL DEFAULT now()

Primary Keys:
- `contact_notes_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `contact_notes_company_id_companies_id_fk`: FOREIGN KEY (company_id) REFERENCES company.companies(id) ON DELETE CASCADE
- `contact_notes_created_by_users_id_fk`: FOREIGN KEY (created_by) REFERENCES core.users(id)

### `misc.favorite_companies`

Columns:
- `id`: integer NOT NULL
- `creator_id`: integer NOT NULL
- `company_id`: integer NOT NULL
- `created_at`: timestamp without time zone NOT NULL DEFAULT now()

Primary Keys:
- `favorite_companies_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `favorite_companies_company_id_companies_id_fk`: FOREIGN KEY (company_id) REFERENCES company.companies(id)
- `favorite_companies_creator_id_users_id_fk`: FOREIGN KEY (creator_id) REFERENCES core.users(id)

### `misc.favorite_creators`

Columns:
- `id`: integer NOT NULL
- `company_id`: integer NOT NULL
- `creator_id`: integer NOT NULL
- `created_at`: timestamp without time zone NOT NULL DEFAULT now()

Primary Keys:
- `favorite_creators_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `favorite_creators_company_id_companies_id_fk`: FOREIGN KEY (company_id) REFERENCES company.companies(id)
- `favorite_creators_creator_id_users_id_fk`: FOREIGN KEY (creator_id) REFERENCES core.users(id)

### `misc.hashtag_posts`

Columns:
- `id`: integer NOT NULL
- `campaign_hashtag_id`: integer NOT NULL
- `company_id`: integer NOT NULL
- `media_id`: text NOT NULL
- `media_type`: text NULL
- `caption`: text NULL
- `permalink`: text NULL
- `media_url`: text NULL
- `thumbnail_url`: text NULL
- `like_count`: integer NULL
- `comments_count`: integer NULL
- `timestamp`: timestamp without time zone NULL
- `username`: text NULL
- `source`: text NOT NULL DEFAULT 'recent'::text
- `discovered_at`: timestamp without time zone NOT NULL DEFAULT now()

Primary Keys:
- `hashtag_posts_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `hashtag_posts_campaign_hashtag_id_campaign_hashtags_id_fk`: FOREIGN KEY (campaign_hashtag_id) REFERENCES campaign.campaign_hashtags(id)
- `hashtag_posts_company_id_companies_id_fk`: FOREIGN KEY (company_id) REFERENCES company.companies(id)

### `misc.hashtag_searches`

Columns:
- `id`: integer NOT NULL
- `company_id`: integer NOT NULL
- `instagram_user_id`: text NOT NULL
- `hashtag`: text NOT NULL
- `hashtag_id`: text NULL
- `searched_at`: timestamp without time zone NOT NULL DEFAULT now()

Primary Keys:
- `hashtag_searches_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `hashtag_searches_company_id_companies_id_fk`: FOREIGN KEY (company_id) REFERENCES company.companies(id)

### `misc.post_ai_insights`

Columns:
- `id`: integer NOT NULL
- `user_id`: integer NOT NULL
- `post_id`: integer NOT NULL
- `platform`: text NOT NULL
- `summary`: text NOT NULL
- `strengths`: jsonb NULL
- `improvements`: jsonb NULL
- `hashtags`: jsonb NULL
- `best_time_to_post`: text NULL
- `audience_insights`: text NULL
- `content_score`: integer NULL
- `engagement_prediction`: text NULL
- `recommendations`: jsonb NULL
- `created_at`: timestamp without time zone NOT NULL DEFAULT now()
- `updated_at`: timestamp without time zone NOT NULL DEFAULT now()

Primary Keys:
- `post_ai_insights_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `post_ai_insights_post_id_creator_posts_id_fk`: FOREIGN KEY (post_id) REFERENCES creator.creator_posts(id)
- `post_ai_insights_user_id_users_id_fk`: FOREIGN KEY (user_id) REFERENCES core.users(id)

### `misc.problem_reports`

Columns:
- `id`: integer NOT NULL
- `user_id`: integer NOT NULL
- `subject`: text NOT NULL
- `description`: text NOT NULL
- `status`: text NOT NULL DEFAULT 'open'::text
- `created_at`: timestamp without time zone NOT NULL DEFAULT now()
- `admin_notes`: text NULL
- `updated_at`: timestamp without time zone NOT NULL DEFAULT now()

Primary Keys:
- `problem_reports_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `problem_reports_user_id_users_id_fk`: FOREIGN KEY (user_id) REFERENCES core.users(id)

### `misc.workflow_stages`

Columns:
- `id`: integer NOT NULL
- `company_id`: integer NOT NULL
- `name`: text NOT NULL
- `color`: text NOT NULL DEFAULT '#6366f1'::text
- `position`: integer NOT NULL
- `is_default`: boolean NOT NULL DEFAULT false
- `created_at`: timestamp without time zone NOT NULL DEFAULT now()

Primary Keys:
- `workflow_stages_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `workflow_stages_company_id_companies_id_fk`: FOREIGN KEY (company_id) REFERENCES company.companies(id) ON DELETE CASCADE

### `social.dm_send_logs`

Columns:
- `id`: integer NOT NULL
- `company_id`: integer NOT NULL
- `template_id`: integer NULL
- `instagram_account_id`: integer NULL
- `recipient_username`: text NOT NULL
- `recipient_ig_id`: text NULL
- `campaign_id`: integer NULL
- `message_content`: text NOT NULL
- `status`: text NOT NULL DEFAULT 'pending'::text
- `error_message`: text NULL
- `sent_at`: timestamp without time zone NULL
- `created_at`: timestamp without time zone NOT NULL DEFAULT now()

Primary Keys:
- `dm_send_logs_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `dm_send_logs_campaign_id_campaigns_id_fk`: FOREIGN KEY (campaign_id) REFERENCES campaign.campaigns(id) ON DELETE SET NULL
- `dm_send_logs_company_id_companies_id_fk`: FOREIGN KEY (company_id) REFERENCES company.companies(id) ON DELETE CASCADE
- `dm_send_logs_instagram_account_id_instagram_accounts_id_fk`: FOREIGN KEY (instagram_account_id) REFERENCES social.instagram_accounts(id)
- `dm_send_logs_template_id_dm_templates_id_fk`: FOREIGN KEY (template_id) REFERENCES social.dm_templates(id) ON DELETE SET NULL

### `social.dm_templates`

Columns:
- `id`: integer NOT NULL
- `company_id`: integer NOT NULL
- `name`: text NOT NULL
- `type`: text NOT NULL DEFAULT 'custom'::text
- `content`: text NOT NULL
- `variables`: ARRAY NULL DEFAULT '{}'::text[]
- `is_default`: boolean NULL DEFAULT false
- `created_by`: integer NULL
- `created_at`: timestamp without time zone NOT NULL DEFAULT now()
- `updated_at`: timestamp without time zone NOT NULL DEFAULT now()

Primary Keys:
- `dm_templates_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `dm_templates_company_id_companies_id_fk`: FOREIGN KEY (company_id) REFERENCES company.companies(id) ON DELETE CASCADE
- `dm_templates_created_by_users_id_fk`: FOREIGN KEY (created_by) REFERENCES core.users(id)

### `social.instagram_accounts`

Columns:
- `id`: integer NOT NULL
- `user_id`: integer NULL
- `company_id`: integer NULL
- `instagram_user_id`: text NOT NULL
- `username`: text NOT NULL
- `name`: text NULL
- `profile_picture_url`: text NULL
- `account_type`: text NOT NULL
- `access_token`: text NOT NULL
- `access_token_expires_at`: timestamp without time zone NULL
- `refresh_token`: text NULL
- `scopes`: ARRAY NULL
- `followers_count`: integer NULL
- `follows_count`: integer NULL
- `media_count`: integer NULL
- `biography`: text NULL
- `website`: text NULL
- `is_active`: boolean NULL DEFAULT true
- `last_sync_at`: timestamp without time zone NULL
- `created_at`: timestamp without time zone NULL DEFAULT now()
- `updated_at`: timestamp without time zone NULL DEFAULT now()
- `facebook_user_id`: text NULL

Primary Keys:
- `instagram_accounts_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `instagram_accounts_company_id_companies_id_fk`: FOREIGN KEY (company_id) REFERENCES company.companies(id) ON DELETE CASCADE
- `instagram_accounts_user_id_users_id_fk`: FOREIGN KEY (user_id) REFERENCES core.users(id) ON DELETE CASCADE

### `social.instagram_contacts`

Columns:
- `id`: integer NOT NULL
- `company_id`: integer NOT NULL
- `instagram_user_id`: text NULL
- `username`: text NOT NULL
- `full_name`: text NULL
- `profile_pic_url`: text NULL
- `instagram_profile_id`: integer NULL
- `user_id`: integer NULL
- `total_dms_received`: integer NULL DEFAULT 0
- `total_dms_sent`: integer NULL DEFAULT 0
- `total_comments_on_posts`: integer NULL DEFAULT 0
- `total_mentions`: integer NULL DEFAULT 0
- `total_story_replies`: integer NULL DEFAULT 0
- `total_tagged_posts`: integer NULL DEFAULT 0
- `interaction_score`: integer NULL DEFAULT 0
- `first_interaction_at`: timestamp without time zone NULL
- `last_interaction_at`: timestamp without time zone NULL
- `status`: text NULL DEFAULT 'lead'::text
- `tags`: ARRAY NULL
- `notes`: text NULL
- `followers`: integer NULL
- `is_verified`: boolean NULL DEFAULT false
- `bio`: text NULL
- `created_at`: timestamp without time zone NULL DEFAULT now()
- `updated_at`: timestamp without time zone NULL DEFAULT now()

Primary Keys:
- `instagram_contacts_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `instagram_contacts_company_id_companies_id_fk`: FOREIGN KEY (company_id) REFERENCES company.companies(id) ON DELETE CASCADE
- `instagram_contacts_instagram_profile_id_instagram_profiles_id_f`: FOREIGN KEY (instagram_profile_id) REFERENCES social.instagram_profiles(id) ON DELETE SET NULL
- `instagram_contacts_user_id_users_id_fk`: FOREIGN KEY (user_id) REFERENCES core.users(id) ON DELETE SET NULL

### `social.instagram_interactions`

Columns:
- `id`: integer NOT NULL
- `contact_id`: integer NOT NULL
- `company_id`: integer NOT NULL
- `type`: text NOT NULL
- `reference_id`: text NULL
- `content_preview`: text NULL
- `metadata`: jsonb NULL
- `occurred_at`: timestamp without time zone NOT NULL
- `created_at`: timestamp without time zone NULL DEFAULT now()

Primary Keys:
- `instagram_interactions_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `instagram_interactions_company_id_companies_id_fk`: FOREIGN KEY (company_id) REFERENCES company.companies(id) ON DELETE CASCADE
- `instagram_interactions_contact_id_instagram_contacts_id_fk`: FOREIGN KEY (contact_id) REFERENCES social.instagram_contacts(id) ON DELETE CASCADE

### `social.instagram_messages`

Columns:
- `id`: integer NOT NULL
- `instagram_account_id`: integer NOT NULL
- `conversation_id`: text NOT NULL
- `message_id`: text NOT NULL
- `sender_id`: text NOT NULL
- `sender_username`: text NULL
- `recipient_id`: text NOT NULL
- `recipient_username`: text NULL
- `message_text`: text NULL
- `message_type`: text NULL
- `attachments`: jsonb NULL
- `is_incoming`: boolean NULL DEFAULT true
- `is_read`: boolean NULL DEFAULT false
- `sent_at`: timestamp without time zone NULL
- `created_at`: timestamp without time zone NULL DEFAULT now()
- `sender_profile_pic`: text NULL

Primary Keys:
- `instagram_messages_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `instagram_messages_instagram_account_id_instagram_accounts_id_f`: FOREIGN KEY (instagram_account_id) REFERENCES social.instagram_accounts(id) ON DELETE CASCADE

### `social.instagram_posts`

Columns:
- `id`: integer NOT NULL
- `instagram_account_id`: integer NOT NULL
- `instagram_media_id`: text NOT NULL
- `media_type`: text NULL
- `media_url`: text NULL
- `thumbnail_url`: text NULL
- `permalink`: text NULL
- `caption`: text NULL
- `timestamp`: timestamp without time zone NULL
- `like_count`: integer NULL DEFAULT 0
- `comments_count`: integer NULL DEFAULT 0
- `reach_count`: integer NULL
- `impressions_count`: integer NULL
- `saved_count`: integer NULL
- `shares_count`: integer NULL
- `is_collab_post`: boolean NULL DEFAULT false
- `collab_partners`: ARRAY NULL
- `mentioned_accounts`: ARRAY NULL
- `hashtags`: ARRAY NULL
- `created_at`: timestamp without time zone NULL DEFAULT now()
- `updated_at`: timestamp without time zone NULL DEFAULT now()
- `source`: text NULL DEFAULT 'native_api'::text
- `comments_data`: jsonb NULL

Primary Keys:
- `instagram_posts_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `instagram_posts_instagram_account_id_instagram_accounts_id_fk`: FOREIGN KEY (instagram_account_id) REFERENCES social.instagram_accounts(id) ON DELETE CASCADE

### `social.instagram_profiles`

Columns:
- `id`: integer NOT NULL
- `username`: text NOT NULL
- `owner_type`: text NOT NULL DEFAULT 'external'::text
- `user_id`: integer NULL
- `company_id`: integer NULL
- `instagram_account_id`: integer NULL
- `source`: text NOT NULL DEFAULT 'manual'::text
- `followers`: integer NULL
- `following`: integer NULL
- `posts_count`: integer NULL
- `full_name`: text NULL
- `bio`: text NULL
- `profile_pic_url`: text NULL
- `is_verified`: boolean NULL DEFAULT false
- `is_private`: boolean NULL DEFAULT false
- `external_url`: text NULL
- `engagement_rate`: text NULL
- `avg_likes`: integer NULL
- `avg_comments`: integer NULL
- `total_likes`: integer NULL
- `total_comments`: integer NULL
- `authenticity_score`: integer NULL
- `top_hashtags`: ARRAY NULL
- `top_posts`: jsonb NULL
- `last_fetched_at`: timestamp without time zone NULL
- `created_at`: timestamp without time zone NULL DEFAULT now()
- `updated_at`: timestamp without time zone NULL DEFAULT now()
- `profile_pic_storage_path`: text NULL
- `profile_pic_original_url`: text NULL

Primary Keys:
- `instagram_profiles_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `instagram_profiles_company_id_companies_id_fk`: FOREIGN KEY (company_id) REFERENCES company.companies(id) ON DELETE SET NULL
- `instagram_profiles_instagram_account_id_instagram_accounts_id_f`: FOREIGN KEY (instagram_account_id) REFERENCES social.instagram_accounts(id) ON DELETE SET NULL
- `instagram_profiles_user_id_users_id_fk`: FOREIGN KEY (user_id) REFERENCES core.users(id) ON DELETE SET NULL

### `social.instagram_tagged_posts`

Columns:
- `id`: integer NOT NULL
- `instagram_account_id`: integer NOT NULL
- `post_id`: text NOT NULL
- `username`: text NOT NULL
- `media_type`: text NULL
- `media_url`: text NULL
- `permalink`: text NOT NULL
- `caption`: text NULL
- `timestamp`: timestamp without time zone NULL
- `likes`: integer NULL DEFAULT 0
- `comments`: integer NULL DEFAULT 0
- `impressions`: integer NULL
- `reach`: integer NULL
- `engagement`: integer NULL
- `saved`: integer NULL
- `emv`: integer NULL DEFAULT 0
- `sentiment`: text NULL
- `sentiment_score`: integer NULL
- `sentiment_analysis`: text NULL
- `comments_analysis`: jsonb NULL
- `is_notified`: boolean NULL DEFAULT false
- `created_at`: timestamp without time zone NULL DEFAULT now()

Primary Keys:
- `instagram_tagged_posts_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `instagram_tagged_posts_instagram_account_id_instagram_accounts_`: FOREIGN KEY (instagram_account_id) REFERENCES social.instagram_accounts(id) ON DELETE CASCADE

### `social.meta_ad_accounts`

Columns:
- `id`: integer NOT NULL
- `company_id`: integer NOT NULL
- `meta_user_id`: text NOT NULL
- `meta_user_name`: text NULL
- `meta_user_email`: text NULL
- `access_token`: text NOT NULL
- `access_token_expires_at`: timestamp without time zone NULL
- `scopes`: ARRAY NULL
- `is_active`: boolean NULL DEFAULT true
- `last_sync_at`: timestamp without time zone NULL
- `created_at`: timestamp without time zone NULL DEFAULT now()
- `updated_at`: timestamp without time zone NULL DEFAULT now()

Primary Keys:
- `meta_ad_accounts_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `meta_ad_accounts_company_id_companies_id_fk`: FOREIGN KEY (company_id) REFERENCES company.companies(id) ON DELETE CASCADE

### `social.meta_ad_accounts_list`

Columns:
- `id`: integer NOT NULL
- `meta_ad_account_id`: integer NOT NULL
- `ad_account_id`: text NOT NULL
- `ad_account_name`: text NULL
- `currency`: text NULL
- `timezone`: text NULL
- `business_id`: text NULL
- `is_selected`: boolean NULL DEFAULT false
- `created_at`: timestamp without time zone NULL DEFAULT now()

Primary Keys:
- `meta_ad_accounts_list_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `meta_ad_accounts_list_meta_ad_account_id_meta_ad_accounts_id_fk`: FOREIGN KEY (meta_ad_account_id) REFERENCES social.meta_ad_accounts(id) ON DELETE CASCADE

### `social.meta_business_managers`

Columns:
- `id`: integer NOT NULL
- `meta_ad_account_id`: integer NOT NULL
- `business_id`: text NOT NULL
- `business_name`: text NULL
- `is_selected`: boolean NULL DEFAULT false
- `created_at`: timestamp without time zone NULL DEFAULT now()

Primary Keys:
- `meta_business_managers_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `meta_business_managers_meta_ad_account_id_meta_ad_accounts_id_f`: FOREIGN KEY (meta_ad_account_id) REFERENCES social.meta_ad_accounts(id) ON DELETE CASCADE

### `social.tiktok_profiles`

Columns:
- `id`: integer NOT NULL
- `unique_id`: text NOT NULL
- `user_id`: text NULL
- `nickname`: text NULL
- `avatar_url`: text NULL
- `signature`: text NULL
- `verified`: boolean NULL DEFAULT false
- `followers`: integer NULL DEFAULT 0
- `following`: integer NULL DEFAULT 0
- `hearts`: integer NULL DEFAULT 0
- `video_count`: integer NULL DEFAULT 0
- `raw_data`: jsonb NULL
- `last_fetched_at`: timestamp without time zone NULL DEFAULT now()
- `created_at`: timestamp without time zone NOT NULL DEFAULT now()
- `updated_at`: timestamp without time zone NOT NULL DEFAULT now()

Primary Keys:
- `tiktok_profiles_pkey`: PRIMARY KEY (id)

### `social.tiktok_videos`

Columns:
- `id`: integer NOT NULL
- `video_id`: text NOT NULL
- `author_unique_id`: text NOT NULL
- `description`: text NULL
- `cover_url`: text NULL
- `video_url`: text NULL
- `duration`: integer NULL
- `digg_count`: integer NULL DEFAULT 0
- `share_count`: integer NULL DEFAULT 0
- `comment_count`: integer NULL DEFAULT 0
- `play_count`: integer NULL DEFAULT 0
- `music_title`: text NULL
- `music_author`: text NULL
- `hashtags`: ARRAY NULL
- `posted_at`: timestamp without time zone NULL
- `raw_data`: jsonb NULL
- `created_at`: timestamp without time zone NOT NULL DEFAULT now()
- `updated_at`: timestamp without time zone NOT NULL DEFAULT now()

Primary Keys:
- `tiktok_videos_pkey`: PRIMARY KEY (id)

### `social.youtube_channels`

Columns:
- `id`: integer NOT NULL
- `channel_id`: text NOT NULL
- `channel_name`: text NULL
- `channel_url`: text NULL
- `thumbnail_url`: text NULL
- `subscriber_count`: integer NULL DEFAULT 0
- `video_count`: integer NULL DEFAULT 0
- `view_count`: integer NULL DEFAULT 0
- `description`: text NULL
- `raw_data`: jsonb NULL
- `last_fetched_at`: timestamp without time zone NULL DEFAULT now()
- `created_at`: timestamp without time zone NOT NULL DEFAULT now()
- `updated_at`: timestamp without time zone NOT NULL DEFAULT now()

Primary Keys:
- `youtube_channels_pkey`: PRIMARY KEY (id)

### `social.youtube_videos`

Columns:
- `id`: integer NOT NULL
- `video_id`: text NOT NULL
- `channel_id`: text NULL
- `title`: text NULL
- `description`: text NULL
- `thumbnail_url`: text NULL
- `view_count`: integer NULL DEFAULT 0
- `like_count`: integer NULL DEFAULT 0
- `comment_count`: integer NULL DEFAULT 0
- `duration`: text NULL
- `published_at`: timestamp without time zone NULL
- `is_short`: boolean NULL DEFAULT false
- `raw_data`: jsonb NULL
- `created_at`: timestamp without time zone NOT NULL DEFAULT now()
- `updated_at`: timestamp without time zone NOT NULL DEFAULT now()

Primary Keys:
- `youtube_videos_pkey`: PRIMARY KEY (id)

### `system.data_source_registry`

Columns:
- `id`: integer NOT NULL
- `key`: text NOT NULL
- `actor_id`: text NOT NULL
- `display_name`: text NULL
- `cost_per_1k`: text NULL
- `pricing_model`: text NULL DEFAULT 'ppr'::text
- `category`: text NULL
- `description`: text NULL
- `input_schema_url`: text NULL
- `is_active`: boolean NOT NULL DEFAULT true
- `notes`: text NULL
- `created_at`: timestamp without time zone NOT NULL DEFAULT now()
- `updated_at`: timestamp without time zone NOT NULL DEFAULT now()

Primary Keys:
- `data_source_registry_pkey`: PRIMARY KEY (id)

### `system.feature_flags`

Columns:
- `id`: integer NOT NULL
- `name`: text NOT NULL
- `description`: text NULL
- `enabled`: boolean NOT NULL DEFAULT false
- `module`: text NOT NULL
- `created_at`: timestamp without time zone NULL DEFAULT now()
- `updated_at`: timestamp without time zone NULL DEFAULT now()

Primary Keys:
- `feature_flags_pkey`: PRIMARY KEY (id)

### `system.integration_logs`

Columns:
- `id`: integer NOT NULL
- `company_id`: integer NOT NULL
- `platform`: text NOT NULL
- `action`: text NOT NULL
- `status`: text NOT NULL
- `endpoint`: text NULL
- `details`: jsonb NULL
- `error_message`: text NULL
- `created_at`: timestamp without time zone NULL DEFAULT now()

Primary Keys:
- `integration_logs_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `integration_logs_company_id_companies_id_fk`: FOREIGN KEY (company_id) REFERENCES company.companies(id) ON DELETE CASCADE

### `system.notifications`

Columns:
- `id`: integer NOT NULL
- `user_id`: integer NOT NULL
- `type`: text NOT NULL
- `title`: text NOT NULL
- `message`: text NOT NULL
- `action_url`: text NULL
- `is_read`: boolean NOT NULL DEFAULT false
- `created_at`: timestamp without time zone NOT NULL DEFAULT now()
- `metadata`: jsonb NULL

Primary Keys:
- `notifications_pkey`: PRIMARY KEY (id)

Foreign Keys:
- `notifications_user_id_users_id_fk`: FOREIGN KEY (user_id) REFERENCES core.users(id)

### `system.session`

Columns:
- `sid`: text NOT NULL
- `sess`: jsonb NOT NULL
- `expire`: timestamp without time zone NOT NULL

Primary Keys:
- `session_pkey`: PRIMARY KEY (sid)

### `system.tags`

Columns:
- `id`: integer NOT NULL
- `name`: text NOT NULL
- `type`: USER-DEFINED NOT NULL
- `created_at`: timestamp without time zone NOT NULL DEFAULT now()

Primary Keys:
- `tags_pkey`: PRIMARY KEY (id)
