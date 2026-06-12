# DESIGN.md — Simon Family Farm Butchery Management System

> **Give this file to Gemini CLI at the start of every UI generation prompt.**
> It is the single source of truth for every visual decision in the BMS.
> Gemini must not invent colours, fonts, or spacing outside this document.

---

## 1. Design Philosophy

The BMS is a **working tool, not a showcase**. It runs on a tablet at a busy butcher counter, on a phone in the owner's pocket, and on a back-office desktop. The design must make the right action obvious in under two seconds, survive a greasy finger-tap, and feel as authoritative as the business it serves.

The logo is the anchor. A bold butcher — arms crossed, cleavers raised, red circle behind him — communicates **confidence, craft, and no-nonsense professionalism**. The design system inherits every one of those values. Nothing in the UI should feel timid, rounded into softness, or decorative without purpose.

**This is a light-mode-only application.** The business operates in a bright shop environment. Dark mode introduces unnecessary contrast risks on low-quality screens. A dark/light toggle is included for the owner's back-office dashboard only (documented in Section 9).

---

## 2. Colour System

All colours are extracted directly from the logo via pixel analysis. Every hex value below is a verified logo colour or a mathematically derived tint/shade of one.

### 2.1 Primary Palette

| Token                       | Hex       | RGB           | Source                         | Use                                 |
| --------------------------- | --------- | ------------- | ------------------------------ | ----------------------------------- |
| `--color-brand-red`         | `#C21322` | 194, 19, 34   | Logo — richest red from circle | Primary CTAs, active states, badges |
| `--color-brand-red-deep`    | `#9D0C0F` | 157, 12, 15   | Logo — deepest shadow red      | Hover states, pressed buttons       |
| `--color-brand-red-mid`     | `#A92025` | 169, 32, 37   | Logo — average circle red      | Borders on red elements, alerts     |
| `--color-brand-black`       | `#0C0404` | 12, 4, 4      | Logo — outline black           | Primary text, nav, headings         |
| `--color-brand-steel`       | `#9A9A9C` | 154, 154, 156 | Logo — cleaver steel           | Secondary UI elements, dividers     |
| `--color-brand-steel-light` | `#C8C8CA` | 200, 200, 202 | Logo — cleaver highlight       | Disabled states, placeholder text   |

### 2.2 Neutral Palette (light-mode base)

Derived from the logo's off-white background and warm ink tones.

| Token                    | Hex       | Use                                            |
| ------------------------ | --------- | ---------------------------------------------- |
| `--color-surface-page`   | `#F7F4F2` | Page background — warm off-white, not clinical |
| `--color-surface-card`   | `#FFFFFF` | Cards, modals, drawers                         |
| `--color-surface-raised` | `#EDEAE8` | Subtle raised sections, table rows alt         |
| `--color-surface-input`  | `#F2EFED` | Input field backgrounds                        |
| `--color-border-default` | `#D6D0CC` | Card borders, input borders                    |
| `--color-border-strong`  | `#9A9A9C` | Focused inputs, selected rows                  |
| `--color-text-primary`   | `#0C0404` | Body text — logo black                         |
| `--color-text-secondary` | `#4A4547` | Labels, meta, captions                         |
| `--color-text-muted`     | `#8C8488` | Placeholder, disabled text                     |
| `--color-text-on-red`    | `#FFFFFF` | Text on red backgrounds                        |

### 2.3 Semantic / Status Colours

These are **not** brand colours. They carry system meaning only.

| Token                | Hex       | Use                                                           |
| -------------------- | --------- | ------------------------------------------------------------- |
| `--color-success`    | `#1B6B3A` | Stock healthy, sale complete, saved                           |
| `--color-success-bg` | `#E8F5EE` | Success toast background                                      |
| `--color-warning`    | `#8A5A00` | Low stock approaching threshold                               |
| `--color-warning-bg` | `#FDF3DC` | Warning toast background                                      |
| `--color-danger`     | `#C21322` | Out of stock, critical error — reuses brand red intentionally |
| `--color-danger-bg`  | `#FDEAEA` | Error toast background                                        |
| `--color-info`       | `#0C4A8A` | Informational states                                          |
| `--color-info-bg`    | `#E6F1FB` | Info toast background                                         |

