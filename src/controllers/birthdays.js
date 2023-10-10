const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const multer = require('multer')
const sharp = require('sharp')

const BirthDay = require('../models/birthday')
const AppError = require('../lib/app-error')
const catchAsync = require('../lib/catch-async')
const BuildMongooseQuery = require('../lib/query-builder')
const { generateAccessCode: randomDigits } = require('../lib/auth')

const {
  RESPONSE: { error: re },
  STATUS: { error: se, success: ss },
  DELETE_RESPONSE,
  FIND_UPDATE_OPTIONS,
  BIRTHDAYS_IMAGES_DIR
} = require('../settings/constants')

const imageFilePath = imageName => path.join(BIRTHDAYS_IMAGES_DIR, imageName)

const fileFilter = (_, file, cb) => {
  // Allow only image file. Detect by Mimetype.
  if (file.mimetype.startsWith('image')) return cb(null, true)
  return cb(
    new AppError(
      `${file.mimetype} is an unsupported format. Please upload only images`,
      se.badRequest
    ),
    false
  )
}

// FILES CONTROLLERS AND MIDDLEWARES
exports.upload = multer({ storage: multer.memoryStorage(), fileFilter })

exports.processImageUpload = catchAsync(
  async ({ currentUser: { name: names }, file, birthday, ...req }, _, next) => {
    if (file) {
      const imageName =
        req.method === 'PATCH' && birthday.imageCover
          ? birthday.imageCover
          : `${names.toLowerCase().split(' ').join('-')}-${crypto
              .randomBytes(16)
              .toString('hex')}-${randomDigits(6)}.png`

      await sharp(file.buffer).resize(800).png().toFile(imageFilePath(imageName))
      req.body.imageCover = imageName
    }
    next()
  }
)

exports.getImage = ({ params: { imageName } }, res) => {
  const imageFile = imageFilePath(imageName)
  fs.stat(imageFile, e => {
    if (e === null) return res.sendFile(imageFile)

    if (e.code === 'ENOENT')
      return res.sendResponse(
        { message: 'The image does not exist in our records', status: se.notFound },
        re
      )

    // Must be the client .. No? You don't agree? HMM 🤔🤔
    res.sendResponse({ message: 'Bad Request', status: se.badRequest }, re)
  })
}

exports.deleteImage = catchAsync(
  async ({ birthday, params: { imageName } }, res, next) => {
    birthday.imageCover = undefined

    const [birthdaySettled] = await Promise.allSettled([
      birthday.save(),
      fs.promises.unlink(imageFilePath(imageName))
    ])

    if (birthdaySettled.status === 'rejected') {
      return next(
        new AppError(
          'Something went wrong deleting the image. Please try again',
          se.serverError
        )
      )
    }
    res.sendResponse(DELETE_RESPONSE)
  }
)

exports.checkUserOwnsImage = catchAsync(async (req, _, next) => {
  const { currentUser, params } = req

  if (!fs.existsSync(imageFilePath(params.imageName ?? '')))
    return next(new AppError('The image does not exist on our servers', se.notFound))

  const birthdays = await BirthDay.find({
    owner: currentUser['_id'],
    imageCover: params?.imageName
  })

  if (birthdays.length === 0)
    return next(new AppError("you don't have permission to this resource", se.forbidden))

  // eslint-disable-next-line prefer-destructuring
  req.birthday = birthdays[0]
  next()
})

// ***** FILE CONTROLLERS AND MIDDLEWARES END *****

exports.addBirthday = catchAsync(async ({ params: { ownerId }, body }, res) => {
  res.sendResponse({
    status: ss.created,
    data: await BirthDay.create({ ...body, owner: ownerId })
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
    return next(new AppError(errorMessage, se.notFound))
  }

  res.sendResponse({
    results: birthdays.length,
    data: birthdays
  })
})

exports.getBirthday = catchAsync(async ({ params: { id }, currentUser }, res, next) => {
  const birthday = await BirthDay.findById(id).populate(
    currentUser && currentUser.role === 'admin' ? 'owner' : ''
  )

  if (!birthday) return next(new AppError("The birthday doesn't exist", se.notFound))

  res.sendResponse({ data: birthday })
})

exports.updateBirthday = catchAsync(async ({ body, params: { id } }, res) => {
  res.sendResponse({
    data: await BirthDay.findByIdAndUpdate(id, body, FIND_UPDATE_OPTIONS)
  })
})

exports.deleteBirthday = catchAsync(async ({ params: { id } }, res) => {
  await BirthDay.findByIdAndDelete(id)
  res.sendResponse(DELETE_RESPONSE)
})
