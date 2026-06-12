# SECURITY.md — Simon Family Farm Butchery Management System

> **Give this file to Gemini CLI whenever generating authentication, API routes, middleware, or any code that handles user data, passwords, tokens, or financial records.**
> Every security control here is mandatory. Gemini must not skip, simplify, or replace any listed control without explicit written justification.

---

## 1. Security Philosophy

The BMS handles financial transaction records, employee credentials, and customer personal information. It runs in a shop environment where multiple people share devices, and where the owner may not have a technical background to detect a breach.

Security is implemented **by default, not by choice**. Every new route, every new field, and every new feature inherits the security baseline below. The burden of proof is on removing a control, not adding one.

**Threat model summary:**

- Insider threat: a cashier accessing owner reports or modifying stock records
- Credential theft: weak passwords or unencrypted transmission
- Data breach: customer phone numbers and transaction history exposed
- Session abuse: a logged-in session left open on a shared tablet
- Replay attacks: a sale submitted twice
- API abuse: automated scraping or brute-force attacks

---

## 2. Authentication

### 2.1 Password Policy

Enforced at **both** frontend (react-hook-form + Zod) and backend (Zod middleware). Both must agree.

```typescript
// Shared: apps/api/src/schemas/password.schema.ts
// (imported by both frontend validation and backend middleware)

import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password too long") // bcrypt max input length
  .regex(/[A-Z]/, "Must contain at least one uppercase letter")
  .regex(/[a-z]/, "Must contain at least one lowercase letter")
  .regex(/[0-9]/, "Must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Must contain at least one special character");
```

### 2.2 Password Hashing

```typescript
// apps/api/src/utils/password.ts

import bcrypt from "bcrypt";

const ROUNDS = parseInt(process.env.BCRYPT_ROUNDS ?? "12");

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
```

**Rules:**

- Cost factor: minimum `12` in production, `10` acceptable in development only
- Never log a plain-text password under any circumstances
- Never return `passwordHash` from any API response — use Prisma `select` to explicitly exclude it
- Store only the hash — never the plain password, never a reversible cipher

```typescript
// ALWAYS exclude passwordHash from queries:
const employee = await prisma.employee.findUnique({
  where: { id },
  select: {
    id: true,
    name: true,
    email: true,
    role: true,
    isActive: true,
    // passwordHash is NEVER included
  },
});
```

### 2.3 JWT Configuration

```typescript
// apps/api/src/utils/jwt.ts

import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET!; // minimum 64 random characters
const EXPIRES = process.env.JWT_EXPIRES_IN ?? "8h";

export interface JwtPayload {
  sub: string; // employee ID
  role: "OWNER" | "CASHIER" | "STOCK_MANAGER";
  name: string;
  iat: number;
  exp: number;
}

export function signToken(payload: Omit<JwtPayload, "iat" | "exp">): string {
  return jwt.sign(payload, SECRET, {
    expiresIn: EXPIRES,
    algorithm: "HS256",
  });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, SECRET) as JwtPayload;
  // throws JsonWebTokenError if invalid, TokenExpiredError if expired
}
```

**Rules:**

- `JWT_SECRET` must be at least 64 randomly-generated characters
- Generate with: `openssl rand -hex 64`
- Never hardcode `JWT_SECRET` — always from environment variable
- Tokens expire after 8 hours (one business day maximum)
- Token is sent in `Authorization: Bearer <token>` header only — **never in a URL query string, never in a cookie without `HttpOnly` + `Secure` + `SameSite=Strict`**

### 2.4 Brute-Force Login Protection

```typescript
// apps/api/src/middleware/rateLimiter.ts

import rateLimit from "express-rate-limit";

// Global rate limit — all routes
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});

// Strict limit — login endpoint only
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // count only failures
  message: {
    error: "Too many failed login attempts. Account temporarily locked.",
  },
});
```

### 2.5 Session Expiry

