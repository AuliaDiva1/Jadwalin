import express from 'express';
import {
  createPaymentController,
  handlePaymentNotification,
  getPaymentStatusController,
} from '../controllers/paymentController.js';

const router = express.Router();

router.post('/notification', handlePaymentNotification);
router.post('/checkout', createPaymentController);
router.get('/:order_id', getPaymentStatusController);

export default router;