const env = require('../settings/env')
const AppError = require('../utils/app-error')
const { sendResponse } = require('../utils/contollers')
const { STATUS, RESPONSE } = require('../settings/constants')

const handleDuplicateFeilds = ({ keyValue }) =>
  new AppError(`${Object.values(keyValue)[0]} already exists.`, 500)

const handleValidationError = ({ errors }) => {
  const validationMsgs = Object.values(errors).map(e => e.message)
  return new AppError(`${validationMsgs.join('. ')}`, 400)
}

const sendProductionError = (res, err) => {
  if (!err.isOperational) {
    err = {
      status: err.status || 500,
      message: 'something went wrong'
    }
  }

  sendResponse(RESPONSE.error, res, {
    status: err.status,
    message: err.message
  })
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
  !env.isProduction && console.error('🛑', err)
  
  let error = {
    ...err,
    message: err.message,
    code: err.code,
    name: err.name,
    stack: err.stack,
    isOperational: err.isOperational,
    status: err.status || err.statusCode || STATUS.error.serverError
  }

  if (!env.isProduction) return sendResponse(RESPONSE.error, res, error)
  if (error.code === 11000) error = handleDuplicateFeilds(error)
  if (error.name === 'ValidationError') error = handleValidationError(error)

  if (error.name === 'JsonWebTokenError')
    error = new AppError('Invalid Token, please login!', 401)
  if (error.name === 'TokenExpiredError')
    error = new AppError('Expired token, please login!', 401)

  sendProductionError(res, error)
}
