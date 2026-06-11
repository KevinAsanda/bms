# DESIGN.md
# Butchery Management System — Design System
> Version 1.0 | Simon Family Farm | June 2026
> **GEMINI INSTRUCTION:** Read this file completely before writing any JSX, CSS, or Tailwind classes. Every UI decision must align with this document. Do not invent new colors, fonts, or layout patterns not listed here.

---

## 1. Design Philosophy

The BMS is used by butchery workers at a physical counter under time pressure with customers waiting. The design principles that follow from this context:

1. **Speed first** — The most important action on every screen must be reachable in one tap. No hunting for buttons.
2. **Industrial utility** — Clean, high-contrast, information-dense. Not a consumer app. Not colorful. Not rounded and soft. Think POS terminal, not Instagram.
3. **Touch-safe targets** — All interactive elements minimum 48×48px. Tablet and phone are primary devices at the counter.
4. **Readable at a glance** — Large numbers for prices and quantities. No small text in the critical path.
5. **Dark mode by default** — Counter light is variable. Dark UI reduces eye strain during long shifts and makes bright price numbers pop.

---

## 2. Color Palette

Use CSS custom properties throughout. Never hardcode hex values in component code.

```css
:root {
  /* Backgrounds */
  --color-bg-base:       #0f1117;   /* Page background — near black */
  --color-bg-surface:    #1a1d27;   /* Card / panel background */
  --color-bg-elevated:   #242736;   /* Input fields, dropdown menus */
  --color-bg-hover:      #2e3248;   /* Hover state for rows */

  /* Brand / Primary — Deep amber (meat, warmth, South African sun) */
  --color-primary:       #e8930a;   /* Primary CTA buttons, active states */
  --color-primary-dark:  #c4780a;   /* Pressed / active variant */
  --color-primary-glow:  rgba(232, 147, 10, 0.2);  /* Focus ring, highlights */

  /* Text */
  --color-text-primary:  #f0f2f8;   /* Main text — off-white */
  --color-text-secondary:#8b90a8;   /* Labels, secondary info */
  --color-text-muted:    #555a72;   /* Placeholder text, disabled */

  /* Borders */
  --color-border:        #2e3248;   /* Default border */
  --color-border-strong: #454b68;   /* Emphasized borders */

  /* Status */
  --color-success:       #2ecc71;   /* Completed sales, stock OK */
  --color-warning:       #f39c12;   /* Low stock alerts */
  --color-error:         #e74c3c;   /* Errors, insufficient stock */
  --color-info:          #3498db;   /* Informational toasts */

  /* Role badges */
  --color-role-owner:    #9b59b6;
  --color-role-cashier:  #27ae60;
  --color-role-stock:    #2980b9;
}
```

### Color Usage Rules

- `--color-primary` is used **only** for the single most important action on each screen (Complete Sale, Save Product, Login). Maximum one primary button visible at a time.
- `--color-success` is used **only** after a completed action (receipt shown, stock saved). Not for decoration.
- `--color-error` is used **only** for actual errors. Warning states use `--color-warning`.
- White backgrounds are **never** used. The system is dark-mode only.

---

## 3. Typography

```css
/* Import in index.css */
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Syne:wght@400;700;800&display=swap');

:root {
  /* Display font — screen headers, big numbers */
  --font-display: 'Syne', sans-serif;

  /* Mono — prices, stock quantities, barcodes, receipt data */
  --font-mono: 'JetBrains Mono', monospace;

  /* Body — labels, descriptions, general UI text */
  --font-body: 'Syne', sans-serif;
}
```

### Type Scale

```css
:root {
  --text-xs:   0.75rem;   /* 12px — timestamps, fine print */
  --text-sm:   0.875rem;  /* 14px — secondary labels */
  --text-base: 1rem;      /* 16px — default body text */
  --text-lg:   1.125rem;  /* 18px — product names in cart */
  --text-xl:   1.25rem;   /* 20px — section headings */
  --text-2xl:  1.5rem;    /* 24px — page titles */
  --text-3xl:  1.875rem;  /* 30px — grand total on POS */
  --text-4xl:  2.25rem;   /* 36px — receipt total */
  --text-5xl:  3rem;      /* 48px — daily revenue on dashboard */
}
```

### Typography Rules

- **Prices and quantities** always use `--font-mono`. No exceptions. Monospace aligns digits.
- **Page headings** use `--font-display` at `--text-2xl` or larger, weight 800.
- **Body copy** uses `--font-body` at `--text-base`.
- **No italic text** anywhere in the application.
- Line height for body text: `1.6`. Line height for headings: `1.2`.

---

## 4. Spacing System

Based on a 4px base unit. Tailwind spacing maps directly to this.

```
4px  = space-1  → tight: icon gaps, badge padding
8px  = space-2  → compact: tag spacing
12px = space-3  → small: input padding vertical
16px = space-4  → default: card padding, form field gaps
20px = space-5  → medium: section gaps
24px = space-6  → large: card-to-card separation
32px = space-8  → xl: page section gaps
48px = space-12 → page margin on mobile
64px = space-16 → large section separation on desktop
```

