import { describe, expect, it } from 'vitest'
import { type Aspect, conjugate, type Focus } from './conjugate.ts'

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
				incompleted: 'nagtrabaho',
				contemplated: 'magtrabaho',
			},
			{
				root: 'aral',
				infinitive: 'magaral',
				completed: 'nagaral',
				incompleted: 'nagararal',
				contemplated: 'magararal',
			},
			{
				root: 'lakad',
				infinitive: 'maglakad',
				completed: 'naglakad',
				incompleted: 'naglalakad',
				contemplated: 'maglalakad',
			},
			{
				root: 'kanta',
				infinitive: 'magkanta',
				completed: 'nagkanta',
				incompleted: 'nagkakanta',
				contemplated: 'magkakanta',
			},
			{
				root: 'laro',
				infinitive: 'maglaro',
				completed: 'naglaro',
				incompleted: 'naglalaro',
				contemplated: 'maglalaro',
			},
			{
				root: 'luto-ng',
				infinitive: 'magluto-ng',
				completed: 'nagluto-ng',
				incompleted: 'nagluto-ng',
				contemplated: 'magluto-ng',
			},
		])(
			'should conjugate $root with all aspects',
			({ root, infinitive, completed, incompleted, contemplated }) => {
				const focus = 'mag'
				expect(conjugate({ root, focus, aspect: 'infinitive' })).toBe(infinitive)
				expect(conjugate({ root, focus, aspect: 'completed' })).toBe(completed)
				expect(conjugate({ root, focus, aspect: 'incompleted' })).toBe(incompleted)
				expect(conjugate({ root, focus, aspect: 'contemplated' })).toBe(contemplated)
			},
		)
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
				root: 'tulog',
				infinitive: 'matulog',
				completed: 'natulog',
				incompleted: 'natutulog',
				contemplated: 'matutulog',
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
				incompleted: 'uminom',
				contemplated: 'iinom',
			},
		])(
			'should conjugate $root with all aspects',
			({ root, infinitive, completed, incompleted, contemplated }) => {
				const focus = 'um'
				expect(conjugate({ root, focus, aspect: 'infinitive' })).toBe(infinitive)
				expect(conjugate({ root, focus, aspect: 'completed' })).toBe(completed)
				expect(conjugate({ root, focus, aspect: 'incompleted' })).toBe(incompleted)
				expect(conjugate({ root, focus, aspect: 'contemplated' })).toBe(contemplated)
			},
		)
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
				completed: 'linuto',
				incompleted: 'linuluto',
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
				completed: 'linakad',
				incompleted: 'linalakad',
				contemplated: 'lalakarin',
			},
			{
				root: 'inom',
				infinitive: 'inumin',
				completed: 'ininom',
				incompleted: 'ininom',
				contemplated: 'iinumin',
			},
		])(
			'should conjugate $root with all aspects',
			({ root, infinitive, completed, incompleted, contemplated }) => {
				const focus = 'in'
				expect(conjugate({ root, focus, aspect: 'infinitive' })).toBe(infinitive)
				expect(conjugate({ root, focus, aspect: 'completed' })).toBe(completed)
				expect(conjugate({ root, focus, aspect: 'incompleted' })).toBe(incompleted)
				expect(conjugate({ root, focus, aspect: 'contemplated' })).toBe(contemplated)
			},
		)
	})

	describe('irregular verbs', () => {
		it.each([
			{
				root: 'punta',
				focus: 'mag',
				aspect: 'infinitive',
				expected: 'pumunta',
			},
			{
				root: 'punta',
				focus: 'mag',
				aspect: 'completed',
				expected: 'pumunta',
			},
			{
				root: 'punta',
				focus: 'mag',
				aspect: 'incompleted',
				expected: 'pumupunta',
			},
			{
				root: 'punta',
				focus: 'mag',
				aspect: 'contemplated',
				expected: 'pupunta',
			},
			{
				root: 'punta',
				focus: 'in',
				aspect: 'infinitive',
				expected: 'puntahan',
			},
			{
				root: 'punta',
				focus: 'in',
				aspect: 'completed',
				expected: 'pinuntahan',
			},
			{
				root: 'punta',
				focus: 'in',
				aspect: 'incompleted',
				expected: 'pinupuntahan',
			},
			{
				root: 'punta',
				focus: 'in',
				aspect: 'contemplated',
				expected: 'pupuntahan',
			},
		])(
			'should conjugate irregular verb $root with focus $focus and aspect $aspect',
			({ root, focus, aspect, expected }) => {
				expect(conjugate({ root, focus: focus as Focus, aspect: aspect as Aspect })).toBe(expected)
			},
		)
	})
})
