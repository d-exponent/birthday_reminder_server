const env = require('../settings/env')
const AppError = require('../utils/app-error')
const { sendResponse } = require('../utils/contollers')
const { HTTP_STATUS_CODES } = require('../settings/constants')

const sendProductionError = (res, err) => {
  err.stack = undefined
  err.name = undefined
  let resError = err

  if (!err.isOperational) {
    resError = {
      status: err.status,
      message: 'something went wrong'
    }
  }

  sendResponse('error', res, resError)
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
  const error = {
    ...err,
    message: err.message,
    name: err.name || undefined,
    stack: err.stack || undefined,
    isOperational: err.isOperational || false,
    status: err.status || err.statusCode || HTTP_STATUS_CODES.error.serverError
  }

  if (env.isProduction) return sendProductionError(res, error)

  sendResponse('error', res, { ...err, message: err.message, status: err.status })
}