```typescript
// apps/web/src/features/auth/useAuth.ts

// Auto-logout after 30 minutes of inactivity
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

let timer: ReturnType<typeof setTimeout>;

function resetTimer(logout: () => void) {
  clearTimeout(timer);
  timer = setTimeout(logout, INACTIVITY_TIMEOUT);
}

// Attach to: mousemove, keypress, touchstart, click
["mousemove", "keypress", "touchstart", "click"].forEach((event) => {
  window.addEventListener(event, () => resetTimer(logout), { passive: true });
});
```

---

## 3. Authorization — Role-Based Access Control

### 3.1 Role Matrix

| Capability                   | Owner | Cashier | Stock Manager |
| ---------------------------- | :---: | :-----: | :-----------: |
| Login                        |  ✅   |   ✅    |      ✅       |
| View POS / process sales     |  ✅   |   ✅    |      ❌       |
| View products                |  ✅   |   ✅    |      ✅       |
| Create / edit products       |  ✅   |   ❌    |      ❌       |
| Archive products             |  ✅   |   ❌    |      ❌       |
| View stock levels            |  ✅   |   ❌    |      ✅       |
| Receive delivery (add stock) |  ✅   |   ❌    |      ✅       |
| Manual stock correction      |  ✅   |   ❌    |      ✅       |
| View stock adjustment log    |  ✅   |   ❌    |      ❌       |
| View / search customers      |  ✅   |   ✅    |      ❌       |
| Create customer record       |  ✅   |   ✅    |      ❌       |
| View customer history        |  ✅   |   ❌    |      ❌       |
| View daily sales report      |  ✅   |   ❌    |      ❌       |
| View cash-up summary         |  ✅   |   ❌    |      ❌       |
| View employee activity       |  ✅   |   ❌    |      ❌       |
| Create / manage employees    |  ✅   |   ❌    |      ❌       |
| Reset staff passwords        |  ✅   |   ❌    |      ❌       |
| View audit logs              |  ✅   |   ❌    |      ❌       |
| Change own password          |  ✅   |   ✅    |      ✅       |
| Toggle dark mode             |  ✅   |   ❌    |      ❌       |

### 3.2 Middleware Implementation

```typescript
// apps/api/src/middleware/authenticate.ts

import { Request, Response, NextFunction } from "express";
import { verifyToken, JwtPayload } from "../utils/jwt";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }
  const token = header.slice(7);
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
```

```typescript
// apps/api/src/middleware/authorize.ts

import { Request, Response, NextFunction } from "express";
import type { Role } from "@prisma/client";

export function authorize(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (!roles.includes(req.user.role as Role)) {
      return res.status(403).json({
        error: "You do not have permission to perform this action",
      });
    }
    next();
  };
}

// Usage in routes:
// router.get('/reports/daily', authenticate, authorize('OWNER'), getDaily);
// router.post('/stock/adjust', authenticate, authorize('OWNER','STOCK_MANAGER'), adjustStock);
```

---

## 4. Input Validation

**All input is validated at the API layer with Zod before any database call.**
Frontend validation is a UX convenience only — it must never be the last line of defence.

```typescript
// apps/api/src/middleware/validate.ts

import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          error: "Validation failed",
          details: err.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
      }
      next(err);
    }
  };
}
```

```typescript
// Example: Sale creation schema
// apps/api/src/schemas/sale.schema.ts

import { z } from "zod";

export const createSaleSchema = z.object({
  customerId: z.string().cuid().optional(),
  paymentMethod: z.enum(["CASH", "CARD", "EFT"]),
  items: z
    .array(
      z.object({
        productId: z.string().cuid(),
        quantity: z.number().positive().multipleOf(0.001),
        weightKg: z.number().positive().multipleOf(0.001).optional(),
      }),
    )
    .min(1, "Sale must have at least one item"),
});

export type CreateSaleDto = z.infer<typeof createSaleSchema>;
```

**Additional rules:**

- Reject requests with unexpected fields (`z.object().strict()` where appropriate)
- Always validate URL params and query strings — not just body
- Sanitise string inputs to prevent XSS: strip `<script>`, HTML tags in any user-supplied string before storing
- Never use `eval()`, `Function()`, or dynamic SQL string concatenation

---

## 5. HTTP Security Headers

