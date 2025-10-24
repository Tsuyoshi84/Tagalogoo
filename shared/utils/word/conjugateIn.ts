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
 * Lexicon of irregular verb forms that don't follow standard conjugation patterns.
 *
 * This map stores exceptions that cannot be generated algorithmically from the root.
 * Only truly irregular forms should be added here - regular phonological transformations
 * should be handled in the conjugation logic itself.
 *
 * Common irregular verbs:
 * - dala: inserts "h" in the future form (dadalhin)
 * - kuha: irregular vowel change, no `hin` (kukunin)
 * - turo: drops `hin` in the future (ituturo)
 * - bigay: uses `i-` prefix, irregular pattern (ibibigay)
 */
const LEXICON: Partial<Record<string, Partial<Record<`${Focus}:${Aspect}`, string>>>> = {
	dala: {
		// Drops final vowel before -hin in infinitive and contemplated
		'in:infinitive': 'dalhin',
		'in:contemplated': 'dadalhin',
	},
	kuha: {
		// Complex: kuha → kunin (drops 'ha', adds 'n')
		'in:infinitive': 'kunin',
		'in:contemplated': 'kukunin',
	},
	turo: {
		// Uses i- prefix pattern, drops hin in contemplated
		'in:infinitive': 'ituro',
		'in:completed': 'itinuro',
		'in:incompleted': 'itinuturo',
		'in:contemplated': 'ituturo',
	},
	bigay: {
		// Uses i- prefix pattern throughout
		'in:infinitive': 'ibigay',
		'in:completed': 'ibinigay',
		'in:incompleted': 'ibinibigay',
		'in:contemplated': 'ibibigay',
	},
}

function getOverride(root: string, focus: Focus, aspect: Aspect): string | undefined {
	return LEXICON[root]?.[`${focus}:${aspect}` as const]
}

/**
 * Determines if a verb root should use the -hin suffix instead of -in.
 *
 * The -hin suffix is used when the root ends with a vowel. Consonant-ending
 * roots use the simpler -in suffix.
 *
 * @param root - The verb root to check
 * @returns `true` if the root ends with a vowel, `false` otherwise
 *
 * @example
 * shouldUseHinSuffix('luto') // true (ends with 'o')
 * shouldUseHinSuffix('kain') // false (ends with 'n')
 * shouldUseHinSuffix('bili') // true (ends with 'i')
 */
function shouldUseHinSuffix(root: string): boolean {
	if (!root) return false
	const lastChar = root[root.length - 1]?.toLowerCase()
	return lastChar !== undefined && VOWEL_REGEX.test(lastChar)
}

/**
 * Builds the infinitive form with -hin suffix for vowel-ending roots.
 *
 * This function applies complex phonological rules:
 * 1. Roots starting with liquid consonants (l/r) + ending with o/u → transform o/u and use -in
 * 2. Other roots ending with o/u → transform o/u and use -hin
 * 3. Roots ending with other vowels (a/e/i) → just add -hin
 *
 * @param root - The vowel-ending verb root
 * @returns The infinitive form with appropriate suffix
 *
 * @example
 * // Liquid initial (l/r) + o/u ending: use -in suffix
 * buildHinForm('luto') // 'lutuin' (l + o → u + in)
 * buildHinForm('relo') // 'reluhin' (r + o → u + in)
 *
 * @example
 * // Non-liquid + o/u ending: use -hin suffix
 * buildHinForm('takbo') // 'takbuhin' (o → u + hin)
 * buildHinForm('puno') // 'punuhin' (o → u + hin)
 *
 * @example
 * // Other vowel endings: just add -hin
 * buildHinForm('dala') // 'dalhin' (a + hin)
 * buildHinForm('bili') // 'bilihin' (i + hin)
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
 * Applies phonological transformations for consonant-ending roots with -in suffix.
 *
 * This function applies two transformations in sequence:
 * 1. d → r: Final 'd' becomes 'r' (lakad → lakar)
 * 2. o/u → u: Internal 'o' becomes 'u' for consistency (inom → inum)
 *
 * @param root - The verb root to transform
 * @returns The transformed root ready for -in suffix
 *
 * @example
 * // Final 'd' becomes 'r'
 * applyInTransformations('lakad') // 'lakar' → lakarin
 * applyInTransformations('tawid') // 'tawir' → tawirin
 *
 * @example
 * // Internal 'o' becomes 'u'
 * applyInTransformations('inom') // 'inum' → inumin
 * applyInTransformations('sulat') // 'sulat' (no change, no 'o')
 */
function applyInTransformations(root: string): string {
	let transformed = transformDToR(root)
	transformed = transformOToU(transformed)
	return transformed
}

