import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useDifficultWordsReview } from './useDifficultWordsReview'

// Mock the dependencies
vi.mock('./useVocabularyData', () => ({
	useVocabularyData: () => ({
		getDifficultWords: vi.fn(),
		updateReview: vi.fn(),
	}),
}))

vi.mock('#imports', () => ({
	useSupabaseUser: () => ref({ id: 'test-user-id' }),
}))

vi.mock('../domain/vocabulary/spacedRepetition', () => ({
	calculateNextReview: vi.fn(() => ({
		ease: 2.5,
		intervalDays: 1,
		reps: 1,
		lapses: 0,
		nextDue: new Date(),
		lastReviewed: new Date(),
	})),
}))

describe('useDifficultWordsReview', () => {
	let composable: ReturnType<typeof useDifficultWordsReview>

	beforeEach(() => {
		vi.clearAllMocks()
		composable = useDifficultWordsReview()
	})

	it('initializes with correct default state', () => {
		expect(composable.currentSession.value).toBeNull()
		expect(composable.isLoading.value).toBe(false)
		expect(composable.error.value).toBeNull()
	})

	it('provides all expected methods', () => {
		expect(typeof composable.startDifficultWordsSession).toBe('function')
		expect(typeof composable.submitDifficultWordReview).toBe('function')
		expect(typeof composable.endSession).toBe('function')
		expect(typeof composable.cancelSession).toBe('function')
		expect(typeof composable.getCurrentCard).toBe('function')
		expect(typeof composable.hasMoreCards).toBe('function')
		expect(typeof composable.getSessionProgress).toBe('function')
		expect(typeof composable.getRemainingCardsCount).toBe('function')
		expect(typeof composable.getImprovedWordsCount).toBe('function')
		expect(typeof composable.isWordImproved).toBe('function')
	})

	it('returns correct values when no session is active', () => {
		expect(composable.getCurrentCard()).toBeNull()
		expect(composable.hasMoreCards()).toBe(false)
		expect(composable.getSessionProgress()).toBeNull()
		expect(composable.getRemainingCardsCount()).toBe(0)
		expect(composable.getImprovedWordsCount()).toBe(0)
		expect(composable.isWordImproved('test-id')).toBe(false)
	})

	it('handles session cancellation correctly', () => {
		// Test that cancelSession can be called without error
		expect(() => composable.cancelSession()).not.toThrow()
		expect(composable.currentSession.value).toBeNull()
	})

	it('provides correct interface for session management', () => {
		// Test that all methods return expected types when no session is active
		expect(composable.getCurrentCard()).toBeNull()
		expect(composable.hasMoreCards()).toBe(false)
		expect(composable.getSessionProgress()).toBeNull()
		expect(composable.getRemainingCardsCount()).toBe(0)
		expect(composable.getImprovedWordsCount()).toBe(0)
		expect(composable.isWordImproved('test-id')).toBe(false)
	})
})
