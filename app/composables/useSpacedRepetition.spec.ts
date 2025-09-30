import { beforeEach, describe, expect, it, type MockedFunction, vi } from 'vitest'
import { ref } from 'vue'
import type { ReviewResult } from '../domain/vocabulary/spacedRepetition'
import type { FlashcardData, Review } from '../types/vocabulary'
import { useSpacedRepetition } from './useSpacedRepetition'

// Mock the dependencies
vi.mock('./useVocabularyData', () => ({
	useVocabularyData: vi.fn(() => ({
		getUserReview: vi.fn(),
		createReview: vi.fn(),
		updateReview: vi.fn(),
	})),
}))

vi.mock('#app/composables/useSupabaseUser', () => ({
	useSupabaseUser: vi.fn(() => ref({ id: 'test-user-id' })),
}))

// Mock data
const mockCategory = {
	id: 'cat-1',
	name: 'Test Category',
	description: 'Test category description',
	sort_order: 1,
	created_at: new Date().toISOString(),
	wordCount: 10,
}

const mockReview: Review = {
	user_id: 'test-user-id',
	word_id: 'word-1',
	ease: 2.5,
	interval_days: 1,
	reps: 1,
	lapses: 0,
	next_due: new Date().toISOString().split('T')[0] as string,
	last_reviewed: new Date().toISOString().split('T')[0] as string,
}

const mockFlashcardData: FlashcardData[] = [
	{
		id: 'word-1',
		category_id: 'cat-1',
		tl: 'Kumusta',
		en: 'How are you?',
		created_at: new Date().toISOString(),
		examples: [],
		category: mockCategory,
		review: mockReview,
	},
	{
		id: 'word-2',
		category_id: 'cat-1',
		tl: 'Salamat',
		en: 'Thank you',
		created_at: new Date().toISOString(),
		examples: [],
		category: mockCategory,
		// No review - new card
	},
	{
		id: 'word-3',
		category_id: 'cat-1',
		tl: 'Paalam',
		en: 'Goodbye',
		created_at: new Date().toISOString(),
		examples: [],
		category: mockCategory,
		review: {
			...mockReview,
			word_id: 'word-3',
			ease: 1.8,
			lapses: 3,
			reps: 5,
		},
	},
]

