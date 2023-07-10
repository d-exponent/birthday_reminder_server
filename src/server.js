const fs = require('fs')
const app = require('./app')()
const env = require('./settings/env')
const port = env.port

module.exports = () => {
  if (env.isProduction) {
    app.listen(port, () =>
      console.log(`[PROD SERVER] => port: ${port} => started: ${new Date()}`)
    )
  } else {
    // HTTP OR HTTPS DEVELOPEMENT
    const protocol = env.devHttpProtocol.toLowerCase()
    const httpProtocol = require(protocol)

    const server =
      protocol === 'http'
        ? httpProtocol.createServer(app)
        : httpProtocol.createServer(
            {
              key: fs.readFileSync('../key.pem'),
              cert: fs.readFileSync('../cert.pem')
            },
            app
          )

    server.listen(port, () => {
      console.log(`🤖 ${protocol} => [DEV SERVER] is running on port:`, port)
    })
  }
}
