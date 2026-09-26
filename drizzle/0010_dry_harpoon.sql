CREATE TABLE IF NOT EXISTS "activity_logs" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"actor_id" varchar(36),
	"actor_name" varchar(255),
	"actor_role" varchar(50),
	"action" varchar(100) NOT NULL,
	"entity" varchar(100) NOT NULL,
	"entity_id" varchar(36),
	"entity_name" varchar(255),
	"details" jsonb,
	"branch" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activity_logs_actor_id_idx" ON "activity_logs" ("actor_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activity_logs_created_at_idx" ON "activity_logs" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activity_logs_action_idx" ON "activity_logs" ("action");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
