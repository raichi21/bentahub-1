# Graph Report - bentahub  (2026-06-24)

## Corpus Check
- 249 files · ~80,434 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 862 nodes · 1467 edges · 74 communities (58 shown, 16 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8630b821`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 74|Community 74]]

## God Nodes (most connected - your core abstractions)
1. `verifyToken()` - 25 edges
2. `extractToken()` - 25 edges
3. `db` - 24 edges
4. `generateId()` - 21 edges
5. `Product` - 16 edges
6. `useAuth()` - 13 edges
7. `users` - 13 edges
8. `useCart()` - 12 edges
9. `useOrders()` - 11 edges
10. `hashVerificationCode()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `seedProducts()` --calls--> `generateId()`  [EXTRACTED]
  scripts/seed-products.ts → src/lib/auth-utils.ts
- `ReservationsPage()` --calls--> `useOrders()`  [INFERRED]
  src/app/customer/reservations/page.tsx → src/hooks/useOrders.ts
- `ProductCatalogProps` --references--> `Product`  [EXTRACTED]
  src/features/cashier-dashboard/components/product-catalog.tsx → src/types/cashier.ts
- `LiveTransactionFeedProps` --references--> `Transaction`  [EXTRACTED]
  src/features/staff-dashboard/components/live-transaction-feed.tsx → src/types/cashier.ts
- `StaffTransactionTableProps` --references--> `Transaction`  [EXTRACTED]
  src/features/staff-dashboard/components/staff-transaction-table.tsx → src/types/cashier.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **docs_bentahub_rbac_workflows** — docs_bentahub_admin_workflow, docs_bentahub_cashier_workflow, docs_bentahub_staff_workflow, docs_bentahub_customer_workflow [INFERRED 0.95]
- **docs_bentahub_system_constraints** — docs_bentahub_strict_payment_methods, docs_bentahub_no_delivery_architecture, docs_bentahub_role_based_security [INFERRED 0.95]

## Communities (74 total, 16 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.09
Nodes (43): registerSchema, registerUser(), resendCodeSchema, resendVerificationCodeAction(), verifyEmailAction(), verifyEmailSchema, POST(), getVerificationEmailHtml() (+35 more)

### Community 1 - "Community 1"
Cohesion: 0.12
Nodes (8): AuthHeader(), AuthHeaderProps, CreateNewPasswordForm(), ForgotPasswordForm(), RegisterForm(), ResetPasswordForm(), VerifyEmailForm(), RegisterPayload

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (38): GET(), getUserIdFromToken(), POST(), CartItem, cartItems, cartItemsRelations, InsertCartItem, insertCartItemSchema (+30 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (37): formatCurrency(), getSalesData(), MONTH_NAMES, SalesFilterOptions, SalesOverview, SalesPageData, SalesTransactionRow, SalesTrendPoint (+29 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (18): branches, BranchGrid(), CtaBanner(), DashboardSidebar(), DashboardSidebarProps, Footer(), HeroSection(), Navbar() (+10 more)

### Community 5 - "Community 5"
Cohesion: 0.07
Nodes (33): Admin Workflow, Cashier Workflow, Customer Workflow, BentaHub Developer Manual, Email Verification Codes Table Schema, Feature-Sliced Design Guidelines, FSD Structural Directory Mapping, JWT & Registration Verification Flow (+25 more)

### Community 6 - "Community 6"
Cohesion: 0.22
Nodes (16): getMonitoringData(), GET(), getUserIdFromToken(), extractToken(), verifyToken(), GET(), getUserIdFromToken(), PATCH() (+8 more)

### Community 7 - "Community 7"
Cohesion: 0.13
Nodes (13): ProductActions(), ProductActionsProps, ProductBreadcrumb(), ProductBreadcrumbProps, ProductDetailsSection(), ProductDetailsSectionProps, ProductImageGallery(), ProductImageGalleryProps (+5 more)

### Community 8 - "Community 8"
Cohesion: 0.07
Nodes (28): 1. Tech Stack, 2. User Workflows & Permission Loops, 3. System Rules & Constraints, 4. Backend Implementation: Auth & User Management, 5. Customer Portal: Status & Implementation, 6. Architecture & Directory Guidelines, 👑 Admin Workflow (`src/app/admin/`), 🔌 API Route Specifications (+20 more)

### Community 9 - "Community 9"
Cohesion: 0.21
Nodes (11): CashierPage(), CartItem(), CartItemProps, CartSidebar(), CartSidebarProps, CATEGORIES, ProductCatalog(), ProductCatalogProps (+3 more)

### Community 10 - "Community 10"
Cohesion: 0.18
Nodes (8): InventoryFlowTrend(), KPICard(), KPICardProps, BranchOption, SalesFilters(), SalesFiltersProps, UserMetrics(), UserTable()

### Community 11 - "Community 11"
Cohesion: 0.14
Nodes (11): TransactionsTable(), transactions, ReceiptModalProps, ReceiptModalProps, PaymentStatus, PRODUCT_CATEGORIES, ProductCategory, StockStatus (+3 more)

### Community 12 - "Community 12"
Cohesion: 0.21
Nodes (8): CartPage(), CheckoutPage(), useCart(), ProductDetailPage(), ProductCardProps, CartItem, CartState, useCartStore

### Community 13 - "Community 13"
Cohesion: 0.15
Nodes (7): InventoryUpdateTableProps, QuickStockModalProps, StaffKpiCards(), StaffKpiCardsProps, staffProducts, ProductCardProps, Product

### Community 14 - "Community 14"
Cohesion: 0.18
Nodes (9): PaymentItem, PaymentPickupList(), PaymentPickupListProps, PickupItem, Tab, VerifyPickupModal(), VerifyPickupModalProps, staffPayments (+1 more)

### Community 15 - "Community 15"
Cohesion: 0.19
Nodes (8): AdminTopbarProps, NAV_ITEMS, StaffSidebar(), StaffSidebarProps, ROUTE_TITLES, StaffTopbar(), StaffTopbarProps, ThemeToggle()

### Community 16 - "Community 16"
Cohesion: 0.16
Nodes (11): ConfirmPickupModal(), ConfirmPickupModalProps, PickupItem, PickupOrder, PickupDetailsModal(), PickupDetailsModalProps, PickupItem, PickupOrder (+3 more)

### Community 17 - "Community 17"
Cohesion: 0.22
Nodes (5): LiveTransactionFeed(), LiveTransactionFeedProps, StaffTransactionTable(), StaffTransactionTableProps, staffTransactions

### Community 18 - "Community 18"
Cohesion: 0.07
Nodes (32): 💻 Available Development Commands, BentaHub Contributing Guide, Core Folder Structure, Development Commands, 🏗️ Feature-Sliced Design (FSD) Guidelines, Contributing FSD Guidelines, 🛠️ Local Setup, Pull Request Quality Checklist (+24 more)

### Community 19 - "Community 19"
Cohesion: 0.20
Nodes (9): AddStockModal(), AddStockModalProps, CATEGORIES, ProductForm, InventoryUpdateTable(), QuickStockModal(), mockNotifications, StaffNotificationItem (+1 more)

### Community 20 - "Community 20"
Cohesion: 0.19
Nodes (9): AddUserModal(), AddUserModalProps, DeleteUserModal(), DeleteUserModalProps, EditUserModal(), EditUserModalProps, UserData, mockUsers (+1 more)

### Community 21 - "Community 21"
Cohesion: 0.17
Nodes (8): HistoryMetrics(), HistoryTable(), mockTransactions, Transaction, TransactionDetail, TransactionHistoryModal(), TransactionHistoryModalProps, TransactionItem

### Community 22 - "Community 22"
Cohesion: 0.24
Nodes (8): RecentOrdersTable(), TransactionTable(), useOrders(), ReservationsPage(), Order, OrderItem, OrdersState, useOrdersStore

### Community 23 - "Community 23"
Cohesion: 0.17
Nodes (6): CatalogToolbar(), CategorySidebar(), DashboardMobileNav(), DashboardMobileNavProps, NearbyBranches(), SummaryCards()

### Community 24 - "Community 24"
Cohesion: 0.18
Nodes (11): MonitoringMetrics(), MonitoringMetricsProps, SalesMetrics(), SalesMetricsProps, TransactionDetailsTable(), TransactionDetailsTableProps, KpiData, MonitoringMetricsData (+3 more)

### Community 25 - "Community 25"
Cohesion: 0.18
Nodes (7): PaymentDetailsModal(), PaymentDetailsModalProps, PaymentRecord, PaymentMetrics(), mockPayments, PaymentRecord, PaymentTable()

### Community 27 - "Community 27"
Cohesion: 0.31
Nodes (6): CatalogPage(), Pagination(), useProducts(), Product, ProductsState, useProductsStore

### Community 28 - "Community 28"
Cohesion: 0.40
Nodes (5): DashboardTopbar(), getInitials(), CustomerLayout(), CustomerPage(), useAuth()

### Community 29 - "Community 29"
Cohesion: 0.14
Nodes (12): formatCurrency(), RawBranch, RawInventory, RawProduct, RawTransaction, InventoryStatusTable(), InventoryStatusTableProps, SystemAlerts() (+4 more)

### Community 30 - "Community 30"
Cohesion: 0.18
Nodes (8): BranchStockItem, BranchStockOverview(), BranchStockOverviewProps, STATUS_COLORS, SalesChart(), SalesChartProps, AdminOverviewData, SalesTrendPointData

### Community 31 - "Community 31"
Cohesion: 0.28
Nodes (5): CashierSidebar(), CashierSidebarProps, NAV_ITEMS, CashierTopbar(), CashierTopbarProps

### Community 32 - "Community 32"
Cohesion: 0.22
Nodes (6): AdminNotificationsFeed(), badgeColorMap, borderColorMap, iconColorMap, mockNotifications, NotificationItem

### Community 33 - "Community 33"
Cohesion: 0.36
Nodes (4): PaymentSummaryCards(), PaymentsTable(), payments, Payment

### Community 35 - "Community 35"
Cohesion: 0.25
Nodes (5): CustomerNotificationItem, CustomerNotificationsFeed(), FilterTab, mockNotifications, tabs

### Community 36 - "Community 36"
Cohesion: 0.20
Nodes (5): ReservationFilters(), ReservationMetrics(), mockReservations, Reservation, ReservationTable()

### Community 37 - "Community 37"
Cohesion: 0.38
Nodes (4): ReservationCard(), ReservationCardProps, ReservationData, ReservationSummary()

### Community 38 - "Community 38"
Cohesion: 0.43
Nodes (4): useNotifications(), Notification, NotificationsState, useNotificationsStore

### Community 39 - "Community 39"
Cohesion: 0.33
Nodes (3): AdminSidebar(), AdminSidebarProps, AdminTopbar()

### Community 40 - "Community 40"
Cohesion: 0.22
Nodes (11): computeTrend(), formatCurrency(), getAdminOverview(), getMonthRange(), MONTH_NAMES, RawBranch, RawInventory, RawTransaction (+3 more)

### Community 42 - "Community 42"
Cohesion: 0.83
Nodes (3): DELETE(), getUserIdFromToken(), PUT()

### Community 47 - "Community 47"
Cohesion: 0.50
Nodes (3): Notification, NotificationCategory, NotificationSeverity

### Community 49 - "Community 49"
Cohesion: 0.50
Nodes (3): DATABASE_URL, Environment Variables Reference, JWT_SECRET

### Community 53 - "Community 53"
Cohesion: 0.18
Nodes (11): App structure, Architecture & FSD rules, Auth & security, BentaHub — Agent Instructions, Commands, Database, graphify, Known gotchas (+3 more)

### Community 65 - "Community 65"
Cohesion: 0.06
Nodes (27): getSettings(), saveSettings(), fontMono, fontSans, fontSerif, metadata, AuthContext, AuthContextValue (+19 more)

## Knowledge Gaps
- **267 isolated node(s):** `eslintConfig`, `config`, `pool`, `pool`, `pool` (+262 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ThemeToggle()` connect `Community 15` to `Community 28`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `Community 28` to `Community 12`, `Community 38`, `Community 22`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `verifyToken()` (e.g. with `PATCH()` and `GET()`) actually correct?**
  _`verifyToken()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `extractToken()` (e.g. with `PATCH()` and `GET()`) actually correct?**
  _`extractToken()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `eslintConfig`, `config`, `pool` to the rest of the system?**
  _270 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.08567774936061381 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._