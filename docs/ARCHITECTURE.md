# ARCHITECTURE.md
# Butchery Management System (BMS) — Simon Family Farm
> Version 1.0 | June 2026 | Single-developer build target

---

## 1. System Overview

The BMS is a **full-stack Progressive Web App (PWA)** built on a RESTful Node.js/Express backend with a React frontend, backed by PostgreSQL. It replaces manual notebooks and verbal processes at Simon Family Farm Butchery, Clermont Rank, serving 10 staff across three roles.

```
┌────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                           │
│  React + Vite + Tailwind (PWA)                                 │
│  ├── POS Screen (Cashier)                                      │
│  ├── Inventory Panel (Stock Manager)                           │
│  └── Owner Dashboard (Reports + Admin)                         │
└────────────────────┬───────────────────────────────────────────┘
                     │ HTTPS / REST (JSON)
┌────────────────────▼───────────────────────────────────────────┐
│                        API LAYER                               │
│  Node.js + Express.js                                          │
│  ├── /auth       — JWT login, refresh, logout                  │
│  ├── /products   — CRUD, barcode lookup                        │
│  ├── /sales      — POS checkout, receipt                       │
│  ├── /stock      — levels, adjustments, delivery receive       │
│  ├── /customers  — create, search, history                     │
│  ├── /reports    — daily sales, cash-up, stock report          │
│  └── /employees  — admin CRUD, role management                 │
└────────────────────┬───────────────────────────────────────────┘
                     │ Prisma ORM (connection pooling)
┌────────────────────▼───────────────────────────────────────────┐
│                      DATABASE LAYER                            │
│  PostgreSQL 15                                                 │
│  Hosted: Railway (prod) / Docker (local dev)                   │
└────────────────────────────────────────────────────────────────┘
```

---

## 2. Monorepo Directory Structure

```
bms/
├── apps/
│   ├── api/                        # Node.js + Express backend
│   │   ├── src/
│   │   │   ├── routes/             # Express route files (one per domain)
│   │   │   ├── controllers/        # Business logic handlers
│   │   │   ├── middleware/         # auth.js, rbac.js, errorHandler.js, rateLimiter.js
│   │   │   ├── services/           # DB queries via Prisma (saleService, stockService…)
│   │   │   ├── utils/              # bcrypt helpers, JWT helpers, receipt generator
│   │   │   └── app.js              # Express app factory (no listen here)
│   │   ├── prisma/
│   │   │   ├── schema.prisma       # Single source of truth for DB schema
│   │   │   └── migrations/         # Auto-generated migration files
│   │   ├── tests/                  # Vitest unit + integration tests
│   │   │   ├── auth.test.js
│   │   │   ├── pos.test.js
│   │   │   └── stock.test.js
│   │   ├── .env.example            # Template — never commit real .env
│   │   ├── server.js               # Entry point (calls app.listen)
│   │   └── package.json
│   │
│   └── web/                        # React + Vite frontend
│       ├── src/
│       │   ├── pages/
│       │   │   ├── Login.jsx
│       │   │   ├── POS.jsx
│       │   │   ├── Inventory.jsx
│       │   │   ├── Dashboard.jsx
│       │   │   └── Admin.jsx
│       │   ├── components/
│       │   │   ├── Cart/
│       │   │   ├── ProductSearch/
│       │   │   ├── StockTable/
│       │   │   └── ReportCard/
│       │   ├── hooks/              # useAuth, useCart, useOfflineSync
│       │   ├── api/                # Axios instance + typed API callers
│       │   ├── store/              # Zustand slices (auth, cart, stock)
│       │   ├── service-worker.js   # Workbox offline strategy
│       │   └── main.jsx
│       ├── public/
│       │   └── manifest.json       # PWA manifest
│       ├── vite.config.js
│       └── package.json
│
├── docs/
│   ├── ARCHITECTURE.md             # This file
│   ├── SECURITY.md
│   ├── DESIGN.md
│   ├── SPEC_TEMPLATE.md
│   └── specs/                      # One SPEC.md per feature
│       ├── SPEC_auth.md
│       ├── SPEC_pos.md
│       └── …
│
├── docker-compose.yml              # Local: postgres + api + web
├── .github/
│   └── workflows/
│       └── ci.yml                  # Lint + test on every push
└── README.md
```

---

## 3. Technology Stack (Locked Versions)

