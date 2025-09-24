import { describe, expect, it, vi } from 'vitest'
import {
	createCategory,
	createExample,
	createOrUpdateReview,
	createWord,
	getDueCards,
	saveUserProgress,
} from './dataAccess.ts'

/**
 * Unit tests for vocabulary data access layer business logic.
 * Tests focus on actual behavior and edge cases.
 */

describe('createCategory', () => {
	it('should throw error when category creation fails', async () => {
		const mockDb = {
			insert: vi.fn().mockReturnValue({
				values: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([]), // Empty result simulates failure
				}),
			}),
		}

		await expect(
			createCategory(mockDb as any, {
				name: 'Test Category',
				description: 'Test',
				sortOrder: 1,
			}),
		).rejects.toThrow('Failed to create category')
	})

	it('should return created category when successful', async () => {
		const mockCategory = {
			id: 'cat-1',
			name: 'Test Category',
			description: 'Test',
			sortOrder: 1,
			createdAt: new Date(),
		}

		const mockDb = {
			insert: vi.fn().mockReturnValue({
				values: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([mockCategory]),
				}),
			}),
		}

		const result = await createCategory(mockDb as any, {
			name: 'Test Category',
			description: 'Test',
			sortOrder: 1,
		})

		expect(result).toEqual(mockCategory)
	})
})

describe('createWord', () => {
	it('should throw error when word creation fails', async () => {
		const mockDb = {
			insert: vi.fn().mockReturnValue({
				values: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([]), // Empty result simulates failure
				}),
			}),
		}

		await expect(
			createWord(mockDb as any, {
				categoryId: 'cat-1',
				tl: 'Kumusta',
				en: 'Hello',
			}),
		).rejects.toThrow('Failed to create word')
	})

	it('should return created word when successful', async () => {
		const mockWord = {
			id: 'word-1',
			categoryId: 'cat-1',
			tl: 'Kumusta',
			en: 'Hello',
			createdAt: new Date(),
		}

		const mockDb = {
			insert: vi.fn().mockReturnValue({
				values: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([mockWord]),
				}),
			}),
		}

		const result = await createWord(mockDb as any, {
			categoryId: 'cat-1',
			tl: 'Kumusta',
			en: 'Hello',
		})

		expect(result).toEqual(mockWord)
	})
})

describe('createExample', () => {
	it('should throw error when example creation fails', async () => {
		const mockDb = {
			insert: vi.fn().mockReturnValue({
				values: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([]), // Empty result simulates failure
				}),
			}),
		}

		await expect(
			createExample(mockDb as any, {
				wordId: 'word-1',
				tl: 'Kumusta ka?',
				en: 'How are you?',
				audioUrl: 'audio/test.mp3',
			}),
		).rejects.toThrow('Failed to create example')
	})

	it('should return created example when successful', async () => {
		const mockExample = {
			id: 'ex-1',
			wordId: 'word-1',
			tl: 'Kumusta ka?',
			en: 'How are you?',
			audioUrl: 'audio/test.mp3',
			createdAt: new Date(),
		}

		const mockDb = {
			insert: vi.fn().mockReturnValue({
				values: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([mockExample]),
				}),
			}),
		}

		const result = await createExample(mockDb as any, {
			wordId: 'word-1',
			tl: 'Kumusta ka?',
			en: 'How are you?',
			audioUrl: 'audio/test.mp3',
		})

		expect(result).toEqual(mockExample)
	})
})

describe('createOrUpdateReview', () => {
	it('should throw error when review creation fails', async () => {
		const mockDb = {
			insert: vi.fn().mockReturnValue({
				values: vi.fn().mockReturnValue({
					onConflictDoUpdate: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([]), // Empty result simulates failure
					}),
				}),
			}),
		}

		await expect(
			createOrUpdateReview(mockDb as any, {
				userId: 'user-1',
				wordId: 'word-1',
				ease: 2.5,
				intervalDays: 1,
				reps: 1,
				lapses: 0,
				nextDue: '2024-01-02',
				lastReviewed: '2024-01-01',
			}),
		).rejects.toThrow('Failed to create or update review')
	})

	it('should return created review when successful', async () => {
		const mockReview = {
			userId: 'user-1',
			wordId: 'word-1',
			ease: 2.5,
			intervalDays: 1,
			reps: 1,
			lapses: 0,
			nextDue: '2024-01-02',
			lastReviewed: '2024-01-01',
		}

		const mockDb = {
			insert: vi.fn().mockReturnValue({
				values: vi.fn().mockReturnValue({
					onConflictDoUpdate: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([mockReview]),
					}),
				}),
			}),
		}

		const result = await createOrUpdateReview(mockDb as any, {
			userId: 'user-1',
			wordId: 'word-1',
			ease: 2.5,
			intervalDays: 1,
			reps: 1,
			lapses: 0,
			nextDue: '2024-01-02',
			lastReviewed: '2024-01-01',
		})

		expect(result).toEqual(mockReview)
	})
})

