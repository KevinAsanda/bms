# SPEC_pos.md
# Feature Specification: POS Checkout
> Feature ID: FEAT-003 | Phase: 2 — Core POS | PRD: FR-13 through FR-22, Section 7.3

---

## 0. Pre-Build Checklist

- [x] This spec file is completely filled in
- [x] ARCHITECTURE.md reviewed — POS uses `POST /sales` and `GET /products/barcode/:code`
- [x] SECURITY.md reviewed — CASHIER role required; sale must be atomic Prisma transaction
- [x] Schema ready: `Product`, `Sale`, `SaleItem`, `Stock` all defined in `prisma/schema.prisma`
- [x] Routes listed in ARCHITECTURE.md
- [x] RBAC: CASHIER + OWNER can create sales

---

## 1. Feature Identity

| Field | Value |
|---|---|
| **Feature Name** | POS Checkout |
| **Feature ID** | FEAT-003 |
| **Phase** | MVP Phase 2 — Core POS |
| **PRD References** | FR-13, FR-14, FR-15, FR-16, FR-17, FR-18, FR-19, FR-20, FR-21, FR-22 |
| **Priority** | High — core MVP blocker |
| **Roles Affected** | CASHIER, OWNER |
| **Estimated Effort** | 3 days |

---

## 2. One-Line Summary

This feature allows a cashier to scan a product barcode (or search by name), build a cart with quantities and live totals, select a payment method, and complete a sale — which atomically records the transaction, deducts stock, and displays a digital receipt — all in under 60 seconds.

---

## 3. User Story

```
As a Cashier
I want to scan product barcodes, review a live cart, and complete a payment
So that I can serve each customer in under 60 seconds without manual price calculations
```

**Acceptance Criteria:**

- [ ] AC1: Scanning a valid barcode adds the product to the cart within 500ms
- [ ] AC2: Scanning an unknown barcode shows a "Product not found" toast (does not crash)
- [ ] AC3: Cart displays product name, quantity, unit price, and running line total for each item
- [ ] AC4: The grand total updates immediately whenever an item is added, removed, or quantity changed
- [ ] AC5: Cashier can set quantity to ×2 or more without re-scanning the same item
- [ ] AC6: Cashier can remove any item from the cart before checkout
- [ ] AC7: Checkout requires selecting a payment method (Cash / Card / EFT) — submit is disabled until selected
- [ ] AC8: On confirming payment, the system creates a sale record and all associated `SaleItem` rows atomically
- [ ] AC9: Stock is deducted for every item in the completed sale — confirmed by checking `Stock.quantity` after the transaction
- [ ] AC10: A digital receipt is displayed on-screen after successful sale with: date, items, totals, payment method
- [ ] AC11: The cart is cleared automatically after a successful sale — ready for the next customer
- [ ] AC12: If the API call fails, an error message is displayed and the cart is NOT cleared

---

## 4. Data Model

### Tables Involved

| Model | Operation | Notes |
|---|---|---|
| `Product` | READ | Barcode lookup: reads `name`, `pricePerUnit`, `unitType`, `isActive` |
| `Stock` | READ + WRITE | Read to check availability; deducted atomically on sale completion |
| `Sale` | WRITE | Created once per checkout; links to employee and optional customer |
| `SaleItem` | WRITE | One row per product in cart; stores `quantity`, `weightKg`, `unitPrice`, `lineTotal` |
| `AuditLog` | WRITE | Log the completed sale action |

### New Fields or Models Needed

None. All required models are already defined in `prisma/schema.prisma`.

---

## 5. API Contract

### `GET /products/barcode/:code`

**Request:** URL parameter `:code` = barcode string (e.g. `6001254123456`)

**Zod Schema (route param validation):**
```javascript
import { z } from 'zod';

export const barcodeParamSchema = z.object({
  code: z.string().min(1).max(100),
});
```

