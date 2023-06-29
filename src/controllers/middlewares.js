const mongoose = require('mongoose')

const AppError = require('../utils/app-error')
const catchAsync = require('../utils/catch-async')
const { generateAccessCode, getTimeIn } = require('../utils/auth')
const { REGEX, HTTP_STATUS_CODES } = require('../settings/constants')

let error_msg
exports.setCustomQueryFromParams = (req, _, next) => {
  const { params } = req
  req.customQuery = {}

  if (params['user_email_phone_id']) {
    paramsValue = params['user_email_phone_id']

    switch (true) {
      case REGEX.email.test(paramsValue):
        req.customQuery.email = paramsValue.toLowerCase()
        break
      case REGEX.phone.test(paramsValue):
        req.customQuery.phone = paramsValue
        break
      case REGEX.mondoDbObjectId.test(paramsValue):
        req.customQuery['_id'] = new mongoose.Types.ObjectId(paramsValue)
        break
      default:
        error_msg = `The url parameter ${paramsValue} on ${req.originalUrl} did not match any expected expression`
        return next(new AppError(error_msg, HTTP_STATUS_CODES.error.badRequest))
    }
  }

  next()
}

exports.validateAccessCodeAnatomy = ({ params: { accessCode } }, _, next) => {
  if (!REGEX.accessCode.test(accessCode)) {
    error_msg = `The access code ${accessCode} on ${req.originalUrl} is wrongly formatted!`
    return next(new AppError(error_msg, HTTP_STATUS_CODES.error.badRequest))
  }
  next()
}

exports.setRequestBody = ({ body, currentUser }, _, next) => {
  // Ensure we have a valid email on body
  if (!REGEX.email.test(body.email)) {
    error_msg = "Provide the valid user's email address on the request body"
    return next(new AppError(error_msg, HTTP_STATUS_CODES.error.badRequest))
  }

  if (currentUser) {
    body.refreshToken = undefined
    body.accessCode = undefined
    body.accessCodeExpires = undefined
    body.isActive = undefined
    body.isLoggedIn = undefined
  } else {
    // A new user
    body.accessCode = generateAccessCode()
    body.accessCodeExpires = getTimeIn(10)
    body.isActive = true
    body.isLoggedIn = false
    body.role = 'user'
  }

  next()
}

exports.restrictToUpdate = ({ body }, _, next) => {
  const allowed = ['name', 'email', 'phone']

  Object.entries(body).forEach(([key, value]) => {
    if (!allowed.includes(value)) {
      error_msg = `You are not allowed to update ${key}`
      return next(new AppError(error_msg, HTTP_STATUS_CODES.error.forbidden))
    }
  })

  next()
}

exports.checkUserOwnsBirthday = catchAsync(async ({ method, params }, _, next) => {
  // CRUD on a birthday can only be done by the user who created it
  const birthday = await BirthDay.findById(params.id).exec()

  if (!birthday) {
    error_msg = "The requested birthday doesn't exists."
    return next(new AppError(error_msg, HTTP_STATUS_CODES.error.notFound))
  }

  if (JSON.stringify(birthday.owner) !== JSON.stringify(req.currentUser['_id'])) {
    const crud = method === 'PATCH' ? 'update' : method === 'DELETE' ? 'delete' : 'read'
    error_msg = `User can only ${crud} the birthday(s) that the user created`
    return next(new AppError(error_msg, HTTP_STATUS_CODES.error.forbidden))
  }

  next()
})
