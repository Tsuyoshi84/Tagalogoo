import { describe, expect, it } from 'vitest'
import { conjugate } from './conjugate.ts'

describe('conjugate', () => {
	describe('mag', () => {
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
		])('should conjugate $root', ({ root, infinitive, completed, incompleted, contemplated }) => {
			const focus = 'mag'
			expect(conjugate({ root, focus, aspect: 'infinitive' })).toBe(infinitive)
			expect(conjugate({ root, focus, aspect: 'completed' })).toBe(completed)
			expect(conjugate({ root, focus, aspect: 'incompleted' })).toBe(incompleted)
			expect(conjugate({ root, focus, aspect: 'contemplated' })).toBe(contemplated)
		})
	})

	describe('um', () => {
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
		])('should conjugate $root', ({ root, infinitive, completed, incompleted, contemplated }) => {
			const focus = 'um'
			expect(conjugate({ root, focus, aspect: 'infinitive' })).toBe(infinitive)
			expect(conjugate({ root, focus, aspect: 'completed' })).toBe(completed)
			expect(conjugate({ root, focus, aspect: 'incompleted' })).toBe(incompleted)
			expect(conjugate({ root, focus, aspect: 'contemplated' })).toBe(contemplated)
		})
	})

	describe('in', () => {
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
			{
				root: 'punta',
				infinitive: 'puntahan',
				completed: 'pinuntahan',
				incompleted: 'pinupuntahan',
				contemplated: 'pupuntahan',
			},
		])('should conjugate $root', ({ root, infinitive, completed, incompleted, contemplated }) => {
			const focus = 'in'
			expect(conjugate({ root, focus, aspect: 'infinitive' })).toBe(infinitive)
			expect(conjugate({ root, focus, aspect: 'completed' })).toBe(completed)
			expect(conjugate({ root, focus, aspect: 'incompleted' })).toBe(incompleted)
			expect(conjugate({ root, focus, aspect: 'contemplated' })).toBe(contemplated)
		})
	})
})
