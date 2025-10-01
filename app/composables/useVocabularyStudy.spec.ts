import { beforeEach, describe, expect, it, type MockedFunction, vi } from 'vitest'
import { ref, toRaw } from 'vue'
import type { FlashcardData } from '../types/vocabulary'
import { useVocabularyData } from './useVocabularyData'
import type { StudySession } from './useVocabularyStudy.ts'
import { useVocabularyStudy } from './useVocabularyStudy.ts'

// Mock the dependencies
vi.mock('./useVocabularyData', () => ({
	useVocabularyData: vi.fn(() => ({
		getDueCards: vi.fn(),
		getNewCards: vi.fn(),
		createReview: vi.fn(),
		updateReview: vi.fn(),
	})),
}))

const { mockUseSupabaseUser } = vi.hoisted(() => ({
	mockUseSupabaseUser: vi.fn(),
}))

vi.mock('#imports', () => ({
	useSupabaseUser: mockUseSupabaseUser,
}))

const mockedUseVocabularyData = vi.mocked(useVocabularyData)

// Mock data
const mockCategory = {
	id: 'cat-1',
	name: 'Test Category',
	description: 'Test category description',
	sort_order: 1,
	created_at: new Date().toISOString(),
	wordCount: 10,
}

const mockFlashcardData: FlashcardData[] = [
	{
		id: 'word-1',
		category_id: 'cat-1',
		tl: 'Kumusta',
		en: 'How are you?',
		created_at: new Date().toISOString(),
		examples: [
			{
				id: 'ex-1',
				word_id: 'word-1',
				tl: 'Kumusta ka?',
				en: 'How are you?',
				audio_url: null,
				created_at: new Date().toISOString(),
			},
		],
		category: mockCategory,
		review: {
			user_id: 'test-user-id',
			word_id: 'word-1',
			ease: 2.5,
			interval_days: 1,
			reps: 1,
			lapses: 0,
			next_due: new Date().toISOString().split('T')[0] as string,
			last_reviewed: new Date().toISOString().split('T')[0] as string,
		},
	},
	{
		id: 'word-2',
		category_id: 'cat-1',
		tl: 'Salamat',
		en: 'Thank you',
		created_at: new Date().toISOString(),
		examples: [
			{
				id: 'ex-2',
				word_id: 'word-2',
				tl: 'Salamat sa iyo',
				en: 'Thank you',
				audio_url: null,
				created_at: new Date().toISOString(),
			},
		],
		category: mockCategory,
	},
]

