import {
	deepMerge,
	computeMainConstraint,
	computeMainBenchWeigth,
	computeRerollWeight,
	computeRerollBenchWeight,
} from './algo.js'

const defaultConstraints = {
	maxPlayer: 40,
	mainRatio: 0.5,
	role: {
		tank: { min: 3, max: 5, classMin: { war: 3 } },
		heal: { min: 10, max: 12, classMin: { paladin: 3, priest: 3, drood: 1 } },
		cac: { min: 8, max: 15, classMin: { war: 5, rogue: 3 } },
		dist: { min: 8, max: 15, classMin: { hunt: 2, mage: 4, demo: 2 } },
	},
}
const raidDate = '2020-09-30T00:00:00'
const players = [
	{
		RaidReroll: 1,
		LastRR: '2020-09-01T15:00:00',
		MainBench: 0,
		LastMB: null,
		RerollBench: 2,
		LastRB: '2020-08-01T15:00:00',
		rank: 'raider',
		pseudo: 'Pon',
		characters: [
			{ status: 'main', class: 'rogue', role: 'cac' },
			{ status: 'mainReroll', class: 'drood', role: 'tank' },
			{ status: 'reroll', class: 'paladin', role: 'heal' },
		],
	},
	{
		RaidReroll: 0,
		LastRR: false,
		MainBench: 2,
		LastMB: '2020-09-12T15:00:00',
		RerollBench: 1,
		LastRB: '2020-09-15T15:00:00',
		rank: 'raider',
		pseudo: 'Pikachu',
		characters: [
			{ status: 'main', class: 'hunt', role: 'dist' },
			{ status: 'reroll', class: 'paladin', role: 'cac' },
		],
	},
	{
		RaidReroll: 0,
		LastRR: false,
		MainBench: 0,
		LastMB: null,
		RerollBench: 0,
		LastRB: null,
		rank: 'member',
		pseudo: 'Raichu',
		characters: [
			{ status: 'main', class: 'mage', role: 'dist' },
			{ status: 'reroll', class: 'war', role: 'tank' },
		],
	},
]
// DeepMerge
test('DeepMerge', () => {
	expect(deepMerge(defaultConstraints)).toEqual(defaultConstraints)
	expect(
		deepMerge(defaultConstraints, {
			maxPlayer: 2,
			pon: 'ponpon',
			role: { dist: { min: 2 } },
		})
	).toEqual({
		maxPlayer: 2,
		mainRatio: 0.5,
		pon: 'ponpon',
		role: {
			tank: { min: 3, max: 5, classMin: { war: 3 } },
			heal: { min: 10, max: 12, classMin: { paladin: 3, priest: 3, drood: 1 } },
			cac: { min: 8, max: 15, classMin: { war: 5, rogue: 3 } },
			dist: { min: 2, max: 15, classMin: { hunt: 2, mage: 4, demo: 2 } },
		},
	})
	expect(deepMerge([1, 2, ['a', 'b']], [1, undefined, ['c'], 3])).toEqual([
		1,
		2,
		['c', 'b'],
		3,
	])
})

// Compute Main Constraint
test('ComputeMainConstraint', () => {
	expect(computeMainConstraint(defaultConstraints)).toEqual({
		tank: { min: 1.5, max: 5, classMin: { war: 1.5 } },
		heal: {
			min: 5,
			max: 12,
			classMin: { paladin: 1.5, priest: 1.5, drood: 0.5 },
		},
		cac: { min: 4, max: 15, classMin: { war: 2.5, rogue: 1.5 } },
		dist: { min: 4, max: 15, classMin: { hunt: 1, mage: 2, demo: 1 } },
	})
})

// ComputeMainBenchWeigth
test('computeMainBenchWeigth', () => {
	expect(computeMainBenchWeigth(players[0], raidDate)).toEqual(1000000)
	expect(computeMainBenchWeigth(players[1], raidDate)).toEqual(1000198)
	expect(computeMainBenchWeigth(players[2], raidDate)).toEqual(0)
})

// computeRerollWeight
test('computeRerollWeight', () => {
	expect(computeRerollWeight(players[0], raidDate)).toEqual(96)
	expect(computeRerollWeight(players[1], raidDate)).toEqual(0)
	expect(computeRerollWeight(players[2], raidDate)).toEqual(0)
})

// computeRerollBenchWeight
test('computeRerollBenchWeight', () => {
	expect(computeRerollBenchWeight(players[0], raidDate)).toEqual(192)
	expect(computeRerollBenchWeight(players[1], raidDate)).toEqual(98)
	expect(computeRerollBenchWeight(players[2], raidDate)).toEqual(0)
})
