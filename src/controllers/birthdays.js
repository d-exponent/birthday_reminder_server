const crypto = require('crypto')
const fs = require('fs/promises')
const multer = require('multer')
const sharp = require('sharp')
const BirthDay = require('../models/birthday')
const AppError = require('../utils/app-error')
const catchAsync = require('../utils/catch-async')
const queryBuilder = require('../utils/query-builder')

const {
  STATUS,
  DELETE_RESPONSE,
  FIND_UPDATE_OPTIONS,
  BIRTHDAYS_IMAGES_DIR
} = require('../settings/constants')

let error_msg

const fullImageFilePath = imageName => `${BIRTHDAYS_IMAGES_DIR}/${imageName}`

// FILES CONTROLLERS AND MIDDLEWARES
const multerFilter = (_, file, cb) => {
  if (file.mimetype.startsWith('image')) return cb(null, true)
  error_msg = `${file.mimetype} is an unsupported format. Please upload only images`
  return cb(new AppError(error_msg, STATUS.error.badRequest), false)
}

exports.upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: multerFilter
})

exports.processImageUpload = catchAsync(
  async ({ currentUser: { name }, file, body }, _, next) => {
    if (file) {
      const uniqueId = crypto.randomBytes(16).toString('hex')

      const imageName =
        body.imageCover ||
        `${name.toLowerCase().split(' ').join('-')}-${uniqueId}.png`

      await sharp(file.buffer).resize(800).png().toFile(fullImageFilePath(imageName))
      body.imageCover = imageName
    }
    next()
  }
)

exports.getImage = catchAsync(async ({ params: { imageName } }, res) => {
  res.sendFile(fullImageFilePath(imageName))
})

exports.deleteImage = catchAsync(
  async ({ birthday, params: { imageName } }, res, next) => {
    birthday.imageCover = undefined

    const [birthdaySettled, fsSettled] = await Promise.allSettled([
      birthday.save(),
      fs.unlink(fullImageFilePath(imageName))
    ])

    if (fsSettled.status === 'rejected') {
      error_msg = `🛑🛑, Error deleting ${imageName} from the file system on users request`
      console.error(error_msg)
    }

    if (birthdaySettled.status === 'rejected') {
      error_msg = 'Something went wrong deleting the image. Please try again'
      return next(new AppError(error_msg, STATUS.error.serverError))
    }

    res.customResponse(DELETE_RESPONSE)
  }
)

exports.checkUserOwnsImage = catchAsync(async (req, _, next) => {
  const { currentUser, params } = req

  if (currentUser.role === 'admin') return next()

  const birthdays = await BirthDay.find({
    owner: currentUser['_id'],
    imageCover: params.imageName
  })

  if (birthdays.length === 0) {
    error_msg = "you don't have permission to this resource"
    return next(new AppError(error_msg, STATUS.error.forbidden))
  }

  req.birthday = birthdays[0]
  next()
})

// FILE CONTROLLERS AND MIDDLEWARES END **

exports.addBirthday = catchAsync(async ({ params, body }, res) => {
  res.customResponse({
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

  res.customResponse({
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
