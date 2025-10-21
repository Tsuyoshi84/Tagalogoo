export type Focus = 'mag' | 'um' | 'in'
export type Aspect = 'infinitive' | 'completed' | 'incompleted' | 'contemplated'

export interface ConjugateOptions {
	root: string // e.g. "luto", "kain", "basa", "inom"
	focus: Focus // "mag" | "um" | "in"
	aspect: Aspect // "infinitive" | "completed" | "incompleted" | "contemplated"
}

/** Optional per-root overrides for edge cases/irregulars. */
const LEXICON: Partial<Record<string, Partial<Record<`${Focus}:${Aspect}`, string>>>> = {
	// MAG/UM overrides (empty for now)

	// IN focus overrides for common lexical patterns
	basa: {
		'in:infinitive': 'basahin',
		'in:contemplated': 'babasahin',
	},
	kain: {
		'in:infinitive': 'kainin',
		'in:contemplated': 'kakainin',
	},
	sulat: {
		'in:infinitive': 'sulatin',
		'in:contemplated': 'susulatin',
	},
	luto: {
		'in:infinitive': 'lutuin',
		'in:contemplated': 'lulutuin',
	},
	takbo: {
		'in:infinitive': 'takbuhin',
		'in:contemplated': 'tatakbuhin',
	},
	lakad: {
		'in:infinitive': 'lakarin',
		'in:contemplated': 'lalakarin',
	},
	inom: {
		'in:infinitive': 'inumin',
		'in:contemplated': 'iinumin',
	},
	punta: {
		'in:infinitive': 'puntahan',
		'in:completed': 'pinuntahan',
		'in:incompleted': 'pinupuntahan',
		'in:contemplated': 'pupuntahan',
	},
	sabi: {
		'in:infinitive': 'sabihin',
		'in:contemplated': 'sasabihin',
	},
	dala: {
		'in:infinitive': 'dalhin',
		'in:contemplated': 'dadalhin',
	},
	tawag: {
		'in:infinitive': 'tawagin',
		'in:contemplated': 'tatawagin',
	},
	kuha: {
		'in:infinitive': 'kunin',
		'in:contemplated': 'kukunin',
	},
	linis: {
		'in:infinitive': 'linisin',
		'in:contemplated': 'lilinisin',
	},
}

function getOverride(root: string, focus: Focus, aspect: Aspect): string | undefined {
	return LEXICON[root]?.[`${focus}:${aspect}` as const]
}

/* ------------------------- helpers ------------------------- */

const V = /[aeiou]/i
const C = /[^aeiou]/i

function firstVowelIndex(s: string): number {
	return s.search(V)
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

function attachPrefix(prefix: string, stem: string): string {
	if (!stem) return prefix
	if (V.test(stem[0] ?? '')) return `${prefix}-${stem}`
	return prefix + stem
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
	if (root && V.test(root[0] ?? '')) return `in${root}` // inom -> ininom
	if (first && (first === 'l' || first === 'r')) return `ni${root}` // luto -> niluto, linis -> nilinis
	return insertInfix(root, 'in') // kain -> kinain, basa -> binasa, pili -> pinili
}

function conjIN(root: string, aspect: Aspect): string {
	switch (aspect) {
		case 'infinitive':
			return insertInfix(root, 'in') // lutuin, kainin, inumin

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
			// Insert -in- on the original root position (works well for common verbs)
			const future = getOverride(root, 'in', 'infinitive') ?? insertInfix(root, 'in') // lutuin, kainin, inumin
			// Stitch: replace the first occurrence of root in r with future's root-shape
			// e.g., "luluto" -> "lulutuin"; "kakain" -> "kakainin"; "iinom" -> "iinumin"
			return r.replace(root, future)
		}
	}
}

const FOCUS_HANDLERS: Record<Focus, (root: string, aspect: Aspect) => string> = {
	mag: conjMAG,
	um: conjUM,
	in: conjIN,
}

export function conjugate({ root, focus, aspect }: ConjugateOptions): string {
	// override hook
	const overrideResult = getOverride(root, focus, aspect)
	if (overrideResult !== undefined) return overrideResult

	return FOCUS_HANDLERS[focus](root, aspect)
}
