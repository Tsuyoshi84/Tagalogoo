// tagalog-conjugator.ts

export type Focus = 'mag' | 'um' | 'in'
export type Aspect = 'infinitive' | 'completed' | 'incompleted' | 'contemplated'

export interface ConjugateOptions {
	root: string // e.g. "luto", "kain", "basa", "inom"
	focus: Focus // "mag" | "um" | "in"
	aspect: Aspect // "infinitive" | "completed" | "incompleted" | "contemplated"
}

/** Optional per-root overrides for edge cases/irregulars. */
const LEXICON: Partial<Record<string, Partial<Record<`${Focus}:${Aspect}`, string>>>> = {
	// Examples (uncomment or add as you find exceptions in real usage):
	// inom: { "in:completed": "ininom" }, // many speakers prefer "ininom"
}

/* ------------------------- helpers ------------------------- */

const V = /[aeiou]/i
const C = /[^aeiou]/i

function firstVowelIndex(s: string): number {
	return s.search(V)
}

/** Return the first syllable (simple heuristic: from start to first vowel inclusive). */
function firstSyllable(root: string): string {
	const i = firstVowelIndex(root)
	if (i < 0) return root // no vowel found (rare)
	return root.slice(0, i + 1) // e.g., luto -> "lu", kain -> "ka", basa -> "ba", inom -> "i"
}

/** Insert an infix (e.g., "um", "in") after the first consonant; if vowel-initial, prefix it. */
function insertInfix(root: string, infix: string): string {
	if (!root) return root
	const fv = firstVowelIndex(root)
	if (fv === 0) {
		// vowel-initial root: prefix the infix
		return infix + root // e.g., "inom" -> "uminom"/"ininom"
	}
	// find first consonant index (usually 0 in Tagalog roots)
	const fc = root.search(C)
	if (fc < 0) return infix + root
	return root.slice(0, fc + 1) + infix + root.slice(fc + 1)
}

/** Reduplicate first syllable (CV… heuristic). */
function reduplicate(root: string): string {
	return firstSyllable(root) + root // luto -> luluto, kain -> kakain
}

/* ------------------------- focus rules ------------------------- */

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
			return `mag${root}`
		case 'completed':
			return `nag${root}`
		case 'incompleted':
			return `nag${reduplicate(root)}`
		case 'contemplated':
			return `mag${reduplicate(root)}`
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
		case 'incompleted': {
			// Build: insert "um" then reduplicate the first syllable after the infix.
			// A simple practical form that matches common usage:
			// e.g., luto -> lumuluto, kain -> kumakain
			const base = insertInfix(root, 'um') // kumain / lumuto / uminom
			const fs = firstSyllable(root) // ka / lu / i
			// Insert redup right after the infix position:
			// e.g., "kumain" -> "kuma" + "kain" → "kumakain"
			// For "lumuto" -> "lumu" + "luto" → "lumuluto"
			return base.replace(root, fs + root) // safe shortcut
		}
		case 'contemplated':
			return reduplicate(root) // kakain, luluto, iinom
	}
}

/**
 * IN focus (object):
 *   inf:      insert -in- (after 1st consonant; prefix if vowel-initial) → lutuin, kainin, inumin
 *   comp:     either infix -in- (kinain, binasa, pinili) OR prefix ni- (niluto, nilinis)
 *             Pragmatic rule:
 *               - if vowel-initial: prefix "in": in + root (ininom)
 *               - if starts with [lr]: prefer "ni" + root (niluto, nilinis)
 *               - else: insert infix "in" (kinain, binasa, pinili)
 *   incomp:   if comp used "ni": "ni" + redup(root) → niluluto
 *             else (infix route): insert infix "in" and reduplicate the next syllable → kinakain, binabasa (for basa: note -hin variant exists)
 *   cont:     redup(root) + with -in- inserted → lulutuin, kakainin, iinumin
 *
 * NOTE: Tagalog has lexical preferences; this rule set yields the standard forms for common verbs,
 * but keep LEXICON overrides for edge cases you encounter.
 */
function conjIN(root: string, aspect: Aspect): string {
	switch (aspect) {
		case 'infinitive':
			return insertInfix(root, 'in') // lutuin, kainin, inumin

		case 'completed': {
			if (/^[aeiou]/i.test(root)) return 'in' + root // inom -> ininom
			if (/^[lr]/i.test(root)) return 'ni' + root // luto -> niluto, linis -> nilinis
			return insertInfix(root, 'in') // kain -> kinain, basa -> binasa, pili -> pinili
		}

		case 'incompleted': {
			// decide based on which completed route we would take
			const comp = conjIN(root, 'completed')
			if (comp.startsWith('ni')) {
				return 'ni' + reduplicate(root) // niluluto, nililinís (accent ignored)
			}
			// infix route (kinain -> kinakain; binasa -> binabasa (note: many speakers prefer "binabasa" vs "kinabasa" etc.)
			const fs = firstSyllable(root) // ka / ba / pi ...
			const withInfix = insertInfix(root, 'in') // kinain / binasa / pinili
			// Replace the raw root part after the infix with its reduplicated form:
			return withInfix.replace(root, fs + root) // kinakain, binabasa, pinipili
		}

		case 'contemplated': {
			const r = reduplicate(root) // luluto, kakain, iinom
			// Insert -in- on the original root position (works well for common verbs)
			const future = insertInfix(root, 'in') // lutuin, kainin, inumin
			// Stitch: replace the first occurrence of root in r with future's root-shape
			// e.g., "luluto" -> "lulutuin"; "kakain" -> "kakainin"; "iinom" -> "iinumin"
			return r.replace(root, future)
		}
	}
}

/* ------------------------- public API ------------------------- */

export function conjugate({ root, focus, aspect }: ConjugateOptions): string {
	// override hook
	const key = `${focus}:${aspect}` as const
	const ov = LEXICON[root]?.[key]
	if (ov) return ov

	switch (focus) {
		case 'mag':
			return conjMAG(root, aspect)
		case 'um':
			return conjUM(root, aspect)
		case 'in':
			return conjIN(root, aspect)
	}
}
