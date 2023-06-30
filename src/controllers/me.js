const User = require('../models/user')
const AppError = require('../utils/app-error')
const Birthday = require('../models/birthday')
const catchAsync = require('../utils/catch-async')
const queryBuilder = require('../utils/query-builder')
const { sendResponse, defaultSelectedUserValues } = require('../utils/contollers')
const {
  HTTP_STATUS_CODES,
  RESPONSE_TYPE,
  FIND_UPDATE_OPTIONS
} = require('../settings/constants')

let error_msg
exports.getMe = catchAsync(async ({ currentUser }, res) => {
  sendResponse(RESPONSE_TYPE.success, res, {
    data: defaultSelectedUserValues(currentUser)
  })
})

exports.deleteMe = catchAsync(async (req, res) => {
  req.currentUser.isActive = false
  await req.currentUser.save()

  sendResponse(RESPONSE_TYPE.success, res, {
    status: HTTP_STATUS_CODES.success.noContent,
    message: ''
  })
})

exports.updateMe = catchAsync(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.currentUser['_id'],
    req.body,
    FIND_UPDATE_OPTIONS
  )
  sendResponse(RESPONSE_TYPE.success, res, {
    data: defaultSelectedUserValues(user)
  })
})

exports.addBirthday = catchAsync(async (req, res) => {
  sendResponse(RESPONSE_TYPE.success, res, {
    status: 201,
    data: await Birthday.create({
      ...req.body,
      owner: req.currentUser['_id']
    })
  })
})

exports.getMyBirthdays = catchAsync(async (req, res, next) => {
  const mongooseQuery = Birthday.find({ owner: req.currentUser['_id'] }).select('-owner')
  const query = new queryBuilder(mongooseQuery, req.query).fields().page().sort()
  const birthdays = await query.mongooseQuery.exec()

  if (!birthdays.length) {
    error_msg = ` There is no birthday associated with ${req.currentUser.name}`
    return next(new AppError(error_msg, HTTP_STATUS_CODES.error.notFound))
  }

  sendResponse(RESPONSE_TYPE.success, res, { results: birthdays.length, data: birthdays })
})

//              -----   HELPER MIDDLEWARES ----     //

exports.checkUserOwnsBirthday = catchAsync(async ({ method, params }, _, next) => {
  // CRUD on a birthday can only be done by the user who created it
  const birthday = await Birthday.findById(params.id).exec()

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

exports.restrictToUpdate = ({ body }, _, next) => {
  const allowed = ['name', 'email', 'phone']

  Object.keys(body).forEach((key) => {
    if (!allowed.includes(key)) {
      error_msg = `You are not allowed to update ${key}`
      return next(new AppError(error_msg, HTTP_STATUS_CODES.error.forbidden))
    }
  })

  next()
}