### 2.4 Dark Mode (Owner Dashboard Only)

Applied only when `.theme-dark` class is set on `<html>`. Cashier POS **never** shows this toggle.

| Token                    | Dark Value | Notes                                      |
| ------------------------ | ---------- | ------------------------------------------ |
| `--color-surface-page`   | `#1A1210`  | Near-black with red warmth from logo       |
| `--color-surface-card`   | `#251A18`  | Slightly lifted surface                    |
| `--color-surface-raised` | `#2E2220`  | Table alt rows                             |
| `--color-text-primary`   | `#F2EDEA`  | Warm white                                 |
| `--color-text-secondary` | `#B8ACA8`  | Muted warm                                 |
| `--color-border-default` | `#3A2C2A`  | Dark border                                |
| `--color-brand-red`      | `#E02030`  | Slightly brighter red for dark bg contrast |

---

## 3. Typography

The logo is bold and artisanal. The type system must match: structured authority for headings, absolute clarity for numbers and prices, legibility above everything else in the POS.

### 3.1 Font Stack

```css
/* Display — headings, page titles, large numbers */
--font-display: "Oswald", "Arial Narrow", sans-serif;

/* Body — paragraphs, labels, descriptions */
--font-body: "Inter", "Segoe UI", system-ui, sans-serif;

/* Monospace — prices, quantities, barcodes, codes */
--font-mono: "JetBrains Mono", "Fira Code", "Courier New", monospace;
```

**Why Oswald for display:** It is a condensed, bold grotesque — the closest web-safe equivalent to the authority of a hand-painted butcher shop sign. It reads as physical and crafted without being novelty.

**Why Inter for body:** Maximum legibility at small sizes. The choice of every high-quality data-dense app (Linear, Vercel, Stripe). Staff cannot afford to misread a product name.

**Why JetBrains Mono for prices/quantities:** Numbers in a POS must be scannable at a glance. Monospace locking means price columns align perfectly and digit substitution (1 vs 7, 0 vs 6) is eliminated.

### 3.2 Type Scale

```css
--text-xs: 0.75rem; /* 12px — legal, version numbers */
--text-sm: 0.875rem; /* 14px — captions, table meta */
--text-base: 1rem; /* 16px — body default */
--text-md: 1.125rem; /* 18px — card labels, form labels */
--text-lg: 1.25rem; /* 20px — section headings */
--text-xl: 1.5rem; /* 24px — page titles */
--text-2xl: 2rem; /* 32px — cart total, big metrics */
--text-3xl: 2.75rem; /* 44px — POS grand total display */
--text-4xl: 3.5rem; /* 56px — dashboard hero numbers */
```

### 3.3 Type Rules

- **All page headings** → `font-family: var(--font-display)`, `font-weight: 600`, `letter-spacing: 0.02em`, `text-transform: uppercase`
- **Cart grand total** → `font-family: var(--font-mono)`, `font-size: var(--text-3xl)`, `color: var(--color-brand-red)`, `font-weight: 700`
- **All prices and quantities** → `font-family: var(--font-mono)`
- **Body text and labels** → `font-family: var(--font-body)`, `font-weight: 400`
- **Button labels** → `font-family: var(--font-body)`, `font-weight: 600`, `letter-spacing: 0.03em`
- **No italic anywhere in the POS** — italic is ambiguous on a tablet at arm's length

### 3.4 Google Fonts Import

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap"
  rel="stylesheet"
