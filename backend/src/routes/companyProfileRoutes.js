import express from 'express';
import {
  getMyCompanyProfile,
  saveCompanyProfile,
  getCompletedProfileCount,
} from '../controllers/companyProfileController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/me', authenticate, getMyCompanyProfile);
router.post('/', authenticate, saveCompanyProfile);
router.get('/completed-count', authenticate, getCompletedProfileCount);

export default router;