import {
	deepMerge,
	computeMainConstraint,
	computeMainBenchWeigth,
	computeRerollWeight,
	computeRerollBenchWeight,
	getBenchOrdered,
	getRerollOrdered,
	getMain,
	fillPClassMainRatio,
	analyseMissingPClass,
} from './algo.js'

const testConstraints = {
	maxPlayer: 40,
	mainRatio: 0.5,
	role: {
		tank: { min: 3, max: 5, pClassMin: { war: 3 } },
		heal: { min: 10, max: 12, pClassMin: { paladin: 3, priest: 3, drood: 1 } },
		cac: { min: 8, max: 15, pClassMin: { war: 5, rogue: 3 } },
		dist: { min: 8, max: 15, pClassMin: { hunt: 2, mage: 4, demo: 2 } },
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
		rerollWanted: true,
		characters: [
			{ status: 'main', pClass: 'rogue', role: 'cac' },
			{ status: 'mainReroll', pClass: 'drood', role: 'tank' },
			{ status: 'reroll', pClass: 'paladin', role: 'heal' },
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
		rerollWanted: true,
		characters: [
			{ status: 'main', pClass: 'hunt', role: 'dist' },
			{ status: 'reroll', pClass: 'paladin', role: 'cac' },
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
		rerollWanted: true,
		characters: [
			{ status: 'main', pClass: 'mage', role: 'dist' },
			{ status: 'reroll', pClass: 'war', role: 'tank' },
		],
	},
	{
		RaidReroll: 0,
		LastRR: false,
		MainBench: 0,
		LastMB: null,
		RerollBench: 0,
		LastRB: null,
		rank: 'raider',
		pseudo: 'Abo',
		rerollWanted: false,
		characters: [
			{ status: 'main', pClass: 'war', role: 'cac' },
			{ status: 'reroll', pClass: 'war', role: 'tank' },
		],
	},
	{
		RaidReroll: 0,
		LastRR: false,
		MainBench: 0,
		LastMB: null,
		RerollBench: 0,
		LastRB: null,
		rank: 'raider',
		pseudo: 'Arbok',
		rerollWanted: true,
		characters: [{ status: 'main', pClass: 'war', role: 'cac' }],
	},
]
// DeepMerge
test('DeepMerge', () => {
	expect(deepMerge(testConstraints)).toEqual(testConstraints)
	expect(
		deepMerge(testConstraints, {
			maxPlayer: 2,
			pon: 'ponpon',
			role: { dist: { min: 2 } },
		})
	).toEqual({
		maxPlayer: 2,
		mainRatio: 0.5,
		pon: 'ponpon',
		role: {
			tank: { min: 3, max: 5, pClassMin: { war: 3 } },
			heal: {
				min: 10,
				max: 12,
				pClassMin: { paladin: 3, priest: 3, drood: 1 },
			},
			cac: { min: 8, max: 15, pClassMin: { war: 5, rogue: 3 } },
			dist: { min: 2, max: 15, pClassMin: { hunt: 2, mage: 4, demo: 2 } },
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
	expect(computeMainConstraint(testConstraints)).toEqual({
		tank: { min: 1.5, max: 5, pClassMin: { war: 1.5 } },
		heal: {
			min: 5,
			max: 12,
			pClassMin: { paladin: 1.5, priest: 1.5, drood: 0.5 },
		},
		cac: { min: 4, max: 15, pClassMin: { war: 2.5, rogue: 1.5 } },
		dist: { min: 4, max: 15, pClassMin: { hunt: 1, mage: 2, demo: 1 } },
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
	expect(computeRerollWeight(players[3], raidDate)).toEqual(null)
	expect(computeRerollWeight(players[4], raidDate)).toEqual(null)
})

// computeRerollBenchWeight
test('computeRerollBenchWeight', () => {
	expect(computeRerollBenchWeight(players[0], raidDate)).toEqual(192)
	expect(computeRerollBenchWeight(players[1], raidDate)).toEqual(98)
	expect(computeRerollBenchWeight(players[2], raidDate)).toEqual(0)
})

test('getBenchOrdered', () => {
	expect(getBenchOrdered(players, raidDate, testConstraints)).toEqual(false)
	expect(
		getBenchOrdered(
			[
				{
					MainBench: 0,
					LastMB: null,
					rank: 'raider',
				},
				{
					MainBench: 2,
					LastMB: '2020-09-12T15:00:00',
					rank: 'raider',
				},
				{
					MainBench: 0,
					LastMB: null,
					rank: 'member',
				},
			],
			raidDate,
			{ maxPlayer: 1 }
		)
	).toEqual([
		{
			MainBench: 0,
			LastMB: null,
			rank: 'member',
			mainBenchWeigth: 0,
		},
		{
			MainBench: 0,
			LastMB: null,
			rank: 'raider',
			mainBenchWeigth: 1000000,
		},
		{
			MainBench: 2,
			LastMB: '2020-09-12T15:00:00',
			rank: 'raider',
			mainBenchWeigth: 1000198,
		},
	])
})

test('getRerollOrdered', () => {
	expect(
		getRerollOrdered(
			[
				{
					RaidReroll: 0,
					LastRR: null,
					rerollWanted: true,
					characters: [],
				},
				{
					RaidReroll: 0,
					LastRR: null,
					rerollWanted: true,
					characters: [1, 2],
				},
				{
					RaidReroll: 2,
					LastRR: '2020-09-12T15:00:00',
					rerollWanted: true,
					characters: [1, 2, 3],
				},
				{
					RaidReroll: 3,
					LastRR: '2020-09-12T15:00:00',
					rerollWanted: false,
					characters: [1, 2],
				},
				{
					RaidReroll: 4,
					LastRR: '2020-09-12T15:00:00',
					rerollWanted: true,
					characters: [1, 2],
				},
				{
					RaidReroll: 4,
					LastRR: '2020-09-01T15:00:00',
					rerollWanted: true,
					characters: [1, 2],
				},
			],
			raidDate
		)
	).toEqual([
		{
			RaidReroll: 0,
			LastRR: null,
			rerollWanted: true,
			characters: [],
			rerollWeight: null,
		},
		{
			RaidReroll: 3,
			LastRR: '2020-09-12T15:00:00',
			rerollWanted: false,
			characters: [1, 2],
			rerollWeight: null,
		},
		{
			RaidReroll: 4,
			LastRR: '2020-09-12T15:00:00',
			rerollWanted: true,
			characters: [1, 2],
			rerollWeight: 398,
		},
		{
			RaidReroll: 4,
			LastRR: '2020-09-01T15:00:00',
			rerollWanted: true,
			characters: [1, 2],
			rerollWeight: 396,
		},
		{
			RaidReroll: 2,
			LastRR: '2020-09-12T15:00:00',
			rerollWanted: true,
			characters: [1, 2, 3],
			rerollWeight: 198,
		},
		{
			RaidReroll: 0,
			LastRR: null,
			rerollWanted: true,
			characters: [1, 2],
			rerollWeight: 0,
		},
	])
})

test('GetMain', () => {
	expect(getMain(players[0])).toEqual({
		status: 'main',
		pClass: 'rogue',
		role: 'cac',
	})
	expect(getMain(players[1])).toEqual({
		status: 'main',
		pClass: 'hunt',
		role: 'dist',
	})
	expect(getMain(players[2])).toEqual({
		status: 'main',
		pClass: 'mage',
		role: 'dist',
	})
	expect(getMain(players[3])).toEqual({
		status: 'main',
		pClass: 'war',
		role: 'cac',
	})
	expect(getMain(players[4])).toEqual({
		status: 'main',
		pClass: 'war',
		role: 'cac',
	})
})

test('FillPClassMainRatio', () => {
	expect(
		fillPClassMainRatio(players, { cac: { pClassMin: { war: 1 } } })
	).toEqual({
		tank: {},
		heal: {},
		cac: { war: ['Abo'] },
		dist: {},
	})
	expect(
		fillPClassMainRatio(players, {
			tank: { pClassMin: { drood: 1 } },
			cac: { pClassMin: { war: 1 } },
		})
	).toEqual({
		tank: {},
		heal: {},
		cac: { war: ['Abo'] },
		dist: {},
	})
	expect(fillPClassMainRatio(players, testConstraints.role)).toEqual({
		tank: {},
		heal: {},
		cac: { war: ['Abo', 'Arbok'], rogue: ['Pon'] },
		dist: { hunt: ['Pikachu'], mage: ['Raichu'] },
	})
})

test('analyseMissingPClass', () => {
	expect(
		analyseMissingPClass(
			{
				tank: {},
				heal: {},
				cac: { war: ['Abo'] },
				dist: {},
			},
			{ cac: { pClassMin: { war: 2 } } }
		)
	).toEqual({ cac: { war: 1 } })
	expect(
		analyseMissingPClass(
			{
				tank: {},
				heal: {},
				cac: { war: [1, 2, 3] },
				dist: {},
			},
			{
				cac: { pClassMin: { war: 5, rogue: 2 } },
				tank: { pClassMin: { war: 2 } },
				heal: { pClassMin: { paladin: 3 } },
				dist: { pClassMin: { mage: 2, hunt: 1 } },
			}
		)
	).toEqual({
		cac: { war: 2, rogue: 2 },
		tank: { war: 2 },
		heal: { paladin: 3 },
		dist: { mage: 2, hunt: 1 },
	})
	expect(
		analyseMissingPClass(
			{
				tank: {},
				heal: {},
				cac: { war: [1, 2, 3] },
				dist: {},
			},
			{
				cac: { pClassMin: { war: 5, rogue: 2 } },
				tank: { pClassMin: { war: 2 } },
				heal: { pClassMin: { paladin: 3 } },
				dist: { pClassMin: { mage: 2, hunt: 1 } },
			}
		)
	).toEqual({
		cac: { war: 2, rogue: 2 },
		tank: { war: 2 },
		heal: { paladin: 3 },
		dist: { mage: 2, hunt: 1 },
	})
	expect(
		analyseMissingPClass(
			{
				tank: { war: [1, 2] },
				heal: { paladin: [1, 2, 3] },
				cac: { war: [1, 2, 3, 4, 5], rogue: [1, 2] },
				dist: { mage: [1, 2], hunt: [1] },
			},
			{
				cac: { pClassMin: { war: 5, rogue: 2 } },
				tank: { pClassMin: { war: 2 } },
				heal: { pClassMin: { paladin: 3 } },
				dist: { pClassMin: { mage: 2, hunt: 1 } },
			}
		)
	).toEqual({})
})