Applied globally via `helmet` middleware.

```typescript
// apps/api/src/server.ts

import helmet from "helmet";

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin" },
  }),
);
```

**Headers applied by Helmet:**

| Header                      | Value                                          | Protection         |
| --------------------------- | ---------------------------------------------- | ------------------ |
| `X-Content-Type-Options`    | `nosniff`                                      | MIME-type sniffing |
| `X-Frame-Options`           | `DENY`                                         | Clickjacking       |
| `X-XSS-Protection`          | `0` (modern approach)                          | Legacy XSS filter  |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | Forces HTTPS       |
| `Content-Security-Policy`   | See above                                      | XSS, injection     |
| `Referrer-Policy`           | `strict-origin-when-cross-origin`              | Referrer leakage   |
| `Permissions-Policy`        | `camera=(), microphone=()`                     | Browser features   |

---

## 6. CORS Configuration

```typescript
// apps/api/src/server.ts

import cors from "cors";

const allowedOrigins = process.env.CORS_ORIGIN!.split(",").map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not permitted`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
```

**Rules:**

- Never use `cors({ origin: '*' })` — that allows any website to call the API
- `CORS_ORIGIN` in `.env` must be the exact production frontend URL
- In development: `CORS_ORIGIN=http://localhost:5173`

---

## 7. Data Protection

### 7.1 Data Classification

| Data                   | Classification | Storage                   |
| ---------------------- | -------------- | ------------------------- |
| Employee passwords     | Critical       | bcrypt hash only          |
| JWT secrets            | Critical       | Environment variable only |
| Customer phone numbers | Sensitive      | Encrypted at rest         |
| Transaction records    | Sensitive      | Standard encrypted DB     |
| Product prices         | Internal       | Standard                  |
| Stock levels           | Internal       | Standard                  |
| Audit logs             | Internal       | Standard                  |

### 7.2 Encryption at Rest

Customer phone numbers are encrypted before storage using AES-256 via the `prisma-field-encryption` extension, or manually using Node.js `crypto`:

```typescript
// apps/api/src/utils/encryption.ts

import crypto from "crypto";

const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, "hex"); // 32-byte hex key
const ALG = "aes-256-gcm";

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALG, KEY, iv);
  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  // Store as: iv:tag:ciphertext (all hex)
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decrypt(stored: string): string {
  const [ivHex, tagHex, encHex] = stored.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const enc = Buffer.from(encHex, "hex");
  const decipher = crypto.createDecipheriv(ALG, KEY, iv);
  decipher.setAuthTag(tag);
  return decipher.update(enc) + decipher.final("utf8");
}
```

Generate the encryption key:

```bash
openssl rand -hex 32  # → set as ENCRYPTION_KEY in .env
```

### 7.3 Data Minimisation

- Collect only: name, phone number for customer records
- Do not collect: ID numbers, addresses, email for customers
- Anonymous sales are fully supported (customerId is nullable)
- Audit logs store metadata (action, amounts) — not full record snapshots unless needed for dispute resolution

---

## 8. Audit Logging

Every mutation that touches financial or user data must write an `AuditLog` entry in the same database transaction.

```typescript
// Mandatory audit events
const AUDITABLE_ACTIONS = [
  "SALE_COMPLETED", // any sale processed
  "SALE_VOIDED", // if void is added in future
  "STOCK_RECEIVED", // delivery logged
  "STOCK_ADJUSTED", // manual correction
  "PRODUCT_CREATED",
  "PRODUCT_UPDATED",
  "PRODUCT_ARCHIVED",
  "EMPLOYEE_CREATED",
  "EMPLOYEE_DEACTIVATED",
  "EMPLOYEE_PASSWORD_RESET",
  "LOGIN_SUCCESS",
  "LOGIN_FAILURE", // logged without employee ID (use email as metadata)
] as const;
```

**Audit log rules:**

- Audit logs are **append-only** — no UPDATE or DELETE on `audit_logs` table
- The audit log table has no `CASCADE DELETE` from any foreign key
- Only `OWNER` role may read audit logs via API
- Audit logs are retained for minimum 1 year
- IP address is logged for login events

