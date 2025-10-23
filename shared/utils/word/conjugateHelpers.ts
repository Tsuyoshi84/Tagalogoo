// Phonological constants
export const VOWEL_REGEX = /[aeiou]/i
export const CONSONANT_REGEX = /[^aeiou]/i
export const LIQUID_CONSONANTS = ['l', 'r'] as const
export const HIGH_BACK_VOWELS = ['o', 'u'] as const
const LAST_OU_REGEX = /[ou](?=[^ou]*$)/i

/**
 * Find the index of the first vowel in a string.
 * @returns Index of first vowel, or -1 if none found
 */
export function firstVowelIndex(string: string): number {
	return string.search(VOWEL_REGEX)
}

/**
 * Extract the first syllable using a simple heuristic.
 * Returns from start to first vowel inclusive (CV pattern).
 * @example firstSyllable('luto') // 'lu'
 * @example firstSyllable('kain') // 'ka'
 */
export function firstSyllable(root: string): string {
	if (!root) return root
	const firstChar = root[0] ?? ''
	const firstVowelIdx = firstVowelIndex(root)
	if (firstVowelIdx <= 0) return firstChar
	const vowel = root[firstVowelIdx]
	if (!vowel) return firstChar
	return `${firstChar}${vowel}`
}

/**
 * Reduplicate the first syllable of the root.
 * @example reduplicate('luto') // 'luluto'
 * @example reduplicate('kain') // 'kakain'
 */
export function reduplicate(root: string): string {
	return firstSyllable(root) + root
}

/**
 * Attach a prefix to a stem, using hyphen if stem is vowel-initial.
 * @example attachPrefix('mag', 'luto') // 'magluto'
 * @example attachPrefix('mag', 'aral') // 'mag-aral'
 */
export function attachPrefix(prefix: string, stem: string): string {
	if (!stem) return prefix
	const isVowelInitial = VOWEL_REGEX.test(stem[0] ?? '')
	return isVowelInitial ? `${prefix}-${stem}` : prefix + stem
}

/**
 * Insert an infix after the first consonant, or prefix if vowel-initial.
 * @example insertInfix('luto', 'um') // 'lumuto'
 * @example insertInfix('inom', 'um') // 'uminom' (vowel-initial)
 */
export function insertInfix(root: string, infix: string): string {
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
 * Helper to check if character is in the given array.
 */
export function isOneOf(char: string | undefined, chars: readonly string[]): boolean {
	return char !== undefined && chars.includes(char)
}

/**
 * Transform the last 'o' or 'u' to 'u' in the root.
 * This is a regular phonological rule for -in/-hin conjugation.
 * @example transformOToU('luto') // 'lutu'
 * @example transformOToU('inom') // 'inum'
 */
export function transformOToU(root: string): string {
	const match = root.match(LAST_OU_REGEX)
	if (match && match.index !== undefined) {
		return `${root.slice(0, match.index)}u${root.slice(match.index + 1)}`
	}
	return root
}

/**
 * Transform final 'd' to 'r'.
 * This is a regular phonological rule in Tagalog for -in verbs.
 * @example transformDToR('lakad') // 'lakar'
 * @example transformDToR('nood') // 'noor'
 */
export function transformDToR(root: string): string {
	return root.endsWith('d') ? `${root.slice(0, -1)}r` : root
}
