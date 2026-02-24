# Memory - Code Refactor Agent

## Project Structure
- Main routes: `server/routes.ts` (~10,000 lines, ~300 endpoints)
- Modular routes: `server/routes/` (14 files, ~10,000 lines, ~200 endpoints)
- Services: `server/services/` (15 services)
- Storage layer: `server/storage.ts` (~5,900 lines, 100+ methods)
- Lib wrappers: `server/lib/` (gemini, openai, object-storage)

## Completed Refactorings

### 2026-02-16: Replit Integrations Migration
**Status**: ✅ Complete (TypeScript check passed, 22 tests passing)

Migrated all Replit-specific integrations to standalone wrappers:
- `server/replit_integrations/gemini` → `server/lib/gemini.ts`
- `server/replit_integrations/image` → `server/lib/openai.ts`
- `server/replit_integrations/object_storage` → `server/lib/object-storage.ts`

**Key changes:**
- Removed dynamic imports of `sendGeminiMessage` (5 locations) — now static imports
- Fixed environment variables: `AI_INTEGRATIONS_*` → `OPENAI_API_KEY`, `GOOGLE_GENAI_API_KEY`
- Object Storage now uses Google Cloud Application Default Credentials instead of Replit sidecar
- Deleted entire `server/replit_integrations/` directory

**Updated imports in:**
- `server/routes.ts` (3 gemini + 2 object storage imports)
- `server/routes/campaign.routes.ts` (1 gemini import)
- `server/routes/user.routes.ts` (1 openai import)
- `server/services/company-enrichment.ts` (1 gemini import)
- `server/services/instagram-profile-pic.ts` (1 object storage import)

**Breaking changes:**
- Object Storage presigned URLs now use v4 signing (Google Cloud native) instead of Replit sidecar
- Requires `GOOGLE_APPLICATION_CREDENTIALS` or `gcloud auth application-default login` for local dev

## Patterns Observed

### Import Organization
Files typically follow this order:
1. External libraries (express, zod, drizzle-orm)
2. Internal modules (storage, services)
3. Schema imports from `@shared/schema`
4. Type imports

### Dynamic vs Static Imports
- **Bad**: `const { sendGeminiMessage } = await import("./replit_integrations/gemini")`
- **Good**: `import { sendGeminiMessage } from "./lib/gemini"` at top of file
- Dynamic imports should only be used for code splitting, not as lazy initialization

### Environment Variable Patterns
- Check for required env vars at module load time
- Log warnings if optional env vars are missing
- Throw errors at runtime if required vars are accessed but missing

## Code Smells to Watch For
- Replit-specific code (sidecar endpoints, AI_INTEGRATIONS_* env vars)
- Dynamic imports used incorrectly (for lazy init instead of code splitting)
- Hardcoded URLs or credentials
- Missing error handling around external API calls
