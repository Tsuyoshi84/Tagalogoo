export type Focus = 'mag' | 'um' | 'in'
export type Aspect = 'infinitive' | 'completed' | 'incompleted' | 'contemplated'

export interface ConjugateOptions {
	root: string
	focus: Focus
	aspect: Aspect
}

export function conjugate({ root, focus, aspect }: ConjugateOptions): string {
	const overrideResult = getOverride(root, focus, aspect)
	if (overrideResult !== undefined) return overrideResult

	return FOCUS_HANDLERS[focus](root, aspect)
}

const FOCUS_HANDLERS: Record<Focus, (root: string, aspect: Aspect) => string> = {
	mag: conjMAG,
	um: conjUM,
	in: conjIN,
}

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

// Phonological constants
const VOWEL_REGEX = /[aeiou]/i
const CONSONANT_REGEX = /[^aeiou]/i
const LIQUID_CONSONANTS = ['l', 'r'] as const
const HIGH_BACK_VOWELS = ['o', 'u'] as const

/**
 * Find the index of the first vowel in a string.
 * @returns Index of first vowel, or -1 if none found
 */
function firstVowelIndex(string: string): number {
	return string.search(VOWEL_REGEX)
}

/**
 * Extract the first syllable using a simple heuristic.
 * Returns from start to first vowel inclusive (CV pattern).
 * @example firstSyllable('luto') // 'lu'
 * @example firstSyllable('kain') // 'ka'
 */
function firstSyllable(root: string): string {
	if (!root) return root
	const firstChar = root[0] ?? ''
	const firstVowelIdx = firstVowelIndex(root)
	if (firstVowelIdx <= 0) return firstChar
	const vowel = root[firstVowelIdx]
	if (!vowel) return firstChar
	return `${firstChar}${vowel}`
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
 * Transform the last 'o' or 'u' to 'u' in the root.
 * This is a regular phonological rule for -in/-hin conjugation.
 * @example transformOToU('luto') // 'lutu'
 * @example transformOToU('inom') // 'inum'
 */
function transformOToU(root: string): string {
	const match = root.match(/[ou](?=[^ou]*$)/i)
	if (match && match.index !== undefined) {
		return root.slice(0, match.index) + 'u' + root.slice(match.index + 1)
	}
	return root
}

/**
 * Transform final 'd' to 'r'.
 * This is a regular phonological rule in Tagalog for -in verbs.
 * @example transformDToR('lakad') // 'lakar'
 * @example transformDToR('nood') // 'noor'
 */
function transformDToR(root: string): string {
	return root.endsWith('d') ? root.slice(0, -1) + 'r' : root
}

/**
 * Helper to check if character is in the given array.
 */
function isOneOf(char: string | undefined, chars: readonly string[]): boolean {
	return char !== undefined && chars.includes(char)
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
 * Insert an infix after the first consonant, or prefix if vowel-initial.
 * @example insertInfix('luto', 'um') // 'lumuto'
 * @example insertInfix('inom', 'um') // 'uminom' (vowel-initial)
 */
function insertInfix(root: string, infix: string): string {
	if (!root) return root
	const firstVowelIdx = firstVowelIndex(root)

	// Vowel-initial: prefix the infix
	if (firstVowelIdx === 0) {
		return infix + root
	}

	// Find first consonant and insert after it
	const firstConsonantIdx = root.search(CONSONANT_REGEX)
	if (firstConsonantIdx < 0) return infix + root

	return root.slice(0, firstConsonantIdx + 1) + infix + root.slice(firstConsonantIdx + 1)
}

/**
 * Reduplicate the first syllable of the root.
 * @example reduplicate('luto') // 'luluto'
 * @example reduplicate('kain') // 'kakain'
 */
function reduplicate(root: string): string {
	return firstSyllable(root) + root
}

/**
 * Attach a prefix to a stem, using hyphen if stem is vowel-initial.
 * @example attachPrefix('mag', 'luto') // 'magluto'
 * @example attachPrefix('mag', 'aral') // 'mag-aral'
 */
function attachPrefix(prefix: string, stem: string): string {
	if (!stem) return prefix
	const isVowelInitial = VOWEL_REGEX.test(stem[0] ?? '')
	return isVowelInitial ? `${prefix}-${stem}` : prefix + stem
}

/**
 * MAG focus:
 *   inf: mag + root
 *   comp: nag + root
 *   incomp: nag + redup(root)
 *   cont: mag + redup(root)
 */
function conjMAG(root: string, aspect: Aspect): string {
	switch (aspect) {
		case 'infinitive':
			return attachPrefix('mag', root)
		case 'completed':
			return attachPrefix('nag', root)
		case 'incompleted':
			return attachPrefix('nag', reduplicate(root))
		case 'contemplated':
			return attachPrefix('mag', reduplicate(root))
	}
}

/**
 * UM focus (actor):
 *   inf/comp: insert -um- after first consonant (or prefix if vowel-initial)
 *   incomp:   insert -um- and reduplicate the syllable after it (practical shortcut: reinsert "um" then add first syllable)
 *   cont:     redup(root) (no "um" in future)
 *
 * Note: For many roots like "luto", UM exists (lumuto/lumuluto/luluto) but MAG is far more idiomatic.
 */
function conjUM(root: string, aspect: Aspect): string {
	switch (aspect) {
		case 'infinitive':
		case 'completed':
			return insertInfix(root, 'um')
		case 'incompleted':
			return insertInfix(reduplicate(root), 'um')
		case 'contemplated':
			return reduplicate(root) // kakain, luluto, iinom
	}
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
function conjIN(root: string, aspect: Aspect): string {
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