**Success Response (`HTTP 200`):**
```json
{
  "id": "clx123abc",
  "name": "Beef Wors 500g",
  "barcode": "6001254123456",
  "pricePerUnit": "45.00",
  "unitType": "fixed",
  "category": { "id": "clxcat1", "name": "Wors" },
  "stock": { "quantity": "24.000" }
}
```

**Error Responses:**
| Status | Condition | Body |
|---|---|---|
| 401 | Not authenticated | `{ "error": "Missing or malformed token" }` |
| 403 | Not CASHIER or OWNER | `{ "error": "Access denied" }` |
| 404 | Barcode not in DB | `{ "error": "Product not found" }` |
| 404 | Product exists but is archived | `{ "error": "Product is no longer available" }` |

---

### `POST /sales`

**Request:**
```json
{
  "customerId": "clxcust1",
  "paymentMethod": "CASH",
  "items": [
    {
      "productId": "clx123abc",
      "quantity": 2,
      "weightKg": null
    },
    {
      "productId": "clx456def",
      "quantity": 1,
      "weightKg": 0.750
    }
  ]
}
```

**Zod Schema:**
```javascript
import { z } from 'zod';

export const createSaleSchema = z.object({
  customerId: z.string().cuid().optional().nullable(),
  paymentMethod: z.enum(['CASH', 'CARD', 'EFT']),
  items: z.array(z.object({
    productId: z.string().cuid(),
    quantity: z.number().int().positive().max(1000),
    weightKg: z.number().positive().max(999).nullable().optional(),
  })).min(1, 'A sale must have at least one item'),
});
```

**Backend Logic (CRITICAL — must be atomic):**
```javascript
// controllers/saleController.js — required implementation pattern
import { prisma } from '../utils/prisma.js';
import { logAudit } from '../utils/audit.js';

export async function createSale(req, res) {
  const { customerId, paymentMethod, items } = req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Load all products in one query
      const productIds = items.map(i => i.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds }, isActive: true },
        include: { stock: true },
      });

      if (products.length !== productIds.length) {
        throw new Error('One or more products not found or inactive');
      }

      // 2. Validate stock availability & calculate totals
      let total = 0;
      const saleItems = items.map(item => {
        const product = products.find(p => p.id === item.productId);
        if (!product.stock || product.stock.quantity < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}`);
        }
        const lineTotal = product.unitType === 'per_kg'
          ? parseFloat(product.pricePerUnit) * (item.weightKg || 0)
          : parseFloat(product.pricePerUnit) * item.quantity;
        total += lineTotal;
        return { product, item, lineTotal };
      });

      // 3. Create sale
      const sale = await tx.sale.create({
        data: {
          employeeId: req.user.id,
          customerId: customerId || null,
          total,
          paymentMethod,
          items: {
            create: saleItems.map(({ product, item, lineTotal }) => ({
              productId: item.productId,
              quantity: item.quantity,
              weightKg: item.weightKg,
              unitPrice: product.pricePerUnit,
              lineTotal,
            })),
          },
        },
        include: { items: { include: { product: true } } },
      });

      // 4. Deduct stock for every item (in same transaction)
      for (const { product, item } of saleItems) {
        await tx.stock.update({
          where: { productId: product.id },
          data: { quantity: { decrement: item.quantity } },
        });
      }

      // 5. Audit log
      await logAudit(tx, {
        employeeId: req.user.id,
        action: 'SALE_COMPLETED',
        entity: 'Sale',
        entityId: sale.id,
        metadata: { total, paymentMethod, itemCount: items.length },
      });

      return sale;
    });

    res.status(201).json(result);
  } catch (err) {
    if (err.message.includes('Insufficient stock')) {
      return res.status(409).json({ error: err.message });
    }
    res.status(500).json({ error: 'Sale could not be completed. Please try again.' });
  }
}
```

**Success Response (`HTTP 201`):**
```json
{
  "id": "clxsale789",
  "total": "112.50",
  "paymentMethod": "CASH",
  "createdAt": "2026-06-01T14:30:00Z",
  "items": [
    {
      "id": "clxitem1",
      "product": { "name": "Beef Wors 500g" },
      "quantity": 2,
      "lineTotal": "90.00"
    }
  ]
}
```

**Error Responses:**
| Status | Condition | Body |
|---|---|---|
| 401 | Not authenticated | `{ "error": "Missing or malformed token" }` |
| 403 | Wrong role | `{ "error": "Access denied" }` |
| 409 | Insufficient stock | `{ "error": "Insufficient stock for Beef Wors 500g" }` |
| 422 | Zod validation failed | `{ "errors": { "fieldErrors": {...} } }` |
| 500 | Transaction failed | `{ "error": "Sale could not be completed. Please try again." }` |

---

## 6. Frontend Specification

### Route / Page
`/pos` → `src/pages/POS.jsx`

### UI Components Needed

| Component | File Path | Responsibility |
|---|---|---|
| `BarcodeInput` | `src/components/Cart/BarcodeInput.jsx` | Captures keyboard input from scanner; fires barcode lookup on Enter |
| `ProductSearch` | `src/components/ProductSearch/ProductSearch.jsx` | Name-based search fallback; debounced input → `GET /products?search=` |
| `CartItem` | `src/components/Cart/CartItem.jsx` | Renders one cart line: name, qty control, weight input (if per_kg), line total, remove button |
| `CartSummary` | `src/components/Cart/CartSummary.jsx` | Grand total, payment method selector, checkout button |
| `ReceiptModal` | `src/components/Cart/ReceiptModal.jsx` | On-screen receipt after successful sale; print button |
| `Toast` | `src/components/Toast.jsx` | Error/success notifications (e.g. "Product not found") |

### State (Zustand — `src/store/cartStore.js`)

```javascript
{
  items: [],                    // Array of cart line items
  addItem: (product) => {},     // Add or increment existing item
  removeItem: (productId) => {},
  updateQuantity: (productId, qty) => {},
  updateWeight: (productId, kg) => {},
  clearCart: () => {},
  grandTotal: computed,         // Derived from items
}
```

### User Interaction Flow

```
Step 1: Cashier focuses the BarcodeInput (auto-focused on page load)
   → Scanner emits barcode string + Enter keypress
   → Frontend: call GET /products/barcode/:code
   → On success (200): cartStore.addItem(product)
   → On 404: show Toast "Product not found — try searching by name"

