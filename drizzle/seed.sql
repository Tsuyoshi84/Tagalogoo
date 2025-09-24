-- Sample vocabulary data for testing
-- This file can be run after the main migrations to populate test data

-- Insert sample categories
INSERT INTO categories (name, description, sort_order) VALUES
  ('Greetings', 'Basic greetings and polite expressions', 1),
  ('Food & Dining', 'Food items, cooking, and dining vocabulary', 2),
  ('Family', 'Family members and relationships', 3),
  ('Numbers', 'Numbers and counting', 4),
  ('Colors', 'Basic colors and descriptions', 5);

-- Insert sample words for Greetings category
WITH greeting_category AS (
  SELECT id FROM categories WHERE name = 'Greetings' LIMIT 1
)
INSERT INTO words (category_id, tl, en) 
SELECT 
  greeting_category.id,
  word_data.tl,
  word_data.en
FROM greeting_category,
(VALUES 
  ('Kumusta', 'How are you?'),
  ('Salamat', 'Thank you'),
  ('Walang anuman', 'You''re welcome'),
  ('Paalam', 'Goodbye'),
  ('Magandang umaga', 'Good morning')
) AS word_data(tl, en);

-- Insert sample examples for the greeting words
WITH word_ids AS (
  SELECT w.id, w.tl, w.en 
  FROM words w 
  JOIN categories c ON w.category_id = c.id 
  WHERE c.name = 'Greetings'
)
INSERT INTO examples (word_id, tl, en)
SELECT 
  word_ids.id,
  example_data.tl_example,
  example_data.en_example
FROM word_ids,
LATERAL (VALUES 
  (CASE WHEN word_ids.tl = 'Kumusta' THEN 'Kumusta ka?' ELSE NULL END,
   CASE WHEN word_ids.tl = 'Kumusta' THEN 'How are you?' ELSE NULL END),
  (CASE WHEN word_ids.tl = 'Salamat' THEN 'Salamat sa tulong mo.' ELSE NULL END,
   CASE WHEN word_ids.tl = 'Salamat' THEN 'Thank you for your help.' ELSE NULL END),
  (CASE WHEN word_ids.tl = 'Walang anuman' THEN 'Walang anuman, kaibigan.' ELSE NULL END,
   CASE WHEN word_ids.tl = 'Walang anuman' THEN 'You''re welcome, friend.' ELSE NULL END),
  (CASE WHEN word_ids.tl = 'Paalam' THEN 'Paalam na ako.' ELSE NULL END,
   CASE WHEN word_ids.tl = 'Paalam' THEN 'I''m saying goodbye now.' ELSE NULL END),
  (CASE WHEN word_ids.tl = 'Magandang umaga' THEN 'Magandang umaga sa lahat!' ELSE NULL END,
   CASE WHEN word_ids.tl = 'Magandang umaga' THEN 'Good morning everyone!' ELSE NULL END)
) AS example_data(tl_example, en_example)
WHERE example_data.tl_example IS NOT NULL;