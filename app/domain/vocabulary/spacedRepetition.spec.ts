import { beforeEach, describe, expect, it } from 'vitest'
import {
	calculateCurrentStreak,
	calculateDifficulty,
	calculateLongestStreak,
	calculateNextReview,
	calculateProgressStats,
	getDifficultCards,
	getDueCards,
	initializeNewCard,
	isCardDue,
	type ReviewData,
	type ReviewResult,
	sortCardsByPriority,
} from './spacedRepetition'

describe('Spaced Repetition System', () => {
	let baseReview: ReviewData
	let testDate: Date

	beforeEach(() => {
		testDate = new Date('2024-01-01T10:00:00Z')
		baseReview = {
			ease: 2.5,
			intervalDays: 1,
			reps: 1,
			lapses: 0,
			nextDue: testDate,
			lastReviewed: testDate,
		}
	})

	describe('calculateNextReview', () => {
		it('should reset card to beginning when quality is "Again" (1)', () => {
			const result = calculateNextReview(baseReview, 1)

			expect(result.intervalDays).toBe(0)
			expect(result.reps).toBe(0)
			expect(result.lapses).toBe(1)
			expect(result.nextDue.getTime()).toBeCloseTo(Date.now(), -1000) // Within 1 second
		})

		it('should calculate correct intervals for first few repetitions', () => {
			// First successful review (reps = 0 -> 1)
			const newCard = initializeNewCard()
			const firstReview = calculateNextReview(newCard, 4)
			expect(firstReview.intervalDays).toBe(1)
			expect(firstReview.reps).toBe(1)

			// Second successful review (reps = 1 -> 2)
			const secondReview = calculateNextReview(firstReview, 4)
			expect(secondReview.intervalDays).toBe(6)
			expect(secondReview.reps).toBe(2)

			// Third review uses ease factor
			const thirdReview = calculateNextReview(secondReview, 4)
			expect(thirdReview.intervalDays).toBe(Math.round(6 * 2.5)) // 15 days
			expect(thirdReview.reps).toBe(3)
		})

		it('should adjust intervals based on quality ratings', () => {
			const review = { ...baseReview, intervalDays: 10, reps: 3 }

			// Hard (3) - reduces interval by 20%
			const hardResult = calculateNextReview(review, 3)
			// Ease becomes: 2.5 + (0.1 - (5-3) * (0.08 + (5-3) * 0.02)) = 2.5 + (0.1 - 2 * 0.12) = 2.36
			const expectedHardInterval = Math.max(1, Math.round(10 * 2.36 * 0.8)) // ~19 days
			expect(hardResult.intervalDays).toBe(expectedHardInterval)

			// Good (4) - uses calculated interval
			const goodResult = calculateNextReview(review, 4)
			// Ease becomes: 2.5 + (0.1 - (5-4) * (0.08 + (5-4) * 0.02)) = 2.5 + (0.1 - 1 * 0.1) = 2.5
			expect(goodResult.intervalDays).toBe(Math.round(10 * 2.5)) // 25 days

			// Easy (5) - increases interval by 30%
			const easyResult = calculateNextReview(review, 5)
			// Ease becomes: 2.5 + (0.1 - (5-5) * (0.08 + (5-5) * 0.02)) = 2.5 + 0.1 = 2.6
			expect(easyResult.intervalDays).toBe(Math.round(10 * 2.6 * 1.3)) // ~34 days
		})

		it('should update ease factor based on quality', () => {
			const review = { ...baseReview, ease: 2.5 }

			// Hard answer should decrease ease
			const hardResult = calculateNextReview(review, 3)
			expect(hardResult.ease).toBeLessThan(2.5)

			// Easy answer should increase ease
			const easyResult = calculateNextReview(review, 5)
			expect(easyResult.ease).toBeGreaterThan(2.5)

			// Ease should not go below 1.3
			const veryLowEase = { ...review, ease: 1.3 }
			const result = calculateNextReview(veryLowEase, 1)
			expect(result.ease).toBeGreaterThanOrEqual(1.3)
		})

		it('should set correct next due date', () => {
			const now = new Date()
			const result = calculateNextReview(baseReview, 4)

			const expectedDue = new Date(now)
			expectedDue.setDate(expectedDue.getDate() + result.intervalDays)

			// Allow for small time differences due to test execution time
			expect(Math.abs(result.nextDue.getTime() - expectedDue.getTime())).toBeLessThan(1000)
		})
	})

	describe('initializeNewCard', () => {
		it('should create new card with default values', () => {
			const newCard = initializeNewCard()

			expect(newCard.ease).toBe(2.5)
			expect(newCard.intervalDays).toBe(0)
			expect(newCard.reps).toBe(0)
			expect(newCard.lapses).toBe(0)
			expect(newCard.lastReviewed).toBeUndefined()
			expect(newCard.nextDue.getTime()).toBeCloseTo(Date.now(), -1000)
		})
	})

	describe('isCardDue', () => {
		it('should return true when card is due', () => {
			const pastDue = new Date('2023-12-31T10:00:00Z')
			const review = { ...baseReview, nextDue: pastDue }

			expect(isCardDue(review, testDate)).toBe(true)
		})

		it('should return false when card is not due', () => {
			const futureDue = new Date('2024-01-02T10:00:00Z')
			const review = { ...baseReview, nextDue: futureDue }

			expect(isCardDue(review, testDate)).toBe(false)
		})

		it('should return true when due date equals current date', () => {
			const review = { ...baseReview, nextDue: testDate }

			expect(isCardDue(review, testDate)).toBe(true)
		})
	})

	describe('calculateDifficulty', () => {
		it('should classify new cards correctly', () => {
			const newCard = initializeNewCard()
			expect(calculateDifficulty(newCard)).toBe('new')
		})

		it('should classify learning cards correctly', () => {
			const learningCard = { ...baseReview, reps: 2, lapses: 0, ease: 2.5 }
			expect(calculateDifficulty(learningCard)).toBe('learning')
		})

		it('should classify review cards correctly', () => {
			const reviewCard = { ...baseReview, reps: 5, lapses: 1, ease: 2.3 }
			expect(calculateDifficulty(reviewCard)).toBe('review')
		})

		it('should classify difficult cards correctly', () => {
			const difficultCard1 = { ...baseReview, reps: 5, lapses: 3, ease: 2.5 }
			expect(calculateDifficulty(difficultCard1)).toBe('difficult')

			const difficultCard2 = { ...baseReview, reps: 5, lapses: 1, ease: 1.8 }
			expect(calculateDifficulty(difficultCard2)).toBe('difficult')
		})
	})

	describe('Progress Statistics', () => {
		let sampleReviews: ReviewData[]
		let sampleResults: ReviewResult[]

		beforeEach(() => {
			sampleReviews = [
				{ ...baseReview, reps: 3 },
				{ ...baseReview, reps: 1 },
				{ ...baseReview, reps: 0 }, // Not learned yet
				{ ...baseReview, reps: 5 },
			]

			sampleResults = [
				{ cardId: '1', quality: 4, responseTime: 2000, timestamp: testDate },
				{ cardId: '2', quality: 5, responseTime: 1500, timestamp: testDate },
				{ cardId: '3', quality: 1, responseTime: 5000, timestamp: testDate },
				{ cardId: '4', quality: 4, responseTime: 2500, timestamp: testDate },
			]
		})

		describe('calculateProgressStats', () => {
			it('should calculate correct statistics', () => {
				const stats = calculateProgressStats(sampleReviews, sampleResults, 10)

				expect(stats.totalCards).toBe(10)
				expect(stats.cardsLearned).toBe(3) // reps >= 1
				expect(stats.accuracy).toBe(0.75) // 3 out of 4 correct (quality >= 4)
				expect(stats.averageResponseTime).toBe(2750) // (2000+1500+5000+2500)/4
			})
		})

		describe('calculateCurrentStreak', () => {
			it('should calculate current streak correctly', () => {
				const results: ReviewResult[] = [
					{ cardId: '1', quality: 4, responseTime: 1000, timestamp: testDate },
					{ cardId: '2', quality: 1, responseTime: 1000, timestamp: testDate }, // breaks streak
					{ cardId: '3', quality: 4, responseTime: 1000, timestamp: testDate },
					{ cardId: '4', quality: 5, responseTime: 1000, timestamp: testDate },
				]

				expect(calculateCurrentStreak(results)).toBe(2) // Last 2 are correct
			})

			it('should return 0 for empty results', () => {
				expect(calculateCurrentStreak([])).toBe(0)
			})

			it('should handle all correct answers', () => {
				const allCorrect = Array(5)
					.fill(null)
					.map((_, i) => ({
						cardId: i.toString(),
						quality: 4 as const,
						responseTime: 1000,
						timestamp: testDate,
					}))

				expect(calculateCurrentStreak(allCorrect)).toBe(5)
			})
		})

		describe('calculateLongestStreak', () => {
			it('should find longest streak correctly', () => {
				const results: ReviewResult[] = [
					{ cardId: '1', quality: 4, responseTime: 1000, timestamp: testDate },
					{ cardId: '2', quality: 4, responseTime: 1000, timestamp: testDate },
					{ cardId: '3', quality: 4, responseTime: 1000, timestamp: testDate }, // streak of 3
					{ cardId: '4', quality: 1, responseTime: 1000, timestamp: testDate }, // break
					{ cardId: '5', quality: 5, responseTime: 1000, timestamp: testDate },
					{ cardId: '6', quality: 4, responseTime: 1000, timestamp: testDate }, // streak of 2
				]

				expect(calculateLongestStreak(results)).toBe(3)
			})
		})
	})

	describe('Card Management', () => {
		interface TestCard {
			id: string
			review?: ReviewData
		}

		let testCards: TestCard[]

		beforeEach(() => {
			testCards = [
				{ id: '1' }, // New card (no review)
				{ id: '2', review: { ...baseReview, nextDue: new Date('2023-12-31') } }, // Past due
				{ id: '3', review: { ...baseReview, nextDue: new Date('2024-01-02') } }, // Future due
				{ id: '4', review: { ...baseReview, nextDue: testDate } }, // Due now
			]
		})

		describe('getDueCards', () => {
			it('should return cards that are due', () => {
				const dueCards = getDueCards(testCards, testDate)

				expect(dueCards).toHaveLength(3) // New card, past due, and due now
				expect(dueCards.map((c) => c.id)).toEqual(['1', '2', '4'])
			})
		})

		describe('sortCardsByPriority', () => {
			it('should sort new cards first, then by due date', () => {
				const sorted = sortCardsByPriority(testCards)

				expect(sorted).toHaveLength(4)
				expect(sorted[0]?.id).toBe('1') // New card first
				expect(sorted[1]?.id).toBe('2') // Earliest due date
				expect(sorted[2]?.id).toBe('4') // Current date
				expect(sorted[3]?.id).toBe('3') // Latest due date
			})
		})

		describe('getDifficultCards', () => {
			it('should return only difficult cards', () => {
				const cardsWithDifficult: TestCard[] = [
					{ id: '1', review: { ...baseReview, reps: 5, lapses: 3 } }, // Difficult (high lapses)
					{ id: '2', review: { ...baseReview, reps: 5, ease: 1.8 } }, // Difficult (low ease)
					{ id: '3', review: { ...baseReview, reps: 5, lapses: 1, ease: 2.5 } }, // Normal
					{ id: '4' }, // New card
				]

				const difficultCards = getDifficultCards(cardsWithDifficult)

				expect(difficultCards).toHaveLength(2)
				expect(difficultCards.map((c) => c.id)).toEqual(['1', '2'])
			})
		})
	})
})
