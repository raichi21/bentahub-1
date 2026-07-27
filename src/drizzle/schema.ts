import {
  pgTable,
  pgEnum,
  varchar,
  text,
  numeric,
  integer,
  timestamp,
  boolean,
  index,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"

// ─────────────────────────── ENUMS ───────────────────────────

export const userRoleEnum = pgEnum("user_role", ["admin", "cashier", "staff", "customer"])
export const orderStatusEnum = pgEnum("order_status", ["pending", "processing", "ready", "completed", "cancelled"])
export const paymentMethodEnum = pgEnum("payment_method", ["cash", "gcash"])
export const productStockStatusEnum = pgEnum("product_stock_status", ["in-stock", "low-stock", "out-of-stock"])
export const transactionStatusEnum = pgEnum("transaction_status", ["completed", "pending", "cancelled"])
export const notificationTypeEnum = pgEnum("notification_type", [
  "order-status", "order-ready", "order-completed", "payment-received",
  "low-stock", "new-product", "promotion", "system",
])

// ─────────────────────── SHARED TIMESTAMPS ────────────────────

const createdAt = timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
const updatedAt = timestamp("updated_at", { withTimezone: true })
  .defaultNow()
  .notNull()
  .$onUpdate(() => new Date())

// ─────────────────────────── TABLES ───────────────────────────

// ── Users ──
export const users = pgTable(
  "users",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: varchar("password", { length: 255 }).notNull(),
    fullName: varchar("full_name", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    role: userRoleEnum("role").default("customer").notNull(),
    branch: varchar("branch", { length: 50 }),
    isEmailVerified: boolean("is_email_verified").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt,
    updatedAt,
  },
  (table) => ({
    emailIdx: index("users_email_idx").on(table.email),
  })
)

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true })
export const selectUserSchema = createSelectSchema(users)
export type User = typeof users.$inferSelect
export type InsertUser = typeof users.$inferInsert

// ── Email Verifications ──
export const emailVerifications = pgTable(
  "email_verifications",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    attempts: integer("attempts").default(0).notNull(),
    createdAt,
    updatedAt,
  },
  (table) => ({
    userIdIdx: index("email_verif_user_id_idx").on(table.userId),
    emailIdx: index("email_verif_email_idx").on(table.email),
  })
)

export const emailVerificationCodes = emailVerifications // alias

export const emailVerificationRelations = relations(emailVerifications, ({ one }) => ({
  user: one(users, {
    fields: [emailVerifications.userId],
    references: [users.id],
  }),
}))

export const insertEmailVerificationSchema = createInsertSchema(emailVerifications).omit({ id: true, createdAt: true, updatedAt: true })
export const selectEmailVerificationSchema = createSelectSchema(emailVerifications)
export type EmailVerificationCode = typeof emailVerifications.$inferSelect
export type InsertEmailVerificationCode = typeof emailVerifications.$inferInsert

// ── Password Reset Tokens ──
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  email: varchar("email", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  attempts: integer("attempts").default(0).notNull(),
  createdAt,
})

export const passwordResetRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id],
  }),
}))

export const insertPasswordResetSchema = createInsertSchema(passwordResetTokens).omit({ id: true, createdAt: true, usedAt: true, attempts: true })
export const selectPasswordResetSchema = createSelectSchema(passwordResetTokens)
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert

// ── Branches ──
export const branches = pgTable("branches", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  location: varchar("location", { length: 255 }),
  capacity: integer("capacity").default(500).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt,
  updatedAt,
})

export const insertBranchSchema = createInsertSchema(branches).omit({ id: true, createdAt: true, updatedAt: true })
export const selectBranchSchema = createSelectSchema(branches)
export type Branch = typeof branches.$inferSelect
export type InsertBranch = typeof branches.$inferInsert

// ── Products ──
export const products = pgTable("products", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  bulkPrice: numeric("bulk_price", { precision: 10, scale: 2 }),
  weight: varchar("weight", { length: 50 }),
  image: text("image"),
  stockStatus: productStockStatusEnum("stock_status").default("in-stock").notNull(),
  quantity: integer("quantity").default(0).notNull(),
  branch: varchar("branch", { length: 100 }).notNull(),
  sku: varchar("sku", { length: 100 }).unique(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt,
  updatedAt,
})

export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true, updatedAt: true })
export const selectProductSchema = createSelectSchema(products)
export type Product = typeof products.$inferSelect
export type InsertProduct = typeof products.$inferInsert

// ── Branch Inventory ──
export const branchInventory = pgTable("branch_inventory", {
  id: varchar("id", { length: 36 }).primaryKey(),
  branchId: varchar("branch_id", { length: 36 })
    .notNull()
    .references(() => branches.id, { onDelete: "cascade" }),
  productId: varchar("product_id", { length: 36 })
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  quantity: integer("quantity").default(0).notNull(),
  lowStockThreshold: integer("low_stock_threshold").default(10).notNull(),
  updatedAt,
})

export const branchInventoryRelations = relations(branchInventory, ({ one }) => ({
  branch: one(branches, {
    fields: [branchInventory.branchId],
    references: [branches.id],
  }),
  product: one(products, {
    fields: [branchInventory.productId],
    references: [products.id],
  }),
}))

export const insertBranchInventorySchema = createInsertSchema(branchInventory).omit({ id: true, updatedAt: true })
export const selectBranchInventorySchema = createSelectSchema(branchInventory)
export type BranchInventory = typeof branchInventory.$inferSelect
export type InsertBranchInventory = typeof branchInventory.$inferInsert

