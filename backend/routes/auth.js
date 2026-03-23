const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/authController');
const { authRequired } = require('../middleware/auth');

router.post('/login',    ctrl.login);
router.post('/admin/login', ctrl.adminLogin);
router.post('/register', ctrl.register);
router.post('/forgot-password', ctrl.forgotPassword);
router.post('/reset-password', ctrl.resetPassword);
router.get('/me', authRequired, ctrl.me);

module.exports = router;
