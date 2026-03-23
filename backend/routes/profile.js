const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/profileController');
const { authRequired } = require('../middleware/auth');

router.put('/me', authRequired, ctrl.updateMe);
router.put('/password', authRequired, ctrl.updatePassword);

// Cookie consent (per-user)
router.get('/cookie-consent', authRequired, ctrl.getCookieConsent);
router.put('/cookie-consent', authRequired, ctrl.updateCookieConsent);

// Accessibility preferences (per-user)
router.get('/accessibility-preferences', authRequired, ctrl.getAccessibilityPreferences);
router.put('/accessibility-preferences', authRequired, ctrl.updateAccessibilityPreferences);

router.get('/addresses', authRequired, ctrl.listAddresses);
router.post('/addresses', authRequired, ctrl.createAddress);
router.put('/addresses/:id', authRequired, ctrl.updateAddress);
router.delete('/addresses/:id', authRequired, ctrl.deleteAddress);

router.get('/payment-methods', authRequired, ctrl.listPaymentMethods);
router.post('/payment-methods', authRequired, ctrl.createPaymentMethod);
router.put('/payment-methods/:id', authRequired, ctrl.updatePaymentMethod);
router.delete('/payment-methods/:id', authRequired, ctrl.deletePaymentMethod);

module.exports = router;
