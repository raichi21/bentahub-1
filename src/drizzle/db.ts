import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error(
    "FATAL: DATABASE_URL environment variable is not set.\n" +
    "Please set DATABASE_URL in your .env.local file.\n" +
    "Example: DATABASE_URL=\"postgresql://postgres:postgres@localhost:5432/bentahub\""
  )
}

const client = postgres(connectionString, {
  max: 10,
  connect_timeout: 5,
})

export const db = drizzle(client, { schema })

export type Database = typeof db
