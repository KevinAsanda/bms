# SECURITY.md
# Butchery Management System — Security Architecture
> Version 1.0 | Simon Family Farm | June 2026

---

## 1. Security Philosophy

The BMS handles financial transactions, employee credentials, and customer personal information. Security is not optional — it is a first-class engineering concern applied at every layer: database, API, and frontend. This document is the authoritative source for all security decisions. **Gemini must consult this file before implementing any authentication, data access, input handling, or data storage feature.**

---

## 2. Threat Model

| Threat | Vector | Impact | Likelihood |
|---|---|---|---|
| Credential theft (staff) | Weak passwords, no lockout | Unauthorized sales / stock manipulation | Medium |
| Role abuse | Cashier accessing owner reports | Privacy breach, financial exposure | Medium |
| SQL injection | Unvalidated input to DB queries | Full database compromise | Low (mitigated by Prisma) |
| XSS | User-supplied data rendered unsanitized | Session hijack, data theft | Low (mitigated by React) |
| CSRF | Malicious site triggering authenticated API calls | Unauthorized actions | Low (mitigated by JWT in header) |
| Brute-force login | Automated password guessing | Account takeover | Medium |
| Insecure direct object reference | `/sales/123` accessed by wrong employee | Data leakage | Medium |
| Ransomware / device theft | Tablet stolen at counter | Data exposure, business disruption | Low |
| Insider threat | Employee viewing other's data | Privacy breach | Low |
| Phishing (owner email) | Fake login page | Credential theft | Low |

---

## 3. Authentication

### 3.1 JWT Implementation

```javascript
// middleware/auth.js — THIS IS THE REQUIRED PATTERN

import jwt from 'jsonwebtoken';

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;  // { id, role, email }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalid or expired' });
  }
}
```

**Rules:**
- Access tokens expire in **8 hours**
- Refresh tokens expire in **7 days**, stored as `httpOnly` cookie
- JWT payload contains ONLY: `{ id, role, email }` — no sensitive data
- Secret minimum length: **64 random characters**
- Algorithm: **HS256**
- Rotation: new access token issued on every refresh

### 3.2 Password Policy (enforced at API level via Zod)

```javascript
// utils/passwordSchema.js
import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');
```

### 3.3 Password Hashing

```javascript
// REQUIRED: bcrypt cost factor 12 — never store plaintext
import bcrypt from 'bcrypt';
const COST_FACTOR = 12;

export const hashPassword = (plain) => bcrypt.hash(plain, COST_FACTOR);
export const verifyPassword = (plain, hash) => bcrypt.compare(plain, hash);
```

### 3.4 Brute-Force Protection

```javascript
// middleware/rateLimiter.js
import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,                      // 5 attempts
  message: { error: 'Too many login attempts. Account locked for 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply to login route ONLY: router.post('/auth/login', loginLimiter, loginController)
```

---

## 4. Role-Based Access Control (RBAC)

### 4.1 Role Definitions

| Role | What They Can Access |
|---|---|
| `OWNER` | Everything: all reports, all admin, all POS, employee management |
| `CASHIER` | POS screen only: product lookup, cart, checkout, receipt |
| `STOCK_MANAGER` | Inventory: stock levels, delivery receiving, manual adjustments |

### 4.2 RBAC Middleware

```javascript
// middleware/rbac.js — apply AFTER authMiddleware on every protected route

export function rbacMiddleware(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role: ${allowedRoles.join(' or ')}`
      });
    }
    next();
  };
}

// Usage:
// router.get('/reports/daily', authMiddleware, rbacMiddleware('OWNER'), dailyReportController);
```

### 4.3 Route Permission Matrix

| Route | OWNER | CASHIER | STOCK_MANAGER |
|---|---|---|---|
| POST /auth/login | ✅ | ✅ | ✅ |
| POST /auth/reset-password | ✅ | ❌ | ❌ |
| GET /products | ✅ | ✅ | ✅ |
| POST /products | ✅ | ❌ | ❌ |
| PUT /products/:id | ✅ | ❌ | ❌ |
| POST /sales | ✅ | ✅ | ❌ |
| GET /sales | ✅ | ❌ | ❌ |
| GET /stock | ✅ | ❌ | ✅ |
| POST /stock/receive | ✅ | ❌ | ✅ |
| POST /stock/adjust | ✅ | ❌ | ✅ |
| GET /reports/* | ✅ | ❌ | ❌ |
| GET /employees | ✅ | ❌ | ❌ |
| POST /employees | ✅ | ❌ | ❌ |

---

## 5. Input Validation

**All request bodies MUST be validated with Zod before reaching any controller or database call.** This is the #1 defence against injection attacks and malformed data.

```javascript
// Example: sale creation schema
import { z } from 'zod';

export const createSaleSchema = z.object({
  customerId: z.string().cuid().optional(),
  paymentMethod: z.enum(['CASH', 'CARD', 'EFT']),
  items: z.array(z.object({
    productId: z.string().cuid(),
    quantity: z.number().int().positive().max(1000),
    weightKg: z.number().positive().max(999).optional(),
  })).min(1, 'Sale must have at least one item'),
});

