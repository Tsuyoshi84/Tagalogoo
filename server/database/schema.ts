import { sql } from 'drizzle-orm'
import {
	date,
	index,
	integer,
	pgTable,
	primaryKey,
	real,
	text,
	timestamp,
	uuid,
} from 'drizzle-orm/pg-core'

// Categories table for organizing vocabulary by topic
export const categories = pgTable(
	'categories',
	{
		id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
		name: text('name').notNull(),
		description: text('description'),
		sortOrder: integer('sort_order').default(0),
		createdAt: timestamp('created_at', { withTimezone: true }).default(sql`NOW()`),
	},
	(table) => ({
		sortOrderIdx: index('categories_sort_order_idx').on(table.sortOrder),
	}),
)

// Words table for storing Tagalog vocabulary with English translations
export const words = pgTable(
	'words',
	{
		id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
		categoryId: uuid('category_id')
			.notNull()
			.references(() => categories.id, { onDelete: 'cascade' }),
		tl: text('tl').notNull(), // Tagalog word/phrase
		en: text('en').notNull(), // English translation
		createdAt: timestamp('created_at', { withTimezone: true }).default(sql`NOW()`),
	},
	(table) => ({
		categoryIdx: index('words_category_idx').on(table.categoryId),
	}),
)

// Examples table for storing example sentences with translations
export const examples = pgTable(
	'examples',
	{
		id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
		wordId: uuid('word_id')
			.notNull()
			.references(() => words.id, { onDelete: 'cascade' }),
		tl: text('tl').notNull(), // Tagalog example sentence
		en: text('en').notNull(), // English translation
		audioUrl: text('audio_url'), // Optional Supabase Storage path
		createdAt: timestamp('created_at', { withTimezone: true }).default(sql`NOW()`),
	},
	(table) => ({
		wordIdx: index('examples_word_idx').on(table.wordId),
	}),
)

// Reviews table for tracking spaced repetition progress per user
export const reviews = pgTable(
	'reviews',
	{
		userId: uuid('user_id').notNull(), // References auth.users(id)
		wordId: uuid('word_id')
			.notNull()
			.references(() => words.id, { onDelete: 'cascade' }),
		ease: real('ease').default(2.5), // SM-2 algorithm ease factor
		intervalDays: integer('interval_days').default(0), // Days until next review
		reps: integer('reps').default(0), // Number of successful repetitions
		lapses: integer('lapses').default(0), // Number of times forgotten
		nextDue: date('next_due').default(sql`NOW()`), // Next review date
		lastReviewed: date('last_reviewed'), // Last review date
	},
	(table) => ({
		pk: primaryKey({ columns: [table.userId, table.wordId] }),
		userDueIdx: index('reviews_user_due_idx').on(table.userId, table.nextDue),
		userWordIdx: index('reviews_user_word_idx').on(table.userId, table.wordId),
	}),
)

// Daily statistics table for tracking learning progress
export const dailyStats = pgTable(
	'daily_stats',
	{
		id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
		userId: uuid('user_id').notNull(), // References auth.users(id)
		date: date('date').notNull(),
		cardsStudied: integer('cards_studied').default(0),
		correctAnswers: integer('correct_answers').default(0),
		sessionDurationSeconds: integer('session_duration_seconds'),
		startedAt: timestamp('started_at', { withTimezone: true }).default(sql`NOW()`),
		completedAt: timestamp('completed_at', { withTimezone: true }),
	},
	(table) => ({
		userDateIdx: index('daily_stats_user_date_idx').on(table.userId, table.date),
	}),
)
