# SPEC_products.md
# Feature Specification: Product Catalogue Management
> Feature ID: FEAT-002 | Phase: 2 — Products | PRD: Section 7.1, 7.2

---

## 0. Pre-Build Checklist

- [ ] This spec file is completely filled in
- [x] ARCHITECTURE.md reviewed — Products uses `/products` and `/categories` endpoints
- [x] SECURITY.md reviewed — CRUD is OWNER only; list is ANY
- [x] Schema ready: `Product` and `Category` tables defined
- [x] Routes listed in ARCHITECTURE.md
- [x] RBAC: OWNER for manage; all roles for read

---

## 1. Feature Identity

| Field | Value |
|---|---|
| **Feature Name** | Product Catalogue Management |
| **Feature ID** | FEAT-002 |
| **Phase** | MVP Phase 2 — Products |
| **PRD References** | Section 7.1 (Products), 7.2 (Categories) |
| **Priority** | High — prerequisite for POS |
| **Roles Affected** | OWNER (manage), ALL (read) |
| **Estimated Effort** | 3 days |

---

## 2. One-Line Summary

This feature allows the owner to maintain the butchery's product list and categories, while enabling all staff to browse and search for products by name or barcode.

---

## 3. User Story

```
As the Butchery Owner
I want to create, update, and categorize products with prices and barcodes
So that the POS system has accurate data for sales and inventory tracking
```

**Acceptance Criteria:**

- [ ] AC1: Owner can list, create, update, and archive products
- [ ] AC2: All staff can view the product list and search by name or barcode
- [ ] AC3: Each product must have a unique barcode
- [ ] AC4: Each product must belong to a category (e.g., Beef, Chicken, Wors)
- [ ] AC5: Owner can manage categories (create, update, delete if unused)
- [ ] AC6: Products support two pricing modes: "fixed" (per item) and "per_kg" (requires weight)
- [ ] AC7: Archiving a product marks `isActive: false` but keeps it in DB for historical sales reports
- [ ] AC8: Product updates (especially price changes) are recorded in `AuditLog`
- [ ] AC9: Non-OWNER roles are blocked from CREATE/UPDATE/ARCHIVE actions

---

## 4. Data Model

### Tables Involved

| Model | Operation | Notes |
|---|---|---|
| `Product` | READ + WRITE | CRUD operations |
| `Category` | READ + WRITE | Management |
| `AuditLog` | WRITE | Log price changes and product creation |

### New Fields or Models Needed

None. Already in `schema.prisma`.

---

## 5. API Contract

### `GET /products`
List all active products.

**Query Params:**
- `search`: string (optional)
- `category`: id (optional)

---

### `POST /products`
Create new product. OWNER only.

**Request:**
```json
{
  "name": "Beef Wors 500g",
  "barcode": "6001254123456",
  "categoryId": "...",
  "pricePerUnit": 45.00,
  "unitType": "fixed"
}
```

**Zod Schema:**
```javascript
import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(2),
  barcode: z.string().min(1),
  categoryId: z.string().cuid(),
  pricePerUnit: z.number().positive(),
  unitType: z.enum(['fixed', 'per_kg']),
});
```

---

### `PUT /products/:id`
Update product.

---

### `PATCH /products/:id/archive`
Soft-delete product.

---

### `GET /categories`
List all categories.

---

## 6. Frontend Specification

### Route / Page
`/inventory` → `src/pages/Inventory.jsx` (Product management tab)

### UI Components Needed

| Component | File Path | Responsibility |
|---|---|---|
| `ProductTable` | `src/components/Products/ProductTable.jsx` | Filterable list of products |
| `ProductModal` | `src/components/Products/ProductModal.jsx` | Form for creating/editing products |
| `CategoryManager`| `src/components/Products/CategoryManager.jsx` | Simple list/form for categories |

---

## 7. Security Requirements

- **Authentication required?** Yes
- **Which roles can access this?** READ: ALL, WRITE: OWNER
- **Does this feature write to the DB?** Yes
- **Is it wrapped in a Prisma `$transaction`?** No (unless creating stock record simultaneously)
- **Does this feature expose PII?** No
- **Does this feature write to AuditLog?** Yes (`PRODUCT_CREATED`, `PRICE_CHANGED`)
- **Zod schema:** `createProductSchema`

---

## 8. Performance Requirements

- Product lookup < 300ms
- Search is debounced (300ms) on frontend

---

## 9. Test Plan

### Unit / Integration Tests

| Test ID | Description | Expected Result |
|---|---|---|
| T01 | List products returns 200 | HTTP 200 |
| T02 | Duplicate barcode returns 409 | HTTP 409 |
| T03 | CASHIER cannot update product price | HTTP 403 |
| T04 | Archive product sets isActive false | DB updated |

---

## 10. Definition of Done

- [ ] All acceptance criteria pass
- [ ] Product/Category controllers implemented
- [ ] OWNER-only write permissions verified
- [ ] Audit logging for price changes verified
- [ ] UI aligned with DESIGN.md
- [ ] Tests pass

---

## 11. Out of Scope

- Bulk product import from CSV — Phase 2
- Multiple barcodes per product — Not planned
- Multi-currency support — Not planned (ZAR only)
