const express = require('express')
const router = express.Router()
const manageReactions = require('../../client.js')

router.post('/', async (req, res, next) => {
	try {
		const reactions = await manageReactions(req.body)
		return res.send(reactions)
	} catch (err) {
		console.error(err)
		res.status(err.httpStatus).send(err)
	}
})

module.exports = router
