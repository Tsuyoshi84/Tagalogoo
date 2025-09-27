/**
 * Spaced Repetition System (SRS) Domain Logic
 *
 * Implements a simplified SM-2 algorithm for vocabulary learning.
 * Quality ratings: Again=1, Hard=3, Good=4, Easy=5
 */

export interface ReviewData {
	ease: number
	intervalDays: number
	reps: number
	lapses: number
	nextDue: Date
	lastReviewed?: Date
}

export interface ReviewResult {
	cardId: string
	quality: 1 | 3 | 4 | 5 // Again, Hard, Good, Easy
	responseTime: number
	timestamp: Date
}

export interface ProgressStats {
	totalCards: number
	cardsLearned: number
	accuracy: number
	currentStreak: number
	longestStreak: number
	averageResponseTime: number
}

/**
 * Calculate next review interval using simplified SM-2 algorithm
 *
 * @param review Current review data
 * @param quality Quality rating (1=Again, 3=Hard, 4=Good, 5=Easy)
 * @returns Updated review data with new interval and due date
 */
export function calculateNextReview(review: ReviewData, quality: 1 | 3 | 4 | 5): ReviewData {
	const now = new Date()
	let { ease, intervalDays, reps } = review
	const { lapses } = review

	// Handle "Again" (quality = 1) - reset to beginning
	if (quality === 1) {
		return {
			...review,
			intervalDays: 0,
			reps: 0,
			lapses: lapses + 1,
			nextDue: now, // Due immediately
			lastReviewed: now,
		}
	}

	// Successful review (quality >= 3)
	reps += 1

	// Calculate new ease factor
	ease = Math.max(1.3, ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))

	// Calculate new interval
	if (reps === 1) {
		intervalDays = 1
	} else if (reps === 2) {
		intervalDays = 6
	} else {
		intervalDays = Math.round(intervalDays * ease)
	}

	// Adjust interval based on quality
	switch (quality) {
		case 3: // Hard - reduce interval by 20%
			intervalDays = Math.max(1, Math.round(intervalDays * 0.8))
			break
		case 5: // Easy - increase interval by 30%
			intervalDays = Math.round(intervalDays * 1.3)
			break
		// case 4: Good - use calculated interval as-is
	}

	// Calculate next due date
	const nextDue = new Date(now)
	nextDue.setDate(nextDue.getDate() + intervalDays)

	return {
		ease,
		intervalDays,
		reps,
		lapses,
		nextDue,
		lastReviewed: now,
	}
}

/**
 * Initialize review data for a new card
 */
export function initializeNewCard(): ReviewData {
	return {
		ease: 2.5,
		intervalDays: 0,
		reps: 0,
		lapses: 0,
		nextDue: new Date(), // Due immediately for first review
		lastReviewed: undefined,
	}
}

/**
 * Check if a card is due for review
 */
export function isCardDue(review: ReviewData, currentDate: Date = new Date()): boolean {
	return currentDate >= review.nextDue
}

/**
 * Calculate difficulty level based on review history
 */
export function calculateDifficulty(
	review: ReviewData,
): 'new' | 'learning' | 'review' | 'difficult' {
	if (review.reps === 0) return 'new'
	if (review.reps < 3) return 'learning'
	if (review.lapses > 2 || review.ease < 2.0) return 'difficult'
	return 'review'
}

/**
 * Calculate progress statistics from review results
 */
export function calculateProgressStats(
	reviews: ReviewData[],
	recentResults: ReviewResult[],
	totalCards: number,
): ProgressStats {
	const cardsLearned = reviews.filter((r) => r.reps >= 1).length

	// Calculate accuracy from recent results
	const correctAnswers = recentResults.filter((r) => r.quality >= 4).length
	const accuracy = recentResults.length > 0 ? correctAnswers / recentResults.length : 0

	// Calculate current streak
	const currentStreak = calculateCurrentStreak(recentResults)

	// Calculate longest streak
	const longestStreak = calculateLongestStreak(recentResults)

	// Calculate average response time
	const totalResponseTime = recentResults.reduce((sum, r) => sum + r.responseTime, 0)
	const averageResponseTime =
		recentResults.length > 0 ? totalResponseTime / recentResults.length : 0

	return {
		totalCards,
		cardsLearned,
		accuracy,
		currentStreak,
		longestStreak,
		averageResponseTime,
	}
}

/**
 * Calculate current streak of correct answers
 */
export function calculateCurrentStreak(results: ReviewResult[]): number {
	let streak = 0

	// Count from the end (most recent) backwards
	for (let i = results.length - 1; i >= 0; i--) {
		const result = results[i]
		if (result && result.quality >= 4) {
			// Good or Easy
			streak++
		} else {
			break
		}
	}

	return streak
}

/**
 * Calculate longest streak of correct answers
 */
export function calculateLongestStreak(results: ReviewResult[]): number {
	let longestStreak = 0
	let currentStreak = 0

	for (const result of results) {
		if (result.quality >= 4) {
			// Good or Easy
			currentStreak++
			longestStreak = Math.max(longestStreak, currentStreak)
		} else {
			currentStreak = 0
		}
	}

	return longestStreak
}

/**
 * Get cards that are due for review
 */
export function getDueCards<T extends { review?: ReviewData }>(
	cards: T[],
	currentDate: Date = new Date(),
): T[] {
	return cards.filter((card) => {
		if (!card.review) return true // New cards are always due
		return isCardDue(card.review, currentDate)
	})
}

/**
 * Sort cards by priority (new cards first, then by due date)
 */
export function sortCardsByPriority<T extends { review?: ReviewData }>(cards: T[]): T[] {
	return [...cards].sort((a, b) => {
		// New cards (no review data) come first
		if (!a.review && !b.review) return 0
		if (!a.review) return -1
		if (!b.review) return 1

		// Sort by due date (earliest first)
		return a.review.nextDue.getTime() - b.review.nextDue.getTime()
	})
}

/**
 * Filter cards marked as difficult
 */
export function getDifficultCards<T extends { review?: ReviewData }>(cards: T[]): T[] {
	return cards.filter((card) => {
		if (!card.review) return false
		return calculateDifficulty(card.review) === 'difficult'
	})
}
