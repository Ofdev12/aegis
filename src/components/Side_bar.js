import React from 'react'
import { Menu } from 'antd'

import { Link } from '@reach/router'

export const Sider = ({ location }) => {
	const handleClick = (e) => {
		console.log('click ', e)
	}

	return (
		<Menu
			onClick={handleClick}
			style={{ width: 256 }}
			defaultSelectedKeys={[`${location}`]}
			mode='inline'
		>
			<Menu.Item key='admin'>
				<Link to='/admin'>Accueil</Link>
			</Menu.Item>
			<Menu.Item key='user'>
				<Link to='user'>User</Link>
			</Menu.Item>

			<Menu.Item key='raid'>
				<Link to='raid'>Raid Generator</Link>
			</Menu.Item>
			<Menu.Item key='/'>
				<Link to='/'>Home Page</Link>
			</Menu.Item>
		</Menu>
	)
}
