DO $$ BEGIN
 CREATE TYPE "waste_reason" AS ENUM('damaged', 'expired', 'lost', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stock_waste_logs" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"product_id" varchar(36),
	"product_name" varchar(255) NOT NULL,
	"branch" varchar(100) NOT NULL,
	"quantity" integer NOT NULL,
	"unit" varchar(50) DEFAULT 'pcs' NOT NULL,
	"reason" "waste_reason" NOT NULL,
	"notes" varchar(500),
	"reported_by" varchar(36),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stock_waste_logs_product_id_idx" ON "stock_waste_logs" ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stock_waste_logs_created_at_idx" ON "stock_waste_logs" ("created_at");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_waste_logs" ADD CONSTRAINT "stock_waste_logs_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_waste_logs" ADD CONSTRAINT "stock_waste_logs_reported_by_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
