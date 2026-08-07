# Next.js template

This is a Next.js template with shadcn/ui.

## Adding components

To add components to your app, run the following command:

```bash
npx shadcn@latest add button
```

This will place the ui components in the `components` directory.

## Using components

To use the components in your app, import them as follows:

```tsx
import { Button } from "@/components/ui/button";
```

## 🚀 Local Development Setup

To run the application locally, you need a running PostgreSQL database.

### Prerequisites
1. Ensure you have [PostgreSQL](https://www.postgresql.org/) installed and running on your machine.
2. Make sure you have created `.env.local` based on `.env.example` and configured the database connection credentials.

### Getting Started

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Push the schema to the database:
   ```bash
   pnpm db:push
   ```

3. Run the development server:
   ```bash
   pnpm dev
   ```

Once started, the application will be available at [http://localhost:3000](http://localhost:3000).

### Seeding the Database
To seed the database with initial administrative and branch data:

```bash
pnpm db:seed
```

> [!WARNING]
> Running the seed script will clear all existing tables (branches, products, inventory, transactions) before insert! Only run this on a fresh database.
