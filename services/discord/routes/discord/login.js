const express = require('express')
const router = express.Router()
const auth = require('../../auth')

router.post('/', async (req, res) => {
	if (req.body && req.body.token_type && req.body.access_token) {
		res.send(await auth.getInfosUserDiscord(req.body))
	}
})

router.post('/token', async (req, res) => {
	res.send(await auth.connectFromCode(req.body))
})

module.exports = router
