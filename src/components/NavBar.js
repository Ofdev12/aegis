import React, { useState } from 'react'
import { Menu } from 'antd'
import {
	MailOutlined,
	AppstoreOutlined,
	SettingOutlined,
} from '@ant-design/icons'
import './NavBar.css'

const { SubMenu } = Menu

export const NavBar = ({ userInfos, login }) => {
	const [current, setCurrent] = useState('accueil')

	const handleClick = (e) => {
		// console.log('click ', e)
		setCurrent(e.key)
	}

	return (
		<Menu
			className='nav_bar'
			onClick={handleClick}
			selectedKeys={[current]}
			mode='horizontal'
		>
			<Menu.Item key='accueil' icon={<MailOutlined />}>
				Accueil
			</Menu.Item>
			<Menu.Item key='articles' icon={<AppstoreOutlined />}>
				Articles
			</Menu.Item>
			<SubMenu key='SubMenu' icon={<SettingOutlined />} title='Raid'>
				<Menu.ItemGroup title='Item 1'>
					<Menu.Item key='setting:1'>Option 1</Menu.Item>
					<Menu.Item key='setting:2'>Option 2</Menu.Item>
				</Menu.ItemGroup>
				<Menu.ItemGroup title='Item 2'>
					<Menu.Item key='setting:3'>Option 3</Menu.Item>
					<Menu.Item key='setting:4'>Option 4</Menu.Item>
				</Menu.ItemGroup>
			</SubMenu>
			<Menu.Item key='discord'>
				<div
					onClick={() => {
						userInfos ? console.log('CONNECTED GO PROFILE') : login()
					}}
				>
					{userInfos ? `Bonjour ${userInfos.username}` : 'Discord'}
				</div>
			</Menu.Item>
		</Menu>
	)
}
