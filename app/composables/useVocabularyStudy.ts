import { computed, type Ref, readonly, ref } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'
import type { FlashcardData, StudySessionStats } from '../domain/database/types.ts'
import { createOrUpdateReview, getDueCards } from '../domain/vocabulary/dataAccess.ts'
import type { QualityRating } from '../domain/vocabulary/spacedRepetition.ts'
import { calculateNextReview, initializeCard } from '../domain/vocabulary/spacedRepetition.ts'

/**
 * Review result data structure for tracking individual card reviews
 */
export interface ReviewResult {
	cardId: string
	quality: QualityRating
	responseTime: number
	timestamp: Date
}

/**
 * Study session state and configuration
 */
export interface StudySession {
	categoryId?: string
	dueCards: FlashcardData[]
	currentIndex: number
	sessionStats: StudySessionStats
	startTime: Date
	isActive: boolean
}

/**
 * Composable for managing vocabulary study sessions
 *
 * Provides reactive state management for flashcard study sessions including:
 * - Session initialization and card loading
 * - Current card navigation and progress tracking
 * - Review submission with SRS calculations
 * - Session statistics and completion handling
 *
 * @example
 * ```vue
 * <script setup>
 * const {
 *   currentSession,
 *   currentCard,
 *   sessionProgress,
 *   startSession,
 *   submitReview,
 *   endSession
 * } = useVocabularyStudy()
 *
 * // Start a study session for a specific category
 * await startSession('greetings-category-id')
 *
 * // Submit a review for the current card
 * await submitReview({
 *   cardId: currentCard.value.id,
 *   quality: 4, // GOOD
 *   responseTime: 3500,
 *   timestamp: new Date()
 * })
 * </script>
 * ```
 */
