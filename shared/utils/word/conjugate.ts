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

/** Optional per-root overrides for edge cases/irregulars. */
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
	takbo: {
		// takbo → takbuhin (o → u, add -hin not -in)
		'in:infinitive': 'takbuhin',
		'in:contemplated': 'tatakbuhin',
	},
	lakad: {
		// lakad → lakarin (d → r, add -in)
		'in:infinitive': 'lakarin',
		'in:contemplated': 'lalakarin',
	},
	inom: {
		// inom → inumin (internal o → u, add -in)
		'in:infinitive': 'inumin',
		'in:contemplated': 'iinumin',
	},
}

function getOverride(root: string, focus: Focus, aspect: Aspect): string | undefined {
	return LEXICON[root]?.[`${focus}:${aspect}` as const]
}

const VOWEL_REGEX = /[aeiou]/i

function firstVowelIndex(s: string): number {
	return s.search(VOWEL_REGEX)
}

/** Return the first syllable (simple heuristic: from start to first vowel inclusive). */
function firstSyllable(root: string): string {
	if (!root) return root
	const firstChar = root[0] ?? ''
	const fv = firstVowelIndex(root)
	if (fv < 0) return firstChar
	if (fv === 0) return firstChar
	const vowel = root[fv]
	if (!vowel) return firstChar
	return `${firstChar}${vowel}`
}

const CONSONANT_REGEX = /[^aeiou]/i

function shouldUseHinSuffix(root: string): boolean {
	if (!root) return false
	const lastChar = root[root.length - 1]?.toLowerCase()
	// Use -hin suffix when root ends with a vowel (especially o, u, but also a, e, i)
	return lastChar !== undefined && VOWEL_REGEX.test(lastChar)
}

function buildHinForm(root: string): string {
	if (!root) return root
	const lastChar = root[root.length - 1]?.toLowerCase()

	// If root ends with 'o', change it to 'u' before adding 'in'
	// luto → lutuin (NOT lutuhin)
	if (lastChar === 'o') {
		return `${root.slice(0, -1)}uin`
	}

	// If root ends with 'u', just add 'in'
	// (though most 'u'-ending roots are rare)
	if (lastChar === 'u') {
		return `${root}in`
	}

	// For other vowel endings (a, e, i), add 'hin'
	// dala → dalhin, kuha → kuhin (though kuha is irregular and overridden in LEXICON)
	return `${root}hin`
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
	const fc = root.search(CONSONANT_REGEX)
	if (fc < 0) return infix + root
	return root.slice(0, fc + 1) + infix + root.slice(fc + 1)
}

/** Reduplicate first syllable (CV… heuristic). */
function reduplicate(root: string): string {
	return firstSyllable(root) + root // luto -> luluto, kain -> kakain
}

function attachPrefix(prefix: string, stem: string): string {
	if (!stem) return prefix
	if (VOWEL_REGEX.test(stem[0] ?? '')) return `${prefix}-${stem}`
	return prefix + stem
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
function conjINCompleted(root: string): string {
	const override = getOverride(root, 'in', 'completed')
	if (override) return override
	const first = root[0]?.toLowerCase()
	if (root && VOWEL_REGEX.test(root[0] ?? '')) return `in${root}` // inom -> ininom
	if (first && (first === 'l' || first === 'r')) return `ni${root}` // luto -> niluto, linis -> nilinis
	return insertInfix(root, 'in') // kain -> kinain, basa -> binasa, pili -> pinili
}

function conjIN(root: string, aspect: Aspect): string {
	const useHinSuffix = shouldUseHinSuffix(root)

	switch (aspect) {
		case 'infinitive':
			// Infinitive uses suffixes: -in or -hin
			return useHinSuffix ? buildHinForm(root) : `${root}in`

		case 'completed':
			return conjINCompleted(root)

		case 'incompleted': {
			// decide based on which completed route we would take
			const comp = conjINCompleted(root)
			if (comp.startsWith('ni')) {
				return `ni${reduplicate(root)}` // niluluto, nililinís (accent ignored)
			}
			// infix route (kinain -> kinakain; binasa -> binabasa; sinulat -> sinusulat)
			return insertInfix(reduplicate(root), 'in')
		}

		case 'contemplated': {
			const r = reduplicate(root) // luluto, kakain, iinom
			const futureOverride = getOverride(root, 'in', 'infinitive')
			if (useHinSuffix) {
				// For vowel-ending roots: use -hin suffix form
				// luto → lulutuin (luluto + utuin), dala → dadalhin (dadala + alhin)
				const futureStem = futureOverride ?? buildHinForm(root)
				return r.replace(root, futureStem)
			}
			// For consonant-ending roots: use -in suffix
			// kain → kakainin (kakain + in), bili → bibilhin (bibili + hin) - but bili is vowel-ending
			const future = futureOverride ?? `${root}in` // lutuin, kainin, inumin
			// Stitch: replace the first occurrence of root in r with future's root-shape
			// e.g., "luluto" -> "lulutuin"; "kakain" -> "kakainin"; "iinom" -> "iinumin"
			return r.replace(root, future)
		}
	}
}
