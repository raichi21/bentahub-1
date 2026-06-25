# BentaHub Runbook

This runbook covers instructions for deploying, updating, and troubleshooting BentaHub.

## 🚀 Deployment Procedures

BentaHub is containerized using Docker and Docker Compose.

### Production Build & Launch

To build and run the production environment locally or on a staging server:

1. **Verify Environment Variables**:
   Ensure `.env` contains production-ready secrets and database connection URLs.
2. **Build and Run Containers**:
   ```bash
   docker-compose up -d --build
   ```
   This builds the Next.js `app` container via the multi-stage `Dockerfile` and pulls the PostgreSQL database image.

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

- **Database Health**: The `db` container has an integrated healthcheck running:
  ```bash
  pg_isready -U postgres -d bentahub
  ```
- **Container Status**: Check status of active services:
  ```bash
  docker-compose ps
  ```

## 🛠️ Troubleshooting & Common Issues

### Issue: Database connection failures
- **Cause**: The application starts before the Postgres database is ready to accept connections.
- **Fix**: The `docker-compose.yml` uses a `condition: service_healthy` check on the database before booting the Next.js app. If running manually, ensure Postgres is running and accessible at the `DATABASE_URL` port.

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

## 🔄 Rollback Procedures

To roll back a deployment:
1. Revert the Git commit to the last stable hash:
   ```bash
   git revert <hash>
   ```
2. Rebuild and restart the Docker container:
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```
