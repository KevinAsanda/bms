# GEMINI CLI — BMS MVP KICKOFF PROMPT
# Copy everything below the divider and paste it into Gemini CLI with --yolo

---

You are a senior full-stack engineer building the **Butchery Management System (BMS)** for Simon Family Farm, a small butchery in Clermont Rank, South Africa. Your job is to build a production-ready MVP that passes App Store / Play Store PWA quality standards and is secure enough for real financial transactions.

## BEFORE YOU WRITE A SINGLE LINE OF CODE

Read all four documents in the `docs/` folder in this order:
1. `docs/ARCHITECTURE.md` — system structure, directory layout, DB schema, API endpoints, build phases
2. `docs/SECURITY.md` — auth, RBAC, encryption, validation patterns. These are mandatory, not suggestions.
3. `docs/DESIGN.md` — color palette, typography, component patterns, layouts. Follow exactly.
4. `docs/SPEC_TEMPLATE.md` — before implementing any feature, copy this template and fill it in completely as `docs/specs/SPEC_<feature>.md`

Then read:
5. `docs/specs/SPEC_pos.md` — the fully completed spec for the POS checkout feature (your Phase 2 implementation target)

## YOUR MISSION: BUILD THE MVP

Implement the 6 build phases defined in `ARCHITECTURE.md` Section 10, in order. Do not skip phases. Do not build Phase 2 before Phase 1 is tested.

---

### PHASE 1 — FOUNDATION

**What to build:**

1. Initialize the monorepo:
   ```
   bms/
   ├── apps/api/     (Node.js + Express)
   └── apps/web/     (React + Vite)
   ```

2. Set up `apps/api`:
   - `npm init -y`, install: `express`, `prisma`, `@prisma/client`, `jsonwebtoken`, `bcrypt`, `zod`, `cors`, `helmet`, `express-rate-limit`, `dotenv`
   - Dev: `nodemon`, `vitest`, `supertest`
   - Copy the full Prisma schema from `ARCHITECTURE.md` Section 4 into `prisma/schema.prisma`
   - Run `npx prisma migrate dev --name init`
   - Create seed: owner account `admin@bms.local` / `Admin1234!` with role `OWNER`
   - Implement auth middleware exactly as shown in `SECURITY.md` Section 3.1
   - Implement RBAC middleware exactly as shown in `SECURITY.md` Section 4.2
   - Implement rate limiter exactly as shown in `SECURITY.md` Section 3.4
   - Implement `POST /auth/login` — Zod validate body, verify password with bcrypt, return JWT + httpOnly refresh cookie
   - Implement `POST /auth/logout`
   - Implement `POST /auth/refresh`
   - Implement `GET /employees`, `POST /employees`, `PATCH /employees/:id/deactivate`, `POST /auth/reset-password` (OWNER only)
   - All passwords validated with `passwordSchema` from `SECURITY.md` Section 3.2
   - All user actions logged to `AuditLog` per `SECURITY.md` Section 9

3. Set up `apps/web`:
   - `npm create vite@latest web -- --template react`
   - Install: `tailwindcss`, `lucide-react`, `zustand`, `axios`
   - Import Google Fonts (Syne + JetBrains Mono) in `index.css`
   - Set all CSS variables from `DESIGN.md` Section 2 in `:root`
   - Build `Login.jsx` following `DESIGN.md` Section 7
   - Create `useAuth` hook backed by Zustand auth store
   - JWT stored in memory only (NOT localStorage). Refresh token in httpOnly cookie.
   - After login, redirect to `/pos` for CASHIER, `/dashboard` for OWNER, `/inventory` for STOCK_MANAGER

**Phase 1 done when:**
- `npx vitest run` passes all auth tests
- Login screen renders correctly at 360px, 768px, 1280px
- Logging in as OWNER redirects to dashboard; CASHIER to POS; STOCK_MANAGER to inventory
- Wrong password shows error; 6th failed attempt is rate-limited

---

