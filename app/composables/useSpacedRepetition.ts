import { computed, type Ref, readonly, ref } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'
import type { FlashcardData, Review } from '../domain/database/types.ts'
import {
	createOrUpdateReview,
	getDueCardCount,
	getDueCards,
	getUserProgressStats,
} from '../domain/vocabulary/dataAccess.ts'
import type { QualityRating, ReviewData } from '../domain/vocabulary/spacedRepetition.ts'
import {
	calculateNextReview,
	getDaysUntilDue,
	initializeCard,
	isCardDue,
	isDifficultCard,
} from '../domain/vocabulary/spacedRepetition.ts'

/**
 * Helper function to convert database review data to domain ReviewData
 */
function convertToReviewData(review: Review): ReviewData {
	return {
		ease: review.ease ?? 2.5,
		intervalDays: review.intervalDays ?? 0,
		reps: review.reps ?? 0,
		lapses: review.lapses ?? 0,
		nextDue:
			typeof review.nextDue === 'string'
				? new Date(review.nextDue)
				: (review.nextDue ?? new Date()),
		lastReviewed: review.lastReviewed
			? typeof review.lastReviewed === 'string'
				? new Date(review.lastReviewed)
				: review.lastReviewed
			: undefined,
	}
}

/**
 * Progress statistics for user's vocabulary learning
 */
export interface ProgressStats {
	totalCards: number
	studiedCards: number
	dueCards: number
	averageEase: number
	masteredCards: number
	difficultCards: number
}

/**
 * Card scheduling information
 */
export interface CardSchedule {
	cardId: string
	nextDue: Date
	intervalDays: number
	isDue: boolean
	daysUntilDue: number
	isDifficult: boolean
}

/**
 * Composable for managing spaced repetition system
 *
 * Provides reactive state management for the SRS algorithm including:
 * - Card scheduling and due date calculations
 * - Progress tracking and statistics computation
 * - Functions for initializing new cards and updating existing reviews
 * - Difficulty assessment and card filtering
 *
 * @example
 * ```vue
 * <script setup>
 * const {
 *   progressStats,
 *   getDueCardsForCategory,
 *   updateCardProgress,
 *   getCardSchedule,
 *   refreshStats
 * } = useSpacedRepetition()
 *
 * // Get due cards for study
 * const dueCards = await getDueCardsForCategory('greetings-cat')
 *
 * // Update a card after review
 * await updateCardProgress('word-1', 4) // GOOD quality
 *
 * // Check card schedule
 * const schedule = getCardSchedule(cardData)
 * </script>
 * ```
 */
