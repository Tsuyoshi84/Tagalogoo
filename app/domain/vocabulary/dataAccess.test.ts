import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
	createCategory,
	createOrUpdateReview,
	getAllCategories,
	getDueCardCount,
	getUserProgressStats,
	saveUserProgress,
} from './dataAccess.ts'

/**
 * Unit tests for vocabulary data access layer business logic.
 * Tests focus on actual behavior and edge cases using Supabase client.
 */

// Mock Supabase client
const createMockSupabaseClient = () => ({
	from: vi.fn(),
	rpc: vi.fn(),
})

describe('createCategory', () => {
	let mockSupabase: ReturnType<typeof createMockSupabaseClient>

	beforeEach(() => {
		mockSupabase = createMockSupabaseClient()
	})

	it('should create a category successfully', async () => {
		const mockCategory = {
			id: 'cat-1',
			name: 'Test Category',
			description: 'Test',
			sort_order: 1,
			created_at: new Date(),
		}

		mockSupabase.from.mockReturnValue({
			insert: vi.fn().mockReturnValue({
				select: vi.fn().mockReturnValue({
					single: vi.fn().mockResolvedValue({
						data: mockCategory,
						error: null,
					}),
				}),
			}),
		})

		const result = await createCategory(mockSupabase as any, {
			name: 'Test Category',
			description: 'Test',
			sortOrder: 1,
		})

		expect(result).toEqual(mockCategory)
		expect(mockSupabase.from).toHaveBeenCalledWith('categories')
	})

	it('should throw error when category creation fails', async () => {
		mockSupabase.from.mockReturnValue({
			insert: vi.fn().mockReturnValue({
				select: vi.fn().mockReturnValue({
					single: vi.fn().mockResolvedValue({
						data: null,
						error: { message: 'Insert failed' },
					}),
				}),
			}),
		})

		await expect(
			createCategory(mockSupabase as any, {
				name: 'Test Category',
				description: 'Test',
				sortOrder: 1,
			}),
		).rejects.toThrow('Failed to create category: Insert failed')
	})

	it('should throw error when no data is returned', async () => {
		mockSupabase.from.mockReturnValue({
			insert: vi.fn().mockReturnValue({
				select: vi.fn().mockReturnValue({
					single: vi.fn().mockResolvedValue({
						data: null,
						error: null,
					}),
				}),
			}),
		})

		await expect(
			createCategory(mockSupabase as any, {
				name: 'Test Category',
				description: 'Test',
				sortOrder: 1,
			}),
		).rejects.toThrow('Failed to create category: No data returned')
	})
})

describe('getAllCategories', () => {
	let mockSupabase: ReturnType<typeof createMockSupabaseClient>

	beforeEach(() => {
		mockSupabase = createMockSupabaseClient()
	})

	it('should return all categories ordered by sort_order and name', async () => {
		const mockCategories = [
			{ id: 'cat-1', name: 'A Category', sort_order: 1 },
			{ id: 'cat-2', name: 'B Category', sort_order: 2 },
		]

		mockSupabase.from.mockReturnValue({
			select: vi.fn().mockReturnValue({
				order: vi.fn().mockReturnValue({
					order: vi.fn().mockResolvedValue({
						data: mockCategories,
						error: null,
					}),
				}),
			}),
		})

		const result = await getAllCategories(mockSupabase as any)

		expect(result).toEqual(mockCategories)
		expect(mockSupabase.from).toHaveBeenCalledWith('categories')
	})

	it('should throw error when fetch fails', async () => {
		mockSupabase.from.mockReturnValue({
			select: vi.fn().mockReturnValue({
				order: vi.fn().mockReturnValue({
					order: vi.fn().mockResolvedValue({
						data: null,
						error: { message: 'Fetch failed' },
					}),
				}),
			}),
		})

		await expect(getAllCategories(mockSupabase as any)).rejects.toThrow(
			'Failed to fetch categories: Fetch failed',
		)
	})
})

describe('getDueCardCount', () => {
	let mockSupabase: ReturnType<typeof createMockSupabaseClient>

	beforeEach(() => {
		mockSupabase = createMockSupabaseClient()
	})

	it('should return due card count from RPC function', async () => {
		mockSupabase.rpc.mockResolvedValue({
			data: 15,
			error: null,
		})

		const result = await getDueCardCount(mockSupabase as any, 'user-1', 'cat-1')

		expect(result).toBe(15)
		expect(mockSupabase.rpc).toHaveBeenCalledWith('get_due_cards_count', {
			user_id: 'user-1',
			category_id: 'cat-1',
		})
	})

	it('should return 0 when RPC returns null', async () => {
		mockSupabase.rpc.mockResolvedValue({
			data: null,
			error: null,
		})

		const result = await getDueCardCount(mockSupabase as any, 'user-1')

		expect(result).toBe(0)
	})

	it('should throw error when RPC fails', async () => {
		mockSupabase.rpc.mockResolvedValue({
			data: null,
			error: { message: 'RPC failed' },
		})

		await expect(getDueCardCount(mockSupabase as any, 'user-1')).rejects.toThrow(
			'Failed to count due cards: RPC failed',
		)
	})
})

