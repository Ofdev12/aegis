const raiderFactor = 1000000
const nbFactor = 100
const millisecInWeek = 1000 * 60 * 60 * 24 * 7

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

// Compute the Number of weeks since the given date.
const getNbWeek = (start, end) =>
	Math.floor((new Date(end) - new Date(start)) / millisecInWeek)

// Compute common calculation for bench and reroll weights.
const computeBaseWeight = (nb, lastDate, raidDate) =>
	nb ? nb * nbFactor - getNbWeek(lastDate, raidDate) : 0

// Compute the priority for benching Main. The highest shouldn't be benched.
export const computeMainBenchWeigth = (
	{ MainBench, LastMB, rank },
	raidDate
) => {
	const benchBonus = computeBaseWeight(MainBench, LastMB, raidDate)
	const raiderBonus = rank === 'raider' ? raiderFactor : 0
	return benchBonus + raiderBonus
}

// Compute the Reroll priority. The lowest should be rerolling.
export const computeRerollWeight = (
	{ RaidReroll, LastRR, rerollWanted, characters },
	raidDate
) => {
	return rerollWanted && characters.length > 1
		? computeBaseWeight(RaidReroll, LastRR, raidDate)
		: null
}
// Compute the priority for benching Reroll. The highest shouldn't be benched.
export const computeRerollBenchWeight = ({ RerollBench, LastRB }, raidDate) => {
	return computeBaseWeight(RerollBench, LastRB, raidDate)
}

// Merge src2 into src1.
export const deepMerge = (src1, src2) => {
	if (src2 === undefined) return src1
	// Should we deep copy src1 ?
	if (Array.isArray(src1)) {
		if (src1.length >= src2.length) {
			return src1.map((val, i) => deepMerge(val, src2[i]))
		}
		// Handle the potential new keys.
		return src2.map((val, i) => deepMerge(src1[i], val))
	}
	if (typeof src1 === 'object') {
		// Initialize result with src2 to handle potential new keys.
		let result = src2 ? { ...src2 } : {}
		// Merge the 2 objects
		for (const [key, value] of Object.entries(src1)) {
			result = { ...result, [key]: deepMerge(value, src2[key]) }
		}
		return result
	}
	return src2 || src1
}

// Merge customConstraints with defaultConstraints.
const computeCustomConstraints = (customConstraints) =>
	deepMerge(defaultConstraints, customConstraints)

// Apply mainRatio to a given constraint.
export const computeMainConstraint = (constraints) => {
	const result = {}
	for (const [key, { min, max, classMin }] of Object.entries(
		constraints.role
	)) {
		// Compute min constraint for each class.
		const mainClassMin = {}
		for (const [className, classConstraint] of Object.entries(classMin)) {
			mainClassMin[className] = classConstraint * constraints.mainRatio
		}
		result[key] = {
			min: min * constraints.mainRatio,
			max,
			classMin: mainClassMin,
		}
	}
	return result
}
