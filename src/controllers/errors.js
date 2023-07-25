const env = require('../settings/env')
const AppError = require('../utils/app-error')
const commitToDb = require('../utils/commit-error')
const { STATUS, RESPONSE } = require('../settings/constants')

const ERR_STATUS = STATUS.error
let error_msg

const handleDuplicateFeilds = ({ keyValue }) => {
  error_msg = `${Object.values(keyValue)[0]} already exists.`
  return new AppError(error_msg, ERR_STATUS.serverError)
}

const handleValidationError = ({ errors }) => {
  const validationMsgs = Object.values(errors).map(e => e.message)
  return new AppError(`${validationMsgs.join('. ')}`, ERR_STATUS.badRequest)
}

const sendProductionError = (res, err) => {
  let errCopy

  if (!err.isOperational) {
    errCopy = { ...err }
    err.status = ERR_STATUS.serverError
    err.message = "Something went wrong. It's not you, it's us😥"
  }

  res.customResponse({ status: err.status, message: err.message }, RESPONSE.error)
  if (errCopy) commitToDb(errCopy).catch(e => console.error(e))
}

exports.wildRoutesHandler = ({ method, originalUrl }, _, next) => {
  error_msg = `${method.toUpperCase()} ${originalUrl} is not allowed on this server`
  return next(new AppError(error_msg, ERR_STATUS.methodNotAllowed))
}

exports.globalErrorHandler = (err, _, res, __) => {
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
          error_msg = 'Invalid Token, please login!'
          error = new AppError(error_msg, ERR_STATUS.forbidden)
          break
        case 'TokenExpiredError':
          error_msg = 'Expired token, please login!'
          error = new AppError(error_msg, ERR_STATUS.forbidden)
          break
        case 'MongooseError':
          error = new AppError('Network error', ERR_STATUS.badConnection)
          break
        default:
          if (error.message.includes('no such file or directory')) {
            error = new AppError('The file was not found', ERR_STATUS.notFound)
          }
          break
      }
    }

    sendProductionError(res, error)
  } else {
    console.error('🛑', err)
    res.customResponse(error, RESPONSE.error)
  }
}