// In route:
router.post('/sales', authMiddleware, rbacMiddleware('CASHIER', 'OWNER'), async (req, res) => {
  const parsed = createSaleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ errors: parsed.error.flatten() });
  }
  // Only now pass to controller
});
```

**Rules:**
- Never trust `req.body` without Zod validation
- Never use string concatenation in DB queries (Prisma parameterizes automatically)
- Strip all HTML from any text field that will be displayed (use `sanitize-html` if needed)

---

## 6. Data Protection

### 6.1 Data in Transit
- All production traffic over **HTTPS / TLS 1.2 minimum** (enforced by Railway)
- Local dev HTTP is acceptable only on `localhost`
- API sets security headers via `helmet`:

```javascript
import helmet from 'helmet';
app.use(helmet());
// Adds: X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security, etc.
```

### 6.2 Customer PII at Rest

Customer `name` and `phone` are classified as PII and must be encrypted at rest.

```javascript
// utils/encryption.js
import crypto from 'crypto';

const KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');  // 32 bytes
const ALGORITHM = 'aes-256-gcm';

export function encrypt(plaintext) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(ciphertext) {
  const [ivHex, tagHex, encryptedHex] = ciphertext.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final('utf8');
}
```

Apply `encrypt()` before writing customer name/phone to DB. Apply `decrypt()` when reading.

### 6.3 Secrets Management Rules

| Secret | Where Stored | Never In |
|---|---|---|
| DATABASE_URL | `.env` file | Source code, logs, responses |
| JWT_SECRET | `.env` file | Frontend bundle, comments |
| ENCRYPTION_KEY | `.env` file | Version control |
| Staff passwords | DB as bcrypt hash | Anywhere as plaintext |

Add to `.gitignore`:
```
.env
.env.*
!.env.example
```

---

## 7. Session Management

- Access token: **8 hours**, stored in browser memory (not `localStorage`)
- Refresh token: **7 days**, `httpOnly; Secure; SameSite=Strict` cookie
- Auto-expire idle session after **30 minutes** of inactivity (frontend timer)
- On logout: clear access token from memory; call `POST /auth/logout` to invalidate refresh token server-side (maintain a blocklist in DB)
- Multiple device sessions: each device gets its own refresh token; owner can revoke all sessions

---

## 8. CORS Configuration

```javascript
// app.js
import cors from 'cors';

const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,       // Required for httpOnly cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
}));
```

---

## 9. Audit Logging

Every significant action must be recorded to the `AuditLog` table. This is non-negotiable for accountability — the owner must be able to trace who did what and when.

```javascript
// utils/audit.js
import { prisma } from './prisma.js';

export async function logAudit(tx, { employeeId, action, entity, entityId, metadata }) {
  // tx = the Prisma transaction object, or prisma directly
  return tx.auditLog.create({
    data: { employeeId, action, entity, entityId: String(entityId), metadata },
  });
}
```

**Actions that MUST be logged:**

| Action | Entity | Logged Fields |
|---|---|---|
| Login success | Employee | IP address, timestamp |
| Login failure | Employee | IP, attempt count |
| Sale completed | Sale | saleId, total, payment method |
| Stock adjusted | Stock | productId, changeQty, reason |
| Product price changed | Product | old price, new price |
| Employee created | Employee | new employeeId, role |
| Employee deactivated | Employee | employeeId |
| Password reset | Employee | targetEmployeeId |

---

## 10. Backup and Recovery

| Backup Type | Frequency | Retention | Storage |
|---|---|---|---|
| Automated DB dump | Nightly at 02:00 | 30 days | Railway built-in + external (Cloudflare R2 free tier) |
| Manual DB export | Before any migration | Indefinite | Local + cloud |

Recovery procedure:
1. Restore from most recent Railway DB snapshot
2. If snapshot unavailable: restore from R2 bucket dump
3. Run `npx prisma migrate deploy` to apply any pending migrations
4. Verify data integrity with a quick row count check across key tables

---

## 11. OWASP Top 10 Compliance Checklist

| OWASP Risk | Status | How Addressed |
|---|---|---|
| A01 Broken Access Control | ✅ Mitigated | RBAC middleware on every route |
| A02 Cryptographic Failures | ✅ Mitigated | bcrypt for passwords, AES-256-GCM for PII, TLS in transit |
| A03 Injection | ✅ Mitigated | Prisma parameterized queries, Zod input validation |
| A04 Insecure Design | ✅ Addressed | Threat model defined, secure-by-default patterns |
| A05 Security Misconfiguration | ✅ Mitigated | helmet, strict CORS, env vars for all secrets |
| A06 Vulnerable Components | ⚠️ Monitor | Run `npm audit` before each release |
| A07 Auth Failures | ✅ Mitigated | Rate limiting, lockout, JWT expiry, bcrypt |
| A08 Software/Data Integrity | ✅ Mitigated | Atomic DB transactions, Zod validation |
| A09 Logging Failures | ✅ Mitigated | AuditLog table, structured error logging |
| A10 SSRF | N/A | No external URL fetching in this app |

---

## 12. Security Review Checklist (Run Before Each Phase Merge)

- [ ] `npm audit --audit-level=high` passes with no high/critical findings
- [ ] No `.env` file committed (`git status` clean)
- [ ] All new routes have `authMiddleware` + `rbacMiddleware`
- [ ] All new request bodies have Zod validation
- [ ] No raw SQL strings anywhere in codebase
- [ ] Audit log entries created for all listed actions
- [ ] Password hash cost factor is 12 (not lower)
- [ ] No `console.log` statements that print JWT, passwords, or PII
