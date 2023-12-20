const fs = require('fs')

const AppError = require('../lib/app-error')
const catchAsync = require('../lib/catch-async')
const { getImageFilePath } = require('../lib/utils')
const { RESPONSE, STATUS, DELETE_RESPONSE } = require('../settings/constants')

const NOT_FOUND_ERR = new AppError('Not found', STATUS.error.notFound)

/**
 *
 * @param {'users' | 'birthdays'} directory
 * @returns
 */
exports.handleGetImage =
  directory =>
  async ({ params: { imageName } }, res) => {
    const imageFile = getImageFilePath(imageName, directory)

    try {
      await fs.promises.stat(imageFile) // Check if the image exist
      res.sendFile(imageFile)
    } catch (e) {
      if (e.code === 'ENOENT') {
        return res.sendResponse(
          {
            message: 'The image does not exist in our records',
            status: STATUS.error.notFound
          },
          RESPONSE.error
        )
      }
      res.sendResponse(
        { message: 'Bad Request', status: STATUS.error.badRequest },
        RESPONSE.error
      )
    }
  }

exports.getDoc = (Model, modelType) =>
  catchAsync(async ({ params: { id }, currentUser }, res, next) => {
    const query = Model.findById(id)

    if (modelType === 'birthday')
      query.populate(currentUser && currentUser.role === 'admin' ? 'owner' : '')

    const doc = await query
    if (!doc) return next(NOT_FOUND_ERR)
    res.sendResponse({ data: doc })
  })

exports.updateDoc = (Model, modelType) =>
  catchAsync(async ({ params: { id }, body, domain }, res, next) => {
    const doc = await Model.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true
    })

    if (!doc) return next(NOT_FOUND_ERR)
    if (modelType === 'birthday') doc.prependURLEndpointToImageCover(domain)

    res.sendResponse({ data: doc })
  })

exports.deleteDoc = Model =>
  catchAsync(async ({ params: { id } }, res) => {
    await Model.findByIdAndDelete(id)
    res.sendResponse(DELETE_RESPONSE)
  })
