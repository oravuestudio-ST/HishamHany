CREATE TABLE "ab_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"experiment" text NOT NULL,
	"variant" text NOT NULL,
	"visitor_id" text NOT NULL,
	"event" text NOT NULL,
	"path" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "ab_events_experiment_event_idx" ON "ab_events" USING btree ("experiment","event","variant");