# Database Migrations

This directory contains the database migrations for the vocabulary flashcards feature.

## Migration Files

- `0000_cold_gwen_stacy.sql` - Initial schema with tables, indexes, and foreign keys
- `0001_vocabulary_rls_policies.sql` - Row Level Security policies for data access control

## Applying Migrations

### 1. Configure Database Connection

Make sure your `.env` file has the correct `DATABASE_URL` with port 6543 for connection pooling:

```bash
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:6543/postgres"
```

### 2. Apply Schema Migration

```bash
pnpm db:migrate
```

This will apply the main schema migration (tables, indexes, foreign keys).

**✅ Status**: Main schema migration has been successfully applied to the database.

### 3. Apply RLS Policies

The RLS policies need to be applied separately using Supabase's SQL editor:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `0001_vocabulary_rls_policies.sql`
4. Execute the SQL to enable RLS and create the policies

**Note**: RLS policies cannot be managed through Drizzle migrations and must be applied directly in Supabase.

## Schema Overview

### Tables Created

- **categories** - Vocabulary categories (Greetings, Food, etc.)
- **words** - Individual vocabulary words with Tagalog and English
- **examples** - Example sentences for words with optional audio
- **reviews** - Spaced repetition data for user progress tracking

### Indexes

- `words_category_idx` - Optimize category-based word queries
- `examples_word_idx` - Optimize example lookups for words
- `reviews_user_due_idx` - Optimize due card queries for users

### Row Level Security

- Categories, words, and examples are read-only for authenticated users
- Reviews are private to each user (users can only access their own data)