Step 2: Cashier adjusts quantity
   → Click +/- on CartItem component
   → cartStore.updateQuantity(productId, newQty)
   → CartSummary grand total recalculates immediately (Zustand derived value)

Step 3: Weight-based product (unitType === 'per_kg')
   → CartItem shows a weight input field in grams
   → Cashier types weight → CartItem converts to kg → line total updates live

Step 4: Cashier selects payment method
   → CartSummary renders Cash / Card / EFT buttons
   → Selected method highlighted; checkout button becomes enabled

Step 5: Cashier taps "Complete Sale"
   → Button shows loading spinner; barcode input disabled
   → API call: POST /sales with cart contents
   → On 201: show ReceiptModal; cartStore.clearCart()
   → On 409 (insufficient stock): Toast "Not enough stock for [product]"; cart unchanged
   → On 500: Toast "Sale failed — please try again"; cart unchanged
```

### Loading and Error States

- **Loading (barcode lookup):** Product row in cart shows skeleton while API responds
- **Loading (checkout):** "Complete Sale" button shows spinner and is disabled; prevents double-submission
- **Empty cart:** CartSummary shows "No items yet — scan a product to begin" with a barcode icon
- **Product not found:** Red toast notification, BarcodeInput field clears, focus returns to input
- **Insufficient stock:** Orange toast notification with specific product name; cart is NOT cleared

---

## 7. Security Requirements

- **Authentication required?** Yes
- **Which roles can access this?** CASHIER, OWNER
- **Does this feature write to the DB?** Yes — `Sale`, `SaleItem`, `Stock`, `AuditLog`
- **Is it wrapped in a Prisma `$transaction`?** Yes — all four writes in one atomic block
- **Does this feature expose PII?** No — receipt shows product names and totals only, not customer details on screen
- **Does this feature write to AuditLog?** Yes — `SALE_COMPLETED` action with saleId, total, paymentMethod
- **Zod schema:** `createSaleSchema` defined in Section 5
- **Additional authorization:** None beyond RBAC role check

---

## 8. Performance Requirements

| Metric | Target | How to Verify |
|---|---|---|
| Barcode lookup (GET /products/barcode/:code) | < 500ms p95 | Playwright `expect(response.timing().responseEnd).toBeLessThan(500)` |
| Checkout (POST /sales) | < 1000ms p95 | Supertest timing assertion in integration test |
| Cart re-render on item add | < 100ms | Chrome DevTools Performance tab |
| POS page load on 4G | < 2s | Lighthouse CI score ≥ 90 |

---

## 9. Test Plan

### Unit / Integration Tests (`apps/api/tests/pos.test.js`)

| Test ID | Description | Expected Result |
|---|---|---|
| T01 | GET /products/barcode/VALID → returns product | HTTP 200 + product object |
| T02 | GET /products/barcode/UNKNOWN → product not found | HTTP 404 |
| T03 | GET /products/barcode/ARCHIVED → archived product | HTTP 404 "no longer available" |
| T04 | POST /sales with valid body → sale created, stock deducted | HTTP 201; `Stock.quantity` decremented correctly |
| T05 | POST /sales with insufficient stock → rejected | HTTP 409 |
| T06 | POST /sales is atomic: if stock deduction fails, sale is NOT created | Sale row absent in DB |
| T07 | POST /sales by STOCK_MANAGER → rejected | HTTP 403 |
| T08 | POST /sales unauthenticated → rejected | HTTP 401 |
| T09 | POST /sales with empty items array → Zod error | HTTP 422 |
| T10 | POST /sales creates AuditLog entry | AuditLog row exists with action SALE_COMPLETED |

### E2E Tests (`apps/web/e2e/pos.spec.js`)

| Test ID | Description | Steps |
|---|---|---|
| E01 | Happy path: scan → cart → pay → receipt | 1. Login as cashier → 2. Simulate barcode scan → 3. Verify product in cart → 4. Select CASH → 5. Click Complete Sale → 6. Assert receipt modal visible → 7. Assert cart cleared |
| E02 | Fallback search: type product name → add to cart | 1. Login → 2. Type in product search → 3. Click result → 4. Assert item appears in cart |
| E03 | Quantity adjustment | 1. Add product → 2. Click + twice → 3. Assert quantity = 3, grand total = price × 3 |
| E04 | Remove item from cart | 1. Add 2 products → 2. Remove one → 3. Assert only 1 item remains |
| E05 | Unknown barcode shows toast | 1. Scan unknown barcode → 2. Assert toast "Product not found" visible |

---

## 10. Definition of Done

- [x] All 12 acceptance criteria (Section 3) pass
- [ ] T01–T10 unit tests pass: `npm test`
- [ ] E01–E05 Playwright tests pass: `npx playwright test`
- [ ] `npm run lint` — zero errors
- [ ] `npm audit --audit-level=high` — no high/critical issues
- [ ] POS page tested on 360px (phone), 768px (tablet), 1280px (desktop)
- [ ] Atomic transaction confirmed: manual test — simulate DB error mid-transaction, verify sale not created
- [ ] AuditLog row verified after every sale in E2E test
- [ ] ARCHITECTURE.md endpoint table matches actual implemented routes

---

## 11. Out of Scope

- Split payment (partial cash + partial card) — Phase 2
- WhatsApp receipt sharing — Phase 2
- Discount / promotion codes — Phase 2
- Smart scale Bluetooth weight reading — Phase 2 (manual weight input only in MVP)
- Offline POS mode (sale queued without internet) — Phase 2
- Customer loyalty points — Phase 2
