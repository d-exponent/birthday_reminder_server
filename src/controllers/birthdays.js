const BirthDay = require('../models/birthday')
const AppError = require('../utils/app-error')
const catchAsync = require('../utils/catch-async')
const queryBuilder = require('../utils/query-builder')
const { sendResponse } = require('../utils/contollers')
const { STATUS, RESPONSE, FIND_UPDATE_OPTIONS } = require('../settings/constants')

let error_msg

exports.addBirthday = catchAsync(async ({ params, body }, res) => {
  sendResponse(RESPONSE.success, res, {
    status: 201,
    data: await BirthDay.create({ ...body, owner: params.ownerId })
  })
})

exports.getBirthdays = catchAsync(async ({ body, query: reqQuery }, res, next) => {
  let mongooseQuery = BirthDay.find(body)
  error_msg = 'There are no birthdays at this time'

  if (body.owner) {
    mongooseQuery = mongooseQuery.select('-owner')
    error_msg = 'You have no saved birthdays'
  } else {
    mongooseQuery = mongooseQuery.populate({
      path: 'owner',
      select: 'name email'
    })
  }

  const query = new queryBuilder(mongooseQuery, reqQuery)
    .filter()
    .fields()
    .page()
    .sort()

  const birthdays = await query.mongooseQuery

  if (!birthdays.length) {
    return next(new AppError(error_msg, STATUS.error.notFound))
  }

  sendResponse(RESPONSE.success, res, {
    results: birthdays.length,
    data: birthdays
  })
})

exports.getBirthday = catchAsync(
  async ({ params: { id }, currentUser }, res, next) => {
    const populateParmas = currentUser && currentUser.role == 'admin' ? 'owner' : ''
    const birthday = await BirthDay.findById(id).populate(populateParmas)

    if (!birthday) {
      error_msg = "The birthday doesn't exist"
      return next(new AppError(error_msg, STATUS.error.notFound))
    }

    sendResponse(RESPONSE.success, res, { data: birthday })
  }
)

exports.updateBirthday = catchAsync(async ({ body, params: { id } }, res) => {
  sendResponse(RESPONSE.success, res, {
    data: await BirthDay.findByIdAndUpdate(id, body, FIND_UPDATE_OPTIONS)
  })
})

exports.deleteBirthday = catchAsync(async ({ params: { id } }, res) => {
  await BirthDay.findByIdAndDelete(id)
  sendResponse(RESPONSE.success, res, {
    status: STATUS.success.noContent,
    message: ''
  })
})
