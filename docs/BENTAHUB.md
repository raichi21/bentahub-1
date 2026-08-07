# BentaHub — Unified Developer Reference Manual

Welcome to the **BentaHub** developer reference manual. This document serves as the single source of truth for our system architecture, data models, developer guidelines, API specifications, and implementation status.

---

## 1. Tech Stack

| Category | Technology | Description |
|---|---|---|
| **Framework** | Next.js 16 | App Router (with Turbopack), Server Actions, and API routes |
| **Styling & UI** | Tailwind CSS v4, Radix UI (shadcn) | Custom HSL-tailored theme UI, dark mode support, and clean animations |
| **Database** | PostgreSQL | Relational database storage |
| **ORM** | Drizzle ORM | Database schema definitions, migrations, and seeders |
| **Language** | TypeScript | Strong typing for client and server code |
| **Package Manager** | pnpm | Fast, disk-efficient package management |
| **Architecture** | Feature-Sliced Design (FSD) | Structural modularity, low coupling, and isolation |

---

## 2. User Workflows & Permission Loops

The application enforces four distinct user permission loops based on role-based access control (RBAC): Admin, Staff, Cashier, and Customer.

```text
               ┌──────────────────────────────┐
               │         Secure Login          │
               └──────────────┬───────────────┘
                              │
        ┌──────────┬──────────┼──────────┬──────────┐
        ▼          ▼          ▼          ▼          ▼
 ┌────────────┐ ┌────────┐ ┌────────┐ ┌────────────┐
 │   Admin    │ │ Staff  │ │ Cashier│ │  Customer  │
 │(Global RBAC)│ │(Branch-│ │(Branch-│ │(Self-Service│
 └──────┬─────┘ │ Locked)│ │ Locked)│ └──────┬─────┘
        │       └───┬────┘ └───┬────┘        │
        ▼           ▼          ▼              ▼
 ┌────────────┐ ┌────────┐ ┌────────┐ ┌────────────┐
 │ Analytics, │ │ Stock  │ │ POS    │ │ Catalog,   │
 │ User Mgmt, │ │ Mgmt,  │ │ Check- │ │ Cart,      │
 │ Settings,  │ │ Pickups│ │ out    │ │ Reservations│
 │ Monitoring │ └────────┘ └────────┘ └────────────┘
 └────────────┘
```

### 👑 Admin Workflow (`/admin/*`)
1. **Secure Login**: Accesses the global administrative panel with cross-branch privileges via `/login?redirect=/admin`. Admin accounts use `@bentahub.com` email domain.
2. **Analytics & Monitoring**: Centralized dashboard with overview KPIs, sales tracking, and live monitoring. Drills down into individual branch metrics.
3. **User Management**: Creates staff and cashier accounts (enforced `@bentahub.com` email domain), manages credentials, and activates/deactivates users.
4. **Settings**: Configures store-wide settings (store name, address, contact info, currency, business hours, notification preferences, security rules).
5. **Sales & History**: Views all transactions cross-branch, manages payments, pickups, and reservations.

### 👨‍💼 Staff Workflow (`/staff/*`)
1. **Branch-Locked Access**: Logs into a branch-specific interface. Cannot query or mutate data from other branches.
2. **Inventory Management**: Tracks branch-specific stock numbers, manages low-stock warnings, views product catalog.
3. **Pickup Validation**: Resolves and releases customer-reserved pickup items.

### 🧾 Cashier Workflow (`/cashier/*`)
1. **Branch-Locked Access**: Logs into a branch-specific POS interface.
2. **POS Checkout**: Scans/searches products, dynamically updates checkout totals, processes payments (Cash or GCash).
3. **Transaction Management**: Views today's transactions, processes refunds if needed.

### 👤 Customer Workflow (`/customer/*`)
1. **Registration & Login**: Registers via `/register` (Gmail only), verifies email with OTP code, then logs in at `/login`.
2. **Catalog Browsing**: Views live product catalog with stock availability.
3. **Cart & Reservation**: Adds items to cart, chooses payment method, and reserves stock for pickup.
4. **In-Store Pickup**: Visits the physical branch to claim reserved items.

---

## 3. System Rules & Constraints

To prevent scope creep and support efficient storefront operations, developers must adhere to these structural constraints:

- 💸 **Strict Payment Methods**: Operations are strictly restricted to **Cash** and **GCash**. Do not integrate Credit Cards, Maya, or other digital wallets without formal scrum review.
- 🚚 **No Delivery Architecture**: Operations focus purely on walk-in and in-store pickup. Do not build shipping modules, fleet tracking, customer address managers, or dispatch pipelines.
- 🔒 **Role-Based Security**: Staff and cashier users must be branch-locked; they must never query or mutate data belonging to other branches. Only Admins possess cross-branch query privileges.
- 📧 **Email Domain Rules**: `@bentahub.com` — admin, staff, and cashier accounts only. **Gmail only** — customer/regular user accounts.

---

## 4. Backend & Auth Implementation

Authentication is driven by client-side hooks (`useAuth` / `AuthProvider`) reading JWT tokens from `localStorage` and Bearer auth headers.

