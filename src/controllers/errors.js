const env = require('../settings/env')
const AppError = require('../utils/app-error')
const { STATUS, RESPONSE } = require('../settings/constants')

let error_msg

const handleDuplicateFeilds = ({ keyValue }) =>
  new AppError(
    `${Object.values(keyValue)[0]} already exists.`,
    STATUS.error.serverError
  )

const handleValidationError = ({ errors }) => {
  const validationMsgs = Object.values(errors).map(e => e.message)
  return new AppError(`${validationMsgs.join('. ')}`, STATUS.error.badRequest)
}

const sendProductionError = (res, err) => {
  if (!err.isOperational) {
    err = {
      status: err.status || STATUS.error.serverError,
      message: 'something went wrong'
    }
  }

  const response = {
    status: err.status,
    message: err.message
  }

  res.customResponse(response, RESPONSE.error)
}

exports.wildRoutesHandler = ({ method, originalUrl }, _, next) => {
  next(
    new AppError(
      `${method.toUpperCase()} ${originalUrl} is not allowed on this server`,
      STATUS.error.methodNotAllowed
    )
  )
}

exports.globalErrorHandler = (err, _, res, __) => {
  let error = {
    ...err,
    message: err.message,
    code: err.code,
    name: err.name,
    stack: err.stack,
    isOperational: err.isOperational,
    status: err.status || err.statusCode || STATUS.error.serverError
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
          error = new AppError(error_msg, STATUS.error.forbidden)
          break
        case 'TokenExpiredError':
          error_msg = 'Expired token, please login!'
          error = new AppError(error_msg, STATUS.error.forbidden)
          break
        case 'MongooseError':
          error = new AppError('Network error', STATUS.error.badConnection)
          break
        default:
          if (error.message.includes('no such file or directory')) {
            error = new AppError('The file was not found', STATUS.error.notFound)
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
