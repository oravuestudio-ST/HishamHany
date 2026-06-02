CREATE TABLE "page_views" (
	"id" serial PRIMARY KEY NOT NULL,
	"path" text NOT NULL,
	"referrer" text,
	"country" text,
	"visited_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"year" text NOT NULL,
	"client" text NOT NULL,
	"image" text NOT NULL,
	"aspect" text NOT NULL,
	"colorized" boolean DEFAULT false NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "projects_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "testimonials" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_name" text NOT NULL,
	"company" text NOT NULL,
	"role" text NOT NULL,
	"body" text NOT NULL,
	"rating" integer DEFAULT 5 NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "page_views_path_idx" ON "page_views" USING btree ("path");--> statement-breakpoint
CREATE INDEX "page_views_visited_at_idx" ON "page_views" USING btree ("visited_at");--> statement-breakpoint
CREATE INDEX "projects_visible_order_idx" ON "projects" USING btree ("visible","order");