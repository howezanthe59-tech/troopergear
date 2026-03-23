const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/wishlistController');
const { authRequired } = require('../middleware/auth');

router.get('/', authRequired, ctrl.getWishlist);
router.post('/items', authRequired, ctrl.addToWishlist);
router.delete('/items/:id', authRequired, ctrl.removeFromWishlist);
router.post('/clear', authRequired, ctrl.clearWishlist);

module.exports = router;
