import express from 'express';
import {
  createPaymentController,
  handlePaymentNotification,
  getPaymentStatusController,
  getPaymentHistoryController,
} from '../controllers/paymentController.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

router.post('/notification', handlePaymentNotification);
router.post('/checkout', verifyToken, createPaymentController);
router.get('/history', verifyToken, getPaymentHistoryController); // ⬅️ harus di atas /:order_id
router.get('/:order_id', verifyToken, getPaymentStatusController);

export default router;