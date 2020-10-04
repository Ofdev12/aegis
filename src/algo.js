const raiderFactor = 1000000
const nbFactor = 100
const millisecInWeek = 1000 * 60 * 60 * 24 * 7

const defaultConstraints = {
	maxPlayer: 40,
	mainRatio: 0.5,
	role: {
		tank: { min: 3, max: 5, pClassMin: { war: 3 } },
		heal: { min: 10, max: 12, pClassMin: { paladin: 3, priest: 3, drood: 1 } },
		cac: { min: 8, max: 15, pClassMin: { war: 5, rogue: 3 } },
		dist: { min: 8, max: 15, pClassMin: { hunt: 2, mage: 4, demo: 2 } },
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
	for (const [key, { min, max, pClassMin }] of Object.entries(
		constraints.role
	)) {
		// Compute min constraint for each pClass.
		const mainPClassMin = {}
		for (const [pClassName, pClassConstraint] of Object.entries(pClassMin)) {
			mainPClassMin[pClassName] = pClassConstraint * constraints.mainRatio
		}
		result[key] = {
			min: min * constraints.mainRatio,
			max,
			pClassMin: mainPClassMin,
		}
	}
	return result
}

// Compute the bench weight of each players and return
// an array sorted by ascending bench weight if bench
// is needed or false.
export const getBenchOrdered = (players, date, constraints) =>
	players.length > constraints.maxPlayer &&
	players
		.map((player) => ({
			...player,
			mainBenchWeigth: computeMainBenchWeigth(player, date),
		}))
		.sort((a, b) => a.mainBenchWeigth - b.mainBenchWeigth) // ascending order

// Compute the reroll weight of each players and return
// an array sorted by descending reroll weight. The
// non-reroll players are placed at the beginning.
export const getRerollOrdered = (players, date) => {
	const rerollWeighted = players.map((player) => ({
		...player,
		rerollWeight: computeRerollWeight(player, date),
	}))
	return [
		...rerollWeighted.filter(({ rerollWeight }) => rerollWeight === null),
		...rerollWeighted
			.filter(({ rerollWeight }) => rerollWeight !== null)
			.sort((a, b) => b.rerollWeight - a.rerollWeight), // descending order
	]
}

// Get the main character of a player.
export const getMain = ({ characters }) =>
	characters.filter(({ status }) => status === 'main')[0]

// Find players' mainCharacter to fit the roles.
// The flag IsSelected is set on selected players.
export const fillPClassMainRatio = (players, roles) => {
	const result = { tank: {}, heal: {}, cac: {}, dist: {} }
	for (const player of players) {
		const { pClass, role } = getMain(player)
		// Get role and pClass min constraint
		const pClassMin = roles[role] !== undefined && roles[role].pClassMin[pClass]
		if (pClassMin) {
			// Add pClass to role object if needed.
			if (!result[role][pClass]) result[role][pClass] = []
			if (result[role][pClass].length < pClassMin) {
				// Add player to result
				result[role][pClass].push(player.pseudo)
				player.IsSelected = true
			}
		}
	}
	return result
}

// Compare the number of players in the result to the expected Pclass population.
export const analyseMissingPClass = (res, roles) => {
	const missingPlayers = {}
	for (const [role, { pClassMin }] of Object.entries(roles)) {
		for (const [pClass, min] of Object.entries(pClassMin)) {
			const nbPClassPlayers = res[role][pClass] ? res[role][pClass].length : 0
			if (nbPClassPlayers < min) {
				if (!missingPlayers[role]) missingPlayers[role] = {}
				missingPlayers[role] = {
					...missingPlayers[role],
					[pClass]: Math.ceil(min - nbPClassPlayers),
				}
			}
		}
	}
	return missingPlayers
}

// Tests if an object or an array is empty
export const isEmpty = (obj) => Object.keys(obj).length === 0

// Tests if the Class Quota is not fulfielled.
export const isInClassQuotas = ({ role, pClass }, report) =>
	Boolean(report[role] && report[role][pClass])

// Gets the number of slot available for a specific role without specific class.
export const getRoleOpenedMinQuota = (role, constraints) => {
	const rc = constraints.role[role]
	const fixedQuota = Object.values(rc.pClassMin).reduce(
		(acc, val) => acc + val,
		0
	)
	return rc.min - fixedQuota
}

// Get the number of players attributed to an open slot for a given role.
export const getRoleOpenedAttributed = (role, constraints, attrib) => {
	if (!attrib[role]) return 0
	const rc = constraints.role[role]
	return Object.entries(attrib[role]).reduce((acc, [pClass, val]) => {
		const pClassMin = rc.pClassMin[pClass] || 0
		return acc + Math.max(0, val.length - pClassMin)
	}, 0)
}

// Tests if the open min quota is fulfielled.
export const isInOpenMinQuota = ({ role }, constraints, attrib) => {
	const openedMin = getRoleOpenedMinQuota(role, constraints)
	if (!openedMin) return false
	const openAttributed = getRoleOpenedAttributed(role, constraints, attrib)
	return openAttributed < openedMin
}
