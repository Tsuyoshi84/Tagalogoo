import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import type { categories, examples, reviews, words } from './schema.ts'

// Select types (for reading from database)
export type Category = InferSelectModel<typeof categories>
export type Word = InferSelectModel<typeof words>
export type Example = InferSelectModel<typeof examples>
export type Review = InferSelectModel<typeof reviews>

// Insert types (for creating new records)
export type NewCategory = InferInsertModel<typeof categories>
export type NewWord = InferInsertModel<typeof words>
export type NewExample = InferInsertModel<typeof examples>
export type NewReview = InferInsertModel<typeof reviews>

// Extended types for application use
export interface CategoryWithStats extends Category {
	wordCount?: number
	dueCount?: number
}

export interface WordWithDetails extends Word {
	category: Category
	examples: Example[]
	review?: Review
}

export interface FlashcardData extends Word {
	examples: Example[]
	review?: Review
	category: Category
}

export interface StudySessionStats {
	cardsStudied: number
	correctAnswers: number
	accuracy: number
	sessionDuration: number
	newCardsLearned: number
}
