# SPEC_customers.md
# Feature Specification: Customer Management
> Feature ID: FEAT-008 | Phase: 2 — CRM | PRD: Section 8.1

---

## 0. Pre-Build Checklist

- [ ] This spec file is completely filled in
- [x] ARCHITECTURE.md reviewed — Customers uses `/customers` endpoints
- [x] SECURITY.md reviewed — PII encryption required for name and phone
- [x] Schema ready: `Customer` table defined
- [x] Routes listed in ARCHITECTURE.md
- [x] RBAC: CASHIER and OWNER can manage customers

---

## 1. Feature Identity

| Field | Value |
|---|---|
| **Feature Name** | Customer Management |
| **Feature ID** | FEAT-008 |
| **Phase** | MVP Phase 2 — CRM |
| **PRD References** | Section 8.1 |
| **Priority** | Medium — required for order history |
| **Roles Affected** | CASHIER, OWNER |
| **Estimated Effort** | 2 days |

---

## 2. One-Line Summary

This feature allows staff to save and look up customer details (name and phone) during a sale, enabling the owner to track purchase history and build a local customer base.

---

## 3. User Story

```
As a Cashier
I want to quickly find a customer by their phone number or add a new one
So that I can link their purchase to their profile for future reference
```

**Acceptance Criteria:**

- [ ] AC1: Staff can search for customers by phone number or name
- [ ] AC2: Staff can create a new customer with name and phone (optional)
- [ ] AC3: Customer phone numbers must be unique if provided
- [ ] AC4: Customer PII (name, phone) must be encrypted at rest in the database
- [ ] AC5: Staff can view a customer's basic purchase history (date, total)
- [ ] AC6: Search results appear in under 500ms to avoid slowing down the POS line

---

## 4. Data Model

### Tables Involved

| Model | Operation | Notes |
|---|---|---|
| `Customer` | READ + WRITE | CRUD operations |
| `Sale` | READ | Purchase history lookup |

### New Fields or Models Needed

None.

---

## 5. API Contract

### `GET /customers`
Search for customers.

**Query Params:**
- `query`: string (search phone or name)

---

### `POST /customers`
Create new customer.

**Request:**
```json
{
  "name": "Jane Smith",
  "phone": "0821234567"
}
```

**Zod Schema:**
```javascript
import { z } from 'zod';

export const createCustomerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().regex(/^[0-9]{10}$/, 'Invalid SA phone number').optional().nullable(),
});
```

---

## 6. Frontend Specification

### Route / Page
Integrated into `/pos` and a standalone `/customers` page.

### UI Components Needed

| Component | File Path | Responsibility |
|---|---|---|
| `CustomerSearch` | `src/components/POS/CustomerSearch.jsx` | Inline search in POS checkout |
| `CustomerModal` | `src/components/Customer/CustomerModal.jsx` | Form for adding/editing customers |

---

## 7. Security Requirements

- **Authentication required?** Yes
- **Which roles can access this?** CASHIER, OWNER
- **Does this feature write to the DB?** Yes
- **Is it wrapped in a Prisma `$transaction`?** No
- **Does this feature expose PII?** Yes (Name, Phone)
- **MUST be encrypted at rest?** Yes (using `utils/encryption.js`)
- **Does this feature write to AuditLog?** No (unless requested by owner)
- **Zod schema:** `createCustomerSchema`

---

## 8. Performance Requirements

- Search response < 500ms
- Encryption/Decryption overhead < 50ms per record

---

## 9. Test Plan

### Unit / Integration Tests

| Test ID | Description | Expected Result |
|---|---|---|
| T01 | Create customer with valid data | HTTP 201 |
| T02 | Duplicate phone number returns 409 | HTTP 409 |
| T03 | DB record is encrypted (verify raw data) | Ciphertext present, not plaintext |
| T04 | Decryption returns original value | Plaintext match |

---

## 10. Definition of Done

- [ ] All acceptance criteria pass
- [ ] Encryption logic integrated into Customer service
- [ ] POS integration complete
- [ ] PII safety verified
- [ ] Tests pass

---

## 11. Out of Scope

- Customer loyalty points — Phase 2
- SMS marketing integration — Not planned
- Credit accounts / Lay-bys — Phase 2
