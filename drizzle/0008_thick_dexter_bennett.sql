CREATE TABLE IF NOT EXISTS "store_settings" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"store_name" varchar(255) DEFAULT 'BentaHub' NOT NULL,
	"logo" text,
	"store_address" varchar(255),
	"store_contact" varchar(50),
	"store_email" varchar(255),
	"timezone" varchar(100) DEFAULT 'Asia/Manila' NOT NULL,
	"default_language" varchar(20) DEFAULT 'en' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
