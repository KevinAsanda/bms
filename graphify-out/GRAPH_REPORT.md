# Graph Report - .  (2026-06-14)

## Corpus Check
- Corpus is ~23,307 words - fits in a single context window. You may not need a graph.

## Summary
- 281 nodes · 573 edges · 27 communities (19 shown, 8 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 51 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Web Frontend UI & Axios API Client|Web Frontend UI & Axios API Client]]
- [[_COMMUNITY_Core API Controllers & Prisma Migration|Core API Controllers & Prisma Migration]]
- [[_COMMUNITY_Backend Dependencies & Configurations|Backend Dependencies & Configurations]]
- [[_COMMUNITY_Database Seed Scripts & Core Controllers|Database Seed Scripts & Core Controllers]]
- [[_COMMUNITY_Virtual Keyboard & Local Settings Management|Virtual Keyboard & Local Settings Management]]
- [[_COMMUNITY_Frontend Core Dependencies|Frontend Core Dependencies]]
- [[_COMMUNITY_Authentication & Rate Limiting API|Authentication & Rate Limiting API]]
- [[_COMMUNITY_Frontend Dev Tooling & Testing Dependencies|Frontend Dev Tooling & Testing Dependencies]]
- [[_COMMUNITY_Employee Admin Controller & Routing|Employee Admin Controller & Routing]]
- [[_COMMUNITY_Product & Catalogue Management API|Product & Catalogue Management API]]
- [[_COMMUNITY_Category & Catalogue Tests & Controllers|Category & Catalogue Tests & Controllers]]
- [[_COMMUNITY_Core Seed Utility|Core Seed Utility]]
- [[_COMMUNITY_Deployment & Service Provisioning|Deployment & Service Provisioning]]
- [[_COMMUNITY_Project Documentation & Lockfiles|Project Documentation & Lockfiles]]
- [[_COMMUNITY_Vitest Config Specifications|Vitest Config Specifications]]
- [[_COMMUNITY_Render Web Deployment|Render Web Deployment]]
- [[_COMMUNITY_Testing Library Configuration|Testing Library Configuration]]
- [[_COMMUNITY_ESLint Configuration Details|ESLint Configuration Details]]
- [[_COMMUNITY_Web Core HTML Template|Web Core HTML Template]]
- [[_COMMUNITY_Web Package Specifications|Web Package Specifications]]
- [[_COMMUNITY_Vite Dev Config Specifications|Vite Dev Config Specifications]]

## God Nodes (most connected - your core abstractions)
1. `prisma` - 22 edges
2. `api` - 20 edges
3. `logAudit()` - 19 edges
4. `useAuthStore` - 16 edges
5. `authMiddleware()` - 15 edges
6. `rbacMiddleware()` - 14 edges
7. `useKeyboardStore` - 13 edges
8. `router` - 11 edges
9. `login()` - 10 edges
10. `router` - 10 edges

## Surprising Connections (you probably didn't know these)
- `POPIA-Compliant Customer Management` --conceptually_related_to--> `createCustomer()`  [INFERRED]
  README.md → apps/api/src/controllers/customerController.js
- `Daily Cash-Ups & Reports` --conceptually_related_to--> `getDailySales()`  [INFERRED]
  README.md → apps/api/src/controllers/reportController.js
- `POS Checkout Feature` --conceptually_related_to--> `createSale()`  [INFERRED]
  README.md → apps/api/src/controllers/saleController.js
- `Inventory & Stock Tracking Feature` --conceptually_related_to--> `getStock()`  [INFERRED]
  README.md → apps/api/src/controllers/stockController.js
- `Role-Based Access Control Feature` --conceptually_related_to--> `rbacMiddleware()`  [INFERRED]
  README.md → apps/api/src/middleware/rbac.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Authentication & Session Management** — controllers_authcontroller_login, controllers_authcontroller_logout, controllers_authcontroller_refresh, middleware_auth_authmiddleware, middleware_ratelimiter_loginlimiter [INFERRED 0.95]
- **Inventory & Stock Management** — controllers_productcontroller_getproducts, controllers_productcontroller_createproduct, controllers_stockcontroller_getstock, controllers_stockcontroller_adjuststock, controllers_stockcontroller_receivestock [INFERRED 0.95]
- **Sales & Reporting Flow** — controllers_salecontroller_createsale, controllers_reportcontroller_getdailysales, controllers_reportcontroller_getdashboardstats, controllers_reportcontroller_getcategoryperformance [INFERRED 0.95]
- **RBAC Protected Routes Pattern** — routes_categoryroutes_router, routes_employeeroutes_router, routes_productroutes_router, routes_reportroutes_router, routes_saleroutes_router, routes_stockroutes_router [INFERRED 0.95]
- **Token Validation and Session Management Helpers** — utils_auth_generatetoken, utils_auth_generaterefreshtoken, utils_auth_verifytoken, utils_auth_verifyrefreshtoken [INFERRED 0.95]
- **API Integration Tests Suite** — tests_auth_test_auth_endpoints_suite, tests_category_test_category_endpoints_suite, tests_employee_test_employee_endpoints_suite, tests_pos_test_pos_endpoints_suite, tests_product_test_product_endpoints_suite, tests_stock_test_stock_endpoints_suite [INFERRED 0.95]
- **Virtual Keyboard Flow** — virtualkeyboard_index_virtualkeyboard, virtualkeyboard_qwertylayout_qwertylayout, virtualkeyboard_numpadlayout_numpadlayout [EXTRACTED 1.00]
- **Inventory Management UI Flow** — pages_inventory_inventory, inventory_producttable_producttable, inventory_productmodal_productmodal, inventory_stockadjustmodal_stockadjustmodal, inventory_categorymanager_categorymanager, inventory_stockhistory_stockhistory [EXTRACTED 1.00]
- **POS Checkout Flow** — pages_pos_pos, pos_customerselector_customerselector [EXTRACTED 1.00]
- **BMS Zustand Global Stores** — store_authstore_useauthstore, store_cartstore_usecartstore, store_keyboardstore_usekeyboardstore, store_settingsstore_usesettingsstore [INFERRED 0.95]

