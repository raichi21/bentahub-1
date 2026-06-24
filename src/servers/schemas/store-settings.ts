import { pgTable, timestamp, varchar, text } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"

export const storeSettings = pgTable("store_settings", {
  id: varchar("id", { length: 36 }).primaryKey(),
  storeName: varchar("store_name", { length: 255 }).notNull().default("BentaHub"),
  storeAddress: text("store_address").notNull().default(""),
  storeContact: varchar("store_contact", { length: 50 }).notNull().default(""),
  storeEmail: varchar("store_email", { length: 255 }).notNull().default(""),
  taxRate: varchar("tax_rate", { length: 10 }).notNull().default("0"),
  currency: varchar("currency", { length: 10 }).notNull().default("PHP"),
  businessHours: text("business_hours").notNull().default(""),
  lowStockThreshold: varchar("low_stock_threshold", { length: 10 }).notNull().default("10"),
  enableEmailAlerts: varchar("enable_email_alerts", { length: 5 }).notNull().default("true"),
  enableLowStockAlerts: varchar("enable_low_stock_alerts", { length: 5 }).notNull().default("true"),
  enableOrderNotifications: varchar("enable_order_notifications", { length: 5 }).notNull().default("true"),
  minPasswordLength: varchar("min_password_length", { length: 3 }).notNull().default("8"),
  sessionTimeout: varchar("session_timeout", { length: 10 }).notNull().default("60"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

export const insertStoreSettingSchema = createInsertSchema(storeSettings).omit({ id: true, createdAt: true, updatedAt: true })
export const selectStoreSettingSchema = createSelectSchema(storeSettings)

export type StoreSetting = typeof storeSettings.$inferSelect
export type InsertStoreSetting = typeof storeSettings.$inferInsert
