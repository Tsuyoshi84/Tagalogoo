import type { Aspect } from './conjugate.ts'
import { attachPrefix, reduplicate } from './conjugateHelpers.ts'

/**
 * Conjugates a Tagalog verb root in the MAG focus (actor focus).
 *
 * MAG focus is one of the most common verb forms in Tagalog, emphasizing the actor
 * performing the action. It follows a straightforward pattern using mag-/nag- prefixes
 * with optional reduplication.
 *
 * @param root - The base form of the verb (e.g., "luto", "kain", "sulat")
 * @param aspect - The verbal aspect: infinitive, completed, incompleted, or contemplated
 * @returns The conjugated verb form
 *
 * @example
 * // Infinitive: mag- prefix
 * conjMAG('luto', 'infinitive') // 'magluto' (to cook)
 * conjMAG('kain', 'infinitive') // 'magkain' (to eat)
 * conjMAG('sulat', 'infinitive') // 'magsulat' (to write)
 *
 * @example
 * // Completed: nag- prefix (past tense)
 * conjMAG('luto', 'completed') // 'nagluto' (cooked)
 * conjMAG('kain', 'completed') // 'nagkain' (ate)
 * conjMAG('sulat', 'completed') // 'nagsulat' (wrote)
 *
 * @example
 * // Incompleted: nag- + reduplicated root (progressive/habitual past)
 * conjMAG('luto', 'incompleted') // 'nagluluto' (was cooking / used to cook)
 * conjMAG('kain', 'incompleted') // 'nagkakain' (was eating / used to eat)
 * conjMAG('sulat', 'incompleted') // 'nagsusulat' (was writing / used to write)
 *
 * @example
 * // Contemplated: mag- + reduplicated root (future tense)
 * conjMAG('luto', 'contemplated') // 'magluluto' (will cook)
 * conjMAG('kain', 'contemplated') // 'magkakain' (will eat)
 * conjMAG('sulat', 'contemplated') // 'magsusulat' (will write)
 *
 * @remarks
 * - MAG focus is simpler and more regular than UM or IN focus
 * - For many verbs like "luto", MAG is more idiomatic than UM in modern Tagalog
 * - The mag-/nag- alternation marks aspect: mag- for non-past, nag- for past
 * - Reduplication in future/progressive forms indicates ongoing or repeated action
 */
export function conjMAG(root: string, aspect: Aspect): string {
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
