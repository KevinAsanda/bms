# ARCHITECTURE.md — Simon Family Farm Butchery Management System

> **Give this file to Gemini CLI at the start of every backend, API, or database generation prompt.**
> Every structural decision in this document is final unless explicitly revised.
> Gemini must not introduce new frameworks, databases, or services not listed here.

---

## 1. System Overview

The BMS is a **full-stack Progressive Web Application** built on a JavaScript-only stack (React + Node.js). It serves three user roles — Owner, Cashier, and Stock Manager — across mixed devices (desktop, tablet, mobile) in a butchery shop environment with potentially unreliable internet.

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                           │
│  React 18 + Vite + Tailwind CSS                             │
│  PWA (Workbox) — offline-capable service worker             │
│  Deployed as static files on CDN                            │
└─────────────┬───────────────────────────────────────────────┘
              │ HTTPS / REST JSON
              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API LAYER                              │
│  Node.js 20 LTS + Express 4                                 │
│  JWT auth middleware on every protected route               │
│  Helmet, CORS, rate-limiting, input validation              │
└─────────────┬───────────────────────────────────────────────┘
              │ Prisma ORM (connection pooling)
              ▼
┌─────────────────────────────────────────────────────────────┐
│                   DATABASE LAYER                            │
│  PostgreSQL 15                                              │
│  Hosted on Railway (production) / local Docker (dev)        │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Monorepo Structure

```
simon-bms/
├── apps/
│   ├── web/                  # React frontend (Vite)
│   │   ├── public/
│   │   │   ├── logo.png      # Butcher mascot logo
│   │   │   ├── manifest.json
│   │   │   └── icons/        # PWA icons: 192, 512
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx
│   │   │   ├── router.tsx    # React Router v6 routes
│   │   │   ├── styles/
│   │   │   │   ├── tokens.css       # All CSS variables (from DESIGN.md §14)
│   │   │   │   └── global.css       # Reset + base styles
│   │   │   ├── components/          # Shared UI components
│   │   │   │   ├── Button/
│   │   │   │   ├── Input/
│   │   │   │   ├── Card/
│   │   │   │   ├── Table/
│   │   │   │   ├── Badge/
│   │   │   │   ├── Toast/
│   │   │   │   ├── Modal/
│   │   │   │   ├── Sidebar/
│   │   │   │   └── ThemeToggle/
│   │   │   ├── features/            # Feature modules (co-located)
│   │   │   │   ├── auth/
│   │   │   │   │   ├── LoginPage.tsx
│   │   │   │   │   ├── useAuth.ts
│   │   │   │   │   └── authStore.ts
│   │   │   │   ├── pos/
│   │   │   │   │   ├── POSPage.tsx
│   │   │   │   │   ├── Cart.tsx
│   │   │   │   │   ├── ProductSearch.tsx
│   │   │   │   │   ├── BarcodeInput.tsx
│   │   │   │   │   ├── CheckoutModal.tsx
│   │   │   │   │   ├── Receipt.tsx
│   │   │   │   │   └── posStore.ts
│   │   │   │   ├── inventory/
│   │   │   │   │   ├── StockPage.tsx
│   │   │   │   │   ├── StockTable.tsx
│   │   │   │   │   ├── ReceiveDelivery.tsx
│   │   │   │   │   └── StockCorrection.tsx
│   │   │   │   ├── products/
│   │   │   │   │   ├── ProductsPage.tsx
│   │   │   │   │   ├── ProductForm.tsx
│   │   │   │   │   └── ProductTable.tsx
│   │   │   │   ├── reports/
│   │   │   │   │   ├── DailyReport.tsx
│   │   │   │   │   ├── CashUpSummary.tsx
│   │   │   │   │   └── ReportsPage.tsx
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── DashboardPage.tsx
│   │   │   │   │   ├── MetricCard.tsx
│   │   │   │   │   └── SalesChart.tsx
│   │   │   │   ├── customers/
│   │   │   │   │   ├── CustomersPage.tsx
│   │   │   │   │   └── CustomerSearch.tsx
│   │   │   │   └── settings/
│   │   │   │       ├── SettingsPage.tsx
│   │   │   │       └── UserManagement.tsx
│   │   │   ├── hooks/               # Shared hooks
│   │   │   │   ├── useBarcode.ts
│   │   │   │   ├── useOfflineQueue.ts
│   │   │   │   └── usePermissions.ts
│   │   │   ├── lib/
│   │   │   │   ├── api.ts           # Axios instance + interceptors
│   │   │   │   └── queryClient.ts   # TanStack Query config
│   │   │   └── sw.ts                # Service worker (Workbox)
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.ts
│   │   └── package.json
│   │
│   └── api/                  # Node.js Express backend
│       ├── src/
│       │   ├── index.ts             # App entry point
│       │   ├── server.ts            # Express setup + middleware
│       │   ├── prisma.ts            # Prisma client singleton
│       │   ├── routes/
│       │   │   ├── index.ts         # Route aggregator
│       │   │   ├── auth.routes.ts
│       │   │   ├── products.routes.ts
│       │   │   ├── sales.routes.ts
│       │   │   ├── stock.routes.ts
│       │   │   ├── customers.routes.ts
│       │   │   ├── reports.routes.ts
│       │   │   └── users.routes.ts
│       │   ├── controllers/
│       │   │   ├── auth.controller.ts
│       │   │   ├── products.controller.ts
│       │   │   ├── sales.controller.ts
│       │   │   ├── stock.controller.ts
│       │   │   ├── customers.controller.ts
│       │   │   ├── reports.controller.ts
│       │   │   └── users.controller.ts
│       │   ├── middleware/
│       │   │   ├── authenticate.ts  # Verify JWT
│       │   │   ├── authorize.ts     # Check role claim
│       │   │   ├── validate.ts      # Zod schema validation
│       │   │   ├── rateLimiter.ts   # express-rate-limit
│       │   │   └── auditLog.ts      # Log every mutation
│       │   ├── services/
│       │   │   ├── auth.service.ts
│       │   │   ├── sale.service.ts  # Atomic sale + stock update
│       │   │   ├── stock.service.ts
│       │   │   └── report.service.ts
│       │   └── utils/
│       │       ├── errors.ts        # Custom error classes
│       │       └── logger.ts        # Winston logger
│       ├── prisma/
│       │   ├── schema.prisma
│       │   ├── migrations/
│       │   └── seed.ts              # Dev seed data
│       └── package.json
│
├── package.json               # Workspace root
└── .env.example
```