describe('createOrUpdateReview', () => {
	let mockSupabase: ReturnType<typeof createMockSupabaseClient>

	beforeEach(() => {
		mockSupabase = createMockSupabaseClient()
	})

	it('should create or update review successfully', async () => {
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

		mockSupabase.from.mockReturnValue({
			upsert: vi.fn().mockReturnValue({
				select: vi.fn().mockReturnValue({
					single: vi.fn().mockResolvedValue({
						data: mockReview,
						error: null,
					}),
				}),
			}),
		})

		const result = await createOrUpdateReview(mockSupabase as any, mockReview)

		expect(result).toEqual(mockReview)
		expect(mockSupabase.from).toHaveBeenCalledWith('reviews')
	})

	it('should throw error when upsert fails', async () => {
		mockSupabase.from.mockReturnValue({
			upsert: vi.fn().mockReturnValue({
				select: vi.fn().mockReturnValue({
					single: vi.fn().mockResolvedValue({
						data: null,
						error: { message: 'Upsert failed' },
					}),
				}),
			}),
		})

		await expect(
			createOrUpdateReview(mockSupabase as any, {
				userId: 'user-1',
				wordId: 'word-1',
				ease: 2.5,
				intervalDays: 1,
				reps: 1,
				lapses: 0,
				nextDue: '2024-01-02',
				lastReviewed: '2024-01-01',
			}),
		).rejects.toThrow('Failed to create or update review: Upsert failed')
	})
})

describe('saveUserProgress', () => {
	let mockSupabase: ReturnType<typeof createMockSupabaseClient>

	beforeEach(() => {
		mockSupabase = createMockSupabaseClient()
	})

	it('should save user progress with default values', async () => {
		const mockReview = {
			userId: 'user-1',
			wordId: 'word-1',
			ease: 2.5,
			intervalDays: 0,
			reps: 0,
			lapses: 0,
			nextDue: expect.any(String),
			lastReviewed: expect.any(String),
		}

		mockSupabase.from.mockReturnValue({
			upsert: vi.fn().mockReturnValue({
				select: vi.fn().mockReturnValue({
					single: vi.fn().mockResolvedValue({
						data: mockReview,
						error: null,
					}),
				}),
			}),
		})

		const result = await saveUserProgress(mockSupabase as any, 'user-1', 'word-1', {
			ease: 2.6,
		})

		expect(result).toEqual(
			expect.objectContaining({
				userId: 'user-1',
				wordId: 'word-1',
				ease: 2.5, // From mock return
			}),
		)
	})
})

describe('getUserProgressStats', () => {
	let mockSupabase: ReturnType<typeof createMockSupabaseClient>

	beforeEach(() => {
		mockSupabase = createMockSupabaseClient()
	})

	it('should return progress statistics from RPC function', async () => {
		const mockStats = {
			total_cards: 100,
			studied_cards: 75,
			due_cards: 15,
			average_ease: 2.7,
		}

		mockSupabase.rpc.mockResolvedValue({
			data: mockStats,
			error: null,
		})

		const result = await getUserProgressStats(mockSupabase as any, 'user-1')

		expect(result).toEqual({
			totalCards: 100,
			studiedCards: 75,
			dueCards: 15,
			averageEase: 2.7,
		})
		expect(mockSupabase.rpc).toHaveBeenCalledWith('get_user_progress_stats', {
			user_id: 'user-1',
		})
	})

	it('should return default values when RPC returns null', async () => {
		mockSupabase.rpc.mockResolvedValue({
			data: null,
			error: null,
		})

		const result = await getUserProgressStats(mockSupabase as any, 'user-1')

		expect(result).toEqual({
			totalCards: 0,
			studiedCards: 0,
			dueCards: 0,
			averageEase: 2.5,
		})
	})

	it('should throw error when RPC fails', async () => {
		mockSupabase.rpc.mockResolvedValue({
			data: null,
			error: { message: 'RPC failed' },
		})

		await expect(getUserProgressStats(mockSupabase as any, 'user-1')).rejects.toThrow(
			'Failed to fetch progress statistics: RPC failed',
		)
	})
})
