/* eslint-disable no-console */

const mongoose = require('mongoose')
const env = require('./src/settings/env')
const app = require('./src/app')
const connectDB = require('./src/lib/db-connect')
const firstRequestManager = require('./src/lib/manage-first-request')

const PORT = env.port || 5000

const server = app().listen(PORT, () => {
  console.log(`🤖[SERVER] is listening on port`, PORT)
  connectDB()
    .then(res => {
      console.log(res)
      firstRequestManager.hasLoggedDbConnect = true
    })
    .catch(e => console.log(e.message ?? 'Error connecting to mongoDb'))
})

const shutDownGracefully = (err, reason) => {
  console.error('🛑🛑 SERVER ERROR =>  ', err, '🛑REASON => ', reason)
  server.close()
  mongoose.connection.close()
  console.warn('All connections closed successfully')
  process.exit(1)
}

process
  .on('SIGTERM', shutDownGracefully)
  .on('SIGKILL', shutDownGracefully)
  .on('uncaughtException', shutDownGracefully)
  .on('unhandledRejection', shutDownGracefully)
