/**
 * Progress calculation utilities for vocabulary learning
 *
 * This module provides functions for calculating learning statistics,
 * accuracy metrics, streaks, and other progress indicators.
 */

import type { ReviewData } from './spacedRepetition'

/**
 * Study session statistics for a single learning session
 *
 * @interface SessionStats
 * @property cardsStudied - Total number of cards reviewed in session
 * @property correctAnswers - Number of cards answered correctly (quality >= 3)
 * @property accuracy - Percentage accuracy (0-100)
 * @property sessionDuration - Session length in seconds
 * @property newCardsLearned - Number of new cards learned (quality >= 3)
 * @property reviewsCompleted - Total reviews completed (same as cardsStudied)
 */
export interface SessionStats {
	cardsStudied: number
	correctAnswers: number
	accuracy: number
	sessionDuration: number // in seconds
	newCardsLearned: number
	reviewsCompleted: number
}

/**
 * Overall progress statistics across all learning sessions
 *
 * @interface ProgressStats
 * @property totalCards - Total number of cards in the system
 * @property cardsLearned - Cards with at least one successful repetition
 * @property cardsMastered - Cards considered mastered (reps >= 3, ease >= 2.5)
 * @property averageAccuracy - Overall accuracy percentage across all reviews
 * @property currentStreak - Current consecutive correct answers
 * @property longestStreak - Longest streak of consecutive correct answers
 * @property totalStudyTime - Total time spent studying in seconds
 * @property totalReviews - Total number of reviews completed
 */
export interface ProgressStats {
	totalCards: number
	cardsLearned: number // Cards with reps > 0
	cardsMastered: number // Cards with reps >= 3 and ease >= 2.5
	averageAccuracy: number
	currentStreak: number
	longestStreak: number
	totalStudyTime: number // in seconds
	totalReviews: number
}

/**
 * Daily study statistics for tracking daily progress
 *
 * @interface DailyStats
 * @property date - The date these statistics represent
 * @property cardsStudied - Number of cards studied on this date
 * @property accuracy - Accuracy percentage for this date
 * @property studyTime - Time spent studying in seconds
 * @property newCards - Number of new cards learned
 * @property reviewCards - Number of review cards studied
 */
export interface DailyStats {
	date: Date
	cardsStudied: number
	accuracy: number
	studyTime: number // in seconds
	newCards: number
	reviewCards: number
}

/**
 * Review outcome for tracking individual card review results
 *
 * @interface ReviewOutcome
 * @property cardId - Unique identifier for the card
 * @property quality - Quality rating given (1, 3, 4, or 5)
 * @property responseTime - Time taken to respond in milliseconds
 * @property timestamp - When the review occurred
 * @property wasCorrect - Whether the review was considered correct (quality >= 3)
 */
export interface ReviewOutcome {
	cardId: string
	quality: number
	responseTime: number // in milliseconds
	timestamp: Date
	wasCorrect: boolean
}

/**
 * Calculate session statistics from review outcomes
 *
 * Analyzes the results of a study session to provide summary statistics
 * including accuracy, duration, and learning progress.
 *
 * @param outcomes - Array of review outcomes from the session
 * @param sessionStartTime - When the session started
 * @param sessionEndTime - When the session ended
 * @returns Calculated session statistics
 *
 * @example
 * ```ts
 * const outcomes = [
 *   { cardId: '1', quality: 4, responseTime: 2000, timestamp: new Date(), wasCorrect: true },
 *   { cardId: '2', quality: 1, responseTime: 5000, timestamp: new Date(), wasCorrect: false },
 *   { cardId: '3', quality: 5, responseTime: 1500, timestamp: new Date(), wasCorrect: true }
 * ];
 *
 * const startTime = new Date('2024-01-01T10:00:00Z');
 * const endTime = new Date('2024-01-01T10:05:00Z');
 *
 * const stats = calculateSessionStats(outcomes, startTime, endTime);
 * console.log(stats.cardsStudied); // 3
 * console.log(stats.accuracy); // 66.67
 * console.log(stats.sessionDuration); // 300 (5 minutes)
 * ```
 */
