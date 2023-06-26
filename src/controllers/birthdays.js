const BirthDay = require('../models/birthday')
const AppError = require('../utils/app-error')
const catchAsync = require('../utils/catch-async')
const queryBuilder = require('../utils/query-builder')
const { sendResponse } = require('../utils/contollers')
const {
  HTTP_STATUS_CODES,
  RESPONSE_TYPE,
  FIND_UPDATE_OPTIONS
} = require('../settings/constants')

let error_msg

exports.checkUserOwnsBirthday = catchAsync(async (req, _, next) => {
  // CRUD on birthdays can only be done by the user who created it
  const birthday = await BirthDay.findById(req.params.id).exec()

  if (!birthday) {
    error_msg = "The requested birthday doesn't exists."
    return next(new AppError(error_msg, HTTP_STATUS_CODES.error.notFound))
  }

  const stringify = JSON.stringify
  const method = req.method

  if (stringify(birthday.owner) !== stringify(req.currentUser['_id'])) {
    const crud = method === 'PATCH' ? 'update' : method === 'DELETE' ? 'delete' : 'read'

    error_msg = `User can only ${crud} the birthday(s) that the user created`
    return next(new AppError(error_msg, HTTP_STATUS_CODES.error.forbidden))
  }

  next()
})

exports.addBirthday = catchAsync(async (req, res) => {
  sendResponse(RESPONSE_TYPE.success, res, {
    status: 201,
    data: await BirthDay.create({ ...req.body, owner: req.params.id })
  })
})

exports.getBirthdays = catchAsync(async (req, res, next) => {
  const query = new queryBuilder(BirthDay.find(), req.query)
    .filter()
    .fields()
    .page()
    .sort()

  const birthdays = await query.mongooseQuery.exec()

  if (!birthdays.length) {
    error_msg = 'There are no birthdays at this time'
    return next(new AppError(error_msg, HTTP_STATUS_CODES.error.notFound))
  }

  sendResponse(RESPONSE_TYPE.success, res, {
    results: birthdays.length,
    data: birthdays,
    status: HTTP_STATUS_CODES.success.created
  })
})

exports.getBirthdaysForOwner = catchAsync(async (req, res, next) => {
  const birthdays = await BirthDay.find({ owner: req.params.ownerId })
    .select('name month day phone email')
    .exec()

  if (!birthdays.length) {
    error_msg = ` There is no birthday associated with ${req.currentUser.name}`
    return next(new AppError(error_msg, HTTP_STATUS_CODES.error.notFound))
  }

  sendResponse(RESPONSE_TYPE.success, res, {
    data: birthdays
  })
})

exports.getBirthday = catchAsync(async ({ params: { id } }, res, next) => {
  const birthday = await BirthDay.findById(id).exec()

  if (!birthday) {
    error_msg = "The birthday doesn't exist"
    return next(new AppError(error_msg, HTTP_STATUS_CODES.error.notFound))
  }

  sendResponse(RESPONSE_TYPE.success, res, { data: birthday })
})

exports.updateBirthday = catchAsync(async ({ body, params: { id } }, res) => {
  sendResponse(RESPONSE_TYPE.success, res, {
    data: await BirthDay.findByIdAndUpdate(id, body, FIND_UPDATE_OPTIONS).exec()
  })
})

exports.deleteBirthday = catchAsync(async ({ params: { id } }, res) => {
  await BirthDay.findByIdAndDelete(id)
  sendResponse(RESPONSE_TYPE.success, res, {
    status: HTTP_STATUS_CODES.success.noContent,
    message: ''
  })
})
