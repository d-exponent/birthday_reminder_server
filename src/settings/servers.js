const fs = require('fs')
const path = require('path')

const app = require('../app')()
const cwd = process.cwd()
const env = require('./env')
const devHttpProtocol = env.devHttpProtocol.toLowerCase()
const httpProtocol = require(devHttpProtocol)
const port = env.port

exports.productionServer = () => {
  app.listen(port, () => {
    console.log('🤖[PROD SERVER] is running on port:', port)
  })
}

exports.developmentServer = () => {
  /**
   * Using the enviorment variable DEV_HTTP_PROTOCOL...
   * ... creates an https server with self signed certificates or an http server
   */
  const server =
    devHttpProtocol === 'http'
      ? httpProtocol.createServer(app)
      : httpProtocol.createServer(
          {
            key: fs.readFileSync(path.join(cwd, 'key.pem')),
            cert: fs.readFileSync(path.join(cwd, 'cert.pem'))
          },
          app
        )

  server.listen(port, () => {
    console.log(`🤖 ${devHttpProtocol} => [DEV SERVER] is running on port:`, port)
  })
}
