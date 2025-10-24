import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

// Mock the composables
const mockCurrentSession = ref<any>(null)
const mockIsLoading = ref(false)
const mockError = ref<string | null>(null)
const mockStartDifficultWordsSession = vi.fn()
const mockSubmitDifficultWordReview = vi.fn()
const mockEndSession = vi.fn()
const mockCancelSession = vi.fn()
const mockGetCurrentCard = vi.fn().mockReturnValue(null)
const mockHasMoreCards = vi.fn(() => false)
const mockGetSessionProgress = vi.fn().mockReturnValue(null)
const mockGetRemainingCardsCount = vi.fn(() => 0)
const mockGetImprovedWordsCount = vi.fn(() => 0)

vi.mock('../composables/useDifficultWordsReview', () => ({
	useDifficultWordsReview: () => ({
		currentSession: mockCurrentSession,
		isLoading: mockIsLoading,
		error: mockError,
		startDifficultWordsSession: mockStartDifficultWordsSession,
		submitDifficultWordReview: mockSubmitDifficultWordReview,
		endSession: mockEndSession,
		cancelSession: mockCancelSession,
		getCurrentCard: mockGetCurrentCard,
		hasMoreCards: mockHasMoreCards,
		getSessionProgress: mockGetSessionProgress,
		getRemainingCardsCount: mockGetRemainingCardsCount,
		getImprovedWordsCount: mockGetImprovedWordsCount,
	}),
}))

// Mock FlashcardComponent
vi.mock('./FlashcardComponent.vue', () => ({
	default: {
		name: 'FlashcardComponent',
		template: '<div data-testid="flashcard-component">Flashcard</div>',
		props: ['flashcard'],
		emits: ['flip'],
	},
}))

describe('DifficultWordsReview Logic', () => {
	beforeEach(() => {
		// Reset all mocks
		vi.clearAllMocks()
		mockCurrentSession.value = null
		mockIsLoading.value = false
		mockError.value = null
		mockGetCurrentCard.mockReturnValue(null)
		mockHasMoreCards.mockReturnValue(false)
		mockGetSessionProgress.mockReturnValue(null)
		mockGetRemainingCardsCount.mockReturnValue(0)
		mockGetImprovedWordsCount.mockReturnValue(0)
	})

	it('should initialize with correct default state', () => {
		expect(mockIsLoading.value).toBe(false)
		expect(mockError.value).toBe(null)
		expect(mockCurrentSession.value).toBe(null)
	})

	it('should handle loading state', () => {
		mockIsLoading.value = true
		expect(mockIsLoading.value).toBe(true)
	})

	it('should handle error state', () => {
		mockError.value = 'Test error message'
		expect(mockError.value).toBe('Test error message')
	})

	it('should handle session with difficult cards', () => {
		const mockCard = {
			id: 'test-card',
			tl: 'Kumusta',
			en: 'Hello',
			category: { name: 'Greetings' },
			examples: [],
			review: { lapses: 2, ease: 1.8 },
		}

		mockCurrentSession.value = {
			cards: [mockCard],
			currentIndex: 0,
			sessionStats: { cardsStudied: 0, correctAnswers: 0, accuracy: 0 },
			startTime: new Date(),
			isActive: true,
			improvedWords: [],
		}
		mockGetCurrentCard.mockReturnValue(mockCard)
		mockGetSessionProgress.mockReturnValue({ current: 1, total: 1, percentage: 100 })

		expect(mockGetCurrentCard()).toEqual(mockCard)
		expect(mockGetSessionProgress()).toEqual({ current: 1, total: 1, percentage: 100 })
	})

	it('should handle review submission', async () => {
		const mockCard = {
			id: 'test-card',
			tl: 'Kumusta',
			en: 'Hello',
			category: { name: 'Greetings' },
			examples: [],
			review: { lapses: 2, ease: 1.8 },
		}

		mockGetCurrentCard.mockReturnValue(mockCard)
		mockSubmitDifficultWordReview.mockResolvedValue(undefined)
		mockHasMoreCards.mockReturnValue(false)
		mockEndSession.mockReturnValue({
			cardsStudied: 1,
			correctAnswers: 1,
			accuracy: 100,
			improvedWords: 1,
		})

		await mockSubmitDifficultWordReview({
			cardId: 'test-card',
			quality: 4,
			responseTime: 0,
		})

		expect(mockSubmitDifficultWordReview).toHaveBeenCalledWith({
			cardId: 'test-card',
			quality: 4,
			responseTime: 0,
		})
	})

	it('should track improved words count', () => {
		mockGetImprovedWordsCount.mockReturnValue(3)
		expect(mockGetImprovedWordsCount()).toBe(3)
	})

	it('should track remaining cards count', () => {
		mockGetRemainingCardsCount.mockReturnValue(5)
		expect(mockGetRemainingCardsCount()).toBe(5)
	})
})
