import { pgTable, timestamp, varchar, boolean, pgEnum, index } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"

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
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}, (table) => ({
  emailIdx: index("users_email_idx").on(table.email),
}))

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true })
export const selectUserSchema = createSelectSchema(users)

export type User = typeof users.$inferSelect
export type InsertUser = typeof users.$inferInsert
