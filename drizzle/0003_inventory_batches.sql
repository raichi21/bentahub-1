CREATE TABLE IF NOT EXISTS "inventory_batches" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"branch_inventory_id" varchar(36) NOT NULL REFERENCES "branch_inventory"("id") ON DELETE CASCADE,
	"batch_number" varchar(100),
	"quantity" integer DEFAULT 0 NOT NULL,
	"original_quantity" integer DEFAULT 0 NOT NULL,
	"expiry_date" timestamp with time zone,
	"received_date" timestamp with time zone DEFAULT now() NOT NULL,
	"supplier" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
