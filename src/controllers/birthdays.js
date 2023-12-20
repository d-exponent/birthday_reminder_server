const fs = require('fs')
const crypto = require('crypto')
const multer = require('multer')
const sharp = require('sharp')

const BirthDay = require('../models/birthday')
const AppError = require('../lib/app-error')
const catchAsync = require('../lib/catch-async')
const BuildMongooseQuery = require('../lib/query-builder')

const factory = require('./factory')
const { getImageFilePath } = require('../lib/utils')
const { STATUS, DELETE_RESPONSE } = require('../settings/constants')
const { generateAccessCode: randomDigits } = require('../lib/auth')

exports.getImage = factory.handleGetImage('birthdays')
exports.getBirthday = factory.getDoc(BirthDay, 'birthday')
exports.updateBirthday = factory.updateDoc(BirthDay, 'birthday')
exports.deleteBirthday = factory.deleteDoc(BirthDay)

exports.addBirthday = catchAsync(async ({ params: { ownerId }, body, domain }, res) => {
  const newBirthday = await BirthDay.create({ ...body, owner: ownerId })
  newBirthday.prependURLEndpointToImageCover(domain)

  res.sendResponse({
    status: STATUS.success.created,
    data: newBirthday
  })
})

exports.getBirthdays = catchAsync(async ({ body, query: reqQuery }, res, next) => {
  let mongooseQuery = BirthDay.find(body)
  let errorMessage = 'There are no birthdays at this time'

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

  res.sendResponse({
    results: birthdays.length,
    data: birthdays
  })
})

exports.deleteImage = catchAsync(
  async ({ birthday, params: { imageName } }, res, next) => {
    birthday.imageCover = undefined

    const [birthdaySettled] = await Promise.allSettled([
      birthday.save(),
      fs.promises.unlink(getImageFilePath(imageName))
    ])

    if (birthdaySettled.status === 'rejected') {
      return next(
        new AppError(
          'Something went wrong deleting the image. Please try again',
          STATUS.error.serverError
        )
      )
    }
    res.sendResponse(DELETE_RESPONSE)
  }
)

// FILES CONTROLLERS AND MIDDLEWARES
exports.upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_, file, cb) => {
    if (file.mimetype.startsWith('image')) return cb(null, true)

    const message = `${file.mimetype} is an unsupported format. Please upload only images`
    return cb(new AppError(message, STATUS.error.badRequest), false)
  }
})

exports.processImageUpload = catchAsync(
  async ({ currentUser: { name: names }, file, birthday, body, method }, _, next) => {
    //
    if (file) {
      const imageName =
        method === 'PATCH' && birthday.imageCover
          ? birthday.imageCover
          : `${names.toLowerCase().split(' ').join('-')}-${crypto
              .randomBytes(5)
              .toString('hex')}-${randomDigits(5)}.png`

      await sharp(file.buffer).resize(800).png().toFile(getImageFilePath(imageName))
      body.imageCover = imageName
    }

    next()
  }
)

exports.checkUserOwnsImage = catchAsync(
  async ({ currentUser, params: { imageName }, ...req }, _, next) => {
    // Check that the image is associated with the current user
    const birthdays = await BirthDay.find({
      owner: currentUser['_id'],
      imageCover: imageName ?? ''
    })

    if (birthdays.length === 0)
      return next(
        new AppError(
          `Couldn't find ${imageName} for ${currentUser.name}`,
          STATUS.error.notFound
        )
      )

    const [birthday] = birthdays
    req.birthday = birthday
    next()
  }
)