---

## 3. Technology Stack — Locked Versions

| Layer                 | Package                             | Version | Reason                                     |
| --------------------- | ----------------------------------- | ------- | ------------------------------------------ |
| Frontend framework    | `react`                             | 18.x    | Industry standard, huge ecosystem          |
| Build tool            | `vite`                              | 5.x     | Fastest dev builds, PWA plugin support     |
| Routing               | `react-router-dom`                  | 6.x     | File-system style routing, loaders         |
| State (server)        | `@tanstack/react-query`             | 5.x     | API state, caching, refetch on focus       |
| State (client)        | `zustand`                           | 4.x     | POS cart, auth state — minimal boilerplate |
| Styling               | `tailwindcss`                       | 3.x     | Utility-first, tokens from DESIGN.md       |
| Icons                 | `lucide-react`                      | latest  | See DESIGN.md §7                           |
| Forms                 | `react-hook-form`                   | 7.x     | Performant, works with Zod                 |
| Validation (FE)       | `zod`                               | 3.x     | Schema sharing with backend                |
| Charts                | `recharts`                          | 2.x     | Composable, React-native                   |
| PWA                   | `vite-plugin-pwa` + `workbox`       | latest  | Service worker generation                  |
| HTTP client           | `axios`                             | 1.x     | Interceptors for auth token injection      |
| Backend runtime       | `node`                              | 20 LTS  | Long-term support                          |
| API framework         | `express`                           | 4.x     | Stable, well-documented                    |
| ORM                   | `prisma`                            | 5.x     | Type-safe, auto-migrations                 |
| Database              | `postgresql`                        | 15.x    | Relational, ACID, ideal for POS            |
| Auth                  | `jsonwebtoken`                      | 9.x     | JWT signing and verification               |
| Password hashing      | `bcrypt`                            | 5.x     | Cost factor 12                             |
| Input validation (BE) | `zod`                               | 3.x     | Same schemas as frontend                   |
| HTTP security         | `helmet`                            | 7.x     | Sets 12 security headers automatically     |
| Rate limiting         | `express-rate-limit`                | 7.x     | Brute-force protection                     |
| CORS                  | `cors`                              | 2.x     | Whitelist frontend origin only             |
| Logging               | `winston`                           | 3.x     | Structured JSON logs                       |
| Testing (FE)          | `vitest` + `@testing-library/react` | latest  | Fast, Vite-native                          |
| Testing (BE)          | `jest` + `supertest`                | latest  | API integration tests                      |