---

## 5. Component Patterns

### Buttons

Three button types only. No variations, no ghost-of-ghost.

```jsx
// PRIMARY — one per screen, most important action
<button className="
  bg-[var(--color-primary)] 
  text-black font-bold 
  px-6 py-3 rounded-lg 
  text-base
  min-h-[48px]
  hover:bg-[var(--color-primary-dark)]
  active:scale-95
  transition-all duration-150
  disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100
">
  Complete Sale
</button>

// SECONDARY — supporting actions
<button className="
  bg-[var(--color-bg-elevated)]
  text-[var(--color-text-primary)]
  border border-[var(--color-border-strong)]
  px-5 py-3 rounded-lg
  min-h-[48px]
  hover:bg-[var(--color-bg-hover)]
  transition-colors duration-150
">
  Add Product
</button>

// DESTRUCTIVE — remove, delete, archive
<button className="
  bg-transparent
  text-[var(--color-error)]
  border border-[var(--color-error)]
  px-4 py-2 rounded-lg
  min-h-[48px]
  hover:bg-[var(--color-error)]/10
  transition-colors duration-150
">
  Remove
</button>
```

### Input Fields

```jsx
<input className="
  w-full
  bg-[var(--color-bg-elevated)]
  border border-[var(--color-border)]
  text-[var(--color-text-primary)]
  rounded-lg
  px-4 py-3
  text-base
  font-[var(--font-body)]
  placeholder:text-[var(--color-text-muted)]
  focus:outline-none
  focus:border-[var(--color-primary)]
  focus:ring-2 focus:ring-[var(--color-primary-glow)]
  transition-all duration-150
" />
```

### Cards / Panels

```jsx
<div className="
  bg-[var(--color-bg-surface)]
  border border-[var(--color-border)]
  rounded-xl
  p-6
">
  {/* Content */}
</div>
```

### Price Display (Monospace — always for rand amounts)

```jsx
<span className="
  font-[var(--font-mono)]
  text-[var(--color-primary)]
  text-3xl font-semibold
  tabular-nums
">
  R 112.50
</span>
```

### Status Badges

```jsx
// Usage: stock levels, order status, user roles
const statusStyles = {
  success: 'bg-[var(--color-success)]/15 text-[var(--color-success)] border border-[var(--color-success)]/30',
  warning: 'bg-[var(--color-warning)]/15 text-[var(--color-warning)] border border-[var(--color-warning)]/30',
  error:   'bg-[var(--color-error)]/15   text-[var(--color-error)]   border border-[var(--color-error)]/30',
};

<span className={`px-2 py-1 rounded-md text-xs font-semibold ${statusStyles.warning}`}>
  Low Stock
</span>
```

---

## 6. Layout System

### Page Layout

Every page uses a consistent shell:

```
┌──────────────────────────────────────────────────┐
│  Sidebar (desktop: 240px) │  Main Content Area   │
│  ──────────────────────── │  ────────────────── │
│  BMS Logo                 │  Page Header         │
│  Nav Items                │  (title + actions)   │
│  ──────────────────────── │                      │
│  User info + role badge   │  Content             │
│  Logout                   │                      │
└──────────────────────────────────────────────────┘

Mobile (< 768px): sidebar collapses to bottom tab bar
```

### POS Screen Layout (Critical — Optimized for Tablet)

```
┌───────────────────────────────────────────────────────┐
│  HEADER: "Point of Sale" | Employee name | Timestamp  │
├─────────────────────────────┬─────────────────────────┤
│  LEFT PANEL (60%)           │  RIGHT PANEL (40%)      │
│  ─────────────────────────  │  ─────────────────────  │
│  [ Barcode Input — large ]  │  CART                   │
│  [ Product Search ]         │  ─────────────────────  │
│                             │  Item rows (scrollable) │
│  (search results appear     │                         │
│   here when typing)         │  ─────────────────────  │
│                             │  Grand Total (LARGE)    │
│                             │  Payment method select  │
│                             │  [Complete Sale] button │
└─────────────────────────────┴─────────────────────────┘

Mobile: LEFT panel above, RIGHT panel below (stacked)
Tablet (primary device): two-column as shown above
```

### Dashboard Layout

```
┌─────────────────────────────────────────────────────────┐
│  HEADER: Today's Date | "Good morning, Simon"           │
├──────────┬──────────┬──────────┬──────────────────────── │
│  Today's │  Total   │  Active  │  Low Stock Count        │
│  Revenue │  Sales   │  Products│                         │
│  (large) │  (large) │          │                         │
├──────────┴──────────┴──────────┴──────────────────────── │
│  Recent Sales Table (last 10)                           │
│  [View Full Report] button                              │
└─────────────────────────────────────────────────────────┘
```

---

## 7. Screen-by-Screen UI Specifications

### Login Screen

- Full-screen centered card on dark background
- BMS logo at top (text logo: "BMS" in `--font-display` weight 800, amber color)
- Below logo: "Simon Family Farm" in `--text-sm` `--color-text-secondary`
- Email field, password field, Login button (primary)
- No "Register" or "Forgot password" link visible to users (owner manages via admin panel)
- Error state: red border on both fields + error message below

