const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/orderController');
const { authRequired, adminRequired } = require('../middleware/auth');

router.post('/', authRequired, ctrl.createOrderFromCart);
router.get('/', authRequired, ctrl.getMyOrders);
router.get('/:id/items', authRequired, ctrl.getOrderItems);

router.get('/admin/all', authRequired, adminRequired, ctrl.adminGetAllOrders);
router.put('/admin/:id/status', authRequired, adminRequired, ctrl.adminUpdateOrderStatus);

module.exports = router;
