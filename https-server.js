const https = require('node:https')
const fs = require('node:fs')

const app = require('./src/app')
const env = require('./src/settings/env')

const PORT = env.port || 5000

const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
}

const server = https.createServer(options, app())

server.listen(PORT, () => console.log('Server is listening on port: ', PORT))