---

## 9. Frontend Security

### 9.1 Token Storage

```typescript
// apps/web/src/features/auth/authStore.ts
// Using zustand with sessionStorage (NOT localStorage for tokens)

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface AuthState {
  token: string | null;
  user: { id: string; name: string; role: string } | null;
  setAuth: (token: string, user: AuthState["user"]) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      clearAuth: () => set({ token: null, user: null }),
    }),
    {
      name: "bms-auth",
      storage: createJSONStorage(() => sessionStorage),
      // sessionStorage: cleared when browser tab/window closes
      // Appropriate for shared shop devices
    },
  ),
);
```

**Why sessionStorage, not localStorage:**

- Shop tablets are shared. `localStorage` persists after the tab closes. A staff member closes the tab and the next person opens the POS — the previous session is still active. `sessionStorage` clears when the tab closes.

### 9.2 XSS Prevention

```tsx
// ALWAYS use React's JSX — never dangerouslySetInnerHTML
// ✅ Safe:
<p>{userInputText}</p>

// ❌ Never:
<p dangerouslySetInnerHTML={{ __html: userInputText }} />
```

- Never interpolate user-controlled values into `href`, `src`, `style`, or event handlers
- All `href` values must start with `/` or a known safe origin

### 9.3 Route Protection

```tsx
// apps/web/src/components/ProtectedRoute.tsx

import { Navigate } from "react-router-dom";
import { useAuthStore } from "../features/auth/authStore";

type Role = "OWNER" | "CASHIER" | "STOCK_MANAGER";

interface Props {
  children: React.ReactNode;
  allowedRoles: Role[];
}

export function ProtectedRoute({ children, allowedRoles }: Props) {
  const { token, user } = useAuthStore();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role as Role)) {
    return <Navigate to="/unauthorised" replace />;
  }

  return <>{children}</>;
}

// Usage in router.tsx:
// <Route path="/reports" element={
//   <ProtectedRoute allowedRoles={['OWNER']}>
//     <ReportsPage />
//   </ProtectedRoute>
// } />
```

---

## 10. Database Security

```sql
-- Create a dedicated application user (never use superuser in production)
CREATE USER bms_app WITH PASSWORD 'strong-random-password';

-- Grant minimal permissions — SELECT, INSERT, UPDATE only
-- No DELETE on core tables (soft-delete via isActive flag instead)
GRANT CONNECT ON DATABASE simon_bms TO bms_app;
GRANT USAGE ON SCHEMA public TO bms_app;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO bms_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO bms_app;

-- Audit logs are append-only: INSERT only (no UPDATE, no DELETE)
REVOKE UPDATE ON audit_logs FROM bms_app;
REVOKE DELETE ON audit_logs FROM bms_app;
```

**Additional rules:**

- `DATABASE_URL` uses SSL mode: `?sslmode=require`
- Never expose database port publicly — Railway keeps it internal by default
- Prisma uses connection pooling (`?connection_limit=5` for Railway starter plan)
- Run `prisma migrate deploy` only — never `prisma migrate dev` in production

---

## 11. POPIA Compliance (South Africa)

The BMS is a South African system. It must comply with the **Protection of Personal Information Act (POPIA), Act 4 of 2013**.

| Requirement             | Implementation                                                                                |
| ----------------------- | --------------------------------------------------------------------------------------------- |
| **Lawful collection**   | Customers informed at point of capture that their name and phone are stored                   |
| **Purpose limitation**  | Customer data used only for transaction history and loyalty identification                    |
| **Data minimisation**   | Name + phone only. No ID number, no address, no email collected                               |
| **Subject access**      | Owner can view and delete a customer record on request                                        |
| **Deletion**            | Customer records can be soft-deleted (anonymised) — transactions retain for financial records |
| **Security**            | Customer phone encrypted at rest (AES-256), transmitted via HTTPS only                        |
| **Breach notification** | Owner must be notified within 72 hours of any discovered breach                               |
| **Retention**           | Transaction records retained for 5 years (financial compliance), then purged                  |

**Customer consent capture at POS:**

