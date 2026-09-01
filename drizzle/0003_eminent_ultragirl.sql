CREATE TABLE IF NOT EXISTS "cash_drawer_sessions" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"branch_id" varchar(36) NOT NULL,
	"cashier_id" varchar(36),
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone,
	"closed_by" varchar(36),
	"starting_cash" numeric(10, 2) DEFAULT '0' NOT NULL,
	"expected_ending_cash" numeric(10, 2),
	"actual_ending_cash" numeric(10, 2),
	"notes" text,
	"status" text DEFAULT 'open' NOT NULL,
	"verified_by_admin_id" varchar(36),
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "amount_paid" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "change" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "session_id" varchar(36);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cash_drawer_cashier" ON "cash_drawer_sessions" ("cashier_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cash_drawer_branch" ON "cash_drawer_sessions" ("branch_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transactions" ADD CONSTRAINT "transactions_session_id_cash_drawer_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "cash_drawer_sessions"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cash_drawer_sessions" ADD CONSTRAINT "cash_drawer_sessions_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cash_drawer_sessions" ADD CONSTRAINT "cash_drawer_sessions_cashier_id_users_id_fk" FOREIGN KEY ("cashier_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cash_drawer_sessions" ADD CONSTRAINT "cash_drawer_sessions_closed_by_users_id_fk" FOREIGN KEY ("closed_by") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cash_drawer_sessions" ADD CONSTRAINT "cash_drawer_sessions_verified_by_admin_id_users_id_fk" FOREIGN KEY ("verified_by_admin_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "one_open_session_per_cashier_branch" ON "cash_drawer_sessions" ("cashier_id", "branch_id") WHERE "status" = 'open';