describe('useSpacedRepetition', () => {
	let mockVocabularyData: {
		getUserReview: MockedFunction<any>
		createReview: MockedFunction<any>
		updateReview: MockedFunction<any>
	}

	beforeEach(() => {
		vi.clearAllMocks()

		// Get the mocked functions
		const { useVocabularyData } = require('./useVocabularyData')
		mockVocabularyData = useVocabularyData() as any
	})

	describe('calculateCardSchedule', () => {
		it('should calculate schedule for existing card', async () => {
			mockVocabularyData.getUserReview.mockResolvedValue(mockReview)

			const { calculateCardSchedule } = useSpacedRepetition()
			const result = await calculateCardSchedule('word-1', 4) // Good

			expect(result).toBeDefined()
			expect(result.ease).toBeGreaterThan(0)
			expect(result.intervalDays).toBeGreaterThan(0)
			expect(result.reps).toBe(2) // Should increment
			expect(result.nextDue).toBeInstanceOf(Date)
			expect(mockVocabularyData.getUserReview).toHaveBeenCalledWith('word-1')
		})

		it('should calculate schedule for new card', async () => {
			mockVocabularyData.getUserReview.mockResolvedValue(null)

			const { calculateCardSchedule } = useSpacedRepetition()
			const result = await calculateCardSchedule('word-2', 4) // Good

			expect(result).toBeDefined()
			expect(result.ease).toBe(2.5) // Default ease
			expect(result.reps).toBe(1) // First review
			expect(result.lapses).toBe(0)
		})

		it('should handle "Again" quality correctly', async () => {
			mockVocabularyData.getUserReview.mockResolvedValue(mockReview)

			const { calculateCardSchedule } = useSpacedRepetition()
			const result = await calculateCardSchedule('word-1', 1) // Again

			expect(result.intervalDays).toBe(0)
			expect(result.reps).toBe(0) // Reset to 0
			expect(result.lapses).toBe(1) // Increment lapses
		})
	})

	describe('updateCardProgress', () => {
		it('should update existing card review', async () => {
			mockVocabularyData.getUserReview.mockResolvedValue(mockReview)
			mockVocabularyData.updateReview.mockResolvedValue({ ...mockReview, reps: 2 })

			const { updateCardProgress } = useSpacedRepetition()
			const result = await updateCardProgress('word-1', 4)

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
			expect(result).toBeDefined()
		})

		it('should create new card review', async () => {
			mockVocabularyData.getUserReview.mockResolvedValue(null)
			mockVocabularyData.createReview.mockResolvedValue({ ...mockReview, word_id: 'word-2' })

			const { updateCardProgress } = useSpacedRepetition()
			const result = await updateCardProgress('word-2', 4)

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
			expect(result).toBeDefined()
		})
	})

	describe('initializeCard', () => {
		it('should initialize a new card', async () => {
			mockVocabularyData.createReview.mockResolvedValue({ ...mockReview, word_id: 'word-new' })

			const { initializeCard } = useSpacedRepetition()
			const result = await initializeCard('word-new')

			expect(mockVocabularyData.createReview).toHaveBeenCalledWith(
				'word-new',
				expect.objectContaining({
					ease: 2.5,
					interval_days: 0,
					reps: 0,
					lapses: 0,
					next_due: expect.any(String),
				}),
			)
			expect(result).toBeDefined()
		})
	})

	describe('card filtering and analysis', () => {
		it('should identify due cards', () => {
			const { getDueCardsForReview, isCardDueForReview } = useSpacedRepetition()

			// Set up cards with different due dates
			const cards: FlashcardData[] = [
				{
					...mockFlashcardData[0]!,
					review: { ...mockReview, next_due: '2023-01-01' }, // Past due
				},
				{
					...mockFlashcardData[1]!,
					// No review - new card, should be due
				},
				{
					...mockFlashcardData[2]!,
					review: { ...mockReview, next_due: '2099-01-01' }, // Future due
				},
			]

			const dueCards = getDueCardsForReview(cards)
			expect(dueCards).toHaveLength(2) // Past due + new card

			expect(isCardDueForReview(cards[0]!)).toBe(true) // Past due
			expect(isCardDueForReview(cards[1]!)).toBe(true) // New card
			expect(isCardDueForReview(cards[2]!)).toBe(false) // Future due
		})

		it('should identify card difficulty levels', () => {
			const { getCardDifficulty } = useSpacedRepetition()

			expect(getCardDifficulty(mockFlashcardData[0]!)).toBe('learning') // reps = 1
			expect(getCardDifficulty(mockFlashcardData[1]!)).toBe('new') // no review
			expect(getCardDifficulty(mockFlashcardData[2]!)).toBe('difficult') // high lapses, low ease
		})

		it('should get difficult cards', () => {
			const { getDifficultCardsForReview } = useSpacedRepetition()

			const difficultCards = getDifficultCardsForReview(mockFlashcardData)
			expect(difficultCards).toHaveLength(1)
			expect(difficultCards[0]?.id).toBe('word-3')
		})

		it('should sort cards by priority', () => {
			const { sortCardsByStudyPriority } = useSpacedRepetition()

			const sortedCards = sortCardsByStudyPriority(mockFlashcardData)
			expect(sortedCards).toHaveLength(3)
			// New cards should come first
			expect(sortedCards[0]?.id).toBe('word-2') // New card
		})
	})

	describe('progress calculation', () => {
		it('should calculate study progress', () => {
			const { calculateStudyProgress } = useSpacedRepetition()

			const progress = calculateStudyProgress(mockFlashcardData)

			expect(progress.totalCards).toBe(3)
			expect(progress.newCards).toBe(1) // word-2
			expect(progress.learningCards).toBe(1) // word-1
			expect(progress.difficultCards).toBe(1) // word-3
			expect(progress.completionRate).toBeGreaterThan(0)
		})

		it('should calculate progress from review results', () => {
			const mockResults: ReviewResult[] = [
				{
					cardId: 'word-1',
					quality: 4,
					responseTime: 3000,
					timestamp: new Date(),
				},
				{
					cardId: 'word-2',
					quality: 1,
					responseTime: 5000,
					timestamp: new Date(),
				},
				{
					cardId: 'word-3',
					quality: 5,
					responseTime: 2000,
					timestamp: new Date(),
				},
			]

			const { calculateProgressFromResults } = useSpacedRepetition()
			const progress = calculateProgressFromResults(mockFlashcardData, mockResults)

			expect(progress.totalWords).toBe(3)
			expect(progress.wordsLearned).toBe(2) // Cards with reps >= 1
			expect(progress.averageAccuracy).toBeCloseTo(66.67, 1) // 2 out of 3 correct
		})

		it('should calculate streaks correctly', () => {
			const { calculateCurrentStreak, calculateLongestStreak } = useSpacedRepetition()

			const results: ReviewResult[] = [
				{ cardId: '1', quality: 4, responseTime: 1000, timestamp: new Date() },
				{ cardId: '2', quality: 1, responseTime: 1000, timestamp: new Date() },
				{ cardId: '3', quality: 4, responseTime: 1000, timestamp: new Date() },
				{ cardId: '4', quality: 5, responseTime: 1000, timestamp: new Date() },
				{ cardId: '5', quality: 4, responseTime: 1000, timestamp: new Date() },
			]

			expect(calculateCurrentStreak(results)).toBe(2) // Last 2 are correct
			expect(calculateLongestStreak(results)).toBe(2) // Longest streak is 2
		})
	})

	describe('card schedule', () => {
		it('should get card schedule information', () => {
			const { getCardSchedule } = useSpacedRepetition()

			const schedule = getCardSchedule(mockFlashcardData[0]!)

			expect(schedule.cardId).toBe('word-1')
			expect(schedule.nextDue).toBeInstanceOf(Date)
			expect(schedule.intervalDays).toBe(1)
			expect(schedule.difficulty).toBe('learning')
			expect(schedule.priority).toBeGreaterThan(0)
		})

		it('should handle new card schedule', () => {
			const { getCardSchedule } = useSpacedRepetition()

			const schedule = getCardSchedule(mockFlashcardData[1]!) // New card

			expect(schedule.cardId).toBe('word-2')
			expect(schedule.difficulty).toBe('new')
			expect(schedule.intervalDays).toBe(0)
			expect(schedule.priority).toBe(1) // New cards have highest priority
		})
	})
})
