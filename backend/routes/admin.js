const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/adminController');
const { authRequired, adminRequired } = require('../middleware/auth');

router.get('/users', authRequired, adminRequired, ctrl.getUsers);
router.get('/customers', authRequired, adminRequired, ctrl.getCustomers);
router.put('/users/:id/role', authRequired, adminRequired, ctrl.updateUserRole);

module.exports = router;
