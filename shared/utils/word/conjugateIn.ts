import type { Aspect, Focus } from './conjugate.ts'
import {
	HIGH_BACK_VOWELS,
	insertInfix,
	isOneOf,
	LIQUID_CONSONANTS,
	reduplicate,
	transformDToR,
	transformOToU,
	VOWEL_REGEX,
} from './conjugateHelpers.ts'

/**
 * Optional per-root overrides for edge cases/irregulars.
 * DO NOT add regular, predictable verb forms here.
 */
const LEXICON: Partial<Record<string, Partial<Record<`${Focus}:${Aspect}`, string>>>> = {
	dala: {
		// Drops final vowel before -hin
		'in:infinitive': 'dalhin',
		'in:contemplated': 'dadalhin',
	},
	kuha: {
		// Complex: kuha → kunin (drops 'ha', adds 'n')
		'in:infinitive': 'kunin',
	},
}

function getOverride(root: string, focus: Focus, aspect: Aspect): string | undefined {
	return LEXICON[root]?.[`${focus}:${aspect}` as const]
}

/**
 * Determine if a root should use the -hin suffix instead of -in.
 * Applies when root ends with a vowel.
 * @example shouldUseHinSuffix('luto') // true
 * @example shouldUseHinSuffix('kain') // false
 */
function shouldUseHinSuffix(root: string): boolean {
	if (!root) return false
	const lastChar = root[root.length - 1]?.toLowerCase()
	return lastChar !== undefined && VOWEL_REGEX.test(lastChar)
}

/**
 * Build the -hin form of the infinitive for vowel-ending roots.
 * Handles special cases like liquid consonant initials.
 * @example buildHinForm('luto') // 'lutuin' (liquid + o/u uses -in)
 * @example buildHinForm('takbo') // 'takbuhin' (non-liquid + o/u uses -hin)
 * @example buildHinForm('dala') // 'dalhin' (other vowels use -hin)
 */
function buildHinForm(root: string): string {
	if (!root) return root
	const lastChar = root[root.length - 1]?.toLowerCase()
	const firstChar = root[0]?.toLowerCase()

	// Roots starting with liquid consonants (l/r) and ending with o/u use -in
	const isLiquidInitial = isOneOf(firstChar, LIQUID_CONSONANTS)
	const endsWithHighBackVowel = isOneOf(lastChar, HIGH_BACK_VOWELS)

	if (isLiquidInitial && endsWithHighBackVowel) {
		return `${transformOToU(root)}in`
	}

	// Other roots ending with o/u transform and use -hin
	if (endsWithHighBackVowel) {
		return `${transformOToU(root)}hin`
	}

	// Other vowel endings (a, e, i) simply add -hin
	return `${root}hin`
}

/**
 * Apply phonological transformations for -in suffix forms.
 * Applies d→r and o/u→u transformations in sequence.
 * @example applyInTransformations('lakad') // 'lakar'
 * @example applyInTransformations('inom') // 'inum'
 */
function applyInTransformations(root: string): string {
	let transformed = transformDToR(root)
	transformed = transformOToU(transformed)
	return transformed
}

/**
 * Build the infinitive form for IN focus.
 * @example buildInInfinitive('luto') // 'lutuin' (vowel-ending uses -hin form)
 * @example buildInInfinitive('kain') // 'kainin' (consonant-ending uses -in)
 */
function buildInInfinitive(root: string): string {
	const override = getOverride(root, 'in', 'infinitive')
	if (override) return override

	if (shouldUseHinSuffix(root)) {
		return buildHinForm(root)
	}

	// Consonant-ending: apply transformations then add -in
	return `${applyInTransformations(root)}in`
}

/**
 * Build the completed form for IN focus.
 * Uses different strategies based on root shape:
 * - Vowel-initial: prefix "in" (inom → ininom)
 * - Liquid-initial (l/r): prefix "ni" (luto → niluto)
 * - Others: infix "in" (kain → kinain)
 */
function buildInCompleted(root: string): string {
	const override = getOverride(root, 'in', 'completed')
	if (override) return override

	const firstChar = root[0]?.toLowerCase()
	if (root && VOWEL_REGEX.test(root[0] ?? '')) return `in${root}`
	if (isOneOf(firstChar, LIQUID_CONSONANTS)) return `ni${root}`
	return insertInfix(root, 'in')
}

/**
 * IN focus (object):
 *   inf:      suffix -in/-hin (lutuin, kainin, inumin)
 *   comp:     infix/prefix -in- or ni- based on root shape
 *   incomp:   reduplicate with matching infix/prefix pattern
 *   cont:     reduplicate + infinitive form
 */
export function conjIN(root: string, aspect: Aspect): string {
	switch (aspect) {
		case 'infinitive':
			return buildInInfinitive(root)

		case 'completed':
			return buildInCompleted(root)

		case 'incompleted': {
			const completed = buildInCompleted(root)
			// Match the pattern used in completed
			if (completed.startsWith('ni')) {
				return `ni${reduplicate(root)}`
			}
			return insertInfix(reduplicate(root), 'in')
		}

		case 'contemplated': {
			const reduplicated = reduplicate(root)
			const infinitive = buildInInfinitive(root)
			// Replace first occurrence of root with infinitive form
			return reduplicated.replace(root, infinitive)
		}
	}
}
