const router = require('express').Router();
const authController = require('../controllers/auth');

router
  .route('/login/:identifier')
  .get(authController.requestAccessCode)
  .patch(authController.login);

module.exports = router;
