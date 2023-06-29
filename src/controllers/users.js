const User = require('../models/user')
const AppError = require('../utils/app-error')
const catchAsync = require('../utils/catch-async')
const queryBuilder = require('../utils/query-builder')
const Email = require('../features/email')

const {
  sendResponse,
  includeOnly,
  purifyDoc,
  baseSelect
} = require('../utils/contollers')

const {
  HTTP_STATUS_CODES,
  RESPONSE_TYPE,
  FIND_UPDATE_OPTIONS
} = require('../settings/constants')

const NOT_FOUND_ERR = new AppError('Not found', HTTP_STATUS_CODES.error.notFound)

exports.createUser = catchAsync(async (req, res) => {
  const { body, currentUser } = req
  const user = await User.create(body)

  let [data, message] = [user, `${user.name} was created successfully`]

  // New User
  if (!currentUser) {
    await new Email(user.name, user.email).sendAccessCode(user.accessCode)
    data = includeOnly(purifyDoc(user), 'id', 'name', 'email', 'phone')
    message = `One time login password has been sent to ${user.email}`
  }

  sendResponse(RESPONSE_TYPE.success, res, {
    status: HTTP_STATUS_CODES.success.created,
    message,
    data,
  })
})

exports.getUsers = catchAsync(async (req, res, next) => {
  const selected = baseSelect('role isLoggedIn isActive createdAt updatedAt')
  const mongooseQuery = User.find().select(selected)
  const query = new queryBuilder(mongooseQuery, req.query).fields().page().sort()
  const users = await query.mongooseQuery.exec()

  if (!users) return next(NOT_FOUND_ERR)
  sendResponse(RESPONSE_TYPE.success, res, { results: users.length, data: users })
})

exports.getUser = catchAsync(async ({ customQuery }, res, next) => {
  const user = await User.findOne(customQuery).exec()
  if (!user) return next(NOT_FOUND_ERR)

  sendResponse(RESPONSE_TYPE.success, res, { data: user })
})

exports.updateUser = catchAsync(async ({ customQuery, body }, res, next) => {
  const user = await User.findOneAndUpdate(customQuery, body, FIND_UPDATE_OPTIONS)
  if (!user) return next(NOT_FOUND_ERR)

  sendResponse(RESPONSE_TYPE.success, res, { data: user })
})

exports.deleteUser = catchAsync(async ({ customQuery }, res, next) => {
  const user = await User.findOne(customQuery)
  if (!user) return next(NOT_FOUND_ERR)

  await User.findOneAndDelete(customQuery)
  sendResponse(RESPONSE_TYPE.success, res, {
    status: HTTP_STATUS_CODES.success.noContent
  })
})
