/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const crypto = require('crypto')
const fs = require('fs/promises')
const multer = require('multer')
const sharp = require('sharp')
const BirthDay = require('../models/birthday')
const AppError = require('../utils/app-error')
const catchAsync = require('../utils/catch-async')
const BuildMongooseQuery = require('../utils/query-builder')

const {
  STATUS,
  DELETE_RESPONSE,
  FIND_UPDATE_OPTIONS,
  BIRTHDAYS_IMAGES_DIR
} = require('../settings/constants')

let errorMessage

const imagePath = imageName => `${BIRTHDAYS_IMAGES_DIR}/${imageName}`

// FILES CONTROLLERS AND MIDDLEWARES
exports.upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_, file, cb) => {
    if (file.mimetype.startsWith('image')) return cb(null, true)
    errorMessage = `${file.mimetype} is an unsupported format. Please upload only images`
    return cb(new AppError(errorMessage, STATUS.error.badRequest), false)
  }
})

exports.processImageUpload = catchAsync(
  async ({ currentUser: { name }, file, body }, _, next) => {
    if (file) {
      const uniqueId = crypto.randomBytes(16).toString('hex')

      const imageName =
        body.imageCover ||
        `${name.toLowerCase().split(' ').join('-')}-${uniqueId}.png`

      await sharp(file.buffer).resize(800).png().toFile(imagePath(imageName))
      body.imageCover = imageName
    }
    next()
  }
)

exports.getImage = catchAsync(async ({ params: { imageName } }, res) => {
  res.sendFile(imagePath(imageName))
})

exports.deleteImage = catchAsync(
  async ({ birthday, params: { imageName } }, res, next) => {
    birthday.imageCover = undefined

    const [birthdaySettled, fsSettled] = await Promise.allSettled([
      birthday.save(),
      fs.unlink(imagePath(imageName))
    ])

    if (fsSettled.status === 'rejected') {
      errorMessage = `🛑🛑, Error deleting ${imageName} from the file system on users request`
      console.error(errorMessage)
    }

    if (birthdaySettled.status === 'rejected') {
      errorMessage = 'Something went wrong deleting the image. Please try again'
      return next(new AppError(errorMessage, STATUS.error.serverError))
    }

    res.customResponse(DELETE_RESPONSE)
  }
)

exports.checkUserOwnsImage = catchAsync(async (req, _, next) => {
  const { currentUser, params } = req

  if (currentUser?.role === 'admin') return next()

  const birthdays = await BirthDay.find({
    owner: currentUser['_id'],
    imageCover: params?.imageName
  })

  if (birthdays?.length === 0) {
    errorMessage = "you don't have permission to this resource"
    return next(new AppError(errorMessage, STATUS.error.forbidden))
  }

  // eslint-disable-next-line prefer-destructuring
  req.birthday = birthdays[0]
  next()
})

// FILE CONTROLLERS AND MIDDLEWARES END **

exports.addBirthday = catchAsync(async ({ params, body }, res) => {
  res.customResponse({
    status: STATUS.success.created,
    data: await BirthDay.create({ ...body, owner: params.ownerId })
  })
})

exports.getBirthdays = catchAsync(async ({ body, query: reqQuery }, res, next) => {
  let mongooseQuery = BirthDay.find(body)
  errorMessage = 'There are no birthdays at this time'

  if (body.owner) {
    mongooseQuery = mongooseQuery.select('-owner')
    errorMessage = 'You have no saved birthdays'
  } else {
    mongooseQuery = mongooseQuery.populate({
      path: 'owner',
      select: 'name email'
    })
  }

  const query = new BuildMongooseQuery(mongooseQuery, reqQuery)
    .filter()
    .fields()
    .page()
    .sort()

  const birthdays = await query.mongooseQuery

  if (!birthdays.length) {
    return next(new AppError(errorMessage, STATUS.error.notFound))
  }

  res.customResponse({
    results: birthdays.length,
    data: birthdays
  })
})

exports.getBirthday = catchAsync(
  async ({ params: { id }, currentUser }, res, next) => {
    const populateParmas = currentUser && currentUser.role === 'admin' ? 'owner' : ''
    const birthday = await BirthDay.findById(id).populate(populateParmas)

    if (!birthday) {
      errorMessage = "The birthday doesn't exist"
      return next(new AppError(errorMessage, STATUS.error.notFound))
    }

    res.customResponse({ data: birthday })
  }
)

exports.updateBirthday = catchAsync(async ({ body, params: { id } }, res) => {
  res.customResponse({
    data: await BirthDay.findByIdAndUpdate(id, body, FIND_UPDATE_OPTIONS)
  })
})

exports.deleteBirthday = catchAsync(async ({ params: { id } }, res) => {
  await BirthDay.findByIdAndDelete(id)
  res.customResponse(DELETE_RESPONSE)
})
