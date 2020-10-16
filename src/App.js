import React, { useEffect, useState } from 'react'
import './App.css'
import { Router, navigate } from '@reach/router'
import { Home } from './Home'
import { Admin } from './Admin'
import { HomeAdmin } from './components/HomeAdmin'
import { AdminUser } from './components/AdminUser'
import { Raid } from './components/Raid'
import { getInfosUserDiscord, connectFromCode } from './firebase/discord'
import Cookies from 'js-cookie'

const redirectRoot = 'http://localhost:3000'
const guildID = '638823950314635288'
const CLIENT_ID = '760909520884596776'
const redirect = encodeURIComponent('http://localhost:3000/')
const targetBase = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${redirect}&response_type=code&scope=identify%20email%20guilds`

const App = () => {
	const [userInfos, setUserInfos] = useState({})

	const login = async (cookieParsed, code) => {
		if (cookieParsed) {
			const userInfo = await getInfosUserDiscord(cookieParsed)
			const user = {
				...userInfo.user,
				guild: {
					...userInfo.guilds.filter((item) => item.id === guildID)[0],
				},
			}
			setUserInfos(user)
		} else if (!cookieParsed && code) {
			const codeFormated = { code: window.location.search.split('=')[1] }
			const token = await connectFromCode(codeFormated)
			console.log('TOKEN', token)
			Cookies.set(
				'aegis_discord',
				{
					token_type: token.token.token_type,
					access_token: token.token.access_token,
					refresh_token: token.token.refresh_token,
				},
				{ expires: 7 }
			)
			const user = {
				...token.userInfos.user,
				guild: {
					...token.userInfos.guilds.filter((item) => item.id === guildID)[0],
				},
			}
			navigate(`${redirectRoot}`)
			setUserInfos(user)
		} else {
			navigate(targetBase)
		}
	}

	useEffect(() => {
		const cookies = Cookies.get('aegis_discord')
		const cookieParsed = cookies ? JSON.parse(cookies) : false
		if (cookieParsed && cookieParsed.access_token && cookieParsed.token_type) {
			login(cookieParsed)
		} else if (window.location.search) {
			login(null, window.location.search)
		}
	}, [])

	return (
		<div className='App'>
			<Router>
				<Home path='/' userInfos={userInfos} login={login} />
				<Admin path='/admin'>
					<HomeAdmin path='/' />
					<AdminUser path='user' />
					<Raid path='raid' />
				</Admin>
			</Router>
		</div>
	)
}

export default App
