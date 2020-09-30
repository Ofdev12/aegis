import React from 'react'
import './App.css'

import { Router } from '@reach/router'
import { Home } from './Home'
import { Admin } from './Admin'
import { HomeAdmin } from './components/HomeAdmin'
import { AdminUser } from './components/AdminUser'
import { Raid } from './components/Raid'

const App = () => {
	return (
		<div className='App'>
			<Router>
				<Home path='/' />
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
