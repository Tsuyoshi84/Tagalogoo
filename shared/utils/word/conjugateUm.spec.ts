import { describe, expect, it } from 'vitest'
import { conjugate } from './conjugate.ts'

describe('conjugate - um focus', () => {
	it.each([
		{
			root: 'kain',
			infinitive: 'kumain',
			completed: 'kumain',
			incompleted: 'kumakain',
			contemplated: 'kakain',
		},
		{
			root: 'kanta',
			infinitive: 'kumanta',
			completed: 'kumanta',
			incompleted: 'kumakanta',
			contemplated: 'kakanta',
		},
		{
			root: 'takbo',
			infinitive: 'tumakbo',
			completed: 'tumakbo',
			incompleted: 'tumatakbo',
			contemplated: 'tatakbo',
		},
		{
			root: 'lakad',
			infinitive: 'lumakad',
			completed: 'lumakad',
			incompleted: 'lumalakad',
			contemplated: 'lalakad',
		},
		{
			root: 'sulat',
			infinitive: 'sumulat',
			completed: 'sumulat',
			incompleted: 'sumusulat',
			contemplated: 'susulat',
		},
		{
			root: 'basa',
			infinitive: 'bumasa',
			completed: 'bumasa',
			incompleted: 'bumabasa',
			contemplated: 'babasa',
		},
		{
			root: 'inom',
			infinitive: 'uminom',
			completed: 'uminom',
			incompleted: 'umiinom',
			contemplated: 'iinom',
		},
		{
			root: 'punta',
			infinitive: 'pumunta',
			completed: 'pumunta',
			incompleted: 'pumupunta',
			contemplated: 'pupunta',
		},
		// lexical / irregular style
		{
			root: 'alis',
			infinitive: 'umalis',
			completed: 'umalis',
			incompleted: 'umaalis',
			contemplated: 'aalis',
		},
		{
			root: 'pasok',
			infinitive: 'pumasok',
			completed: 'pumasok',
			incompleted: 'pumapasok',
			contemplated: 'papasok',
		},
	])('should conjugate um $root', ({ root, infinitive, completed, incompleted, contemplated }) => {
		const focus = 'um'
		expect(conjugate({ root, focus, aspect: 'infinitive' })).toBe(infinitive)
		expect(conjugate({ root, focus, aspect: 'completed' })).toBe(completed)
		expect(conjugate({ root, focus, aspect: 'incompleted' })).toBe(incompleted)
		expect(conjugate({ root, focus, aspect: 'contemplated' })).toBe(contemplated)
	})
})
