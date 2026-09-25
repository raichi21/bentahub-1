CREATE INDEX IF NOT EXISTS "orders_user_id_idx" ON "orders" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_created_at_idx" ON "orders" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transactions_branch_id_idx" ON "transactions" ("branch_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transactions_created_at_idx" ON "transactions" ("created_at");