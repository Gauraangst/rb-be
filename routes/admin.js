import express from 'express';
import {
  createAdminProduct,
  deleteAdminProduct,
  getAdminDashboard,
  getAdminOrders,
  getAdminProducts,
  getAdminReviews,
  updateAdminOrder,
  updateAdminProduct,
} from '../controllers/admin.js';
import { admin, protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect, admin);

router.get('/dashboard', getAdminDashboard);
router.get('/products', getAdminProducts);
router.post('/products', createAdminProduct);
router.put('/products/:id', updateAdminProduct);
router.delete('/products/:id', deleteAdminProduct);
router.get('/orders', getAdminOrders);
router.put('/orders/:id/status', updateAdminOrder);
router.get('/reviews', getAdminReviews);

export default router;