/**
 * Builds the infinitive form for IN focus (object focus).
 *
 * The strategy depends on whether the root ends with a vowel or consonant:
 * - Vowel-ending roots: use buildHinForm() which applies complex rules
 * - Consonant-ending roots: apply transformations (d→r, o→u) then add -in
 *
 * @param root - The verb root
 * @returns The infinitive form in IN focus
 *
 * @example
 * // Vowel-ending roots use -hin form
 * buildInInfinitive('luto') // 'lutuin' (liquid + o/u)
 * buildInInfinitive('dala') // 'dalhin' (other vowel)
 * buildInInfinitive('bili') // 'bilihin' (ends with i)
 *
 * @example
 * // Consonant-ending roots use -in with transformations
 * buildInInfinitive('kain') // 'kainin' (no transformation needed)
 * buildInInfinitive('lakad') // 'lakarin' (d→r transformation)
 * buildInInfinitive('inom') // 'inumin' (o→u transformation)
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
 * Builds the completed aspect form for IN focus.
 *
 * The strategy depends on the initial letter of the root:
 * - Vowel-initial: prefix "in-" (inom → ininom)
 * - Liquid consonant initial (l/r): prefix "ni-" (luto → niluto)
 * - Other consonants: infix "-in-" after first consonant (kain → kinain)
 *
 * @param root - The verb root
 * @returns The completed form in IN focus
 *
 * @example
 * // Vowel-initial: prefix "in-"
 * buildInCompleted('inom') // 'ininom' (drank)
 * buildInCompleted('abot') // 'inabot' (reached)
 *
 * @example
 * // Liquid-initial (l/r): prefix "ni-"
 * buildInCompleted('luto') // 'niluto' (cooked)
 * buildInCompleted('relo') // 'nirelo' (watched over)
 *
 * @example
 * // Other consonants: infix "-in-"
 * buildInCompleted('kain') // 'kinain' (eaten)
 * buildInCompleted('sulat') // 'sinulat' (written)
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
 * Conjugates a Tagalog verb root in the IN focus (object focus).
 *
 * IN focus emphasizes the object/receiver of the action. The conjugation patterns
 * are more complex than UM or MAG focus, with different strategies based on root shape.
 *
 * @param root - The base form of the verb (e.g., "kain", "luto", "inom")
 * @param aspect - The verbal aspect: infinitive, completed, incompleted, or contemplated
 * @returns The conjugated verb form
 *
 * @example
 * // Infinitive: uses -in or -hin suffix based on root ending
 * conjIN('kain', 'infinitive') // 'kainin' (to eat it)
 * conjIN('luto', 'infinitive') // 'lutuin' (to cook it)
 * conjIN('dala', 'infinitive') // 'dalhin' (to bring it)
 *
 * @example
 * // Completed: uses in-/ni- prefix or -in- infix based on initial letter
 * conjIN('kain', 'completed') // 'kinain' (ate it)
 * conjIN('luto', 'completed') // 'niluto' (cooked it - liquid initial)
 * conjIN('inom', 'completed') // 'ininom' (drank it - vowel initial)
 *
 * @example
 * // Incompleted: reduplicated with matching in-/ni- pattern
 * conjIN('kain', 'incompleted') // 'kinakain' (eating it)
 * conjIN('luto', 'incompleted') // 'niluluto' (cooking it)
 *
 * @example
 * // Contemplated: reduplicated root + infinitive suffix
 * conjIN('kain', 'contemplated') // 'kakaining' (will eat it)
 * conjIN('luto', 'contemplated') // 'lulutuin' (will cook it)
 *
 * @remarks
 * - Vowel-ending roots typically use -hin suffix (with exceptions for liquid initials)
 * - Consonant-ending roots use -in suffix with phonological transformations (d→r, o→u)
 * - Completed aspect uses ni- prefix for liquid-initial roots (l/r)
 * - Some verbs like "dala" and "kuha" have irregular forms stored in LEXICON
 */
export function conjIN(root: string, aspect: Aspect): string {
	switch (aspect) {
		case 'infinitive':
			return buildInInfinitive(root)

		case 'completed':
			return buildInCompleted(root)

		case 'incompleted': {
			// Check for lexicon override first
			const override = getOverride(root, 'in', 'incompleted')
			if (override) return override

			const completed = buildInCompleted(root)
			// Match the pattern used in completed
			if (completed.startsWith('ni')) {
				return `ni${reduplicate(root)}`
			}
			if (completed.startsWith('i') && !VOWEL_REGEX.test(root[0] ?? '')) {
				// Handle i- prefix pattern for consonant-initial verbs (e.g., itinuro → itinuturo)
				// But NOT for vowel-initial verbs (e.g., inom → ininom, not iiniinom)
				return `i${insertInfix(reduplicate(root), 'in')}`
			}
			return insertInfix(reduplicate(root), 'in')
		}

		case 'contemplated': {
			// Check for lexicon override first
			const override = getOverride(root, 'in', 'contemplated')
			if (override) return override

			const reduplicated = reduplicate(root)
			const infinitive = buildInInfinitive(root)
			// Replace first occurrence of root with infinitive form
			return reduplicated.replace(root, infinitive)
		}
	}
}