### POS Screen

- **BarcodeInput**: Full-width, large input field. Placeholder: "Scan barcode or type product name…". Auto-focused. Font size `--text-lg`. When scanner fires, the field fills and clears in under 100ms (the scan itself is the UX — no button needed).
- **Cart rows**: Each row shows product name (`--text-base`), quantity +/- buttons (large, 48px), unit price (mono), line total (mono, amber). Remove button (red icon, right side).
- **Grand total**: `--text-3xl`, monospace, amber color, bottom-right panel. Prefix: "R " (South African Rand).
- **Payment method**: Three pill buttons side-by-side: CASH / CARD / EFT. Selected = amber background, black text. Unselected = surface background, muted text.
- **Complete Sale button**: Full-width at bottom of right panel. Disabled (opacity 40%) until payment method selected.

### Inventory Screen

- Table view of all products and their current stock levels
- Columns: Product Name | Category | Unit | Price | Stock Qty | Low Threshold | Status | Actions
- Status badge: green "In Stock", orange "Low Stock", red "Out of Stock"
- Search bar at top to filter table
- "+ Receive Delivery" and "+ Adjust Stock" buttons in the header area

### Owner Dashboard

- Stat cards at top: Today's Revenue, Total Sales Today, Low Stock Alerts
- Revenue displayed very large in monospace amber
- Recent sales list with: time, cashier name, total, payment method
- Low stock warning section below — list of products at or below threshold

---

## 8. Motion and Transitions

Keep motion purposeful and fast. This is a POS system, not a portfolio site.

| Interaction | Effect | Duration |
|---|---|---|
| Button hover | Background color shift | 150ms ease |
| Button click / tap | `scale(0.95)` | 100ms |
| Cart item added | Slide in from top | 200ms ease-out |
| Cart item removed | Fade out + collapse | 200ms ease-in |
| Toast notification | Slide in from bottom-right | 250ms ease-out |
| Toast dismiss | Fade out | 200ms |
| Page transition | Fade opacity 0→1 | 200ms |
| Receipt modal | Scale 0.95→1 + fade | 250ms |
| Loading spinner | Rotate 360° | 800ms linear infinite |

**No** parallax, no floating elements, no scroll-triggered animations. They add zero value in a POS context.

---

## 9. Responsive Breakpoints

```javascript
// Tailwind config breakpoints (already defaults, listed for reference)
screens: {
  'sm':  '640px',   // Large phone landscape
  'md':  '768px',   // Tablet portrait — PRIMARY device
  'lg':  '1024px',  // Tablet landscape / small laptop
  'xl':  '1280px',  // Desktop
}
```

**Priority device is tablet at 768px–1024px** (counter tablet). Mobile (360px–640px) is the owner's smartphone for dashboards. Desktop (1280px+) is back-office computer.

Every page must be tested at: **360px**, **768px**, **1280px**.

---

## 10. Icons

Use `lucide-react` exclusively. No other icon library.

```javascript
import { ShoppingCart, Package, BarChart2, Users, Settings, LogOut, 
         Plus, Minus, Trash2, Search, Scan, CheckCircle, AlertTriangle,
         XCircle, RefreshCw, Download } from 'lucide-react';
```

Icon sizes: `16px` (inline text), `20px` (buttons), `24px` (nav items), `32px` (empty states).

---

## 11. Toast Notifications

Single `<ToastContainer>` mounted at root level. Four types:

```javascript
// Usage: import { useToast } from '../hooks/useToast'
// toast.success('Sale completed — R 112.50')
// toast.error('Product not found')
// toast.warning('Stock low: Beef Wors 500g has 2 units remaining')
// toast.info('Synced 3 offline sales')

// Toast appears bottom-right on desktop, bottom-center on mobile
// Auto-dismisses after 4 seconds
// Can be manually dismissed by clicking
// Maximum 3 toasts visible at once (oldest dismissed first)
```

---

## 12. Empty States

Every list or table that can be empty must have a meaningful empty state. Not just "No data."

| Screen | Empty State Message | Icon |
|---|---|---|
| Cart (no items) | "Scan a product to start the sale" | `Scan` icon |
| Products list (no search results) | "No products match your search" | `Package` icon |
| Sales history (no sales today) | "No sales recorded today yet" | `ShoppingCart` icon |
| Stock adjustments log (empty) | "No adjustments have been made" | `RefreshCw` icon |
| Customer list (no customers) | "No customers saved yet" | `Users` icon |

---

## 13. Accessibility Baseline

- All interactive elements have `aria-label` where the visual label is not self-describing
- Color is never the **only** indicator of state — always paired with text or icon
- Focus rings visible on all focusable elements (the `focus:ring` pattern in component styles above)
- Tab order follows reading order
- Form inputs always paired with `<label>` elements (use `htmlFor` in React)
- Cart item +/- buttons: `aria-label="Increase quantity of Beef Wors 500g"`
