import type { Config } from "drizzle-kit"

export default {
  schema: "./src/servers/schemas",
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/bentahub",
  },
  verbose: true,
  strict: false,
} satisfies Config
