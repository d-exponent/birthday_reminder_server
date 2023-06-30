const env = require('../settings/env')
const AppError = require('../utils/app-error')
const { sendResponse } = require('../utils/contollers')
const { HTTP_STATUS_CODES, RESPONSE_TYPE } = require('../settings/constants')

const sendProductionError = (res, err) => {
  if (!err.isOperational) {
    err = {
      status: err.status,
      message: 'something went wrong'
    }
  }

  sendResponse('error', res, { status: err.status, message: err.message })
}

exports.wildRoutesHandler = ({ method, originalUrl }, _, next) => {
  next(
    new AppError(
      `${method.toUpperCase()} ${originalUrl} is not allowed on this server`,
      HTTP_STATUS_CODES.error.methodNotAllowed
    )
  )
}

exports.globalErrorHandler = (err, _, res, __) => {
  !env.isProduction && console.log('🛑', err)
  let error = {
    ...err,
    message: err.message,
    code: err.code,
    name: err.name,
    stack: err.stack,
    isOperational: err.isOperational,
    status: err.status || err.statusCode || HTTP_STATUS_CODES.error.serverError
  }

  if (!env.isProduction) return sendResponse(RESPONSE_TYPE.error, res, error)

  if (error.name === 'JsonWebTokenError')
    error = new AppError('Invalid Token, please login!', 401)

  if (error.name === 'TokenExpiredError')
    error = new AppError('Expired token, please login!', 401)

  sendProductionError(res, error)
}