// ── Orders ──
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
  gcashRef: varchar("gcash_ref", { length: 255 }),
  createdAt,
  updatedAt,
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
  createdAt,
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

// ── Cart Items ──
export const cartItems = pgTable("cart_items", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  productId: varchar("product_id", { length: 36 }).notNull(),
  productName: varchar("product_name", { length: 255 }).notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull().default(1),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  image: varchar("image", { length: 500 }),
  category: varchar("category", { length: 100 }),
  branch: varchar("branch", { length: 100 }).notNull(),
  addedAt: timestamp("added_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt,
})

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(users, {
    fields: [cartItems.userId],
    references: [users.id],
  }),
}))

export const insertCartItemSchema = createInsertSchema(cartItems).omit({ id: true, addedAt: true, updatedAt: true })
export const selectCartItemSchema = createSelectSchema(cartItems)
export type CartItem = typeof cartItems.$inferSelect
export type InsertCartItem = typeof cartItems.$inferInsert

// ── Transactions ──
export const transactions = pgTable("transactions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  branchId: varchar("branch_id", { length: 36 })
    .notNull()
    .references(() => branches.id, { onDelete: "cascade" }),
  receiptNumber: integer("receipt_number"),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  status: transactionStatusEnum("status").default("completed").notNull(),
  gcashRef: varchar("gcash_ref", { length: 255 }),
  createdAt,
})

export const transactionItems = pgTable("transaction_items", {
  id: varchar("id", { length: 36 }).primaryKey(),
  transactionId: varchar("transaction_id", { length: 36 })
    .notNull()
    .references(() => transactions.id, { onDelete: "cascade" }),
  productId: varchar("product_id", { length: 36 }).notNull(),
  productName: varchar("product_name", { length: 255 }).notNull(),
  quantity: integer("quantity").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  createdAt,
})

export const transactionRelations = relations(transactions, ({ one, many }) => ({
  branch: one(branches, {
    fields: [transactions.branchId],
    references: [branches.id],
  }),
  items: many(transactionItems),
}))

export const transactionItemsRelations = relations(transactionItems, ({ one }) => ({
  transaction: one(transactions, {
    fields: [transactionItems.transactionId],
    references: [transactions.id],
  }),
}))

export const insertTransactionItemSchema = createInsertSchema(transactionItems).omit({ id: true, createdAt: true })
export const selectTransactionItemSchema = createSelectSchema(transactionItems)
export type TransactionItem = typeof transactionItems.$inferSelect
export type InsertTransactionItem = typeof transactionItems.$inferInsert

export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, createdAt: true })
export const selectTransactionSchema = createSelectSchema(transactions)
export type Transaction = typeof transactions.$inferSelect
export type InsertTransaction = typeof transactions.$inferInsert

// ── Notifications ──
export const notifications = pgTable("notifications", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  relatedOrderId: varchar("related_order_id", { length: 36 }),
  relatedProductId: varchar("related_product_id", { length: 36 }),
  isRead: boolean("is_read").default(false).notNull(),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt,
  expiresAt: timestamp("expires_at", { withTimezone: true }),
})

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}))

export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true })
export const selectNotificationSchema = createSelectSchema(notifications)
export type Notification = typeof notifications.$inferSelect
export type InsertNotification = typeof notifications.$inferInsert

// ── Notification Preferences ──
export const notificationPreferences = pgTable("notification_preferences", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  orderUpdates: boolean("order_updates").default(true).notNull(),
  createdAt,
  updatedAt,
})

export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(users, {
    fields: [notificationPreferences.userId],
    references: [users.id],
  }),
}))

export const insertNotificationPreferencesSchema = createInsertSchema(notificationPreferences).omit({ id: true, createdAt: true, updatedAt: true })
export const selectNotificationPreferencesSchema = createSelectSchema(notificationPreferences)
export type NotificationPreferences = typeof notificationPreferences.$inferSelect
export type InsertNotificationPreferences = typeof notificationPreferences.$inferInsert

// ── Inventory Batches ──
export const inventoryBatches = pgTable("inventory_batches", {
  id: varchar("id", { length: 36 }).primaryKey(),
  branchInventoryId: varchar("branch_inventory_id", { length: 36 })
    .notNull()
    .references(() => branchInventory.id, { onDelete: "cascade" }),
  batchNumber: varchar("batch_number", { length: 100 }),
  quantity: integer("quantity").default(0).notNull(),
  originalQuantity: integer("original_quantity").default(0).notNull(),
  expiryDate: timestamp("expiry_date", { withTimezone: true }),
  receivedDate: timestamp("received_date", { withTimezone: true }).defaultNow().notNull(),
  supplier: varchar("supplier", { length: 255 }),
  createdAt,
  updatedAt,
})

export const inventoryBatchesRelations = relations(inventoryBatches, ({ one }) => ({
  branchInventory: one(branchInventory, {
    fields: [inventoryBatches.branchInventoryId],
    references: [branchInventory.id],
  }),
}))

export const insertInventoryBatchSchema = createInsertSchema(inventoryBatches).omit({ id: true, createdAt: true, updatedAt: true })
export const selectInventoryBatchSchema = createSelectSchema(inventoryBatches)
export type InventoryBatch = typeof inventoryBatches.$inferSelect
export type InsertInventoryBatch = typeof inventoryBatches.$inferInsert