export function useVocabularyStudy() {
	const supabase = useSupabaseClient()
	const user = useSupabaseUser()

	// Session state
	const currentSession: Ref<StudySession | null> = ref(null)
	const isLoading = ref(false)
	const error = ref<string | null>(null)

	// Computed properties for easy access to session data
	const currentCard = computed(() => {
		if (
			!currentSession.value ||
			currentSession.value.currentIndex >= currentSession.value.dueCards.length
		) {
			return null
		}
		return currentSession.value.dueCards[currentSession.value.currentIndex]
	})

	const sessionProgress = computed(() => {
		if (!currentSession.value) {
			return { current: 0, total: 0, percentage: 0 }
		}

		const current = currentSession.value.currentIndex
		const total = currentSession.value.dueCards.length
		const percentage = total > 0 ? Math.round((current / total) * 100) : 0

		return { current, total, percentage }
	})

	const isSessionActive = computed(() => {
		return currentSession.value?.isActive ?? false
	})

	const hasMoreCards = computed(() => {
		if (!currentSession.value) return false
		return currentSession.value.currentIndex < currentSession.value.dueCards.length
	})

	/**
	 * Start a new study session for the specified category
	 *
	 * Loads due cards for the category and initializes session state.
	 * If no categoryId is provided, loads due cards from all categories.
	 *
	 * @param categoryId - Optional category ID to filter cards by
	 * @param limit - Optional limit on number of cards to load (default: 20)
	 * @returns Promise resolving to the initialized study session
	 * @throws Error if user is not authenticated or card loading fails
	 */
	async function startSession(categoryId?: string, limit = 20): Promise<StudySession> {
		if (!user.value) {
			throw new Error('User must be authenticated to start a study session')
		}

		isLoading.value = true
		error.value = null

		try {
			// Load due cards for the session
			const dueCards = await getDueCards(supabase, user.value.id, categoryId, limit)

			if (dueCards.length === 0) {
				throw new Error('No cards are due for review in this category')
			}

			// Initialize session state
			const session: StudySession = {
				categoryId,
				dueCards,
				currentIndex: 0,
				sessionStats: {
					cardsStudied: 0,
					correctAnswers: 0,
					accuracy: 0,
					sessionDuration: 0,
					newCardsLearned: 0,
				},
				startTime: new Date(),
				isActive: true,
			}

			currentSession.value = session
			return session
		} catch (err) {
			error.value = err instanceof Error ? err.message : 'Failed to start study session'
			throw err
		} finally {
			isLoading.value = false
		}
	}

	/**
	 * Submit a review for the current card and advance to the next card
	 *
	 * Calculates the next review interval using the SRS algorithm and updates
	 * the card's progress in the database. Updates session statistics and
	 * advances to the next card.
	 *
	 * @param result - Review result containing quality rating and timing data
	 * @returns Promise resolving when the review is processed and saved
	 * @throws Error if no active session or review processing fails
	 */
	async function submitReview(result: ReviewResult): Promise<void> {
		if (!currentSession.value || !user.value) {
			throw new Error('No active study session or user not authenticated')
		}

		if (!currentCard.value) {
			throw new Error('No current card to review')
		}

		isLoading.value = true
		error.value = null

		try {
			const card = currentCard.value

			// Get current review data or initialize new card
			const currentReview = card.review
				? {
						ease: card.review.ease ?? 2.5,
						intervalDays: card.review.intervalDays ?? 0,
						reps: card.review.reps ?? 0,
						lapses: card.review.lapses ?? 0,
						nextDue:
							typeof card.review.nextDue === 'string'
								? new Date(card.review.nextDue)
								: (card.review.nextDue ?? new Date()),
						lastReviewed: card.review.lastReviewed
							? typeof card.review.lastReviewed === 'string'
								? new Date(card.review.lastReviewed)
								: card.review.lastReviewed
							: undefined,
					}
				: initializeCard()

			// Calculate next review using SRS algorithm
			const nextReview = calculateNextReview(currentReview, result.quality)

			// Save updated review to database
			await createOrUpdateReview(supabase, {
				userId: user.value.id,
				wordId: card.id,
				ease: nextReview.ease,
				intervalDays: nextReview.intervalDays,
				reps: nextReview.reps,
				lapses: nextReview.lapses,
				nextDue: nextReview.nextDue.toISOString().split('T')[0], // Convert to date string
				lastReviewed: new Date().toISOString().split('T')[0],
			})

			// Update session statistics
			const session = currentSession.value
			session.sessionStats.cardsStudied += 1

			// Count as correct if quality >= 3 (Hard, Good, or Easy)
			if (result.quality >= 3) {
				session.sessionStats.correctAnswers += 1
			}

			// Count as new card learned if this was the first review
			if (!card.review) {
				session.sessionStats.newCardsLearned += 1
			}

			// Update accuracy percentage
			session.sessionStats.accuracy = Math.round(
				(session.sessionStats.correctAnswers / session.sessionStats.cardsStudied) * 100,
			)

			// Advance to next card
			session.currentIndex += 1
		} catch (err) {
			error.value = err instanceof Error ? err.message : 'Failed to submit review'
			throw err
		} finally {
			isLoading.value = false
		}
	}

	/**
	 * Get the next card in the session without submitting a review
	 *
	 * Advances to the next card in the session. Useful for skipping cards
	 * or navigating through the session.
	 *
	 * @returns The next flashcard data or null if no more cards
	 */
	function getNextCard(): FlashcardData | null {
		if (!currentSession.value) return null

		currentSession.value.currentIndex += 1
		return currentCard.value || null
	}

	/**
	 * End the current study session and calculate final statistics
	 *
	 * Marks the session as inactive, calculates final session duration,
	 * and returns comprehensive session statistics.
	 *
	 * @returns Promise resolving to final session statistics
	 * @throws Error if no active session exists
	 */
	function endSession(): StudySessionStats {
		if (!currentSession.value) {
			throw new Error('No active study session to end')
		}

		const session = currentSession.value

		// Calculate session duration in seconds
		const endTime = new Date()
		const durationMs = endTime.getTime() - session.startTime.getTime()
		session.sessionStats.sessionDuration = Math.round(durationMs / 1000)

		// Mark session as inactive
		session.isActive = false

		// Return final statistics
		const finalStats = { ...session.sessionStats }

		// Clear current session
		currentSession.value = null

		return finalStats
	}

	/**
	 * Reset the current session state
	 *
	 * Clears all session data and resets to initial state.
	 * Useful for canceling a session or starting fresh.
	 */
	function resetSession(): void {
		currentSession.value = null
		error.value = null
		isLoading.value = false
	}

	/**
	 * Get session statistics for the current active session
	 *
	 * @returns Current session statistics or null if no active session
	 */
	function getCurrentStats(): StudySessionStats | null {
		return currentSession.value?.sessionStats ?? null
	}

	return {
		// State
		currentSession: readonly(currentSession),
		isLoading: readonly(isLoading),
		error: readonly(error),

		// Computed properties
		currentCard,
		sessionProgress,
		isSessionActive,
		hasMoreCards,

		// Methods
		startSession,
		submitReview,
		getNextCard,
		endSession,
		resetSession,
		getCurrentStats,
	}
}
