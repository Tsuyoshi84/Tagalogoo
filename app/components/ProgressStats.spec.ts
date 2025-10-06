import { describe, expect, it } from 'vitest'

/**
 * Test helper functions for ProgressStats component
 * These functions are extracted from the component for easier testing
 */

/**
 * Format study time from seconds to human readable format
 */
function formatStudyTime(seconds: number): string {
	const hours = Math.floor(seconds / 3600)
	const minutes = Math.floor((seconds % 3600) / 60)

	if (hours > 0) {
		return `${hours}h ${minutes}m`
	}
	return `${minutes}m`
}

/**
 * Get progress bar color class based on percentage
 */
function getProgressBarColor(percentage: number): string {
	if (percentage >= 80) return 'progress-success'
	if (percentage >= 60) return 'progress-info'
	if (percentage >= 40) return 'progress-warning'
	return 'progress-error'
}

/**
 * Calculate overall completion rate from category progress
 */
function calculateOverallCompletionRate(totalWords: number, totalLearned: number): number {
	if (totalWords === 0) return 0
	return Math.round((totalLearned / totalWords) * 100)
}

describe('ProgressStats Helper Functions', () => {
	describe('formatStudyTime', () => {
		it('formats hours and minutes correctly', () => {
			expect(formatStudyTime(3600)).toBe('1h 0m') // 1 hour
			expect(formatStudyTime(1800)).toBe('30m') // 30 minutes
			expect(formatStudyTime(7200)).toBe('2h 0m') // 2 hours
			expect(formatStudyTime(3900)).toBe('1h 5m') // 1 hour 5 minutes
			expect(formatStudyTime(0)).toBe('0m') // 0 minutes
			expect(formatStudyTime(59)).toBe('0m') // Less than 1 minute
			expect(formatStudyTime(60)).toBe('1m') // Exactly 1 minute
		})
	})

	describe('getProgressBarColor', () => {
		it('returns correct color classes based on percentage', () => {
			expect(getProgressBarColor(90)).toBe('progress-success')
			expect(getProgressBarColor(80)).toBe('progress-success')
			expect(getProgressBarColor(70)).toBe('progress-info')
			expect(getProgressBarColor(60)).toBe('progress-info')
			expect(getProgressBarColor(50)).toBe('progress-warning')
			expect(getProgressBarColor(40)).toBe('progress-warning')
			expect(getProgressBarColor(30)).toBe('progress-error')
			expect(getProgressBarColor(0)).toBe('progress-error')
		})
	})

	describe('calculateOverallCompletionRate', () => {
		it('calculates completion rate correctly', () => {
			expect(calculateOverallCompletionRate(100, 50)).toBe(50)
			expect(calculateOverallCompletionRate(100, 75)).toBe(75)
			expect(calculateOverallCompletionRate(100, 0)).toBe(0)
			expect(calculateOverallCompletionRate(100, 100)).toBe(100)
			expect(calculateOverallCompletionRate(0, 0)).toBe(0)
		})

		it('handles edge cases', () => {
			expect(calculateOverallCompletionRate(0, 5)).toBe(0) // Division by zero
			expect(calculateOverallCompletionRate(3, 2)).toBe(67) // Rounds correctly
		})
	})
})
