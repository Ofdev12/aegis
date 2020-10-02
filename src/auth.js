import Cookies from 'js-cookie'

import { navigate } from '@reach/router'
import { getTokkenDiscord, getInfosUserDiscord } from './discobot/index'

const guildeID = ''
const redirectRoot = 'http://localhost:3000'

export const connectFromCookie = async (...props) => {
	const [cookieParsed, setIsConnected, setUserInfos] = props
	const userInfos = await getInfosUserDiscord(cookieParsed)
	setUserInfos(userInfos)
	setIsConnected(true)
}

export const connectFromCode = async (...props) => {
	const [setUserInfos, setIsConnected, setStatus] = props

	const tokken = await getTokkenDiscord()
	const userInfos = await getInfosUserDiscord(tokken)
	Cookies.set(
		'aegis_discord',
		{
			token_type: tokken.token_type,
			access_token: tokken.access_token,
		},
		{ expires: 7 }
	)
	navigate(`${redirectRoot}`)
	const guildCheck = userInfos.guilds.filter((g) => g.id === guildeID)
	if (guildCheck.length === 0) {
		setStatus('unregistered')
		return
	}
	setUserInfos(userInfos)
	setIsConnected(true)
}
