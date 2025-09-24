-- Enable Row Level Security on all tables
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "words" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "examples" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "reviews" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

-- Categories: Read-only for all authenticated users
CREATE POLICY "Authenticated users can view categories" ON "categories"
  FOR SELECT TO authenticated USING (true);--> statement-breakpoint

-- Words: Read-only for all authenticated users
CREATE POLICY "Authenticated users can view words" ON "words"
  FOR SELECT TO authenticated USING (true);--> statement-breakpoint

-- Examples: Read-only for all authenticated users
CREATE POLICY "Authenticated users can view examples" ON "examples"
  FOR SELECT TO authenticated USING (true);--> statement-breakpoint

-- Reviews: Users can only access their own reviews
CREATE POLICY "Users can view own reviews" ON "reviews"
  FOR SELECT USING (auth.uid() = user_id);--> statement-breakpoint

CREATE POLICY "Users can insert own reviews" ON "reviews"
  FOR INSERT WITH CHECK (auth.uid() = user_id);--> statement-breakpoint

CREATE POLICY "Users can update own reviews" ON "reviews"
  FOR UPDATE USING (auth.uid() = user_id);--> statement-breakpoint

CREATE POLICY "Users can delete own reviews" ON "reviews"
  FOR DELETE USING (auth.uid() = user_id);--> statement-breakpoint