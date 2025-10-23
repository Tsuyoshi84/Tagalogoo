import { describe, expect, it } from 'vitest'
import { conjugate } from './conjugate.ts'

describe('conjugate - mag focus', () => {
	it.each([
		{
			root: 'luto',
			infinitive: 'magluto',
			completed: 'nagluto',
			incompleted: 'nagluluto',
			contemplated: 'magluluto',
		},
		{
			root: 'trabaho',
			infinitive: 'magtrabaho',
			completed: 'nagtrabaho',
			incompleted: 'nagtatrabaho',
			contemplated: 'magtatrabaho',
		},
		{
			root: 'aral',
			infinitive: 'mag-aral',
			completed: 'nag-aral',
			incompleted: 'nag-aaral',
			contemplated: 'mag-aaral',
		},
		{
			root: 'lakad',
			infinitive: 'maglakad',
			completed: 'naglakad',
			incompleted: 'naglalakad',
			contemplated: 'maglalakad',
		},
		{
			root: 'laro',
			infinitive: 'maglaro',
			completed: 'naglaro',
			incompleted: 'naglalaro',
			contemplated: 'maglalaro',
		},
		// lexical additions
		{
			root: 'bigay',
			infinitive: 'magbigay',
			completed: 'nagbigay',
			incompleted: 'nagbibigay',
			contemplated: 'magbibigay',
		},
		{
			root: 'linis',
			infinitive: 'maglinis',
			completed: 'naglinis',
			incompleted: 'naglilinis',
			contemplated: 'maglilinis',
		},
	])('should conjugate mag $root', ({ root, infinitive, completed, incompleted, contemplated }) => {
		const focus = 'mag'
		expect(conjugate({ root, focus, aspect: 'infinitive' })).toBe(infinitive)
		expect(conjugate({ root, focus, aspect: 'completed' })).toBe(completed)
		expect(conjugate({ root, focus, aspect: 'incompleted' })).toBe(incompleted)
		expect(conjugate({ root, focus, aspect: 'contemplated' })).toBe(contemplated)
	})
})
