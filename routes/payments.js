import express from 'express';
import {
  createRazorpayCheckoutOrder,
  verifyRazorpayPayment,
} from '../controllers/payments.js';
import { optionalProtect } from '../middleware/auth.js';

const router = express.Router();

router.post('/razorpay/order', optionalProtect, createRazorpayCheckoutOrder);
router.post('/razorpay/verify', verifyRazorpayPayment);

export default router;
