import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import DifficultWordsReview from './DifficultWordsReview.vue'

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

describe('DifficultWordsReview', () => {
	let wrapper: any

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

		wrapper = mount(DifficultWordsReview, {
			props: {
				categoryId: 'test-category',
			},
		})
	})

	it('renders loading state correctly', async () => {
		mockIsLoading.value = true
		await wrapper.vm.$nextTick()

		expect(wrapper.find('.loading-spinner').exists()).toBe(true)
	})

	it('renders error state correctly', async () => {
		mockError.value = 'Test error message'
		await wrapper.vm.$nextTick()

		expect(wrapper.find('.alert-error').exists()).toBe(true)
		expect(wrapper.text()).toContain('Test error message')
	})

	it('renders no difficult words state correctly', () => {
		expect(wrapper.text()).toContain('Excellent!')
		expect(wrapper.text()).toContain("You don't have any difficult words to review")
	})

	it('renders session complete state correctly', async () => {
		await wrapper.setData({
			sessionComplete: true,
			sessionStats: {
				cardsStudied: 5,
				accuracy: 80,
				improvedWords: 3,
			},
		})

		expect(wrapper.text()).toContain('Session Complete!')
		expect(wrapper.text()).toContain('5') // cards studied
		expect(wrapper.text()).toContain('80%') // accuracy
		expect(wrapper.text()).toContain('3') // improved words
	})

	it('renders active session correctly', async () => {
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

		await wrapper.vm.$nextTick()

		expect(wrapper.text()).toContain('Difficult Words Review')
		expect(wrapper.text()).toContain('Greetings')
		expect(wrapper.text()).toContain('Challenging Word')
		expect(wrapper.text()).toContain('Lapses: 2')
		expect(wrapper.text()).toContain('Ease: 1.8')
	})

	it('shows review buttons when card is flipped', async () => {
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

		await wrapper.vm.$nextTick()

		// Simulate card flip
		await wrapper.setData({ cardFlipped: true })

		expect(wrapper.text()).toContain('Again')
		expect(wrapper.text()).toContain('Hard')
		expect(wrapper.text()).toContain('Good')
		expect(wrapper.text()).toContain('Easy')
	})

	it('emits close event when cancel button is clicked', async () => {
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

		await wrapper.vm.$nextTick()

		const cancelButton = wrapper.find('button[class*="btn-ghost"]')
		await cancelButton.trigger('click')

		expect(wrapper.emitted('close')).toBeTruthy()
	})

	it('calls submitDifficultWordReview when review button is clicked', async () => {
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
		mockSubmitDifficultWordReview.mockResolvedValue(undefined)
		mockHasMoreCards.mockReturnValue(false)
		mockEndSession.mockReturnValue({
			cardsStudied: 1,
			correctAnswers: 1,
			accuracy: 100,
			improvedWords: 1,
		})

		await wrapper.vm.$nextTick()

		// Simulate card flip and review submission
		await wrapper.setData({ cardFlipped: true })
		const goodButton = wrapper.find('button:contains("Good")')
		await goodButton.trigger('click')

		expect(mockSubmitDifficultWordReview).toHaveBeenCalledWith({
			cardId: 'test-card',
			quality: 4,
			responseTime: 0,
		})
	})
})
