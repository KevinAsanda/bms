# GEMINI.md — BMS Project Brain

# Butchery Management System | Simon Family Farm, Clermont Rank, Durban

# Gemini CLI reads this file automatically on every session start.

---

## What This Project Is

A full-stack Progressive Web App (PWA) that replaces paper notebooks and manual processes at a small butchery. 10 staff, 3 roles, real financial transactions, real customer data. This is a production system for a real business, not a demo.

**Stack:** React + Vite + Tailwind (frontend) · Node.js + Express (API) · PostgreSQL + Prisma (database)  
**Hosting:** Railway (production) · Docker Compose (local dev)  
**Auth:** JWT (HS256) + bcrypt (cost 12) · Role-based access (OWNER / CASHIER / STOCK_MANAGER)

---

## Critical Reading — Do This First Every Session

Before writing code for any feature, re-read these files in order:

```
docs/ARCHITECTURE.md      ← monorepo layout, DB schema, API endpoints, build phases
docs/SECURITY.md          ← auth patterns, RBAC, validation, encryption. Non-negotiable.
docs/DESIGN.md            ← colors, fonts, component patterns. Follow exactly.
docs/SPEC_TEMPLATE.md     ← fill this in completely before building any feature
docs/specs/SPEC_<feat>.md ← the specific spec for whatever feature you're about to build
```

If you are resuming a session mid-build, check ## Build Status at the bottom of this file first.

---

## The Workflow — Never Deviate From This

```
1. SPEC FIRST
   Copy docs/SPEC_TEMPLATE.md → docs/specs/SPEC_<feature>.md
   Fill in every section (no TBDs)
   Confirm the spec against ARCHITECTURE.md and SECURITY.md

2. SCHEMA SECOND
   If the feature needs new DB tables or fields, add them to prisma/schema.prisma
   Run: npx prisma migrate dev --name <feature_name>
   Never touch the DB mid-build without a migration

3. ZOD SCHEMA THIRD
   Write the Zod validation schema for every request body before writing the controller
   If you can't define the schema, you don't understand the feature well enough yet

4. API FOURTH
   Implement controllers + routes
   Every route: authMiddleware → rbacMiddleware → zodValidate → controller

5. FRONTEND FIFTH
   Build UI components following DESIGN.md exactly
   Use the Zustand store pattern from ARCHITECTURE.md

6. TEST SIXTH
   Write/run Vitest unit tests
   Write/run Playwright E2E tests via the Playwright MCP
   All tests must pass before moving to the next feature

7. COMMIT
   git add -A && git commit -m "feat(FEAT-00X): <feature name>"
```

---

## Hard Rules — These Are Never Negotiable

### Security

- Every API route (except /auth/login) has authMiddleware then rbacMiddleware(roles)
- Every request body is validated with a Zod schema before reaching the controller
- Every multi-table write uses prisma.$transaction([...])
- Passwords hashed with bcrypt cost factor 12. Never store plaintext. Never log plaintext.
- JWT secrets minimum 64 random characters, stored in .env only, never in source code
- Customer PII (name, phone) encrypted at rest with AES-256-GCM using utils/encryption.js
- Audit log written for every action listed in SECURITY.md Section 9
- No stack traces in API error responses — log to server, return { error: "..." } to client

### Code Quality

- No raw SQL — Prisma only. Parameterized queries prevent injection automatically.
- No console.log with tokens, passwords, or PII
- No localStorage for JWT — access token in memory, refresh token in httpOnly cookie
- No hardcoded values — prices, limits, thresholds from env or DB, never in source code
- Run npm audit --audit-level=high before every commit — zero high/critical allowed

### Design

