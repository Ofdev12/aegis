import React from 'react'
import { Button, Drawer, Input, Select } from 'antd'
const { Option } = Select

export const DrawerCharacter = ({
	visible,
	setVisible,
	character,
	setCharacter,
}) => {
	const saveCharacter = () => {
		console.log(character)
	}
	return (
		<Drawer
			title='User profil'
			placement='right'
			closable={false}
			width='1000'
			keyboard
			onClose={() => setVisible(false)}
			visible={visible}
		>
			<div className='character-input'>
				<span>Main character</span>
				<Input.Group compact size='Large'>
					<Select
						placeholder='Main class'
						style={{ minWidth: '20%' }}
						showSearch
						optionFilterProp='children'
						filterOption={(input, option) =>
							option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
						}
						onSelect={(v) =>
							setCharacter({
								...character,
								main: { ...character.main, class: v },
							})
						}
					>
						<Option value='tank'>Warrior Tank</Option>
						<Option value='bear'>Druid Bear</Option>
						<Option value='war-dps'>Warrior dps</Option>
						<Option value='rogue'>Rogue</Option>
						<Option value='hunter'>Hunter</Option>
						<Option value='priest'>Priest</Option>
						<Option value='druid'>Druid Resto</Option>
						<Option value='paladin'>Paladin Heal</Option>
						<Option value='paladinProtec'>Paladin Tank</Option>
						<Option value='mage'>Mage</Option>
						<Option value='warlock'>Warlock</Option>
						<Option value='retri'>Paladin Retri</Option>
						<Option value='balance'>Druid Balance</Option>
						<Option value='feral'>Druid Féral</Option>
						<Option value='shadow'>Priest Shadow</Option>
					</Select>
					<Input
						style={{ width: '60%' }}
						placeholder='Main character name'
						onChange={(v) =>
							setCharacter({
								...character,
								main: { ...character.main, name: v.target.value },
							})
						}
					/>
				</Input.Group>
			</div>
			<div className='character-input'>
				<span>Main Reroll</span>
				<Input.Group compact size='Large'>
					<Select
						placeholder='Main Reroll class'
						style={{ minWidth: '20%' }}
						showSearch
						optionFilterProp='children'
						filterOption={(input, option) =>
							option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
						}
						onSelect={(v) =>
							setCharacter({
								...character,
								mainReroll: { ...character.mainReroll, class: v },
							})
						}
					>
						<Option value='tank'>Warrior Tank</Option>
						<Option value='bear'>Druid Bear</Option>
						<Option value='war-dps'>Warrior dps</Option>
						<Option value='rogue'>Rogue</Option>
						<Option value='hunter'>Hunter</Option>
						<Option value='priest'>Priest</Option>
						<Option value='druid'>Druid Resto</Option>
						<Option value='paladin'>Paladin Heal</Option>
						<Option value='paladinProtec'>Paladin Tank</Option>
						<Option value='mage'>Mage</Option>
						<Option value='warlock'>Warlock</Option>
						<Option value='retri'>Paladin Retri</Option>
						<Option value='balance'>Druid Balance</Option>
						<Option value='feral'>Druid Féral</Option>
						<Option value='shadow'>Priest Shadow</Option>
					</Select>
					<Input
						style={{ width: '60%' }}
						placeholder='Main Reroll character name'
						onChange={(v) =>
							setCharacter({
								...character,
								mainReroll: { ...character.mainReroll, name: v.target.value },
							})
						}
					/>
				</Input.Group>
			</div>
			<div className='character-input'>
				<span>Reroll 1</span>
				<Input.Group compact size='Large'>
					<Select
						placeholder='Reroll class'
						style={{ minWidth: '20%' }}
						showSearch
						optionFilterProp='children'
						filterOption={(input, option) =>
							option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
						}
						onSelect={(v) =>
							setCharacter({
								...character,
								reroll1: { ...character.reroll1, class: v },
							})
						}
					>
						<Option value='tank'>Warrior Tank</Option>
						<Option value='bear'>Druid Bear</Option>
						<Option value='war-dps'>Warrior dps</Option>
						<Option value='rogue'>Rogue</Option>
						<Option value='hunter'>Hunter</Option>
						<Option value='priest'>Priest</Option>
						<Option value='druid'>Druid Resto</Option>
						<Option value='paladin'>Paladin Heal</Option>
						<Option value='paladinProtec'>Paladin Tank</Option>
						<Option value='mage'>Mage</Option>
						<Option value='warlock'>Warlock</Option>
						<Option value='retri'>Paladin Retri</Option>
						<Option value='balance'>Druid Balance</Option>
						<Option value='feral'>Druid Féral</Option>
						<Option value='shadow'>Priest Shadow</Option>
					</Select>
					<Input
						style={{ width: '60%' }}
						placeholder='Reroll character name'
						onChange={(v) =>
							setCharacter({
								...character,
								reroll1: { ...character.reroll1, name: v.target.value },
							})
						}
					/>
				</Input.Group>
			</div>
			<div className='character-input'>
				<span>Reroll 2</span>
				<Input.Group compact size='Large'>
					<Select
						placeholder='Reroll class'
						style={{ minWidth: '20%' }}
						showSearch
						optionFilterProp='children'
						filterOption={(input, option) =>
							option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
						}
						onSelect={(v) =>
							setCharacter({
								...character,
								reroll2: { ...character.reroll2, class: v },
							})
						}
					>
						<Option value='tank'>Warrior Tank</Option>
						<Option value='bear'>Druid Bear</Option>
						<Option value='war-dps'>Warrior dps</Option>
						<Option value='rogue'>Rogue</Option>
						<Option value='hunter'>Hunter</Option>
						<Option value='priest'>Priest</Option>
						<Option value='druid'>Druid Resto</Option>
						<Option value='paladin'>Paladin Heal</Option>
						<Option value='paladinProtec'>Paladin Tank</Option>
						<Option value='mage'>Mage</Option>
						<Option value='warlock'>Warlock</Option>
						<Option value='retri'>Paladin Retri</Option>
						<Option value='balance'>Druid Balance</Option>
						<Option value='feral'>Druid Féral</Option>
						<Option value='shadow'>Priest Shadow</Option>
					</Select>
					<Input
						style={{ width: '60%' }}
						placeholder='Reroll character name'
						onChange={(v) =>
							setCharacter({
								...character,
								reroll2: { ...character.reroll2, name: v.target.value },
							})
						}
					/>
				</Input.Group>
			</div>
			<div className='character-input'>
				<span>Reroll 3</span>
				<Input.Group compact size='Large'>
					<Select
						placeholder='Reroll class'
						style={{ minWidth: '20%' }}
						showSearch
						optionFilterProp='children'
						filterOption={(input, option) =>
							option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
						}
						onSelect={(v) =>
							setCharacter({
								...character,
								reroll3: { ...character.reroll3, class: v },
							})
						}
					>
						<Option value='tank'>Warrior Tank</Option>
						<Option value='bear'>Druid Bear</Option>
						<Option value='war-dps'>Warrior dps</Option>
						<Option value='rogue'>Rogue</Option>
						<Option value='hunter'>Hunter</Option>
						<Option value='priest'>Priest</Option>
						<Option value='druid'>Druid Resto</Option>
						<Option value='paladin'>Paladin Heal</Option>
						<Option value='paladinProtec'>Paladin Tank</Option>
						<Option value='mage'>Mage</Option>
						<Option value='warlock'>Warlock</Option>
						<Option value='retri'>Paladin Retri</Option>
						<Option value='balance'>Druid Balance</Option>
						<Option value='feral'>Druid Féral</Option>
						<Option value='shadow'>Priest Shadow</Option>
					</Select>
					<Input
						style={{ width: '60%' }}
						placeholder='Reroll character name'
						onChange={(v) =>
							setCharacter({
								...character,
								reroll3: { ...character.reroll3, name: v.target.value },
							})
						}
					/>
				</Input.Group>
			</div>
			<Button onClick={saveCharacter} shape='round' type='primary'>
				Save
			</Button>
		</Drawer>
	)
}
