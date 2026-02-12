# DB Architect Memory

## Schema Overview (Feb 2026)
- File: `shared/schema.ts` (~3283 lines, single source of truth)
- Total: **91 tables** across **14 PostgreSQL schemas**
- Schemas: academy(5), analytics(3), billing(7), brand(4), campaign(12), company(3), content(6), core(1), creator(7), gamification(9), messaging(3), misc(9), social(16), system(6)

## Critical "God Tables" (need splitting)
- `users` (core): **66 columns** - mixes auth, profile, Instagram/TikTok/YouTube metrics, address, banking, enrichment
- `companies` (company): **73 columns** - mixes company info, address, Instagram/TikTok metrics, CNPJ enrichment, website enrichment, e-commerce, AI context, brand data

## Duplicate Data Pattern
- Instagram metrics exist in BOTH `users` table AND `instagramProfiles` table (social schema)
- TikTok metrics exist in BOTH `users` table AND `tiktokProfiles` table (social schema)
- YouTube metrics exist in BOTH `users` table AND `youtubeChannels` table (social schema)
- Company Instagram metrics exist in BOTH `companies` table AND `instagramProfiles` table

## Tables Only Referenced in storage.ts (stub/interface only)
These tables have schema definitions and storage interface methods but NO actual route or service usage:
- `creatorAddresses`, `creatorDiscoveryProfiles`, `rewardEntitlements`, `campaignMetricSnapshots`
- `pointsLedger`, `campaignPrizes`, `campaignPointsRules`, `brandPrograms`
- `postAiInsights`, `creatorAnalyticsHistory`, `creatorHashtags`, `creatorLevels` (only seed)
- `paymentBatches`, `walletBoxes`

## Actively Used Tables (confirmed via routes/services)
- `users`, `companies`, `campaigns`, `applications`, `deliverables`, `notifications`
- `instagramAccounts`, `instagramProfiles`, `instagramPosts`, `instagramMessages`
- `instagramTaggedPosts`, `instagramContacts`, `instagramInteractions`
- `metaAdAccounts`, `metaBusinessManagers`, `metaAdAccountsList`
- `tiktokProfiles`, `tiktokVideos`, `youtubeChannels`, `youtubeVideos`
- `conversations`, `convMessages`, `messageReads`
- `brandCreatorMemberships`, `communityInvites`
- `blogPosts`, `hashtagSearches`, `campaignHashtags`, `hashtagPosts`
- `dmTemplates`, `dmSendLogs`, `contactNotes`
- `companyWallets`, `walletTransactions`, `creatorBalances`
- `profileSnapshots`, `dataSourceRegistry`

## Naming Conventions
- Tables: snake_case plural in DB, camelCase in JS
- Enums: declared as const arrays, not always pgEnum
- Timestamps: `createdAt`, `updatedAt` pattern
- IDs: serial integer (no UUIDs used)
