import type { Database } from '../../types/database.types'

// Database table types
export type CategoryRow = Database['public']['Tables']['categories']['Row']
export type WordRow = Database['public']['Tables']['words']['Row']
export type ExampleRow = Database['public']['Tables']['examples']['Row']
export type ReviewRow = Database['public']['Tables']['reviews']['Row']
export type DailyStatsRow = Database['public']['Tables']['daily_stats']['Row']

// Insert types for creating new records
export type CategoryInsert = Database['public']['Tables']['categories']['Insert']
export type WordInsert = Database['public']['Tables']['words']['Insert']
export type ExampleInsert = Database['public']['Tables']['examples']['Insert']
export type ReviewInsert = Database['public']['Tables']['reviews']['Insert']
export type DailyStatsInsert = Database['public']['Tables']['daily_stats']['Insert']

// Update types for modifying existing records
export type CategoryUpdate = Database['public']['Tables']['categories']['Update']
export type WordUpdate = Database['public']['Tables']['words']['Update']
export type ExampleUpdate = Database['public']['Tables']['examples']['Update']
export type ReviewUpdate = Database['public']['Tables']['reviews']['Update']
export type DailyStatsUpdate = Database['public']['Tables']['daily_stats']['Update']

/**
 * Enhanced category interface with computed fields
 */
export interface Category extends CategoryRow {
	wordCount?: number
	dueCount?: number
}

/**
 * Enhanced word interface with related data
 */
export interface Word extends WordRow {
	examples?: Example[]
	category?: Category
}

/**
 * Enhanced example interface
 */
export interface Example extends ExampleRow {
	word?: Word
}

/**
 * Enhanced review interface with computed fields
 */
export interface Review extends ReviewRow {
	word?: Word
	isDue?: boolean
}

/**
 * Flashcard data combining word, examples, and review information
 */
export interface FlashcardData extends Word {
	examples: Example[]
	review?: Review
	category: Category
}

/**
 * Study session statistics
 */
export interface StudySessionStats {
	cardsStudied: number
	correctAnswers: number
	accuracy: number
	sessionDuration: number
	newCardsLearned: number
}

/**
 * Progress statistics for a user
 */
export interface ProgressStats {
	totalWords: number
	wordsLearned: number
	wordsReviewed: number
	currentStreak: number
	longestStreak: number
	averageAccuracy: number
	totalStudyTime: number
}

/**
 * Category progress information
 */
export interface CategoryProgress {
	categoryId: string
	categoryName: string
	totalWords: number
	wordsLearned: number
	dueWords: number
	completionPercentage: number
}
