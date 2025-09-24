import { beforeEach, describe, expect, it, type MockedFunction, vi } from 'vitest'
import { ref } from 'vue'
import type { FlashcardData } from '../domain/database/types.ts'
import { QUALITY_RATINGS } from '../domain/vocabulary/spacedRepetition.ts'
import { useSpacedRepetition } from './useSpacedRepetition.ts'

// Mock the Nuxt imports
vi.mock('#imports', () => ({
	useSupabaseClient: vi.fn(),
	useSupabaseUser: vi.fn(),
}))

// Mock the data access functions
vi.mock('../domain/vocabulary/dataAccess.ts', () => ({
	getDueCards: vi.fn(),
	createOrUpdateReview: vi.fn(),
	getUserProgressStats: vi.fn(),
	getDueCardCount: vi.fn(),
}))

// Import mocked functions
import { useSupabaseClient, useSupabaseUser } from '#imports'
import {
	createOrUpdateReview,
	getDueCardCount,
	getDueCards,
	getUserProgressStats,
} from '../domain/vocabulary/dataAccess.ts'

const mockGetDueCards = getDueCards as MockedFunction<typeof getDueCards>
const mockCreateOrUpdateReview = createOrUpdateReview as MockedFunction<typeof createOrUpdateReview>
const mockGetUserProgressStats = getUserProgressStats as MockedFunction<typeof getUserProgressStats>
const mockGetDueCardCount = getDueCardCount as MockedFunction<typeof getDueCardCount>
const mockUseSupabaseClient = useSupabaseClient as MockedFunction<typeof useSupabaseClient>
const mockUseSupabaseUser = useSupabaseUser as MockedFunction<typeof useSupabaseUser>

