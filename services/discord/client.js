// ####################### \\
// 			 BOT  		   \\
// ####################### \\

const Discord = require('discord.js')
const client = new Discord.Client()
const guild = new Discord.Guild(client)

const botTokken = ''

client.login(botTokken)

client.on('ready', async () => {
	console.log(`Logged in as ${client.user.tag}`)
})

client.on('message', (msg) => {
	console.log('MESSAGE', msg.author.username, msg.content)
	const mess = msg.content.toLowerCase()
	if (mess === 'pong') {
		msg.reply('Ping!')
	}
	if (mess === 'ping') {
		msg.reply('Pong!')
	}
})

const manageReactions = async (props) => {
	const { id, day } = props
	const days = { Wednesday: '639125966521892879', Sunday: '709374805647949856' }

	const guildChannel = new Discord.TextChannel(guild, {
		id: days[day],
	})
	const msg = await guildChannel.messages.fetch(id)
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

module.exports = manageReactions