---

## 4. Database Schema

Full Prisma schema. Every model here maps directly to the PRD entities.

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

enum PricingType {
  FIXED        // per packet / each
  WEIGHT_BASED // per kg
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
  THEFT
  DAMAGE
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
  updatedAt     DateTime  @updatedAt

  sales             Sale[]
  stockAdjustments  StockAdjustment[]
  auditLogs         AuditLog[]

  @@index([email])
  @@map("employees")
}

model Customer {
  id          String    @id @default(cuid())
  name        String
  phone       String?   @unique
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  sales       Sale[]

  @@index([phone])
  @@map("customers")
}

model Category {
  id        String    @id @default(cuid())
  name      String    @unique  // Beef, Chicken, Wors, Pork, Other
  createdAt DateTime  @default(now())

  products  Product[]

  @@map("categories")
}

model Product {
  id           String      @id @default(cuid())
  name         String
  barcode      String      @unique
  pricingType  PricingType
  pricePerUnit Decimal     @db.Decimal(10, 2)  // per unit OR per kg
  unit         String      // "kg", "each", "pack"
  isActive     Boolean     @default(true)
  categoryId   String
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  category     Category    @relation(fields: [categoryId], references: [id])
  stock        Stock?
  saleItems    SaleItem[]

  @@index([barcode])
  @@index([categoryId])
  @@index([isActive])
  @@map("products")
}

model Stock {
  id           String    @id @default(cuid())
  productId    String    @unique
  quantity     Decimal   @db.Decimal(10, 3)  // 3dp for kg precision
  lowThreshold Decimal   @db.Decimal(10, 3)  @default(2)
  updatedAt    DateTime  @updatedAt

  product      Product   @relation(fields: [productId], references: [id])

  @@map("stock")
}

model Sale {
  id            String        @id @default(cuid())
  employeeId    String
  customerId    String?       // nullable — anonymous sales allowed
  totalAmount   Decimal       @db.Decimal(10, 2)
  paymentMethod PaymentMethod
  receiptRef    String        @unique @default(cuid())
  createdAt     DateTime      @default(now())

  employee      Employee      @relation(fields: [employeeId], references: [id])
  customer      Customer?     @relation(fields: [customerId], references: [id])
  items         SaleItem[]

  @@index([employeeId])
  @@index([customerId])
  @@index([createdAt])
  @@map("sales")
}

model SaleItem {
  id          String    @id @default(cuid())
  saleId      String
  productId   String
  quantity    Decimal   @db.Decimal(10, 3)
  weightKg    Decimal?  @db.Decimal(10, 3)  // null for fixed-price items
  unitPrice   Decimal   @db.Decimal(10, 2)
  lineTotal   Decimal   @db.Decimal(10, 2)

  sale        Sale      @relation(fields: [saleId], references: [id])
  product     Product   @relation(fields: [productId], references: [id])

  @@index([saleId])
  @@map("sale_items")
}

model StockAdjustment {
  id          String                 @id @default(cuid())
  productId   String
  employeeId  String
  changeQty   Decimal                @db.Decimal(10, 3)  // + for receive, - for correction
  reason      StockAdjustmentReason
  notes       String?
  createdAt   DateTime               @default(now())

  employee    Employee               @relation(fields: [employeeId], references: [id])

  @@index([productId])
  @@index([createdAt])
  @@map("stock_adjustments")
}

model AuditLog {
  id         String   @id @default(cuid())
  employeeId String
  action     String   // e.g. "SALE_COMPLETED", "STOCK_ADJUSTED", "PRODUCT_EDITED"
  entityType String   // e.g. "Sale", "Product", "Employee"
  entityId   String
  metadata   Json?    // Stores before/after snapshots
  ipAddress  String?
  createdAt  DateTime @default(now())

  employee   Employee @relation(fields: [employeeId], references: [id])

  @@index([employeeId])
  @@index([createdAt])
  @@index([entityType, entityId])
  @@map("audit_logs")
}

