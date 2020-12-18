import React, { useEffect, useState } from 'react'
import { Link, navigate } from '@reach/router'
import Cookies from 'js-cookie'
import { Button } from 'antd'
import { Carrousel } from './components/Carrousel'
import { NavBar } from './components/NavBar'

import './Home.css'

const api = 'http://localhost:5000/api/discord/login'
const redirectRoot = 'http://localhost:3000'

const CLIENT_ID = ''
const redirect = encodeURIComponent('http://localhost:3000/')
const targetBase = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${redirect}&response_type=code&scope=identify%20email%20guilds`

export const Home = (props) => {
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
			setUserInfos(json)
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
				},
				{ expires: 7 }
			)
			navigate(`${redirectRoot}`)
			setUserInfos(json.userInfos)
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
		<div>
			<Carrousel />
			<div className='home_main'>
				<NavBar userInfos={userInfos.user} login={login} />
			</div>
			<div>{props.children}</div>
			<Link to='/admin'>
				<Button type='primary' shape='round'>
					go Admin
				</Button>
			</Link>
		</div>
	)
}
