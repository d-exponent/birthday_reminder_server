const mongoose = require('mongoose')

const User = require('../models/user')
const AppError = require('../utils/app-error')
const catchAsync = require('../utils/catch-async')
const queryBuilder = require('../utils/query-builder')
const Email = require('../features/email')
const utils = require('../utils/contollers')
const constants = require('../settings/constants')
const { generateAccessCode, getTimeIn } = require('../utils/auth')

let error_msg
const not_found_status = constants.HTTP_STATUS_CODES.error.notFound
const NOT_FOUND_ERR = new AppError('Not found', not_found_status)

exports.createUser = catchAsync(async (req, res) => {
  const { body, currentUser } = req
  const user = await User.create(body)

  let [data, message] = [user, `${user.name} was created successfully`]

  // New User
  if (!currentUser) {
    await new Email(user.name, user.email).sendAccessCode(user.accessCode)
    data = utils.includeOnly(
      utils.purifyDoc(user),
      'id',
      'name',
      'email',
      'phone',
      'role'
    )
    message = `One time login password has been sent to ${user.email}`
  }

  utils.sendResponse(constants.RESPONSE_TYPE.success, res, {
    status: constants.HTTP_STATUS_CODES.success.created,
    message,
    data
  })
})

exports.getUsers = catchAsync(async (req, res, next) => {
  const selected = utils.baseSelect('role isLoggedIn isActive createdAt updatedAt')
  const mongooseQuery = User.find().select(selected)
  const query = new queryBuilder(mongooseQuery, req.query).fields().page().sort()
  const users = await query.mongooseQuery.exec()

  if (!users) return next(NOT_FOUND_ERR)

  utils.sendResponse(constants.RESPONSE_TYPE.success, res, {
    results: users.length,
    data: users
  })
})

exports.getUser = catchAsync(async ({ customQuery }, res, next) => {
  const user = await User.findOne(customQuery).exec()
  if (!user) return next(NOT_FOUND_ERR)

  utils.sendResponse(constants.RESPONSE_TYPE.success, res, { data: user })
})

exports.updateUser = catchAsync(async ({ customQuery, body }, res, next) => {
  const user = await User.findOneAndUpdate(
    customQuery,
    body,
    constants.FIND_UPDATE_OPTIONS
  )
  if (!user) return next(NOT_FOUND_ERR)

  utils.sendResponse(constants.RESPONSE_TYPE.success, res, { data: user })
})

exports.deleteUser = catchAsync(async ({ customQuery }, res, next) => {
  const user = await User.findOne(customQuery)
  if (!user) return next(NOT_FOUND_ERR)

  await User.findOneAndDelete(customQuery)
  utils.sendResponse(constants.RESPONSE_TYPE.success, res, {
    status: constants.HTTP_STATUS_CODES.success.noContent
  })
})

//              -----   HELPER MIDDLEWARES ----     //

exports.setRequestBody = ({ body, currentUser }, _, next) => {
  // Ensure we have a valid email on body
  if (!constants.REGEX.email.test(body.email)) {
    error_msg = "Provide the valid user's email address on the request body"
    return next(
      new AppError(error_msg, constants.HTTP_STATUS_CODES.error.badRequest)
    )
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

exports.setCustomQueryFromParams = (req, _, next) => {
  const { params } = req
  const regex = constants.REGEX
  req.customQuery = {}

  if (params['user_email_phone_id']) {
    paramsValue = params['user_email_phone_id']

    switch (true) {
      case regex.email.test(paramsValue):
        req.customQuery.email = paramsValue.toLowerCase()
        break
      case regex.phone.test(paramsValue):
        req.customQuery.phone = paramsValue
        break
      case regex.mondoDbObjectId.test(paramsValue):
        req.customQuery['_id'] = new mongoose.Types.ObjectId(paramsValue)
        break
      default:
        error_msg = `The url parameter ${paramsValue} on ${req.originalUrl} did not match any expected expression`
        return next(
          new AppError(error_msg, constants.HTTP_STATUS_CODES.error.badRequest)
        )
    }
  }

  next()
}
