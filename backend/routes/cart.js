const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/cartController');
const { authRequired } = require('../middleware/auth');

router.get('/', authRequired, ctrl.getCart);
router.post('/items', authRequired, ctrl.addToCart);
router.put('/items/:id', authRequired, ctrl.updateCartItem);
router.delete('/items/:id', authRequired, ctrl.removeCartItem);
router.post('/clear', authRequired, ctrl.clearCart);

module.exports = router;
