const mongoose = require('mongoose')
const PORT = require('./src/settings/env').port
const app = require('./src/app')
const connectDB = require('./src/lib/db-connect')
const cronJobScheduler = require('./src/cron/scheduler')
const firstRequestManager = require('./src/lib/first-request-manager')

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
  .on('uncaughtException', shutDownGracefully)
  .on('unhandledRejection', shutDownGracefully)
// .on('SIGTERM', shutDownGracefully)
// .on('SIGKILL', shutDownGracefully)
