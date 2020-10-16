const CLIENT_ID = '760909520884596776'
const CLIENT_SECRET = 'jKa5QL_9LvwrdpAjDoNUKrikSlDBNM3e'

export const connectFromCode = async ({ code }) => {
	const token = await getTokkenDiscord(code)
	const userInfos = await getInfosUserDiscord(token)
	return { userInfos, token }
}

const getTokkenDiscord = async (code) => {
	const params = {
		client_id: CLIENT_ID,
		client_secret: CLIENT_SECRET,
		grant_type: 'authorization_code',
		redirect_uri: 'http://localhost:3000/',
		code: code,
		scope: ['identify', 'email', 'guilds'],
	}

	const getTokken = await fetch('https://discordapp.com/api/oauth2/token', {
		method: 'POST',
		body: new URLSearchParams(params),
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
	})
	return getTokken.json()
}

export const getInfosUserDiscord = async (token) => {
	const userInfo = await fetch('https://discordapp.com/api/users/@me', {
		headers: {
			authorization: `${token.token_type} ${token.access_token}`,
		},
	})
	const userGuildsInfo = await fetch(
		'https://discordapp.com/api/users/@me/guilds',
		{
			headers: {
				authorization: `${token.token_type} ${token.access_token}`,
			},
		}
	)
	const jsonUser = await userInfo.json()
	const jsonUserGuilds = await userGuildsInfo.json()

	return { user: jsonUser, guilds: jsonUserGuilds }
}
