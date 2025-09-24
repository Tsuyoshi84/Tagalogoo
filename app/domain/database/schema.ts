import { relations } from 'drizzle-orm'
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

// Categories table - vocabulary categories like "Greetings", "Food", etc.
export const categories = pgTable('categories', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	description: text('description'),
	sortOrder: integer('sort_order').default(0),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// Words table - individual vocabulary words with Tagalog and English
export const words = pgTable(
	'words',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		categoryId: uuid('category_id')
			.notNull()
			.references(() => categories.id, { onDelete: 'cascade' }),
		tl: text('tl').notNull(), // Tagalog
		en: text('en').notNull(), // English
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	},
	(table) => ({
		categoryIdx: index('words_category_idx').on(table.categoryId),
	}),
)

// Examples table - example sentences for words
export const examples = pgTable(
	'examples',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		wordId: uuid('word_id')
			.notNull()
			.references(() => words.id, { onDelete: 'cascade' }),
		tl: text('tl').notNull(), // Tagalog example sentence
		en: text('en').notNull(), // English translation
		audioUrl: text('audio_url'), // Supabase Storage path
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	},
	(table) => ({
		wordIdx: index('examples_word_idx').on(table.wordId),
	}),
)

// Reviews table - spaced repetition data for each user-word combination
export const reviews = pgTable(
	'reviews',
	{
		userId: uuid('user_id').notNull(), // References auth.users(id) - handled by RLS
		wordId: uuid('word_id')
			.notNull()
			.references(() => words.id, { onDelete: 'cascade' }),
		ease: real('ease').default(2.5),
		intervalDays: integer('interval_days').default(0),
		reps: integer('reps').default(0),
		lapses: integer('lapses').default(0),
		nextDue: date('next_due').defaultNow(),
		lastReviewed: date('last_reviewed'),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.userId, table.wordId] }),
		userDueIdx: index('reviews_user_due_idx').on(table.userId, table.nextDue),
	}),
)

// Relations for better query experience
export const categoriesRelations = relations(categories, ({ many }) => ({
	words: many(words),
}))

export const wordsRelations = relations(words, ({ one, many }) => ({
	category: one(categories, {
		fields: [words.categoryId],
		references: [categories.id],
	}),
	examples: many(examples),
	reviews: many(reviews),
}))

export const examplesRelations = relations(examples, ({ one }) => ({
	word: one(words, {
		fields: [examples.wordId],
		references: [words.id],
	}),
}))

export const reviewsRelations = relations(reviews, ({ one }) => ({
	word: one(words, {
		fields: [reviews.wordId],
		references: [words.id],
	}),
}))
