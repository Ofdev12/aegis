const express = require('express')
const app = express()
const port = process.env.PORT || 5000
const Discord = require('discord.js')
const client = new Discord.Client()
const guild = new Discord.Guild(client)
const guildChannel = new Discord.TextChannel(guild, {
	id: '639125966521892879',
})

const botTokken = 'NzYwOTA5NTIwODg0NTk2Nzc2.X3S6Ng.A0cbhtK0ZoBoTXVxj145wIqTUnY'

client.login(botTokken)

client.on('ready', async () => {
	console.log(`Logged in as ${client.user.tag}`)
})

const manageReactions = async (messageID) => {
	const msg = await guildChannel.messages.fetch(messageID)
	const reactions = [...msg.reactions.cache]
	const formatClassReactions = reactions.map(async (reaction, i) => {
		const users = await reaction[1].users.fetch()
		const usersNames = [...users]
			.filter((user) => user[1].bot === false)
			.map((user) => ({ username: user[1].username, id: user[1].id }))
		return { [reaction[1]._emoji.name]: usersNames }
	})
	return Promise.all(formatClassReactions)
}
// const a = manageReactions('761313497631817738')
// a.then(console.log).catch(console.error)

client.on('message', (msg) => {
	console.log('MESSAGE', msg.content)
	if (msg.content === 'pong') {
		msg.reply('Ping!')
	}
})

app.get('/', async (req, res) => {
	res.send('Hello World')
})

app.listen(port, () => {
	console.log(`Listening on ${port}`)
})
