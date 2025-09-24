import { describe, expect, it } from 'vitest'
import {
	calculateNextReview,
	getDaysUntilDue,
	initializeCard,
	isCardDue,
	isDifficultCard,
	QUALITY_RATINGS,
	type ReviewData,
} from './spacedRepetition'

describe('spacedRepetition', () => {
	describe('initializeCard', () => {
		it('should create a new card with default values', () => {
			const card = initializeCard()

			expect(card.ease).toBe(2.5)
			expect(card.intervalDays).toBe(0)
			expect(card.reps).toBe(0)
			expect(card.lapses).toBe(0)
			expect(card.nextDue).toBeInstanceOf(Date)
			expect(card.lastReviewed).toBeUndefined()
		})

		it('should set nextDue to current date for immediate review', () => {
			const before = new Date()
			const card = initializeCard()
			const after = new Date()

			expect(card.nextDue.getTime()).toBeGreaterThanOrEqual(before.getTime())
			expect(card.nextDue.getTime()).toBeLessThanOrEqual(after.getTime())
		})
	})

	describe('calculateNextReview', () => {
		it('should handle "Again" quality (1) correctly', () => {
			const review: ReviewData = {
				ease: 2.5,
				intervalDays: 10,
				reps: 3,
				lapses: 1,
				nextDue: new Date(),
			}

			const result = calculateNextReview(review, QUALITY_RATINGS.AGAIN)

			expect(result.reps).toBe(0) // Reset repetitions
			expect(result.lapses).toBe(2) // Increment lapses
			expect(result.intervalDays).toBe(1) // Review tomorrow
			expect(result.ease).toBeLessThan(2.5) // Ease should decrease
		})

		it('should handle "Hard" quality (3) correctly', () => {
			const review: ReviewData = {
				ease: 2.5,
				intervalDays: 5,
				reps: 2,
				lapses: 0,
				nextDue: new Date(),
			}

			const result = calculateNextReview(review, QUALITY_RATINGS.HARD)

			expect(result.reps).toBe(3) // Increment repetitions
			expect(result.lapses).toBe(0) // No change in lapses
			expect(result.intervalDays).toBeGreaterThan(5) // Interval should increase
			expect(result.ease).toBeLessThan(2.5) // Ease should decrease slightly
		})

		it('should handle "Good" quality (4) correctly', () => {
			const review: ReviewData = {
				ease: 2.5,
				intervalDays: 6,
				reps: 2,
				lapses: 0,
				nextDue: new Date(),
			}

			const result = calculateNextReview(review, QUALITY_RATINGS.GOOD)

			expect(result.reps).toBe(3)
			expect(result.lapses).toBe(0)
			expect(result.intervalDays).toBe(Math.round(6 * 2.5)) // Should be interval * ease
			expect(result.ease).toBe(2.5) // Ease should remain the same
		})

		it('should handle "Easy" quality (5) correctly', () => {
			const review: ReviewData = {
				ease: 2.5,
				intervalDays: 6,
				reps: 2,
				lapses: 0,
				nextDue: new Date(),
			}

			const result = calculateNextReview(review, QUALITY_RATINGS.EASY)

			expect(result.reps).toBe(3)
			expect(result.lapses).toBe(0)
			expect(result.intervalDays).toBe(Math.round(6 * 2.5))
			expect(result.ease).toBeGreaterThan(2.5) // Ease should increase
		})

		it('should follow SM-2 interval progression for first reviews', () => {
			let review = initializeCard()

			// First review (Good)
			let result = calculateNextReview(review, QUALITY_RATINGS.GOOD)
			expect(result.reps).toBe(1)
			expect(result.intervalDays).toBe(1)

			// Second review (Good)
			review = { ...review, ...result }
			result = calculateNextReview(review, QUALITY_RATINGS.GOOD)
			expect(result.reps).toBe(2)
			expect(result.intervalDays).toBe(6)

			// Third review (Good) - should use ease factor
			review = { ...review, ...result }
			result = calculateNextReview(review, QUALITY_RATINGS.GOOD)
			expect(result.reps).toBe(3)
			expect(result.intervalDays).toBe(Math.round(6 * result.ease))
		})

		it('should ensure ease never goes below 1.3', () => {
			const review: ReviewData = {
				ease: 1.4,
				intervalDays: 1,
				reps: 1,
				lapses: 5,
				nextDue: new Date(),
			}

			const result = calculateNextReview(review, QUALITY_RATINGS.AGAIN)
			expect(result.ease).toBeGreaterThanOrEqual(1.3)
		})

		it('should round ease to 2 decimal places', () => {
			const review: ReviewData = {
				ease: 2.333333,
				intervalDays: 1,
				reps: 1,
				lapses: 0,
				nextDue: new Date(),
			}

			const result = calculateNextReview(review, QUALITY_RATINGS.GOOD)
			expect(result.ease.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2)
		})

		it('should set correct nextDue date', () => {
			const review = initializeCard()
			const result = calculateNextReview(review, QUALITY_RATINGS.GOOD)

			const expectedDate = new Date()
			expectedDate.setDate(expectedDate.getDate() + result.intervalDays)

			// Allow for small time differences due to execution time
			const timeDiff = Math.abs(result.nextDue.getTime() - expectedDate.getTime())
			expect(timeDiff).toBeLessThan(1000) // Less than 1 second difference
		})
	})

	describe('isCardDue', () => {
		it('should return true for cards due today', () => {
			const review: ReviewData = {
				ease: 2.5,
				intervalDays: 1,
				reps: 1,
				lapses: 0,
				nextDue: new Date(),
			}

			expect(isCardDue(review)).toBe(true)
		})

		it('should return true for overdue cards', () => {
			const yesterday = new Date()
			yesterday.setDate(yesterday.getDate() - 1)

			const review: ReviewData = {
				ease: 2.5,
				intervalDays: 1,
				reps: 1,
				lapses: 0,
				nextDue: yesterday,
			}

			expect(isCardDue(review)).toBe(true)
		})

		it('should return false for future cards', () => {
			const tomorrow = new Date()
			tomorrow.setDate(tomorrow.getDate() + 1)

			const review: ReviewData = {
				ease: 2.5,
				intervalDays: 2,
				reps: 1,
				lapses: 0,
				nextDue: tomorrow,
			}

			expect(isCardDue(review)).toBe(false)
		})

		it('should use custom current date when provided', () => {
			const futureDate = new Date()
			futureDate.setDate(futureDate.getDate() + 5)

			const review: ReviewData = {
				ease: 2.5,
				intervalDays: 1,
				reps: 1,
				lapses: 0,
				nextDue: futureDate,
			}

			const customCurrentDate = new Date()
			customCurrentDate.setDate(customCurrentDate.getDate() + 6)

			expect(isCardDue(review, customCurrentDate)).toBe(true)
		})
	})

	describe('getDaysUntilDue', () => {
		it('should return 0 for cards due today', () => {
			const today = new Date()
			const review: ReviewData = {
				ease: 2.5,
				intervalDays: 1,
				reps: 1,
				lapses: 0,
				nextDue: today,
			}

			expect(getDaysUntilDue(review, today)).toBe(0)
		})

		it('should return positive number for future cards', () => {
			const today = new Date()
			const threeDaysFromNow = new Date()
			threeDaysFromNow.setDate(today.getDate() + 3)

			const review: ReviewData = {
				ease: 2.5,
				intervalDays: 3,
				reps: 1,
				lapses: 0,
				nextDue: threeDaysFromNow,
			}

			expect(getDaysUntilDue(review, today)).toBe(3)
		})

		it('should return negative number for overdue cards', () => {
			const today = new Date()
			const twoDaysAgo = new Date()
			twoDaysAgo.setDate(today.getDate() - 2)

			const review: ReviewData = {
				ease: 2.5,
				intervalDays: 1,
				reps: 1,
				lapses: 0,
				nextDue: twoDaysAgo,
			}

			expect(getDaysUntilDue(review, today)).toBe(-2)
		})
	})

	describe('isDifficultCard', () => {
		it('should identify cards with many lapses as difficult', () => {
			const review: ReviewData = {
				ease: 2.5,
				intervalDays: 1,
				reps: 2,
				lapses: 3,
				nextDue: new Date(),
			}

			expect(isDifficultCard(review)).toBe(true)
		})

		it('should identify cards with low ease as difficult', () => {
			const review: ReviewData = {
				ease: 1.8,
				intervalDays: 1,
				reps: 2,
				lapses: 1,
				nextDue: new Date(),
			}

			expect(isDifficultCard(review)).toBe(true)
		})

		it('should identify cards with many reps but low ease as difficult', () => {
			const review: ReviewData = {
				ease: 2.1,
				intervalDays: 5,
				reps: 6,
				lapses: 1,
				nextDue: new Date(),
			}

			expect(isDifficultCard(review)).toBe(true)
		})

		it('should not identify well-performing cards as difficult', () => {
			const review: ReviewData = {
				ease: 2.8,
				intervalDays: 10,
				reps: 5,
				lapses: 1,
				nextDue: new Date(),
			}

			expect(isDifficultCard(review)).toBe(false)
		})
	})
})
