/* eslint-disable no-param-reassign */
const AppError = require('../utils/app-error')
const Birthday = require('../models/birthday')
const catchAsync = require('../utils/catch-async')
const { STATUS } = require('../settings/constants')

let errorMessage

exports.deleteMe = catchAsync(async (req, res) => {
  req.currentUser.isActive = false
  req.currentUser.isVerified = false
  await req.currentUser.save()

  res.customResponse({
    status: STATUS.success.noContent,
    message: ''
  })
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

exports.checkUserOwnsBirthday = catchAsync(
  async ({ method, params, currentUser }, _, next) => {
    const birthday = await Birthday.findById(params.id)

    if (!birthday) {
      errorMessage = "The requested birthday doesn't exists."
      return next(new AppError(errorMessage, STATUS.error.notFound))
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
      errorMessage = `You can only ${crud} the birthday(s) that the you created`
      return next(new AppError(errorMessage, STATUS.error.forbidden))
    }
    next()
  }
)

exports.restrictToUpdate = ({ body }, _, next) => {
  const allowed = ['name', 'phone']
  Object.keys(body).forEach(key => {
    if (!allowed.includes(key)) {
      errorMessage = `You are not allowed to update the /${key}/ on this route`
      return next(new AppError(errorMessage, STATUS.error.forbidden))
    }
  })

  next()
}
