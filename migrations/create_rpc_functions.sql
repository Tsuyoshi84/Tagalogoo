-- RPC functions for vocabulary flashcard system

-- Function to get due cards count for a user and optional category
CREATE OR REPLACE FUNCTION get_due_cards_count(
  user_id UUID,
  category_id TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::INTEGER
  FROM words w
  LEFT JOIN reviews r ON r.word_id = w.id AND r.user_id = get_due_cards_count.user_id
  WHERE 
    (get_due_cards_count.category_id IS NULL OR w.category_id = get_due_cards_count.category_id)
    AND (r.next_due IS NULL OR r.next_due <= CURRENT_DATE);
$$;

-- Function to get due cards with all related data
CREATE OR REPLACE FUNCTION get_due_cards(
  user_id UUID,
  category_id TEXT DEFAULT NULL,
  card_limit INTEGER DEFAULT NULL
)
RETURNS TABLE (
  id TEXT,
  category_id TEXT,
  tl TEXT,
  en TEXT,
  created_at TIMESTAMPTZ,
  category JSONB,
  review JSONB
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    w.id,
    w.category_id,
    w.tl,
    w.en,
    w.created_at,
    to_jsonb(c.*) as category,
    CASE 
      WHEN r.user_id IS NOT NULL THEN to_jsonb(r.*)
      ELSE NULL
    END as review
  FROM words w
  INNER JOIN categories c ON c.id = w.category_id
  LEFT JOIN reviews r ON r.word_id = w.id AND r.user_id = get_due_cards.user_id
  WHERE 
    (get_due_cards.category_id IS NULL OR w.category_id = get_due_cards.category_id)
    AND (r.next_due IS NULL OR r.next_due <= CURRENT_DATE)
  ORDER BY 
    COALESCE(r.next_due, '1900-01-01'::DATE),
    w.created_at
  LIMIT get_due_cards.card_limit;
$$;

-- Function to get comprehensive user progress statistics
CREATE OR REPLACE FUNCTION get_user_progress_stats(user_id UUID)
RETURNS TABLE (
  total_cards INTEGER,
  studied_cards INTEGER,
  due_cards INTEGER,
  average_ease NUMERIC
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  WITH stats AS (
    SELECT 
      (SELECT COUNT(*)::INTEGER FROM words) as total_cards,
      (SELECT COUNT(*)::INTEGER FROM reviews WHERE reviews.user_id = get_user_progress_stats.user_id) as studied_cards,
      (SELECT COUNT(*)::INTEGER FROM reviews WHERE reviews.user_id = get_user_progress_stats.user_id AND next_due <= CURRENT_DATE) as due_cards,
      (SELECT COALESCE(AVG(ease), 2.5) FROM reviews WHERE reviews.user_id = get_user_progress_stats.user_id) as average_ease
  )
  SELECT * FROM stats;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_due_cards_count(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_due_cards(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_progress_stats(UUID) TO authenticated;