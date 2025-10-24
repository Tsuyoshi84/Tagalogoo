import type { Aspect } from './conjugate.ts'
import { insertInfix, reduplicate } from './conjugateHelpers.ts'

/**
 * Conjugates a Tagalog verb root in the UM focus (actor focus).
 *
 * UM focus emphasizes the actor/doer of the action. The -um- infix is inserted
 * after the first consonant of the root word (or prefixed if the root starts with a vowel).
 *
 * @param root - The base form of the verb (e.g., "kain", "sulat", "inom")
 * @param aspect - The verbal aspect: infinitive, completed, incompleted, or contemplated
 * @returns The conjugated verb form
 *
 * @example
 * // Infinitive/Completed: insert -um- after first consonant
 * conjUM('kain', 'infinitive') // 'kumain' (to eat / ate)
 * conjUM('sulat', 'completed') // 'sumulat' (wrote)
 *
 * @example
 * // Incompleted: insert -um- in reduplicated root
 * conjUM('kain', 'incompleted') // 'kumakain' (eating/was eating)
 * conjUM('sulat', 'incompleted') // 'sumusulat' (writing/was writing)
 *
 * @example
 * // Contemplated: just reduplicate without -um-
 * conjUM('kain', 'contemplated') // 'kakain' (will eat)
 * conjUM('luto', 'contemplated') // 'luluto' (will cook)
 *
 * @remarks
 * - For vowel-initial roots, -um- is prefixed: "inom" → "uminom"
 * - For many roots like "luto", the MAG focus is more commonly used in modern Tagalog
 * - Infinitive and completed forms are identical in UM focus
 */
export function conjUM(root: string, aspect: Aspect): string {
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
