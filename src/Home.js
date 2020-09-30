import React from 'react'
import { Link } from '@reach/router'
import { Button } from 'antd'
import { Carrousel } from './components/Carrousel'
import { NavBar } from './components/NavBar'
import './Home.css'

export const Home = () => {
	return (
		<div>
			<Carrousel />
			<div className='home_main'>
				<NavBar />
			</div>
			<div>HOME PAGE</div>
			<Link to='/admin'>
				<Button type='primary' shape='round'>
					go Admin
				</Button>
			</Link>
		</div>
	)
}