/>
```

---

## 4. Spacing & Layout

### 4.1 Spacing Scale

Based on a 4px base unit. Every margin, padding, and gap must be a multiple of 4.

```css
--space-1: 0.25rem; /*  4px */
--space-2: 0.5rem; /*  8px */
--space-3: 0.75rem; /* 12px */
--space-4: 1rem; /* 16px */
--space-5: 1.25rem; /* 20px */
--space-6: 1.5rem; /* 24px */
--space-8: 2rem; /* 32px */
--space-10: 2.5rem; /* 40px */
--space-12: 3rem; /* 48px */
--space-16: 4rem; /* 64px */
```

### 4.2 Border Radius

The logo has almost no curves — the red circle behind the butcher is structural, not decorative. Radius is minimal and intentional.

```css
--radius-sm: 4px; /* inputs, tags */
--radius-md: 8px; /* cards, modals */
--radius-lg: 12px; /* drawers, bottom sheets */
--radius-full: 9999px; /* pills, badges only */
```

**No radius on:** buttons (they are rectangular — authoritative, not friendly), table rows, POS cart items.

### 4.3 Elevation / Shadow

```css
--shadow-sm: 0 1px 2px rgba(12, 4, 4, 0.08);
--shadow-md: 0 4px 12px rgba(12, 4, 4, 0.1);
--shadow-lg: 0 8px 24px rgba(12, 4, 4, 0.14);
--shadow-red: 0 4px 16px rgba(194, 19, 34, 0.25); /* focused red CTAs */
```

### 4.4 Layout Grid

```css
/* Desktop — sidebar + content */
.layout-shell {
  display: grid;
  grid-template-columns: 240px 1fr;
  grid-template-rows: 64px 1fr;
  min-height: 100vh;
}

/* Tablet — collapsed sidebar (icon-only = 64px) */
@media (max-width: 1024px) {
  .layout-shell {
    grid-template-columns: 64px 1fr;
  }
}

/* Mobile — bottom nav, no sidebar */
@media (max-width: 640px) {
  .layout-shell {
    grid-template-columns: 1fr;
    grid-template-rows: 56px 1fr 64px;
  }
}
```

---

## 5. Component Library

### 5.1 Buttons

```css
/* Primary — brand red, used for: Complete Sale, Save, Confirm */
.btn-primary {
  background: var(--color-brand-red);
  color: var(--color-text-on-red);
  font-family: var(--font-body);
  font-weight: 600;
  font-size: var(--text-base);
  letter-spacing: 0.03em;
  padding: var(--space-3) var(--space-6);
  border-radius: 0; /* intentionally square */
  border: none;
  cursor: pointer;
  transition: background 120ms ease;
}
.btn-primary:hover {
  background: var(--color-brand-red-deep);
}
.btn-primary:active {
  background: var(--color-brand-red-mid);
  transform: translateY(1px);
}
.btn-primary:focus-visible {
  outline: 3px solid var(--color-brand-red);
  outline-offset: 3px;
  box-shadow: var(--shadow-red);
}

/* Secondary — outlined, used for: Cancel, Back, Edit */
.btn-secondary {
  background: transparent;
  color: var(--color-brand-black);
  border: 2px solid var(--color-border-strong);
  /* same font/padding/radius as primary */
}
.btn-secondary:hover {
  border-color: var(--color-brand-black);
  background: var(--color-surface-raised);
}

/* Danger — used for: Remove Item, Delete Product */
.btn-danger {
  background: var(--color-danger-bg);
  color: var(--color-danger);
  border: 1.5px solid var(--color-brand-red-mid);
  /* same font/padding */
}

/* Ghost — icon buttons, table actions */
.btn-ghost {
  background: transparent;
  color: var(--color-text-secondary);
  border: none;
  padding: var(--space-2);
}
.btn-ghost:hover {
  background: var(--color-surface-raised);
  color: var(--color-text-primary);
}

