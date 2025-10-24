import { readonly, ref } from 'vue'
import { useSupabaseUser } from '#imports'
import {
	calculateDifficulty,
	calculateNextReview,
	initializeNewCard,
	isCardDue,
	type ReviewData,
	type ReviewResult,
} from '../domain/vocabulary/spacedRepetition'
import type { FlashcardData, ProgressStats, Review } from '../types/vocabulary'
import { useVocabularyData } from './useVocabularyData'

/**
 * Card scheduling interface
 */
export interface CardSchedule {
	cardId: string
	nextDue: Date
	intervalDays: number
	difficulty: 'new' | 'learning' | 'review' | 'difficult'
	priority: number
}

/**
 * Progress tracking interface
 */
export interface StudyProgress {
	totalCards: number
	newCards: number
	learningCards: number
	reviewCards: number
	difficultCards: number
	dueToday: number
	completionRate: number
}

/**
 * Helper function to convert Review to ReviewData
 */
function reviewToReviewData(review: Review): ReviewData {
	return {
		ease: review.ease ?? 2.5,
		intervalDays: review.interval_days ?? 0,
		reps: review.reps ?? 0,
		lapses: review.lapses ?? 0,
		nextDue: new Date(review.next_due ?? new Date()),
		lastReviewed: review.last_reviewed ? new Date(review.last_reviewed) : undefined,
	}
}

/**
 * Composable for spaced repetition system operations
 */
