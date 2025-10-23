import { describe, expect, it } from 'vitest'
import { conjugate } from './conjugate.ts'

describe('conjugate - in focus', () => {
	it.each([
		{
			root: 'basa',
			infinitive: 'basahin',
			completed: 'binasa',
			incompleted: 'binabasa',
			contemplated: 'babasahin',
		},
		{
			root: 'kain',
			infinitive: 'kainin',
			completed: 'kinain',
			incompleted: 'kinakain',
			contemplated: 'kakainin',
		},
		{
			root: 'sulat',
			infinitive: 'sulatin',
			completed: 'sinulat',
			incompleted: 'sinusulat',
			contemplated: 'susulatin',
		},
		{
			root: 'luto',
			infinitive: 'lutuin',
			completed: 'niluto',
			incompleted: 'niluluto',
			contemplated: 'lulutuin',
		},
		{
			root: 'takbo',
			infinitive: 'takbuhin',
			completed: 'tinakbo',
			incompleted: 'tinatakbo',
			contemplated: 'tatakbuhin',
		},
		{
			root: 'lakad',
			infinitive: 'lakarin',
			completed: 'nilakad',
			incompleted: 'nilalakad',
			contemplated: 'lalakarin',
		},
		{
			root: 'inom',
			infinitive: 'inumin',
			completed: 'ininom',
			incompleted: 'iniinom',
			contemplated: 'iinumin',
		},
		// lexical variants / irregulars
		{
			root: 'sabi',
			infinitive: 'sabihin',
			completed: 'sinabi',
			incompleted: 'sinasabi',
			contemplated: 'sasabihin',
		},
		{
			root: 'dala',
			infinitive: 'dalhin',
			completed: 'dinala',
			incompleted: 'dinadala',
			contemplated: 'dadalhin',
		},
		{
			root: 'tawag',
			infinitive: 'tawagin',
			completed: 'tinawag',
			incompleted: 'tinatawag',
			contemplated: 'tatawagin',
		},
		{
			root: 'kuha',
			infinitive: 'kunin',
			completed: 'kinuha',
			incompleted: 'kinukuha',
			contemplated: 'kukunin',
		},
		{
			root: 'linis',
			infinitive: 'linisin',
			completed: 'nilinis',
			incompleted: 'nililinis',
			contemplated: 'lilinisin',
		},
	])('should conjugate in $root', ({ root, infinitive, completed, incompleted, contemplated }) => {
		const focus = 'in'
		expect(conjugate({ root, focus, aspect: 'infinitive' })).toBe(infinitive)
		expect(conjugate({ root, focus, aspect: 'completed' })).toBe(completed)
		expect(conjugate({ root, focus, aspect: 'incompleted' })).toBe(incompleted)
		expect(conjugate({ root, focus, aspect: 'contemplated' })).toBe(contemplated)
	})
})
