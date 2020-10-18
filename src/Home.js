import React, { useState } from 'react'
import { Link } from '@reach/router'

import { Button } from 'antd'
import { Carrousel } from './components/Carrousel'
import { NavBar } from './components/NavBar'
import { DrawerCharacter } from './components/Drawer'

import './Home.css'

export const Home = (props) => {
	const { userInfos, setUserInfos, login } = props
	const [visible, setVisible] = useState(false)

	return (
		<div>
			<Carrousel />
			<div className='home_main'>
				<NavBar userInfos={userInfos} login={login} setVisible={setVisible} />
			</div>
			<div>{props.children}</div>
			<Link to='/admin'>
				<Button type='primary' shape='round'>
					go Admin
				</Button>
			</Link>
			<DrawerCharacter
				visible={visible}
				setVisible={setVisible}
				userInfos={userInfos}
				setUserInfos={setUserInfos}
			/>
		</div>
	)
}
