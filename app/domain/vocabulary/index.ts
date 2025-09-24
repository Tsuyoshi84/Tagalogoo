/**
 * Vocabulary domain module exports
 *
 * This module provides the main exports for vocabulary-related domain logic,
 * including spaced repetition algorithms and progress calculations.
 */

// Progress Calculation exports
export {
	calculateDailyStats,
	calculateLearningVelocity,
	calculateProgressStats,
	calculateSessionStats,
	calculateStreaks,
	type DailyStats,
	getDifficultCards,
	getDueCards,
	isReviewCorrect,
	type ProgressStats,
	type ReviewOutcome,
	type SessionStats,
} from './progressCalculation'
// Quality Scheduling exports
export {
	getQualityDescription,
	getQualityLabel,
	getQualityOptions,
	getSuggestedQuality,
	isSuccessfulReview,
	QUALITY_DESCRIPTIONS,
	QUALITY_LABELS,
} from './qualityScheduling'
// Spaced Repetition System exports
export {
	calculateNextReview,
	getDaysUntilDue,
	initializeCard,
	isCardDue,
	isDifficultCard,
	QUALITY_RATINGS,
	type QualityRating,
	type ReviewData,
	type ReviewResult,
} from './spacedRepetition'
