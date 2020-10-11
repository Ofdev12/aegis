import {
	deepMerge,
	computeMainConstraint,
	computeMainBenchWeigth,
	computeRerollWeight,
	computeRerollBenchWeight,
	getMainBenchOrdered,
	getRerollOrdered,
	getMain,
	fillPClassMainRatio,
	analyseMissingMin,
	isEmpty,
	isInClassQuotas,
	getRoleOpenedMinQuota,
	getRoleOpenedAttributed,
	isInOpenMinQuota,
	getMaxOpenSlots,
	getNbAttributedSlots,
	isRespectingMax,
	deepCopy,
	findPlayerAttrib,
	findCharacter,
	fillMissingMainWithRerolls,
	fillRerolls,
	addAttribs,
	completeFillWithMain,
	fill,
} from './algo.js'

const testConstraints = {
	maxPlayer: 40,
	mainRatio: 0.5,
	role: {
		tank: { min: 3, max: 5, pClassMin: { war: 3 } },
		heal: { min: 10, max: 12, pClassMin: { paladin: 3, priest: 3, drood: 1 } },
		cac: { min: 8, max: 15, pClassMin: { war: 5, rogue: 3 } },
		dist: { min: 8, max: 15, pClassMin: { hunt: 2, mage: 4, warlock: 2 } },
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

const getBench = (players) => players.filter(({ isBenched }) => isBenched)
const keepPseudoOnly = (players) => players.map(({ pseudo }) => pseudo)

// DeepMerge
test('DeepMerge', () => {
	expect(deepMerge(testConstraints)).toEqual(testConstraints)
	expect(deepMerge({ a: 1, b: null })).toEqual({ a: 1, b: null })
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
			dist: { min: 2, max: 15, pClassMin: { hunt: 2, mage: 4, warlock: 2 } },
		},
	})
	expect(deepMerge([1, 2, ['a', 'b']], [1, undefined, ['c'], 3])).toEqual([
		1,
		2,
		['c', 'b'],
		3,
	])
})

