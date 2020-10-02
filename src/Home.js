import React, { useEffect, useState } from 'react'
import { Link } from '@reach/router'
import Cookies from 'js-cookie'
import { Button } from 'antd'
import { Carrousel } from './components/Carrousel'
import { NavBar } from './components/NavBar'
import { connectFromCode, connectFromCookie } from './auth'

import './Home.css'

export const Home = (props) => {
	const [status, setStatus] = useState()
	const [isConnected, setIsConnected] = useState(false)
	const [userInfos, setUserInfos] = useState({})

	useEffect(() => {
		const cookies = Cookies.get('aegis_discord')
		const cookieParsed = cookies ? JSON.parse(cookies) : false
		if (cookieParsed && cookieParsed.access_token && cookieParsed.token_type) {
			setStatus('loading')
			connectFromCookie(cookieParsed, setIsConnected, setUserInfos)
		} else if (window.location.search) {
			setStatus('loading')
			connectFromCode(setUserInfos, setIsConnected, setStatus)
		}
	}, [])

	return (
		<div>
			<Carrousel />
			<div className='home_main'>
				<NavBar userInfos={userInfos.user} />
			</div>
			<div>{props.children}</div>
			<div>{status}</div>
			<Link to='/admin'>
				<Button type='primary' shape='round'>
					go Admin
				</Button>
			</Link>
		</div>
	)
}