export function useSpacedRepetition() {
	const supabase = useSupabaseClient()
	const user = useSupabaseUser()

	// Reactive state
	const progressStats: Ref<ProgressStats | null> = ref(null)
	const isLoading = ref(false)
	const error = ref<string | null>(null)

	// Computed properties
	const isAuthenticated = computed(() => !!user.value)

	const studyProgress = computed(() => {
		if (!progressStats.value) return null

		const { totalCards, studiedCards, dueCards } = progressStats.value
		const completionRate = totalCards > 0 ? Math.round((studiedCards / totalCards) * 100) : 0
		const reviewRate =
			studiedCards > 0 ? Math.round(((studiedCards - dueCards) / studiedCards) * 100) : 0

		return {
			completionRate,
			reviewRate,
			cardsToReview: dueCards,
			cardsLearned: studiedCards,
			totalAvailable: totalCards,
		}
	})

	/**
	 * Get due cards for a specific category with SRS scheduling information
	 *
	 * Loads cards that are due for review and enriches them with scheduling data.
	 * Cards are sorted by due date (overdue cards first).
	 *
	 * @param categoryId - Optional category ID to filter by
	 * @param limit - Optional limit on number of cards to return
	 * @returns Promise resolving to array of due flashcards
	 * @throws Error if user is not authenticated or loading fails
	 */
	async function getDueCardsForCategory(
		categoryId?: string,
		limit?: number,
	): Promise<FlashcardData[]> {
		if (!user.value) {
			throw new Error('User must be authenticated to get due cards')
		}

		isLoading.value = true
		error.value = null

		try {
			const dueCards = await getDueCards(supabase, user.value.id, categoryId, limit)

			// Sort by due date (overdue cards first, then by due date)
			return dueCards.sort((a, b) => {
				const aReview = a.review ? convertToReviewData(a.review) : initializeCard()
				const bReview = b.review ? convertToReviewData(b.review) : initializeCard()

				return aReview.nextDue.getTime() - bReview.nextDue.getTime()
			})
		} catch (err) {
			error.value = err instanceof Error ? err.message : 'Failed to load due cards'
			throw err
		} finally {
			isLoading.value = false
		}
	}

	/**
	 * Update card progress after a review session
	 *
	 * Calculates the next review interval using the SRS algorithm and updates
	 * the card's progress in the database. Automatically handles new cards
	 * by initializing them with default values.
	 *
	 * @param wordId - ID of the word being reviewed
	 * @param quality - Quality rating (1=Again, 3=Hard, 4=Good, 5=Easy)
	 * @returns Promise resolving to updated review data
	 * @throws Error if user is not authenticated or update fails
	 */
	async function updateCardProgress(wordId: string, quality: QualityRating): Promise<Review> {
		if (!user.value) {
			throw new Error('User must be authenticated to update card progress')
		}

		isLoading.value = true
		error.value = null

		try {
			// Get current review data or initialize new card
			const currentReview: ReviewData = {
				ease: 2.5,
				intervalDays: 0,
				reps: 0,
				lapses: 0,
				nextDue: new Date(),
			}

			// Calculate next review using SRS algorithm
			const nextReview = calculateNextReview(currentReview, quality)

			// Save updated review to database
			const updatedReview = await createOrUpdateReview(supabase, {
				userId: user.value.id,
				wordId,
				ease: nextReview.ease,
				intervalDays: nextReview.intervalDays,
				reps: nextReview.reps,
				lapses: nextReview.lapses,
				nextDue: nextReview.nextDue.toISOString().split('T')[0], // Convert to date string
				lastReviewed: new Date().toISOString().split('T')[0],
			})

			// Refresh progress stats after update
			await refreshProgressStats()

			return updatedReview
		} catch (err) {
			error.value = err instanceof Error ? err.message : 'Failed to update card progress'
			throw err
		} finally {
			isLoading.value = false
		}
	}

	/**
	 * Initialize a new card for first-time study
	 *
	 * Creates initial review data for a word that hasn't been studied before.
	 * The card will be scheduled for immediate review.
	 *
	 * @param wordId - ID of the word to initialize
	 * @returns Promise resolving to initialized review data
	 * @throws Error if user is not authenticated or initialization fails
	 */
	async function initializeNewCard(wordId: string): Promise<Review> {
		if (!user.value) {
			throw new Error('User must be authenticated to initialize cards')
		}

		isLoading.value = true
		error.value = null

		try {
			const initialData = initializeCard()

			const newReview = await createOrUpdateReview(supabase, {
				userId: user.value.id,
				wordId,
				ease: initialData.ease,
				intervalDays: initialData.intervalDays,
				reps: initialData.reps,
				lapses: initialData.lapses,
				nextDue: initialData.nextDue.toISOString().split('T')[0],
				lastReviewed: new Date().toISOString().split('T')[0],
			})

			// Refresh progress stats after initialization
			await refreshProgressStats()

			return newReview
		} catch (err) {
			error.value = err instanceof Error ? err.message : 'Failed to initialize new card'
			throw err
		} finally {
			isLoading.value = false
		}
	}

	/**
	 * Get scheduling information for a flashcard
	 *
	 * Analyzes the card's review data to provide scheduling information
	 * including due status, difficulty assessment, and timing details.
	 *
	 * @param card - Flashcard data with optional review information
	 * @returns Card scheduling information
	 */
	function getCardSchedule(card: FlashcardData): CardSchedule {
		const reviewData = card.review ? convertToReviewData(card.review) : initializeCard()

		return {
			cardId: card.id,
			nextDue: reviewData.nextDue,
			intervalDays: reviewData.intervalDays,
			isDue: isCardDue(reviewData),
			daysUntilDue: getDaysUntilDue(reviewData),
			isDifficult: isDifficultCard(reviewData),
		}
	}

	/**
	 * Get cards that are considered difficult for focused review
	 *
	 * Filters cards based on difficulty criteria (high lapse count, low ease factor).
	 * Useful for creating focused review sessions on challenging vocabulary.
	 *
	 * @param categoryId - Optional category ID to filter by
	 * @param limit - Optional limit on number of cards to return
	 * @returns Promise resolving to array of difficult flashcards
	 * @throws Error if user is not authenticated or loading fails
	 */
	async function getDifficultCards(categoryId?: string, limit?: number): Promise<FlashcardData[]> {
		if (!user.value) {
			throw new Error('User must be authenticated to get difficult cards')
		}

		isLoading.value = true
		error.value = null

		try {
			// Get all cards for the category (not just due cards)
			const allCards = await getDueCards(supabase, user.value.id, categoryId)

			// Filter for difficult cards
			const difficultCards = allCards.filter((card) => {
				if (!card.review) return false
				return isDifficultCard(convertToReviewData(card.review))
			})

			// Sort by difficulty (most lapses first, then lowest ease)
			const sortedCards = difficultCards.sort((a, b) => {
				// We can safely assert that review exists since difficultCards filters for it
				const aReview = a.review as NonNullable<typeof a.review>
				const bReview = b.review as NonNullable<typeof b.review>

				// First sort by lapses (descending)
				const aLapses = aReview.lapses ?? 0
				const bLapses = bReview.lapses ?? 0
				if (aLapses !== bLapses) {
					return bLapses - aLapses
				}

				// Then by ease (ascending - lower ease = more difficult)
				const aEase = aReview.ease ?? 2.5
				const bEase = bReview.ease ?? 2.5
				return aEase - bEase
			})

			return limit ? sortedCards.slice(0, limit) : sortedCards
		} catch (err) {
			error.value = err instanceof Error ? err.message : 'Failed to load difficult cards'
			throw err
		} finally {
			isLoading.value = false
		}
	}

	/**
	 * Get count of due cards for a category
	 *
	 * Efficiently counts cards that are due for review without loading full card data.
	 * Useful for displaying review counts in category lists.
	 *
	 * @param categoryId - Optional category ID to filter by
	 * @returns Promise resolving to count of due cards
	 * @throws Error if user is not authenticated or counting fails
	 */
	async function getDueCount(categoryId?: string): Promise<number> {
		if (!user.value) {
			throw new Error('User must be authenticated to get due count')
		}

		try {
			return await getDueCardCount(supabase, user.value.id, categoryId)
		} catch (err) {
			error.value = err instanceof Error ? err.message : 'Failed to get due count'
			throw err
		}
	}

	/**
	 * Refresh progress statistics from the database
	 *
	 * Loads current progress statistics and updates reactive state.
	 * Should be called after card updates to keep stats current.
	 *
	 * @returns Promise resolving to updated progress statistics
	 * @throws Error if user is not authenticated or loading fails
	 */
	async function refreshProgressStats(): Promise<ProgressStats> {
		if (!user.value) {
			throw new Error('User must be authenticated to refresh progress stats')
		}

		isLoading.value = true
		error.value = null

		try {
			const stats = await getUserProgressStats(supabase, user.value.id)

			// Calculate additional derived statistics
			const masteredCards = stats.studiedCards - stats.dueCards
			const difficultCards = 0 // This would need a separate query to count difficult cards

			const enhancedStats: ProgressStats = {
				...stats,
				masteredCards,
				difficultCards,
			}

			progressStats.value = enhancedStats
			return enhancedStats
		} catch (err) {
			error.value = err instanceof Error ? err.message : 'Failed to refresh progress stats'
			throw err
		} finally {
			isLoading.value = false
		}
	}

	/**
	 * Calculate optimal review schedule for a card
	 *
	 * Provides recommendations for when to review a card based on its current
	 * performance and the SRS algorithm. Useful for study planning.
	 *
	 * @param card - Flashcard data with review information
	 * @returns Scheduling recommendations
	 */
	function getReviewRecommendation(card: FlashcardData): {
		shouldReview: boolean
		priority: 'high' | 'medium' | 'low'
		reason: string
		nextOptimalReview?: Date
	} {
		const schedule = getCardSchedule(card)

		if (schedule.isDue) {
			const priority = schedule.daysUntilDue < -1 ? 'high' : 'medium'
			const reason =
				schedule.daysUntilDue < 0
					? `Overdue by ${Math.abs(schedule.daysUntilDue)} days`
					: 'Due for review'

			return {
				shouldReview: true,
				priority,
				reason,
			}
		}

		if (schedule.isDifficult) {
			return {
				shouldReview: false,
				priority: 'medium',
				reason: 'Difficult card - consider extra practice',
				nextOptimalReview: schedule.nextDue,
			}
		}

		return {
			shouldReview: false,
			priority: 'low',
			reason: `Next review in ${schedule.daysUntilDue} days`,
			nextOptimalReview: schedule.nextDue,
		}
	}

	/**
	 * Reset progress statistics cache
	 *
	 * Clears cached progress data. Useful when switching users or
	 * when you want to force a fresh load of statistics.
	 */
	function resetProgressStats(): void {
		progressStats.value = null
		error.value = null
	}

	return {
		// State
		progressStats: readonly(progressStats),
		isLoading: readonly(isLoading),
		error: readonly(error),

		// Computed properties
		isAuthenticated,
		studyProgress,

		// Methods
		getDueCardsForCategory,
		updateCardProgress,
		initializeNewCard,
		getCardSchedule,
		getDifficultCards,
		getDueCount,
		refreshProgressStats,
		getReviewRecommendation,
		resetProgressStats,
	}
}
