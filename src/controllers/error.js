const env = require('../env')

const AppError = require('../utils/appError')
const { sendResponse } = require('../utils/contollers')
const { HTTP_STATUS_CODES } = require('../constants')



const sendDevelopmentError = (res, err) => {
  sendResponse('error', res, err)
}

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
    status: err.status || err.statusCode || HTTP_STATUS_CODES.error.serverError,
  }

  if (env.nodeEnv === 'production') {
    sendProductionError(res, error)
  } else {
    sendDevelopmentError(res, error)
  }
}
