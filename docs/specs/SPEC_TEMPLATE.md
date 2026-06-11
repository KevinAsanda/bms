# SPEC_TEMPLATE.md
# Feature Specification Template
> **GEMINI INSTRUCTION:** Copy this file to `docs/specs/SPEC_<feature_name>.md` and fill in every section before writing a single line of code for that feature. A spec is not optional — it is the build contract. Do not skip sections or mark them "TBD". If you cannot answer a section yet, stop and resolve the question first.

---

## 0. Pre-Build Checklist
Before starting implementation, confirm all of the following:

- [ ] This spec file is completely filled in (no blank sections)
- [ ] ARCHITECTURE.md has been re-read in this session
- [ ] SECURITY.md has been re-read in this session
- [ ] The database schema in `prisma/schema.prisma` already has the tables this feature needs (if not, plan a migration first)
- [ ] All API routes for this feature are listed in ARCHITECTURE.md's endpoint table
- [ ] This feature's role requirements match the RBAC matrix in SECURITY.md

---

## 1. Feature Identity

| Field | Value |
|---|---|
| **Feature Name** | [Short name, e.g. "POS Checkout"] |
| **Feature ID** | [e.g. FEAT-003] |
| **Phase** | [MVP Phase 1–6 from ARCHITECTURE.md] |
| **PRD References** | [e.g. FR-13 through FR-22, Section 7.3] |
| **Priority** | [High / Medium / Low] |
| **Roles Affected** | [e.g. CASHIER, OWNER] |
| **Estimated Effort** | [e.g. 2 days] |

---

## 2. One-Line Summary

> [Write one sentence that completes: "This feature allows _____ to _____ so that _____." ]
> Example: "This feature allows a cashier to scan a product barcode and add it to a live cart so that a sale can be completed in under 60 seconds."

---

## 3. User Story

```
As a [role]
I want to [action]
So that [business outcome]
```

**Acceptance Criteria** (must be testable — every item becomes a test case):

- [ ] AC1: [Specific, measurable outcome. Example: "When a valid barcode is scanned, the product appears in the cart within 500ms"]
- [ ] AC2: [...]
- [ ] AC3: [...]
- [ ] AC4: [...]
- [ ] AC5: [...]

---

## 4. Data Model

### Tables Involved
List every Prisma model this feature reads from or writes to:

| Model | Operation | Notes |
|---|---|---|
| [ModelName] | READ / WRITE / BOTH | [What specifically? e.g. "reads Product.price on barcode lookup"] |

### New Fields or Models Needed
If this feature requires schema changes, list them here before touching any code:

```prisma
// Paste any new model definitions or field additions here
// Run: npx prisma migrate dev --name <feature_name> after confirming this
```

---

## 5. API Contract

For each endpoint this feature uses or creates:

### `[METHOD] /path`

**Request:**
```json
{
  "field": "type and description"
}
```

**Zod Schema** (write this first, before the controller):
```javascript
import { z } from 'zod';

export const featureNameSchema = z.object({
  // fields here
});
```

**Success Response** (`HTTP 200` or `201`):
```json
{
  "field": "example value"
}
```

**Error Responses:**
| Status | Condition | Body |
|---|---|---|
| 400 | [Bad request condition] | `{ "error": "..." }` |
| 401 | Not authenticated | `{ "error": "Missing or malformed token" }` |
| 403 | Wrong role | `{ "error": "Access denied" }` |
| 404 | Resource not found | `{ "error": "Product not found" }` |
| 422 | Zod validation failed | `{ "errors": { "fieldErrors": {...} } }` |

---

## 6. Frontend Specification

### Route / Page
`[e.g. /pos — POS.jsx page]`

### UI Components Needed
List each component with its responsibility:

| Component | File Path | Responsibility |
|---|---|---|
| [ComponentName] | `src/components/[path]` | [What it renders/does] |

### State (Zustand)
Which store slice does this feature use or extend?

```javascript
// Describe the store shape for this feature
{
  [stateName]: [type and default],
  [actionName]: [what it does],
}
```

### User Interaction Flow

```
Step 1: User does [action]
   → Frontend: [what happens in UI]
   → API call: [METHOD] [endpoint] with [payload]
   → On success: [UI update]
   → On error: [error display]

Step 2: ...
```

### Loading and Error States
- Loading: [Describe the loading indicator — skeleton, spinner, disabled button]
- Empty state: [What does the UI show when there's no data]
- Error state: [How errors from the API are displayed to the user]

---

## 7. Security Requirements

Answer every question. No blanks allowed.

- **Authentication required?** [Yes / No]
- **Which roles can access this?** [List from RBAC matrix in SECURITY.md]
- **Does this feature write to the DB?** [Yes / No]
- **If yes, is it wrapped in a Prisma `$transaction`?** [Yes / No — only "No" if single-table write]
- **Does this feature expose PII?** [Yes / No — if yes, is it decrypted only for the response, never logged?]
- **Does this feature write to AuditLog?** [Yes / No — see SECURITY.md Section 9 for required actions]
- **What Zod schema validates the request body?** [Reference or paste it]
- **Are there any authorization checks beyond role (e.g. "employee can only see own sales")?** [Describe]

---

## 8. Performance Requirements

| Metric | Target | How to Verify |
|---|---|---|
| [Operation, e.g. barcode lookup] | [e.g. < 500ms] | [e.g. Playwright network timing assertion] |
| [Page load] | [e.g. < 2s on 4G] | [e.g. Lighthouse CI] |

---

## 9. Test Plan

Write these tests BEFORE or ALONGSIDE the implementation (test-aware development).

### Unit Tests (`apps/api/tests/[feature].test.js`)

| Test ID | Description | Expected Result |
|---|---|---|
| T01 | [e.g. Valid barcode returns correct product] | HTTP 200 + product object |
| T02 | [e.g. Unknown barcode returns 404] | HTTP 404 |
| T03 | [e.g. CASHIER cannot access /reports] | HTTP 403 |
| T04 | [e.g. Unauthenticated request rejected] | HTTP 401 |
| T05 | [e.g. Invalid Zod input returns 422] | HTTP 422 + field errors |

### E2E Tests (Playwright via `@playwright/test`)

| Test ID | Description | Steps |
|---|---|---|
| E01 | Happy path: [describe full user flow] | 1. Login as [role] → 2. [action] → 3. Assert [result] |
| E02 | Error path: [describe failure scenario] | 1. [setup] → 2. [action] → 3. Assert error message visible |

---

## 10. Definition of Done

This feature is complete when ALL of the following are true:

- [ ] All acceptance criteria (Section 3) pass
- [ ] All unit tests (Section 9) pass: `npm test`
- [ ] All E2E tests (Section 9) pass: `npx playwright test`
- [ ] No TypeScript / ESLint errors: `npm run lint`
- [ ] `npm audit --audit-level=high` passes
- [ ] The feature works on mobile (360px viewport) and desktop (1280px)
- [ ] All DB writes use Prisma (no raw SQL)
- [ ] AuditLog entries created for all required actions
- [ ] ARCHITECTURE.md endpoint table updated if new routes were added
- [ ] PR description references this spec file

---

## 11. Out of Scope

List what this feature deliberately does NOT do (prevents scope creep):

- [e.g. This feature does not handle split payments — that is Phase 2]
- [e.g. This feature does not send WhatsApp receipts]
- [e.g. This feature does not support weight-based pricing — manual weight entry only]
