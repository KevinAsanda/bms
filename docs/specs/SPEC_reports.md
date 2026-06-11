# SPEC_reports.md
# Feature Specification: Daily Reports & Cash-Up
> Feature ID: FEAT-005 | Phase: 5 — Reporting | PRD: Section 9.1, 9.2

---

## 0. Pre-Build Checklist

- [ ] This spec file is completely filled in
- [x] ARCHITECTURE.md reviewed — Reports uses `/reports` endpoints
- [x] SECURITY.md reviewed — OWNER role only
- [x] Schema ready: `Sale`, `SaleItem`, `Employee` tables
- [x] Routes listed in ARCHITECTURE.md
- [x] RBAC: OWNER only

---

## 1. Feature Identity

| Field | Value |
|---|---|
| **Feature Name** | Daily Reports & Cash-Up |
| **Feature ID** | FEAT-005 |
| **Phase** | MVP Phase 5 — Reporting |
| **PRD References** | Section 9.1 (Sales), 9.2 (Cash-up) |
| **Priority** | High — required for financial closing |
| **Roles Affected** | OWNER |
| **Estimated Effort** | 3 days |

---

## 2. One-Line Summary

This feature allows the owner to generate daily sales summaries and perform end-of-day cash-up to reconcile physical cash/card totals with system records.

---

## 3. User Story

```
As the Butchery Owner
I want to see a summary of today's sales and a breakdown by payment method
So that I can verify the cash in the drawer matches the system totals
```

**Acceptance Criteria:**

- [ ] AC1: Owner can see total revenue for a specific date (default: today)
- [ ] AC2: Report shows breakdown by payment method (Cash, Card, EFT)
- [ ] AC3: Report shows total sales count and average sale value
- [ ] AC4: Report shows a list of all sales for the day with time and employee
- [ ] AC5: Owner can filter reports by specific employee
- [ ] AC6: Data is read-only; reports cannot be edited
- [ ] AC7: Non-OWNER roles are strictly blocked (HTTP 403)

---

## 4. Data Model

### Tables Involved

| Model | Operation | Notes |
|---|---|---|
| `Sale` | READ | Aggregate totals and list sales |
| `SaleItem` | READ | Calculate product-level performance |
| `Employee` | READ | Filter by cashier |

---

## 5. API Contract

### `GET /reports/daily`
Summary metrics for the day.

**Query Params:**
- `date`: ISO date string (optional)

---

### `GET /reports/cashup`
Breakdown by payment method.

---

### `GET /reports/sales`
Detailed list of sales.

---

## 6. Frontend Specification

### Route / Page
`/dashboard` → `src/pages/Dashboard.jsx` (Reports tab)

### UI Components Needed

| Component | File Path | Responsibility |
|---|---|---|
| `MetricCards` | `src/components/Reports/MetricCards.jsx` | Big numbers (Total, Sales Count) |
| `PaymentBreakdown`| `src/components/Reports/PaymentBreakdown.jsx` | Pie chart or list of totals per method |
| `SalesTable` | `src/components/Reports/SalesTable.jsx` | Detailed transaction list |

---

## 7. Security Requirements

- **Authentication required?** Yes
- **Which roles can access this?** OWNER only
- **Does this feature write to the DB?** No
- **Does this feature expose PII?** Yes (Employee names, Customer names if linked)
- **Does this feature write to AuditLog?** No (Read-only)

---

## 8. Performance Requirements

- Aggregation queries optimized for < 2s response time
- Data cached for 5 minutes during the active session

---

## 9. Test Plan

### Unit / Integration Tests

| Test ID | Description | Expected Result |
|---|---|---|
| T01 | Daily report matches DB sum | Verified with manual calculation |
| T02 | Cash-up breakdown sums correctly | Sum(PaymentMethods) == Total |
| T03 | CASHIER cannot access reports | HTTP 403 |
| T04 | Filtering by date works | Only sales from that date returned |

---

## 10. Definition of Done

- [ ] All acceptance criteria pass
- [ ] Reporting service with optimized Prisma aggregations implemented
- [ ] OWNER-only access enforced
- [ ] Visual charts (if any) match DESIGN.md
- [ ] Tests pass

---

## 11. Out of Scope

- Monthly/Yearly reports — Phase 2
- Export to Excel/PDF — Phase 2
- VAT / Tax reporting — Phase 2