## Communities (27 total, 8 thin omitted)

### Community 0 - "Web Frontend UI & Axios API Client"
Cohesion: 0.15
Nodes (19): api, Navigation(), ProtectedRoute(), ThemeToggle(), CategoryManager(), ProductModal(), ProductTable(), StockAdjustModal() (+11 more)

### Community 1 - "Core API Controllers & Prisma Migration"
Cohesion: 0.12
Nodes (28): Initial DB Schema Migration, app, createCustomer(), getCustomers(), getCategoryPerformance(), getDailySales(), getDashboardStats(), createSale() (+20 more)

### Community 2 - "Backend Dependencies & Configurations"
Cohesion: 0.06
Nodes (33): author, dependencies, bcrypt, cookie-parser, cors, date-fns, dotenv, express (+25 more)

### Community 3 - "Database Seed Scripts & Core Controllers"
Cohesion: 0.10
Nodes (18): customerSchema, createSaleSchema, adapter, customersData, main(), pool, prisma, productsData (+10 more)

### Community 4 - "Virtual Keyboard & Local Settings Management"
Cohesion: 0.15
Nodes (14): VirtualKeyboard Component, Dark Mode Only Constraint, React Native Input Value Setter Override, Settings(), useKeyboardStore, applyTheme(), initialTheme, useSettingsStore (+6 more)

### Community 5 - "Frontend Core Dependencies"
Cohesion: 0.10
Nodes (20): dependencies, axios, date-fns, lucide-react, react, react-dom, react-router-dom, recharts (+12 more)

### Community 6 - "Authentication & Rate Limiting API"
Cohesion: 0.25
Nodes (14): login(), loginSchema, logout(), refresh(), loginLimiter, router, Auth Endpoints Integration Tests, Employee Endpoints Integration Tests (+6 more)

### Community 7 - "Frontend Dev Tooling & Testing Dependencies"
Cohesion: 0.12
Nodes (17): devDependencies, autoprefixer, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, jsdom (+9 more)

### Community 8 - "Employee Admin Controller & Routing"
Cohesion: 0.41
Nodes (10): createEmployee(), createEmployeeSchema, deactivateEmployee(), getAllEmployees(), resetEmployeePassword(), updateEmployee(), updateEmployeeSchema, router (+2 more)

### Community 9 - "Product & Catalogue Management API"
Cohesion: 0.36
Nodes (9): archiveProduct(), createProduct(), getProductByBarcode(), getProducts(), productSchema, updateProduct(), router, POS Endpoints Integration Tests (+1 more)

### Community 10 - "Category & Catalogue Tests & Controllers"
Cohesion: 0.38
Nodes (8): categorySchema, createCategory(), deleteCategory(), getCategories(), updateCategory(), router, Category Endpoints Integration Tests, Product Endpoints Integration Tests

### Community 11 - "Core Seed Utility"
Cohesion: 0.40
Nodes (4): adapter, main(), pool, prisma

### Community 12 - "Deployment & Service Provisioning"
Cohesion: 0.50
Nodes (4): API Package Config, Prisma Configuration, API Server Startup, BMS API Service Deployment

## Knowledge Gaps
- **109 isolated node(s):** `name`, `version`, `description`, `main`, `type` (+104 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `prisma` connect `Database Seed Scripts & Core Controllers` to `Core API Controllers & Prisma Migration`, `Authentication & Rate Limiting API`, `Employee Admin Controller & Routing`, `Product & Catalogue Management API`, `Category & Catalogue Tests & Controllers`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Why does `encrypt()` connect `Database Seed Scripts & Core Controllers` to `Employee Admin Controller & Routing`, `Core API Controllers & Prisma Migration`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `logAudit()` connect `Employee Admin Controller & Routing` to `Core API Controllers & Prisma Migration`, `Database Seed Scripts & Core Controllers`, `Authentication & Rate Limiting API`, `Product & Catalogue Management API`, `Category & Catalogue Tests & Controllers`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `useAuthStore` (e.g. with `useCartStore` and `useKeyboardStore`) actually correct?**
  _`useAuthStore` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _111 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Web Frontend UI & Axios API Client` be split into smaller, more focused modules?**
  _Cohesion score 0.14871794871794872 - nodes in this community are weakly interconnected._
- **Should `Core API Controllers & Prisma Migration` be split into smaller, more focused modules?**
  _Cohesion score 0.12462462462462462 - nodes in this community are weakly interconnected._