/* Size modifiers */
.btn-sm {
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
}
.btn-lg {
  padding: var(--space-4) var(--space-8);
  font-size: var(--text-md);
}
.btn-xl {
  padding: var(--space-5) var(--space-10);
  font-size: var(--text-lg);
} /* POS Complete Sale */
```

### 5.2 Inputs

```css
.input {
  background: var(--color-surface-input);
  border: 1.5px solid var(--color-border-default);
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  font-family: var(--font-body);
  font-size: var(--text-base);
  padding: var(--space-3) var(--space-4);
  width: 100%;
  transition:
    border-color 120ms ease,
    box-shadow 120ms ease;
}
.input:focus {
  outline: none;
  border-color: var(--color-brand-red);
  box-shadow: 0 0 0 3px rgba(194, 19, 34, 0.15);
}
.input::placeholder {
  color: var(--color-text-muted);
}
.input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Price / quantity inputs — monospace */
.input-numeric {
  font-family: var(--font-mono);
  font-size: var(--text-md);
  text-align: right;
  letter-spacing: 0.02em;
}
```

### 5.3 Cards

```css
.card {
  background: var(--color-surface-card);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  padding: var(--space-6);
}
/* Red left-accent — used for alerts, key metrics */
.card-accent {
  border-left: 4px solid var(--color-brand-red);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
}
```

### 5.4 Tables

```css
.table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}
.table th {
  background: var(--color-brand-black);
  color: var(--color-text-on-red);
  font-family: var(--font-display);
  font-size: var(--text-sm);
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: var(--space-3) var(--space-4);
  text-align: left;
}
.table td {
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border-default);
  color: var(--color-text-primary);
}
.table tr:nth-child(even) td {
  background: var(--color-surface-raised);
}
.table tr:hover td {
  background: rgba(194, 19, 34, 0.04);
}

/* Price columns */
.table td.price,
.table td.qty {
  font-family: var(--font-mono);
  text-align: right;
}
```

### 5.5 Badges / Status Pills

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px var(--space-3);
  border-radius: var(--radius-full);
  font-family: var(--font-body);
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.badge-red {
  background: var(--color-brand-red);
  color: white;
}
.badge-success {
  background: var(--color-success-bg);
  color: var(--color-success);
}
.badge-warning {
  background: var(--color-warning-bg);
  color: var(--color-warning);
}
.badge-danger {
  background: var(--color-danger-bg);
  color: var(--color-danger);
}
.badge-steel {
  background: var(--color-surface-raised);
  color: var(--color-text-secondary);
}
```

### 5.6 Toast Notifications

```css
.toast {
  position: fixed;
  bottom: var(--space-6);
  right: var(--space-6);
  min-width: 300px;
  max-width: 420px;
  background: var(--color-surface-card);
  border-left: 4px solid currentColor;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  padding: var(--space-4) var(--space-5);
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  z-index: 9999;
  animation: slideUp 200ms ease;
}
.toast-success {
  color: var(--color-success);
}
.toast-warning {
  color: var(--color-warning);
}
.toast-danger {
  color: var(--color-danger);
}
.toast-info {
  color: var(--color-info);
}

@keyframes slideUp {
  from {
    transform: translateY(16px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
```

### 5.7 Navigation Sidebar

```css
.sidebar {
  background: var(--color-brand-black);
  color: var(--color-text-on-red);
  display: flex;
  flex-direction: column;
  padding: var(--space-4) 0;
  width: 240px;
  height: 100vh;
  position: sticky;
  top: 0;
}
.sidebar-logo {
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: var(--space-4);
}
.sidebar-logo img {
  height: 48px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-6);
  color: rgba(255, 255, 255, 0.65);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: 500;
  text-decoration: none;
  transition: all 120ms ease;
  border-left: 3px solid transparent;
}
.nav-item:hover {
  background: rgba(255, 255, 255, 0.06);
  color: white;
}
.nav-item.active {
  background: rgba(194, 19, 34, 0.15);
  color: white;
  border-left-color: var(--color-brand-red);
  font-weight: 600;
}
```

---

## 6. Screen-Specific Design Rules

### 6.1 POS Screen (Cashier — speed-critical)

