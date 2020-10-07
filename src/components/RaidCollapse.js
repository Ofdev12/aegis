import React from 'react'
import { Collapse } from 'antd'

const { Panel } = Collapse

export const RaidCollapse = ({ raid }) => {
	const heal = ['Priest', 'HolyPaladin', 'RestoDruid']
	const tank = ['Tank', 'Bear', 'ProtPaladin']
	const dps = [
		'Warrior',
		'Rogue',
		'Feral',
		'Hunter',
		'Mage',
		'Warlock',
		'Shadow',
		'Retri',
		'Balance',
	]

	const playerList = (pClass) =>
		raid.filter((obj) => obj[pClass] && obj[pClass])[0][pClass]

	const classCount = (arr) =>
		arr.reduce((acc, val) => playerList(val).length + acc, 0)

	const formatPanel = (arr) => {
		return arr.map((pClass, i) => {
			return (
				<Panel
					header={`${pClass.toUpperCase()} (${playerList(pClass).length})`}
					showArrow={false}
					key={i}
				>
					{playerList(pClass).map(({ username }, j) => (
						<p key={j}>{username}</p>
					))}
				</Panel>
			)
		})
	}

	return (
		<>
			<Collapse defaultActiveKey={['1']} expandIconPosition={'right'} accordion>
				<Panel header={`Healeur  (${classCount(heal)})`} key='1'>
					<Collapse defaultActiveKey={['0']} bordered={false}>
						{formatPanel(heal)}
					</Collapse>
				</Panel>
				<Panel header={`Tank  (${classCount(tank)}) `} key='2'>
					<Collapse defaultActiveKey={['0']} bordered={false}>
						{formatPanel(tank)}
					</Collapse>
				</Panel>
				<Panel header={`DPS  (${classCount(dps)})`} key='3'>
					<Collapse defaultActiveKey={['0']} bordered={false}>
						{formatPanel(dps)}
					</Collapse>
				</Panel>
			</Collapse>
		</>
	)
}
