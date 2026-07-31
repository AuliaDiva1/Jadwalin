import express from 'express';
import {
  createPaymentController,
  startTrialController,
  handlePaymentNotification,
  getPaymentStatusController,
  getPaymentHistoryController,
} from '../controllers/paymentController.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

router.post('/notification', handlePaymentNotification);
router.post('/checkout', verifyToken, createPaymentController);
router.post('/trial', verifyToken, startTrialController); // ⬅️ BARU: mulai uji coba gratis
router.get('/history', verifyToken, getPaymentHistoryController); // ⬅️ harus di atas /:order_id
router.get('/:order_id', verifyToken, getPaymentStatusController);

export default router;