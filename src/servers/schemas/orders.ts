import { pgTable, varchar, numeric, timestamp, boolean, pgEnum, integer } from "drizzle-orm/pg-core"
import { users } from "./users"
import { relations } from "drizzle-orm"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"

export const orderStatusEnum = pgEnum("order_status", ["pending", "processing", "ready", "completed", "cancelled"])
export const paymentMethodEnum = pgEnum("payment_method", ["cash", "gcash"])

export const orders = pgTable("orders", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: orderStatusEnum("status").default("pending").notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  branch: varchar("branch", { length: 100 }).notNull(),
  notes: varchar("notes", { length: 500 }),
  isPaid: boolean("is_paid").default(false).notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  pickupDeadline: timestamp("pickup_deadline", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

export const orderItems = pgTable("order_items", {
  id: varchar("id", { length: 36 }).primaryKey(),
  orderId: varchar("order_id", { length: 36 })
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: varchar("product_id", { length: 36 }).notNull(),
  productName: varchar("product_name", { length: 255 }).notNull(),
  quantity: integer("quantity").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
}))

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
}))

export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true, updatedAt: true })
export const selectOrderSchema = createSelectSchema(orders)

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true, createdAt: true })
export const selectOrderItemSchema = createSelectSchema(orderItems)

export type Order = typeof orders.$inferSelect
export type InsertOrder = typeof orders.$inferInsert
export type OrderItem = typeof orderItems.$inferSelect
export type InsertOrderItem = typeof orderItems.$inferInsert
