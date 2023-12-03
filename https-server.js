/* eslint-disable no-console */
const https = require('node:https')
const fs = require('node:fs')

const app = require('./src/app')
const env = require('./src/settings/env')

const PORT = env.port || 5000

const createServerOptions = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
}

const server = https.createServer(createServerOptions, app())

server.listen(PORT, () => console.log('Server is listening on port: ', PORT))
