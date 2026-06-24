import { pgTable, timestamp, varchar, integer, index } from "drizzle-orm/pg-core"
import { users } from "./users"
import { relations } from "drizzle-orm"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"

export const emailVerifications = pgTable("email_verifications", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  code: varchar("code", { length: 255 }).notNull(), // Supports hashed verification codes (SHA-256 hex is 64 chars)
  email: varchar("email", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  attempts: integer("attempts").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}, (table) => ({
  userIdIdx: index("email_verif_user_id_idx").on(table.userId),
  emailIdx: index("email_verif_email_idx").on(table.email),
}))

// Export alias for backwards compatibility
export const emailVerificationCodes = emailVerifications

export const emailVerificationRelations = relations(emailVerifications, ({ one }) => ({
  user: one(users, {
    fields: [emailVerifications.userId],
    references: [users.id],
  }),
}))

export const insertEmailVerificationSchema = createInsertSchema(emailVerifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})
export const selectEmailVerificationSchema = createSelectSchema(emailVerifications)

export type EmailVerificationCode = typeof emailVerifications.$inferSelect
export type InsertEmailVerificationCode = typeof emailVerifications.$inferInsert
