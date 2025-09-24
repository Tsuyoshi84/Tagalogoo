/**
 * Spaced Repetition System (SRS) implementation using a simplified SM-2 algorithm
 *
 * This module provides pure functions for calculating review intervals and managing
 * the spaced repetition scheduling for vocabulary flashcards.
 */

/**
 * Quality ratings for flashcard reviews based on user performance
 */
export const QUALITY_RATINGS = {
	AGAIN: 1, // Complete blackout, incorrect response
	HARD: 3, // Correct response with serious difficulty
	GOOD: 4, // Correct response after some hesitation
	EASY: 5, // Perfect response
} as const

/**
 * Type representing valid quality rating values (1, 3, 4, or 5)
 */
export type QualityRating = (typeof QUALITY_RATINGS)[keyof typeof QUALITY_RATINGS]

/**
 * Review data structure for tracking individual flashcard progress
 */
export interface ReviewData {
	/** Easiness factor (default 2.5, minimum 1.3) */
	ease: number
	/** Current interval in days until next review */
	intervalDays: number
	/** Number of successful repetitions completed */
	reps: number
	/** Number of times the card was forgotten (quality < 3) */
	lapses: number
	/** Next scheduled review date */
	nextDue: Date
	/** Optional timestamp of last review session */
	lastReviewed?: Date
}

/**
 * Result of calculating the next review schedule for a flashcard
 */
export interface ReviewResult {
	/** Updated easiness factor after review */
	ease: number
	/** New interval in days until next review */
	intervalDays: number
	/** Updated repetition count */
	reps: number
	/** Updated lapse count */
	lapses: number
	/** Calculated next review date */
	nextDue: Date
}

/**
 * Initialize a new flashcard with default SRS values
 *
 * Creates a new card ready for its first review with standard SM-2 defaults.
 * The card will be due immediately for initial learning.
 *
 * @returns New ReviewData with default values
 *
 * @example
 * ```ts
 * const newCard = initializeCard();
 * console.log(newCard.ease); // 2.5
 * console.log(newCard.reps); // 0
 * console.log(newCard.lapses); // 0
 * // nextDue will be current timestamp for immediate review
 * ```
 */
export function initializeCard(): ReviewData {
	return {
		ease: 2.5,
		intervalDays: 0,
		reps: 0,
		lapses: 0,
		nextDue: new Date(), // Due immediately for first review
	}
}

/**
 * Calculate the next review interval based on SM-2 algorithm
 *
 * Implements a simplified version of the SM-2 spaced repetition algorithm.
 * Updates the card's ease factor, repetition count, and next due date based
 * on the quality of the user's response.
 *
 * @param currentReview - Current review data for the card
 * @param quality - Quality rating (1=Again, 3=Hard, 4=Good, 5=Easy)
 * @returns Updated review data with new interval and due date
 *
 * @example
 * ```ts
 * const card = initializeCard();
 *
 * // First review - user answered correctly but with hesitation
 * const result1 = calculateNextReview(card, QUALITY_RATINGS.GOOD);
 * console.log(result1.intervalDays); // 1 (review tomorrow)
 * console.log(result1.reps); // 1
 *
 * // Second review - user answered easily
 * const result2 = calculateNextReview(result1, QUALITY_RATINGS.EASY);
 * console.log(result2.intervalDays); // 6 (review in 6 days)
 * console.log(result2.reps); // 2
 *
 * // User forgot the word
 * const result3 = calculateNextReview(result2, QUALITY_RATINGS.AGAIN);
 * console.log(result3.intervalDays); // 1 (back to daily review)
 * console.log(result3.reps); // 0 (reset repetitions)
 * console.log(result3.lapses); // 1 (increment lapse count)
 * ```
 */
