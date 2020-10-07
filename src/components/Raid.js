import React, { useState } from 'react'
import {
	Input,
	InputNumber,
	Select,
	Button,
	Divider,
	Switch,
	Collapse,
	Slider,
} from 'antd'
import { CloseOutlined, CheckOutlined } from '@ant-design/icons'
import { RaidCollapse } from './RaidCollapse'
import './Raid.css'
const { Option } = Select
const { Panel } = Collapse

const api = 'http://localhost:5000'

export const Raid = () => {
	const [infos, setInfos] = useState({
		id: '761313497631817738',
		day: 'Wednesday',
		splited: true,
		mainReroll: true,
		ratio: 0.5,
		role: {
			tank: { min: 3, max: 5, pClassMin: { war: 3 } },
			heal: {
				min: 10,
				max: 12,
				pClassMin: { paladin: 3, priest: 3, drood: 1 },
			},
			cac: { min: 8, max: 15, pClassMin: { war: 5, rogue: 3 } },
			dist: { min: 8, max: 15, pClassMin: { hunt: 2, mage: 4, warlock: 2 } },
		},
	})
	const [raid, setRaid] = useState()
	const [loading, setLoading] = useState(false)

	const RaidReaction = async () => {
		const data = await fetch(`${api}/api/discord/reactions`, {
			method: 'POST',
			headers: {
				'content-Type': 'application/json',
			},
			body: JSON.stringify(infos),
		})
		const info = await data.json()
		setRaid(info)
		setInfos({ ...infos, done: true })
		setLoading(false)
	}

	const quota = (q, target, pClass, deep) => {
		setInfos({
			...infos,
			role: {
				...infos.role,
				[target]: deep
					? {
							...infos.role[target],
							pClassMin: { ...infos.role[target].pClassMin, [pClass]: q },
					  }
					: { ...infos.role[target], min: q[0], max: q[1] },
			},
		})
	}
	return (
		<>
			<h1>Welcome on the interface of the raid.</h1>
			<div className='meta'>
				<Input.Group compact>
					<Select
						placeholder='Select the Day Channel'
						onChange={(day) => setInfos({ ...infos, day })}
					>
						<Option value='Wednesday'>Wednesday</Option>
						<Option value='Sunday'>Sunday</Option>
					</Select>
					<Input
						style={{ width: '50%' }}
						placeholder='Copie the Id of the message'
						onChange={(id) => setInfos({ ...infos, id: id.target.value })}
					/>
				</Input.Group>
				<Button
					type='primary'
					shape='round'
					loading={loading}
					onClick={() => {
						setLoading(true)
						RaidReaction()
					}}
				>
					Fetch
				</Button>
			</div>
			{raid && infos.done && (
				<div className='raid-container'>
					<Divider plain>Raid Inscription</Divider>
					<div className='raid'>
						<div>
							<RaidCollapse raid={raid} />
						</div>

						<div className='meta-random'>
							<div>
								<p>Raid Split</p>
								<Switch
									checkedChildren={<CheckOutlined />}
									unCheckedChildren={<CloseOutlined />}
									defaultChecked={infos.splited}
									onChange={() =>
										setInfos({ ...infos, splited: !infos.splited })
									}
								/>
							</div>
							<div>
								<p>Only main reroll</p>

								<Switch
									checkedChildren={<CheckOutlined />}
									unCheckedChildren={<CloseOutlined />}
									defaultChecked={infos.mainReroll}
									onChange={() =>
										setInfos({ ...infos, mainReroll: !infos.splited })
									}
								/>
							</div>
							<div>
								<p>{'Main ratio (0 => 1)'}</p>
								<InputNumber
									defaultValue={infos.ratio}
									min={0}
									max={1}
									step={0.1}
									onChange={(e) =>
										setInfos({ ...infos, ratio: e.target.value })
									}
								/>
							</div>
							<div id='classes'>
								<Collapse accordion>
									<Panel header='Heals' key='1'>
										<span>Range Min/Max</span>
										<Slider
											range
											min={9}
											max={13}
											defaultValue={[infos.role.heal.min, infos.role.heal.max]}
											step
											onChange={(e) => quota(e, 'heal')}
										/>
										<span>Min only</span>
										<Collapse>
											{Object.entries(infos.role.heal.pClassMin).map(
												(pClass, i) => {
													return (
														<Panel header={pClass[0]} key={i}>
															<Slider
																min={0}
																max={10}
																onChange={(e) =>
																	quota(e, 'heal', pClass[0], true)
																}
																defaultValue={pClass[1]}
															/>
														</Panel>
													)
												}
											)}
										</Collapse>
									</Panel>
									<Panel header='Tank' key='2'>
										<span>Range Min/Max</span>
										<Slider
											range
											min={2}
											max={6}
											defaultValue={[infos.role.tank.min, infos.role.tank.max]}
											step
											onChange={(e) => quota(e, 'tank')}
										/>
										<span>Min only</span>
										<Collapse>
											{Object.entries(infos.role.tank.pClassMin).map(
												(pClass, i) => {
													return (
														<Panel header={pClass[0]} key={i}>
															<Slider
																min={0}
																max={10}
																onChange={(e) =>
																	quota(e, 'tank', pClass[0], true)
																}
																defaultValue={pClass[1]}
															/>
														</Panel>
													)
												}
											)}
										</Collapse>
									</Panel>
									<Panel header='Dps cac' key='3'>
										<span>Range Min/Max</span>
										<Slider
											range
											min={7}
											max={16}
											defaultValue={[infos.role.cac.min, infos.role.cac.max]}
											step
											onChange={(e) => quota(e, 'cac')}
										/>
										<span>Min only</span>
										<Collapse>
											{Object.entries(infos.role.cac.pClassMin).map(
												(pClass, i) => {
													return (
														<Panel header={pClass[0]} key={i}>
															<Slider
																min={0}
																max={10}
																onChange={(e) =>
																	quota(e, 'cac', pClass[0], true)
																}
																defaultValue={pClass[1]}
															/>
														</Panel>
													)
												}
											)}
										</Collapse>
									</Panel>
									<Panel header='Dps dist' key='4'>
										<span>Range Min/Max</span>
										<Slider
											range
											min={7}
											max={16}
											defaultValue={[infos.role.dist.min, infos.role.dist.max]}
											step
											onChange={(e) => quota(e, 'dist')}
										/>
										<span>Min only</span>
										<Collapse>
											{Object.entries(infos.role.dist.pClassMin).map(
												(pClass, i) => {
													return (
														<Panel header={pClass[0]} key={i}>
															<Slider
																min={0}
																max={10}
																onChange={(e) =>
																	quota(e, 'dist', pClass[0], true)
																}
																defaultValue={pClass[1]}
															/>
														</Panel>
													)
												}
											)}
										</Collapse>
									</Panel>
								</Collapse>
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	)
}
