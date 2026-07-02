import { pgTable, timestamp, varchar, integer, numeric, pgEnum } from "drizzle-orm/pg-core"
import { branches } from "./branches"
import { relations } from "drizzle-orm"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { paymentMethodEnum } from "./orders"

export const transactionStatusEnum = pgEnum("transaction_status", ["completed", "pending", "cancelled"])

export const transactions = pgTable("transactions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  branchId: varchar("branch_id", { length: 36 })
    .notNull()
    .references(() => branches.id, { onDelete: "cascade" }),
  receiptNumber: integer("receipt_number"),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  status: transactionStatusEnum("status").default("completed").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

export const transactionRelations = relations(transactions, ({ one }) => ({
  branch: one(branches, {
    fields: [transactions.branchId],
    references: [branches.id],
  }),
}))

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
})
export const selectTransactionSchema = createSelectSchema(transactions)

export type Transaction = typeof transactions.$inferSelect
export type InsertTransaction = typeof transactions.$inferInsert