The POS is the most important screen. Every design decision here serves one goal: **complete a sale in under 60 seconds**.

**Layout:** Two-column split. Left = product search/scan area (60% width). Right = live cart (40% width, fixed).

**Cart Grand Total:** Always visible. `font-size: var(--text-3xl)`, `font-family: var(--font-mono)`, `color: var(--color-brand-red)`. Never hidden behind a scroll.

**Complete Sale Button:** Full width of the cart column. `btn-xl`. Background `var(--color-brand-red)`. Minimum height 64px. Text: "Complete Sale — R{total}".

**Barcode Input:** Autofocused. Invisible to the cashier — it captures scanner input silently. No label shown.

**Product tiles** (when searching): Grid of 3 columns on tablet. Each tile shows product name (Oswald, bold), price (monospace), and category badge. Tap-friendly minimum 80px height.

**No dark mode on POS** — ever. The shop is bright; the screen must be readable in sunlight.

### 6.2 Owner Dashboard

**Layout:** Metric cards row at top (4 cards: Today's Revenue, Sales Count, Low Stock Alerts, Top Product). Below: Sales trend chart (recharts/chart.js). Below: recent transactions table.

**Metric cards:** Each uses `.card-accent` with `var(--color-brand-red)` left border. The number is `--text-4xl`, `font-mono`. The label is `--text-sm`, uppercase, `font-display`.

**Dark mode toggle:** Floating in the top-right of the topbar. Icon-only (moon/sun). Sets `.theme-dark` on `<html>` and persists to localStorage.

### 6.3 Stock Management Screen

**Layout:** Single full-width table with sticky header. Columns: Product | Category | Current Stock | Threshold | Status badge | Actions.

**Status badges:**

- `In Stock` → `.badge-success`
- `Low Stock` → `.badge-warning`
- `Out of Stock` → `.badge-danger`

Stock quantity column → `font-family: var(--font-mono)`, right-aligned.

### 6.4 Login Screen

**Layout:** Centred card on `var(--color-surface-page)` background. Card max-width 420px.

**Logo:** Displayed above the form, centred, height 96px.

**Heading:** "SIMON FAMILY FARM" in Oswald, `--text-xl`, `--color-brand-black`. Below it: "Butchery Management System" in Inter, `--text-sm`, `--color-text-secondary`.

**No decorative elements.** The logo is the only graphic on this screen.

---

## 7. Iconography

Use **Lucide Icons** exclusively. They are clean, consistent, and map to every feature in the BMS.

```bash
# React
npm install lucide-react

# Web Component
npm install lucide
```

**Icon size standards:**

| Context                   | Size | Stroke |
| ------------------------- | ---- | ------ |
| Sidebar nav               | 20px | 1.5px  |
| Buttons (with label)      | 16px | 1.5px  |
| Icon-only buttons         | 20px | 1.5px  |
| Toast icons               | 20px | 2px    |
| Dashboard metric icons    | 28px | 1.5px  |
| Empty state illustrations | 64px | 1px    |

**Key icon → feature mapping:**

| Feature           | Lucide Icon     |
| ----------------- | --------------- |
| POS / Sales       | `ShoppingCart`  |
| Products          | `Package`       |
| Inventory / Stock | `Warehouse`     |
| Reports           | `BarChart3`     |
| Customers         | `Users`         |
| Settings          | `Settings`      |
| Barcode           | `ScanBarcode`   |
| Scale / Weight    | `Scale`         |
| Low stock alert   | `AlertTriangle` |
| Stock receive     | `PackagePlus`   |
| Stock correction  | `ClipboardEdit` |
| Receipt           | `Receipt`       |
| Cash              | `Banknote`      |
| Card payment      | `CreditCard`    |
| Owner / Admin     | `ShieldCheck`   |
| Logout            | `LogOut`        |

---

## 8. Logo Usage Rules

The logo provided is the **butcher mascot** — a bold chef with crossed cleavers over a red circle.

| Context        | Size        | Placement                              |
| -------------- | ----------- | -------------------------------------- |
| Sidebar header | 48px height | Left-aligned, full logo                |
| Login screen   | 96px height | Centred above form                     |
| PWA app icon   | 512×512     | Logo on `#F7F4F2` background           |
| Favicon        | 32×32       | Red circle + cleaver only (simplified) |
| Reports header | 36px height | Left-aligned                           |

**Do not:**

- Place the logo on a red background (red on red)
- Apply CSS filters or colour overlays to the logo
- Stretch or crop the logo non-proportionally
- Use the logo at sizes below 32px height

---

## 9. Dark/Light Mode Toggle — Implementation

The toggle is **only available to the Owner role**. Cashiers and Stock Managers always see light mode.

```tsx
// ThemeToggle.tsx
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(
    () => localStorage.getItem("bms-theme") === "dark",
  );

  useEffect(() => {
    document.documentElement.classList.toggle("theme-dark", dark);
    localStorage.setItem("bms-theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <button
      className="btn-ghost"
      onClick={() => setDark((d) => !d)}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
```

```css
/* global.css — dark mode overrides via class on <html> */
.theme-dark {
  --color-surface-page: #1a1210;
  --color-surface-card: #251a18;
  --color-surface-raised: #2e2220;
  --color-surface-input: #1e1614;
  --color-border-default: #3a2c2a;
  --color-border-strong: #5a4542;
  --color-text-primary: #f2edea;
  --color-text-secondary: #b8aca8;
  --color-text-muted: #7a6e6c;
  --color-brand-red: #e02030;
}
```

---

## 10. Motion & Animation

Keep motion minimal and purposeful. This is a tool, not a portfolio piece. Motion must never delay a task.

| Interaction      | Duration | Easing        |
| ---------------- | -------- | ------------- |
| Button hover     | 120ms    | `ease`        |
| Input focus ring | 120ms    | `ease`        |
| Toast slide-in   | 200ms    | `ease`        |
| Page transition  | 180ms    | `ease-out`    |
| Modal open       | 200ms    | `ease-out`    |
| Sidebar collapse | 250ms    | `ease-in-out` |

**Always respect:**

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 11. Responsive Breakpoints

```css
--bp-sm: 640px; /* Large phones */
--bp-md: 768px; /* Tablets portrait */
--bp-lg: 1024px; /* Tablets landscape, small laptops */
--bp-xl: 1280px; /* Desktop */
--bp-2xl: 1536px; /* Large desktop */
```

**POS-specific:** On screens below `768px`, the cart panel becomes a bottom drawer (slides up on "View Cart" tap). The product search area takes full width.

---

## 12. Accessibility Standards (WCAG 2.1 AA)

This is a store-facing tool. Accessibility is non-negotiable.

- All text on `--color-brand-red` background must be white (`#FFFFFF`) — contrast ratio 5.9:1 ✓
- `--color-brand-black` on `--color-surface-page` — contrast ratio 17.5:1 ✓
- All interactive elements must have visible `:focus-visible` states
- All icon-only buttons must have `aria-label`
- All form inputs must have associated `<label>` elements
- Touch targets minimum 44×44px on all interactive elements
- All images (including the logo) must have descriptive `alt` text

---

## 13. PWA App Icon & Splash Screen

### App Icon (used on home screen — must meet Play Store & App Store standards)

```
Sizes required: 48, 72, 96, 144, 192, 512 (px, square)
Background:     #F7F4F2 (page background — warm off-white)
Logo:           Butcher mascot, centred, at 80% of icon width
Safe zone:      10% padding from edges on all sides
Format:         PNG, no transparency for splash / icon backgrounds
```

### Splash Screen

```
Background:  #F7F4F2
Logo:        Centred, 160px height
Below logo:  "SIMON FAMILY FARM" — Oswald 600, 24px, #0C0404
Below name:  "Butchery Management System" — Inter 400, 14px, #4A4547
```

### manifest.json

```json
{
  "name": "Simon Family Farm BMS",
  "short_name": "SFF Butchery",
  "description": "Butchery Management System for Simon Family Farm",
  "start_url": "/",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#F7F4F2",
  "theme_color": "#C21322",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

---

## 14. CSS Variables — Complete Reference

Paste this block into `src/styles/tokens.css` and import it in your root file.

```css
:root {
  /* Brand */
  --color-brand-red: #c21322;
  --color-brand-red-deep: #9d0c0f;
  --color-brand-red-mid: #a92025;
  --color-brand-black: #0c0404;
  --color-brand-steel: #9a9a9c;
  --color-brand-steel-light: #c8c8ca;

  /* Surfaces */
  --color-surface-page: #f7f4f2;
  --color-surface-card: #ffffff;
  --color-surface-raised: #edeae8;
  --color-surface-input: #f2efed;

  /* Borders */
  --color-border-default: #d6d0cc;
  --color-border-strong: #9a9a9c;

  /* Text */
  --color-text-primary: #0c0404;
  --color-text-secondary: #4a4547;
  --color-text-muted: #8c8488;
  --color-text-on-red: #ffffff;

  /* Semantic */
  --color-success: #1b6b3a;
  --color-success-bg: #e8f5ee;
  --color-warning: #8a5a00;
  --color-warning-bg: #fdf3dc;
  --color-danger: #c21322;
  --color-danger-bg: #fdeaea;
  --color-info: #0c4a8a;
  --color-info-bg: #e6f1fb;

  /* Typography */
  --font-display: "Oswald", "Arial Narrow", sans-serif;
  --font-body: "Inter", "Segoe UI", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", "Fira Code", "Courier New", monospace;

  /* Type scale */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-md: 1.125rem;
  --text-lg: 1.25rem;
  --text-xl: 1.5rem;
  --text-2xl: 2rem;
  --text-3xl: 2.75rem;
  --text-4xl: 3.5rem;

  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;

  /* Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(12, 4, 4, 0.08);
  --shadow-md: 0 4px 12px rgba(12, 4, 4, 0.1);
  --shadow-lg: 0 8px 24px rgba(12, 4, 4, 0.14);
  --shadow-red: 0 4px 16px rgba(194, 19, 34, 0.25);

  /* Transitions */
  --transition-fast: 120ms ease;
  --transition-normal: 200ms ease;
  --transition-slow: 300ms ease;

  /* Breakpoints (reference only — use in JS/media queries) */
  --bp-sm: 640px;
  --bp-md: 768px;
  --bp-lg: 1024px;
  --bp-xl: 1280px;
  --bp-2xl: 1536px;
}
```

---

## 15. Gemini CLI Prompt Snippets

Use these as prefixes when generating any UI component with Gemini CLI.

### For any screen:

```
Using the Simon Family Farm BMS design system (DESIGN.md):
- Light mode only (except owner dashboard which supports dark)
- Colours: brand red #C21322, black #0C0404, surface #F7F4F2
- Fonts: Oswald (headings/display), Inter (body), JetBrains Mono (prices/numbers)
- Buttons are square (border-radius: 0), primary buttons are brand red
- All prices and quantities use font-family: 'JetBrains Mono'
- Logo: butcher mascot PNG at /public/logo.png
- Icons: Lucide only
- No dark mode toggle on cashier POS or stock manager screens
```

### For the POS screen specifically:

```
Build the POS checkout screen. Two-column layout: left 60% product search,
right 40% fixed cart. Cart grand total must be visible at all times in
JetBrains Mono, font-size 2.75rem, color #C21322. Complete Sale button
is full-width, minimum 64px height, brand red, square corners.
The barcode input is autofocused and invisible (no visible input field shown).
```

---

_DESIGN.md — Simon Family Farm BMS — v1.0 — June 2026_
_Colours verified via pixel analysis of logo file: `1781253239063_image.png`_