export function calculateNextReview(
	currentReview: ReviewData,
	quality: QualityRating,
): ReviewResult {
	let { ease, intervalDays, reps, lapses } = currentReview

	// If quality is less than 3 (Again or Hard with serious difficulty)
	if (quality < 3) {
		// Reset repetitions and increment lapses
		reps = 0
		lapses += 1
		intervalDays = 1 // Review again tomorrow
	} else {
		// Successful review
		reps += 1

		// Calculate new interval based on repetition number
		if (reps === 1) {
			intervalDays = 1
		} else if (reps === 2) {
			intervalDays = 6
		} else {
			// For subsequent reviews, multiply by ease factor
			intervalDays = Math.round(intervalDays * ease)
		}
	}

	// Update ease factor based on quality
	ease = ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))

	// Ensure ease doesn't go below 1.3
	if (ease < 1.3) {
		ease = 1.3
	}

	// Calculate next due date
	const nextDue = new Date()
	nextDue.setDate(nextDue.getDate() + intervalDays)

	return {
		ease: Math.round(ease * 100) / 100, // Round to 2 decimal places
		intervalDays,
		reps,
		lapses,
		nextDue,
	}
}

/**
 * Check if a flashcard is due for review
 *
 * Compares the card's next due date with the current date to determine
 * if it should be included in the current study session.
 *
 * @param reviewData - Review data to check
 * @param currentDate - Current date (defaults to now)
 * @returns True if the card is due for review
 *
 * @example
 * ```ts
 * const card = initializeCard();
 * console.log(isCardDue(card)); // true (new cards are due immediately)
 *
 * const futureCard = {
 *   ...card,
 *   nextDue: new Date(Date.now() + 24 * 60 * 60 * 1000) // tomorrow
 * };
 * console.log(isCardDue(futureCard)); // false
 *
 * // Check against specific date
 * const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
 * console.log(isCardDue(futureCard, tomorrow)); // true
 * ```
 */
export function isCardDue(reviewData: ReviewData, currentDate: Date = new Date()): boolean {
	return reviewData.nextDue <= currentDate
}

/**
 * Get the number of days until next review
 *
 * Calculates the difference between the card's due date and current date.
 * Returns negative values for overdue cards.
 *
 * @param reviewData - Review data
 * @param currentDate - Current date (defaults to now)
 * @returns Number of days until next review (negative if overdue)
 *
 * @example
 * ```ts
 * const card = {
 *   ...initializeCard(),
 *   nextDue: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
 * };
 *
 * console.log(getDaysUntilDue(card)); // 3
 *
 * const overdueCard = {
 *   ...initializeCard(),
 *   nextDue: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
 * };
 *
 * console.log(getDaysUntilDue(overdueCard)); // -2
 * ```
 */
export function getDaysUntilDue(reviewData: ReviewData, currentDate: Date = new Date()): number {
	const timeDiff = reviewData.nextDue.getTime() - currentDate.getTime()
	return Math.ceil(timeDiff / (1000 * 60 * 60 * 24))
}

/**
 * Determine if a card should be considered "difficult" based on its history
 *
 * Analyzes the card's performance metrics to identify cards that consistently
 * cause trouble for the learner. These cards may need special attention.
 *
 * @param reviewData - Review data to evaluate
 * @returns True if the card is considered difficult
 *
 * @example
 * ```ts
 * const easyCard = {
 *   ease: 2.8,
 *   intervalDays: 10,
 *   reps: 5,
 *   lapses: 1,
 *   nextDue: new Date()
 * };
 * console.log(isDifficultCard(easyCard)); // false
 *
 * const difficultCard = {
 *   ease: 1.8, // Low ease factor
 *   intervalDays: 1,
 *   reps: 2,
 *   lapses: 4, // Many lapses
 *   nextDue: new Date()
 * };
 * console.log(isDifficultCard(difficultCard)); // true
 * ```
 */
export function isDifficultCard(reviewData: ReviewData): boolean {
	// Consider a card difficult if:
	// - It has more than 2 lapses, OR
	// - It has low ease factor (< 2.0), OR
	// - It has many repetitions but still low ease (indicates consistent difficulty)
	return (
		reviewData.lapses > 2 || reviewData.ease < 2.0 || (reviewData.reps > 5 && reviewData.ease < 2.2)
	)
}
