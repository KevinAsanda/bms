# SPEC_dashboard.md
# Feature Specification: Owner Dashboard
> Feature ID: FEAT-006 | Phase: 5 — Dashboard | PRD: Section 9.3

---

## 0. Pre-Build Checklist

- [ ] This spec file is completely filled in
- [x] ARCHITECTURE.md reviewed — Dashboard uses `/reports` and `/stock` endpoints
- [x] SECURITY.md reviewed — OWNER role only
- [x] Schema ready: All tables needed for metrics
- [x] Routes listed in ARCHITECTURE.md
- [x] RBAC: OWNER only

---

## 1. Feature Identity

| Field | Value |
|---|---|
| **Feature Name** | Owner Dashboard |
| **Feature ID** | FEAT-006 |
| **Phase** | MVP Phase 5 — Dashboard |
| **PRD References** | Section 9.3 |
| **Priority** | Medium — business visibility |
| **Roles Affected** | OWNER |
| **Estimated Effort** | 2 days |

---

## 2. One-Line Summary

This feature provides a real-time high-level view of business health, including today's revenue, recent transactions, and critical low-stock alerts.

---

## 3. User Story

```
As the Butchery Owner
I want to see a real-time summary of today's business performance at a glance
So that I can make quick decisions about stock and staffing
```

**Acceptance Criteria:**

- [ ] AC1: Dashboard displays "Today's Revenue" in large amber text
- [ ] AC2: Dashboard shows "Total Sales Today" and "Active Employees"
- [ ] AC3: Dashboard displays a list of critical low-stock items (`quantity <= lowThreshold`)
- [ ] AC4: Dashboard shows a "Recent Sales" list (last 10 transactions)
- [ ] AC5: Dashboard links directly to full reports and inventory management
- [ ] AC6: All metrics update every 5 minutes (or on manual refresh)
- [ ] AC7: Non-OWNER roles are redirected to their relevant home pages (POS or Inventory)

---

## 4. Data Model

### Tables Involved

| Model | Operation | Notes |
|---|---|---|
| `Sale` | READ | Today's revenue and recent sales |
| `Stock` | READ | Low stock alerts |
| `Employee` | READ | Active staff count |

---

## 5. API Contract

Uses existing endpoints from `/reports` and `/stock`.

---

## 6. Frontend Specification

### Route / Page
`/dashboard` → `src/pages/Dashboard.jsx`

### UI Components Needed

| Component | File Path | Responsibility |
|---|---|---|
| `StatCard` | `src/components/Dashboard/StatCard.jsx` | Reusable card for single metrics |
| `LowStockWidget` | `src/components/Dashboard/LowStockWidget.jsx` | List of items needing attention |
| `RecentSalesList`| `src/components/Dashboard/RecentSalesList.jsx` | Small table of last 10 sales |

---

## 7. Security Requirements

- **Authentication required?** Yes
- **Which roles can access this?** OWNER only
- **Does this feature write to the DB?** No
- **Does this feature write to AuditLog?** No

---

## 8. Performance Requirements

- Initial load < 1.5s
- Dashboard data weight < 50KB

---

## 9. Test Plan

### Unit / Integration Tests

| Test ID | Description | Expected Result |
|---|---|---|
| T01 | Dashboard loads all required metrics | Metrics present in state |
| T02 | Low stock alert appears when quantity is below threshold | Item visible in widget |
| T03 | STOCK_MANAGER cannot access dashboard | Redirect or 403 |

---

## 10. Definition of Done

- [ ] All acceptance criteria pass
- [ ] Dashboard page integrated with reporting/stock APIs
- [ ] Real-time feel (auto-refresh) implemented
- [ ] UI aligned with DESIGN.md
- [ ] Tests pass

---

## 11. Out of Scope

- Sales forecasting charts — Phase 2
- Employee performance leaderboards — Not planned
- Profit margin tracking — Phase 2
