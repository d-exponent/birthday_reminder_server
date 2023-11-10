const fs = require('node:fs')

const cors = require('cors')
const express = require('express')
const compression = require('compression')
const cookieParser = require('cookie-parser')
const rateLimit = require('express-rate-limit')
const mongoSanitize = require('express-mongo-sanitize')


const appController = require('./controllers/app')
const errorController = require('./controllers/errors')
const apiV1RoutesController = require('./routes/api-v1')

const { CORSOriginSetter } = require('./lib/auth')
const { isProduction, cookieSecret } = require('./settings/env')
const firstRequestManager = require('./lib/manage-first-request')
const { BIRTHDAYS_IMAGES_DIR } = require('./settings/constants')


const app = express()

const rateLimitConfig = {
  windowMs: 900000, // 15 minutes
  max: isProduction ? 500 : 1000,
  standardHeaders: true,
  legacyHeaders: false
}

const corsConfig = {
  origin: CORSOriginSetter,
  credentials: true,
  optionSuccessStatus: 200
}

module.exports = () => {
  app.get('/', appController.showAppIsRunning)
  app.get('/cwd', async (req, res)=> {
    
    try{
      await fs.promises.mkdir(BIRTHDAYS_IMAGES_DIR, { recursive: true })
    }catch(e){
      return res.status(500).json({message: e.message}) 
    }

    res.status(200).json({
      cwd: `${process.cwd()}`,
      birthdayImagesDir: BIRTHDAYS_IMAGES_DIR,
      isBdDirExist: fs.existsSync(BIRTHDAYS_IMAGES_DIR)
    })
  })

  app.options('*', cors(corsConfig))

  app.use(cors(corsConfig))
  app.use(rateLimit(rateLimitConfig))
  app.use(cookieParser(cookieSecret))
  app.use(compression())
  app.use(express.json())

  app.use(
    appController.initDB,
    appController.useMorganOnDev(),
    appController.assignPropsOnRequest,
    appController.assignPropsOnResponse
  )

  app.use(
    firstRequestManager.prepImagesDir.bind(firstRequestManager),
    firstRequestManager.setIsFirstRequest.bind(firstRequestManager)
  )

  app.use('/api/v1', mongoSanitize(), apiV1RoutesController)
  app.use('*', errorController.wildRoutesHandler)
  app.use(errorController.globalErrorHandler)
  return app
}