| Layer | Technology | Version | Reason |
|---|---|---|---|
| Frontend framework | React | 18.x | Component model, PWA-friendly |
| Frontend build | Vite | 5.x | Fast HMR, tree-shaking |
| Styling | Tailwind CSS | 3.x | Utility-first, responsive by default |
| State management | Zustand | 4.x | Lightweight, no boilerplate |
| HTTP client | Axios | 1.x | Interceptors for JWT injection |
| Offline / PWA | Workbox | 7.x | Service worker, background sync |
| Backend runtime | Node.js | 20 LTS | LTS stability |
| Backend framework | Express.js | 4.x | Minimal, well-understood |
| ORM | Prisma | 5.x | Type-safe, auto-migrations |
| Database | PostgreSQL | 15.x | ACID transactions for POS |
| Auth tokens | jsonwebtoken | 9.x | JWT HS256, role claims |
| Password hashing | bcrypt | 5.x | Cost factor 12 |
| Validation | Zod | 3.x | Runtime schema validation on all inputs |
| Testing (API) | Vitest + Supertest | latest | Fast, ESM-native |
| Testing (UI) | Playwright | 1.x | E2E browser tests via MCP |
| Linting | ESLint + Prettier | latest | Enforced code style |
| IoT (scanner) | Web Serial API | browser-native | USB HID barcode scanner |
| IoT (scale) | Web Bluetooth API | browser-native | Phase 2 |
| Hosting (prod) | Railway | — | Free tier: PostgreSQL + Node.js |

---

## 4. Database Schema (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  OWNER
  CASHIER
  STOCK_MANAGER
}

enum PaymentMethod {
  CASH
  CARD
  EFT
}

enum StockAdjustmentReason {
  WASTAGE
  SPOILAGE
  COUNTING_ERROR
  DELIVERY
  OTHER
}

model Employee {
  id            String    @id @default(cuid())
  name          String
  email         String    @unique
  passwordHash  String
  role          Role
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  sales         Sale[]
  adjustments   StockAdjustment[]
  auditLogs     AuditLog[]
}

model Customer {
  id        String   @id @default(cuid())
  name      String
  phone     String?  @unique
  createdAt DateTime @default(now())
  sales     Sale[]
}

model Category {
  id       String    @id @default(cuid())
  name     String    @unique  // Beef, Chicken, Wors, Pork, Other
  products Product[]
}

model Product {
  id           String      @id @default(cuid())
  name         String
  barcode      String      @unique
  categoryId   String
  category     Category    @relation(fields: [categoryId], references: [id])
  pricePerUnit Decimal     @db.Decimal(10, 2)
  unitType     String      // "fixed" | "per_kg"
  isActive     Boolean     @default(true)
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
  stock        Stock?
  saleItems    SaleItem[]
  adjustments  StockAdjustment[]
}

model Stock {
  id           String   @id @default(cuid())
  productId    String   @unique
  product      Product  @relation(fields: [productId], references: [id])
  quantity     Decimal  @db.Decimal(10, 3)   // supports kg decimals
  lowThreshold Decimal  @db.Decimal(10, 3)   @default(0)
  updatedAt    DateTime @updatedAt
}

model Sale {
  id            String        @id @default(cuid())
  employeeId    String
  employee      Employee      @relation(fields: [employeeId], references: [id])
  customerId    String?
  customer      Customer?     @relation(fields: [customerId], references: [id])
  total         Decimal       @db.Decimal(10, 2)
  paymentMethod PaymentMethod
  createdAt     DateTime      @default(now())
  items         SaleItem[]
}

model SaleItem {
  id         String   @id @default(cuid())
  saleId     String
  sale       Sale     @relation(fields: [saleId], references: [id])
  productId  String
  product    Product  @relation(fields: [productId], references: [id])
  quantity   Int
  weightKg   Decimal? @db.Decimal(10, 3)
  unitPrice  Decimal  @db.Decimal(10, 2)
  lineTotal  Decimal  @db.Decimal(10, 2)
}

model StockAdjustment {
  id         String                @id @default(cuid())
  productId  String
  product    Product               @relation(fields: [productId], references: [id])
  employeeId String
  employee   Employee              @relation(fields: [employeeId], references: [id])
  changeQty  Decimal               @db.Decimal(10, 3)
  reason     StockAdjustmentReason
  notes      String?
  createdAt  DateTime              @default(now())
}

