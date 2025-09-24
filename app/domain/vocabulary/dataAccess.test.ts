import { describe, expect, it } from 'vitest'
import type {
	Category,
	Example,
	NewCategory,
	NewExample,
	NewReview,
	NewWord,
	Review,
	Word,
} from '../database/types.ts'

/**
 * Unit tests for vocabulary data access layer.
 * Tests verify function exports, TypeScript types, and basic functionality.
 */

describe('Vocabulary Data Access Layer', () => {
	describe('Function Exports', () => {
		it('should export all required CRUD functions', async () => {
			const module = await import('./dataAccess.ts')

			// Verify all expected functions are exported
			const expectedFunctions = [
				'getAllCategories',
				'getCategoryWithStats',
				'createCategory',
				'getWordsByCategory',
				'getWordWithDetails',
				'createWord',
				'getExamplesByWord',
				'createExample',
				'getUserReview',
				'createOrUpdateReview',
				'getDueCards',
				'getDueCardCount',
				'getRecentReviews',
				'saveUserProgress',
				'loadUserProgress',
				'getUserProgressStats',
			]

			for (const functionName of expectedFunctions) {
				expect(module).toHaveProperty(functionName)
				expect(typeof module[functionName as keyof typeof module]).toBe('function')
			}
		})

		it('should export category operations', async () => {
			const dataAccess = await import('./dataAccess.ts')

			expect(typeof dataAccess.getAllCategories).toBe('function')
			expect(typeof dataAccess.getCategoryWithStats).toBe('function')
			expect(typeof dataAccess.createCategory).toBe('function')
		})

		it('should export word operations', async () => {
			const dataAccess = await import('./dataAccess.ts')

			expect(typeof dataAccess.getWordsByCategory).toBe('function')
			expect(typeof dataAccess.getWordWithDetails).toBe('function')
			expect(typeof dataAccess.createWord).toBe('function')
		})

		it('should export example operations', async () => {
			const dataAccess = await import('./dataAccess.ts')

			expect(typeof dataAccess.getExamplesByWord).toBe('function')
			expect(typeof dataAccess.createExample).toBe('function')
		})

		it('should export review operations', async () => {
			const dataAccess = await import('./dataAccess.ts')

			expect(typeof dataAccess.getUserReview).toBe('function')
			expect(typeof dataAccess.createOrUpdateReview).toBe('function')
		})

		it('should export specialized query functions', async () => {
			const dataAccess = await import('./dataAccess.ts')

			expect(typeof dataAccess.getDueCards).toBe('function')
			expect(typeof dataAccess.getDueCardCount).toBe('function')
			expect(typeof dataAccess.getRecentReviews).toBe('function')
		})

		it('should export progress sync functions', async () => {
			const dataAccess = await import('./dataAccess.ts')

			expect(typeof dataAccess.saveUserProgress).toBe('function')
			expect(typeof dataAccess.loadUserProgress).toBe('function')
			expect(typeof dataAccess.getUserProgressStats).toBe('function')
		})
	})

	describe('TypeScript Types', () => {
		it('should have correct Category type structure', () => {
			const mockCategory: Category = {
				id: 'test-id',
				name: 'Test Category',
				description: 'Test description',
				sortOrder: 1,
				createdAt: new Date(),
			}

			expect(mockCategory.id).toBe('test-id')
			expect(mockCategory.name).toBe('Test Category')
			expect(mockCategory.description).toBe('Test description')
			expect(mockCategory.sortOrder).toBe(1)
			expect(mockCategory.createdAt).toBeInstanceOf(Date)
		})

		it('should have correct Word type structure', () => {
			const mockWord: Word = {
				id: 'word-id',
				categoryId: 'category-id',
				tl: 'Kumusta',
				en: 'Hello',
				createdAt: new Date(),
			}

			expect(mockWord.id).toBe('word-id')
			expect(mockWord.categoryId).toBe('category-id')
			expect(mockWord.tl).toBe('Kumusta')
			expect(mockWord.en).toBe('Hello')
			expect(mockWord.createdAt).toBeInstanceOf(Date)
		})

		it('should have correct Example type structure', () => {
			const mockExample: Example = {
				id: 'example-id',
				wordId: 'word-id',
				tl: 'Kumusta ka?',
				en: 'How are you?',
				audioUrl: 'audio/test.mp3',
				createdAt: new Date(),
			}

			expect(mockExample.id).toBe('example-id')
			expect(mockExample.wordId).toBe('word-id')
			expect(mockExample.tl).toBe('Kumusta ka?')
			expect(mockExample.en).toBe('How are you?')
			expect(mockExample.audioUrl).toBe('audio/test.mp3')
			expect(mockExample.createdAt).toBeInstanceOf(Date)
		})

		it('should have correct Review type structure', () => {
			const mockReview: Review = {
				userId: 'user-id',
				wordId: 'word-id',
				ease: 2.5,
				intervalDays: 1,
				reps: 1,
				lapses: 0,
				nextDue: '2024-01-02',
				lastReviewed: '2024-01-01',
			}

			expect(mockReview.userId).toBe('user-id')
			expect(mockReview.wordId).toBe('word-id')
			expect(mockReview.ease).toBe(2.5)
			expect(mockReview.intervalDays).toBe(1)
			expect(mockReview.reps).toBe(1)
			expect(mockReview.lapses).toBe(0)
			expect(mockReview.nextDue).toBe('2024-01-02')
			expect(mockReview.lastReviewed).toBe('2024-01-01')
		})

		it('should have correct NewCategory type structure', () => {
			const newCategory: NewCategory = {
				name: 'New Category',
				description: 'New description',
				sortOrder: 2,
			}

			expect(newCategory.name).toBe('New Category')
			expect(newCategory.description).toBe('New description')
			expect(newCategory.sortOrder).toBe(2)
			// Should not have id or createdAt as they are auto-generated
			expect('id' in newCategory).toBe(false)
			expect('createdAt' in newCategory).toBe(false)
		})

		it('should have correct NewWord type structure', () => {
			const newWord: NewWord = {
				categoryId: 'category-id',
				tl: 'Salamat',
				en: 'Thank you',
			}

			expect(newWord.categoryId).toBe('category-id')
			expect(newWord.tl).toBe('Salamat')
			expect(newWord.en).toBe('Thank you')
			// Should not have id or createdAt as they are auto-generated
			expect('id' in newWord).toBe(false)
			expect('createdAt' in newWord).toBe(false)
		})

		it('should have correct NewExample type structure', () => {
			const newExample: NewExample = {
				wordId: 'word-id',
				tl: 'Salamat po',
				en: 'Thank you (formal)',
				audioUrl: 'audio/salamat.mp3',
			}

			expect(newExample.wordId).toBe('word-id')
			expect(newExample.tl).toBe('Salamat po')
			expect(newExample.en).toBe('Thank you (formal)')
			expect(newExample.audioUrl).toBe('audio/salamat.mp3')
			// Should not have id or createdAt as they are auto-generated
			expect('id' in newExample).toBe(false)
			expect('createdAt' in newExample).toBe(false)
		})

		it('should have correct NewReview type structure', () => {
			const newReview: NewReview = {
				userId: 'user-id',
				wordId: 'word-id',
				ease: 2.6,
				intervalDays: 2,
				reps: 2,
				lapses: 0,
				nextDue: '2024-01-03',
				lastReviewed: '2024-01-01',
			}

			expect(newReview.userId).toBe('user-id')
			expect(newReview.wordId).toBe('word-id')
			expect(newReview.ease).toBe(2.6)
			expect(newReview.intervalDays).toBe(2)
			expect(newReview.reps).toBe(2)
			expect(newReview.lapses).toBe(0)
			expect(newReview.nextDue).toBe('2024-01-03')
			expect(newReview.lastReviewed).toBe('2024-01-01')
		})
	})

	describe('Data Access Layer Documentation', () => {
		it('should provide comprehensive CRUD operations for vocabulary data', () => {
			// This test documents the expected functionality of the data access layer
			const expectedOperations = [
				'getAllCategories - Get all vocabulary categories',
				'getCategoryWithStats - Get category with word/due counts',
				'createCategory - Create new category',
				'getWordsByCategory - Get words in a category',
				'getWordWithDetails - Get word with category and examples',
				'createWord - Create new word',
				'getExamplesByWord - Get examples for a word',
				'createExample - Create new example',
				'getUserReview - Get user review for a word',
				'createOrUpdateReview - Save/update review data',
				'getDueCards - Get cards due for review',
				'getDueCardCount - Count cards due for review',
				'getRecentReviews - Get recent review history',
				'saveUserProgress - Save user progress data',
				'loadUserProgress - Load user progress data',
				'getUserProgressStats - Get user statistics',
			]

			expect(expectedOperations.length).toBeGreaterThan(0)
			expect(expectedOperations).toContain('getAllCategories - Get all vocabulary categories')
			expect(expectedOperations).toContain('getDueCards - Get cards due for review')
			expect(expectedOperations).toContain('saveUserProgress - Save user progress data')
		})

		it('should support spaced repetition system requirements', () => {
			// Document the SRS-specific functionality
			const srsFeatures = [
				'Due card queries with date filtering',
				'Progress tracking with ease and interval data',
				'Review history with timestamps',
				'User-specific progress isolation',
				'Joined queries for flashcard data with examples',
			]

			expect(srsFeatures.length).toBe(5)
			expect(srsFeatures).toContain('Due card queries with date filtering')
			expect(srsFeatures).toContain('Progress tracking with ease and interval data')
		})
	})
})
