# SPEC_employees.md
# Feature Specification: Employee Admin Panel
> Feature ID: FEAT-007 | Phase: 1 — Foundation | PRD: Section 6.2, 6.3

---

## 0. Pre-Build Checklist

- [ ] This spec file is completely filled in
- [x] ARCHITECTURE.md reviewed — Admin uses `/employees` endpoints
- [x] SECURITY.md reviewed — OWNER role only; sensitive PII rules apply
- [x] Schema ready: `Employee` table defined
- [x] Routes listed in ARCHITECTURE.md
- [x] RBAC: OWNER only for create/update/deactivate

---

## 1. Feature Identity

| Field | Value |
|---|---|
| **Feature Name** | Employee Admin Panel |
| **Feature ID** | FEAT-007 |
| **Phase** | MVP Phase 1 — Foundation |
| **PRD References** | Section 6.2 (User Management), 6.3 (RBAC) |
| **Priority** | High — needed to onboard staff |
| **Roles Affected** | OWNER (only) |
| **Estimated Effort** | 2 days |

---

## 2. One-Line Summary

This feature allows the owner to manage the staff roster by creating new employee accounts, updating roles and status, and resetting passwords to ensure only authorized personnel can access the system.

---

## 3. User Story

```
As the Butchery Owner
I want to create, update, and deactivate staff accounts
So that I can control who has access to the POS, inventory, and financial reports
```

**Acceptance Criteria:**

- [ ] AC1: Owner can list all employees (active and inactive)
- [ ] AC2: Owner can create a new employee with name, email, role, and initial password
- [ ] AC3: Email must be unique across all employees
- [ ] AC4: Password must meet security policy (min 8 chars, uppercase, number, special)
- [ ] AC5: Owner can update an employee's name, email, and role
- [ ] AC6: Owner can deactivate an employee (soft delete) — deactivated users cannot log in
- [ ] AC7: Owner can reset any employee's password
- [ ] AC8: All employee management actions are recorded in the `AuditLog`
- [ ] AC9: Non-OWNER roles are blocked from accessing these endpoints (HTTP 403)

---

## 4. Data Model

### Tables Involved

| Model | Operation | Notes |
|---|---|---|
| `Employee` | READ + WRITE | CRUD operations |
| `AuditLog` | WRITE | Log actions like `EMPLOYEE_CREATED`, `EMPLOYEE_UPDATED` |

### New Fields or Models Needed

None.

---

## 5. API Contract

### `GET /employees`
List all employees. OWNER only.

**Success Response (`HTTP 200`):**
```json
[
  { "id": "...", "name": "Simon", "email": "...", "role": "OWNER", "isActive": true }
]
```

---

### `POST /employees`
Create new employee.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@bms.local",
  "password": "Password123!",
  "role": "CASHIER"
}
```

**Zod Schema:**
```javascript
import { z } from 'zod';
import { passwordSchema } from '../utils/auth.js';

export const createEmployeeSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: passwordSchema,
  role: z.enum(['OWNER', 'CASHIER', 'STOCK_MANAGER']),
});
```

---

### `PUT /employees/:id`
Update employee details.

**Request:** (Similar to POST but password optional)

---

### `PATCH /employees/:id/deactivate`
Deactivate an employee.

---

### `POST /auth/reset-password`
Reset an employee's password. (OWNER only)

---

## 6. Frontend Specification

### Route / Page
`/admin/employees` → `src/pages/Admin.jsx` (Employee tab)

### UI Components Needed

| Component | File Path | Responsibility |
|---|---|---|
| `EmployeeTable` | `src/components/Admin/EmployeeTable.jsx` | Lists employees with edit/deactivate actions |
| `EmployeeModal` | `src/components/Admin/EmployeeModal.jsx` | Form for creating/editing employees |
| `PasswordResetModal`| `src/components/Admin/PasswordResetModal.jsx` | Dedicated modal for password reset |

---

## 7. Security Requirements

- **Authentication required?** Yes
- **Which roles can access this?** OWNER only
- **Does this feature write to the DB?** Yes
- **Is it wrapped in a Prisma `$transaction`?** No (single-table writes)
- **Does this feature expose PII?** Yes (email, name)
- **Does this feature write to AuditLog?** Yes (`EMPLOYEE_CREATED`, `EMPLOYEE_UPDATED`, `PASSWORD_RESET`)
- **Zod schema:** `createEmployeeSchema`
- **Additional authorization:** RBAC middleware `rbacMiddleware('OWNER')`

---

## 8. Performance Requirements

- Page load < 1s
- Employee list filtered on client-side (small staff count < 20)

---

## 9. Test Plan

### Unit / Integration Tests

| Test ID | Description | Expected Result |
|---|---|---|
| T01 | OWNER can list employees | HTTP 200 |
| T02 | CASHIER cannot list employees | HTTP 403 |
| T03 | Create employee with duplicate email fails | HTTP 409 |
| T04 | Deactivate employee sets isActive to false | DB field updated |
| T05 | Reset password updates passwordHash | Login works with new password |

---

## 10. Definition of Done

- [ ] All acceptance criteria pass
- [ ] CRUD logic implemented in controller
- [ ] OWNER-only RBAC enforced
- [ ] Audit logs verified
- [ ] Frontend UI aligned with DESIGN.md
- [ ] Tests pass

---

## 11. Out of Scope

- Self-service password reset — Phase 2
- Activity history for specific employee — Phase 2
- Profile picture upload — Not planned