export function useSpacedRepetition() {
	const { getUserReview, createReview, updateReview } = useVocabularyData()
	const user = useSupabaseUser()

	const isLoading = ref(false)
	const error = ref<string | null>(null)

	/**
	 * Calculate next review date and interval for a card
	 */
	const calculateCardSchedule = async (
		wordId: string,
		quality: 1 | 3 | 4 | 5,
	): Promise<ReviewData> => {
		if (!user.value?.id) {
			throw new Error('User must be authenticated to calculate card schedule')
		}

		isLoading.value = true
		error.value = null

		try {
			const existingReview = await getUserReview(wordId)

			let currentReviewData: ReviewData

			if (existingReview) {
				currentReviewData = reviewToReviewData(existingReview)
			} else {
				currentReviewData = initializeNewCard()
			}

			return calculateNextReview(currentReviewData, quality)
		} catch (err) {
			error.value = err instanceof Error ? err.message : 'Failed to calculate card schedule'
			throw err
		} finally {
			isLoading.value = false
		}
	}

	/**
	 * Update card progress after review
	 */
	const updateCardProgress = async (
		wordId: string,
		quality: 1 | 3 | 4 | 5,
		_responseTime?: number,
	): Promise<Review> => {
		if (!user.value?.id) {
			throw new Error('User must be authenticated to update card progress')
		}

		isLoading.value = true
		error.value = null

		try {
			const newReviewData = await calculateCardSchedule(wordId, quality)
			const existingReview = await getUserReview(wordId)

			const reviewUpdate = {
				ease: newReviewData.ease,
				interval_days: newReviewData.intervalDays,
				reps: newReviewData.reps,
				lapses: newReviewData.lapses,
				next_due: newReviewData.nextDue.toISOString().split('T')[0],
				last_reviewed: newReviewData.lastReviewed?.toISOString().split('T')[0],
			}

			if (existingReview) {
				return await updateReview(wordId, reviewUpdate)
			} else {
				return await createReview(wordId, reviewUpdate)
			}
		} catch (err) {
			error.value = err instanceof Error ? err.message : 'Failed to update card progress'
			throw err
		} finally {
			isLoading.value = false
		}
	}

	/**
	 * Initialize a new card for spaced repetition
	 */
	const initializeCard = async (wordId: string): Promise<Review> => {
		if (!user.value?.id) {
			throw new Error('User must be authenticated to initialize card')
		}

		isLoading.value = true
		error.value = null

		try {
			const initialData = initializeNewCard()

			return await createReview(wordId, {
				ease: initialData.ease,
				interval_days: initialData.intervalDays,
				reps: initialData.reps,
				lapses: initialData.lapses,
				next_due: initialData.nextDue.toISOString().split('T')[0],
				last_reviewed: initialData.lastReviewed?.toISOString().split('T')[0],
			})
		} catch (err) {
			error.value = err instanceof Error ? err.message : 'Failed to initialize card'
			throw err
		} finally {
			isLoading.value = false
		}
	}

	/**
	 * Get cards due for review
	 */
	const getDueCardsForReview = (
		cards: FlashcardData[],
		currentDate: Date = new Date(),
	): FlashcardData[] => {
		return cards.filter((card) => isCardDueForReview(card, currentDate))
	}

	/**
	 * Sort cards by study priority
	 */
	const sortCardsByStudyPriority = (cards: FlashcardData[]): FlashcardData[] => {
		return [...cards].sort((a, b) => {
			// New cards (no review data) come first
			if (!a.review && !b.review) return 0
			if (!a.review) return -1
			if (!b.review) return 1

			// Sort by due date (earliest first)
			const aNextDue = new Date(a.review.next_due ?? new Date())
			const bNextDue = new Date(b.review.next_due ?? new Date())
			return aNextDue.getTime() - bNextDue.getTime()
		})
	}

	/**
	 * Get cards marked as difficult
	 */
	const getDifficultCardsForReview = (cards: FlashcardData[]): FlashcardData[] => {
		return cards.filter((card) => getCardDifficulty(card) === 'difficult')
	}

	/**
	 * Check if a card is due for review
	 */
	const isCardDueForReview = (card: FlashcardData, currentDate: Date = new Date()): boolean => {
		if (!card.review) return true // New cards are always due

		const reviewData = reviewToReviewData(card.review)
		return isCardDue(reviewData, currentDate)
	}

	/**
	 * Get card difficulty level
	 */
	const getCardDifficulty = (card: FlashcardData): 'new' | 'learning' | 'review' | 'difficult' => {
		if (!card.review) return 'new'

		const reviewData = reviewToReviewData(card.review)
		return calculateDifficulty(reviewData)
	}

	/**
	 * Calculate study progress statistics
	 */
	const calculateStudyProgress = (cards: FlashcardData[]): StudyProgress => {
		const totalCards = cards.length
		let newCards = 0
		let learningCards = 0
		let reviewCards = 0
		let difficultCards = 0
		let dueToday = 0

		const today = new Date()

		for (const card of cards) {
			const difficulty = getCardDifficulty(card)
			const isDue = isCardDueForReview(card, today)

			switch (difficulty) {
				case 'new':
					newCards++
					break
				case 'learning':
					learningCards++
					break
				case 'review':
					reviewCards++
					break
				case 'difficult':
					difficultCards++
					break
			}

			if (isDue) {
				dueToday++
			}
		}

		const learnedCards = learningCards + reviewCards + difficultCards
		const completionRate = totalCards > 0 ? (learnedCards / totalCards) * 100 : 0

		return {
			totalCards,
			newCards,
			learningCards,
			reviewCards,
			difficultCards,
			dueToday,
			completionRate,
		}
	}

	/**
	 * Get card schedule information
	 */
	const getCardSchedule = (card: FlashcardData): CardSchedule => {
		const difficulty = getCardDifficulty(card)
		const nextDue = card.review ? new Date(card.review.next_due ?? new Date()) : new Date()
		const intervalDays = card.review ? (card.review.interval_days ?? 0) : 0

		// Calculate priority (lower number = higher priority)
		let priority = 0
		switch (difficulty) {
			case 'new':
				priority = 1
				break
			case 'learning':
				priority = 2
				break
			case 'difficult':
				priority = 3
				break
			case 'review':
				priority = 4
				break
		}

		// Adjust priority based on how overdue the card is
		const now = new Date()
		const daysPastDue = Math.max(
			0,
			Math.floor((now.getTime() - nextDue.getTime()) / (1000 * 60 * 60 * 24)),
		)
		priority -= daysPastDue * 0.1 // More overdue = higher priority

		return {
			cardId: card.id,
			nextDue,
			intervalDays,
			difficulty,
			priority,
		}
	}

	/**
	 * Calculate progress statistics from review results
	 */
	const calculateProgressFromResults = (
		cards: FlashcardData[],
		recentResults: ReviewResult[],
	): ProgressStats => {
		const reviews: ReviewData[] = cards
			.filter((card) => card.review)
			.map((card) => ({
				ease: card.review?.ease ?? 2.5,
				intervalDays: card.review?.interval_days ?? 0,
				reps: card.review?.reps ?? 0,
				lapses: card.review?.lapses ?? 0,
				nextDue: new Date(card.review?.next_due ?? new Date()),
				lastReviewed: card.review?.last_reviewed ? new Date(card.review.last_reviewed) : undefined,
			}))

		return {
			totalWords: cards.length,
			wordsLearned: reviews.filter((r) => r.reps >= 1).length,
			wordsReviewed: reviews.length,
			currentStreak: calculateCurrentStreak(recentResults),
			longestStreak: calculateLongestStreak(recentResults),
			averageAccuracy:
				recentResults.length > 0
					? (recentResults.filter((r) => r.quality >= 4).length / recentResults.length) * 100
					: 0,
			totalStudyTime: 0, // Not calculated from review results
		}
	}

	/**
	 * Calculate current streak from review results
	 */
	const calculateCurrentStreak = (results: ReviewResult[]): number => {
		let streak = 0
		for (let i = results.length - 1; i >= 0; i--) {
			const result = results[i]
			if (result && result.quality >= 4) {
				streak++
			} else {
				break
			}
		}
		return streak
	}

	/**
	 * Calculate longest streak from review results
	 */
	const calculateLongestStreak = (results: ReviewResult[]): number => {
		let longestStreak = 0
		let currentStreak = 0

		for (const result of results) {
			if (result.quality >= 4) {
				currentStreak++
				longestStreak = Math.max(longestStreak, currentStreak)
			} else {
				currentStreak = 0
			}
		}

		return longestStreak
	}

	return {
		// State
		isLoading: readonly(isLoading),
		error: readonly(error),

		// Card scheduling
		calculateCardSchedule,
		updateCardProgress,
		initializeCard,

		// Card filtering and sorting
		getDueCardsForReview,
		sortCardsByStudyPriority,
		getDifficultCardsForReview,
		isCardDueForReview,

		// Card analysis
		getCardDifficulty,
		getCardSchedule,

		// Progress calculation
		calculateStudyProgress,
		calculateProgressFromResults,
		calculateCurrentStreak,
		calculateLongestStreak,
	}
}