model Supplier {
  id        String   @id @default(cuid())
  name      String
  contact   String?
  email     String?
  phone     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("suppliers")
}
```

---

## 5. API Routes

All routes are prefixed with `/api/v1`.

### 5.1 Auth

| Method | Endpoint        | Auth | Role | Description        |
| ------ | --------------- | ---- | ---- | ------------------ |
| POST   | `/auth/login`   | ❌   | —    | Login, returns JWT |
| POST   | `/auth/logout`  | ✅   | All  | Invalidate session |
| GET    | `/auth/me`      | ✅   | All  | Get current user   |
| POST   | `/auth/refresh` | ✅   | All  | Refresh JWT        |

### 5.2 Products

| Method | Endpoint                     | Auth | Role  | Description                 |
| ------ | ---------------------------- | ---- | ----- | --------------------------- |
| GET    | `/products`                  | ✅   | All   | List all active products    |
| GET    | `/products/:id`              | ✅   | All   | Get single product          |
| GET    | `/products/barcode/:barcode` | ✅   | All   | Lookup by barcode (POS use) |
| POST   | `/products`                  | ✅   | Owner | Create product              |
| PUT    | `/products/:id`              | ✅   | Owner | Update product              |
| PATCH  | `/products/:id/archive`      | ✅   | Owner | Archive product             |

### 5.3 Sales

| Method | Endpoint       | Auth | Role           | Description                                        |
| ------ | -------------- | ---- | -------------- | -------------------------------------------------- |
| POST   | `/sales`       | ✅   | Cashier, Owner | Create sale (atomic: inserts sale + deducts stock) |
| GET    | `/sales`       | ✅   | Owner          | List sales (paginated, date-filtered)              |
| GET    | `/sales/:id`   | ✅   | Owner, Cashier | Get sale with receipt                              |
| GET    | `/sales/today` | ✅   | Owner          | Today's sales summary                              |

### 5.4 Stock

| Method | Endpoint             | Auth | Role            | Description                      |
| ------ | -------------------- | ---- | --------------- | -------------------------------- |
| GET    | `/stock`             | ✅   | Owner, StockMgr | Full stock list with levels      |
| GET    | `/stock/:productId`  | ✅   | All             | Single product stock level       |
| POST   | `/stock/receive`     | ✅   | StockMgr, Owner | Receive delivery (adds to stock) |
| POST   | `/stock/adjust`      | ✅   | StockMgr, Owner | Manual correction with reason    |
| GET    | `/stock/adjustments` | ✅   | Owner           | Audit log of all adjustments     |

### 5.5 Reports

| Method | Endpoint                    | Auth | Role  | Description                          |
| ------ | --------------------------- | ---- | ----- | ------------------------------------ |
| GET    | `/reports/daily`            | ✅   | Owner | Daily sales report                   |
| GET    | `/reports/cashup`           | ✅   | Owner | End-of-day cash-up by payment method |
| GET    | `/reports/top-products`     | ✅   | Owner | Top 5 products by quantity/revenue   |
| GET    | `/reports/employee-summary` | ✅   | Owner | Per-employee sales count             |

### 5.6 Customers

| Method | Endpoint                 | Auth | Role           | Description             |
| ------ | ------------------------ | ---- | -------------- | ----------------------- |
| GET    | `/customers`             | ✅   | Owner          | List customers          |
| GET    | `/customers/search`      | ✅   | Cashier, Owner | Search by name or phone |
| POST   | `/customers`             | ✅   | Cashier, Owner | Create customer         |
| GET    | `/customers/:id/history` | ✅   | Owner          | Purchase history        |

### 5.7 Users (Employee Management)

| Method | Endpoint                    | Auth | Role  | Description             |
| ------ | --------------------------- | ---- | ----- | ----------------------- |
| GET    | `/users`                    | ✅   | Owner | List all employees      |
| POST   | `/users`                    | ✅   | Owner | Create employee account |
| PUT    | `/users/:id`                | ✅   | Owner | Edit employee           |
| PATCH  | `/users/:id/deactivate`     | ✅   | Owner | Deactivate account      |
| PATCH  | `/users/:id/reset-password` | ✅   | Owner | Reset staff password    |

---

## 6. Critical Service: Atomic Sale Processing

This is the most important function in the entire system. **Stock deduction and sale recording must happen in a single PostgreSQL transaction.** If either fails, both roll back.

```typescript
// apps/api/src/services/sale.service.ts

