import express from 'express';
import {
  createPaymentController,
  handlePaymentNotification,
  getPaymentStatusController,
} from '../controllers/paymentController.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

router.post('/notification', handlePaymentNotification);
router.post('/checkout', verifyToken, createPaymentController);
router.get('/:order_id', verifyToken, getPaymentStatusController);

export default router;