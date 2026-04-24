import express from 'express';
import {
  addItemsToOrder,
  getMyOrders,
  getOrders,
  getOrderById,
  updateOrderStatus,
} from '../controllers/orders.js';
import { admin, optionalProtect, protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/', optionalProtect, addItemsToOrder);
router.get('/myorders', protect, getMyOrders);
router.get('/', protect, admin, getOrders);
router.get('/:id', getOrderById);
router.put('/:id/status', protect, admin, updateOrderStatus);

export default router;