```tsx
// During customer creation:
<p className="text-sm text-secondary">
  We store your name and phone number to track your purchase history.
  You may request deletion of your records at any time.
</p>
<label>
  <input type="checkbox" required />
  I agree to my information being stored by Simon Family Farm.
</label>
```

---

## 12. Security Checklist — Before Deploying to Production

Use this checklist before every production deployment.

### Environment

- [ ] `JWT_SECRET` is at least 64 random characters (verified with `wc -c`)
- [ ] `ENCRYPTION_KEY` is a 32-byte hex string (`openssl rand -hex 32`)
- [ ] `NODE_ENV=production` is set
- [ ] `DATABASE_URL` uses `sslmode=require`
- [ ] `CORS_ORIGIN` is the exact production frontend URL (no trailing slash)
- [ ] No `.env` file is committed to Git (`.gitignore` includes `.env`)

### Authentication

- [ ] Bcrypt cost factor is `12` in production
- [ ] JWT expiry is set to `8h` or less
- [ ] Login rate limiter is active (max 5 attempts per 15 minutes)
- [ ] Session auto-logout fires after 30 minutes of inactivity

### API

- [ ] All routes have `authenticate` middleware
- [ ] All routes have `authorize` middleware with correct roles
- [ ] All body inputs validated with Zod
- [ ] `helmet()` middleware is active
- [ ] `cors()` middleware has explicit origin whitelist
- [ ] `passwordHash` field excluded from all query `select` statements

### Database

- [ ] Application uses dedicated `bms_app` user, not superuser
- [ ] `audit_logs` table has UPDATE and DELETE revoked
- [ ] Migrations ran with `prisma migrate deploy` (not `dev`)
- [ ] Daily backup is confirmed active in Railway dashboard

### Frontend

- [ ] Token stored in `sessionStorage` (not `localStorage`)
- [ ] All routes wrapped in `ProtectedRoute` with correct `allowedRoles`
- [ ] No `dangerouslySetInnerHTML` anywhere in the codebase
- [ ] `manifest.json` has correct `theme_color: "#C21322"`

### POPIA

- [ ] Customer consent checkbox is shown before creating any customer record
- [ ] Customer phone number is encrypted before storage (verified in DB)
- [ ] Privacy notice is accessible from login screen footer

---

## 13. Incident Response

If a security breach is suspected:

1. **Immediately** rotate `JWT_SECRET` in Railway environment variables — all existing sessions are invalidated
2. **Immediately** rotate `ENCRYPTION_KEY` and re-encrypt customer records with the new key
3. **Within 72 hours** notify the business owner and affected customers (POPIA requirement)
4. Pull full `audit_logs` for the breach window to determine scope
5. Reset passwords for all employee accounts
6. Review Railway access logs for the breach timeframe

---

## 14. Gemini CLI Prompt Snippets

### For any auth/security code:

```
Using the Simon Family Farm BMS security standards (SECURITY.md):
- Passwords: bcrypt, cost factor 12, never returned in API responses
- JWT: HS256, 8h expiry, verified with verifyToken() util, sent as Bearer header only
- Rate limiting: 5 login attempts per 15 min, 100 global requests per 15 min
- All routes: authenticate middleware first, then authorize(roles) middleware
- All body input: validated with Zod schema before controller runs
- Audit log: every mutation writes an AuditLog entry in the same transaction
- Token storage: sessionStorage (not localStorage)
- NEVER use dangerouslySetInnerHTML
- NEVER return passwordHash in any API response
- NEVER use cors({ origin: '*' })
```

### For customer data handling:

```
Customer phone numbers must be encrypted using the encrypt() utility before
INSERT and decrypted with decrypt() after SELECT. Never store or log plain
phone numbers. Customer record creation must show a POPIA consent checkbox
before the form can submit.
```

---

_SECURITY.md — Simon Family Farm BMS — v1.0 — June 2026_
_Jurisdiction: South Africa — POPIA Act 4 of 2013 applies_
_Stack: Node.js 20 + Express 4 + Prisma 5 + PostgreSQL 15 + React 18_