export function calculateSessionStats(
	outcomes: ReviewOutcome[],
	sessionStartTime: Date,
	sessionEndTime: Date,
): SessionStats {
	const cardsStudied = outcomes.length
	const correctAnswers = outcomes.filter((outcome) => outcome.wasCorrect).length
	const accuracy = cardsStudied > 0 ? (correctAnswers / cardsStudied) * 100 : 0
	const sessionDuration = Math.round((sessionEndTime.getTime() - sessionStartTime.getTime()) / 1000)

	// Count new cards (assuming first-time reviews have quality > 0)
	const newCardsLearned = outcomes.filter((outcome) => outcome.quality >= 3).length
	const reviewsCompleted = cardsStudied

	return {
		cardsStudied,
		correctAnswers,
		accuracy: Math.round(accuracy * 100) / 100, // Round to 2 decimal places
		sessionDuration,
		newCardsLearned,
		reviewsCompleted,
	}
}

/**
 * Calculate overall progress statistics
 *
 * Analyzes all review data and outcomes to provide comprehensive progress
 * metrics including learning velocity, mastery levels, and accuracy trends.
 *
 * @param allReviews - All review data for the user
 * @param allOutcomes - All historical review outcomes
 * @param totalStudyTime - Total study time in seconds
 * @returns Overall progress statistics
 *
 * @example
 * ```ts
 * const reviews = [
 *   { ease: 2.5, intervalDays: 1, reps: 0, lapses: 0, nextDue: new Date() },
 *   { ease: 2.8, intervalDays: 5, reps: 3, lapses: 0, nextDue: new Date() },
 *   { ease: 2.6, intervalDays: 10, reps: 5, lapses: 1, nextDue: new Date() }
 * ];
 *
 * const outcomes = [
 *   { cardId: '1', quality: 4, responseTime: 2000, timestamp: new Date(), wasCorrect: true },
 *   { cardId: '2', quality: 1, responseTime: 3000, timestamp: new Date(), wasCorrect: false }
 * ];
 *
 * const stats = calculateProgressStats(reviews, outcomes, 3600);
 * console.log(stats.totalCards); // 3
 * console.log(stats.cardsLearned); // 2 (cards with reps > 0)
 * console.log(stats.cardsMastered); // 2 (cards with reps >= 3 and ease >= 2.5)
 * ```
 */
export function calculateProgressStats(
	allReviews: ReviewData[],
	allOutcomes: ReviewOutcome[],
	totalStudyTime: number,
): ProgressStats {
	const totalCards = allReviews.length
	const cardsLearned = allReviews.filter((review) => review.reps > 0).length
	const cardsMastered = allReviews.filter((review) => review.reps >= 3 && review.ease >= 2.5).length

	// Calculate average accuracy from all outcomes
	const correctOutcomes = allOutcomes.filter((outcome) => outcome.wasCorrect).length
	const averageAccuracy = allOutcomes.length > 0 ? (correctOutcomes / allOutcomes.length) * 100 : 0

	// Calculate streaks
	const { currentStreak, longestStreak } = calculateStreaks(allOutcomes)

	return {
		totalCards,
		cardsLearned,
		cardsMastered,
		averageAccuracy: Math.round(averageAccuracy * 100) / 100,
		currentStreak,
		longestStreak,
		totalStudyTime,
		totalReviews: allOutcomes.length,
	}
}

/**
 * Calculate current and longest study streaks
 *
 * Analyzes review outcomes to determine consecutive correct answer streaks.
 * Useful for gamification and motivation tracking.
 *
 * @param outcomes - All review outcomes, should be sorted by timestamp
 * @returns Current and longest streak counts
 *
 * @example
 * ```ts
 * const outcomes = [
 *   { cardId: '1', quality: 4, responseTime: 2000, timestamp: new Date('2024-01-05'), wasCorrect: true },
 *   { cardId: '2', quality: 4, responseTime: 2000, timestamp: new Date('2024-01-04'), wasCorrect: true },
 *   { cardId: '3', quality: 1, responseTime: 2000, timestamp: new Date('2024-01-03'), wasCorrect: false },
 *   { cardId: '4', quality: 4, responseTime: 2000, timestamp: new Date('2024-01-02'), wasCorrect: true }
 * ];
 *
 * const { currentStreak, longestStreak } = calculateStreaks(outcomes);
 * console.log(currentStreak); // 2 (last 2 were correct)
 * console.log(longestStreak); // 2 (longest consecutive streak)
 * ```
 */
