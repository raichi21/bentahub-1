# BentaHub Contributing Guide

Welcome to the BentaHub contributing guide. Follow these instructions to set up your development environment and write code that conforms to our standards.

## 🛠️ Local Setup

1. **Prerequisites**: Ensure you have Node.js 20+ and `pnpm` (or `npm`) installed.
2. **Database**: A PostgreSQL instance is required. You can start one locally using Docker:
   ```bash
   docker-compose up -d db
   ```
3. **Environment**: Copy `.env.example` to `.env` and configure your database connection string and secrets:
   ```bash
   cp .env.example .env
   ```
4. **Dependencies**: Install package dependencies:
   ```bash
   pnpm install
   ```
5. **Database Schema**: Push the Drizzle schema directly to the database:
   ```bash
   pnpm run db:push
   ```
6. **Seed Data**: Populate the database with initial admin accounts, branches, and mock products:
   ```bash
   pnpm run db:seed
   ```
7. **Run Development Server**: Start the Next.js development server:
   ```bash
   pnpm run dev
   ```

## 🏗️ Feature-Sliced Design (FSD) Guidelines

All code contributions MUST strictly adhere to the Feature-Sliced Design (FSD) architecture.

### Core Folder Structure

The code is divided into global shared folders and isolated features:
- `src/app/`: Next.js App Router (Pages, Layouts, API Routes)
- `src/components/`: **Global shared components** (primitives, layout wrappers, theme UI)
- `src/features/`: **Isolated business modules**. Each folder under `features/` is self-contained.
- `src/servers/`: **Global shared server operations** (db operations, database schemas)
- `src/lib/`, `src/utils/`, `src/hooks/`, `src/types/`, `src/config/`, `src/contexts/`, `src/data/`, `src/stores/`: Global shared utilities, contexts, configuration, and state stores.

### The Isolation Principle

| Location | Shareable? | Purpose |
|---|---|---|
| `src/components/`, `src/hooks/`, `src/lib/`, `src/utils/`, `src/types/` | ✅ **YES** | Shared globally |
| `src/features/[name]/` | ❌ **NO** | Feature-specific, isolated |

- **Features CANNOT import from other features**. Cross-feature imports are strictly forbidden.
- If you need to share code between features, refactor that code into the global shared folders (`src/components/`, `src/hooks/`, `src/utils/`, etc.).
- Avoid importing features directly in core layouts; components in `app/` should consume the clean boundaries exposed by the features.

For more details, see [FEATURE-SLICED-DESIGN.md](file:///c:/projects/bentahub/docs/FEATURE-SLICED-DESIGN.md).

## 💻 Available Development Commands

<!-- AUTO-GENERATED START -->
| Command | Command Line | Description |
|---|---|---|
| `dev` | `next dev --turbopack` | Start the development server with Turbopack enabled |
| `build` | `next build` | Build the Next.js application for production |
| `start` | `next start` | Start the production Next.js server |
| `lint` | `eslint` | Run ESLint flat config to check for code style issues |
| `format` | `prettier --write "**/*.{ts,tsx}"` | Format code files with Prettier |
| `typecheck` | `tsc --noEmit` | Run TypeScript compiler to verify types |
| `validate` | `npm run lint && npm run typecheck` | Run both linting and type checking validation |
| `db:generate` | `drizzle-kit generate` | Generate Drizzle database migration schema files |
| `db:push` | `drizzle-kit push` | Push schema changes directly to the PostgreSQL database |
| `db:studio` | `drizzle-kit studio` | Start Drizzle Studio database UI client |
| `db:seed` | `npx tsx src/drizzle/seed.ts` | Seed the database with initial test accounts, branches, and 12 months of transactions |
| `docker:up` | `docker compose up -d` | Start the database and services container in the background |
| `docker:down` | `docker compose down` | Stop and remove the Docker containers |
| `docker:logs` | `docker compose logs -f` | Follow log output from Docker containers |
| `docker:reset` | `docker compose down -v` | Stop the Docker containers and delete volumes (factory reset database) |

<!-- AUTO-GENERATED END -->

## 🚦 Verification & Code Style

We enforce code quality gates before commits and pull requests:

- **Linting**: We use ESLint to catch syntax and style issues:
  ```bash
  pnpm run lint
  ```
- **Type Checking**: Verify TypeScript types compile cleanly:
  ```bash
  pnpm run typecheck
  ```
- **Validation Suite**: Runs both linting and typecheck:
  ```bash
  pnpm run validate
  ```
- **Formatting**: Format code using Prettier:
  ```bash
  pnpm run format
  ```

## 📝 Pull Request Checklist

Before submitting a Pull Request, ensure that:
1. All changes are typechecked (`pnpm run typecheck`) and linted (`pnpm run lint`).
2. Feature-Sliced Design structure has been strictly followed, with NO cross-feature imports.
3. Database migrations (if any) are generated and pushed correctly.
4. The local dev server builds successfully (`pnpm run build`).