import prisma from "../prisma";
import { CreateSaleDto } from "../schemas/sale.schema";

export async function createSale(data: CreateSaleDto, employeeId: string) {
  return prisma.$transaction(async (tx) => {
    // 1. Verify all products exist and are active
    const productIds = data.items.map((i) => i.productId);
    const products = await tx.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      include: { stock: true },
    });

    if (products.length !== productIds.length) {
      throw new Error("One or more products not found or inactive");
    }

    // 2. Check stock availability and calculate line totals
    let totalAmount = 0;
    const itemsWithTotals = data.items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      const stock = product.stock!;

      const deductQty =
        product.pricingType === "WEIGHT_BASED" ? item.weightKg! : item.quantity;

      if (Number(stock.quantity) < Number(deductQty)) {
        throw new Error(`Insufficient stock for product: ${product.name}`);
      }

      const lineTotal =
        product.pricingType === "WEIGHT_BASED"
          ? Number(product.pricePerUnit) * Number(item.weightKg)
          : Number(product.pricePerUnit) * Number(item.quantity);

      totalAmount += lineTotal;

      return { ...item, unitPrice: product.pricePerUnit, lineTotal, deductQty };
    });

    // 3. Create the Sale record
    const sale = await tx.sale.create({
      data: {
        employeeId,
        customerId: data.customerId ?? null,
        totalAmount,
        paymentMethod: data.paymentMethod,
        items: {
          create: itemsWithTotals.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            weightKg: i.weightKg ?? null,
            unitPrice: i.unitPrice,
            lineTotal: i.lineTotal,
          })),
        },
      },
      include: { items: { include: { product: true } }, customer: true },
    });

    // 4. Deduct stock for every item (bulk update)
    await Promise.all(
      itemsWithTotals.map((item) =>
        tx.stock.update({
          where: { productId: item.productId },
          data: { quantity: { decrement: item.deductQty } },
        }),
      ),
    );

    // 5. Write audit log entry
    await tx.auditLog.create({
      data: {
        employeeId,
        action: "SALE_COMPLETED",
        entityType: "Sale",
        entityId: sale.id,
        metadata: {
          totalAmount,
          itemCount: data.items.length,
          paymentMethod: data.paymentMethod,
        },
      },
    });

    return sale;
  });
}
```

---

## 7. Authentication Flow

```
Client                          API Server
  │                                │
  │  POST /auth/login              │
  │  { email, password }  ────────►│
  │                                │  1. Find employee by email
  │                                │  2. bcrypt.compare(password, hash)
  │                                │  3. If match: sign JWT
  │                                │     payload: { sub: id, role, name }
  │                                │     expires: 8h
  │◄──────────────────────────────│
  │  { token, user }               │
  │                                │
  │  GET /api/v1/products          │
  │  Authorization: Bearer <token> │
  │  ────────────────────────────►│
  │                                │  4. authenticate middleware:
  │                                │     - Extract token from header
  │                                │     - jwt.verify(token, JWT_SECRET)
  │                                │     - Attach decoded payload to req.user
  │                                │  5. authorize('CASHIER','OWNER') middleware:
  │                                │     - Check req.user.role in allowed roles
  │                                │     - 403 if not permitted
  │◄──────────────────────────────│
  │  200 { products: [...] }       │
```

---

## 8. PWA Offline Architecture

```
Browser
  │
  ├─ Service Worker (Workbox)
  │   ├─ CACHE FIRST: fonts, icons, logo, CSS, JS bundles
  │   ├─ NETWORK FIRST: API calls (with cache fallback for GET requests)
  │   └─ BACKGROUND SYNC: queued sales when offline
  │
  └─ IndexedDB (via idb-keyval)
      ├─ offlineSalesQueue: Sale[] — queued while offline
      ├─ productCache: Product[] — last-known product catalogue
      └─ stockCache: Stock[] — last-known stock levels