model AuditLog {
  id         String   @id @default(cuid())
  employeeId String
  employee   Employee @relation(fields: [employeeId], references: [id])
  action     String
  entity     String
  entityId   String?
  metadata   Json?
  createdAt  DateTime @default(now())
}
```

---

## 5. API Endpoints Reference

### Auth
| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | /auth/login | Public | Returns JWT + refresh token |
| POST | /auth/logout | Any | Invalidates refresh token |
| POST | /auth/refresh | Any | Rotates refresh token |
| POST | /auth/reset-password | OWNER | Resets a staff password |

### Products
| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | /products | Any | List all active products |
| GET | /products/barcode/:code | Any | Lookup by barcode (POS) |
| POST | /products | OWNER | Create product |
| PUT | /products/:id | OWNER | Update product/price |
| PATCH | /products/:id/archive | OWNER | Archive product |

### Sales (POS)
| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | /sales | CASHIER, OWNER | Create sale (atomic: sale + stock deduction) |
| GET | /sales/:id/receipt | Any | Get receipt for completed sale |
| GET | /sales | OWNER | Paginated sales history |

### Stock
| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | /stock | OWNER, STOCK_MANAGER | All stock levels |
| POST | /stock/receive | STOCK_MANAGER, OWNER | Record delivery (barcode scan) |
| POST | /stock/adjust | STOCK_MANAGER, OWNER | Manual adjustment with reason |

### Reports
| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | /reports/daily | OWNER | Daily sales summary |
| GET | /reports/cashup | OWNER | Cash-up by payment method |
| GET | /reports/stock | OWNER, STOCK_MANAGER | Full stock report |

---

## 6. Critical Non-Negotiable Constraints

1. **Atomic POS transactions** — Every `POST /sales` MUST use a Prisma `$transaction([...])` block. The sale record and all stock deductions commit together or not at all. Never do these as separate awaits.

2. **RBAC on every route** — Every API route (except `/auth/login`) must go through `authMiddleware` then `rbacMiddleware(allowedRoles)`. No exceptions.

3. **No plaintext secrets** — DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET stored in `.env` only. Verified absent from source via `.gitignore` and a pre-commit hook.

4. **Input validation** — Every request body validated with a Zod schema before reaching the controller. Validation errors return HTTP 422 with structured errors.

5. **TLS only in production** — Railway enforces HTTPS. Locally, HTTP is acceptable only on `localhost`.

6. **Barcode scanner** — The frontend POS screen listens for keyboard events (scanners emulate keyboard input). When a scan completes (ends with Enter key), fire the barcode lookup. No special driver needed.

---

## 7. Environment Variables

```bash
# apps/api/.env  (NEVER COMMIT)

# Database
DATABASE_URL="postgresql://user:password@host:5432/bms"

# JWT
JWT_SECRET="<min 64 char random string>"
JWT_REFRESH_SECRET="<different min 64 char random string>"
JWT_EXPIRES_IN="8h"
JWT_REFRESH_EXPIRES_IN="7d"

# App
PORT=3001
NODE_ENV="development"
CORS_ORIGIN="http://localhost:5173"

# Encryption (for customer PII at rest)
ENCRYPTION_KEY="<32 byte hex string>"
```

---

## 8. Local Development Setup

```bash
# Prerequisites: Node 20 LTS, Docker Desktop

# 1. Clone and install
git clone <repo>
cd bms
npm install            # installs all workspace packages

# 2. Start PostgreSQL
docker-compose up -d postgres

# 3. Run migrations and seed
cd apps/api
cp .env.example .env   # fill in DATABASE_URL
npx prisma migrate dev
npx prisma db seed     # creates owner account: admin@bms.local / Admin1234!

# 4. Start API
npm run dev            # nodemon on port 3001

# 5. Start Frontend (new terminal)
cd apps/web
npm run dev            # Vite on port 5173
```

---

## 9. Production Deployment (Railway)

1. Push monorepo to GitHub
2. Create Railway project → "Deploy from GitHub"
3. Add PostgreSQL plugin (Railway-managed)
4. Set all environment variables in Railway dashboard
5. Railway auto-detects `package.json` → runs `npm run build` then `npm start`
6. Set `CORS_ORIGIN` to Railway-assigned frontend URL
7. Run `npx prisma migrate deploy` as a Railway startup command

---

## 10. MVP Build Phases

| Phase | What Gets Built | Done When |
|---|---|---|
| 1 — Foundation | DB schema, migrations, seed, auth endpoints, JWT middleware, RBAC, user management | Login works; roles enforced |
| 2 — Products | Product CRUD, category management, barcode assignment | Products in DB, searchable by barcode |
| 3 — POS | Cart UI, barcode scan input, checkout flow, sale creation (atomic), digital receipt | Cashier completes full sale end-to-end |
| 4 — Stock | Real-time stock view, delivery receiving, manual adjustment, audit log | Stock numbers change correctly on every sale |
| 5 — Reports | Daily sales report, end-of-day cash-up summary, owner metrics | Owner sees today's revenue and cash-up |
| 6 — Polish | Error handling, loading states, empty states, mobile responsiveness, E2E tests | Playwright tests pass; UI works on 360px |