- Dark mode only — --color-bg-base: #0f1117. No white backgrounds. Ever.
- Primary color (#e8930a) only on the single most important action per screen
- Prices always in South African Rand — prefix "R " — monospace font (JetBrains Mono)
- Only lucide-react for icons — no other icon library
- Touch targets minimum 48x48px — primary device is a tablet at a butchery counter
- All colors from CSS variables — never hardcode hex values in JSX/CSS

### Database

- Sale creation: stock deduction and sale record in ONE prisma.$transaction() — non-negotiable
- StockAdjustment table updated for every manual stock change
- AuditLog table updated for every significant action (see SECURITY.md Section 9)
- Never delete records — soft delete with isActive: false or archivedAt timestamp

---

## Project Structure

```
bms/
├── GEMINI.md                    ← YOU ARE HERE (auto-loaded)
├── apps/
│   ├── api/                     ← Node.js + Express backend
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   ├── controllers/
│   │   │   ├── middleware/      ← auth.js, rbac.js, errorHandler.js, rateLimiter.js
│   │   │   ├── services/
│   │   │   └── utils/          ← encryption.js, audit.js, prisma.js
│   │   ├── prisma/
│   │   │   └── schema.prisma   ← single source of truth for DB
│   │   └── tests/
│   └── web/                     ← React + Vite frontend
│       ├── src/
│       │   ├── pages/
│       │   ├── components/
│       │   ├── hooks/
│       │   ├── store/           ← Zustand slices
│       │   └── api/             ← Axios instance + typed callers
│       └── public/
│           └── manifest.json    ← PWA manifest
├── docs/
│   ├── ARCHITECTURE.md
│   ├── SECURITY.md
│   ├── DESIGN.md
│   ├── SPEC_TEMPLATE.md
│   └── specs/                   ← One SPEC_<feature>.md per feature
└── docker-compose.yml
```

---

## Feature Registry

Update this table as each feature is completed.

| ID       | Feature                          | Phase   | Spec                         | Built | Tests Pass |
| -------- | -------------------------------- | ------- | ---------------------------- | ----- | ---------- |
| FEAT-001 | Authentication & User Management | 1       | docs/specs/SPEC_auth.md      | done  | yes        |
| FEAT-002 | Product Catalogue Management     | 2       | docs/specs/SPEC_products.md  | done  | yes        |
| FEAT-003 | POS Checkout                     | 3       | docs/specs/SPEC_pos.md       | done  | yes        |
| FEAT-004 | Stock Management                 | 4       | docs/specs/SPEC_stock.md     | done  | yes        |
| FEAT-005 | Daily Reports & Cash-Up          | 5       | docs/specs/SPEC_reports.md   | done  | yes        |
| FEAT-006 | Owner Dashboard                  | 5       | docs/specs/SPEC_dashboard.md | done  | yes        |
| FEAT-007 | Employee Admin Panel             | 1       | docs/specs/SPEC_employees.md | done  | yes        |
| FEAT-008 | Customer Management              | Phase 2 | docs/specs/SPEC_customers.md | done  | yes        |

---

## Environment Variables Reference

```bash
# apps/api/.env — NEVER commit this file
DATABASE_URL="postgresql://user:pass@host:5432/bms"
DIRECT_URL="postgresql://user:pass@host:5432/bms"
JWT_SECRET="<64+ random chars>"
JWT_REFRESH_SECRET="<64+ random chars, different from JWT_SECRET>"
JWT_EXPIRES_IN="8h"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=3001
NODE_ENV="development"
CORS_ORIGIN="http://localhost:5173"
ENCRYPTION_KEY="<32 byte hex string for AES-256>"
```

Seed credentials (dev only): admin@bms.local / Admin1234! / role: OWNER

---

## Commands Reference

```bash
npx prisma migrate dev --name <name>   # New migration
npx prisma db seed                      # Seed owner account
npm run dev                             # API on :3001
cd apps/web && npm run dev              # Frontend on :5173
docker-compose up -d                    # Local PostgreSQL
npm test                                # Vitest unit tests
npx playwright test                     # All E2E tests
npm run lint                            # ESLint check
npm audit --audit-level=high            # Security audit
```

---

## Business Context

- Location: Clermont Rank, Durban, KwaZulu-Natal, South Africa
- Currency: South African Rand — always display as R 000.00
- Primary counter device: Android tablet (768px viewport)
- Owner remote device: Android smartphone (360px viewport)
- The #1 success metric: cashier completes a sale in under 60 seconds

---

## Build Status

**Current Phase:** MVP Complete — Entering UAT  
**Last Completed Feature:** FEAT-006 Owner Dashboard  
**Next Action:** Perform end-to-end User Acceptance Testing (UAT)

_Update this section after each phase is completed._

---

## Engineering & Design Decisions

*Record key architectural or system design choices here.*

| Date       | Decision                     | Rationale                                                                                                                                              |
| ---------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-06-02 | Spec-First Workflow          | Enforced a mandatory specification phase (docs/specs) before any code is written to ensure architectural alignment and security compliance.            |
| 2026-06-02 | Prisma 7 Transition          | Adopted Prisma 7 config patterns (`prisma.config.ts`) and `PrismaPg` driver adapter for better Supabase compatibility.                                 |
| 2026-06-02 | Database Baselining          | Used `migrate diff` and `resolve --applied` to baseline existing Supabase DB without data loss.                                                        |
| 2026-06-02 | Separate Staff Admin         | Isolated Staff Management to a dedicated `/admin` route and `employeeController` to keep Auth logic focused on session management.                     |
| 2026-06-02 | Modular Inventory UI         | Refactored Inventory management into isolated components (`ProductTable`, `ProductModal`, `CategoryManager`) to support rapid iteration.               |
| 2026-06-02 | Atomic Sale Transactions     | Implemented Prisma `$transaction` for sales to ensure stock deduction and sale creation are all-or-nothing, preventing data drift.                     |
| 2026-06-02 | Transaction Timeout Increase | Set Prisma interactive transaction timeout to 30s to accommodate potential latency in remote database (Supabase) connections.                         |
| 2026-06-02 | Atomic Stock Adjustments     | Mandated `$transaction` for stock updates to ensure the `Stock` quantity and `StockAdjustment` audit trail stay in perfect sync.                       |
| 2026-06-02 | Global Test Configuration    | Created `vitest.config.ts` with 30s timeouts and single-threaded execution for stable integration tests.                                               |
| 2026-06-02 | Centralized Dashboard Logic  | Consolidated high-frequency business metrics into a single `getDashboardStats` endpoint to minimize frontend network overhead and ensure atomic state. |

---

## Lessons Learned (Production Log)

*Record errors and mistakes here to avoid repeating them.*

| Date       | Error/Issue              | Resolution                                                                                     | Prevention                                                                                                         |
| ---------- | ------------------------ | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 2026-06-02 | Prisma Migration P3005   | Database was non-empty but lacked migration history.                                           | Always verify database state before running migrations; use baselining for existing DBs.                           |
| 2026-06-02 | Prisma 7 Config Change   | Datasource `url` and `directUrl` moved from `schema.prisma` to `prisma.config.ts`.             | Use `prisma.config.ts` for connection management in Prisma 7+.                                                    |
| 2026-06-02 | Prisma Migration Drift   | `resolve --applied` used to baseline an existing database without resetting data.              | Use `migrate diff` + `resolve` to baseline existing DBs.                                                           |
| 2026-06-02 | SSL/TLS P1011 Error      | Self-signed certificate error when using `PrismaPg` adapter with Supabase.                      | Ensure `rejectUnauthorized: false` is correctly set in the connection pool and handle TLS issues.                  |
| 2026-06-02 | Vitest .env loading      | Integration tests failed due to missing DB connection string.                                  | Ensure `dotenv/config` is imported in test entry points or Vitest setup.                                           |
| 2026-06-02 | PowerShell Env Var Syntax| `$env:VAR=val` must be on its own line or semicolon-separated in PowerShell.                   | Use standard PowerShell environment variable assignment syntax.                                                     |
| 2026-06-02 | Prisma Transaction Timeout| Multi-write transactions failed with 5s default timeout during remote DB operations.          | Explicitly set `{ timeout: 30000 }` in `$transaction` for latency-sensitive operations.                            |
| 2026-06-02 | State-UI Desync          | Search query state in `POS.jsx` was using wrong setter name.                                   | Always verify state setter names match the `useState` declaration to prevent silent failures.                      |
| 2026-06-02 | Vitest Parallel Timeout  | Simultaneous integration tests caused timeouts/deadlocks on single remote DB.                  | Use `singleThread: true` and increased timeouts in `vitest.config.ts` for stable remote DB testing.                |
| 2026-06-02 | Dashboard Refresh Loop   | Missing dependency array in `useEffect` caused infinite API calls in `Dashboard.jsx`.          | ALWAYS include a dependency array (even if empty `[]`) in `useEffect` to prevent component re-render death loops. |