export function calculateStreaks(outcomes: ReviewOutcome[]): {
	currentStreak: number
	longestStreak: number
} {
	if (outcomes.length === 0) {
		return { currentStreak: 0, longestStreak: 0 }
	}

	// Sort outcomes by timestamp (most recent first)
	const sortedOutcomes = [...outcomes].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

	let currentStreak = 0
	let longestStreak = 0
	let tempStreak = 0

	// Calculate current streak (from most recent backwards)
	for (const outcome of sortedOutcomes) {
		if (outcome.wasCorrect) {
			if (currentStreak === tempStreak) {
				currentStreak++
			}
			tempStreak++
		} else {
			if (currentStreak === tempStreak) {
				currentStreak = 0
			}
			tempStreak = 0
		}

		longestStreak = Math.max(longestStreak, tempStreak)
	}

	return { currentStreak, longestStreak }
}

/**
 * Calculate daily statistics for a specific date
 *
 * Analyzes review outcomes for a single day to provide daily progress metrics.
 * Useful for tracking daily study habits and consistency.
 *
 * @param outcomes - Review outcomes for the day
 * @param date - The date to calculate stats for
 * @returns Daily statistics
 *
 * @example
 * ```ts
 * const outcomes = [
 *   { cardId: '1', quality: 4, responseTime: 2000, timestamp: new Date('2024-01-01T10:00:00Z'), wasCorrect: true },
 *   { cardId: '2', quality: 1, responseTime: 3000, timestamp: new Date('2024-01-01T11:00:00Z'), wasCorrect: false }
 * ];
 *
 * const stats = calculateDailyStats(outcomes, new Date('2024-01-01'));
 * console.log(stats.cardsStudied); // 2
 * console.log(stats.accuracy); // 50
 * console.log(stats.studyTime); // 5 (seconds)
 * ```
 */
export function calculateDailyStats(outcomes: ReviewOutcome[], date: Date): DailyStats {
	const dayStart = new Date(date)
	dayStart.setHours(0, 0, 0, 0)

	const dayEnd = new Date(date)
	dayEnd.setHours(23, 59, 59, 999)

	// Filter outcomes for this specific day
	const dayOutcomes = outcomes.filter(
		(outcome) => outcome.timestamp >= dayStart && outcome.timestamp <= dayEnd,
	)

	const cardsStudied = dayOutcomes.length
	const correctAnswers = dayOutcomes.filter((outcome) => outcome.wasCorrect).length
	const accuracy = cardsStudied > 0 ? (correctAnswers / cardsStudied) * 100 : 0

	// Calculate study time (sum of response times)
	const studyTime = Math.round(
		dayOutcomes.reduce((total, outcome) => total + outcome.responseTime, 0) / 1000,
	)

	// Distinguish between new cards and reviews (simplified heuristic)
	const newCards = dayOutcomes.filter((outcome) => outcome.quality >= 3).length
	const reviewCards = cardsStudied - newCards

	return {
		date: new Date(date),
		cardsStudied,
		accuracy: Math.round(accuracy * 100) / 100,
		studyTime,
		newCards,
		reviewCards,
	}
}

/**
 * Determine if a review outcome should be considered "correct"
 *
 * Simple utility function to determine success based on quality rating.
 * Used consistently across the application for accuracy calculations.
 *
 * @param quality - Quality rating from the review
 * @returns True if the review should be considered correct
 *
 * @example
 * ```ts
 * console.log(isReviewCorrect(1)); // false (Again)
 * console.log(isReviewCorrect(3)); // true (Hard)
 * console.log(isReviewCorrect(4)); // true (Good)
 * console.log(isReviewCorrect(5)); // true (Easy)
 * ```
 */
