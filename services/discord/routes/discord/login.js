const express = require('express')
const router = express.Router()
const auth = require('../../auth')

const CLIENT_ID = ''
const redirect = encodeURIComponent('http://localhost:3000/')

router.post('/', async (req, res) => {
	if (req.body && req.body.token_type && req.body.access_token) {
		res.send(await auth.getInfosUserDiscord(req.body))
	}
})

router.post('/token', async (req, res) => {
	res.send(await auth.connectFromCode(req.body))
})

router.post('/redirect', async (req, res) => {
	res.redirect(
		`https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${redirect}&response_type=code&scope=identify%20email%20guilds`
	)
})

module.exports = router
