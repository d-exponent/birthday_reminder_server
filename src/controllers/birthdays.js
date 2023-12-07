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

const attachHttpFullPathToImageCover = (currentHttpDomain, birthdayDoc) => {
  if (birthdayDoc.imageCover) {
    birthdayDoc.imageCover = `${currentHttpDomain}/api/v1/users/me/birthdays/images/${birthdayDoc.imageCover}`
  }
}

const birthdayImageFile = imageName => path.join(BIRTHDAYS_IMAGES_DIR, imageName)

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
  async ({ currentUser: { name: names }, file, birthday, body, method }, _, next) => {
    if (file) {
      const imageName =
        method === 'PATCH' && birthday.imageCover
          ? birthday.imageCover
          : `${names.toLowerCase().split(' ').join('-')}-${crypto
              .randomBytes(5)
              .toString('hex')}-${randomDigits(5)}.png`

      await sharp(file.buffer).resize(800).png().toFile(birthdayImageFile(imageName))
      body.imageCover = imageName
    }
    next()
  }
)

exports.getImage = ({ params: { imageName } }, res) => {
  const imageFile = birthdayImageFile(imageName)

  fs.stat(imageFile, e => {
    // Send the file if it exists
    if (e === null) return res.sendFile(imageFile)

    // handle response if the file does not exist
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
      fs.promises.unlink(birthdayImageFile(imageName))
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

exports.checkUserOwnsImage = catchAsync(
  async ({ currentUser, params: { imageName }, ...req }, _, next) => {
    // Check that the image is associated with the current user
    const birthdays = await BirthDay.find({
      owner: currentUser['_id'],
      imageCover: imageName ?? ''
    })

    if (birthdays.length === 0)
      return next(
        new AppError(`Couldn't find ${imageName} for ${currentUser.name}`, se.notFound)
      )

    const [birthday] = birthdays
    req.birthday = birthday
    next()
  }
)

// ***** FILE CONTROLLERS AND MIDDLEWARES END *****

exports.addBirthday = catchAsync(async ({ params: { ownerId }, body, domain }, res) => {
  const newBirthday = await BirthDay.create({ ...body, owner: ownerId })

  attachHttpFullPathToImageCover(domain, newBirthday)
  res.sendResponse({
    status: ss.created,
    data: newBirthday
  })
})

exports.getBirthdays = catchAsync(
  async ({ body, query: reqQuery, domain }, res, next) => {
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

    birthdays.forEach(birthday => attachHttpFullPathToImageCover(domain, birthday))

    res.sendResponse({
      results: birthdays.length,
      data: birthdays
    })
  }
)

exports.getBirthday = catchAsync(
  async ({ params: { id }, currentUser, domain }, res, next) => {
    const birthday = await BirthDay.findById(id).populate(
      currentUser && currentUser.role === 'admin' ? 'owner' : ''
    )

    if (!birthday) return next(new AppError("The birthday doesn't exist", se.notFound))

    attachHttpFullPathToImageCover(domain, birthday)
    res.sendResponse({ data: birthday })
  }
)

exports.updateBirthday = catchAsync(async ({ body, params: { id }, domain }, res) => {
  // Prepend http(S) path to image file name

  const updatedBirthday = await BirthDay.findByIdAndUpdate(id, body, FIND_UPDATE_OPTIONS)

  attachHttpFullPathToImageCover(domain, updatedBirthday)

  res.sendResponse({
    data: updatedBirthday
  })
})

exports.deleteBirthday = catchAsync(async ({ params: { id } }, res) => {
  await BirthDay.findByIdAndDelete(id)
  res.sendResponse(DELETE_RESPONSE)
})
