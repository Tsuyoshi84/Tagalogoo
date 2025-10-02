import { describe, expect, it } from 'vitest'
import type {
	Category,
	CategoryProgress,
	Example,
	FlashcardData,
	ProgressStats,
	Review,
	StudySessionStats,
	Word,
} from '../types/vocabulary'

// Create a simple test for the types and basic functionality
describe('useVocabularyData types', () => {
	it('should have correct TypeScript interfaces', () => {
		// Test that we can create objects with the expected shape
		const mockCategory: Category = {
			id: '1',
			name: 'Test Category',
			description: 'Test Description',
			sort_order: 0,
			created_at: '2024-01-01T00:00:00Z',
			wordCount: 5,
			dueCount: 2,
		}

		expect(mockCategory.id).toBe('1')
		expect(mockCategory.name).toBe('Test Category')
		expect(mockCategory.wordCount).toBe(5)

		const mockWord: Word = {
			id: '1',
			category_id: '1',
			tl: 'Kumusta',
			en: 'Hello',
			created_at: '2024-01-01T00:00:00Z',
		}

		expect(mockWord.tl).toBe('Kumusta')
		expect(mockWord.en).toBe('Hello')

		const mockExample: Example = {
			id: '1',
			word_id: '1',
			tl: 'Kumusta ka?',
			en: 'How are you?',
			audio_url: null,
			created_at: '2024-01-01T00:00:00Z',
		}

		expect(mockExample.tl).toBe('Kumusta ka?')
		expect(mockExample.en).toBe('How are you?')

		const mockReview: Review = {
			user_id: 'user-1',
			word_id: '1',
			ease: 2.5,
			interval_days: 1,
			reps: 1,
			lapses: 0,
			next_due: '2024-01-02',
			last_reviewed: '2024-01-01',
		}

		expect(mockReview.ease).toBe(2.5)
		expect(mockReview.reps).toBe(1)

		const mockFlashcard: FlashcardData = {
			...mockWord,
			examples: [mockExample],
			review: mockReview,
			category: mockCategory,
		}

		expect(mockFlashcard.examples).toHaveLength(1)
		expect(mockFlashcard.review?.ease).toBe(2.5)
		expect(mockFlashcard.category.name).toBe('Test Category')
	})

	it('should have correct progress stats interface', () => {
		const mockStats: ProgressStats = {
			totalWords: 100,
			wordsLearned: 25,
			wordsReviewed: 50,
			currentStreak: 5,
			longestStreak: 10,
			averageAccuracy: 85.5,
			totalStudyTime: 3600,
		}

		expect(mockStats.totalWords).toBe(100)
		expect(mockStats.averageAccuracy).toBe(85.5)

		const mockCategoryProgress: CategoryProgress = {
			categoryId: '1',
			categoryName: 'Greetings',
			totalWords: 20,
			wordsLearned: 15,
			dueWords: 3,
			completionPercentage: 75,
		}

		expect(mockCategoryProgress.completionPercentage).toBe(75)
	})

	it('should have correct session stats interface', () => {
		const mockSessionStats: StudySessionStats = {
			cardsStudied: 10,
			correctAnswers: 8,
			accuracy: 80,
			sessionDuration: 600,
			newCardsLearned: 3,
		}

		expect(mockSessionStats.accuracy).toBe(80)
		expect(mockSessionStats.newCardsLearned).toBe(3)
	})
})