### 📊 Database Schema (Drizzle ORM)

#### Users Table (`src/servers/schemas/users.ts`)
```typescript
export const userRoleEnum = pgEnum("user_role", ["admin", "cashier", "staff", "customer"])

export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  role: userRoleEnum("role").default("customer").notNull(),
  branch: varchar("branch", { length: 50 }),
  isEmailVerified: boolean("is_email_verified").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})
```

#### Other Schemas (`src/servers/schemas/`)
| Schema | File | Description |
|---|---|---|
| **email_verifications** | `email-verification.ts` | Email OTP verification codes (hashed, 5-min expiry) |
| **password_reset** | `password-reset.ts` | Password reset tokens |
| **branches** | `branches.ts` | Store branch records |
| **branch_inventory** | `branch-inventory.ts` | Per-branch stock/inventory tracking |
| **products** | `products.ts` | Product catalog |
| **transactions** | `transactions.ts` | Sales transactions |
| **cart_items** | `cart-items.ts` | Temporary cart storage |
| **notifications** | `notifications.ts` | User notification records |
| **orders** | `orders.ts` | Customer order records |

### 🚦 Registration & Verification Flow
1. **Submit Signup**: User registers with name, email, and password (min 8 chars).
2. **Generate OTP**: System creates an unverified account, generates a 6-digit verification code with 5-minute expiration, and sends via email.
3. **Verify OTP**: User inputs the code. System validates and marks email as verified.
4. **Issue JWT**: On success, a JWT token is returned stored in `localStorage` (key: `bentahub_token`).

### 🚦 Login Flow
1. **Customer Login** (`/login`): Accepts Gmail accounts only. `@bentahub.com` emails are blocked with a hint to use the Admin Sign In page.
2. **Admin Login** (`/login?redirect=/admin`): Accepts admin/staff/cashier accounts (must use `@bentahub.com` domain).
3. **Role-Based Redirect**: After successful login — admin goes to `/admin`, staff to `/staff`, cashier to `/cashier`, customer to `/customer`.

---

## 5. Route Structure

```text
src/app/
├── (auth)/                        # Authentication pages
│   ├── login/page.tsx             # Login form (supports ?redirect=/admin param)
│   ├── register/page.tsx          # Customer registration
│   ├── verify-email/page.tsx      # Email OTP verification
│   └── forgot-password/page.tsx   # Password reset flow
├── (landing)/                     # Public landing page
│   └── page.tsx
├── admin/                         # Admin dashboard (role: "admin")
│   ├── page.tsx                   # Overview dashboard
│   ├── monitoring/page.tsx        # Live monitoring
│   ├── notifications/page.tsx     # System notifications
│   ├── sales/page.tsx             # Sales tracking
│   ├── users/page.tsx             # User management
│   ├── reservations/page.tsx      # Reservation management
│   ├── payments/page.tsx          # Payment management
│   ├── pickups/page.tsx           # Pickup management
│   └── settings/page.tsx          # Store settings
├── staff/                         # Staff dashboard (role: "staff")
│   ├── page.tsx                   # Dashboard with KPIs
│   └── inventory/page.tsx         # Inventory management
├── cashier/                       # Cashier POS (role: "cashier")
│   ├── page.tsx                   # POS checkout interface
│   └── transactions/page.tsx      # Transaction history
├── customer/                      # Customer portal (role: "customer")
│   ├── page.tsx                   # Dashboard
│   ├── catalog/page.tsx           # Product catalog
│   ├── cart/page.tsx              # Shopping cart
│   ├── reservations/page.tsx      # My reservations
│   └── orders/page.tsx            # Order history
└── api/                           # API routes
    └── auth/
        ├── login/route.ts
        ├── register/route.ts
        ├── logout/route.ts
        ├── verify/route.ts
        ├── verify-email/route.ts
        ├── forgot-password/route.ts
        ├── verify-reset-code/route.ts
        └── reset-password/route.ts
    └── admin/
        ├── settings/route.ts      # Store settings GET/PUT
        └── users/route.ts         # Admin user creation POST

```

---

## 6. Directory & FSD Guidelines

This repository strictly implements **Feature-Sliced Design (FSD)** guidelines to decouple features and shared utilities.

