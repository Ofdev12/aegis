const express = require('express')
const fetch = require('node-fetch')
const { catchAsync } = require('./utils')

const router = express.Router()

const CLIENT_ID = process.env.CLIENT_DISCORD_ID
const CLIENT_SECRET = process.env.CLIENT_DISCORD_SECRET
const redirect = encodeURIComponent(
	'http://localhost:50451/api/discord/callback'
)

router.get('/login', (req, res) => {
	res.redirect(
		`https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${redirect}&response_type=code&scope=identify%20email`
	)
})

router.get(
	'/callback',
	catchAsync(async (req, res) => {
		const code = req.query.code

		const data = {
			client_id: CLIENT_ID,
			client_secret: CLIENT_SECRET,
			grant_type: 'authorization_code',
			redirect_uri: 'http://localhost:50451/api/discord/callback',
			code: code,
			scope: 'identify',
		}

		const getTokken = await fetch('https://discordapp.com/api/oauth2/token', {
			method: 'POST',
			body: new URLSearchParams(data),
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
		})
		const jsonTokken = await getTokken.json()

		const userInfo = await fetch('https://discordapp.com/api/users/@me', {
			headers: {
				authorization: `${jsonTokken.token_type} ${jsonTokken.access_token}`,
			},
		})
		const jsonUser = await userInfo.json()
		console.log(jsonTokken)
		res.redirect(
			`/?token=${jsonTokken.access_token}&username=${jsonUser.username}`
		)
	})
)

module.exports = router
