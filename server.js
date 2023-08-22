const mongoose = require('mongoose')
const env = require('./src/settings/env')
const app = require('./src/app')

const PORT = env.port || 5000

const server = app().listen(PORT, () =>
  console.log(`🤖[SERVER] is listening on port`, PORT)
)

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