### 📂 Structural Directory Mapping
```text
src/
├── app/                              # 🌐 [App Layer] Next.js Router
│   ├── (auth)/                       # Login, Register, Verification, Forgot Password
│   ├── admin/                        # Admin portal dashboard pages
│   ├── staff/                        # Staff inventory & pickup pages
│   ├── cashier/                      # Cashier POS & transaction pages
│   ├── customer/                     # Customer catalog, cart, and checkout pages
│   ├── (landing)/                    # Public landing page
│   └── api/                          # Next.js API endpoints
├── features/                         # 🏗️ [Feature Layer] Isolated FSD business modules
│   ├── admin-dashboard/              # Admin analytics, sidebar, user management
│   ├── staff-dashboard/              # Staff inventory views, KPIs
│   ├── cashier-dashboard/            # Cashier POS terminal
│   ├── customer-dashboard/           # Catalog views, product cards, order history
│   ├── user-mgmt/                    # Registration, sign-in, and account components
│   ├── reservations/                 # Reserved stock manager
│   ├── analytics/                    # Sales analytics charts
│   ├── centralized-monitoring/       # Live monitoring dashboard
│   ├── qr-pos/                       # QR-based POS features
│   └── landing/                      # Landing page components
├── components/                       # ✅ [Shared Layer] UI Primitives & Providers
│   ├── ui/                           # Radix/Shadcn UI primitives
│   └── auth-provider.tsx             # Global auth context (useAuth hook)
├── hooks/                            # ✅ [Shared Layer] Global React Hooks
│   ├── useCart.ts                    # Cart state management
│   ├── useOrders.ts                  # Orders state management
│   ├── useProducts.ts                # Products state management
│   ├── useNotifications.ts           # Notifications state management
│   └── useAuth.ts                    # Re-exports useAuth from auth-provider
├── stores/                           # ✅ [Shared Layer] Global Zustand Stores
│   ├── cartStore.ts
│   ├── ordersStore.ts
│   ├── productsStore.ts
│   └── notificationsStore.ts
├── servers/                          # ✅ [Shared Layer] Server-side code
│   ├── db/index.ts                   # PostgreSQL connection & Drizzle client
│   └── schemas/                      # Drizzle ORM table schemas
├── lib/                              # ✅ [Shared Layer] Utilities
│   ├── auth-utils.ts                 # JWT, bcrypt hashing, code generation
│   ├── email-service.ts              # Nodemailer email transport
│   └── utils.ts                      # Shared utility functions (cn, etc.)
├── types/                            # ✅ [Shared Layer] TypeScript types
│   ├── admin.ts                      # Admin API & KPI types
│   ├── auth.ts                       # Auth response & payload types
│   └── cashier.ts                    # Cashier POS & product types
├── proxy.ts                          # 🌐 [App Layer] Dev proxy to redirect /api calls
└── scripts/                          # 🛠️ Database seed & utility CLI scripts
    ├── seed-admin-data.ts            # Seeds admin user, branches, products, inventory, transactions
    └── check-database.ts             # Database connection checker
```

### 🛑 Coding & Import Rules
- **Layer imports**: Feature folders may import from the Shared layer (`components/`, `hooks/`, `lib/`, `servers/`), but **never** from other features. Cross-feature imports are strictly forbidden.
- **Shared Code Promotion**: If `features/customer-dashboard` needs a helper from `features/user-mgmt`, that helper MUST be refactored and moved to the Shared layer (e.g. `src/hooks/`, `src/lib/`, or `src/components/`).
- **Server Actions**: Use Next.js Server Actions inside features (`src/features/[name]/actions/`) for mutations where possible, with API route fallbacks for admin operations.

---

## 7. Environment & Setup

### Prerequisites
- Node.js 22+
- pnpm 11+
- PostgreSQL (installed locally or cloud-hosted)

### Quick Start
```bash
# 1. Ensure PostgreSQL is running with a database named 'bentahub'

# 2. Install dependencies
pnpm install

# 3. Push database schemas
pnpm db:push

# 4. Seed admin data
pnpm db:seed

# 5. Start dev server
pnpm dev
```

### Default Admin Credentials (after seed)
| Field | Value |
|---|---|
| **Email** | `admin@bentahub.com` |
| **Password** | `admin123` |

### Key Scripts
| Command | Description |
|---|---|
| `pnpm dev` | Start Next.js dev server (Turbopack) |
| `pnpm build` | Production build |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm lint` | ESLint validation |
| `pnpm db:push` | Push Drizzle schemas to database |
| `pnpm db:seed` | Seed database with admin user & sample data |
| `pnpm validate` | Run lint + typecheck |

### Environment Variables (`.env.local`)
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bentahub
JWT_SECRET=your-super-secret-jwt-key-change-in-production
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

---

## 8. Implementation Status

| Feature | Status | Notes |
|---|---|---|
| Auth (login/register/verify) | ✅ Done | JWT-based, localStorage token |
| Admin Dashboard | ✅ Done | Overview, monitoring, sales, users, settings |
| Staff Dashboard | ✅ Done | Inventory management, pickup validation |
| Cashier POS | ✅ Done | Checkout, transaction management |
| Customer Portal | ✅ Done | Catalog, cart, reservations, orders |
| Admin User Management | ✅ Done | Create staff/cashier accounts via API |
| Admin Settings | ✅ Done | Store configuration (name, contact, notifications, security) |
| Role-Based Route Protection | ✅ Done | Layout-level guards for all roles |
| Email Verification | ✅ Done | OTP-based, Nodemailer transport |
| Forgot / Reset Password | ✅ Done | Email code + reset flow |
| Product Management | ✅ Done | Branch-specific inventory tracking |
| Sales Transactions | ✅ Done | Cross-branch admin view |
| Notifications | ✅ Done | Per-user notification system |
| QR POS | 🚧 In Progress | QR-based checkout enhancements |
| E2E Tests | ❌ Not Started | Playwright test suite |
| CI/CD Pipeline | ❌ Not Started | GitHub Actions |
