## Overview

CreatorConnect is a comprehensive platform designed to streamline influencer marketing and creator management. It connects brands with content creators, facilitating campaign management, community building, performance tracking, and payment processing. The platform supports Creator, Company, and Admin roles, each with tailored functionalities. Its core purpose is to enhance brand-creator collaboration, manage UGC campaigns, and foster long-term relationships, ultimately unlocking significant market potential in the influencer marketing space. Creators benefit from opportunity discovery, campaign participation, and educational resources through an integrated Academy.

## User Preferences

- **Idioma**: Português (Brasil)
- **Comunicação**: Linguagem simples e direta
- **Foco**: MVP funcional com controle de custos
- **Links externos**: Sempre incluir UTM parameters (utm_source=creatorconnect, utm_medium=<local>, utm_campaign=<contexto>)

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript (Vite).
- **Styling**: Tailwind CSS with `shadcn/ui` (New York style).
- **State Management**: TanStack React Query.
- **Routing**: Wouter with role-based guards.
- **UI Components**: Radix UI primitives.
- **Forms**: React Hook Form with Zod validation.

### Backend Architecture
- **Runtime**: Node.js with Express.js.
- **Language**: TypeScript with ESM modules.
- **Database ORM**: Drizzle ORM with PostgreSQL dialect.
- **Schema**: Shared via `./shared/schema.ts`.
- **Migrations**: Drizzle Kit.
- **Validation**: Zod schemas for all POST/PUT route bodies.

### Project Structure
- `client/src/`: React frontend.
- `server/`: Express backend with modular routes and services.
- `shared/`: Shared database schemas and types.

### Key Features and Design Decisions
- **Role-Based Access**: Distinct dashboards and workflows for Creator, Company, and Admin roles.
- **Brand Hub**: Centralized workspace for companies to manage creator communities and campaigns.
- **Community/Membership**: Supports long-term creator-brand relationships with gamification elements.
- **Campaigns**: Structured projects with deliverables, tracking, and rewards.
- **Instagram Integration**: Comprehensive features including Hashtag Tracking, Comments Management with AI sentiment analysis, Content Publishing (Image, Carousel, Reel, Story), Partnership Ads, DM Management, and CRM Social for contacts.
- **Data Extraction Hierarchy (LOCAL FIRST)**: Prioritizes local database, then free Meta APIs (Business Discovery, User Profile API), and finally Apify as a paid, on-demand last resort to minimize costs.
- **Profile Picture Storage**: All Instagram profile pictures MUST be saved to Object Storage (permanent URLs via `/api/storage/public/...`). Never save CDN URLs directly to user profiles. Core service: `server/services/instagram-profile-pic.ts`. Old local filesystem approach (`profile-image-service.ts`) was removed.
- **Apify Services**: Two files serve different purposes: `server/apify-service.ts` (TikTok metrics, detailed posts, hashtag analysis) and `server/services/apify.ts` (profile/post scraping with caching). Both are needed.
- **Database Design**: Unified tables for social network profiles (`instagram_profiles`, `tiktok_profiles`, `youtube_channels`) and historical snapshots (`profile_snapshots`). Dedicated tables for Instagram CRM Social (`instagram_contacts`, `instagram_interactions`) and Hashtag Tracking (`hashtag_searches`, `campaign_hashtags`, `hashtag_posts`).

## External Dependencies

### AI Services
- **OpenAI**: For comment sentiment analysis and content suggestions.
- **Google GenAI**: For additional AI capabilities.

### Cloud Storage
- **Replit Object Storage**: For file and media storage.

### Email Service
- **SendGrid**: For transactional email delivery.

### Database
- **Neon Database**: Serverless PostgreSQL.
- **Drizzle ORM**: Database interactions.

### Social Media Integration
- **Instagram/Meta API**: For OAuth, profile synchronization, metrics, comments, publishing, partnership ads.
- **Business Discovery API**: Free lookup of external profiles.
- **Meta Marketing API**: Ads management and Partnership Ads.
- **Meta Content Publishing API**: Publishing posts, carousels, reels, stories.
- **Apify**: On-demand scraping for external profiles and TikTok data (cost-controlled, last resort). Primary actor is `instagram-api-scraper`.

### Development Tools
- **Replit Plugins**: Runtime error overlay, cartographer, dev banner.
- **Vite**: Development server and build tooling.
- **esbuild**: Server-side bundling.