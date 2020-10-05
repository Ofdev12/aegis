const express = require('express')
const cors = require('cors')
const port = process.env.PORT || 5000

const app = express()

const reactionRouter = require('./routes/reactions')

// ####################### \\
//  	   routes		   \\
// ####################### \\
app.use(cors())

app.use('/api/reactions', reactionRouter)
app.get('/', async (req, res) => {
	res.send('Hello World')
})

app.listen(port, () => {
	console.log(`Listening on ${port}`)
})
