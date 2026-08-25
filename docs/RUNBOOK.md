# BentaHub Runbook

This runbook covers instructions for deploying, updating, and troubleshooting BentaHub.

## 🚀 Deployment Procedures

BentaHub requires a running PostgreSQL instance. For production, use a managed database service (e.g., Supabase, Neon, Railway, or a cloud provider's managed PostgreSQL).

### Production Build & Launch

To build and run the production environment:

1. **Verify Environment Variables**:
   Ensure `.env` contains production-ready secrets and database connection URLs.
2. **Install dependencies**:
   ```bash
   pnpm install
   ```
3. **Push database schema**:
   ```bash
   pnpm run db:push
   ```
4. **Build the application**:
   ```bash
   pnpm run build
   ```
5. **Start the production server**:
   ```bash
   pnpm start
   ```

### Database Updates

When database schemas change:

1. Generate SQL migration files:
   ```bash
   pnpm run db:generate
   ```
2. Apply changes to the live database:
   ```bash
   pnpm run db:push
   ```
3. Run the database seed script to populate default data:
   ```bash
   pnpm run db:seed
   ```

## 📊 Health Checks & Monitoring

- **Database Health**: Verify PostgreSQL is running and accessible:
  ```bash
  pg_isready -U postgres -d bentahub
  ```

## 🛠️ Troubleshooting & Common Issues

### Issue: Database connection failures
- **Cause**: The application starts before the Postgres database is ready to accept connections.
- **Fix**: Ensure PostgreSQL is running and accessible at the `DATABASE_URL` configured in your `.env` file.

### Issue: Multiprocessing ProcessPoolExecutor crashes on Windows
- **Cause**: Windows lacks an automatic `fork` mechanism, which can crash process pool workers during scripts execution (like AST extraction).
- **Fix**: Force single-threaded execution using `parallel=False` or `max_workers=1` in the execution parameters.

### Issue: Cross-feature imports compiler errors
- **Cause**: A developer violated the FSD architecture by importing a module from `src/features/feature-a` into `src/features/feature-b`.
- **Fix**: Move the common component or helper to a global shared directory (`src/components/`, `src/hooks/`, or `src/utils/`).

## 🧪 Test Accounts

After running `pnpm db:seed`, the following accounts are available:

| Role     | Email                   | Password  |
|----------|-------------------------|-----------|
| admin    | admin@bentahub.com      | admin123  |
| admin    | superadmin@bentahub.com | super123  |
| staff    | staff1@bentahub.com     | staff123  |
| cashier  | cashier1@bentahub.com   | cash123   |
| customer | customer1@gmail.com     | cust123   |
| customer | customer2@gmail.com     | cust123   |

All accounts have verified email and are active. Employees are assigned to specific branches.

> ⚠️ **Local dev only.** Never run `pnpm db:seed` against production. The `@bentahub.com` domain is unowned, so these accounts cannot receive password-reset email — in production, provision the real admin with a personal email (Add User → Admin), verify login, then deactivate all seeded accounts.

## 🔐 Production Account Rules

| Role   | Email rule                        | Password reset                     |
|--------|-----------------------------------|------------------------------------|
| admin  | Any valid email (personal Gmail ok) | Self-service forgot password works |
| cashier| Must end in `@bentahub.com`       | Admin-only (Edit User modal)       |
| staff  | Must end in `@bentahub.com`       | Admin-only (Edit User modal)       |
| customer| Any email / Google / Facebook    | Self-service forgot password works |

Forgot-password requests for `@bentahub.com` addresses return the generic success message but never generate a token or send email (the domain is unowned; mail would bounce silently).

## 🔄 Rollback Procedures

To roll back a deployment:
1. Revert the Git commit to the last stable hash:
   ```bash
   git revert <hash>
   ```
2. Rebuild and restart the application:
   ```bash
   pnpm run build
   pnpm start
   ```
