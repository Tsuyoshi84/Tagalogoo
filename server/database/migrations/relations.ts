import { relations } from 'drizzle-orm/relations'
import { categories, examples, reviews, words } from './schema'

export const wordsRelations = relations(words, ({ one, many }) => ({
	category: one(categories, {
		fields: [words.categoryId],
		references: [categories.id],
	}),
	examples: many(examples),
	reviews: many(reviews),
}))

export const categoriesRelations = relations(categories, ({ many }) => ({
	words: many(words),
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
