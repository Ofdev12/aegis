import React from 'react'
import { Sider } from './components/Side_bar'
import './Admin.css'

export const Admin = (props) => {
	const location = props.location.pathname.split('/')
	return (
		<div className='doc'>
			<Sider location={location[location.length - 1]} />
			<div className='main'>{props.children}</div>
		</div>
	)
}