test('deepCopy', () => {
	expect(deepCopy(1)).toEqual(1)
	expect(deepCopy('a')).toEqual('a')
	expect(deepCopy([1, 2])).toEqual([1, 2])
	expect(deepCopy({ a: 1, b: 2 })).toEqual({ a: 1, b: 2 })
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
		dist: { min: 4, max: 15, pClassMin: { hunt: 1, mage: 2, warlock: 1 } },
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

test('getMainBenchOrdered', () => {
	expect(
		getMainBenchOrdered(deepCopy(players), raidDate, testConstraints)
	).toEqual(false)
	expect(
		getMainBenchOrdered(
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
		fillPClassMainRatio(deepCopy(players), { cac: { pClassMin: { war: 1 } } })
	).toEqual({
		tank: {},
		heal: {},
		cac: { war: ['Abo'] },
		dist: {},
	})
	expect(
		fillPClassMainRatio(deepCopy(players), {
			tank: { pClassMin: { drood: 1 } },
			cac: { pClassMin: { war: 1 } },
		})
	).toEqual({
		tank: {},
		heal: {},
		cac: { war: ['Abo'] },
		dist: {},
	})
	expect(fillPClassMainRatio(deepCopy(players), testConstraints.role)).toEqual({
		tank: {},
		heal: {},
		cac: { war: ['Abo', 'Arbok'], rogue: ['Pon'] },
		dist: { hunt: ['Pikachu'], mage: ['Raichu'] },
	})
	expect(
		fillPClassMainRatio(deepCopy(players), testConstraints.role, {
			tank: {},
			heal: {},
			cac: { war: ['Smogo'] },
			dist: {},
		})
	).toEqual({
		tank: {},
		heal: {},
		cac: { war: ['Smogo', 'Abo', 'Arbok'], rogue: ['Pon'] },
		dist: { hunt: ['Pikachu'], mage: ['Raichu'] },
	})
	expect(
		fillPClassMainRatio(
			deepCopy(players),
			{ cac: { pClassMin: { war: 2 } } },
			{
				tank: {},
				heal: {},
				cac: { war: ['Smogo'] },
				dist: {},
			}
		)
	).toEqual({
		tank: {},
		heal: {},
		cac: { war: ['Smogo', 'Abo'] },
		dist: {},
	})
	expect(
		fillPClassMainRatio(deepCopy(players), {
			cac: { min: 2, pClassMin: { war: 1 } },
		})
	).toEqual({
		tank: {},
		heal: {},
		cac: { rogue: ['Pon'], war: ['Abo'] },
		dist: {},
	})
	expect(
		fillPClassMainRatio(deepCopy(players), {
			cac: { min: 2, pClassMin: { war: 1 } },
			dist: { min: 1 },
		})
	).toEqual({
		tank: {},
		heal: {},
		cac: { rogue: ['Pon'], war: ['Abo'] },
		dist: { hunt: ['Pikachu'] },
	})
})

test('analyseMissingMin', () => {
	expect(
		analyseMissingMin(
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
		analyseMissingMin(
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
		analyseMissingMin(
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
		analyseMissingMin(
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
	expect(
		analyseMissingMin(
			{
				tank: {},
				heal: {},
				cac: { war: ['Abo'] },
				dist: {},
			},
			{ cac: { min: 3, pClassMin: { war: 2 } } }
		)
	).toEqual({ cac: { war: 1, openSlot: 1 } })
	expect(
		analyseMissingMin(
			{
				tank: {},
				heal: {},
				cac: { war: ['Abo'], rogue: ['1'] },
				dist: {},
			},
			{ cac: { min: 3, pClassMin: { war: 2 } } }
		)
	).toEqual({ cac: { war: 1 } })
	expect(
		analyseMissingMin(
			{
				tank: {},
				heal: {},
				cac: { war: [1, 2, 3] },
				dist: {},
			},
			{ cac: { min: 3, pClassMin: { war: 2 } } }
		)
	).toEqual({})
})

test('isEmpty', () => {
	expect(isEmpty({})).toEqual(true)
	expect(isEmpty({ a: 1 })).toEqual(false)
	expect(isEmpty([])).toEqual(true)
	expect(isEmpty([1])).toEqual(false)
})

test('isInClassQuotas', () => {
	expect(isInClassQuotas({ role: 'tank', pClass: 'paladin' }, {})).toEqual(
		false
	)
	expect(
		isInClassQuotas(
			{ role: 'tank', pClass: 'paladin' },
			{ tank: { paladin: 1 } }
		)
	).toEqual(true)
	expect(
		isInClassQuotas(
			{ role: 'tank', pClass: 'paladin' },
			{ tank: { paladin: 0 } }
		)
	).toEqual(false)
})

test('getRoleOpenedMinQuota', () => {
	expect(getRoleOpenedMinQuota(testConstraints.role.tank)).toEqual(0)
	expect(getRoleOpenedMinQuota(testConstraints.role.heal)).toEqual(3)
})

test('getRoleOpenedAttributed', () => {
	expect(
		getRoleOpenedAttributed('tank', testConstraints.role.tank, {
			tank: { war: [1, 2] },
		})
	).toEqual(0)
	expect(
		getRoleOpenedAttributed('tank', testConstraints.role.tank, {
			tank: { war: [1, 2, 3, 4] },
		})
	).toEqual(1)
	expect(
		getRoleOpenedAttributed('tank', testConstraints.role.tank, {
			tank: { drood: [1] },
		})
	).toEqual(1)
	expect(
		getRoleOpenedAttributed('tank', testConstraints.role.tank, {
			tank: { drood: [1], war: [1, 2, 3, 4] },
		})
	).toEqual(2)
	expect(
		getRoleOpenedAttributed('tank', testConstraints.role.tank, {
			tank: { war: [1, 2] },
			heal: { drood: [1, 2, 3, 4] },
		})
	).toEqual(0)
	expect(
		getRoleOpenedAttributed('tank', testConstraints.role.tank, {})
	).toEqual(0)
})

test('isInOpenMinQuota', () => {
	expect(isInOpenMinQuota('tank', testConstraints.role.tank, {})).toEqual(false)
	expect(isInOpenMinQuota('heal', testConstraints.role.heal, {})).toEqual(true)
	expect(
		isInOpenMinQuota('heal', testConstraints.role.heal, {
			heal: { paladin: [1, 2, 3], priest: [1, 2, 3], drood: [1] },
		})
	).toEqual(true)
	expect(
		isInOpenMinQuota('heal', testConstraints.role.heal, {
			heal: { paladin: [1], priest: [1, 2, 3], drood: [1] },
		})
	).toEqual(true)
	expect(
		isInOpenMinQuota('heal', testConstraints.role.heal, {
			heal: { paladin: [1], priest: [1, 2, 3], drood: [1, 2, 3, 4] },
		})
	).toEqual(false)
	expect(
		isInOpenMinQuota('heal', testConstraints.role.heal, {
			tank: { war: [1, 2, 3, 4], drood: [1, 2, 3, 4] },
			heal: { paladin: [1], priest: [1, 2, 3], drood: [1, 2] },
		})
	).toEqual(true)
	expect(
		isInOpenMinQuota('cac', { min: 2, pClassMin: { war: 1 } }, {})
	).toEqual(true)
	expect(
		isInOpenMinQuota(
			'cac',
			{ min: 2, pClassMin: { war: 1 } },
			{
				cac: { war: [1] },
			}
		)
	).toEqual(true)
	expect(
		isInOpenMinQuota(
			'cac',
			{ min: 2, pClassMin: { war: 1 } },
			{
				cac: { war: [1, 2] },
			}
		)
	).toEqual(false)
	expect(
		isInOpenMinQuota(
			'cac',
			{ min: 2, pClassMin: { war: 1 } },
			{
				cac: { rogue: [1] },
			}
		)
	).toEqual(false)
})

test('getMaxOpenSlots', () => {
	expect(getMaxOpenSlots(testConstraints.role.heal)).toEqual(5)
	expect(getMaxOpenSlots(testConstraints.role.tank)).toEqual(2)
	expect(getMaxOpenSlots(testConstraints.role.cac)).toEqual(7)
	expect(getMaxOpenSlots(testConstraints.role.dist)).toEqual(7)
})

test('getNbAttributedSlots', () => {
	expect(getNbAttributedSlots({})).toEqual(0)
	expect(getNbAttributedSlots({ tank: { war: [1, 2] } })).toEqual(2)
	expect(getNbAttributedSlots({ tank: { war: [1, 2], rogue: [1] } })).toEqual(3)
	expect(
		getNbAttributedSlots({
			tank: { war: [1, 2], rogue: [1] },
			heal: { drood: [1] },
		})
	).toEqual(4)
	expect(
		getNbAttributedSlots({
			tank: { war: [1, 2], rogue: [1] },
			heal: { drood: [1], paladin: [1] },
			dist: { mage: [1, 2, 3] },
		})
	).toEqual(8)
})

test('isRespectingMax', () => {
	expect(
		isRespectingMax({ role: 'tank', pClass: 'war' }, testConstraints, {})
	).toEqual('pClassMin')
	expect(
		isRespectingMax({ role: 'tank', pClass: 'drood' }, testConstraints, {})
	).toEqual('openSlot')
	expect(
		isRespectingMax(
			{ role: 'tank', pClass: 'drood' },
			{
				maxPlayer: 5,
				role: {
					tank: { min: 1, max: 2, pClassMin: { war: 1 } },
					heal: {
						min: 1,
						max: 2,
						pClassMin: { paladin: 1 },

						cac: { min: 1, max: 2, pClassMin: { hunt: 1 } },
					},
				},
			},
			{}
		)
	).toEqual('openSlot')
	expect(
		isRespectingMax(
			{ role: 'tank', pClass: 'war' },
			{
				maxPlayer: 5,
				role: {
					tank: { min: 1, max: 2, pClassMin: { war: 1 } },
					heal: {
						min: 1,
						max: 2,
						pClassMin: { paladin: 1 },

						cac: { min: 1, max: 2, pClassMin: { hunt: 1 } },
					},
				},
			},
			{ tank: { drood: [1] }, heal: {}, dist: { hunt: [1] } }
		)
	).toEqual('pClassMin')
	expect(
		isRespectingMax(
			{ role: 'tank', pClass: 'drood' },
			{
				maxPlayer: 5,
				role: {
					tank: { min: 1, max: 2, pClassMin: { war: 1 } },
					heal: {
						min: 1,
						max: 2,
						pClassMin: { paladin: 1 },

						cac: { min: 1, max: 2, pClassMin: { hunt: 1 } },
					},
				},
			},
			{ tank: { drood: [1] }, heal: {}, dist: { hunt: [1] } }
		)
	).toEqual(false)
	expect(
		isRespectingMax(
			{ role: 'tank', pClass: 'drood' },
			{
				maxPlayer: 5,
				role: {
					tank: { min: 1, max: 2, pClassMin: { war: 1 } },
					heal: {
						min: 1,
						max: 2,
						pClassMin: { paladin: 1 },

						cac: { min: 1, max: 2, pClassMin: { hunt: 1 } },
					},
				},
			},
			{
				tank: { war: [1] },
				heal: { paladin: [1, 2] },
				dist: { hunt: [1], mage: [1] },
			}
		)
	).toEqual(false)
})

test('findPlayerAttrib', () => {
	expect(findPlayerAttrib()).toEqual(undefined)
	expect(
		findPlayerAttrib('pon', {
			tank: { war: ['pon'] },
			heal: {},
			cac: {},
			dist: {},
		})
	).toEqual({ role: 'tank', pClass: 'war' })

	expect(
		findPlayerAttrib('Pikachu', {
			tank: { war: ['pon'] },
			heal: {},
			cac: { rogue: ['Pikachu'] },
			dist: {},
		})
	).toEqual({ role: 'cac', pClass: 'rogue' })
	expect(
		findPlayerAttrib('Raichu', {
			tank: { war: ['pon'] },
			heal: {},
			cac: { rogue: ['Pikachu'] },
			dist: {},
		})
	).toEqual(undefined)
})

test('findCharacter', () => {
	expect(
		findCharacter('tank', 'war', [
			{ status: 'main', pClass: 'rogue', role: 'cac' },
			{ status: 'mainReroll', pClass: 'drood', role: 'tank' },
			{ status: 'reroll', pClass: 'paladin', role: 'heal' },
		])
	).toEqual(undefined)
	expect(
		findCharacter('tank', 'drood', [
			{ status: 'main', pClass: 'rogue', role: 'cac' },
			{ status: 'mainReroll', pClass: 'drood', role: 'tank' },
			{ status: 'reroll', pClass: 'paladin', role: 'heal' },
		])
	).toEqual({ status: 'mainReroll', pClass: 'drood', role: 'tank' })
	expect(
		findCharacter('tank', 'openSlot', [
			{ status: 'main', pClass: 'rogue', role: 'cac' },
			{ status: 'mainReroll', pClass: 'drood', role: 'tank' },
			{ status: 'reroll', pClass: 'paladin', role: 'heal' },
		])
	).toEqual({ status: 'mainReroll', pClass: 'drood', role: 'tank' })
})

test('fillMissingMainWithRerolls', () => {
	expect(
		fillMissingMainWithRerolls(
			deepCopy(players),
			{ tank: { war: 1 } },
			2,
			false
		)
	).toEqual({
		rerollAttrib: { tank: { war: ['Abo'] }, heal: {}, dist: {}, cac: {} },
		nbRerollSelected: 1,
	})
	expect(
		fillMissingMainWithRerolls(deepCopy(players), { tank: { war: 1 } }, 2, true)
	).toEqual({
		rerollAttrib: { tank: {}, heal: {}, dist: {}, cac: {} },
		nbRerollSelected: 0,
	})

	expect(
		fillMissingMainWithRerolls(
			[
				{
					pseudo: 'a',
					characters: [
						{ status: 'mainReroll', pClass: 'war', role: 'tank' },
						{ status: 'reroll', pClass: 'paladin', role: 'heal' },
					],
				},
				{
					pseudo: 'b',
					characters: [
						{ status: 'mainReroll', pClass: 'paladin', role: 'tank' },
						{ status: 'reroll', pClass: 'paladin', role: 'heal' },
					],
				},
				{
					pseudo: 'c',
					characters: [
						{ status: 'mainReroll', pClass: 'war', role: 'tank' },
						{ status: 'reroll', pClass: 'paladin', role: 'heal' },
					],
				},
			],
			{ tank: { war: 1 } },
			2,
			false
		)
	).toEqual({
		rerollAttrib: { tank: { war: ['c'] }, heal: {}, dist: {}, cac: {} },
		nbRerollSelected: 1,
	})
	expect(
		fillMissingMainWithRerolls(
			[
				{
					pseudo: 'a',
					characters: [
						{ status: 'mainReroll', pClass: 'war', role: 'tank' },
						{ status: 'reroll', pClass: 'paladin', role: 'heal' },
					],
				},
				{
					pseudo: 'b',
					characters: [
						{ status: 'mainReroll', pClass: 'paladin', role: 'tank' },
						{ status: 'reroll', pClass: 'paladin', role: 'heal' },
					],
				},
				{
					pseudo: 'c',
					characters: [
						{ status: 'mainReroll', pClass: 'war', role: 'tank' },
						{ status: 'reroll', pClass: 'paladin', role: 'heal' },
					],
				},
			],
			{ tank: { war: 1 }, heal: { paladin: 1 } },
			2,
			false
		)
	).toEqual({
		rerollAttrib: {
			tank: { war: ['c'] },
			heal: { paladin: ['b'] },
			dist: {},
			cac: {},
		},
		nbRerollSelected: 2,
	})
	expect(
		fillMissingMainWithRerolls(
			[
				{
					pseudo: 'a',
					characters: [
						{ status: 'mainReroll', pClass: 'war', role: 'tank' },
						{ status: 'reroll', pClass: 'paladin', role: 'heal' },
					],
				},
				{
					pseudo: 'b',
					characters: [
						{ status: 'mainReroll', pClass: 'paladin', role: 'tank' },
						{ status: 'reroll', pClass: 'paladin', role: 'heal' },
					],
				},
				{
					pseudo: 'c',
					characters: [
						{ status: 'mainReroll', pClass: 'war', role: 'tank' },
						{ status: 'reroll', pClass: 'paladin', role: 'heal' },
					],
				},
			],
			{ tank: { war: 2 }, heal: { paladin: 1 } },
			2,
			false
		)
	).toEqual({
		rerollAttrib: {
			tank: { war: ['c', 'a'] },
			heal: {},
			dist: {},
			cac: {},
		},
		nbRerollSelected: 2,
	})
	expect(
		fillMissingMainWithRerolls(
			[
				{
					pseudo: 'a',
					characters: [
						{ status: 'mainReroll', pClass: 'war', role: 'tank' },
						{ status: 'reroll', pClass: 'paladin', role: 'heal' },
					],
				},
				{
					pseudo: 'b',
					characters: [
						{ status: 'mainReroll', pClass: 'paladin', role: 'tank' },
						{ status: 'reroll', pClass: 'paladin', role: 'heal' },
					],
				},
				{
					pseudo: 'c',
					characters: [
						{ status: 'mainReroll', pClass: 'war', role: 'tank' },
						{ status: 'reroll', pClass: 'paladin', role: 'heal' },
					],
				},
			],
			{ tank: { war: 2 }, heal: { paladin: 1 } },
			3,
			false
		)
	).toEqual({
		rerollAttrib: {
			tank: { war: ['c', 'a'] },
			heal: { paladin: ['b'] },
			dist: {},
			cac: {},
		},
		nbRerollSelected: 3,
	})

	expect(
		fillMissingMainWithRerolls(
			[
				{
					pseudo: 'a',
					characters: [
						{ status: 'mainReroll', pClass: 'war', role: 'tank' },
						{ status: 'reroll', pClass: 'paladin', role: 'heal' },
					],
				},
				{
					pseudo: 'b',
					characters: [
						{ status: 'mainReroll', pClass: 'paladin', role: 'tank' },
						{ status: 'reroll', pClass: 'paladin', role: 'heal' },
					],
				},
				{
					pseudo: 'c',
					characters: [
						{ status: 'mainReroll', pClass: 'war', role: 'tank' },
						{ status: 'reroll', pClass: 'paladin', role: 'heal' },
					],
				},
			],
			{ tank: { war: 2 }, heal: { paladin: 1 } },
			2,
			true
		)
	).toEqual({
		rerollAttrib: {
			tank: { war: ['c', 'a'] },
			heal: {},
			dist: {},
			cac: {},
		},
		nbRerollSelected: 2,
	})

	expect(
		fillMissingMainWithRerolls(
			[
				{
					pseudo: 'a',
					characters: [
						{ status: 'mainReroll', pClass: 'war', role: 'tank' },
						{ status: 'reroll', pClass: 'paladin', role: 'cac' },
					],
				},
				{
					pseudo: 'b',
					characters: [
						{ status: 'mainReroll', pClass: 'paladin', role: 'tank' },
						{ status: 'reroll', pClass: 'paladin', role: 'cac' },
					],
				},
				{
					pseudo: 'c',
					characters: [
						{ status: 'mainReroll', pClass: 'war', role: 'tank' },
						{ status: 'reroll', pClass: 'paladin', role: 'heal' },
					],
				},
			],
			{ cac: { openSlot: 1 }, heal: { paladin: 1 } },
			2,
			false
		)
	).toEqual({
		rerollAttrib: {
			tank: {},
			heal: { paladin: ['c'] },
			dist: {},
			cac: { paladin: ['b'] },
		},
		nbRerollSelected: 2,
	})
	expect(
		fillMissingMainWithRerolls(
			[
				{
					pseudo: 'a',
					characters: [
						{ status: 'mainReroll', pClass: 'war', role: 'tank' },
						{ status: 'reroll', pClass: 'paladin', role: 'cac' },
					],
				},
				{
					pseudo: 'b',
					characters: [
						{ status: 'mainReroll', pClass: 'paladin', role: 'tank' },
						{ status: 'reroll', pClass: 'paladin', role: 'cac' },
					],
				},
				{
					pseudo: 'c',
					characters: [
						{ status: 'mainReroll', pClass: 'war', role: 'tank' },
						{ status: 'reroll', pClass: 'paladin', role: 'heal' },
					],
				},
			],
			{ cac: { openSlot: 1 }, tank: { war: 1, openSlot: 1 } },
			3,
			false
		)
	).toEqual({
		rerollAttrib: {
			tank: { war: ['c', 'a'] },
			heal: {},
			dist: {},
			cac: { paladin: ['b'] },
		},
		nbRerollSelected: 3,
	})

	expect(
		fillMissingMainWithRerolls(
			[
				{
					pseudo: 'a',
					characters: [
						{ status: 'mainReroll', pClass: 'war', role: 'tank' },
						{ status: 'reroll', pClass: 'paladin', role: 'cac' },
					],
				},
				{
					pseudo: 'b',
					characters: [
						{ status: 'mainReroll', pClass: 'paladin', role: 'tank' },
						{ status: 'reroll', pClass: 'paladin', role: 'cac' },
					],
				},
				{
					pseudo: 'c',
					characters: [
						{ status: 'mainReroll', pClass: 'war', role: 'tank' },
						{ status: 'reroll', pClass: 'paladin', role: 'heal' },
					],
				},
			],
			{
				tank: { war: 1, openSlot: 1 },
				heal: { openSlot: 1 },
			},
			3,
			false
		)
	).toEqual({
		rerollAttrib: {
			tank: { war: ['a'], paladin: ['b'] },
			heal: { paladin: ['c'] },
			dist: {},
			cac: {},
		},
		nbRerollSelected: 3,
	})

	expect(
		fillMissingMainWithRerolls(
			[
				{
					pseudo: 'a',
					characters: [
						{ status: 'mainReroll', pClass: 'war', role: 'tank' },
						{ status: 'reroll', pClass: 'paladin', role: 'cac' },
					],
				},
				{
					pseudo: 'b',
					characters: [
						{ status: 'mainReroll', pClass: 'paladin', role: 'tank' },
						{ status: 'reroll', pClass: 'paladin', role: 'cac' },
					],
				},
				{
					pseudo: 'c',
					characters: [
						{ status: 'mainReroll', pClass: 'war', role: 'tank' },
						{ status: 'reroll', pClass: 'paladin', role: 'heal' },
					],
				},
			],
			{
				tank: { war: 1, openSlot: 1 },
				heal: { openSlot: 2 },
			},
			3,
			false
		)
	).toEqual({
		rerollAttrib: {
			tank: { war: ['a'], paladin: ['b'] },
			heal: { paladin: ['c'] },
			dist: {},
			cac: {},
		},
		nbRerollSelected: 3,
	})
	expect(
		fillMissingMainWithRerolls(
			[
				{
					pseudo: 'a',
					characters: [
						{ status: 'mainReroll', pClass: 'war', role: 'tank' },
						{ status: 'reroll', pClass: 'paladin', role: 'cac' },
					],
				},
				{
					pseudo: 'b',
					characters: [
						{ status: 'mainReroll', pClass: 'paladin', role: 'tank' },
						{ status: 'reroll', pClass: 'paladin', role: 'cac' },
					],
				},
				{
					pseudo: 'c',
					characters: [
						{ status: 'mainReroll', pClass: 'war', role: 'tank' },
						{ status: 'reroll', pClass: 'paladin', role: 'heal' },
					],
				},
				{
					pseudo: 'd',
					characters: [
						{ status: 'mainReroll', pClass: 'mage', role: 'dist' },
						{ status: 'reroll', pClass: 'hunt', role: 'dist' },
					],
				},
			],
			{
				tank: { war: 1, openSlot: 1 },
				heal: { openSlot: 1 },
				cac: { rogue: 1 },
			},
			3,
			false
		)
	).toEqual({
		rerollAttrib: {
			tank: { war: ['a'], paladin: ['b'] },
			heal: { paladin: ['c'] },
			dist: {},
			cac: {},
		},
		nbRerollSelected: 3,
	})
	expect(
		fillMissingMainWithRerolls(
			[
				{
					pseudo: 'a',
					characters: [
						{ status: 'mainReroll', pClass: 'war', role: 'tank' },
						{ status: 'reroll', pClass: 'paladin', role: 'cac' },
					],
				},
				{
					pseudo: 'b',
					characters: [
						{ status: 'mainReroll', pClass: 'paladin', role: 'tank' },
						{ status: 'reroll', pClass: 'paladin', role: 'cac' },
					],
				},
				{
					pseudo: 'c',
					characters: [
						{ status: 'mainReroll', pClass: 'war', role: 'tank' },
						{ status: 'reroll', pClass: 'paladin', role: 'heal' },
					],
				},
				{
					pseudo: 'd',
					characters: [
						{ status: 'mainReroll', pClass: 'mage', role: 'dist' },
						{ status: 'reroll', pClass: 'hunt', role: 'dist' },
					],
				},
			],
			{
				heal: { openSlot: 1 },
			},
			1,
			false
		)
	).toEqual({
		rerollAttrib: {
			tank: {},
			heal: { paladin: ['c'] },
			dist: {},
			cac: {},
		},
		nbRerollSelected: 1,
	})
})

test('fillRerolls', () => {
	expect(
		fillRerolls(
			[],
			{
				maxPlayer: 4,
				onlyMainReroll: false,
				role: {
					tank: { min: 1, max: 2, pClassMin: { war: 1 } },
					heal: { min: 1, max: 2, pClassMin: { paladin: 1 } },
					cac: { min: 0, max: 1, pClassMin: {} },
					dist: { min: 0, max: 1, pClassMin: {} },
				},
			},
			2,
			{ tank: {}, heal: {}, cac: {}, dist: {} },
			{}
		)
	).toEqual({ tank: {}, heal: {}, cac: {}, dist: {} })

	expect(
		fillRerolls(
			[
				{
					pseudo: 'a',
					characters: [
						{ status: 'mainReroll', pClass: 'war', role: 'tank' },
						{ status: 'reroll', pClass: 'paladin', role: 'cac' },
					],
				},
				{
					pseudo: 'b',
					characters: [
						{ status: 'mainReroll', pClass: 'paladin', role: 'tank' },
						{ status: 'reroll', pClass: 'paladin', role: 'cac' },
					],
				},
				{
					pseudo: 'c',
					characters: [
						{ status: 'mainReroll', pClass: 'war', role: 'tank' },
						{ status: 'reroll', pClass: 'paladin', role: 'heal' },
					],
				},
			],
			{
				maxPlayer: 4,
				onlyMainReroll: false,
				role: {
					tank: { min: 1, max: 2, pClassMin: { war: 1 } },
					heal: { min: 1, max: 2, pClassMin: { paladin: 1 } },
					cac: { min: 0, max: 1, pClassMin: {} },
					dist: { min: 0, max: 1, pClassMin: {} },
				},
			},
			2,
			{ tank: {}, heal: {}, cac: {}, dist: {} },
			{}
		)
	).toEqual({
		tank: { war: ['c'], paladin: ['b'] },
		heal: {},
		cac: {},
		dist: {},
	})
	expect(
		fillRerolls(
			[
				{
					pseudo: 'a',
					characters: [
						{ status: 'mainReroll', pClass: 'war', role: 'tank' },
						{ status: 'reroll', pClass: 'paladin', role: 'cac' },
					],
				},
				{
					pseudo: 'b',
					characters: [
						{ status: 'mainReroll', pClass: 'paladin', role: 'tank' },
						{ status: 'reroll', pClass: 'paladin', role: 'cac' },
					],
				},
				{
					pseudo: 'c',
					characters: [
						{ status: 'mainReroll', pClass: 'war', role: 'tank' },
						{ status: 'reroll', pClass: 'paladin', role: 'heal' },
					],
				},
			],
			{
				maxPlayer: 4,
				onlyMainReroll: false,
				role: {
					tank: { min: 1, max: 2, pClassMin: { war: 1 } },
					heal: { min: 1, max: 2, pClassMin: { paladin: 1 } },
					cac: { min: 0, max: 1, pClassMin: {} },
					dist: { min: 0, max: 1, pClassMin: {} },
				},
			},
			2,
			{ tank: {}, heal: {}, cac: {}, dist: {} },
			{ heal: { openSlot: 1 } }
		)
	).toEqual({
		tank: { paladin: ['b'] },
		heal: { paladin: ['c'] },
		cac: {},
		dist: {},
	})

	expect(
		fillRerolls(
			[
				{
					pseudo: 'a',
					characters: [
						{ status: 'mainReroll', pClass: 'war', role: 'tank' },
						{ status: 'reroll', pClass: 'paladin', role: 'cac' },
					],
				},
				{
					pseudo: 'b',
					characters: [
						{ status: 'mainReroll', pClass: 'paladin', role: 'tank' },
						{ status: 'reroll', pClass: 'paladin', role: 'cac' },
					],
				},
				{
					pseudo: 'c',
					characters: [
						{ status: 'mainReroll', pClass: 'war', role: 'tank' },
						{ status: 'reroll', pClass: 'paladin', role: 'heal' },
					],
				},
			],
			{
				maxPlayer: 4,
				onlyMainReroll: false,
				role: {
					tank: { min: 1, max: 2, pClassMin: { war: 1 } },
					heal: { min: 1, max: 2, pClassMin: { paladin: 1 } },
					cac: { min: 0, max: 1, pClassMin: {} },
					dist: { min: 0, max: 1, pClassMin: {} },
				},
			},
			3,
			{ tank: {}, heal: {}, cac: {}, dist: {} },
			{ heal: { openSlot: 1 } }
		)
	).toEqual({
		tank: { paladin: ['b'], war: ['a'] },
		heal: { paladin: ['c'] },
		cac: {},
		dist: {},
	})

	expect(
		fillRerolls(
			[
				{
					pseudo: 'a',
					characters: [
						{ status: 'mainReroll', pClass: 'war', role: 'tank' },
						{ status: 'reroll', pClass: 'paladin', role: 'cac' },
					],
				},
				{
					pseudo: 'b',
					characters: [
						{ status: 'mainReroll', pClass: 'paladin', role: 'tank' },
						{ status: 'reroll', pClass: 'paladin', role: 'cac' },
					],
				},
				{
					pseudo: 'c',
					characters: [
						{ status: 'mainReroll', pClass: 'war', role: 'tank' },
						{ status: 'reroll', pClass: 'paladin', role: 'heal' },
					],
				},
			],
			{
				maxPlayer: 4,
				onlyMainReroll: false,
				role: {
					tank: { min: 1, max: 2, pClassMin: { war: 1 } },
					heal: { min: 1, max: 2, pClassMin: { paladin: 1 } },
					cac: { min: 0, max: 1, pClassMin: {} },
					dist: { min: 0, max: 1, pClassMin: {} },
				},
			},
			3,
			{ tank: {}, heal: {}, cac: {}, dist: {} },
			{}
		)
	).toEqual({
		tank: { war: ['c'], paladin: ['b'] },
		heal: {},
		cac: { paladin: ['a'] },
		dist: {},
	})

	expect(
		fillRerolls(
			[
				{
					pseudo: 'a',
					characters: [
						{ status: 'mainReroll', pClass: 'war', role: 'tank' },
						{ status: 'reroll', pClass: 'paladin', role: 'cac' },
					],
				},
				{
					pseudo: 'b',
					characters: [
						{ status: 'mainReroll', pClass: 'paladin', role: 'tank' },
						{ status: 'reroll', pClass: 'paladin', role: 'cac' },
					],
				},
				{
					pseudo: 'c',
					characters: [
						{ status: 'mainReroll', pClass: 'war', role: 'tank' },
						{ status: 'reroll', pClass: 'paladin', role: 'heal' },
					],
				},
			],
			{
				maxPlayer: 4,
				onlyMainReroll: false,
				role: {
					tank: { min: 1, max: 2, pClassMin: { war: 1 } },
					heal: { min: 1, max: 2, pClassMin: { paladin: 1 } },
					cac: { min: 0, max: 0, pClassMin: {} },
					dist: { min: 0, max: 0, pClassMin: {} },
				},
			},
			3,
			{ tank: {}, heal: {}, cac: {}, dist: {} },
			{}
		)
	).toEqual({
		tank: { war: ['a'], paladin: ['b'] },
		heal: { paladin: ['c'] },
		cac: {},
		dist: {},
	})
})

test('addAttribs', () => {
	expect(
		addAttribs(
			{ tank: {}, heal: {}, cac: {}, dist: {} },
			{ tank: {}, heal: {}, cac: {}, dist: {} }
		)
	).toEqual({ tank: {}, heal: {}, cac: {}, dist: {} })
	expect(
		addAttribs(
			{ tank: { war: ['a'] }, heal: {}, cac: {}, dist: {} },
			{ tank: {}, heal: {}, cac: {}, dist: {} }
		)
	).toEqual({ tank: { war: ['a'] }, heal: {}, cac: {}, dist: {} })
	expect(
		addAttribs(
			{ tank: { war: ['a'] }, heal: {}, cac: {}, dist: {} },
			{ tank: {}, heal: {}, cac: { rogue: ['b'] }, dist: {} }
		)
	).toEqual({ tank: { war: ['a'] }, heal: {}, cac: { rogue: ['b'] }, dist: {} })
	expect(
		addAttribs(
			{ tank: { war: ['a'] }, heal: {}, cac: {}, dist: {} },
			{ tank: { war: ['c'] }, heal: {}, cac: { rogue: ['b'] }, dist: {} }
		)
	).toEqual({
		tank: { war: ['a', 'c'] },
		heal: {},
		cac: { rogue: ['b'] },
		dist: {},
	})

	expect(
		addAttribs(
			{ tank: { war: ['a'] }, heal: {}, cac: {}, dist: {} },
			{ tank: { paladin: ['c'] }, heal: {}, cac: { rogue: ['b'] }, dist: {} }
		)
	).toEqual({
		tank: { war: ['a'], paladin: ['c'] },
		heal: {},
		cac: { rogue: ['b'] },
		dist: {},
	})
})

test('completeFillWithMain', () => {
	let players = [
		{
			pseudo: 'a',
			characters: [{ status: 'main', pClass: 'war', role: 'tank' }],
		},

		{
			pseudo: 'b',
			characters: [{ status: 'main', pClass: 'war', role: 'cac' }],
		},
	]
	let res = completeFillWithMain(
		players,
		{
			maxPlayer: 4,
			role: {
				tank: { min: 1, max: 2, pClassMin: { war: 1 } },
				heal: { min: 1, max: 2, pClassMin: { paladin: 1 } },
				cac: { min: 0, max: 2, pClassMin: {} },
				dist: { min: 0, max: 1, pClassMin: {} },
			},
		},
		{ tank: { war: ['z'] }, heal: { paladin: ['y'] } }
	)
	expect({ ...res, bench: keepPseudoOnly(getBench(players)) }).toEqual({
		fillAttrib: {
			tank: { war: ['a'] },
			heal: {},
			cac: { war: ['b'] },
			dist: {},
		},
		bench: [],
	})

	players = [
		{
			pseudo: 'a',
			characters: [{ status: 'main', pClass: 'war', role: 'tank' }],
		},

		{
			pseudo: 'b',
			characters: [{ status: 'main', pClass: 'war', role: 'cac' }],
		},
	]
	res = completeFillWithMain(
		players,
		{
			maxPlayer: 4,
			role: {
				tank: { min: 1, max: 2, pClassMin: { war: 1 } },
				heal: { min: 1, max: 2, pClassMin: { paladin: 1 } },
				cac: { min: 0, max: 2, pClassMin: {} },
				dist: { min: 0, max: 1, pClassMin: {} },
			},
		},
		{ tank: { war: ['z'] }, heal: { paladin: ['y'] }, dist: { mage: ['x'] } }
	)
	expect({ ...res, bench: keepPseudoOnly(getBench(players)) }).toEqual({
		fillAttrib: { tank: { war: ['a'] }, heal: {}, cac: {}, dist: {} },
		bench: [],
	})

	players = [
		{
			pseudo: 'a',
			characters: [{ status: 'main', pClass: 'war', role: 'tank' }],
		},

		{
			pseudo: 'b',
			characters: [{ status: 'main', pClass: 'war', role: 'tank' }],
		},
		{
			pseudo: 'c',
			characters: [{ status: 'main', pClass: 'war', role: 'cac' }],
			isBenched: true,
		},
	]
	res = completeFillWithMain(
		players,
		{
			maxPlayer: 4,
			role: {
				tank: { min: 1, max: 2, pClassMin: { war: 1 } },
				heal: { min: 1, max: 2, pClassMin: { paladin: 1 } },
				cac: { min: 0, max: 2, pClassMin: {} },
				dist: { min: 0, max: 1, pClassMin: {} },
			},
		},
		{ tank: { war: ['z'] }, heal: { paladin: ['y'] }, dist: {} }
	)
	expect({ ...res, bench: keepPseudoOnly(getBench(players)) }).toEqual({
		fillAttrib: {
			tank: { war: ['a'] },
			heal: {},
			cac: { war: ['c'] },
			dist: {},
		},
		bench: ['b'],
	})

	players = [
		{
			pseudo: 'a',
			characters: [{ status: 'main', pClass: 'war', role: 'tank' }],
		},
		{
			pseudo: 'b',
			characters: [{ status: 'main', pClass: 'war', role: 'tank' }],
		},
		{
			pseudo: 'd',
			characters: [{ status: 'main', pClass: 'mage', role: 'dist' }],
		},
		{
			pseudo: 'c',
			characters: [{ status: 'main', pClass: 'war', role: 'cac' }],
			isBenched: true,
		},
	]
	res = completeFillWithMain(
		players,
		{
			maxPlayer: 5,
			role: {
				tank: { min: 1, max: 2, pClassMin: { war: 1 } },
				heal: { min: 1, max: 2, pClassMin: { paladin: 1 } },
				cac: { min: 0, max: 2, pClassMin: {} },
				dist: { min: 0, max: 1, pClassMin: {} },
			},
		},
		{ tank: { war: ['z'] }, heal: { paladin: ['y'] }, dist: {} }
	)
	expect({ ...res, bench: keepPseudoOnly(getBench(players)) }).toEqual({
		fillAttrib: {
			tank: { war: ['a'] },
			heal: {},
			cac: { war: ['c'] },
			dist: { mage: ['d'] },
		},
		bench: ['b'],
	})

	players = [
		{
			pseudo: 'a',
			characters: [{ status: 'main', pClass: 'war', role: 'tank' }],
		},
		{
			pseudo: 'b',
			characters: [{ status: 'main', pClass: 'war', role: 'tank' }],
		},
		{
			pseudo: 'c',
			characters: [{ status: 'main', pClass: 'war', role: 'cac' }],
			isBenched: true,
		},
	]
	res = completeFillWithMain(
		players,
		{
			maxPlayer: 4,
			role: {
				tank: { min: 1, max: 1, pClassMin: { war: 1 } },
				heal: { min: 1, max: 2, pClassMin: { paladin: 1 } },
				cac: { min: 0, max: 2, pClassMin: {} },
				dist: { min: 0, max: 1, pClassMin: {} },
			},
		},
		{ tank: { war: ['z'] }, heal: { paladin: ['y'] }, dist: {} }
	)

	expect({ ...res, bench: keepPseudoOnly(getBench(players)) }).toEqual({
		fillAttrib: {
			tank: { war: ['b'] },
			heal: {},
			cac: { war: ['c'] },
			dist: {},
		},
		bench: ['a'],
		overslot: [
			{
				pseudo: 'b',
				characters: [{ status: 'main', pClass: 'war', role: 'tank' }],
				isSelected: true,
				isOverSlot: true,
			},
		],
	})
})

test('fill', () => {
	let players = [
		{
			RaidReroll: 1,
			LastRR: '2020-09-01T15:00:00',
			MainBench: 0,
			LastMB: null,
			rank: 'raider',
			pseudo: 'a',
			rerollWanted: true,
			characters: [
				{ status: 'main', pClass: 'war', role: 'tank' },
				{ status: 'mainReroll', pClass: 'drood', role: 'tank' },
				{ status: 'reroll', pClass: 'paladin', role: 'heal' },
			],
		},
		{
			RaidReroll: 1,
			LastRR: '2020-08-01T15:00:00',
			MainBench: 0,
			LastMB: null,
			rank: 'raider',
			pseudo: 'b',
			rerollWanted: true,
			characters: [
				{ status: 'main', pClass: 'drood', role: 'tank' },
				{ status: 'mainReroll', pClass: 'drood', role: 'heal' },
				{ status: 'reroll', pClass: 'paladin', role: 'heal' },
			],
		},
		{
			RaidReroll: 1,
			LastRR: '2020-09-01T15:00:00',
			MainBench: 0,
			LastMB: null,
			rank: 'raider',
			pseudo: 'c',
			rerollWanted: false,
			characters: [{ status: 'main', pClass: 'rogue', role: 'cac' }],
		},
		{
			RaidReroll: 1,
			LastRR: '2020-09-01T15:00:00',
			MainBench: 0,
			LastMB: null,
			rank: 'raider',
			pseudo: 'd',
			rerollWanted: true,
			characters: [{ status: 'main', pClass: 'hunt', role: 'dist' }],
		},
	]
	expect(
		fill(players, raidDate, 1, {
			maxPlayer: 4,
			mainRatio: 0.5,
			role: {
				tank: { min: 1, max: 1, pClassMin: { war: 1 } },
				heal: { min: 1, max: 2, pClassMin: { paladin: 1 } },
				cac: { min: 0, max: 1, pClassMin: {} },
				dist: { min: 0, max: 1, pClassMin: {} },
			},
		})
	).toEqual({
		attrib: {
			tank: { war: ['a'] },
			heal: { paladin: ['b'] },
			cac: { rogue: ['c'] },
			dist: { hunt: ['d'] },
		},
		mainMissing: { heal: { paladin: 1 } },
		quotaMissing: {},
		playerMissing: 0,
		bench: [],
		overslot: [],
		rerolls: ['b'],
	})
	expect(
		fill(
			[
				{
					RaidReroll: 1,
					LastRR: '2020-09-01T15:00:00',
					MainBench: 0,
					LastMB: null,
					rank: 'raider',
					pseudo: 'a',
					rerollWanted: true,
					characters: [
						{ status: 'main', pClass: 'war', role: 'tank' },
						{ status: 'mainReroll', pClass: 'drood', role: 'tank' },
						{ status: 'reroll', pClass: 'paladin', role: 'heal' },
					],
				},
				{
					RaidReroll: 1,
					LastRR: '2020-08-01T15:00:00',
					MainBench: 0,
					LastMB: null,
					rank: 'raider',
					pseudo: 'b',
					rerollWanted: true,
					characters: [
						{ status: 'main', pClass: 'drood', role: 'tank' },
						{ status: 'mainReroll', pClass: 'drood', role: 'heal' },
						{ status: 'reroll', pClass: 'paladin', role: 'heal' },
					],
				},
				{
					RaidReroll: 1,
					LastRR: '2020-09-01T15:00:00',
					MainBench: 0,
					LastMB: null,
					rank: 'raider',
					pseudo: 'c',
					rerollWanted: false,
					characters: [{ status: 'main', pClass: 'rogue', role: 'cac' }],
				},
				{
					RaidReroll: 1,
					LastRR: '2020-09-01T15:00:00',
					MainBench: 0,
					LastMB: null,
					rank: 'raider',
					pseudo: 'd',
					rerollWanted: true,
					characters: [{ status: 'main', pClass: 'hunt', role: 'dist' }],
				},
				{
					RaidReroll: 1,
					LastRR: '2020-09-01T15:00:00',
					MainBench: 0,
					LastMB: null,
					rank: 'raider',
					pseudo: 'e',
					rerollWanted: true,
					characters: [{ status: 'main', pClass: 'hunt', role: 'dist' }],
				},
			],
			raidDate,
			1,
			{
				maxPlayer: 4,
				mainRatio: 0.5,
				role: {
					tank: { min: 1, max: 1, pClassMin: { war: 1 } },
					heal: { min: 1, max: 2, pClassMin: { paladin: 1 } },
					cac: { min: 0, max: 1, pClassMin: {} },
					dist: { min: 0, max: 1, pClassMin: {} },
				},
			}
		)
	).toEqual({
		attrib: {
			tank: { war: ['a'] },
			heal: { paladin: ['b'] },
			cac: { rogue: ['c'] },
			dist: { hunt: ['d'] },
		},
		mainMissing: { heal: { paladin: 1 } },
		quotaMissing: {},
		playerMissing: 0,
		bench: ['e'],
		overslot: [],
		rerolls: ['b'],
	})

	expect(
		fill(
			[
				{
					RaidReroll: 1,
					LastRR: '2020-09-01T15:00:00',
					MainBench: 0,
					LastMB: null,
					rank: 'raider',
					pseudo: 'a',
					rerollWanted: true,
					characters: [
						{ status: 'main', pClass: 'war', role: 'tank' },
						{ status: 'mainReroll', pClass: 'drood', role: 'tank' },
						{ status: 'reroll', pClass: 'paladin', role: 'heal' },
					],
				},
				{
					RaidReroll: 1,
					LastRR: '2020-08-01T15:00:00',
					MainBench: 0,
					LastMB: null,
					rank: 'raider',
					pseudo: 'b',
					rerollWanted: true,
					characters: [
						{ status: 'main', pClass: 'drood', role: 'tank' },
						{ status: 'mainReroll', pClass: 'drood', role: 'heal' },
						{ status: 'reroll', pClass: 'paladin', role: 'heal' },
					],
				},
				{
					RaidReroll: 1,
					LastRR: '2020-09-01T15:00:00',
					MainBench: 1,
					LastMB: '2020-09-01T15:00:00',
					rank: 'raider',
					pseudo: 'c',
					rerollWanted: false,
					characters: [{ status: 'main', pClass: 'hunt', role: 'dist' }],
				},
				{
					RaidReroll: 1,
					LastRR: '2020-09-01T15:00:00',
					MainBench: 0,
					LastMB: null,
					rank: 'raider',
					pseudo: 'd',
					rerollWanted: true,
					characters: [{ status: 'main', pClass: 'hunt', role: 'dist' }],
				},
			],
			raidDate,
			1,
			{
				maxPlayer: 4,
				mainRatio: 0.5,
				role: {
					tank: { min: 1, max: 1, pClassMin: { war: 1 } },
					heal: { min: 1, max: 2, pClassMin: { paladin: 1 } },
					cac: { min: 0, max: 1, pClassMin: {} },
					dist: { min: 0, max: 1, pClassMin: {} },
				},
			}
		)
	).toEqual({
		attrib: {
			tank: { war: ['a'] },
			heal: { paladin: ['b'] },
			cac: {},
			dist: { hunt: ['c', 'd'] },
		},
		mainMissing: { heal: { paladin: 1 } },
		quotaMissing: {},
		playerMissing: 0,
		bench: [],
		overslot: ['d'],
		rerolls: ['b'],
	})
	expect(
		fill(
			[
				{
					RaidReroll: 1,
					LastRR: '2020-09-01T15:00:00',
					MainBench: 0,
					LastMB: null,
					rank: 'raider',
					pseudo: 'a',
					rerollWanted: true,
					characters: [
						{ status: 'main', pClass: 'war', role: 'tank' },
						{ status: 'mainReroll', pClass: 'drood', role: 'tank' },
						{ status: 'reroll', pClass: 'paladin', role: 'heal' },
					],
				},
				{
					RaidReroll: 1,
					LastRR: '2020-08-01T15:00:00',
					MainBench: 0,
					LastMB: null,
					rank: 'raider',
					pseudo: 'b',
					rerollWanted: true,
					characters: [
						{ status: 'main', pClass: 'drood', role: 'tank' },
						{ status: 'mainReroll', pClass: 'drood', role: 'heal' },
						{ status: 'reroll', pClass: 'paladin', role: 'heal' },
					],
				},
				{
					RaidReroll: 1,
					LastRR: '2020-09-01T15:00:00',
					MainBench: 0,
					LastMB: null,
					rank: 'raider',
					pseudo: 'c',
					rerollWanted: false,
					characters: [{ status: 'main', pClass: 'hunt', role: 'dist' }],
				},
				{
					RaidReroll: 1,
					LastRR: '2020-09-01T15:00:00',
					MainBench: 0,
					LastMB: null,
					rank: 'raider',
					pseudo: 'd',
					rerollWanted: true,
					characters: [{ status: 'main', pClass: 'hunt', role: 'dist' }],
				},
				{
					RaidReroll: 2,
					LastRR: '2020-09-01T15:00:00',
					MainBench: 0,
					LastMB: null,
					rank: 'raider',
					pseudo: 'e',
					rerollWanted: true,
					characters: [{ status: 'main', pClass: 'hunt', role: 'dist' }],
				},
			],
			raidDate,
			1,
			{
				maxPlayer: 4,
				mainRatio: 0.5,
				role: {
					tank: { min: 1, max: 1, pClassMin: { war: 1 } },
					heal: { min: 1, max: 2, pClassMin: { paladin: 1 } },
					cac: { min: 0, max: 1, pClassMin: {} },
					dist: { min: 0, max: 1, pClassMin: {} },
				},
			}
		)
	).toEqual({
		attrib: {
			tank: { war: ['a'] },
			heal: { paladin: ['b'] },
			cac: {},
			dist: { hunt: ['d', 'e'] },
		},
		mainMissing: { heal: { paladin: 1 } },
		quotaMissing: {},
		playerMissing: 0,
		bench: ['c'],
		overslot: ['e'],
		rerolls: ['b'],
	})
	expect(
		fill(
			[
				{
					RaidReroll: 1,
					LastRR: '2020-09-01T15:00:00',
					MainBench: 0,
					LastMB: null,
					rank: 'raider',
					pseudo: 'a',
					rerollWanted: true,
					characters: [
						{ status: 'main', pClass: 'war', role: 'tank' },
						{ status: 'mainReroll', pClass: 'drood', role: 'tank' },
						{ status: 'reroll', pClass: 'paladin', role: 'heal' },
					],
				},
				{
					RaidReroll: 1,
					LastRR: '2020-08-01T15:00:00',
					MainBench: 0,
					LastMB: null,
					rank: 'raider',
					pseudo: 'b',
					rerollWanted: true,
					characters: [
						{ status: 'main', pClass: 'drood', role: 'tank' },
						{ status: 'mainReroll', pClass: 'drood', role: 'heal' },
						{ status: 'reroll', pClass: 'paladin', role: 'heal' },
					],
				},
				{
					RaidReroll: 1,
					LastRR: '2020-09-01T15:00:00',
					MainBench: 1,
					LastMB: '2020-09-01T15:00:00',
					rank: 'raider',
					pseudo: 'c',
					rerollWanted: false,
					characters: [{ status: 'main', pClass: 'hunt', role: 'dist' }],
				},
				{
					RaidReroll: 1,
					LastRR: '2020-09-01T15:00:00',
					MainBench: 0,
					LastMB: null,
					rank: 'raider',
					pseudo: 'd',
					rerollWanted: true,
					characters: [{ status: 'main', pClass: 'hunt', role: 'dist' }],
				},
				{
					RaidReroll: 2,
					LastRR: '2020-09-01T15:00:00',
					MainBench: 0,
					LastMB: null,
					rank: 'raider',
					pseudo: 'e',
					rerollWanted: true,
					characters: [{ status: 'main', pClass: 'hunt', role: 'dist' }],
				},
			],
			raidDate,
			1,
			{
				maxPlayer: 4,
				mainRatio: 0.5,
				role: {
					tank: { min: 1, max: 1, pClassMin: { war: 1 } },
					heal: { min: 1, max: 2, pClassMin: { paladin: 1 } },
					cac: { min: 0, max: 1, pClassMin: {} },
					dist: { min: 0, max: 1, pClassMin: {} },
				},
			}
		)
	).toEqual({
		attrib: {
			tank: { war: ['a'] },
			heal: { paladin: ['b'] },
			cac: {},
			dist: { hunt: ['c', 'e'] },
		},
		mainMissing: { heal: { paladin: 1 } },
		quotaMissing: {},
		playerMissing: 0,
		bench: ['d'],
		overslot: ['e'],
		rerolls: ['b'],
	})

	expect(
		fill(
			[
				{
					RaidReroll: 1,
					LastRR: '2020-09-01T15:00:00',
					MainBench: 0,
					LastMB: null,
					rank: 'raider',
					pseudo: 'a',
					rerollWanted: true,
					characters: [
						{ status: 'main', pClass: 'war', role: 'tank' },
						{ status: 'mainReroll', pClass: 'drood', role: 'tank' },
						{ status: 'reroll', pClass: 'paladin', role: 'heal' },
					],
				},
				{
					RaidReroll: 1,
					LastRR: '2020-08-01T15:00:00',
					MainBench: 0,
					LastMB: null,
					rank: 'raider',
					pseudo: 'b',
					rerollWanted: true,
					characters: [
						{ status: 'main', pClass: 'drood', role: 'tank' },
						{ status: 'mainReroll', pClass: 'drood', role: 'heal' },
						{ status: 'reroll', pClass: 'paladin', role: 'heal' },
					],
				},
				{
					RaidReroll: 1,
					LastRR: '2020-09-01T15:00:00',
					MainBench: 1,
					LastMB: '2020-09-01T15:00:00',
					rank: 'raider',
					pseudo: 'c',
					rerollWanted: false,
					characters: [{ status: 'main', pClass: 'hunt', role: 'dist' }],
				},
				{
					RaidReroll: 1,
					LastRR: '2020-09-01T15:00:00',
					MainBench: 1,
					LastMB: '2020-08-01T15:00:00',
					rank: 'raider',
					pseudo: 'd',
					rerollWanted: true,
					characters: [{ status: 'main', pClass: 'hunt', role: 'dist' }],
				},
				{
					RaidReroll: 2,
					LastRR: '2020-09-01T15:00:00',
					MainBench: 0,
					LastMB: null,
					rank: 'raider',
					pseudo: 'e',
					rerollWanted: true,
					characters: [{ status: 'main', pClass: 'hunt', role: 'dist' }],
				},
			],
			raidDate,
			1,
			{
				maxPlayer: 4,
				mainRatio: 0.5,
				role: {
					tank: { min: 1, max: 1, pClassMin: { war: 1 } },
					heal: { min: 1, max: 2, pClassMin: { paladin: 1 } },
					cac: { min: 0, max: 1, pClassMin: {} },
					dist: { min: 0, max: 1, pClassMin: {} },
				},
			}
		)
	).toEqual({
		attrib: {
			tank: { war: ['a'] },
			heal: { paladin: ['b'] },
			cac: {},
			dist: { hunt: ['c', 'd'] },
		},
		mainMissing: { heal: { paladin: 1 } },
		quotaMissing: {},
		playerMissing: 0,
		bench: ['e'],
		overslot: ['d'],
		rerolls: ['b'],
	})

	expect(
		fill(
			[
				{
					RaidReroll: 1,
					LastRR: '2020-09-01T15:00:00',
					MainBench: 0,
					LastMB: null,
					rank: 'raider',
					pseudo: 'a',
					rerollWanted: true,
					characters: [
						{ status: 'main', pClass: 'war', role: 'tank' },
						{ status: 'mainReroll', pClass: 'drood', role: 'tank' },
						{ status: 'reroll', pClass: 'paladin', role: 'heal' },
					],
				},
				{
					RaidReroll: 1,
					LastRR: '2020-08-01T15:00:00',
					MainBench: 0,
					LastMB: null,
					rank: 'raider',
					pseudo: 'b',
					rerollWanted: true,
					characters: [
						{ status: 'main', pClass: 'drood', role: 'tank' },
						{ status: 'mainReroll', pClass: 'drood', role: 'heal' },
						{ status: 'reroll', pClass: 'paladin', role: 'heal' },
					],
				},
				{
					RaidReroll: 1,
					LastRR: '2020-09-01T15:00:00',
					MainBench: 1,
					LastMB: '2020-09-01T15:00:00',
					rank: 'raider',
					pseudo: 'c',
					rerollWanted: false,
					characters: [{ status: 'main', pClass: 'hunt', role: 'dist' }],
				},
				{
					RaidReroll: 1,
					LastRR: '2020-09-01T15:00:00',
					MainBench: 1,
					LastMB: '2020-08-01T15:00:00',
					rank: 'raider',
					pseudo: 'd',
					rerollWanted: true,
					characters: [{ status: 'main', pClass: 'hunt', role: 'dist' }],
				},
				{
					RaidReroll: 2,
					LastRR: '2020-09-01T15:00:00',
					MainBench: 0,
					LastMB: null,
					rank: 'raider',
					pseudo: 'e',
					rerollWanted: true,
					characters: [{ status: 'main', pClass: 'hunt', role: 'dist' }],
				},
				{
					RaidReroll: 20,
					LastRR: '2020-09-01T15:00:00',
					MainBench: 0,
					LastMB: null,
					rank: 'raider',
					pseudo: 'f',
					rerollWanted: true,
					characters: [{ status: 'main', pClass: 'rogue', role: 'cac' }],
				},
			],
			raidDate,
			1,
			{
				maxPlayer: 4,
				mainRatio: 0.5,
				role: {
					tank: { min: 1, max: 1, pClassMin: { war: 1 } },
					heal: { min: 1, max: 2, pClassMin: { paladin: 1 } },
					cac: { min: 0, max: 1, pClassMin: {} },
					dist: { min: 0, max: 1, pClassMin: {} },
				},
			}
		)
	).toEqual({
		attrib: {
			tank: { war: ['a'] },
			heal: { paladin: ['b'] },
			cac: { rogue: ['f'] },
			dist: { hunt: ['c'] },
		},
		mainMissing: { heal: { paladin: 1 } },
		quotaMissing: {},
		playerMissing: 0,
		bench: ['d', 'e'],
		overslot: [],
		rerolls: ['b'],
	})

	expect(
		fill(
			[
				{
					RaidReroll: 1,
					LastRR: '2020-09-01T15:00:00',
					MainBench: 0,
					LastMB: null,
					rank: 'raider',
					pseudo: 'a',
					rerollWanted: true,
					characters: [
						{ status: 'main', pClass: 'war', role: 'tank' },
						{ status: 'mainReroll', pClass: 'drood', role: 'tank' },
						{ status: 'reroll', pClass: 'paladin', role: 'heal' },
					],
				},
				{
					RaidReroll: 1,
					LastRR: '2020-08-01T15:00:00',
					MainBench: 0,
					LastMB: null,
					rank: 'raider',
					pseudo: 'b',
					rerollWanted: true,
					characters: [
						{ status: 'main', pClass: 'drood', role: 'tank' },
						{ status: 'mainReroll', pClass: 'drood', role: 'heal' },
						{ status: 'reroll', pClass: 'paladin', role: 'heal' },
					],
				},
				{
					RaidReroll: 1,
					LastRR: '2020-09-01T15:00:00',
					MainBench: 1,
					LastMB: '2020-09-01T15:00:00',
					rank: 'raider',
					pseudo: 'c',
					rerollWanted: false,
					characters: [{ status: 'main', pClass: 'hunt', role: 'dist' }],
				},
				{
					RaidReroll: 1,
					LastRR: '2020-09-01T15:00:00',
					MainBench: 1,
					LastMB: '2020-08-01T15:00:00',
					rank: 'raider',
					pseudo: 'd',
					rerollWanted: true,
					characters: [{ status: 'main', pClass: 'hunt', role: 'dist' }],
				},
				{
					RaidReroll: 2,
					LastRR: '2020-09-01T15:00:00',
					MainBench: 0,
					LastMB: null,
					rank: 'raider',
					pseudo: 'e',
					rerollWanted: true,
					characters: [{ status: 'main', pClass: 'hunt', role: 'dist' }],
				},
				{
					RaidReroll: 20,
					LastRR: '2020-09-01T15:00:00',
					MainBench: 0,
					LastMB: null,
					rank: 'raider',
					pseudo: 'f',
					rerollWanted: true,
					characters: [{ status: 'main', pClass: 'rogue', role: 'cac' }],
				},
				{
					RaidReroll: 2,
					LastRR: '2020-08-01T15:00:00',
					MainBench: 0,
					LastMB: null,
					rank: 'raider',
					pseudo: 'g',
					rerollWanted: true,
					characters: [
						{ status: 'main', pClass: 'drood', role: 'tank' },
						{ status: 'mainReroll', pClass: 'drood', role: 'heal' },
						{ status: 'reroll', pClass: 'paladin', role: 'heal' },
					],
				},
			],
			raidDate,
			1,
			{
				maxPlayer: 4,
				mainRatio: 0.5,
				role: {
					tank: { min: 1, max: 1, pClassMin: { war: 1 } },
					heal: { min: 1, max: 2, pClassMin: { paladin: 1 } },
					cac: { min: 0, max: 1, pClassMin: {} },
					dist: { min: 0, max: 1, pClassMin: {} },
				},
			}
		)
	).toEqual({
		attrib: {
			tank: { war: ['a'] },
			heal: { paladin: ['g'] },
			cac: { rogue: ['f'] },
			dist: { hunt: ['c'] },
		},
		mainMissing: { heal: { paladin: 1 } },
		quotaMissing: {},
		playerMissing: 0,
		bench: ['d', 'b', 'e'],
		overslot: [],
		rerolls: ['g'],
	})

	expect(
		fill(
			[
				{
					RaidReroll: 1,
					LastRR: '2020-09-01T15:00:00',
					MainBench: 0,
					LastMB: null,
					rank: 'raider',
					pseudo: 'a',
					rerollWanted: true,
					characters: [
						{ status: 'main', pClass: 'war', role: 'tank' },
						{ status: 'mainReroll', pClass: 'drood', role: 'tank' },
						{ status: 'reroll', pClass: 'paladin', role: 'heal' },
					],
				},
				{
					RaidReroll: 1,
					LastRR: '2020-08-01T15:00:00',
					MainBench: 1,
					LastMB: '2020-08-01T15:00:00',
					rank: 'raider',
					pseudo: 'b',
					rerollWanted: true,
					characters: [
						{ status: 'main', pClass: 'drood', role: 'tank' },
						{ status: 'mainReroll', pClass: 'drood', role: 'heal' },
						{ status: 'reroll', pClass: 'paladin', role: 'heal' },
					],
				},
				{
					RaidReroll: 1,
					LastRR: '2020-09-01T15:00:00',
					MainBench: 1,
					LastMB: '2020-09-01T15:00:00',
					rank: 'raider',
					pseudo: 'c',
					rerollWanted: false,
					characters: [{ status: 'main', pClass: 'hunt', role: 'dist' }],
				},
				{
					RaidReroll: 1,
					LastRR: '2020-09-01T15:00:00',
					MainBench: 1,
					LastMB: '2020-08-01T15:00:00',
					rank: 'raider',
					pseudo: 'd',
					rerollWanted: true,
					characters: [{ status: 'main', pClass: 'hunt', role: 'dist' }],
				},
				{
					RaidReroll: 2,
					LastRR: '2020-09-01T15:00:00',
					MainBench: 0,
					LastMB: null,
					rank: 'raider',
					pseudo: 'e',
					rerollWanted: true,
					characters: [{ status: 'main', pClass: 'hunt', role: 'dist' }],
				},
				{
					RaidReroll: 20,
					LastRR: '2020-09-01T15:00:00',
					MainBench: 0,
					LastMB: null,
					rank: 'raider',
					pseudo: 'f',
					rerollWanted: true,
					characters: [{ status: 'main', pClass: 'rogue', role: 'cac' }],
				},
				{
					RaidReroll: 2,
					LastRR: '2020-08-01T15:00:00',
					MainBench: 0,
					LastMB: null,
					rank: 'raider',
					pseudo: 'g',
					rerollWanted: true,
					characters: [
						{ status: 'main', pClass: 'drood', role: 'tank' },
						{ status: 'mainReroll', pClass: 'drood', role: 'heal' },
						{ status: 'reroll', pClass: 'paladin', role: 'heal' },
					],
				},
			],
			raidDate,
			1,
			{
				maxPlayer: 4,
				mainRatio: 0.5,
				role: {
					tank: { min: 1, max: 1, pClassMin: { war: 1 } },
					heal: { min: 1, max: 2, pClassMin: { paladin: 1 } },
					cac: { min: 0, max: 1, pClassMin: {} },
					dist: { min: 0, max: 1, pClassMin: {} },
				},
			}
		)
	).toEqual({
		attrib: {
			tank: { war: ['a'] },
			heal: { paladin: ['b'] },
			cac: { rogue: ['f'] },
			dist: { hunt: ['c'] },
		},
		mainMissing: { heal: { paladin: 1 } },
		quotaMissing: {},
		playerMissing: 0,
		bench: ['d', 'e', 'g'],
		overslot: [],
		rerolls: ['b'],
	})

	expect(
		fill(
			[
				{
					RaidReroll: 1,
					LastRR: '2020-09-01T15:00:00',
					MainBench: 0,
					LastMB: null,
					rank: 'raider',
					pseudo: 'a',
					rerollWanted: true,
					characters: [
						{ status: 'main', pClass: 'war', role: 'tank' },
						{ status: 'mainReroll', pClass: 'drood', role: 'tank' },
						{ status: 'reroll', pClass: 'paladin', role: 'heal' },
					],
				},
				{
					RaidReroll: 1,
					LastRR: '2020-08-01T15:00:00',
					MainBench: 1,
					LastMB: '2020-08-01T15:00:00',
					rank: 'raider',
					pseudo: 'b',
					rerollWanted: true,
					characters: [
						{ status: 'main', pClass: 'drood', role: 'tank' },
						{ status: 'mainReroll', pClass: 'drood', role: 'heal' },
						{ status: 'reroll', pClass: 'paladin', role: 'heal' },
					],
				},
				{
					RaidReroll: 1,
					LastRR: '2020-09-01T15:00:00',
					MainBench: 1,
					LastMB: '2020-09-01T15:00:00',
					rank: 'raider',
					pseudo: 'c',
					rerollWanted: false,
					characters: [{ status: 'main', pClass: 'hunt', role: 'dist' }],
				},
				{
					RaidReroll: 1,
					LastRR: '2020-09-01T15:00:00',
					MainBench: 1,
					LastMB: '2020-08-01T15:00:00',
					rank: 'raider',
					pseudo: 'd',
					rerollWanted: true,
					characters: [{ status: 'main', pClass: 'hunt', role: 'dist' }],
				},
				{
					RaidReroll: 2,
					LastRR: '2020-09-01T15:00:00',
					MainBench: 0,
					LastMB: null,
					rank: 'raider',
					pseudo: 'e',
					rerollWanted: true,
					characters: [{ status: 'main', pClass: 'hunt', role: 'dist' }],
				},
				{
					RaidReroll: 20,
					LastRR: '2020-09-01T15:00:00',
					MainBench: 0,
					LastMB: null,
					rank: 'raider',
					pseudo: 'f',
					rerollWanted: true,
					characters: [{ status: 'main', pClass: 'rogue', role: 'cac' }],
				},
				{
					RaidReroll: 2,
					LastRR: '2020-08-01T15:00:00',
					MainBench: 1,
					LastMB: '2020-07-01T15:00:00',
					rank: 'raider',
					pseudo: 'g',
					rerollWanted: true,
					characters: [
						{ status: 'main', pClass: 'drood', role: 'tank' },
						{ status: 'mainReroll', pClass: 'drood', role: 'heal' },
						{ status: 'reroll', pClass: 'paladin', role: 'heal' },
					],
				},
			],
			raidDate,
			1,
			{
				maxPlayer: 4,
				mainRatio: 0.5,
				role: {
					tank: { min: 1, max: 1, pClassMin: { war: 1 } },
					heal: { min: 1, max: 2, pClassMin: { paladin: 1 } },
					cac: { min: 0, max: 1, pClassMin: {} },
					dist: { min: 0, max: 1, pClassMin: {} },
				},
			}
		)
	).toEqual({
		attrib: {
			tank: { war: ['a'] },
			heal: { paladin: ['b'] },
			cac: { rogue: ['f'] },
			dist: { hunt: ['c'] },
		},
		mainMissing: { heal: { paladin: 1 } },
		quotaMissing: {},
		playerMissing: 0,
		bench: ['d', 'g', 'e'],
		overslot: [],
		rerolls: ['b'],
	})
})
