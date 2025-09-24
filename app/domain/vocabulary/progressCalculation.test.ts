import { describe, expect, it } from 'vitest'
import {
	calculateDailyStats,
	calculateLearningVelocity,
	calculateProgressStats,
	calculateSessionStats,
	calculateStreaks,
	getDifficultCards,
	getDueCards,
	isReviewCorrect,
	type ReviewOutcome,
} from './progressCalculation'
import type { ReviewData } from './spacedRepetition'

describe('progressCalculation', () => {
	describe('calculateSessionStats', () => {
		it('should calculate basic session statistics', () => {
			const outcomes: ReviewOutcome[] = [
				{
					cardId: '1',
					quality: 4,
					responseTime: 2000,
					timestamp: new Date(),
					wasCorrect: true,
				},
				{
					cardId: '2',
					quality: 1,
					responseTime: 5000,
					timestamp: new Date(),
					wasCorrect: false,
				},
				{
					cardId: '3',
					quality: 5,
					responseTime: 1500,
					timestamp: new Date(),
					wasCorrect: true,
				},
			]

			const startTime = new Date('2024-01-01T10:00:00Z')
			const endTime = new Date('2024-01-01T10:05:00Z') // 5 minutes later

			const stats = calculateSessionStats(outcomes, startTime, endTime)

			expect(stats.cardsStudied).toBe(3)
			expect(stats.correctAnswers).toBe(2)
			expect(stats.accuracy).toBe(66.67)
			expect(stats.sessionDuration).toBe(300) // 5 minutes in seconds
			expect(stats.newCardsLearned).toBe(2) // Quality >= 3
			expect(stats.reviewsCompleted).toBe(3)
		})

		it('should handle empty outcomes', () => {
			const outcomes: ReviewOutcome[] = []
			const startTime = new Date()
			const endTime = new Date()

			const stats = calculateSessionStats(outcomes, startTime, endTime)

			expect(stats.cardsStudied).toBe(0)
			expect(stats.correctAnswers).toBe(0)
			expect(stats.accuracy).toBe(0)
			expect(stats.newCardsLearned).toBe(0)
		})
	})

	describe('calculateProgressStats', () => {
		it('should calculate overall progress statistics', () => {
			const reviews: ReviewData[] = [
				{
					ease: 2.5,
					intervalDays: 1,
					reps: 0,
					lapses: 0,
					nextDue: new Date(),
				},
				{
					ease: 2.8,
					intervalDays: 5,
					reps: 3,
					lapses: 0,
					nextDue: new Date(),
				},
				{
					ease: 2.6,
					intervalDays: 10,
					reps: 5,
					lapses: 1,
					nextDue: new Date(),
				},
			]

			const outcomes: ReviewOutcome[] = [
				{
					cardId: '1',
					quality: 4,
					responseTime: 2000,
					timestamp: new Date(),
					wasCorrect: true,
				},
				{
					cardId: '2',
					quality: 1,
					responseTime: 3000,
					timestamp: new Date(),
					wasCorrect: false,
				},
				{
					cardId: '3',
					quality: 5,
					responseTime: 1500,
					timestamp: new Date(),
					wasCorrect: true,
				},
			]

			const totalStudyTime = 3600 // 1 hour

			const stats = calculateProgressStats(reviews, outcomes, totalStudyTime)

			expect(stats.totalCards).toBe(3)
			expect(stats.cardsLearned).toBe(2) // reps > 0
			expect(stats.cardsMastered).toBe(2) // reps >= 3 and ease >= 2.5
			expect(stats.averageAccuracy).toBe(66.67)
			expect(stats.totalStudyTime).toBe(3600)
			expect(stats.totalReviews).toBe(3)
		})
	})

	describe('calculateStreaks', () => {
		it('should calculate current and longest streaks correctly', () => {
			const outcomes: ReviewOutcome[] = [
				{
					cardId: '1',
					quality: 4,
					responseTime: 2000,
					timestamp: new Date('2024-01-05T10:00:00Z'),
					wasCorrect: true,
				},
				{
					cardId: '2',
					quality: 4,
					responseTime: 2000,
					timestamp: new Date('2024-01-04T10:00:00Z'),
					wasCorrect: true,
				},
				{
					cardId: '3',
					quality: 1,
					responseTime: 2000,
					timestamp: new Date('2024-01-03T10:00:00Z'),
					wasCorrect: false,
				},
				{
					cardId: '4',
					quality: 4,
					responseTime: 2000,
					timestamp: new Date('2024-01-02T10:00:00Z'),
					wasCorrect: true,
				},
				{
					cardId: '5',
					quality: 5,
					responseTime: 2000,
					timestamp: new Date('2024-01-01T10:00:00Z'),
					wasCorrect: true,
				},
			]

			const { currentStreak, longestStreak } = calculateStreaks(outcomes)

			expect(currentStreak).toBe(2) // Last 2 were correct
			expect(longestStreak).toBe(2) // Longest consecutive correct answers
		})

		it('should handle empty outcomes', () => {
			const { currentStreak, longestStreak } = calculateStreaks([])

			expect(currentStreak).toBe(0)
			expect(longestStreak).toBe(0)
		})

		it('should handle all correct answers', () => {
			const outcomes: ReviewOutcome[] = [
				{
					cardId: '1',
					quality: 4,
					responseTime: 2000,
					timestamp: new Date('2024-01-03T10:00:00Z'),
					wasCorrect: true,
				},
				{
					cardId: '2',
					quality: 5,
					responseTime: 2000,
					timestamp: new Date('2024-01-02T10:00:00Z'),
					wasCorrect: true,
				},
				{
					cardId: '3',
					quality: 4,
					responseTime: 2000,
					timestamp: new Date('2024-01-01T10:00:00Z'),
					wasCorrect: true,
				},
			]

			const { currentStreak, longestStreak } = calculateStreaks(outcomes)

			expect(currentStreak).toBe(3)
			expect(longestStreak).toBe(3)
		})
	})

	describe('calculateDailyStats', () => {
		it('should calculate statistics for a specific day', () => {
			const targetDate = new Date('2024-01-01')
			const outcomes: ReviewOutcome[] = [
				{
					cardId: '1',
					quality: 4,
					responseTime: 2000,
					timestamp: new Date('2024-01-01T10:00:00Z'),
					wasCorrect: true,
				},
				{
					cardId: '2',
					quality: 1,
					responseTime: 3000,
					timestamp: new Date('2024-01-01T11:00:00Z'),
					wasCorrect: false,
				},
				{
					cardId: '3',
					quality: 5,
					responseTime: 1500,
					timestamp: new Date('2024-01-02T10:00:00Z'), // Different day
					wasCorrect: true,
				},
			]

			const stats = calculateDailyStats(outcomes, targetDate)

			expect(stats.cardsStudied).toBe(2) // Only first 2 are from target date
			expect(stats.accuracy).toBe(50) // 1 correct out of 2
			expect(stats.studyTime).toBe(5) // (2000 + 3000) / 1000 = 5 seconds
			expect(stats.newCards).toBe(1) // Quality >= 3
			expect(stats.reviewCards).toBe(1) // cardsStudied - newCards
		})

		it('should handle days with no activity', () => {
			const targetDate = new Date('2024-01-01')
			const outcomes: ReviewOutcome[] = []

			const stats = calculateDailyStats(outcomes, targetDate)

			expect(stats.cardsStudied).toBe(0)
			expect(stats.accuracy).toBe(0)
			expect(stats.studyTime).toBe(0)
			expect(stats.newCards).toBe(0)
			expect(stats.reviewCards).toBe(0)
		})
	})

	describe('isReviewCorrect', () => {
		it('should consider quality >= 3 as correct', () => {
			expect(isReviewCorrect(1)).toBe(false) // Again
			expect(isReviewCorrect(3)).toBe(true) // Hard
			expect(isReviewCorrect(4)).toBe(true) // Good
			expect(isReviewCorrect(5)).toBe(true) // Easy
		})
	})

	describe('calculateLearningVelocity', () => {
		it('should calculate cards learned per day', () => {
			const now = new Date()
			const reviews: ReviewData[] = [
				{
					ease: 2.5,
					intervalDays: 1,
					reps: 1,
					lapses: 0,
					nextDue: new Date(),
					lastReviewed: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
				},
				{
					ease: 2.5,
					intervalDays: 1,
					reps: 2,
					lapses: 0,
					nextDue: new Date(),
					lastReviewed: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
				},
				{
					ease: 2.5,
					intervalDays: 1,
					reps: 0, // Not learned yet
					lapses: 0,
					nextDue: new Date(),
				},
			]

			const velocity = calculateLearningVelocity(reviews, 30)
			expect(velocity).toBe(0.07) // 2 cards in 30 days = 0.0667, rounded to 0.07
		})
	})

	describe('getDueCards', () => {
		it('should return only cards that are due', () => {
			const now = new Date()
			const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
			const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

			const reviews: ReviewData[] = [
				{
					ease: 2.5,
					intervalDays: 1,
					reps: 1,
					lapses: 0,
					nextDue: yesterday, // Due (overdue)
				},
				{
					ease: 2.5,
					intervalDays: 1,
					reps: 1,
					lapses: 0,
					nextDue: now, // Due (today)
				},
				{
					ease: 2.5,
					intervalDays: 1,
					reps: 1,
					lapses: 0,
					nextDue: tomorrow, // Not due yet
				},
			]

			const dueCards = getDueCards(reviews, now)
			expect(dueCards).toHaveLength(2)
		})
	})

	describe('getDifficultCards', () => {
		it('should return cards that meet difficulty criteria', () => {
			const reviews: ReviewData[] = [
				{
					ease: 2.5,
					intervalDays: 1,
					reps: 1,
					lapses: 3, // High lapses - difficult
					nextDue: new Date(),
				},
				{
					ease: 1.8, // Low ease - difficult
					intervalDays: 1,
					reps: 2,
					lapses: 1,
					nextDue: new Date(),
				},
				{
					ease: 2.1, // Low ease with many reps - difficult
					intervalDays: 5,
					reps: 6,
					lapses: 1,
					nextDue: new Date(),
				},
				{
					ease: 2.8, // Good performance - not difficult
					intervalDays: 10,
					reps: 5,
					lapses: 1,
					nextDue: new Date(),
				},
			]

			const difficultCards = getDifficultCards(reviews)
			expect(difficultCards).toHaveLength(3)
		})
	})
})
