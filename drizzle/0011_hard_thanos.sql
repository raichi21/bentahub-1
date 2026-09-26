ALTER TABLE "orders" ADD COLUMN "processed_by" varchar(36);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "processed_at" timestamp with time zone;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
