/**
 * Quality-based scheduling utilities for flashcard reviews
 *
 * This module provides helper functions for working with quality ratings
 * and their corresponding scheduling behaviors.
 */

import { QUALITY_RATINGS, type QualityRating } from './spacedRepetition'

/**
 * Human-readable labels for quality ratings
 *
 * Maps quality rating values to user-friendly display labels
 * for use in UI components and user feedback.
 */
export const QUALITY_LABELS = {
	[QUALITY_RATINGS.AGAIN]: 'Again',
	[QUALITY_RATINGS.HARD]: 'Hard',
	[QUALITY_RATINGS.GOOD]: 'Good',
	[QUALITY_RATINGS.EASY]: 'Easy',
} as const

/**
 * Detailed descriptions for quality ratings
 *
 * Provides explanatory text for each quality rating to help users
 * understand when to use each option during reviews.
 */
export const QUALITY_DESCRIPTIONS = {
	[QUALITY_RATINGS.AGAIN]: 'Complete blackout, incorrect response',
	[QUALITY_RATINGS.HARD]: 'Correct response with serious difficulty',
	[QUALITY_RATINGS.GOOD]: 'Correct response after some hesitation',
	[QUALITY_RATINGS.EASY]: 'Perfect response',
} as const

/**
 * Get the human-readable label for a quality rating
 *
 * Converts a numeric quality rating into a user-friendly display label.
 * Useful for UI components that need to show quality options.
 *
 * @param quality - Quality rating value
 * @returns Human-readable label
 *
 * @example
 * ```ts
 * const label = getQualityLabel(QUALITY_RATINGS.GOOD);
 * console.log(label); // "Good"
 *
 * const againLabel = getQualityLabel(1);
 * console.log(againLabel); // "Again"
 * ```
 */
export function getQualityLabel(quality: QualityRating): string {
	return QUALITY_LABELS[quality]
}

/**
 * Get the detailed description for a quality rating
 *
 * Provides explanatory text to help users understand what each
 * quality rating represents and when to use it.
 *
 * @param quality - Quality rating value
 * @returns Human-readable description
 *
 * @example
 * ```ts
 * const description = getQualityDescription(QUALITY_RATINGS.HARD);
 * console.log(description); // "Correct response with serious difficulty"
 * ```
 */
export function getQualityDescription(quality: QualityRating): string {
	return QUALITY_DESCRIPTIONS[quality]
}

/**
 * Get all available quality options for UI rendering
 *
 * Returns a structured array of all quality options with their labels
 * and descriptions. Perfect for rendering quality selection buttons or dropdowns.
 *
 * @returns Array of quality options with labels and descriptions
 *
 * @example
 * ```ts
 * const options = getQualityOptions();
 * console.log(options);
 * // [
 * //   { value: 1, label: "Again", description: "Complete blackout, incorrect response" },
 * //   { value: 3, label: "Hard", description: "Correct response with serious difficulty" },
 * //   { value: 4, label: "Good", description: "Correct response after some hesitation" },
 * //   { value: 5, label: "Easy", description: "Perfect response" }
 * // ]
 *
 * // Usage in UI component:
 * options.forEach(option => {
 *   console.log(`Button: ${option.label} - ${option.description}`);
 * });
 * ```
 */
export function getQualityOptions(): readonly {
	value: QualityRating
	label: string
	description: string
}[] {
	return Object.values(QUALITY_RATINGS).map((quality) => ({
		value: quality,
		label: getQualityLabel(quality),
		description: getQualityDescription(quality),
	}))
}

/**
 * Determine if a quality rating indicates a successful review
 *
 * Checks whether a quality rating should be considered a "correct" or
 * "successful" response for accuracy and progress calculations.
 *
 * @param quality - Quality rating to check
 * @returns True if the rating indicates a successful review
 *
 * @example
 * ```ts
 * console.log(isSuccessfulReview(QUALITY_RATINGS.AGAIN)); // false
 * console.log(isSuccessfulReview(QUALITY_RATINGS.HARD)); // true
 * console.log(isSuccessfulReview(QUALITY_RATINGS.GOOD)); // true
 * console.log(isSuccessfulReview(QUALITY_RATINGS.EASY)); // true
 *
 * // Usage in accuracy calculation:
 * const correctAnswers = outcomes.filter(outcome =>
 *   isSuccessfulReview(outcome.quality)
 * ).length;
 * ```
 */
export function isSuccessfulReview(quality: QualityRating): boolean {
	return quality >= QUALITY_RATINGS.HARD
}

/**
 * Get the next suggested quality based on previous performance
 *
 * Provides intelligent suggestions for quality ratings based on the card's
 * history. This can be used for UI hints, default selections, or adaptive
 * learning algorithms.
 *
 * @param previousQuality - Previous quality rating for this card
 * @param lapses - Number of times the card has been forgotten
 * @returns Suggested quality rating
 *
 * @example
 * ```ts
 * // New card (no previous quality)
 * const suggestion1 = getSuggestedQuality();
 * console.log(suggestion1); // QUALITY_RATINGS.GOOD (4)
 *
 * // Card with many lapses
 * const suggestion2 = getSuggestedQuality(QUALITY_RATINGS.EASY, 3);
 * console.log(suggestion2); // QUALITY_RATINGS.GOOD (4) - be conservative
 *
 * // Previously easy card
 * const suggestion3 = getSuggestedQuality(QUALITY_RATINGS.EASY, 0);
 * console.log(suggestion3); // QUALITY_RATINGS.GOOD (4) - slight regression is normal
 *
 * // Previously good card
 * const suggestion4 = getSuggestedQuality(QUALITY_RATINGS.GOOD, 1);
 * console.log(suggestion4); // QUALITY_RATINGS.GOOD (4) - maintain same level
 * ```
 */
export function getSuggestedQuality(previousQuality?: QualityRating, lapses = 0): QualityRating {
	// If no previous quality or many lapses, suggest starting with Good
	if (!previousQuality || lapses > 2) {
		return QUALITY_RATINGS.GOOD
	}

	// If previous was Easy, suggest Good (slight regression is normal)
	if (previousQuality === QUALITY_RATINGS.EASY) {
		return QUALITY_RATINGS.GOOD
	}

	// Otherwise, suggest the same as previous
	return previousQuality
}
