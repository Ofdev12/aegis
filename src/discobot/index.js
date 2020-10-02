const CLIENT_ID = ''
const CLIENT_SECRET = ''
const redirect = encodeURIComponent('http://localhost:3000/')

export const redirectToDiscord = () => {
	const prepareURL = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${redirect}&response_type=code&scope=identify%20email%20guilds`
	return (window.location.href = prepareURL)
}

export const getTokkenDiscord = async () => {
	const data = {
		client_id: CLIENT_ID,
		client_secret: CLIENT_SECRET,
		grant_type: 'authorization_code',
		redirect_uri: 'http://localhost:3000/',
		code: window.location.search.split('=')[1],
		scope: ['identify', 'email', 'guilds'],
	}

	const getTokken = await fetch('https://discordapp.com/api/oauth2/token', {
		method: 'POST',
		body: new URLSearchParams(data),
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
	})
	return getTokken.json()
}

export const getInfosUserDiscord = async (jsonTokken) => {
	const userInfo = await fetch('https://discordapp.com/api/users/@me', {
		headers: {
			authorization: `${jsonTokken.token_type} ${jsonTokken.access_token}`,
		},
	})
	const userGuildsInfo = await fetch(
		'https://discordapp.com/api/users/@me/guilds',
		{
			headers: {
				authorization: `${jsonTokken.token_type} ${jsonTokken.access_token}`,
			},
		}
	)
	const jsonUser = await userInfo.json()
	const jsonUserGuilds = await userGuildsInfo.json()

	return { user: jsonUser, guilds: jsonUserGuilds }
}
