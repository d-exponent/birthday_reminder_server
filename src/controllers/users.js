const User = require('../models/user')
const AppError = require('../lib/app-error')
const catchAsync = require('../lib/catch-async')
const Email = require('../features/email')
const utils = require('../lib/utils')
const factory = require('./factory')
const { STATUS } = require('../settings/constants')
const BuildMongooseQuery = require('../lib/query-builder')
const { generateAccessCode, timeInMinutes } = require('../lib/auth')

exports.getUser = factory.getDoc(User)
exports.updateUser = factory.updateDoc(User)
exports.deleteUser = factory.deleteDoc(User)

exports.createUser = catchAsync(async ({ body, currentUser }, res) => {
  const user = await User.create(body)

  let [data, message] = [user, `${user.name} was created successfully`]

  if (!currentUser) {
    // User is not being created by staff here
    await new Email(user.name, user.email).sendAccessCode(user.accessCode)
    data = utils.excludeNonDefaults(user)
    message = `One time login password has been sent to ${user.email}`
  }

  res.sendResponse({
    status: STATUS.success.created,
    message,
    data
  })
})

exports.getUsers = catchAsync(async (req, res, next) => {
  const selected = utils.defaultSelectsAnd('role isLoggedIn isActive createdAt updatedAt')
  const mongooseQuery = User.find().select(selected)
  const query = new BuildMongooseQuery(mongooseQuery, req.query).fields().page().sort()

  const users = await query.mongooseQuery.exec()
  if (!users) return next(new AppError('Not found', STATUS.error.notFound))

  res.sendResponse({
    results: users.length,
    data: users
  })
})

//              -----   HELPER MIDDLEWARES ----     //
exports.setDocumentBody = ({ body, currentUser }, _, next) => {
  body.isActive = true

  if (currentUser) {
    // A staff or admin is creating a new user
    body.refreshToken = undefined
    body.accessCode = undefined
    body.accessCodeExpires = undefined
    body.isVerified = undefined
  } else {
    body.accessCode = generateAccessCode()
    body.accessCodeExpires = timeInMinutes(10)
    body.isVerified = false
    body.role = 'user'
  }
  next()
}
