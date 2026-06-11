# SPEC_auth.md
# Feature Specification: Authentication & User Management
> Feature ID: FEAT-001 | Phase: 1 — Foundation | PRD: Section 6.1, 6.2

---

## 0. Pre-Build Checklist

- [x] This spec file is completely filled in
- [x] ARCHITECTURE.md reviewed — Auth uses `/auth` endpoints
- [x] SECURITY.md reviewed — JWT, refresh tokens, and rate limiting required
- [x] Schema ready: `Employee` table defined in `prisma/schema.prisma`
- [x] Routes listed in ARCHITECTURE.md
- [x] RBAC: Roles defined (OWNER, CASHIER, STOCK_MANAGER)

---

## 1. Feature Identity

| Field | Value |
|---|---|
| **Feature Name** | Authentication & User Management |
| **Feature ID** | FEAT-001 |
| **Phase** | MVP Phase 1 — Foundation |
| **PRD References** | Section 6.1 (Auth), 6.2 (Security) |
| **Priority** | Critical — foundation for all features |
| **Roles Affected** | All roles (OWNER, CASHIER, STOCK_MANAGER) |
| **Estimated Effort** | 2 days |

---

## 2. One-Line Summary

This feature provides secure, role-based access to the system using JWT-based authentication, enabling users to log in, maintain active sessions via refresh tokens, and log out securely.

---

## 3. User Story

```
As a staff member
I want to log in with my credentials and stay logged in during my shift
So that I can perform tasks relevant to my role and ensure my actions are audited correctly
```

**Acceptance Criteria:**

- [ ] AC1: User can log in with email and password (bcrypt hashed, cost 12)
- [ ] AC2: Login response returns a short-lived (8h) JWT access token and a long-lived (7d) httpOnly refresh token
- [ ] AC3: Incorrect credentials return a generic 401 "Invalid credentials" error
- [ ] AC4: Rate limiting prevents brute-force attacks (5 attempts per 15 minutes)
- [ ] AC5: Access token is stored in memory; refresh token is stored in a secure httpOnly cookie
- [ ] AC6: API automatically refreshes access token using refresh token when access token expires
- [ ] AC7: User can log out, which clears the refresh token cookie and invalidates the session
- [ ] AC8: Protected routes return 401 if token is missing/expired and refresh fails
- [ ] AC9: Role-based access control (RBAC) middleware correctly identifies and enforces roles from JWT claims
- [ ] AC10: Successful and failed login attempts are recorded in the `AuditLog` table

---

## 4. Data Model

### Tables Involved

| Model | Operation | Notes |
|---|---|---|
| `Employee` | READ | Verify credentials and role |
| `AuditLog` | WRITE | Log login attempts (success/failure) |

### New Fields or Models Needed

None. Already in `schema.prisma`.

---

## 5. API Contract

### `POST /auth/login`

**Request:**
```json
{
  "email": "user@bms.local",
  "password": "Password123!"
}
```

**Zod Schema:**
```javascript
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
```

**Success Response (`HTTP 200`):**
```json
{
  "token": "ey...",
  "user": {
    "id": "clx...",
    "name": "Simon",
    "email": "simon@bms.local",
    "role": "OWNER"
  }
}
```
*Note: Sets `refreshToken` as httpOnly cookie.*

**Error Responses:**
| Status | Condition | Body |
|---|---|---|
| 401 | Invalid credentials | `{ "error": "Invalid credentials" }` |
| 422 | Validation failed | `{ "errors": { "fieldErrors": {...} } }` |
| 429 | Rate limit exceeded | `{ "error": "Too many login attempts..." }` |

---

### `POST /auth/refresh`

**Request:** (None, uses `refreshToken` cookie)

**Success Response (`HTTP 200`):**
```json
{
  "token": "ey..."
}
```
*Note: Rotates `refreshToken` cookie.*

**Error Responses:**
| Status | Condition | Body |
|---|---|---|
| 401 | Refresh token invalid/expired | `{ "error": "Refresh token invalid or expired" }` |

---

### `POST /auth/logout`

**Request:** (None)

**Success Response (`HTTP 200`):**
```json
{
  "message": "Logged out successfully"
}
```
*Note: Clears `refreshToken` cookie.*

---

## 6. Frontend Specification

### Route / Page
`/login` → `src/pages/Login.jsx`

### UI Components Needed

| Component | File Path | Responsibility |
|---|---|---|
| `LoginForm` | (Part of Login.jsx) | Handles email/password input and submission |

### State (Zustand — `src/store/authStore.js`)

```javascript
{
  user: null,                   // Current user object
  token: null,                  // JWT access token
  setUser: (user) => {},
  setToken: (token) => {},
  logout: () => {},             // Clears state
}
```

### User Interaction Flow

```
Step 1: User enters credentials on /login
   → Frontend: calls POST /auth/login
   → On success: Save user & token in authStore; redirect based on role
   → On error: Display error message (generic 401 or specific validation)

Step 2: User performs actions (authenticated)
   → Axios interceptor injects Bearer token into headers
   → If API returns 401 (expired): Interceptor calls POST /auth/refresh
   → On refresh success: Retry original request with new token
   → On refresh error: Logout user and redirect to /login

Step 3: User clicks Logout
   → Frontend: calls POST /auth/logout
   → Frontend: clear authStore; redirect to /login
```

---

## 7. Security Requirements

- **Authentication required?** No (for login), Yes (for others)
- **Which roles can access this?** All roles
- **Does this feature write to the DB?** Yes (AuditLog)
- **Is it wrapped in a Prisma `$transaction`?** No
- **Does this feature expose PII?** Yes (email, name), but not in logs
- **Does this feature write to AuditLog?** Yes (`LOGIN_SUCCESS`, `LOGIN_FAILURE`)
- **Zod schema:** `loginSchema` defined in Section 5
- **Additional authorization:** None

---

## 8. Performance Requirements

| Metric | Target | How to Verify |
|---|---|---|
| Login response | < 1s (due to bcrypt) | Supertest timing |
| Token refresh | < 300ms | Playwright network timing |

---

## 9. Test Plan

### Unit / Integration Tests (`apps/api/tests/auth.test.js`)

| Test ID | Description | Expected Result |
|---|---|---|
| T01 | Valid login returns token + user | HTTP 200 + json |
| T02 | Invalid login returns 401 | HTTP 401 |
| T03 | Inactive employee cannot login | HTTP 401 |
| T04 | Token refresh returns new token | HTTP 200 + json |
| T05 | Invalid refresh token returns 401 | HTTP 401 |
| T06 | Logout clears cookie | Set-Cookie header with expiry in past |

### E2E Tests (`apps/web/e2e/auth.spec.js`)

| Test ID | Description | Steps |
|---|---|---|
| E01 | Full login flow | 1. Navigate to /login → 2. Type credentials → 3. Verify redirect |
| E02 | Persistent session | 1. Login → 2. Refresh page → 3. Verify still logged in |
| E03 | Unauthorized access redirect | 1. Go to /pos without login → 2. Verify redirect to /login |

---

## 10. Definition of Done

- [ ] All 10 acceptance criteria pass
- [ ] Auth controller and middleware implemented
- [ ] Audit logging verified for success/failure
- [ ] Rate limiting tested
- [ ] Axios refresh logic verified
- [ ] Tests pass (unit + e2e)

---

## 11. Out of Scope

- "Forgot password" email flow — Phase 2
- Multi-factor authentication (MFA) — Phase 2
- Social logins — Not planned
