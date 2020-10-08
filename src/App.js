import React, { useEffect, useState } from 'react'
import './App.css'

import { Router, navigate } from '@reach/router'
import { Home } from './Home'
import { Admin } from './Admin'
import { HomeAdmin } from './components/HomeAdmin'
import { AdminUser } from './components/AdminUser'
import { Raid } from './components/Raid'
import Cookies from 'js-cookie'
const api = 'http://localhost:5000/api/discord/login'
const redirectRoot = 'http://localhost:3000'

const redirect = encodeURIComponent('http://localhost:3000/')
const targetBase = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${redirect}&response_type=code&scope=identify%20email%20guilds`

const App = () => {
	const [userInfos, setUserInfos] = useState({})

	const login = async (cookieParsed, code) => {
		if (cookieParsed) {
			const response = await fetch(`${api}`, {
				method: 'POST',
				headers: {
					'content-Type': 'application/json',
				},
				body: JSON.stringify(cookieParsed),
			})
			const json = await response.json()
			const user = {
				...json.user,
				guild: {
					...json.guilds.filter((item) => item.id === guildID)[0],
				},
			}
			setUserInfos(user)
		} else if (!cookieParsed && code) {
			const codeFormated = { code: window.location.search.split('=')[1] }
			const response = await fetch(`${api}/token`, {
				method: 'POST',
				headers: {
					'content-Type': 'application/json',
				},
				body: JSON.stringify(codeFormated),
			})
			const json = await response.json()
			Cookies.set(
				'aegis_discord',
				{
					token_type: json.token.token_type,
					access_token: json.token.access_token,
					refresh_token: json.token.refresh_token,
				},
				{ expires: 7 }
			)
			const user = {
				...json.userInfos.user,
				guild: {
					...json.userInfos.guilds.filter((item) => item.id === guildID)[0],
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
