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
		dist: { min: 8, max: 15, pClassMin: { hunt: 2, mage: 4, warlock: 2 } },
	},
}

//////////////////////
//  Compute weigth  //
//////////////////////

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

///////////////////////////
//  Compute constraints  //
///////////////////////////

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

//////////////////////////
//  Manipulate objects  //
//////////////////////////
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
// Deep copy an array or an object (functions aren't handled)
export const deepCopy = (target) => {
	if (target === null) return null
	if (Array.isArray(target)) {
		return target.map(deepCopy)
	}
	if (typeof target === 'object') {
		const res = {}
		for (const [key, value] of Object.entries(target)) {
			res[key] = deepCopy(value)
		}
		return res
	}
	return target
}
// Tests if an object or an array is empty
export const isEmpty = (obj) =>
	obj === null || obj === undefined ? true : Object.keys(obj).length === 0

/////////////////////
//  Order players  //
/////////////////////

// Compute the bench weight of each players and return
// an array sorted by ascending bench weight if bench
// is needed or false.
export const getMainBenchOrdered = (players, date, constraints) => {
	if (players.length <= constraints.maxPlayer) return false
	for (const player of players) {
		player.mainBenchWeigth = computeMainBenchWeigth(player, date)
	}
	players.sort((a, b) => a.mainBenchWeigth - b.mainBenchWeigth) // ascending order
	return players
}
// Compute the reroll weight of each players and return
// an array sorted by descending reroll weight. The
// non-reroll players are placed at the beginning.
export const getRerollOrdered = (players, date) => {
	for (const player of players) {
		player.rerollWeight = computeRerollWeight(player, date)
	}
	return [
		...players.filter(({ rerollWeight }) => rerollWeight === null),
		...players
			.filter(({ rerollWeight }) => rerollWeight !== null)
			.sort((a, b) => b.rerollWeight - a.rerollWeight), // descending order
	]
}

/////////////////////////////
//  Get player characters  //
/////////////////////////////

// Get the main character of a player.
export const getMain = ({ characters }) =>
	characters.filter(({ status }) => status === 'main')[0]
// Find a character matching the description (role & pClass)
export const findCharacter = (r, pC, characters) =>
	pC === 'openSlot'
		? characters.find(({ role }) => role === r)
		: characters.find(({ role, pClass }) => role === r && pClass === pC)
// Get only main reroll.
const getMainReroll = (characters) =>
	characters.filter(({ status }) => status === 'mainReroll')
// Get all the rerolls of an user
const getAllRerolls = (characters) =>
	characters.filter(({ status }) => status !== 'main')
// Get the rerolls of a player
const getPlayerRerolls = (player, onlyMainReroll) =>
	onlyMainReroll
		? getMainReroll(player.characters)
		: getAllRerolls(player.characters)

//////////////////////
//  Analyse attribs  //
//////////////////////
// Compare the number of players in the result to the expected Pclass population.
export const analyseMissingMin = (res, roles) => {
	const missingPlayers = {}
	for (const [role, roleConstraints] of Object.entries(roles)) {
		// Check for each class.
		for (const [pClass, min] of Object.entries(roleConstraints.pClassMin)) {
			const nbPClassPlayers = res[role][pClass] ? res[role][pClass].length : 0
			if (nbPClassPlayers < min) {
				if (!missingPlayers[role]) missingPlayers[role] = {}
				missingPlayers[role] = {
					...missingPlayers[role],
					[pClass]: Math.ceil(min - nbPClassPlayers),
				}
			}
		}
		// Check for the open slots.
		if (roleConstraints.min) {
			const minOpenSlot = getRoleOpenedMinQuota(roleConstraints)
			if (minOpenSlot) {
				const attributedOpenSlots = getRoleOpenedAttributed(
					role,
					roleConstraints,
					res
				)
				if (minOpenSlot > attributedOpenSlots)
					missingPlayers[role] = {
						...missingPlayers[role],
						openSlot: minOpenSlot - attributedOpenSlots,
					}
			}
		}
	}
	return missingPlayers
}
// Get the number of attributed slots.
export const getNbAttributedSlots = (attrib) =>
	Object.values(attrib).reduce(
		(acc, role) =>
			acc + Object.values(role).reduce((acc2, val) => acc2 + val.length, 0),
		0
	)
// Get the number of players of a given role in an attribution
export const getNbAttributtedRole = (attrib, role) =>
	Object.values(attrib[role]).reduce((acc, val) => acc + val.length, 0)
