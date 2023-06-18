const router = require('express').Router();
const userController = require('../controllers/user');

router
  .route('/:identifier')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

router.route('/').get(userController.getUsers).post(userController.createUser);

module.exports = router;
