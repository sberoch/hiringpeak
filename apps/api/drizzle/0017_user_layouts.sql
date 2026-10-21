CREATE TABLE "user_layouts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"layout_key" text NOT NULL,
	"value" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_layouts_user_id_layout_key_unique" UNIQUE("user_id","layout_key")
);
--> statement-breakpoint
ALTER TABLE "user_layouts" ADD CONSTRAINT "user_layouts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;