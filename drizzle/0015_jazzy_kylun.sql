CREATE TABLE IF NOT EXISTS "cashier_cart_items" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"product_id" varchar(36) NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "cashier_cart_items_user_product_unique" ON "cashier_cart_items" ("user_id","product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cashier_cart_items_user_id_idx" ON "cashier_cart_items" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "branch_inventory_branch_product_unique" ON "branch_inventory" ("branch_id","product_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "cart_items_user_product_unique" ON "cart_items" ("user_id","product_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cashier_cart_items" ADD CONSTRAINT "cashier_cart_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cashier_cart_items" ADD CONSTRAINT "cashier_cart_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
