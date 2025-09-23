CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "examples" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"word_id" uuid NOT NULL,
	"tl" text NOT NULL,
	"en" text NOT NULL,
	"audio_url" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"user_id" uuid NOT NULL,
	"word_id" uuid NOT NULL,
	"ease" real DEFAULT 2.5,
	"interval_days" integer DEFAULT 0,
	"reps" integer DEFAULT 0,
	"lapses" integer DEFAULT 0,
	"next_due" date DEFAULT now(),
	"last_reviewed" date,
	CONSTRAINT "reviews_user_id_word_id_pk" PRIMARY KEY("user_id","word_id")
);
--> statement-breakpoint
CREATE TABLE "words" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"tl" text NOT NULL,
	"en" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "examples" ADD CONSTRAINT "examples_word_id_words_id_fk" FOREIGN KEY ("word_id") REFERENCES "public"."words"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_word_id_words_id_fk" FOREIGN KEY ("word_id") REFERENCES "public"."words"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "words" ADD CONSTRAINT "words_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "examples_word_idx" ON "examples" USING btree ("word_id");--> statement-breakpoint
CREATE INDEX "reviews_user_due_idx" ON "reviews" USING btree ("user_id","next_due");--> statement-breakpoint
CREATE INDEX "words_category_idx" ON "words" USING btree ("category_id");