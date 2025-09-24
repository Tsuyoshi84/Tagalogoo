import { beforeEach, describe, expect, it, type MockedFunction, vi } from 'vitest'
import { ref } from 'vue'
import type { FlashcardData } from '../domain/database/types.ts'
import { QUALITY_RATINGS } from '../domain/vocabulary/spacedRepetition.ts'
import { useVocabularyStudy } from './useVocabularyStudy.ts'

// Mock the Nuxt imports
vi.mock('#imports', () => ({
	useSupabaseClient: vi.fn(),
	useSupabaseUser: vi.fn(),
}))

// Mock the data access functions
vi.mock('../domain/vocabulary/dataAccess.ts', () => ({
	getDueCards: vi.fn(),
	createOrUpdateReview: vi.fn(),
}))

// Import mocked functions
import { useSupabaseClient, useSupabaseUser } from '#imports'
import { createOrUpdateReview, getDueCards } from '../domain/vocabulary/dataAccess.ts'

const mockGetDueCards = getDueCards as MockedFunction<typeof getDueCards>
const mockCreateOrUpdateReview = createOrUpdateReview as MockedFunction<typeof createOrUpdateReview>
const mockUseSupabaseClient = useSupabaseClient as MockedFunction<typeof useSupabaseClient>
const mockUseSupabaseUser = useSupabaseUser as MockedFunction<typeof useSupabaseUser>

