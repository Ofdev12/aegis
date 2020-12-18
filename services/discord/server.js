const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const port = process.env.PORT || 5000
const app = express()

const reactionRouter = require('./routes/discord/reactions')
const login = require('./routes/discord/login')

// ####################### \\
//  	   middleWare	   \\
// ####################### \\
app.use(cors())

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// ####################### \\
//  	   routes		   \\
// ####################### \\

app.use('/api/discord/reactions', reactionRouter)
app.use('/api/discord/login', login)

app.get('/', async (req, res) => {
	res.send('Hello World')
})

app.listen(port, () => {
	console.log(`Listening on ${port}`)
})