### PHASE 2 — PRODUCTS

**Read `docs/specs/SPEC_pos.md` Section 4 (Data Model) before starting.**

Build:
- `GET /products` — list all active products (auth required, any role)
- `GET /products/barcode/:code` — lookup by barcode (CASHIER, OWNER)
- `GET /products?search=` — name search for fallback (CASHIER, OWNER)
- `POST /products` — create product (OWNER only, Zod validated)
- `PUT /products/:id` — update product/price (OWNER only)
- `PATCH /products/:id/archive` — soft archive (OWNER only)
- Admin UI page at `/admin/products` — product table with add/edit/archive actions
- Follow DESIGN.md Section 7 (Inventory Screen) for the products table UI

**Phase 2 done when:**
- Products can be created with a barcode, name, category, price, unitType
- `GET /products/barcode/KNOWN_CODE` returns product in < 500ms
- `GET /products/barcode/UNKNOWN` returns 404
- CASHIER cannot POST/PUT/PATCH products (403)

---

### PHASE 3 — CORE POS (Most Important Phase)

**Read `docs/specs/SPEC_pos.md` completely before writing any code.**

Build the full POS screen at `/pos` following `SPEC_pos.md` exactly:
- `BarcodeInput` component — captures keyboard scanner input on Enter
- `ProductSearch` component — debounced name search fallback  
- `CartItem` component — quantity controls, weight input for per_kg products, line total
- `CartSummary` component — grand total, payment method selector, Complete Sale button
- `ReceiptModal` component — shown after successful sale
- Zustand `cartStore` as specified in `SPEC_pos.md` Section 6
- `POST /sales` controller — **MUST use `prisma.$transaction()`** as shown in `SPEC_pos.md` Section 5
- All tests in `SPEC_pos.md` Section 9 must pass

**Phase 3 done when:**
- All 10 unit tests (T01–T10) pass
- All 5 E2E Playwright tests (E01–E05) pass
- Atomic transaction confirmed: no sale row exists if stock update fails
- POS tested on 768px tablet: full flow from scan to receipt in under 60 seconds

---

### PHASE 4 — STOCK MANAGEMENT

Build:
- `GET /stock` — all current stock levels (OWNER, STOCK_MANAGER)
- `POST /stock/receive` — scan delivery barcode, increment stock (STOCK_MANAGER, OWNER)
- `POST /stock/adjust` — manual adjustment with reason from enum (STOCK_MANAGER, OWNER)
- Inventory screen at `/inventory` with full stock table (DESIGN.md Section 7)
- Stock adjustment audit log visible to OWNER
- All adjustments written to `StockAdjustment` table AND `AuditLog`

**Phase 4 done when:**
- Stock correctly decrements on every sale (Phase 3 already ensures this)
- Manual adjustment creates `StockAdjustment` row with reason
- CASHIER cannot access `/stock` or `/inventory` (403)

---

### PHASE 5 — REPORTS

Build:
- `GET /reports/daily` — total transactions, total revenue, top 5 products (OWNER)
- `GET /reports/cashup` — totals by payment method: CASH / CARD / EFT (OWNER)
- `GET /reports/stock` — current stock levels all products (OWNER, STOCK_MANAGER)
- Owner dashboard at `/dashboard` — stat cards + recent sales (DESIGN.md Section 7)

**Phase 5 done when:**
- Dashboard shows today's revenue, sale count, and low-stock warnings
- Cash-up summary shows correct totals for each payment method
- CASHIER cannot access dashboard (redirected to /pos)

---

### PHASE 6 — POLISH & PRODUCTION READINESS

**This phase is mandatory. Do not skip it.**

1. **Error handling:** Every API route has a try/catch. Unhandled errors return `{ error: "..." }` with correct HTTP status — never leak stack traces to the client.

2. **Loading states:** Every API call shows a loading indicator (spinner or skeleton). Buttons are disabled while loading. No double-submission possible.

