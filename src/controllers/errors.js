const AppError = require('../lib/app-error')
const commitToDb = require('../lib/commit-error')
const { isProduction } = require('../settings/env')
const { STATUS, RESPONSE } = require('../settings/constants')

const ERROR_STATUS = STATUS.error
let errorMsg

const handleDuplicateFeilds = ({ keyValue }) => {
  errorMsg = `${Object.values(keyValue)[0]} already exists.`
  return new AppError(errorMsg, ERROR_STATUS.serverError)
}

const handleValidationError = ({ errors }) => {
  const validationMsgs = Object.values(errors).map(e => e.message)
  return new AppError(`${validationMsgs.join('. ')}`, ERROR_STATUS.badRequest)
}

const sendProductionError = (error, sender) => {
  if (!error.isOperational) {
    error.status = ERROR_STATUS.serverError
    error.message = 'Something went wrong.'
  }

  sender({ status: error.status, message: error.message }, RESPONSE.error)
}

exports.wildRoutesHandler = ({ method, originalUrl }, _, next) =>
  next(
    new AppError(
      `<${method.toUpperCase()}: ${originalUrl}> is not allowed on this server`,
      ERROR_STATUS.methodNotAllowed
    )
  )

exports.globalErrorHandler = (err, _, res, next) => {
  let error = {
    ...err,
    code: err.code,
    name: err.name,
    stack: err.stack,
    message: err.message,
    isOperational: err.isOperational || false,
    status: err.status || err.statusCode || ERROR_STATUS.serverError
  }

  // Send dev env errors as is
  if (!isProduction) {
    res.sendResponse(error, RESPONSE.error)
    return next()
  }

  //   PRODUCTION ERRORS
  if (error.code === 11000) error = handleDuplicateFeilds(error)

  if (error.name && error.name !== 'Error') {
    switch (error.name) {
      case 'ValidationError':
        error = handleValidationError(error)
        break
      case 'JsonWebTokenError':
        error = new AppError('Invalid Token, please login!', ERROR_STATUS.forbidden)
        break
      case 'TokenExpiredError':
        error = new AppError('Expired token, please login!', ERROR_STATUS.forbidden)
        break
      case 'MongooseError':
        error = new AppError(
          'Network Error',
          error.message.includes('querySrv ETIMEOUT _mongodb._tcp')
            ? ERROR_STATUS.gatewayTimeOut
            : ERROR_STATUS.badConnection
        )
        break
      default:
        error = new Error()
    }
  }
  sendProductionError(error, res.sendResponse)

  if (!error.isOperational) commitToDb(error).catch(() => {})
  next()
}