// Get the number of players of a given role and pClass in an attribution
export const getNbAttributtedPClass = (attrib, role, pClass) =>
	attrib[role][pClass] ? attrib[role][pClass].length : 0

//////////////////////
//  Analyse quotas  //
//////////////////////
// Gets the number of slot available for a specific role without specific role.
export const getRoleOpenedMinQuota = (roleConstraints) => {
	if (!roleConstraints.min) return 0
	const fixedQuota = roleConstraints.pClassMin
		? Object.values(roleConstraints.pClassMin).reduce(
				(acc, val) => acc + val,
				0
		  )
		: 0
	return roleConstraints.min - fixedQuota
}
// Get the number of players attributed to an open slot for a given role.
export const getRoleOpenedAttributed = (role, roleConstraints, attrib) => {
	if (!attrib[role]) return 0
	return Object.entries(attrib[role]).reduce((acc, [pClass, val]) => {
		const pClassMin =
			roleConstraints.pClassMin && roleConstraints.pClassMin[pClass]
				? roleConstraints.pClassMin[pClass]
				: 0
		return acc + Math.max(0, val.length - pClassMin)
	}, 0)
}
// Tests if the Class Quota is not fulfielled.
export const isInClassQuotas = ({ role, pClass }, report) =>
	Boolean(report[role] && report[role][pClass])
// Tests if the open min quota is fulfielled.
export const isInOpenMinQuota = (role, roleConstraints, attrib) => {
	const openedMin = getRoleOpenedMinQuota(roleConstraints)
	if (!openedMin) return false
	const openAttributed = getRoleOpenedAttributed(role, roleConstraints, attrib)
	return openAttributed < openedMin
}
// Get the number of OpenSlots.
export const getMaxOpenSlots = (roleConstraints) => {
	if (!roleConstraints.max) return 0
	const fixedQuota = roleConstraints.pClassMin
		? Object.values(roleConstraints.pClassMin).reduce(
				(acc, val) => acc + val,
				0
		  )
		: 0
	return roleConstraints.max - fixedQuota
}
// Check if the character can be added. Returns 'pClassMin' if it fits the MinQuotas,
// 'openSlot' if it fits the Open Quotas, or false.
export const isRespectingMax = ({ pClass, role }, constraints, attrib) => {
	const nbAttributedSlots = getNbAttributedSlots(attrib)
	if (nbAttributedSlots >= constraints.maxPlayer) return false
	// Check if the character fits the minQuotas
	const roleConstraints = constraints.role[role]
	const pClassMin = roleConstraints.pClassMin[pClass]
	if (pClassMin) {
		const pClassAttrib = attrib[role] && attrib[role][pClass]
		if (!pClassAttrib) return 'pClassMin'
		if (pClassAttrib.length < pClassMin) return 'pClassMin'
	}
	// Check if the character fits the openSlots
	const openSlotsAttributed = getRoleOpenedAttributed(
		role,
		roleConstraints,
		attrib
	)
	const maxOpenSlot = getMaxOpenSlots(roleConstraints)
	return openSlotsAttributed < maxOpenSlot ? 'openSlot' : false
}

/////////////////////////////
//  Analyse player attrib  //
/////////////////////////////
// Find the role and the pClass assigned to a player in a given attribution
export const findPlayerAttrib = (pseudo, attrib) => {
	if (!pseudo || !attrib) return
	for (const [role, val] of Object.entries(attrib)) {
		for (const [pClass, pseudos] of Object.entries(val)) {
			if (pseudos.find((p) => p === pseudo)) return { role, pClass }
		}
	}
}
// Return true if the character match the description
const fitDescription = (char, role, pClass) =>
	role === char.role &&
	(pClass === 'openSlot' ? char.isOpenSlot : char.role === missingRole)

////////////////////////////////
//  Manipulate player attrib  //
////////////////////////////////

// Remove a player from an attribution
const removeFromAttrib = (player, attrib, role, pClass) =>
	(attrib[role][pClass] = attrib[role][pClass].filter(
		(p) => p !== player.pseudo
	))
// Add a player to an attribution
const addToAttrib = (player, attrib, role, pClass) => {
	if (!attrib[role][pClass]) attrib[role][pClass] = []
	attrib[role][pClass].push(player.pseudo)
}
// Add an attribution to another
export const addAttribs = (attr1, attr2) => {
	const result = { tank: {}, heal: {}, cac: {}, dist: {} }
	for (const [role, roleDetail] of Object.entries(attr1)) {
		for (const [pClass, players] of Object.entries(roleDetail)) {
			result[role][pClass] = [...players, ...(attr2[role][pClass] || [])]
		}
		for (const [pClass, players] of Object.entries(attr2[role])) {
			if (!result[role][pClass]) result[role][pClass] = [...players]
		}
	}
	return result
}

