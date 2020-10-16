// Resolve the references of a firebase request
// res: Any | value to analyse
// maxDepth: Number | Depth of the reference to solve, default is resolve all.
export const resolve = async (res, maxDepth = -1) => {
	if (res === null || res === undefined) return
	const resType = typeof res
	// Simple value
	if (resType !== 'object') {
		return res
	}

	//Array
	if (Array.isArray(res)) {
		return Promise.all(
			res.map(async (value) => {
				return resolve(value, maxDepth)
			})
		)
	}

	// Object or Reference
	const hasData = res.data && typeof res.data === 'function'
	const canGet = res.get && typeof res.get === 'function'
	// Reference
	if (!hasData && canGet) {
		if (maxDepth === 0) return res
		const ref = await res.get()
		return resolve(ref.data(), maxDepth - 1)
	}

	// Simple object
	const analysedObject = Object.entries(hasData ? res.data() : res).map(
		async ([key, value]) => {
			const val = await resolve(value, maxDepth)
			return { key, value: val }
		}
	)
	return Promise.all(analysedObject).then(function (arr) {
		const obj = {}
		arr.forEach(({ key, value }) => {
			obj[key] = value
		})
		return obj
	})
}