describe('useVocabularyStudy', () => {
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
			examples: [
				{
					id: 'ex-1',
					wordId: 'word-1',
					tl: 'Kumusta ka?',
					en: 'How are you?',
					audioUrl: null,
					createdAt: new Date(),
				},
			],
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
			examples: [
				{
					id: 'ex-2',
					wordId: 'word-2',
					tl: 'Salamat po',
					en: 'Thank you (polite)',
					audioUrl: null,
					createdAt: new Date(),
				},
			],
		},
	]

	beforeEach(() => {
		vi.clearAllMocks()
		mockUseSupabaseClient.mockReturnValue(mockSupabase as any)
		mockUseSupabaseUser.mockReturnValue(ref(mockUser))
	})

	describe('startSession', () => {
		it('should start a new study session with due cards', async () => {
			mockGetDueCards.mockResolvedValue(mockFlashcards)

			const { startSession, currentSession, currentCard, sessionProgress } = useVocabularyStudy()

			const session = await startSession('cat-1', 10)

			expect(session).toBeDefined()
			expect(session.categoryId).toBe('cat-1')
			expect(session.dueCards).toEqual(mockFlashcards)
			expect(session.currentIndex).toBe(0)
			expect(session.isActive).toBe(true)
			expect(session.sessionStats.cardsStudied).toBe(0)

			expect(currentSession.value).toEqual(session)
			expect(currentCard.value).toEqual(mockFlashcards[0])
			expect(sessionProgress.value).toEqual({
				current: 0,
				total: 2,
				percentage: 0,
			})

			expect(mockGetDueCards).toHaveBeenCalledWith(mockSupabase, 'user-123', 'cat-1', 10)
		})

		it('should throw error when no cards are due', async () => {
			mockGetDueCards.mockResolvedValue([])

			const { startSession } = useVocabularyStudy()

			await expect(startSession('cat-1')).rejects.toThrow(
				'No cards are due for review in this category',
			)
		})

		it('should throw error when user is not authenticated', async () => {
			mockUseSupabaseUser.mockReturnValue(ref(null))

			const { startSession } = useVocabularyStudy()

			await expect(startSession('cat-1')).rejects.toThrow(
				'User must be authenticated to start a study session',
			)
		})

		it('should start session without category filter', async () => {
			mockGetDueCards.mockResolvedValue(mockFlashcards)

			const { startSession } = useVocabularyStudy()

			await startSession()

			expect(mockGetDueCards).toHaveBeenCalledWith(mockSupabase, 'user-123', undefined, 20)
		})
	})

	describe('submitReview', () => {
		it('should submit a review and advance to next card', async () => {
			mockGetDueCards.mockResolvedValue(mockFlashcards)
			mockCreateOrUpdateReview.mockResolvedValue({
				userId: 'user-123',
				wordId: 'word-1',
				ease: 2.5,
				intervalDays: 1,
				reps: 1,
				lapses: 0,
				nextDue: '2024-01-02',
				lastReviewed: '2024-01-01',
			})

			const { startSession, submitReview, currentCard, sessionProgress } = useVocabularyStudy()

			await startSession('cat-1')

			expect(currentCard.value?.id).toBe('word-1')
			expect(sessionProgress.value.current).toBe(0)

			await submitReview({
				cardId: 'word-1',
				quality: QUALITY_RATINGS.GOOD,
				responseTime: 3000,
				timestamp: new Date(),
			})

			expect(currentCard.value?.id).toBe('word-2')
			expect(sessionProgress.value.current).toBe(1)

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
		})

		it('should update session statistics correctly', async () => {
			mockGetDueCards.mockResolvedValue(mockFlashcards)
			mockCreateOrUpdateReview.mockResolvedValue({
				userId: 'user-123',
				wordId: 'word-1',
				ease: 2.5,
				intervalDays: 1,
				reps: 1,
				lapses: 0,
				nextDue: '2024-01-02',
				lastReviewed: '2024-01-01',
			})

			const { startSession, submitReview, getCurrentStats } = useVocabularyStudy()

			await startSession('cat-1')

			// Submit correct answer
			await submitReview({
				cardId: 'word-1',
				quality: QUALITY_RATINGS.GOOD,
				responseTime: 3000,
				timestamp: new Date(),
			})

			const stats = getCurrentStats()
			expect(stats?.cardsStudied).toBe(1)
			expect(stats?.correctAnswers).toBe(1)
			expect(stats?.accuracy).toBe(100)
			expect(stats?.newCardsLearned).toBe(1)
		})

		it('should handle incorrect answers', async () => {
			mockGetDueCards.mockResolvedValue(mockFlashcards)
			mockCreateOrUpdateReview.mockResolvedValue({
				userId: 'user-123',
				wordId: 'word-1',
				ease: 2.5,
				intervalDays: 1,
				reps: 0,
				lapses: 1,
				nextDue: '2024-01-02',
				lastReviewed: '2024-01-01',
			})

			const { startSession, submitReview, getCurrentStats } = useVocabularyStudy()

			await startSession('cat-1')

			// Submit incorrect answer
			await submitReview({
				cardId: 'word-1',
				quality: QUALITY_RATINGS.AGAIN,
				responseTime: 5000,
				timestamp: new Date(),
			})

			const stats = getCurrentStats()
			expect(stats?.cardsStudied).toBe(1)
			expect(stats?.correctAnswers).toBe(0)
			expect(stats?.accuracy).toBe(0)
		})

		it('should throw error when no active session', async () => {
			const { submitReview } = useVocabularyStudy()

			await expect(
				submitReview({
					cardId: 'word-1',
					quality: QUALITY_RATINGS.GOOD,
					responseTime: 3000,
					timestamp: new Date(),
				}),
			).rejects.toThrow('No active study session or user not authenticated')
		})
	})

	describe('endSession', () => {
		it('should end session and return final statistics', async () => {
			mockGetDueCards.mockResolvedValue(mockFlashcards)

			const { startSession, endSession, isSessionActive } = useVocabularyStudy()

			await startSession('cat-1')
			expect(isSessionActive.value).toBe(true)

			// Add a small delay to ensure duration > 0
			await new Promise((resolve) => setTimeout(resolve, 10))

			const finalStats = await endSession()

			expect(finalStats).toBeDefined()
			expect(finalStats.sessionDuration).toBeGreaterThanOrEqual(0)
			expect(isSessionActive.value).toBe(false)
		})

		it('should throw error when no active session', async () => {
			const { endSession } = useVocabularyStudy()

			await expect(endSession()).rejects.toThrow('No active study session to end')
		})
	})

	describe('getNextCard', () => {
		it('should advance to next card without submitting review', async () => {
			mockGetDueCards.mockResolvedValue(mockFlashcards)

			const { startSession, getNextCard, currentCard } = useVocabularyStudy()

			await startSession('cat-1')
			expect(currentCard.value?.id).toBe('word-1')

			const nextCard = getNextCard()
			expect(nextCard?.id).toBe('word-2')
			expect(currentCard.value?.id).toBe('word-2')
		})

		it('should return null when no active session', () => {
			const { getNextCard } = useVocabularyStudy()

			const result = getNextCard()
			expect(result).toBeNull()
		})
	})

	describe('resetSession', () => {
		it('should clear session state', async () => {
			mockGetDueCards.mockResolvedValue(mockFlashcards)

			const { startSession, resetSession, currentSession, isSessionActive } = useVocabularyStudy()

			await startSession('cat-1')
			expect(isSessionActive.value).toBe(true)

			resetSession()
			expect(currentSession.value).toBeNull()
			expect(isSessionActive.value).toBe(false)
		})
	})

	describe('computed properties', () => {
		it('should calculate session progress correctly', async () => {
			mockGetDueCards.mockResolvedValue(mockFlashcards)

			const { startSession, sessionProgress, getNextCard } = useVocabularyStudy()

			await startSession('cat-1')

			expect(sessionProgress.value).toEqual({
				current: 0,
				total: 2,
				percentage: 0,
			})

			getNextCard()

			expect(sessionProgress.value).toEqual({
				current: 1,
				total: 2,
				percentage: 50,
			})

			getNextCard()

			expect(sessionProgress.value).toEqual({
				current: 2,
				total: 2,
				percentage: 100,
			})
		})

		it('should indicate when there are more cards', async () => {
			mockGetDueCards.mockResolvedValue(mockFlashcards)

			const { startSession, hasMoreCards, getNextCard } = useVocabularyStudy()

			await startSession('cat-1')

			expect(hasMoreCards.value).toBe(true)

			getNextCard() // Move to card 2
			expect(hasMoreCards.value).toBe(true)

			getNextCard() // Move past last card
			expect(hasMoreCards.value).toBe(false)
		})
	})
})
