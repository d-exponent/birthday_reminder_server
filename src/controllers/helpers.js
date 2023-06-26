const mongoose = require('mongoose')

const AppError = require('../utils/app-error')
const { REGEX, HTTP_STATUS_CODES } = require('../settings/constants')

let error_msg
exports.setCustomQueryFromParams = (req, _, next) => {
  const { params } = req
  const query = (req.customQuery = {})

  const uniqueUserAttribute = params['user_email_phone_id']

  switch (true) {
    case REGEX.email.test(uniqueUserAttribute):
      query.email = uniqueUserAttribute.toLowerCase()
      break
    case REGEX.phone.test(uniqueUserAttribute):
      query.phone = uniqueUserAttribute
      break
    case REGEX.mondoDbObjectId.test(uniqueUserAttribute):
      query['_id'] = new mongoose.Types.ObjectId(uniqueUserAttribute)
      break
    default:
      error_msg = `The url parameter ${uniqueUserAttribute} on ${req.originalUrl} did not match any expected expression`
      return next(new AppError(error_msg, HTTP_STATUS_CODES.error.badRequest))
  }
  next()
}

exports.validateAccessCodeAnatomy = ({ params: { accessCode } }, _, next) => {
  if (REGEX.accessCode.test(accessCode)) return next()

  error_msg = `Access code must be  4 digits (example: 1234)`
  return next(new AppError(error_msg, HTTP_STATUS_CODES.error.badRequest))
}

exports.setUserForlogout = async (req, res, next) => {
  req.currentUser.isLoggedIn = false
  req.currentUser.refreshToken = undefined
  req.currentUser.accessCode = undefined
  req.currentUser.accessCodeExpires = undefined

  accessTokenCookieManager(req, res, '', true)
  next()
}