```

**Offline sale flow:**

```
1. Cashier completes sale → POST /api/v1/sales fails (offline)
2. Service worker intercepts → stores sale in IndexedDB offlineSalesQueue
3. UI shows: "Sale saved offline — will sync when connected"
4. Internet restored → Workbox Background Sync fires
5. POST /api/v1/sales replayed → server processes atomically
6. UI shows: "1 offline sale synced successfully"
```

---

## 9. Environment Variables

```bash
# apps/api/.env

# Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/simon_bms?schema=public"

# Auth
JWT_SECRET="minimum-64-character-random-string-generated-with-openssl"
JWT_EXPIRES_IN="8h"
BCRYPT_ROUNDS=12

# Server
PORT=3001
NODE_ENV="production"
CORS_ORIGIN="https://your-frontend-domain.com"

# Logging
LOG_LEVEL="info"

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000   # 15 minutes
RATE_LIMIT_MAX=100            # max requests per window

# Login brute-force protection
LOGIN_LIMIT_WINDOW_MS=900000  # 15 minutes
LOGIN_LIMIT_MAX=5             # max failed attempts before lockout
```

```bash
# apps/web/.env

VITE_API_BASE_URL="https://your-api-domain.com/api/v1"
```

---

## 10. Deployment Architecture

```
┌──────────────────────────────────────────┐
│               PRODUCTION                 │
│                                          │
│  ┌─────────────┐    ┌─────────────────┐  │
│  │  Vercel CDN │    │  Railway        │  │
│  │  (Frontend) │    │  (API + DB)     │  │
│  │             │    │                 │  │
│  │  React SPA  │    │  Node.js API    │  │
│  │  + PWA SW   │◄──►│  PostgreSQL 15  │  │
│  │             │    │  Nightly backup │  │
│  └─────────────┘    └─────────────────┘  │
│                                          │
│  Custom domain: bms.simonfamilyfarm.co   │
└──────────────────────────────────────────┘
```

**Frontend (Vercel — free tier):**

- `vercel.json` rewrites all paths to `index.html` (SPA routing)
- Automatic HTTPS
- Global CDN

**Backend (Railway — starter plan):**

- Node.js service + PostgreSQL 15 plugin
- Automatic deploy on push to `main`
- Daily backups enabled in Railway dashboard
- Environment variables set in Railway project settings

---

## 11. Scripts Reference

```json
// Root package.json workspaces scripts
{
  "scripts": {
    "dev": "concurrently \"npm run dev -w apps/web\" \"npm run dev -w apps/api\"",
    "build": "npm run build -w apps/web && npm run build -w apps/api",
    "db:migrate": "npm run db:migrate -w apps/api",
    "db:seed": "npm run db:seed -w apps/api",
    "db:studio": "npm run db:studio -w apps/api",
    "test": "npm run test -w apps/web && npm run test -w apps/api",
    "lint": "eslint apps/web/src apps/api/src"
  }
}
```

```json
// apps/api/package.json scripts
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "db:migrate": "prisma migrate deploy",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio",
    "test": "jest --coverage"
  }
}
```

---

## 12. Gemini CLI Prompt Snippets

### For any backend route:

```
Using the Simon Family Farm BMS architecture (ARCHITECTURE.md):
- Node.js 20 + Express 4 + Prisma 5 + PostgreSQL 15
- All routes require JWT auth middleware (authenticate.ts)
- All mutations require role check (authorize.ts)
- All input validated with Zod before hitting the controller
- All mutations write an AuditLog entry
- Sale creation MUST use prisma.$transaction() — never split stock deduction
  from sale insertion
- Error responses: { error: string, code?: string }
- Success responses: { data: T, message?: string }
```

### For any database query:

```
Using Prisma 5 with PostgreSQL. Schema in ARCHITECTURE.md §4.
- Use Decimal type for all money and weight fields
- Always include relevant @@index fields in where clauses
- Use select to limit returned fields — never return passwordHash to client
- Paginate list queries: take/skip with default take=50
```

---

_ARCHITECTURE.md — Simon Family Farm BMS — v1.0 — June 2026_
_Stack: React 18 + Vite + Node.js 20 + Express 4 + Prisma 5 + PostgreSQL 15_