export function isReviewCorrect(quality: number): boolean {
	// Consider Hard (3), Good (4), and Easy (5) as correct
	// Only Again (1) is considered incorrect
	return quality >= 3
}

/**
 * Calculate learning velocity (cards learned per day)
 *
 * Measures the rate at which new cards are being learned over a specified
 * time period. Useful for tracking learning progress and setting goals.
 *
 * @param reviews - All review data
 * @param daysPeriod - Number of days to calculate over (default: 30)
 * @returns Average cards learned per day
 *
 * @example
 * ```ts
 * const reviews = [
 *   { ease: 2.5, intervalDays: 1, reps: 1, lapses: 0, nextDue: new Date(), lastReviewed: fiveDaysAgo },
 *   { ease: 2.5, intervalDays: 1, reps: 2, lapses: 0, nextDue: new Date(), lastReviewed: tenDaysAgo },
 *   { ease: 2.5, intervalDays: 1, reps: 0, lapses: 0, nextDue: new Date() } // Not learned yet
 * ];
 *
 * const velocity = calculateLearningVelocity(reviews, 30);
 * console.log(velocity); // 0.07 (2 cards learned in 30 days)
 * ```
 */
export function calculateLearningVelocity(reviews: ReviewData[], daysPeriod = 30): number {
	const now = new Date()
	const periodStart = new Date(now.getTime() - daysPeriod * 24 * 60 * 60 * 1000)

	const recentlyLearnedCards = reviews.filter((review) => {
		return review.lastReviewed && review.lastReviewed >= periodStart && review.reps > 0
	})

	return Math.round((recentlyLearnedCards.length / daysPeriod) * 100) / 100
}

/**
 * Get cards that need review (due cards)
 *
 * Filters review data to return only cards that are currently due for review.
 * This is the primary function for determining what cards to show in a study session.
 *
 * @param reviews - All review data
 * @param currentDate - Current date (defaults to now)
 * @returns Array of review data for cards that are due
 *
 * @example
 * ```ts
 * const reviews = [
 *   { ease: 2.5, intervalDays: 1, reps: 1, lapses: 0, nextDue: yesterday }, // Due (overdue)
 *   { ease: 2.5, intervalDays: 1, reps: 1, lapses: 0, nextDue: now }, // Due (today)
 *   { ease: 2.5, intervalDays: 1, reps: 1, lapses: 0, nextDue: tomorrow } // Not due yet
 * ];
 *
 * const dueCards = getDueCards(reviews);
 * console.log(dueCards.length); // 2 (first two cards)
 * ```
 */
export function getDueCards(reviews: ReviewData[], currentDate: Date = new Date()): ReviewData[] {
	return reviews.filter((review) => review.nextDue <= currentDate)
}

/**
 * Get cards that are considered difficult and need extra attention
 *
 * Identifies cards that have poor performance metrics and may benefit from
 * additional study or different learning strategies.
 *
 * @param reviews - All review data
 * @returns Array of review data for difficult cards
 *
 * @example
 * ```ts
 * const reviews = [
 *   { ease: 2.5, intervalDays: 1, reps: 1, lapses: 3, nextDue: new Date() }, // High lapses
 *   { ease: 1.8, intervalDays: 1, reps: 2, lapses: 1, nextDue: new Date() }, // Low ease
 *   { ease: 2.8, intervalDays: 10, reps: 5, lapses: 1, nextDue: new Date() } // Good performance
 * ];
 *
 * const difficultCards = getDifficultCards(reviews);
 * console.log(difficultCards.length); // 2 (first two cards)
 * ```
 */
export function getDifficultCards(reviews: ReviewData[]): ReviewData[] {
	return reviews.filter(
		(review) => review.lapses > 2 || review.ease < 2.0 || (review.reps > 5 && review.ease < 2.2),
	)
}
