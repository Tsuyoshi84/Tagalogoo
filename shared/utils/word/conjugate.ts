import { conjIN } from './conjugateIn.ts'
import { conjMAG } from './conjugateMag.ts'
import { conjUM } from './conjugateUm.ts'

/**
 * Tagalog verb focus types (actor, object, directional emphasis).
 * - 'mag': Actor focus (most common, emphasizes the doer)
 * - 'um': Actor focus (alternative form, uses infix)
 * - 'in': Object focus (emphasizes the object/receiver)
 */
export type Focus = 'mag' | 'um' | 'in'

/**
 * Tagalog verb aspects representing temporal/completion states.
 * - 'infinitive': Base/dictionary form
 * - 'completed': Past/perfective aspect
 * - 'incompleted': Progressive/imperfective aspect
 * - 'contemplated': Future/prospective aspect
 */
export type Aspect = 'infinitive' | 'completed' | 'incompleted' | 'contemplated'

/**
 * Options for conjugating a Tagalog verb.
 */
export interface ConjugateOptions {
	/** The verb root/base form (e.g., "kain", "luto") */
	root: string
	/** The focus type determining emphasis and affixation pattern */
	focus: Focus
	/** The aspect indicating tense/completion */
	aspect: Aspect
}

/**
 * Conjugates a Tagalog verb root into the specified focus and aspect.
 *
 * Dispatches to focus-specific conjugation handlers (MAG, UM, or IN) to apply
 * the appropriate affixation, infixation, and reduplication patterns.
 *
 * @param options - The conjugation parameters
 * @returns The fully conjugated verb form
 *
 * @example
 * conjugate({ root: 'kain', focus: 'mag', aspect: 'completed' }) // 'nagkain' (ate)
 * conjugate({ root: 'kain', focus: 'um', aspect: 'infinitive' }) // 'kumain' (to eat)
 * conjugate({ root: 'kain', focus: 'in', aspect: 'infinitive' }) // 'kainin' (to be eaten)
 */
export function conjugate({ root, focus, aspect }: ConjugateOptions): string {
	return FOCUS_HANDLERS[focus](root, aspect)
}

const FOCUS_HANDLERS: Record<Focus, (root: string, aspect: Aspect) => string> = {
	mag: conjMAG,
	um: conjUM,
	in: conjIN,
}
