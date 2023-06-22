const BirthDay = require('../models/birthday')
const AppError = require('../utils/appError')
const catchAsync = require('../utils/catchAsync')
const { sendResponse } = require('../utils/contollers')
const {
  HTTP_STATUS_CODES,
  RESPONSE_TYPE,
  FIND_UPDATE_OPTIONS
} = require('../settings/constants')

exports.checkUserOwnsBirthday = catchAsync(async (req, _, next) => {
  // CRUD on birthdays can only be done by the user who created it
  const birthday = await BirthDay.findById(req.params.id).exec()

  if (!birthday) {
    return next(
      new AppError(
        "The requested birthday doesn't exists.",
        HTTP_STATUS_CODES.error.notFound
      )
    )
  }

  const stringify = JSON.stringify
  const method = req.method

  if (stringify(birthday.owner) !== stringify(req.currentUser['_id'])) {
    const crud = method === 'PATCH' ? 'update' : method === 'DELETE' ? 'delete' : 'read'

    return next(
      new AppError(
        `User can only ${crud} the birthday(s) that the user created`,
        HTTP_STATUS_CODES.error.forbidden
      )
    )
  }

  next()
})

exports.addBirthday = catchAsync(async (req, res) => {
  sendResponse(RESPONSE_TYPE.success, res, {
    status: 201,
    data: await BirthDay.create({ ...req.body, owner: req.params.id })
  })
})

exports.getBirthdays = catchAsync(async (_, res, next) => {
  const birthdays = await BirthDay.find().exec()

  if (!birthdays.length) {
    return next(
      new AppError(
        'There are no birthdays at this time',
        HTTP_STATUS_CODES.error.notFound
      )
    )
  }

  sendResponse(RESPONSE_TYPE.success, res, {
    data: birthdays,
    status: HTTP_STATUS_CODES.success.created
  })
})

exports.getBirthdaysForOwner = catchAsync(async (req, res, next) => {
  const birthdays = await BirthDay.find({ owner: req.params.ownerId })
    .select('name month day phone email')
    .exec()

  if (!birthdays.length) {
    return next(
      new AppError(
        ` There is no birthday associated with ${req.currentUser.name}`,
        HTTP_STATUS_CODES.error.notFound
      )
    )
  }

  sendResponse(RESPONSE_TYPE.success, res, {
    data: birthdays
  })
})

exports.getBirthday = catchAsync(async ({ params: { id } }, res, next) => {
  const birthday = await BirthDay.findById(id).exec()
  if (!birthday) {
    return next(
      new AppError("The birthday doesn't exist", HTTP_STATUS_CODES.error.notFound)
    )
  }

  sendResponse(RESPONSE_TYPE.success, res, {
    data: birthday
  })
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
