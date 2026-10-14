CREATE TABLE "generation_call" (
	"id" serial PRIMARY KEY NOT NULL,
	"usage_id" integer NOT NULL,
	"seq" integer NOT NULL,
	"stage" text NOT NULL,
	"attempt" integer NOT NULL,
	"model" text NOT NULL,
	"input_tokens" integer NOT NULL,
	"output_tokens" integer NOT NULL,
	"cache_read_tokens" integer NOT NULL,
	"cache_write_tokens" integer NOT NULL,
	"web_searches" integer NOT NULL,
	"estimated_usd" numeric(10, 4) NOT NULL,
	"duration_ms" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "generation_usage" ADD COLUMN "cache_read_tokens" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "generation_usage" ADD COLUMN "cache_write_tokens" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "generation_usage" ADD COLUMN "web_searches" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "generation_usage" ADD COLUMN "lesson_id" text;--> statement-breakpoint
ALTER TABLE "generation_usage" ADD COLUMN "lesson_title" text;--> statement-breakpoint
ALTER TABLE "generation_usage" ADD COLUMN "topic" text;--> statement-breakpoint
ALTER TABLE "generation_usage" ADD COLUMN "age_group" text;--> statement-breakpoint
ALTER TABLE "generation_usage" ADD COLUMN "language" text;--> statement-breakpoint
ALTER TABLE "generation_usage" ADD COLUMN "quality" text;--> statement-breakpoint
ALTER TABLE "generation_usage" ADD COLUMN "evidence" text;--> statement-breakpoint
ALTER TABLE "generation_usage" ADD COLUMN "duration_ms" integer;--> statement-breakpoint
ALTER TABLE "generation_call" ADD CONSTRAINT "generation_call_usage_id_generation_usage_id_fk" FOREIGN KEY ("usage_id") REFERENCES "public"."generation_usage"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "generation_call_usage_idx" ON "generation_call" USING btree ("usage_id","seq");--> statement-breakpoint
CREATE INDEX "generation_usage_created_idx" ON "generation_usage" USING btree ("created_at");