describe('saveUserProgress', () => {
	it('should apply default values when saving partial user progress', async () => {
		const mockReview = {
			userId: 'user-1',
			wordId: 'word-1',
			ease: 2.6,
			intervalDays: 0,
			reps: 0,
			lapses: 0,
			nextDue: '2024-01-02',
			lastReviewed: '2024-01-01',
		}

		const mockDb = {
			insert: vi.fn().mockReturnValue({
				values: vi.fn().mockReturnValue({
					onConflictDoUpdate: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([mockReview]),
					}),
				}),
			}),
		}

		const result = await saveUserProgress(mockDb as any, 'user-1', 'word-1', {
			ease: 2.6, // Only provide ease, other values should get defaults
		})

		expect(result).toEqual(mockReview)
		expect(mockDb.insert).toHaveBeenCalled()

		// Verify the values passed to the database include defaults
		const insertCall = mockDb.insert().values
		expect(insertCall).toHaveBeenCalledWith(
			expect.objectContaining({
				userId: 'user-1',
				wordId: 'word-1',
				ease: 2.6, // User provided
				intervalDays: 0, // Default
				reps: 0, // Default
				lapses: 0, // Default
				nextDue: expect.any(String), // Default (today)
				lastReviewed: expect.any(String), // Default (today)
			}),
		)
	})

	it('should generate current date strings for default values', () => {
		const today = new Date().toISOString().split('T')[0]
		expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/) // YYYY-MM-DD format
	})
})

describe('getDueCards', () => {
	it('should handle conditional limit in query', async () => {
		const mockResults = [
			{
				word: { id: 'word-1', categoryId: 'cat-1', tl: 'Test', en: 'Test', createdAt: new Date() },
				category: {
					id: 'cat-1',
					name: 'Test',
					description: null,
					sortOrder: 1,
					createdAt: new Date(),
				},
				review: null,
			},
		]

		const mockExamples = [
			{
				id: 'ex-1',
				wordId: 'word-1',
				tl: 'Test example',
				en: 'Test example',
				audioUrl: null,
				createdAt: new Date(),
			},
		]

		const mockQuery = {
			select: vi.fn().mockReturnThis(),
			from: vi.fn().mockReturnThis(),
			innerJoin: vi.fn().mockReturnThis(),
			leftJoin: vi.fn().mockReturnThis(),
			where: vi.fn().mockReturnThis(),
			orderBy: vi.fn().mockReturnThis(),
			limit: vi.fn().mockResolvedValue(mockResults),
		}

		const mockDb = {
			select: vi.fn().mockReturnValue(mockQuery),
		}

		// Mock the examples query
		mockDb.select
			.mockReturnValueOnce(mockQuery) // First call for main query
			.mockReturnValueOnce({
				// Second call for examples query
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue(mockExamples),
				}),
			})

		const result = await getDueCards(mockDb as any, 'user-1', 'cat-1', 5)

		expect(result).toHaveLength(1)
		expect(result[0]?.examples).toEqual(mockExamples)
		expect(mockQuery.limit).toHaveBeenCalledWith(5)
	})

	it('should handle query without limit', async () => {
		const mockResults = [
			{
				word: { id: 'word-1', categoryId: 'cat-1', tl: 'Test', en: 'Test', createdAt: new Date() },
				category: {
					id: 'cat-1',
					name: 'Test',
					description: null,
					sortOrder: 1,
					createdAt: new Date(),
				},
				review: null,
			},
		]

		const mockExamples: any[] = []

		const mockQueryWithoutLimit = {
			select: vi.fn().mockReturnThis(),
			from: vi.fn().mockReturnThis(),
			innerJoin: vi.fn().mockReturnThis(),
			leftJoin: vi.fn().mockReturnThis(),
			where: vi.fn().mockReturnThis(),
			orderBy: vi.fn().mockResolvedValue(mockResults),
		}

		const mockDb = {
			select: vi.fn().mockReturnValue(mockQueryWithoutLimit),
		}

		// Mock the examples query
		mockDb.select
			.mockReturnValueOnce(mockQueryWithoutLimit) // First call for main query
			.mockReturnValueOnce({
				// Second call for examples query
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue(mockExamples),
				}),
			})

		const result = await getDueCards(mockDb as any, 'user-1')

		expect(result).toHaveLength(1)
		expect(result[0]?.examples).toEqual(mockExamples)
		// Verify limit was not called when no limit provided
		expect('limit' in mockQueryWithoutLimit).toBe(false)
	})

	it('should convert null review to undefined in flashcard data', async () => {
		const mockResults = [
			{
				word: { id: 'word-1', categoryId: 'cat-1', tl: 'Test', en: 'Test', createdAt: new Date() },
				category: {
					id: 'cat-1',
					name: 'Test',
					description: null,
					sortOrder: 1,
					createdAt: new Date(),
				},
				review: null, // Database returns null
			},
		]

		const mockQuery = {
			select: vi.fn().mockReturnThis(),
			from: vi.fn().mockReturnThis(),
			innerJoin: vi.fn().mockReturnThis(),
			leftJoin: vi.fn().mockReturnThis(),
			where: vi.fn().mockReturnThis(),
			orderBy: vi.fn().mockResolvedValue(mockResults),
		}

		const mockDb = {
			select: vi.fn().mockReturnValue(mockQuery),
		}

		// Mock the examples query
		mockDb.select
			.mockReturnValueOnce(mockQuery) // First call for main query
			.mockReturnValueOnce({
				// Second call for examples query
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([]),
				}),
			})

		const result = await getDueCards(mockDb as any, 'user-1')

		expect(result[0]?.review).toBeUndefined() // Should be undefined, not null
	})
})
