const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/productController');
const { authRequired, adminRequired } = require('../middleware/auth');
const { productImageUpload } = require('../middleware/productUpload');

router.get('/',    ctrl.getAllProducts);
router.get('/:id', ctrl.getProductById);
router.post(
  '/',
  authRequired,
  adminRequired,
  productImageUpload.single('image'),
  ctrl.createProduct
);
router.put(
  '/:id',
  authRequired,
  adminRequired,
  productImageUpload.single('image'),
  ctrl.updateProduct
);
router.delete('/:id', authRequired, adminRequired, ctrl.deleteProduct);

module.exports = router;
