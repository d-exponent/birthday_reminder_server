const mongoose = require('mongoose')

const User = require('../models/user')
const AppError = require('../utils/app-error')
const catchAsync = require('../utils/catch-async')
const queryBuilder = require('../utils/query-builder')
const Email = require('../features/email')
const utils = require('../utils/contollers')
const { generateAccessCode, getTimeIn } = require('../utils/auth')
const {
  STATUS,
  RESPONSE,
  REGEX,
  FIND_UPDATE_OPTIONS
} = require('../settings/constants')

let error_msg
const not_found_status = STATUS.error.notFound
const NOT_FOUND_ERR = new AppError('Not found', not_found_status)

exports.createUser = catchAsync(async ({ body, currentUser }, res) => {
  const user = await User.create(body)

  let [data, message] = [user, `${user.name} was created successfully`]

  // New User
  if (!currentUser) {
    await new Email(user.name, user.email).sendAccessCode(user.accessCode)
    data = utils.defaultSelectedUserValues(user)
    message = `One time login password has been sent to ${user.email}`
  }

  utils.sendResponse(RESPONSE.success, res, {
    status: STATUS.success.created,
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

  utils.sendResponse(RESPONSE.success, res, {
    results: users.length,
    data: users
  })
})

exports.getUser = catchAsync(async ({ customQuery }, res, next) => {
  const user = await User.findOne(customQuery).exec()
  if (!user) return next(NOT_FOUND_ERR)

  utils.sendResponse(RESPONSE.success, res, {
    data: user
  })
})

exports.updateUser = catchAsync(async ({ customQuery, body }, res, next) => {
  const user = await User.findOneAndUpdate(customQuery, body, FIND_UPDATE_OPTIONS)
  if (!user) return next(NOT_FOUND_ERR)

  utils.sendResponse(RESPONSE.success, res, {
    data: user
  })
})

exports.deleteUser = catchAsync(async ({ customQuery }, res, next) => {
  const user = await User.findOne(customQuery)
  if (!user) return next(NOT_FOUND_ERR)

  await User.findOneAndDelete(customQuery)
  utils.sendResponse(RESPONSE.success, res, {
    status: STATUS.success.noContent
  })
})


//              -----   HELPER MIDDLEWARES ----     //

exports.setRequestBody = ({ body, currentUser }, _, next) => {
  if (currentUser) {
    // RESTRICTING THE POWERS OF THE ADMIN 😎
    body.refreshToken = undefined
    body.accessCode = undefined
    body.accessCodeExpires = undefined
    body.isActive = undefined
    body.isVerified = undefined
  } else {
    // A new user
    body.accessCode = generateAccessCode()
    body.accessCodeExpires = getTimeIn(10)
    body.isActive = true
    body.isVerified = false
    body.role = 'user'
  }
  next()
}

exports.setCustomQueryFromParams = (req, _, next) => {
  let { params } = req

  params = params['user_email_phone_id']
  req.customQuery = {}

  if (params) {
    switch (true) {
      case REGEX.email.test(params):
        req.customQuery.email = params.toLowerCase()
        break
      case REGEX.phone.test(params):
        req.customQuery.phone = params
        break
      case REGEX.mondoDbObjectId.test(params):
        req.customQuery['_id'] = new mongoose.Types.ObjectId(params)
        break
      default:
        error_msg = `The url parameter ${params} on ${req.originalUrl} did not match any expected expression`
        return next(new AppError(error_msg, STATUS.error.badRequest))
    }
  }

  next()
}