describe('useVocabularyStudy', () => {
	let mockVocabularyData: {
		getDueCards: MockedFunction<any>
		getNewCards: MockedFunction<any>
		createReview: MockedFunction<any>
		updateReview: MockedFunction<any>
	}

	beforeEach(() => {
		vi.clearAllMocks()
		mockUseSupabaseUser.mockReset()
		mockUseSupabaseUser.mockImplementation(() => ref({ id: 'test-user-id' }))
		mockedUseVocabularyData.mockReset()

		mockVocabularyData = {
			getDueCards: vi.fn(),
			getNewCards: vi.fn(),
			createReview: vi.fn(),
			updateReview: vi.fn(),
		}

		mockedUseVocabularyData.mockImplementation(() => mockVocabularyData as any)
	})

	describe('startSession', () => {
		it('should start a study session with due and new cards', async () => {
			// Setup mocks
			mockVocabularyData.getDueCards.mockResolvedValue([mockFlashcardData[0]])
			mockVocabularyData.getNewCards.mockResolvedValue([mockFlashcardData[1]])

			const { startSession, currentSession } = useVocabularyStudy()

			// Start session
			const session = await startSession('cat-1')

			// Verify session was created correctly
			expect(session).toBeDefined()
			expect(session.categoryId).toBe('cat-1')
			expect(session.cards).toHaveLength(2)
			expect(session.currentIndex).toBe(0)
			expect(session.isActive).toBe(true)
			expect(session.sessionStats.cardsStudied).toBe(0)
			expect(session.sessionStats.correctAnswers).toBe(0)
			expect(session.sessionStats.newCardsLearned).toBe(0)

			// Verify reactive state
			expect(currentSession.value).toEqual(session)

			// Verify API calls
			expect(mockVocabularyData.getDueCards).toHaveBeenCalledWith('cat-1')
			expect(mockVocabularyData.getNewCards).toHaveBeenCalledWith('cat-1', 5)
		})

		it('should handle empty card list', async () => {
			mockVocabularyData.getDueCards.mockResolvedValue([])
			mockVocabularyData.getNewCards.mockResolvedValue([])

			const { startSession } = useVocabularyStudy()

			await expect(startSession('cat-1')).rejects.toThrow(
				'No cards available for study in this category',
			)
		})

		it('should limit cards to maximum of 20', async () => {
			const manyCards = Array.from({ length: 25 }, (_, i) => ({
				...mockFlashcardData[0],
				id: `word-${i}`,
			}))

			mockVocabularyData.getDueCards.mockResolvedValue(manyCards)
			mockVocabularyData.getNewCards.mockResolvedValue([])

			const { startSession } = useVocabularyStudy()
			const session = await startSession('cat-1')

			expect(session.cards).toHaveLength(20)
		})
	})

	describe('getCurrentCard', () => {
		it('should return the current card', async () => {
			mockVocabularyData.getDueCards.mockResolvedValue([mockFlashcardData[0]])
			mockVocabularyData.getNewCards.mockResolvedValue([mockFlashcardData[1]])

			const { startSession, getCurrentCard } = useVocabularyStudy()
			await startSession('cat-1')

			const currentCard = getCurrentCard()
			expect(currentCard).toEqual(mockFlashcardData[0])
		})

		it('should return null when no session is active', () => {
			const { getCurrentCard } = useVocabularyStudy()
			expect(getCurrentCard()).toBeNull()
		})

		it('should return null when all cards are completed', async () => {
			mockVocabularyData.getDueCards.mockResolvedValue([mockFlashcardData[0]])
			mockVocabularyData.getNewCards.mockResolvedValue([])

			const { startSession, getCurrentCard, currentSession } = useVocabularyStudy()
			await startSession('cat-1')

			// Manually set index beyond cards length
			const writableSession = currentSession.value
				? (toRaw(currentSession.value) as unknown as StudySession)
				: null
			if (writableSession) {
				writableSession.currentIndex = 1
			}

			expect(getCurrentCard()).toBeNull()
		})
	})

	describe('submitReview', () => {
		it('should submit review for existing card and update stats', async () => {
			mockVocabularyData.getDueCards.mockResolvedValue([mockFlashcardData[0]])
			mockVocabularyData.getNewCards.mockResolvedValue([])
			mockVocabularyData.updateReview.mockResolvedValue({})

			const { startSession, submitReview, currentSession } = useVocabularyStudy()
			await startSession('cat-1')

			await submitReview({
				cardId: 'word-1',
				quality: 4, // Good
				responseTime: 3000,
			})

			// Verify review was updated
			expect(mockVocabularyData.updateReview).toHaveBeenCalledWith(
				'word-1',
				expect.objectContaining({
					ease: expect.any(Number),
					interval_days: expect.any(Number),
					reps: expect.any(Number),
					lapses: expect.any(Number),
					next_due: expect.any(String),
					last_reviewed: expect.any(String),
				}),
			)

			// Verify session stats were updated
			expect(currentSession.value?.sessionStats.cardsStudied).toBe(1)
			expect(currentSession.value?.sessionStats.correctAnswers).toBe(1)
			expect(currentSession.value?.sessionStats.accuracy).toBe(100)
			expect(currentSession.value?.currentIndex).toBe(1)
		})

		it('should create review for new card', async () => {
			mockVocabularyData.getDueCards.mockResolvedValue([])
			mockVocabularyData.getNewCards.mockResolvedValue([mockFlashcardData[1]]) // Card without review
			mockVocabularyData.createReview.mockResolvedValue({})

			const { startSession, submitReview, currentSession } = useVocabularyStudy()
			await startSession('cat-1')

			await submitReview({
				cardId: 'word-2',
				quality: 4, // Good
				responseTime: 3000,
			})

			// Verify review was created
			expect(mockVocabularyData.createReview).toHaveBeenCalledWith(
				'word-2',
				expect.objectContaining({
					ease: expect.any(Number),
					interval_days: expect.any(Number),
					reps: expect.any(Number),
					lapses: expect.any(Number),
					next_due: expect.any(String),
					last_reviewed: expect.any(String),
				}),
			)

			// Verify new card was counted
			expect(currentSession.value?.sessionStats.newCardsLearned).toBe(1)
		})

		it('should handle incorrect answers', async () => {
			mockVocabularyData.getDueCards.mockResolvedValue([mockFlashcardData[0]])
			mockVocabularyData.getNewCards.mockResolvedValue([])
			mockVocabularyData.updateReview.mockResolvedValue({})

			const { startSession, submitReview, currentSession } = useVocabularyStudy()
			await startSession('cat-1')

			await submitReview({
				cardId: 'word-1',
				quality: 1, // Again
				responseTime: 3000,
			})

			// Verify session stats reflect incorrect answer
			expect(currentSession.value?.sessionStats.cardsStudied).toBe(1)
			expect(currentSession.value?.sessionStats.correctAnswers).toBe(0)
			expect(currentSession.value?.sessionStats.accuracy).toBe(0)
		})

		it('should throw error for invalid card ID', async () => {
			mockVocabularyData.getDueCards.mockResolvedValue([mockFlashcardData[0]])
			mockVocabularyData.getNewCards.mockResolvedValue([])

			const { startSession, submitReview } = useVocabularyStudy()
			await startSession('cat-1')

			await expect(
				submitReview({
					cardId: 'invalid-id',
					quality: 4,
					responseTime: 3000,
				}),
			).rejects.toThrow('Invalid card for review submission')
		})
	})

	describe('session management', () => {
		it('should track session progress correctly', async () => {
			mockVocabularyData.getDueCards.mockResolvedValue([mockFlashcardData[0]])
			mockVocabularyData.getNewCards.mockResolvedValue([mockFlashcardData[1]])

			const { startSession, getSessionProgress } = useVocabularyStudy()
			await startSession('cat-1')

			const progress = getSessionProgress()
			expect(progress).toEqual({
				current: 1,
				total: 2,
				percentage: 50,
			})
		})

		it('should check if more cards are available', async () => {
			mockVocabularyData.getDueCards.mockResolvedValue([mockFlashcardData[0]])
			mockVocabularyData.getNewCards.mockResolvedValue([])

			const { startSession, hasMoreCards, currentSession } = useVocabularyStudy()
			await startSession('cat-1')

			expect(hasMoreCards()).toBe(true)

			// Move to end
			const writableSession = currentSession.value
				? (toRaw(currentSession.value) as unknown as StudySession)
				: null
			if (writableSession) {
				writableSession.currentIndex = 1
			}

			expect(hasMoreCards()).toBe(false)
		})

		it('should end session and return final stats', async () => {
			mockVocabularyData.getDueCards.mockResolvedValue([mockFlashcardData[0]])
			mockVocabularyData.getNewCards.mockResolvedValue([])

			const { startSession, endSession, currentSession } = useVocabularyStudy()
			await startSession('cat-1')

			// Simulate some study activity
			const writableSession = currentSession.value
				? (toRaw(currentSession.value) as unknown as StudySession)
				: null
			if (writableSession) {
				writableSession.sessionStats.cardsStudied = 1
				writableSession.sessionStats.correctAnswers = 1
				writableSession.startTime = new Date(Date.now() - 1500)
			}

			const finalStats = await endSession()

			expect(finalStats.cardsStudied).toBe(1)
			expect(finalStats.correctAnswers).toBe(1)
			expect(finalStats.sessionDuration).toBeGreaterThan(0)
			expect(currentSession.value).toBeNull()
		})

		it('should cancel session', async () => {
			mockVocabularyData.getDueCards.mockResolvedValue([mockFlashcardData[0]])
			mockVocabularyData.getNewCards.mockResolvedValue([])

			const { startSession, cancelSession, currentSession } = useVocabularyStudy()
			await startSession('cat-1')

			expect(currentSession.value).not.toBeNull()

			cancelSession()

			expect(currentSession.value).toBeNull()
		})
	})
})
