import { readonly, ref } from 'vue'
import { useSupabaseUser } from '#imports'
import { calculateNextReview } from '../domain/vocabulary/spacedRepetition'
import type { FlashcardData, StudySessionStats } from '../types/vocabulary'
import { useVocabularyData } from './useVocabularyData'

/**
 * Difficult words review session interface
 */
export interface DifficultWordsSession {
	cards: FlashcardData[]
	currentIndex: number
	sessionStats: StudySessionStats
	startTime: Date
	isActive: boolean
	improvedWords: string[] // Track words that improved during session
}

/**
 * Review submission interface for difficult words
 */
export interface DifficultWordsReviewSubmission {
	cardId: string
	quality: 1 | 3 | 4 | 5 // Again, Hard, Good, Easy
	responseTime: number
}

/**
 * Composable for managing difficult words review sessions
 */
export function useDifficultWordsReview() {
	const { getDifficultWords, updateReview } = useVocabularyData()
	const user = useSupabaseUser()

	// Reactive session state
	const currentSession = ref<DifficultWordsSession | null>(null)
	const isLoading = ref(false)
	const error = ref<string | null>(null)

	/**
	 * Start a new difficult words review session
	 */
	const startDifficultWordsSession = async (
		categoryId?: string,
	): Promise<DifficultWordsSession> => {
		if (!user.value?.id) {
			throw new Error('User must be authenticated to start difficult words review')
		}

		isLoading.value = true
		error.value = null

		try {
			const difficultCards = await getDifficultWords(categoryId)

			if (difficultCards.length === 0) {
				throw new Error('No difficult words found. Great job!')
			}

			const session: DifficultWordsSession = {
				cards: difficultCards,
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
				improvedWords: [],
			}

			currentSession.value = session
			return session
		} catch (err) {
			error.value = err instanceof Error ? err.message : 'Failed to start difficult words review'
			throw err
		} finally {
			isLoading.value = false
		}
	}

	/**
	 * Get the current card being reviewed
	 */
	const getCurrentCard = (): FlashcardData | null => {
		if (
			!currentSession.value ||
			currentSession.value.currentIndex >= currentSession.value.cards.length
		) {
			return null
		}
		return currentSession.value.cards[currentSession.value.currentIndex] || null
	}

	/**
	 * Submit a review for the current difficult word
	 */
	const submitDifficultWordReview = async (
		submission: DifficultWordsReviewSubmission,
	): Promise<void> => {
		if (!currentSession.value || !user.value?.id) {
			throw new Error('No active difficult words session or user not authenticated')
		}

		isLoading.value = true
		error.value = null

		try {
			const currentCard = getCurrentCard()
			if (!currentCard || currentCard.id !== submission.cardId) {
				throw new Error('Invalid card for review submission')
			}

			const existingReview = currentCard.review
			if (!existingReview) {
				throw new Error('Difficult word must have existing review data')
			}

			// Calculate SRS data
			const reviewData = calculateNextReview(
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

			// Track if word improved (Good or Easy response)
			if (submission.quality >= 4) {
				currentSession.value.improvedWords.push(submission.cardId)
				currentSession.value.sessionStats.correctAnswers++
			}

			// Update session statistics
			currentSession.value.sessionStats.cardsStudied++

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
			error.value = err instanceof Error ? err.message : 'Failed to submit difficult word review'
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
	 * Get improved words count
	 */
	const getImprovedWordsCount = (): number => {
		return currentSession.value?.improvedWords.length || 0
	}

	/**
	 * Check if a word was improved during this session
	 */
	const isWordImproved = (wordId: string): boolean => {
		return currentSession.value?.improvedWords.includes(wordId) || false
	}

	/**
	 * End the current difficult words review session
	 */
	const endSession = (): StudySessionStats & { improvedWords: number } => {
		if (!currentSession.value) {
			throw new Error('No active difficult words session to end')
		}

		const endTime = new Date()
		const sessionDuration = Math.round(
			(endTime.getTime() - currentSession.value.startTime.getTime()) / 1000,
		)

		// Update final session stats
		currentSession.value.sessionStats.sessionDuration = sessionDuration
		currentSession.value.isActive = false

		const finalStats = {
			...currentSession.value.sessionStats,
			improvedWords: currentSession.value.improvedWords.length,
		}

		// Clear current session
		currentSession.value = null

		return finalStats
	}

	/**
	 * Cancel the current difficult words review session
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
		startDifficultWordsSession,
		submitDifficultWordReview,
		endSession,
		cancelSession,

		// Getters
		getCurrentCard,
		hasMoreCards,
		getSessionProgress,
		getRemainingCardsCount,
		getImprovedWordsCount,
		isWordImproved,
	}
}
