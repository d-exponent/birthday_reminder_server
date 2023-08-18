/* eslint-disable no-param-reassign */
const env = require('../settings/env')
const AppError = require('../utils/app-error')
const commitToDb = require('../utils/commit-error')
const { STATUS, RESPONSE } = require('../settings/constants')

const ERR_STATUS = STATUS.error
let errorMsg

const handleDuplicateFeilds = ({ keyValue }) => {
  errorMsg = `${Object.values(keyValue)[0]} already exists.`
  return new AppError(errorMsg, ERR_STATUS.serverError)
}

const handleValidationError = ({ errors }) => {
  const validationMsgs = Object.values(errors).map(e => e.message)
  return new AppError(`${validationMsgs.join('. ')}`, ERR_STATUS.badRequest)
}

const sendProductionError = (res, error) => {
  let errCopy = null

  if (!error.isOperational) {
    errCopy = { ...error }
    error.status = ERR_STATUS.serverError
    error.message = "Something went wrong. It's not you, it's us😥"
  }

  res.customResponse(
    { status: error.status, message: error.message },
    RESPONSE.error
  )

  // eslint-disable-next-line no-unused-expressions
  errCopy && commitToDb(errCopy).catch(e => console.error(e))
}

exports.wildRoutesHandler = ({ method, originalUrl }, _, next) =>
  next(
    new AppError(
      `${method.toUpperCase()} ${originalUrl} is not allowed on this server`,
      ERR_STATUS.methodNotAllowed
    )
  )

exports.globalErrorHandler = (err, _, res, next) => {
  let error = {
    ...err,
    message: err.message,
    code: err.code,
    name: err.name,
    stack: err.stack,
    isOperational: err.isOperational,
    status: err.status || err.statusCode || ERR_STATUS.serverError
  }

  if (env.isProduction) {
    if (error.code === 11000) error = handleDuplicateFeilds(error)

    if (err.name) {
      switch (error.name) {
        case 'ValidationError':
          error = handleValidationError(error)
          break
        case 'JsonWebTokenError':
          error = new AppError('Invalid Token, please login!', ERR_STATUS.forbidden)
          break
        case 'TokenExpiredError':
          error = new AppError('Expired token, please login!', ERR_STATUS.forbidden)
          break
        case 'MongooseError':
          error = error.message.includes('querySrv ETIMEOUT _mongodb._tcp')
            ? new AppError('Network error', ERR_STATUS.gatewayTimeOut)
            : new AppError('Network error', ERR_STATUS.badConnection)
          break
        default:
          error = { message: 'Something went wrong', status: 500 }
          break
      }
    }

    sendProductionError(res, error)
  } else {
    res.customResponse(error, RESPONSE.error)
  }

  return next()
}
