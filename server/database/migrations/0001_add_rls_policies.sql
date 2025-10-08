-- Enable Row Level Security on user-specific tables
ALTER TABLE "reviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "daily_stats" ENABLE ROW LEVEL SECURITY;

-- Categories table: Read-only for all authenticated users
CREATE POLICY "Authenticated users can view categories" ON "categories"
  FOR SELECT TO authenticated USING (true);

-- Words table: Read-only for all authenticated users  
CREATE POLICY "Authenticated users can view words" ON "words"
  FOR SELECT TO authenticated USING (true);

-- Examples table: Read-only for all authenticated users
CREATE POLICY "Authenticated users can view examples" ON "examples"
  FOR SELECT TO authenticated USING (true);

-- Reviews table: Users can only access their own reviews
CREATE POLICY "Users can view own reviews" ON "reviews"
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reviews" ON "reviews"
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" ON "reviews"
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews" ON "reviews"
  FOR DELETE USING (auth.uid() = user_id);

-- Daily stats table: Users can only access their own statistics
CREATE POLICY "Users can view own daily stats" ON "daily_stats"
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily stats" ON "daily_stats"
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily stats" ON "daily_stats"
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily stats" ON "daily_stats"
  FOR DELETE USING (auth.uid() = user_id);