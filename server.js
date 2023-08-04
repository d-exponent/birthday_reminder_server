const connectDatabase = require('./src/utils/db-connect')
const env = require('./src/settings/env')
const port = env.port
const app = require('./src/app')()

connectDatabase()
  .then(res => {
    console.log(res)
    app.listen(port, () => console.log(`🤖[SERVER] is running on port`, port))
  })
  .catch(error => console.error(error))

module.exports = app

// const shutDownGracefully = (code = 1) => {
//   return (err, reason) => {
//     console.error('🛑🛑 SERVER ERROR =>  ', err, '🛑REASON => ', reason)
//     server.close()
//     mongoose.connection.close()
//     console.error('All connections closed successfully')
//     process.exit(code)
//   }
// }

// // Handle shutdown events
// process
//   .on('SIGTERM', shutDownGracefully(0))
//   .on('uncaughtException', shutDownGracefully())
//   .on('unhandledRejection', shutDownGracefully())
