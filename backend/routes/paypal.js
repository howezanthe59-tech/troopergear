// paypal.js (backend route file)
const express = require('express');
const router = express.Router();
const paypal = require('@paypal/checkout-server-sdk');

// Configure sandbox environment
const environment = new paypal.core.SandboxEnvironment(
  'AbA_SsoLxNQRE8bIDIHvpuSDtVlkS7ShaTyAvvbFGPumU412llkvoZ8EyROZBuvmsHuNGWC_R-jIJXfT',     
  'YEMrakQh45mA97gIiZ5nLLN2Vcw2ToORvQHYmnGDjrlxO_JqdC4BvQzrxrJURWFAoqWdTdC-lbRcWnm0p'         
);
const client = new paypal.core.PayPalHttpClient(environment);

// Route 1: Create an order
router.post('/create-order', async (req, res) => {
  const { amount } = req.body; // e.g. { amount: "49.99" }

  const request = new paypal.orders.OrdersCreateRequest();
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{
      amount: {
        currency_code: 'USD',
        value: amount
      }
    }]
  });

  try {
    const order = await client.execute(request);
    res.json({ id: order.result.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route 2: Capture (complete) the order after buyer approves
router.post('/capture-order', async (req, res) => {
  const { orderID } = req.body;
  const request = new paypal.orders.OrdersCaptureRequest(orderID);

  try {
    const capture = await client.execute(request);
    res.json({ status: capture.result.status }); // "COMPLETED"
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;