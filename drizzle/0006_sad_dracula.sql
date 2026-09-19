CREATE TABLE IF NOT EXISTS "mfa_codes" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"code" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mfa_codes_user_id_idx" ON "mfa_codes" ("user_id");--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "mfa_secret";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "mfa_backup_codes";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mfa_codes" ADD CONSTRAINT "mfa_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
