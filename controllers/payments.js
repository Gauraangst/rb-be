import crypto from 'crypto';
import { buildTotals, prepareOrderInput, persistPreparedOrder } from '../lib/order-service.js';
import { signCheckoutToken, verifyCheckoutToken } from '../lib/auth.js';

const RAZORPAY_API_BASE = 'https://api.razorpay.com/v1';

const getRazorpayConfig = () => {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error('Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
  }

  return { keyId, keySecret };
};

const createRazorpayOrderRequest = async ({ amount, receipt, notes }) => {
  const { keyId, keySecret } = getRazorpayConfig();
  const authorization = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

  const response = await fetch(`${RAZORPAY_API_BASE}/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${authorization}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      currency: 'INR',
      receipt,
      notes,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Unable to create Razorpay order: ${errorText}`);
  }

  return response.json();
};

const buildPaymentSignature = ({ orderId, paymentId, secret }) =>
  crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');

// @desc    Create a Razorpay checkout order
// @route   POST /api/payments/razorpay/order
// @access  Public (optional auth)
export const createRazorpayCheckoutOrder = async (req, res) => {
  const { customer, shippingAddress, orderItems = [], notes = '' } = req.body;

  try {
    const preparedOrder = await prepareOrderInput({
      requestedItems: orderItems,
      customer,
      shippingAddress,
      paymentMethod: 'Razorpay',
      notes,
      user: req.user || null,
    });

    const totals = buildTotals(preparedOrder.itemsPrice);
    const razorpayOrder = await createRazorpayOrderRequest({
      amount: Math.round(totals.totalPrice * 100),
      receipt: `rb-${Date.now()}`.slice(0, 40),
      notes: {
        customer_email: preparedOrder.customer.email,
        item_count: String(preparedOrder.orderItems.length),
      },
    });

    const checkoutToken = signCheckoutToken({
      preparedOrder,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    });

    res.json({
      keyId: getRazorpayConfig().keyId,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      orderId: razorpayOrder.id,
      checkoutToken,
      customer: preparedOrder.customer,
    });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Unable to start Razorpay checkout' });
  }
};

// @desc    Verify Razorpay payment and create store order
// @route   POST /api/payments/razorpay/verify
// @access  Public
export const verifyRazorpayPayment = async (req, res) => {
  const {
    checkoutToken,
    razorpay_payment_id: paymentId,
    razorpay_order_id: razorpayOrderId,
    razorpay_signature: razorpaySignature,
  } = req.body;

  try {
    if (!checkoutToken || !paymentId || !razorpayOrderId || !razorpaySignature) {
      return res.status(400).json({ message: 'Missing payment verification fields' });
    }

    const { keySecret } = getRazorpayConfig();
    const decodedCheckout = verifyCheckoutToken(checkoutToken);

    if (decodedCheckout.razorpayOrderId !== razorpayOrderId) {
      return res.status(400).json({ message: 'Razorpay order mismatch' });
    }

    const generatedSignature = buildPaymentSignature({
      orderId: decodedCheckout.razorpayOrderId,
      paymentId,
      secret: keySecret,
    });

    if (generatedSignature !== razorpaySignature) {
      return res.status(400).json({ message: 'Payment signature verification failed' });
    }

    const createdOrder = await persistPreparedOrder(decodedCheckout.preparedOrder, {
      paymentStatus: 'Paid',
      paymentResult: {
        gateway: 'Razorpay',
        razorpayOrderId,
        razorpayPaymentId: paymentId,
        razorpaySignature,
      },
      paidAt: new Date().toISOString(),
    });

    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Unable to verify payment' });
  }
};