3. **Empty states:** Implement all empty states from `DESIGN.md` Section 12.

4. **Mobile responsiveness:** Test and fix every screen at 360px width. POS cart stacks vertically on mobile.

5. **Security audit:**
   - Run `npm audit --audit-level=high` — fix all high/critical findings
   - Verify no `.env` in git: `git ls-files .env` must return nothing
   - Confirm all routes have `authMiddleware` + `rbacMiddleware`
   - Confirm no `console.log` with passwords, tokens, or PII

6. **PWA setup:**
   - Add `apps/web/public/manifest.json`:
     ```json
     {
       "name": "BMS — Simon Family Farm",
       "short_name": "BMS",
       "start_url": "/pos",
       "display": "standalone",
       "background_color": "#0f1117",
       "theme_color": "#e8930a",
       "icons": [
         { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
         { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
       ]
     }
     ```
   - Register a Workbox service worker via `vite-plugin-pwa`
   - Cache strategy: NetworkFirst for API calls; CacheFirst for static assets

7. **E2E test suite:**
   - Set up Playwright with `@playwright/test`
   - Configure Playwright MCP server (see MCP config below)
   - Run all E2E tests from SPEC_pos.md
   - Add smoke tests: login flow, stock view, daily report

8. **Docker Compose for local dev:**
   ```yaml
   # docker-compose.yml
   services:
     postgres:
       image: postgres:15
       environment:
         POSTGRES_DB: bms
         POSTGRES_USER: bms_user
         POSTGRES_PASSWORD: local_dev_only
       ports: ["5432:5432"]
   ```

**Phase 6 done when:**
- `npm run lint` — 0 errors
- `npm test` (Vitest) — all pass
- `npx playwright test` — all pass
- Lighthouse PWA score ≥ 90 on `/pos` page
- `npm audit --audit-level=high` — 0 findings

---

## MCP TESTING CONFIGURATION

Use the **Playwright MCP server** to run and validate E2E tests as you build. This allows you to verify each phase in a real browser as you go.

Install and configure:
```bash
npm install -D @playwright/test
npx playwright install chromium
```

Add to your MCP config (`~/.gemini/mcp_config.json` or equivalent):
```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"],
      "env": {
        "PLAYWRIGHT_BROWSERS_PATH": "0"
      }
    }
  }
}
```

Use Playwright MCP to:
- Navigate to `http://localhost:5173` and verify pages load
- Simulate barcode scans (type text + press Enter in the barcode input)
- Complete a full POS sale end-to-end after Phase 3
- Verify role-based redirects after login
- Check that 360px and 768px layouts render correctly

---

## GENERAL RULES TO FOLLOW AT ALL TIMES

1. **Read the spec before building** — For every feature, copy `docs/SPEC_TEMPLATE.md` → fill it in → then build. No exceptions.

2. **Atomic DB writes** — Any operation that writes to more than one table uses `prisma.$transaction()`.

3. **Zod first** — Write the Zod schema before the controller. If you can't define the schema, you don't understand the feature well enough yet.

4. **Security.md is law** — RBAC on every route, bcrypt cost 12, no plaintext secrets, AES-256 for PII.

5. **Design.md is law** — Only the colors, fonts, and component patterns defined there. No purple gradients. No Inter font. No white backgrounds.

6. **Test as you go** — Don't build all 6 phases then test. Run `npx vitest run` after each phase. Run Playwright MCP after Phase 3.

7. **Commit after each phase** — `git add -A && git commit -m "phase-N: [description]"`

8. **Never hardcode credentials** — If you find yourself typing a password or DB URL in source code, stop. Put it in `.env`.

9. **Currency is South African Rand (ZAR)** — All prices displayed as `R 000.00`. No $ symbols.

10. **The target user is a butchery worker at a counter in Clermont, Durban** — Every UI decision should make their job faster. Speed > beauty. Clarity > cleverness.

---

Start with Phase 1. Confirm each phase is done (tests passing) before moving to the next.
