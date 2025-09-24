import { describe, expect, it } from 'vitest'
import {
	getQualityDescription,
	getQualityLabel,
	getQualityOptions,
	getSuggestedQuality,
	isSuccessfulReview,
	QUALITY_DESCRIPTIONS,
	QUALITY_LABELS,
} from './qualityScheduling'
import { QUALITY_RATINGS } from './spacedRepetition'

describe('qualityScheduling', () => {
	describe('getQualityLabel', () => {
		it('should return correct labels for all quality ratings', () => {
			expect(getQualityLabel(QUALITY_RATINGS.AGAIN)).toBe('Again')
			expect(getQualityLabel(QUALITY_RATINGS.HARD)).toBe('Hard')
			expect(getQualityLabel(QUALITY_RATINGS.GOOD)).toBe('Good')
			expect(getQualityLabel(QUALITY_RATINGS.EASY)).toBe('Easy')
		})
	})

	describe('getQualityDescription', () => {
		it('should return correct descriptions for all quality ratings', () => {
			expect(getQualityDescription(QUALITY_RATINGS.AGAIN)).toBe(
				'Complete blackout, incorrect response',
			)
			expect(getQualityDescription(QUALITY_RATINGS.HARD)).toBe(
				'Correct response with serious difficulty',
			)
			expect(getQualityDescription(QUALITY_RATINGS.GOOD)).toBe(
				'Correct response after some hesitation',
			)
			expect(getQualityDescription(QUALITY_RATINGS.EASY)).toBe('Perfect response')
		})
	})

	describe('getQualityOptions', () => {
		it('should return all quality options with labels and descriptions', () => {
			const options = getQualityOptions()

			expect(options).toHaveLength(4)

			const againOption = options.find((opt) => opt.value === QUALITY_RATINGS.AGAIN)
			expect(againOption).toEqual({
				value: QUALITY_RATINGS.AGAIN,
				label: 'Again',
				description: 'Complete blackout, incorrect response',
			})

			const easyOption = options.find((opt) => opt.value === QUALITY_RATINGS.EASY)
			expect(easyOption).toEqual({
				value: QUALITY_RATINGS.EASY,
				label: 'Easy',
				description: 'Perfect response',
			})
		})
	})

	describe('isSuccessfulReview', () => {
		it('should return false for Again quality', () => {
			expect(isSuccessfulReview(QUALITY_RATINGS.AGAIN)).toBe(false)
		})

		it('should return true for Hard, Good, and Easy qualities', () => {
			expect(isSuccessfulReview(QUALITY_RATINGS.HARD)).toBe(true)
			expect(isSuccessfulReview(QUALITY_RATINGS.GOOD)).toBe(true)
			expect(isSuccessfulReview(QUALITY_RATINGS.EASY)).toBe(true)
		})
	})

	describe('getSuggestedQuality', () => {
		it('should suggest Good for new cards (no previous quality)', () => {
			expect(getSuggestedQuality()).toBe(QUALITY_RATINGS.GOOD)
		})

		it('should suggest Good for cards with many lapses', () => {
			expect(getSuggestedQuality(QUALITY_RATINGS.EASY, 3)).toBe(QUALITY_RATINGS.GOOD)
		})

		it('should suggest Good when previous was Easy', () => {
			expect(getSuggestedQuality(QUALITY_RATINGS.EASY, 0)).toBe(QUALITY_RATINGS.GOOD)
		})

		it('should suggest same as previous for other cases', () => {
			expect(getSuggestedQuality(QUALITY_RATINGS.HARD, 1)).toBe(QUALITY_RATINGS.HARD)
			expect(getSuggestedQuality(QUALITY_RATINGS.GOOD, 0)).toBe(QUALITY_RATINGS.GOOD)
		})
	})

	describe('constants', () => {
		it('should have all quality labels defined', () => {
			expect(QUALITY_LABELS[QUALITY_RATINGS.AGAIN]).toBeDefined()
			expect(QUALITY_LABELS[QUALITY_RATINGS.HARD]).toBeDefined()
			expect(QUALITY_LABELS[QUALITY_RATINGS.GOOD]).toBeDefined()
			expect(QUALITY_LABELS[QUALITY_RATINGS.EASY]).toBeDefined()
		})

		it('should have all quality descriptions defined', () => {
			expect(QUALITY_DESCRIPTIONS[QUALITY_RATINGS.AGAIN]).toBeDefined()
			expect(QUALITY_DESCRIPTIONS[QUALITY_RATINGS.HARD]).toBeDefined()
			expect(QUALITY_DESCRIPTIONS[QUALITY_RATINGS.GOOD]).toBeDefined()
			expect(QUALITY_DESCRIPTIONS[QUALITY_RATINGS.EASY]).toBeDefined()
		})
	})
})
