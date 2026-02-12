# Feature Architect - Persistent Memory

## Project Structure

### Multi-Schema PostgreSQL (12+ schemas, 45+ tables)
- **core**: users, companies, companyMembers
- **campaign**: campaigns, applications, deliverables, campaignTemplates
- **creator**: creatorPosts, creatorAnalyticsHistory, creatorDiscoveryProfiles
- **social**: instagram_profiles, tiktok_profiles, youtube_channels, profile_snapshots
- **messaging**: conversations, convMessages
- **gamification**: creatorLevels, badges, pointsLedger
- **brand**: brandSettings, brandPrograms, brandRewards, brandCreatorTiers

### Key Schema Patterns
- **JSONB fields**: Companies use `structuredBriefing` (StructuredBriefing interface), `websitePages` (array), `websiteSocialLinks` (object)
- **Timestamp fields**: All enrichment fields have `*LastUpdated` timestamp (cnpjLastUpdated, websiteLastUpdated, instagramLastUpdated, aiContextLastUpdated)
- **Shared types**: All schemas export both table type and Insert type (e.g., Company, InsertCompany)

### Backend Architecture

#### Storage Layer (`server/storage.ts`)
- Centralized data access interface
- Drizzle ORM queries
- Business logic for scoring/matching in runtime
- **Key method**: `scoreCreatorForCampaign(creator, campaign)` - runtime scoring 0-100

#### Services (`server/services/`)
- **company-enrichment.ts**: Reusable enrichment functions (CNPJ, website, Instagram, AI briefing)
- **business-discovery.ts**: Free Meta API for Instagram data
- **instagram-profile-pic.ts**: Downloads and saves to Object Storage
- **apify.ts**: Scraping with caching (last resort, paid)

#### Jobs (`server/jobs/`)
- **companyEnrichmentJob.ts**: Weekly cron (Sundays 3 AM BRT), processes 20 companies, rate limiting 3s between calls

#### Routes
- Main file: `server/routes.ts` (legacy, ~9800 lines)
- Modular: `server/routes/*.routes.ts` (campaign, instagram, tiktok, stripe, meta-marketing)
- Pattern: Zod validation → storage layer → response

### AI Integration

#### Gemini API Usage
- **Brand Intelligence**: `regenerateStructuredBriefing()` in company-enrichment.ts
- **Campaign Auto-fill**: `/api/campaigns/generate-briefing` in campaign.routes.ts
- **Other**: Instagram comments AI, content suggestions (routes.ts)
- **Model**: gemini-2.5-flash (fast, low cost)
- **No rate limiting**: Currently unprotected

### Data Extraction Hierarchy
1. **Local DB** (fastest, free)
2. **Free Meta APIs** (Business Discovery, User Profile API)
3. **Apify** (paid scraping, last resort)

### Current Brand Intelligence Features

#### 1. Structured Briefing (JSONB)
- Fields: whatWeDo, targetAudience, brandVoice, differentials, idealContentTypes, avoidTopics, referenceCreators
- Generated via Gemini AI from enrichment data
- Editable cards in frontend

#### 2. Re-enrichment (Weekly Job)
- Finds companies where `lastEnrichedAt > 7 days OR null`
- Limit: 20 companies/week
- CNPJ: re-enrich if `cnpjLastUpdated > 30 days`
- Website: re-enrich if `websiteLastUpdated > 7 days`
- Instagram: re-enrich if `instagramLastUpdated > 7 days`
- Regenerates briefing if any data changed

#### 3. Campaign Auto-fill
- POST `/api/campaigns/generate-briefing`
- Uses structuredBriefing + enrichment data
- Generates: description, briefingText, requirements, suggestedNiches, suggestedRegions
- No caching, no rate limiting

#### 4. Matching Intelligence (Runtime Scoring)
- GET `/api/campaigns/:id/recommended-creators`
- Calls `scoreCreatorForCampaign()` for ALL creators
- Scoring: niche (30), location (15), social (25), completeness (10), bonus (0) = max 100
- Returns top 20
- **NO CACHING**, recalculates on every request

## Architectural Decisions

### Enrichment Strategy
- **Apify (website-content-crawler)**: maxCrawlPages: 10, crawlerType: cheerio
- **Profile pics**: Always download to Object Storage, never save CDN URLs
- **Rate limiting**: 3s delay between companies, ReceitaWS allows 3/min
- **Fallback chain**: Business Discovery → Apify (Instagram)

### Scoring Algorithm (V1)
- Runtime calculation, no pre-computation
- Uses `getRegionForState()` for region matching
- Social metrics scale: <1K (2-4pts), 1-10K (4-7pts), 10-100K (7-10pts), 100K+ (10pts)
- Engagement rate bonus (IG only): >5% (+5), 2-5% (+3), >0% (+1)

## Known Limitations

### Scalability Risks
1. **Matching scoring**: O(n) on every request, no pagination on creators list
2. **Re-enrichment**: 20 companies/week may be insufficient at scale
3. **AI endpoints**: No rate limiting, no cost tracking
4. **Apify calls**: No budget control, can spike costs

### Missing Features (V2 Candidates)
- Pre-computed scoring (scheduled job or trigger-based)
- Creator performance history in scoring (bonus field reserved but unused)
- Rate limiting on AI endpoints
- Caching for campaign auto-fill (same company/title should reuse)
- Incremental enrichment (only changed fields)
- Enrichment priority queue (active campaigns first)

## File Locations
- Schema: `/Users/rodrigoqueiroz/Projects/UGCHUB/shared/schema.ts` (3900 lines)
- Constants: `/Users/rodrigoqueiroz/Projects/UGCHUB/shared/constants.ts`
- Storage: `/Users/rodrigoqueiroz/Projects/UGCHUB/server/storage.ts`
- Enrichment service: `/Users/rodrigoqueiroz/Projects/UGCHUB/server/services/company-enrichment.ts`
- Enrichment job: `/Users/rodrigoqueiroz/Projects/UGCHUB/server/jobs/companyEnrichmentJob.ts`
- Campaign routes: `/Users/rodrigoqueiroz/Projects/UGCHUB/server/routes/campaign.routes.ts`
