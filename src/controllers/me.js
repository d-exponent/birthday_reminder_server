const AppError = require('../lib/app-error')
const Birthday = require('../models/birthday')
const catchAsync = require('../lib/catch-async')
const { STATUS, DELETE_RESPONSE } = require('../settings/constants')

exports.deleteMe = catchAsync(async (req, res) => {
  req.currentUser.isActive = false
  req.currentUser.isVerified = false

  await req.currentUser.save()
  res.sendResponse(DELETE_RESPONSE)
})

//              -----   HELPER MIDDLEWARES ----     //
exports.setMyIdOnParams = ({ params, currentUser }, _, next) => {
  params['user_email_phone_id'] = currentUser['_id']
  params.ownerId = currentUser['_id']
  next()
}

exports.setBodyAddOwner = ({ body, currentUser }, _, next) => {
  body.owner = currentUser['_id']
  next()
}

exports.checkUserOwnsBirthday = catchAsync(async (req, _, next) => {
  const { method, params, currentUser } = req
  const birthday = await Birthday.findById(params.id)

  if (!birthday) {
    return next(
      new AppError("The requested birthday doesn't exists.", STATUS.error.notFound)
    )
  }

  if (JSON.stringify(birthday.owner) !== JSON.stringify(currentUser['_id'])) {
    let crud

    switch (method) {
      case 'PATCH':
        crud = 'update'
        break
      case 'DELETE':
        crud = 'delete'
        break
      default:
        crud = 'read'
        break
    }
    return next(
      new AppError(
        `You can only ${crud} the birthday(s) that the you created`,
        STATUS.error.forbidden
      )
    )
  }

  req.birthday = birthday
  next()
})

exports.restrictToUpdate = ({ body }, _, next) => {
  const allowed = ['email', 'phone']
  Object.keys(body).forEach(key => {
    if (!allowed.includes(key)) {
      return next(
        new AppError(
          `You are not allowed to update the /${key}/ on this route`,
          STATUS.error.forbidden
        )
      )
    }
  })

  next()
}
