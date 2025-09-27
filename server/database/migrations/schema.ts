import { sql } from 'drizzle-orm'
import {
	date,
	foreignKey,
	index,
	integer,
	pgPolicy,
	pgTable,
	primaryKey,
	real,
	text,
	timestamp,
	uuid,
} from 'drizzle-orm/pg-core'

export const words = pgTable(
	'words',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		categoryId: uuid('category_id').notNull(),
		tl: text().notNull(),
		en: text().notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
	},
	(table) => [
		index('words_category_idx').using('btree', table.categoryId.asc().nullsLast().op('uuid_ops')),
		foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: 'words_category_id_categories_id_fk',
		}).onDelete('cascade'),
		pgPolicy('Authenticated users can view words', {
			as: 'permissive',
			for: 'select',
			to: ['authenticated'],
			using: sql`true`,
		}),
	],
)

export const examples = pgTable(
	'examples',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		wordId: uuid('word_id').notNull(),
		tl: text().notNull(),
		en: text().notNull(),
		audioUrl: text('audio_url'),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
	},
	(table) => [
		index('examples_word_idx').using('btree', table.wordId.asc().nullsLast().op('uuid_ops')),
		foreignKey({
			columns: [table.wordId],
			foreignColumns: [words.id],
			name: 'examples_word_id_words_id_fk',
		}).onDelete('cascade'),
		pgPolicy('Authenticated users can view examples', {
			as: 'permissive',
			for: 'select',
			to: ['authenticated'],
			using: sql`true`,
		}),
	],
)

export const categories = pgTable(
	'categories',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		name: text().notNull(),
		description: text(),
		sortOrder: integer('sort_order').default(0),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
	},
	(table) => [
		index('categories_sort_order_idx').using(
			'btree',
			table.sortOrder.asc().nullsLast().op('int4_ops'),
		),
		pgPolicy('Authenticated users can view categories', {
			as: 'permissive',
			for: 'select',
			to: ['authenticated'],
			using: sql`true`,
		}),
	],
)

export const dailyStats = pgTable(
	'daily_stats',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		userId: uuid('user_id').notNull(),
		date: date().notNull(),
		cardsStudied: integer('cards_studied').default(0),
		correctAnswers: integer('correct_answers').default(0),
		sessionDurationSeconds: integer('session_duration_seconds'),
		startedAt: timestamp('started_at', { withTimezone: true, mode: 'string' }).defaultNow(),
		completedAt: timestamp('completed_at', { withTimezone: true, mode: 'string' }),
	},
	(table) => [
		index('daily_stats_user_date_idx').using(
			'btree',
			table.userId.asc().nullsLast().op('date_ops'),
			table.date.asc().nullsLast().op('date_ops'),
		),
		pgPolicy('Users can delete own daily stats', {
			as: 'permissive',
			for: 'delete',
			to: ['public'],
			using: sql`(auth.uid() = user_id)`,
		}),
		pgPolicy('Users can update own daily stats', {
			as: 'permissive',
			for: 'update',
			to: ['public'],
		}),
		pgPolicy('Users can insert own daily stats', {
			as: 'permissive',
			for: 'insert',
			to: ['public'],
		}),
		pgPolicy('Users can view own daily stats', { as: 'permissive', for: 'select', to: ['public'] }),
	],
)

export const reviews = pgTable(
	'reviews',
	{
		userId: uuid('user_id').notNull(),
		wordId: uuid('word_id').notNull(),
		ease: real().default(2.5),
		intervalDays: integer('interval_days').default(0),
		reps: integer().default(0),
		lapses: integer().default(0),
		nextDue: date('next_due').defaultNow(),
		lastReviewed: date('last_reviewed'),
	},
	(table) => [
		index('reviews_user_due_idx').using(
			'btree',
			table.userId.asc().nullsLast().op('date_ops'),
			table.nextDue.asc().nullsLast().op('date_ops'),
		),
		index('reviews_user_word_idx').using(
			'btree',
			table.userId.asc().nullsLast().op('uuid_ops'),
			table.wordId.asc().nullsLast().op('uuid_ops'),
		),
		foreignKey({
			columns: [table.wordId],
			foreignColumns: [words.id],
			name: 'reviews_word_id_words_id_fk',
		}).onDelete('cascade'),
		primaryKey({ columns: [table.userId, table.wordId], name: 'reviews_user_id_word_id_pk' }),
		pgPolicy('Users can delete own reviews', {
			as: 'permissive',
			for: 'delete',
			to: ['public'],
			using: sql`(auth.uid() = user_id)`,
		}),
		pgPolicy('Users can update own reviews', { as: 'permissive', for: 'update', to: ['public'] }),
		pgPolicy('Users can insert own reviews', { as: 'permissive', for: 'insert', to: ['public'] }),
		pgPolicy('Users can view own reviews', { as: 'permissive', for: 'select', to: ['public'] }),
	],
)