//////////////////////
//  Filter players  //
//////////////////////

// Get the selected players
const getAttributed = (players) =>
	players.filter(({ isSelected }) => isSelected)
// The non selected players
const getNonAttributed = (players) =>
	players.filter(({ isSelected }) => !isSelected)
// Get the array of benched players.
const getBench = (players) => players.filter(({ isBenched }) => isBenched)
// Get the array of non benched players.
const getNonBench = (players) => players.filter(({ isBenched }) => !isBenched)
// Get the array of benched and selected players
const getBenchSelected = (players) =>
	players.filter(({ isBenched, isSelected }) => isBenched && isSelected)
// Get the array of non benched nor selected players
const getAvaillable = (players) =>
	players.filter(({ isBenched, isSelected }) => !isBenched && !isSelected)
// Map an array of objects and keep only the pseudo value
const keepPseudoOnly = (players) => players.map(({ pseudo }) => pseudo)

///////////////////
//  Fill logics  //
///////////////////

// Find players' mainCharacter to fit the roles.
// The flag isSelected is set on selected players.
export const fillPClassMainRatio = (players, roles, init) => {
	const result = init || { tank: {}, heal: {}, cac: {}, dist: {} }
	for (const player of players) {
		const { pClass, role } = getMain(player)
		// Get role and pClass min constraint
		const pClassMin =
			roles[role] !== undefined &&
			roles[role].pClassMin !== undefined &&
			roles[role].pClassMin[pClass]
		// If the class is in quotas
		if (pClassMin) {
			if (!result[role][pClass]) result[role][pClass] = []
			//If the quota isn't fulfielled
			if (result[role][pClass].length < pClassMin) {
				addToAttrib(player, result, role, pClass)
				player.isSelected = true
				// If the pClass quota is fulfielled but not the openSlot one.
			} else if (isInOpenMinQuota(role, roles[role], result)) {
				addToAttrib(player, result, role, pClass)
				player.isSelected = true
				player.isOpenSlot = true
			}
			//If the class isn't in quota and the openSlot quota isn't fulfielled.
		} else if (roles[role] && isInOpenMinQuota(role, roles[role], result)) {
			addToAttrib(player, result, role, pClass)
			player.isSelected = true
			player.isOpenSlot = true
		}
	}
	return result
}
// Try to find a reroll of the player to replace the selected reroller
const findAnotherReroll = (player, context) => {
	let {
		missingRole,
		missingPClass,
		missingCharacters,
		onlyMainReroll,
		rerollerRole,
		rerollerPClass,
		rerollAttrib,
	} = context

	// Find a reroll to replace the current reroller.
	const replacementReroll = findCharacter(
		rerollerRole,
		rerollerPClass,
		getPlayerRerolls(player, onlyMainReroll)
	)
	if (!replacementReroll) return

	// Add the new player to selection
	addToAttrib(player, rerollAttrib, rerollerRole, replacementReroll.pClass)
	player.isSelected = true
	player.isReroll = true
	player.isOpenSlot = missingPClass === 'openSlot'

	// Update context
	missingCharacters[missingRole][missingPClass]--
	return true
}
// Try to find another reroll of the reroller to match another quota
// And replace the current by a reroll of another player.
const findGoodReroll = (rerolls, context) => {
	let {
		potentialRerolls,
		missingRole,
		missingPClass,
		rerollerRole,
		rerollerPClass,
		rerollAttrib,
		reroller,
	} = context
	// Look for another reroll to fulfiel another quota.
	if (rerolls.length === 1) return
	const goodReroll = findCharacter(
		missingRole,
		missingPClass,
		rerolls.filter(
			({ role, pClass }) =>
				!(role === rerollerRole && pClass === rerollerPClass)
		)
	)
	if (!goodReroll) return // No other match.

	// Try to find a reroll of another player to replace the selected one
	const availableReroller = getNonAttributed(potentialRerolls)
	for (let i = availableReroller.length - 1; i >= 0; i--) {
		const success = findAnotherReroll(availableReroller[i], context)
		if (success) {
			// Update reroller attribution (replace previous attrib with goodReroll)
			rerollAttrib[rerollerRole][rerollerPClass] = removeFromAttrib(
				reroller,
				rerollAttrib,
				rerollerRole,
				rerollerPClass
			)
			addToAttrib(reroller, rerollAttrib, goodReroll.role, goodReroll.pClass)
			return true
		}
	}
}
// Try to change current rerollers attributions to add more rerolls.
const changeRerolls = (context) => {
	let { potentialRerolls, missingPClass, nbMissing, rerollAttrib } = context
	if (!nbMissing) return
	const selectedRerollers = getAttributed(potentialRerolls)
	// For each current rerolling players:
	for (const reroller of selectedRerollers) {
		const { role: rerollerRole, pClass: rerollerPClass } = findPlayerAttrib(
			reroller.pseudo,
			rerollAttrib
		)
		// Check if the reroll is already part of the unfulfielled quota
		const alreadyInQuota = fitDescription(reroller, rerollerRole, missingPClass)
		if (!alreadyInQuota) {
			// if not, try to change his attribution
			const rerolls = getPlayerRerolls(reroller)
			context = {
				...context,
				reroller,
				rerollerRole,
				rerollerPClass,
			}
			const success = findGoodReroll(rerolls, context)
			if (success) return true
		}
	}
}
export const fillMissingMainWithRerolls = (...props) => {
	const [potentialRerolls, reportMainAttrib, nbReroll, onlyMainReroll] = props
	if (isEmpty(reportMainAttrib)) return false
	let nbRerollSelected = 0
	let missingRoleTotal = 0
	let rerollAttrib = { tank: {}, heal: {}, cac: {}, dist: {} }
	let missingCharacters = deepCopy(reportMainAttrib)
	// Looking for reroll as long as needed (but not more than the limit)

	// Try to find a reroll for each entrance of the report.
	for (const [missingRole, val] of Object.entries(reportMainAttrib)) {
		for (const [missingPClass, nbMissing] of Object.entries(val)) {
			missingRoleTotal += nbMissing
			let attributedReroll = 0
			let rerollFound = true
			// Try to find the good number of reroll.
			while (
				rerollFound &&
				attributedReroll < nbMissing &&
				nbRerollSelected < nbReroll
			) {
				rerollFound = false
				const usableRerolls = getNonAttributed(potentialRerolls)
				for (
					let rerollIndex = usableRerolls.length - 1;
					rerollIndex >= 0;
					rerollIndex--
				) {
					const candidate = usableRerolls[rerollIndex]
					const rerolls = getPlayerRerolls(candidate, onlyMainReroll)
					const goodReroll = findCharacter(missingRole, missingPClass, rerolls)
					if (goodReroll) {
						addToAttrib(candidate, rerollAttrib, missingRole, goodReroll.pClass)
						candidate.isSelected = true
						candidate.isReroll = true
						candidate.isOpenSlot = missingPClass === 'openSlot'
						attributedReroll++
						nbRerollSelected++
						rerollFound = true
						missingCharacters[missingRole][missingPClass]--
						break
					}
				}
			}
		}
	}
	// Check if the quota are respected
	if (
		nbRerollSelected &&
		nbRerollSelected < nbReroll &&
		missingRoleTotal > nbRerollSelected
	) {
		// Try to change attributted rerolls
		let hasChanged = false
		do {
			hasChanged = false
			for (const [missingRole, val] of Object.entries(missingCharacters)) {
				for (const [missingPClass, nbMissing] of Object.entries(val)) {
					let context = {
						potentialRerolls,
						missingPClass,
						missingRole,
						nbMissing,
						nbRerollSelected,
						onlyMainReroll,
						rerollAttrib,
						missingCharacters,
					}
					hasChanged = changeRerolls(context)
					if (hasChanged) {
						nbRerollSelected++
						break
					}
				}
				if (hasChanged) {
					break
				}
			}
		} while (
			hasChanged &&
			nbRerollSelected < nbReroll &&
			nbRerollSelected < missingRoleTotal
		)
	}
	return { rerollAttrib, nbRerollSelected }
}
// Return the reroll Attribution that fulfiels the constraints
export const fillRerolls = (
	potentialRerolls,
	constraints,
	nbReroll,
	attrib,
	reportMainAttrib
) => {
	// Check if the main quotas are completed
	let { nbRerollSelected, rerollAttrib } = fillMissingMainWithRerolls(
		potentialRerolls,
		reportMainAttrib,
		nbReroll,
		constraints.onlyMainReroll
	) || {
		nbRerollSelected: 0,
		rerollAttrib: { tank: {}, heal: {}, cac: {}, dist: {} },
	}
	const availableRerollers = getNonAttributed(potentialRerolls)

	let rerollIndex = availableRerollers.length - 1
	// Try to add new rerolls (respecting the reroll limitation)
	while (nbRerollSelected < nbReroll && rerollIndex >= 0) {
		const player = availableRerollers[rerollIndex]
		// Chose eligible rerolls
		const rerolls = getPlayerRerolls(player, constraints.onlyMainReroll)

		const currentAttrib = addAttribs(attrib, rerollAttrib)
		// Find a character which respects Max quotas
		for (const reroll of rerolls) {
			const maxRespected = isRespectingMax(reroll, constraints, currentAttrib)
			if (maxRespected) {
				const { role, pClass } = reroll
				addToAttrib(player, rerollAttrib, role, pClass)
				nbRerollSelected++
				player.isSelected = true
				player.isReroll = true
				break
			}
		}
		rerollIndex--
	}

	// Check if the max number of reroll is reached
	if (nbRerollSelected === nbReroll) return rerollAttrib

	// Define the missing roles
	const missingMax = {}
	let missingRoleTotal = 0
	for (const [role, { max }] of Object.entries(constraints.role)) {
		const nbPlayer = getNbAttributtedRole(attrib, role)
		const missingPlayers = max - nbPlayer
		if (missingPlayers) missingMax[role] = { openSlot: max - nbPlayer }
		missingRoleTotal += missingPlayers
	}
	// Try to change reroll attributions to reach the quota

	if (
		nbRerollSelected &&
		nbRerollSelected < nbReroll &&
		nbRerollSelected < missingRoleTotal
	) {
		// Try to change attributted rerolls
		let hasChanged = false
		do {
			hasChanged = false
			for (const [missingRole, val] of Object.entries(missingMax)) {
				for (const [missingPClass, nbMissing] of Object.entries(val)) {
					let context = {
						potentialRerolls,
						missingPClass,
						missingRole,
						nbMissing,
						nbRerollSelected,
						onlyMainReroll: constraints.onlyMainReroll,
						rerollAttrib,
						missingCharacters: missingMax,
					}
					hasChanged = changeRerolls(context)
					if (hasChanged) {
						nbRerollSelected++
						break
					}
				}
				if (hasChanged) {
					break
				}
			}
		} while (
			hasChanged &&
			nbRerollSelected < nbReroll &&
			nbRerollSelected < missingRoleTotal
		)
	}

	return rerollAttrib
}
// Fill the attrib with reaining players, trying to respect the max attribution per role
// players should be ordered by benchWeight
export const completeFillWithMain = (players, constraints, attrib) => {
	const availlablePlayers = getAvaillable(players)
	const bench = getBench(players)
	let nbAttributedSlots = getNbAttributedSlots(attrib)
	const fillAttrib = { tank: {}, heal: {}, cac: {}, dist: {} }
	// Try to fill the quotas with main characters
	for (const player of availlablePlayers) {
		if (nbAttributedSlots >= constraints.maxPlayer) break
		const main = getMain(player)
		const fullAttrib = addAttribs(attrib, fillAttrib)
		const slotAvaillable = isRespectingMax(main, constraints, fullAttrib)
		if (slotAvaillable) {
			addToAttrib(player, fillAttrib, main.role, main.pClass)
			player.isSelected = true
			player.isOpenSlot = slotAvaillable === 'openSlot'
			nbAttributedSlots++
		}
	}
	// Try to fill and respect Max with bench
	let nonAttributedPlayers = getAvaillable(players)
	if (nbAttributedSlots === constraints.maxPlayer) return { fillAttrib }

	for (const benchedPlayer of bench) {
		if (nbAttributedSlots >= constraints.maxPlayer) break
		const main = getMain(benchedPlayer)
		const fullAttrib = addAttribs(attrib, fillAttrib)
		const slotAvaillable = isRespectingMax(main, constraints, fullAttrib)
		if (slotAvaillable) {
			addToAttrib(benchedPlayer, fillAttrib, main.role, main.pClass)
			benchedPlayer.isSelected = true
			benchedPlayer.isOpenSlot = slotAvaillable === 'openSlot'
			benchedPlayer.isBenched = false
			// Bench another player
			const newBenchedPlayer = nonAttributedPlayers[0]
			nonAttributedPlayers = nonAttributedPlayers.slice(1)
			newBenchedPlayer.isBenched = true
			nbAttributedSlots++
		}
	}
	if (nbAttributedSlots === constraints.maxPlayer) return { fillAttrib }

	// Fill with remaining players (overslot)
	for (const overslotPlayers of nonAttributedPlayers) {
		if (nbAttributedSlots >= constraints.maxPlayer) break
		const main = getMain(overslotPlayers)
		addToAttrib(overslotPlayers, fillAttrib, main.role, main.pClass)
		overslotPlayers.isSelected = true
		overslotPlayers.isOverSlot = true
		nbAttributedSlots++
	}
	return { fillAttrib, overslot: nonAttributedPlayers }
}
// Fill a team with given players and constraints.
export const fill = (players, date, nbReroll, constraints) => {
	//Get raid properties
	const mainRoles = computeMainConstraint(constraints)

	// Bench
	const benchSize =
		players.length > constraints.maxPlayer
			? players.length - constraints.maxPlayer
			: 0

	let baseSelection, rerollOrdered, mainPClassAttrib, mainPClassReport

	if (benchSize) {
		const benchOrdered = getMainBenchOrdered(players, date, constraints)
		// Remove the bench from the team
		baseSelection = benchOrdered.slice(-constraints.maxPlayer)
		for (const player of benchOrdered.slice(0, benchSize)) {
			player.isBenched = true
		}
	} else baseSelection = players

	// Try to fill MainQuotas using based on rerollin priority
	rerollOrdered = getRerollOrdered(baseSelection, date, constraints.maxPlayer)
	mainPClassAttrib = fillPClassMainRatio(rerollOrdered, mainRoles)
	mainPClassReport = analyseMissingMin(mainPClassAttrib, mainRoles)
	// If MainQuotas aren't fulfilled, try to add benched players
	if (!isEmpty(mainPClassReport) && benchSize) {
		mainPClassAttrib = fillPClassMainRatio(
			getBench(players),
			mainRoles,
			mainPClassAttrib
		)
		const unbenched = players.filter(
			({ isSelected, isBenched }) => isSelected && isBenched
		)
		const nbUnbenched = unbenched.length
		if (nbUnbenched) {
			// Select new bench.
			const newBench = baseSelection
				.filter(({ isSelected }) => !isSelected)
				.slice(0, nbUnbenched)
			// Add unbenched players to baseSelection.
			// Unbench unbenched players
			for (const player of unbenched) {
				player.isBenched = false
			}
			// Add new benched players to bench.
			for (const player of newBench) {
				player.isBenched = true
			}
			// Remove new benched players from baseSelection.
			baseSelection = getNonBench(players)
			// Update report
			mainPClassReport = analyseMissingMin(mainPClassAttrib, mainRoles)
		}
	}

	// Choose Reroll
	const potentialRerolls = getNonAttributed(
		players.sort((a, b) => b.rerollWeight - a.rerollWeight)
	)
	const rerollAttrib = fillRerolls(
		potentialRerolls,
		constraints,
		nbReroll,
		mainPClassAttrib,
		mainPClassReport
	)
	// Check if some selected rerolls were benched
	const rerollFromBench = getBenchSelected(potentialRerolls)
	const nbRerollFromBench = rerollFromBench.length
	if (nbRerollFromBench) {
		// unbench players
		for (const player of rerollFromBench) {
			player.isBenched = false
		}
		// select new bench
		const newBench = baseSelection
			.filter(({ isSelected }) => !isSelected)
			.slice(0, nbRerollFromBench)
		for (const player of newBench) {
			player.isBenched = true
		}
	}

	let fullAttrib = addAttribs(mainPClassAttrib, rerollAttrib)

	const { fillAttrib, overslot } = completeFillWithMain(
		players.sort((a, b) => b.mainBenchWeigth - a.mainBenchWeigth),
		constraints,
		fullAttrib
	)

	fullAttrib = addAttribs(fullAttrib, fillAttrib)
	const globalReport = analyseMissingMin(fullAttrib, constraints.role)

	const formattedResult = {
		attrib: fullAttrib,
		mainMissing: mainPClassReport,
		quotaMissing: globalReport,
		playerMissing: constraints.maxPlayer - getNbAttributedSlots(fullAttrib),
		bench: keepPseudoOnly(getBench(players)),
		overslot: overslot ? keepPseudoOnly(overslot) : [],
		rerolls: keepPseudoOnly(players.filter(({ isReroll }) => isReroll)),
	}
	return formattedResult
}
