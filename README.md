# Simon Family Farm — Butchery Management System (BMS)

A production-ready, full-stack Progressive Web Application (PWA) designed to replace paper notebooks and manual operations at the Simon Family Farm Butchery located at Clermont Rank, Durban, South Africa. 

This system provides real-time Point of Sale (POS) checkout, automated stock tracking, secure customer management, and comprehensive daily reports and dashboard analytics for butchery managers and owners.

---

## 🚀 Key Features

* **POS Checkout**: Optimized touch-friendly interface designed for tablet viewports (`768px`) at the sales counter. Cashiers can scan barcodes or select items manually and complete a sale in under 60 seconds.
* **Real-time Inventory & Stock Tracking**: Automatic stock deductions upon sales with low-stock alerts and weekly supplier delivery logging.
* **POPIA-Compliant Customer Management**: Zulu/SA customer directory with AES-256-GCM encryption-at-rest for PII (names, phone numbers) to ensure compliance with the Protection of Personal Information Act.
* **Daily Cash-Ups & Reports**: Automated end-of-day reports summarizing card, cash, and EFT sales, transaction volume, and overall revenue.
* **Owner Dashboard**: High-level sales ledger charts, revenue trends, top-selling products, and stock alert indicators.
* **Role-Based Access Control (RBAC)**: Enforced boundaries for `OWNER`, `CASHIER`, and `STOCK_MANAGER` across all API endpoints and frontend screens.

---

## 🛠️ Technology Stack

* **Frontend**: React + Vite + Tailwind CSS + Zustand (State Management) + Recharts (Dashboard Visualization) + Lucide React (Icons)
* **Backend**: Node.js + Express + Prisma ORM + PostgreSQL
* **Security & Auth**: JWT (HS256 access tokens, httpOnly refresh cookies), bcrypt (cost factor 12) password hashing, AES-256-GCM (for PII encryption).

---

## 📂 Project Structure

```
bms/
├── apps/
│   ├── api/                     # Node.js + Express backend
│   │   ├── src/                 # Controllers, routes, middleware, utils
│   │   ├── prisma/              # Schema.prisma and migration logs
│   │   └── tests/               # Integration & unit tests (Vitest)
│   └── web/                     # React + Vite frontend
│       ├── src/                 # Pages, components, hooks, stores
│       └── public/              # Icons, manifest, logos
├── README.md                    # Project documentation (You are here)
├── render.yaml                  # Deployment blueprint
└── supabase/                    # Local Database configs
```

---

## ⚙️ Local Development Setup

### Prerequisites

* Node.js (v18+)
* PostgreSQL Database (or a Supabase instance)

### 1. Database Configuration
In `apps/api/.env`, configure your PostgreSQL credentials:
```bash
DATABASE_URL="postgresql://user:pass@host:5432/bms?sslmode=require"
DIRECT_URL="postgresql://user:pass@host:5432/bms?sslmode=require"
JWT_SECRET="<64-character-random-key>"
JWT_REFRESH_SECRET="<64-character-random-key>"
ENCRYPTION_KEY="<32-byte-hex-key>" # For POPIA customer data encryption
```

### 2. Install Dependencies & Build Prisma Client
Navigate to the root directory and install dependencies:
```bash
# Install API dependencies
cd apps/api
npm install

# Run database migrations
npx prisma migrate dev --name init

# Generate the Prisma Client
npx prisma generate
```

### 3. Seed Database
To seed the database with the initial Owner account (`admin@bms.local` / `Admin1234!`) and categories:
```bash
npx prisma db seed
```

To populate the database with **3 months of realistic historical sales** (highly recommended for testing dashboard metrics):
```bash
node prisma/seedHistory.js
```

### 4. Running the Applications
Run both backend and frontend applications in development mode:

**Backend API (Port `3001`):**
```bash
cd apps/api
npm run dev
```

**Frontend React Web (Port `5173`):**
```bash
cd apps/web
npm install
npm run dev
```

---

## 🛡️ Security & Compliance Policies

* **Authentication**: Every API endpoint (except `/auth/login`) is strictly protected by `authMiddleware` and `rbacMiddleware`.
* **PII Encryption**: Customer names and phone numbers are encrypted before insertion into the PostgreSQL database.
* **Audit Trail**: Every critical action (stock adjustments, sale completions, product edits) is automatically written to the `AuditLog` table.
* **SQL Injection Prevention**: All queries are run via Prisma ORM parameterized statements, preventing raw SQL vulnerabilities.

---

## 🇿🇦 Durban Operating Context

* **Currency**: All amounts are formatted in South African Rand (ZAR) prefixed with `R`.
* **Tablet view**: POS interface is optimized for rapid touch entry (target viewport: `768px` width).
* **Owner view**: The dashboard is responsive and optimized for mobile devices (`360px` width) for remote monitoring.
