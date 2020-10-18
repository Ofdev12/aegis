import React, { useState, useEffect } from 'react'
import { userFirebase } from '../firebase/index'
import { Table, Button, Dropdown, Menu, Divider, Alert } from 'antd'
import { DownOutlined } from '@ant-design/icons'
import './AdminUser.css'

export const AdminUser = () => {
	const [users, setUsers] = useState()
	const [loading, setLoading] = useState(false)
	const [status, setStatus] = useState()

	useEffect(() => {
		userFirebase.subAll(setUsers)
	}, [])

	useEffect(() => {
		setTimeout(() => {
			setStatus('')
		}, 7000)
	}, [status])

	const handleGradeInApp = async (e, item) => {
		setLoading(true)
		console.log('IN ACTION SELECT', item, e.key)
		const removeKey = Object.fromEntries(
			Object.entries(item).filter(
				(item) => !item.find((elem) => elem === 'key')
			)
		)
		const addGradeInApp = { ...removeKey, gradeInApp: e.key }
		try {
			await userFirebase.set(item.key, addGradeInApp)
			setStatus({
				type: 'success',
				message: 'Succesfully save in DB',
			})
		} catch (err) {
			setStatus({
				type: 'error',
				message: `Error during set grade in DB ${err.message}`,
			})
		}
		setLoading(false)
	}

	const gradeMenu = (item) => (
		<Menu onClick={(e) => handleGradeInApp(e, item)}>
			<Menu.Item key='invitate'>Go to Invitate</Menu.Item>
			<Menu.Item key='member'>Go to Member</Menu.Item>
			<Menu.Item key='admin'>Go to Admin</Menu.Item>
		</Menu>
	)

	const columns = [
		{
			title: 'Username',
			dataIndex: 'username',
			key: 'username',
		},
		{
			title: 'Grade In App',
			dataIndex: 'gradeInApp',
			key: 'gradeInApp',
		},
		{
			title: 'Email',
			dataIndex: 'email',
			key: 'email',
		},
		{
			title: 'Action',
			dataIndex: 'action',
			key: 'action',
			render: (_, item) => {
				return (
					<>
						<Dropdown overlay={gradeMenu(item)}>
							<Button>
								Grade in App <DownOutlined />
							</Button>
						</Dropdown>
						<Divider type='vertical' />
					</>
				)
			},
		},
	]

	return (
		<>
			<div className='header'>
				<h1>AdminUser PAGE</h1>
				{status && (
					<Alert
						message={status.message}
						type={status.type}
						showIcon
						closable
					/>
				)}
			</div>
			<Table
				columns={columns}
				dataSource={users}
				loading={loading}
				bordered
				tableLayout='fixed'
				pagination={false}
				size='middle'
			/>
		</>
	)
}
