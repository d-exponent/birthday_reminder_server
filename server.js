const mongoose = require('mongoose')
const env = require('./src/settings/env')
const app = require('./src/app')
const connectDB = require('./src/lib/db-connect')
const cronJobScheduler = require('./src/cron/scheduler')
const firstRequestManager = require('./src/lib/manage-first-request')

const PORT = env.port || 5000

cronJobScheduler.start()
const server = app().listen(PORT, () => {
  connectDB()
    .then(res => {
      console.log(res)
      firstRequestManager.hasLoggedDbConnect = true
    })
    .catch(e => console.log(e.message ?? 'Error connecting to mongoDb'))
  console.log(`🤖[SERVER] is listening on port`, PORT)
})

const shutDownGracefully = (err, reason) => {
  console.error('🛑🛑 SERVER ERROR =>  ', err, '🛑REASON => ', reason)
  cronJobScheduler.stop()
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