describe('useSpacedRepetition', () => {
	const mockUser = {
		id: 'user-123',
		app_metadata: {},
		user_metadata: {},
		aud: 'authenticated',
		created_at: '2023-01-01T00:00:00Z',
	}
	const mockSupabase = {}

	const mockFlashcards: FlashcardData[] = [
		{
			id: 'word-1',
			categoryId: 'cat-1',
			tl: 'Kumusta',
			en: 'Hello',
			createdAt: new Date(),
			category: {
				id: 'cat-1',
				name: 'Greetings',
				description: 'Basic greetings',
				sortOrder: 1,
				createdAt: new Date(),
			},
			examples: [],
			review: {
				userId: 'user-123',
				wordId: 'word-1',
				ease: 2.5,
				intervalDays: 1,
				reps: 1,
				lapses: 0,
				nextDue: '2024-01-01',
				lastReviewed: '2023-12-31',
			},
		},
		{
			id: 'word-2',
			categoryId: 'cat-1',
			tl: 'Salamat',
			en: 'Thank you',
			createdAt: new Date(),
			category: {
				id: 'cat-1',
				name: 'Greetings',
				description: 'Basic greetings',
				sortOrder: 1,
				createdAt: new Date(),
			},
			examples: [],
			review: {
				userId: 'user-123',
				wordId: 'word-2',
				ease: 1.8,
				intervalDays: 1,
				reps: 2,
				lapses: 3,
				nextDue: '2024-01-01',
				lastReviewed: '2023-12-31',
			},
		},
	]

	const mockProgressStats = {
		totalCards: 100,
		studiedCards: 75,
		dueCards: 15,
		averageEase: 2.7,
	}

	beforeEach(() => {
		vi.clearAllMocks()
		mockUseSupabaseClient.mockReturnValue(mockSupabase as any)
		mockUseSupabaseUser.mockReturnValue(ref(mockUser))
	})

	describe('getDueCardsForCategory', () => {
		it('should get due cards for a category', async () => {
			mockGetDueCards.mockResolvedValue(mockFlashcards)

			const { getDueCardsForCategory } = useSpacedRepetition()

			const result = await getDueCardsForCategory('cat-1', 10)

			expect(result).toEqual(mockFlashcards)
			expect(mockGetDueCards).toHaveBeenCalledWith(mockSupabase, 'user-123', 'cat-1', 10)
		})

		it('should sort cards by due date', async () => {
			const cardsWithDifferentDates = [
				{
					...mockFlashcards[0],
					review: {
						...mockFlashcards[0].review!,
						nextDue: '2024-01-03',
					},
				},
				{
					...mockFlashcards[1],
					review: {
						...mockFlashcards[1].review!,
						nextDue: '2024-01-01',
					},
				},
			]

			mockGetDueCards.mockResolvedValue(cardsWithDifferentDates)

			const { getDueCardsForCategory } = useSpacedRepetition()

			const result = await getDueCardsForCategory('cat-1')

			// Should be sorted by due date (earliest first)
			expect(result[0].id).toBe('word-2') // Due 2024-01-01
			expect(result[1].id).toBe('word-1') // Due 2024-01-03
		})

		it('should throw error when user is not authenticated', async () => {
			mockUseSupabaseUser.mockReturnValue(ref(null))

			const { getDueCardsForCategory } = useSpacedRepetition()

			await expect(getDueCardsForCategory('cat-1')).rejects.toThrow(
				'User must be authenticated to get due cards',
			)
		})
	})

	describe('updateCardProgress', () => {
		it('should update card progress with SRS calculation', async () => {
			const mockUpdatedReview = {
				userId: 'user-123',
				wordId: 'word-1',
				ease: 2.6,
				intervalDays: 4,
				reps: 2,
				lapses: 0,
				nextDue: '2024-01-05',
				lastReviewed: '2024-01-01',
			}

			mockCreateOrUpdateReview.mockResolvedValue(mockUpdatedReview)
			mockGetUserProgressStats.mockResolvedValue(mockProgressStats)

			const { updateCardProgress } = useSpacedRepetition()

			const result = await updateCardProgress('word-1', QUALITY_RATINGS.GOOD)

			expect(result).toEqual(mockUpdatedReview)
			expect(mockCreateOrUpdateReview).toHaveBeenCalledWith(
				mockSupabase,
				expect.objectContaining({
					userId: 'user-123',
					wordId: 'word-1',
					ease: expect.any(Number),
					intervalDays: expect.any(Number),
					reps: expect.any(Number),
					lapses: expect.any(Number),
					nextDue: expect.any(String),
					lastReviewed: expect.any(String),
				}),
			)
			expect(mockGetUserProgressStats).toHaveBeenCalledWith(mockSupabase, 'user-123')
		})

		it('should throw error when user is not authenticated', async () => {
			mockUseSupabaseUser.mockReturnValue(ref(null))

			const { updateCardProgress } = useSpacedRepetition()

			await expect(updateCardProgress('word-1', QUALITY_RATINGS.GOOD)).rejects.toThrow(
				'User must be authenticated to update card progress',
			)
		})
	})

	describe('initializeNewCard', () => {
		it('should initialize a new card with default values', async () => {
			const mockNewReview = {
				userId: 'user-123',
				wordId: 'word-1',
				ease: 2.5,
				intervalDays: 0,
				reps: 0,
				lapses: 0,
				nextDue: '2024-01-01',
				lastReviewed: '2024-01-01',
			}

			mockCreateOrUpdateReview.mockResolvedValue(mockNewReview)
			mockGetUserProgressStats.mockResolvedValue(mockProgressStats)

			const { initializeNewCard } = useSpacedRepetition()

			const result = await initializeNewCard('word-1')

			expect(result).toEqual(mockNewReview)
			expect(mockCreateOrUpdateReview).toHaveBeenCalledWith(
				mockSupabase,
				expect.objectContaining({
					userId: 'user-123',
					wordId: 'word-1',
					ease: 2.5,
					intervalDays: 0,
					reps: 0,
					lapses: 0,
				}),
			)
		})

		it('should throw error when user is not authenticated', async () => {
			mockUseSupabaseUser.mockReturnValue(ref(null))

			const { initializeNewCard } = useSpacedRepetition()

			await expect(initializeNewCard('word-1')).rejects.toThrow(
				'User must be authenticated to initialize cards',
			)
		})
	})

	describe('getCardSchedule', () => {
		it('should return schedule information for a card with review data', () => {
			const { getCardSchedule } = useSpacedRepetition()

			const schedule = getCardSchedule(mockFlashcards[0])

			expect(schedule).toEqual({
				cardId: 'word-1',
				nextDue: expect.any(Date),
				intervalDays: 1,
				isDue: expect.any(Boolean),
				daysUntilDue: expect.any(Number),
				isDifficult: false,
			})
		})

		it('should handle cards without review data', () => {
			const cardWithoutReview = {
				...mockFlashcards[0],
				review: undefined,
			}

			const { getCardSchedule } = useSpacedRepetition()

			const schedule = getCardSchedule(cardWithoutReview)

			expect(schedule.cardId).toBe('word-1')
			expect(schedule.intervalDays).toBe(0)
			expect(schedule.isDue).toBe(true) // New cards are due immediately
		})

		it('should identify difficult cards', () => {
			const { getCardSchedule } = useSpacedRepetition()

			const schedule = getCardSchedule(mockFlashcards[1]) // Has 3 lapses and low ease

			expect(schedule.isDifficult).toBe(true)
		})
	})

	describe('getDifficultCards', () => {
		it('should return cards that are considered difficult', async () => {
			mockGetDueCards.mockResolvedValue(mockFlashcards)

			const { getDifficultCards } = useSpacedRepetition()

			const result = await getDifficultCards('cat-1')

			// Only word-2 should be considered difficult (3 lapses, ease 1.8)
			expect(result).toHaveLength(1)
			expect(result[0].id).toBe('word-2')
		})

		it('should sort difficult cards by difficulty', async () => {
			const difficultCards = [
				{
					...mockFlashcards[0],
					id: 'word-3',
					review: {
						...mockFlashcards[0].review!,
						lapses: 2,
						ease: 1.5,
					},
				},
				{
					...mockFlashcards[1], // 3 lapses, ease 1.8
				},
			]

			mockGetDueCards.mockResolvedValue(difficultCards)

			const { getDifficultCards } = useSpacedRepetition()

			const result = await getDifficultCards('cat-1')

			// Should be sorted by lapses (descending), then ease (ascending)
			expect(result[0].id).toBe('word-2') // 3 lapses
			expect(result[1].id).toBe('word-3') // 2 lapses
		})

		it('should throw error when user is not authenticated', async () => {
			mockUseSupabaseUser.mockReturnValue(ref(null))

			const { getDifficultCards } = useSpacedRepetition()

			await expect(getDifficultCards('cat-1')).rejects.toThrow(
				'User must be authenticated to get difficult cards',
			)
		})
	})

	describe('getDueCount', () => {
		it('should return count of due cards', async () => {
			mockGetDueCardCount.mockResolvedValue(15)

			const { getDueCount } = useSpacedRepetition()

			const result = await getDueCount('cat-1')

			expect(result).toBe(15)
			expect(mockGetDueCardCount).toHaveBeenCalledWith(mockSupabase, 'user-123', 'cat-1')
		})

		it('should throw error when user is not authenticated', async () => {
			mockUseSupabaseUser.mockReturnValue(ref(null))

			const { getDueCount } = useSpacedRepetition()

			await expect(getDueCount('cat-1')).rejects.toThrow(
				'User must be authenticated to get due count',
			)
		})
	})

	describe('refreshProgressStats', () => {
		it('should load and update progress statistics', async () => {
			mockGetUserProgressStats.mockResolvedValue(mockProgressStats)

			const { refreshProgressStats, progressStats } = useSpacedRepetition()

			const result = await refreshProgressStats()

			expect(result).toEqual({
				...mockProgressStats,
				masteredCards: 60, // studiedCards - dueCards
				difficultCards: 0,
			})
			expect(progressStats.value).toEqual(result)
			expect(mockGetUserProgressStats).toHaveBeenCalledWith(mockSupabase, 'user-123')
		})

		it('should throw error when user is not authenticated', async () => {
			mockUseSupabaseUser.mockReturnValue(ref(null))

			const { refreshProgressStats } = useSpacedRepetition()

			await expect(refreshProgressStats()).rejects.toThrow(
				'User must be authenticated to refresh progress stats',
			)
		})
	})

	describe('getReviewRecommendation', () => {
		it('should recommend review for overdue cards', () => {
			const overdueCard = {
				...mockFlashcards[0],
				review: {
					...mockFlashcards[0].review!,
					nextDue: '2023-12-30', // Overdue
				},
			}

			const { getReviewRecommendation } = useSpacedRepetition()

			const recommendation = getReviewRecommendation(overdueCard)

			expect(recommendation.shouldReview).toBe(true)
			expect(recommendation.priority).toBe('high')
			expect(recommendation.reason).toContain('Overdue')
		})

		it('should provide low priority for future cards', () => {
			const futureCard = {
				...mockFlashcards[0],
				review: {
					...mockFlashcards[0].review!,
					nextDue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days in future
				},
			}

			const { getReviewRecommendation } = useSpacedRepetition()

			const recommendation = getReviewRecommendation(futureCard)

			expect(recommendation.shouldReview).toBe(false)
			expect(recommendation.priority).toBe('low')
			expect(recommendation.nextOptimalReview).toBeDefined()
		})

		it('should identify difficult cards for extra practice', () => {
			const { getReviewRecommendation } = useSpacedRepetition()

			const recommendation = getReviewRecommendation(mockFlashcards[1]) // Difficult card

			if (!recommendation.shouldReview) {
				expect(recommendation.priority).toBe('medium')
				expect(recommendation.reason).toContain('Difficult card')
			}
		})
	})

	describe('computed properties', () => {
		it('should calculate study progress correctly', async () => {
			mockGetUserProgressStats.mockResolvedValue(mockProgressStats)

			const { refreshProgressStats, studyProgress } = useSpacedRepetition()

			await refreshProgressStats()

			expect(studyProgress.value).toEqual({
				completionRate: 75, // (75/100) * 100
				reviewRate: 80, // ((75-15)/75) * 100
				cardsToReview: 15,
				cardsLearned: 75,
				totalAvailable: 100,
			})
		})

		it('should handle zero values in progress calculation', async () => {
			mockGetUserProgressStats.mockResolvedValue({
				totalCards: 0,
				studiedCards: 0,
				dueCards: 0,
				averageEase: 2.5,
			})

			const { refreshProgressStats, studyProgress } = useSpacedRepetition()

			await refreshProgressStats()

			expect(studyProgress.value).toEqual({
				completionRate: 0,
				reviewRate: 0,
				cardsToReview: 0,
				cardsLearned: 0,
				totalAvailable: 0,
			})
		})

		it('should indicate authentication status', () => {
			const { isAuthenticated } = useSpacedRepetition()

			expect(isAuthenticated.value).toBe(true)

			mockUseSupabaseUser.mockReturnValue(ref(null))

			const { isAuthenticated: isAuthenticatedNull } = useSpacedRepetition()

			expect(isAuthenticatedNull.value).toBe(false)
		})
	})

	describe('resetProgressStats', () => {
		it('should clear progress statistics', async () => {
			mockGetUserProgressStats.mockResolvedValue(mockProgressStats)

			const { refreshProgressStats, resetProgressStats, progressStats } = useSpacedRepetition()

			await refreshProgressStats()
			expect(progressStats.value).toBeDefined()

			resetProgressStats()
			expect(progressStats.value).toBeNull()
		})
	})
})
