// routes/subscriptionRoutes.js
import express from 'express';
import { getMySubscription } from '../controllers/subscriptionController.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();
router.get('/me', verifyToken, getMySubscription);

export default router;