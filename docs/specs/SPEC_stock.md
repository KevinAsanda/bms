# SPEC_stock.md
# Feature Specification: Stock Management
> Feature ID: FEAT-004 | Phase: 4 — Stock | PRD: Section 7.3, 7.4

---

## 0. Pre-Build Checklist

- [ ] This spec file is completely filled in
- [x] ARCHITECTURE.md reviewed — Stock uses `/stock` endpoints
- [x] SECURITY.md reviewed — STOCK_MANAGER and OWNER roles required
- [x] Schema ready: `Stock` and `StockAdjustment` tables defined
- [x] Routes listed in ARCHITECTURE.md
- [x] RBAC: STOCK_MANAGER and OWNER can manage stock

---

## 1. Feature Identity

| Field | Value |
|---|---|
| **Feature Name** | Stock Management |
| **Feature ID** | FEAT-004 |
| **Phase** | MVP Phase 4 — Stock |
| **PRD References** | Section 7.3 (Inventory), 7.4 (Adjustments) |
| **Priority** | High — prevents selling out of stock |
| **Roles Affected** | STOCK_MANAGER, OWNER |
| **Estimated Effort** | 3 days |

---

## 2. One-Line Summary

This feature allows the stock manager and owner to track real-time inventory levels, record new deliveries, and perform manual stock adjustments with audit trails.

---

## 3. User Story

```
As a Stock Manager
I want to update stock levels when new deliveries arrive and adjust for wastage
So that the POS system always reflects actual shelf availability
```

**Acceptance Criteria:**

- [ ] AC1: Staff can view all current stock levels and low-stock alerts
- [ ] AC2: Staff can record a "Delivery" (increase stock) by scanning barcodes
- [ ] AC3: Staff can record a manual "Adjustment" (wastage, spoilage, correction)
- [ ] AC4: Every stock change must be linked to an employee and a reason
- [ ] AC5: Every stock change creates a row in the `StockAdjustment` table
- [ ] AC6: Low stock alerts are triggered when `quantity <= lowThreshold`
- [ ] AC7: Stock updates must be atomic to prevent race conditions during sales
- [ ] AC8: Non-authorized roles (CASHIER) cannot access stock management tools

---

## 4. Data Model

### Tables Involved

| Model | Operation | Notes |
|---|---|---|
| `Stock` | READ + WRITE | Update quantities |
| `StockAdjustment` | WRITE | Audit trail for changes |
| `Product` | READ | Barcode lookup for delivery |

### New Fields or Models Needed

None.

---

## 5. API Contract

### `GET /stock`
List all stock levels.

---

### `POST /stock/receive`
Record delivery.

**Request:**
```json
{
  "items": [
    { "productId": "...", "changeQty": 50 }
  ]
}
```

---

### `POST /stock/adjust`
Manual adjustment.

**Request:**
```json
{
  "productId": "...",
  "changeQty": -2.5,
  "reason": "SPOILAGE",
  "notes": "Meat past expiry date"
}
```

**Zod Schema:**
```javascript
import { z } from 'zod';

export const stockAdjustmentSchema = z.object({
  productId: z.string().cuid(),
  changeQty: z.number(),
  reason: z.enum(['WASTAGE', 'SPOILAGE', 'COUNTING_ERROR', 'DELIVERY', 'OTHER']),
  notes: z.string().optional(),
});
```

---

## 6. Frontend Specification

### Route / Page
`/inventory` → `src/pages/Inventory.jsx` (Stock tab)

### UI Components Needed

| Component | File Path | Responsibility |
|---|---|---|
| `StockTable` | `src/components/Stock/StockTable.jsx` | List with color-coded status badges |
| `DeliveryModal` | `src/components/Stock/DeliveryModal.jsx` | Bulk receiving form with barcode scan |
| `AdjustmentModal`| `src/components/Stock/AdjustmentModal.jsx` | Single product adjustment form |

---

## 7. Security Requirements

- **Authentication required?** Yes
- **Which roles can access this?** STOCK_MANAGER, OWNER
- **Does this feature write to the DB?** Yes
- **Is it wrapped in a Prisma `$transaction`?** Yes (Update Stock + Create Adjustment)
- **Does this feature write to AuditLog?** Yes (`STOCK_ADJUSTED`)
- **Zod schema:** `stockAdjustmentSchema`

---

## 8. Performance Requirements

- Bulk receiving (< 20 items) processed in < 2s
- Real-time stock updates reflected across all open POS terminals via long polling or simple refresh

---

## 9. Test Plan

### Unit / Integration Tests

| Test ID | Description | Expected Result |
|---|---|---|
| T01 | Record delivery increases stock quantity | DB incremented |
| T02 | Record wastage decreases stock quantity | DB decremented |
| T03 | Every adjustment creates a StockAdjustment row | Verified in DB |
| T04 | CASHIER cannot adjust stock | HTTP 403 |

---

## 10. Definition of Done

- [ ] All acceptance criteria pass
- [ ] Stock controller implemented with atomic transactions
- [ ] Role-based access enforced
- [ ] Audit logs and adjustment history verified
- [ ] UI aligned with DESIGN.md
- [ ] Tests pass

---

## 11. Out of Scope

- Purchase Order (PO) generation — Phase 2
- Supplier management — Phase 2
- Automated stock re-ordering — Not planned
