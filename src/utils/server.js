const env = require('../env')

exports.productionServer = ({ app, port }) => {
  app.listen(port, () => {
    console.log('🤖[PROD SERVER] is running on port:', port)
  })
}

exports.developmentServer = (httpOrHttps, { app, port }) => {
  console.log(`Running ${env.devHttpProtocol} `)
  httpOrHttps.createServer(app).listen(port, () => {
    console.log('🤖[DEV SERVER] is running on port:', port)
  })
}
