<div align="center">
  <img src="apps/web/public/logo-icon.svg" alt="Simon Family Farm BMS Logo" width="96" />
  <h1>Simon Family Farm — Butchery Management System (BMS)</h1>
  <p>
    <strong>Full-stack Progressive Web App for retail butchery operations with tablet-first POS checkout, real-time stock deductions, RBAC, and POPIA AES-256-GCM PII encryption.</strong>
  </p>

  <p>
    <img src="https://img.shields.io/badge/React-19%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
    <img src="https://img.shields.io/badge/Express-Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Express" />
    <img src="https://img.shields.io/badge/Prisma-PostgreSQL-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma PostgreSQL" />
    <img src="https://img.shields.io/badge/Security-AES--256--GCM%20%2B%20RBAC-dc2626?style=for-the-badge" alt="POPIA Security" />
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="MIT License" /></a>
  </p>

  <p>
    <a href="#-screenshots">Screenshots</a> •
    <a href="#-features">Features</a> •
    <a href="#%EF%B8%8F-architecture--tech-stack">Architecture</a> •
    <a href="#-getting-started">Getting Started</a>
  </p>
</div>

---

## What Is Simon Family Farm BMS?

**Simon Family Farm BMS** is a full-stack Progressive Web App (PWA) engineered to replace paper notebooks and manual cash-ups at Simon Family Farm Butchery in Clermont Rank, Durban, South Africa.

It delivers sub-60-second **tablet POS checkout** with variable-weight EAN-13 barcode scanning, automatic inventory deductions, **POPIA-compliant AES-256-GCM encryption at rest** for customer PII, role-based access control (`OWNER`, `CASHIER`, `STOCK_MANAGER`), and daily cash-up analytics.

---

## 📱 Screenshots

*(Captured locally from the React + Vite frontend with synthetic demo data — no live store PII.)*

<table>
  <tr>
    <td align="center" width="50%">
      <img src="docs/screenshots/02-owner-dashboard.png" alt="BMS Owner Dashboard with ZAR Revenue and 7-Day Sales Trend" width="100%" /><br />
      <sub><strong>Owner Dashboard</strong> — Live ZAR revenue KPIs, 7-day Recharts trend &amp; low-stock alerts</sub>
    </td>
    <td align="center" width="50%">
      <img src="docs/screenshots/03-pos-tablet.png" alt="BMS Tablet POS Counter Checkout" width="100%" /><br />
      <sub><strong>Tablet POS Checkout</strong> — Touch-friendly 1024×768 counter layout with live cart &amp; Cash/Card/EFT split</sub>
    </td>
  </tr>
  <tr>
    <td align="center" colspan="2">
      <img src="docs/screenshots/01-login.png" alt="BMS Role-Gated Sign In with POPIA Notice" width="70%" /><br />
      <sub><strong>Role-Gated Authentication</strong> — Employee login with POPIA compliance notice &amp; inactivity lock</sub>
    </td>
  </tr>
</table>

---

## ✨ Features

- **Tablet-First POS Checkout**: Built for counter viewports (`768px`–`1024px`) with hardware & camera EAN-13 weight-embedded barcode scanning (`20xxxx`), on-screen virtual keyboard/numpad, and Cash / Card / EFT settlement.
- **Real-Time Stock & Supplier Tracking**: Automatic stock deductions per sale, low-stock threshold alerts, and supplier delivery audit logs.
- **POPIA-Compliant Customer Encryption**: Customer names and phone numbers are encrypted at rest using **AES-256-GCM** before PostgreSQL storage, paired with explicit POPIA consent capture.
- **Owner Intelligence & Daily Cash-Ups**: Recharts revenue trends, top-selling cuts, payment method breakdowns, and end-of-day reconciliation reports.
- **Strict RBAC & Audit Trail**: JWT access tokens + `httpOnly` refresh cookies, bcrypt password hashing (cost 12), inactivity auto-logout, and immutable `AuditLog` entries for critical mutations.

---

## 🛠️ Architecture & Tech Stack

```mermaid
flowchart LR
  POS["Counter Tablet / Owner Browser (React + Vite PWA)"] -->|JWT + httpOnly Cookie| API["Express REST API (apps/api)"]
  API --> Auth["Auth & RBAC Middleware (OWNER / CASHIER / STOCK_MANAGER)"]
  API --> Crypto["AES-256-GCM PII Encryption Utility"]
  API --> Prisma["Prisma ORM"]
  Prisma --> DB["PostgreSQL / Supabase"]
```

| Layer | Technology |
| --- | --- |
| **Frontend (`apps/web`)** | React 19, Vite, Tailwind CSS, Zustand, Recharts, Lucide Icons |
| **Backend (`apps/api`)** | Node.js, Express, Prisma ORM, PostgreSQL |
| **Security & Compliance** | JWT (HS256) + `httpOnly` refresh cookies, `bcrypt` (cost 12), AES-256-GCM PII encryption |
| **Testing & Hosting** | Vitest API integration tests, Render Blueprint ([`render.yaml`](render.yaml)) |

### Project Structure

```text
bms/
├── apps/
│   ├── api/                 # Express REST API, auth/RBAC middleware, AES-256-GCM utils & Vitest tests
│   │   ├── prisma/          # schema.prisma, migrations, seed.js & seedHistory.js
│   │   └── src/             # Controllers, routes, middleware, encryption utils
│   └── web/                 # React 19 + Vite PWA (POS, Inventory, Dashboard, Reports, Relations, VirtualKeyboard)
├── supabase/                # Local Supabase config
├── docs/screenshots/        # UI screenshots used in README
└── render.yaml              # Multi-service Render blueprint
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+**
- **PostgreSQL** (or Supabase instance)

### 1. Configure Backend Environment
Create `apps/api/.env`:
```env
DATABASE_URL="postgresql://user:pass@host:5432/bms?sslmode=require"
DIRECT_URL="postgresql://user:pass@host:5432/bms?sslmode=require"
JWT_SECRET="<64-character-random-key>"
JWT_REFRESH_SECRET="<64-character-random-key>"
ENCRYPTION_KEY="<32-byte-hex-key>"
```

### 2. Migrate, Seed & Run
```bash
# Backend API (port 3001)
cd apps/api
npm install
npx prisma migrate dev --name init
npx prisma generate
npx prisma db seed
node prisma/seedHistory.js
npm run dev

# Frontend PWA (port 5173)
cd ../web
npm install
npm run dev
```

### 3. Run API Tests
```bash
cd apps/api
npm test
```

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.
