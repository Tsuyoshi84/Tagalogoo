import { readonly, ref } from 'vue'
import { useSupabaseUser } from '#imports'
import { calculateNextReview, initializeNewCard } from '../domain/vocabulary/spacedRepetition'
import type { FlashcardData, StudySessionStats } from '../types/vocabulary'
import { useVocabularyData } from './useVocabularyData'

/**
 * Study session state interface
 */
export interface StudySession {
	categoryId: string
	cards: FlashcardData[]
	currentIndex: number
	sessionStats: StudySessionStats
	startTime: Date
	isActive: boolean
}

/**
 * Review submission interface
 */
export interface ReviewSubmission {
	cardId: string
	quality: 1 | 3 | 4 | 5 // Again, Hard, Good, Easy
	responseTime: number
}

/**
 * Composable for managing vocabulary study sessions
 */
export function useVocabularyStudy() {
	const { getDueCards, getNewCards, createReview, updateReview } = useVocabularyData()
	const user = useSupabaseUser()

	// Reactive session state
	const currentSession = ref<StudySession | null>(null)
	const isLoading = ref(false)
	const error = ref<string | null>(null)

	/**
	 * Start a new study session for a category
	 */
	const startSession = async (categoryId: string, maxNewCards = 5): Promise<StudySession> => {
		if (!user.value?.id) {
			throw new Error('User must be authenticated to start study session')
		}

		isLoading.value = true
		error.value = null

		try {
			// Get due cards first
			const dueCards = await getDueCards(categoryId)

			// Get new cards if we need more
			const newCards = dueCards.length < 10 ? await getNewCards(categoryId, maxNewCards) : []

			// Combine and limit total cards
			const allCards = [...dueCards, ...newCards].slice(0, 20) // Max 20 cards per session

			if (allCards.length === 0) {
				throw new Error('No cards available for study in this category')
			}

			const session: StudySession = {
				categoryId,
				cards: allCards,
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
	 * Get the current card being studied
	 */
	const getCurrentCard = (): FlashcardData | null => {
		if (
			!currentSession.value ||
			currentSession.value.currentIndex >= currentSession.value.cards.length
		) {
			return null
		}
		const card = currentSession.value.cards[currentSession.value.currentIndex]
		return card || null
	}

	/**
	 * Submit a review for the current card
	 */
	const submitReview = async (submission: ReviewSubmission): Promise<void> => {
		if (!currentSession.value || !user.value?.id) {
			throw new Error('No active study session or user not authenticated')
		}

		isLoading.value = true
		error.value = null

		try {
			const currentCard = getCurrentCard()
			if (!currentCard || currentCard.id !== submission.cardId) {
				throw new Error('Invalid card for review submission')
			}

			// Calculate SRS data
			const existingReview = currentCard.review
			let reviewData: ReturnType<typeof calculateNextReview>

			if (existingReview) {
				// Update existing review
				reviewData = calculateNextReview(
					{
						ease: existingReview.ease ?? 2.5,
						intervalDays: existingReview.interval_days ?? 0,
						reps: existingReview.reps ?? 0,
						lapses: existingReview.lapses ?? 0,
						nextDue: new Date(existingReview.next_due ?? new Date()),
						lastReviewed: existingReview.last_reviewed
							? new Date(existingReview.last_reviewed)
							: undefined,
					},
					submission.quality,
				)

				await updateReview(submission.cardId, {
					ease: reviewData.ease,
					interval_days: reviewData.intervalDays,
					reps: reviewData.reps,
					lapses: reviewData.lapses,
					next_due: reviewData.nextDue.toISOString().split('T')[0],
					last_reviewed: reviewData.lastReviewed?.toISOString().split('T')[0],
				})
			} else {
				// Create new review
				reviewData = calculateNextReview(initializeNewCard(), submission.quality)

				await createReview(submission.cardId, {
					ease: reviewData.ease,
					interval_days: reviewData.intervalDays,
					reps: reviewData.reps,
					lapses: reviewData.lapses,
					next_due: reviewData.nextDue.toISOString().split('T')[0],
					last_reviewed: reviewData.lastReviewed?.toISOString().split('T')[0],
				})

				// Increment new cards learned if this was a new card
				currentSession.value.sessionStats.newCardsLearned++
			}

			// Update session statistics
			currentSession.value.sessionStats.cardsStudied++
			if (submission.quality >= 4) {
				// Good or Easy
				currentSession.value.sessionStats.correctAnswers++
			}

			// Recalculate accuracy
			currentSession.value.sessionStats.accuracy =
				currentSession.value.sessionStats.cardsStudied > 0
					? (currentSession.value.sessionStats.correctAnswers /
							currentSession.value.sessionStats.cardsStudied) *
						100
					: 0

			// Move to next card
			currentSession.value.currentIndex++
		} catch (err) {
			error.value = err instanceof Error ? err.message : 'Failed to submit review'
			throw err
		} finally {
			isLoading.value = false
		}
	}

	/**
	 * Check if there are more cards in the current session
	 */
	const hasMoreCards = (): boolean => {
		if (!currentSession.value) return false
		return currentSession.value.currentIndex < currentSession.value.cards.length
	}

	/**
	 * Get session progress information
	 */
	const getSessionProgress = () => {
		if (!currentSession.value) return null

		return {
			current: currentSession.value.currentIndex + 1,
			total: currentSession.value.cards.length,
			percentage:
				((currentSession.value.currentIndex + 1) / currentSession.value.cards.length) * 100,
		}
	}

	/**
	 * End the current study session
	 */
	const endSession = (): StudySessionStats => {
		if (!currentSession.value) {
			throw new Error('No active study session to end')
		}

		const endTime = new Date()
		const sessionDuration = Math.round(
			(endTime.getTime() - currentSession.value.startTime.getTime()) / 1000,
		)

		// Update final session stats
		currentSession.value.sessionStats.sessionDuration = sessionDuration
		currentSession.value.isActive = false

		const finalStats = { ...currentSession.value.sessionStats }

		// TODO: Save session stats to daily_stats table
		// This would be implemented when we add the daily stats tracking

		// Clear current session
		currentSession.value = null

		return finalStats
	}

	/**
	 * Cancel the current study session
	 */
	const cancelSession = (): void => {
		if (currentSession.value) {
			currentSession.value.isActive = false
			currentSession.value = null
		}
	}

	/**
	 * Get remaining cards count
	 */
	const getRemainingCardsCount = (): number => {
		if (!currentSession.value) return 0
		return currentSession.value.cards.length - currentSession.value.currentIndex
	}

	return {
		// State
		currentSession: readonly(currentSession),
		isLoading: readonly(isLoading),
		error: readonly(error),

		// Actions
		startSession,
		submitReview,
		endSession,
		cancelSession,

		// Getters
		getCurrentCard,
		hasMoreCards,
		getSessionProgress,
		getRemainingCardsCount,
	}
}
