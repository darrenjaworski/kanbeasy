# External Integrations

**Analysis Date:** 2026-06-29

## APIs & External Services

**None currently implemented.**

The application is a standalone, client-side kanban board. No external REST APIs, GraphQL endpoints, or third-party services are integrated. Future roadmap includes Supabase for online enablement (see `project_supabase_online.md` in project memory).

## Data Storage

**Databases:**

- None (fully local)

**Client-Side Storage:**

- IndexedDB (primary)
  - Database name: `kanbeasy`
  - Version: 1
  - Object stores: `kv` (key-value), `board` (board state by ID)
  - Default board ID: `"default"`
  - Debounced write: 500ms (configurable via `WRITE_DEBOUNCE_MS` in `src/constants/behavior.ts`)
- localStorage (legacy/migration)
  - Used only for backward compatibility and data migration from older versions
  - All keys centralized in `src/constants/storage.ts`

**Fallback:**

- In-memory storage when IndexedDB is unavailable (development/testing)
- Migration from localStorage to IndexedDB on first app load

**File Storage:**

- Local filesystem only (via browser download/upload)
- Export format: Versioned JSON (`version: 2`, stored in `src/utils/exportBoard.ts`)
- Import tool handles version upgrades transparently in `src/utils/importBoard.ts`

**Caching:**

- In-memory caches: `kvCache` (Map<string, unknown>) and `boardCache` (Record<string, BoardState>)
- Debounced IndexedDB writes to reduce I/O
- No external cache service (Redis, Memcached, etc.)

## Authentication & Identity

**Auth Provider:**

- None implemented
- App is fully anonymous and local
- No user accounts, logins, or authentication required
- Future: Supabase Auth planned for online sharing feature

## Monitoring & Observability

**Error Tracking:**

- None (no error reporting service)
- Console warnings only in development mode (`import.meta.env.DEV` checks)

**Logs:**

- Browser console only
- Development warnings: IndexedDB failures, data migration issues
- No structured logging or external log aggregation

**Performance Monitoring:**

- Lighthouse CI via GitHub Actions (`.github/workflows/lighthouse.yml`)
  - Runs post-deployment on GitHub Pages
  - Configured in `lighthouserc.json`
  - Reports available at `.lighthouseci/lhr-*.html`
  - No external Lighthouse service integration

## CI/CD & Deployment

**Hosting:**

- GitHub Pages (static site)
- Base URL: `https://darrenjaworski.github.io/kanbeasy/`
- Configured via `PUBLIC_URL` env var in build

**CI Pipeline:**

- GitHub Actions (`.github/workflows/`)

**Static Checks Workflow** (`.github/workflows/static-checks.yml`):

```
prettier --check → eslint → knip → tsc --noEmit → vite build → vitest run
```

**E2E Tests Workflow** (`.github/workflows/e2e.yml`):

- Triggers after successful `gh page deploy`
- Container: `mcr.microsoft.com/playwright:v1.61.0-noble`
- Matrix: 3 browsers (chromium, firefox, webkit) × 3 shards (parallel)
- Timeout: 20 minutes
- Retries on CI: 1
- Artifacts: HTML report, screenshots on failure, video on failure

**Release Workflow** (`.github/workflows/release.yml`):

- Triggered by version tags (`v*`)
- Runs `npm version` to bump version
- Creates git tag and release notes

**GitHub Pages Deploy Workflow** (`.github/workflows/gh-pages.yml`):

- Triggers on version tags or manual dispatch
- Builds with `npm run build`
- Deploys to GitHub Pages
- Triggers E2E tests on success

**Lighthouse Audit Workflow** (`.github/workflows/lighthouse.yml`):

- Runs post-deployment
- Audits app on GitHub Pages

## Environment Configuration

**Required env vars:**

- `PUBLIC_URL` - Base URL for deployment (defaults to repository root on GitHub Pages)

**Optional env vars:**

- `E2E_BASE_URL` - For testing deployed environment (e.g., `https://darrenjaworski.github.io/kanbeasy`)
- `CI` - Set to `"true"` in GitHub Actions to enable CI-specific behavior (test sharding, retries, reporters)
- `ANALYZE` - Set to `"true"` during build to generate bundle analysis (`dist/bundle-stats.html`)

**Development env vars:**

- None required for local development

**Secrets location:**

- `.env` file present but never committed (in `.gitignore`)
- No secrets currently used in codebase
- Future: Supabase credentials will be required

## Webhooks & Callbacks

**Incoming:**

- None currently

**Outgoing:**

- None currently

## Host Integration (VS Code Embedding)

**Protocol:**

- Detect host mode: Query param `?host=vscode` in URL
- Message source: `"kanbeasy"`
- Protocol version: 1 (defined in `src/utils/hostBridge.ts`)

**Message Types:**

- `host:ready` - App notifies host it's ready to receive data
- `host:requestInit` - App requests initial board and settings from host
- `host:saveBoard` - App sends board state changes to host
- `host:boardChanged` - App notifies host of board mutations
- Host responds with `host:init` containing board state and key-value settings

**Trust Model:**

- Trust-on-first-use (TOFU) origin pinning
- First valid message origin is recorded and all subsequent messages must come from that origin
- Prevents message hijacking after handshake

**Use Case:**

- Embed kanbeasy in VS Code extension webview
- Host extension manages persistence and sharing
- App stays purely frontend; host handles sync/multiplayer logic

---

_Integration audit: 2026-06-29_
