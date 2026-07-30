import { Router } from 'express';
import { authenticate, authorizeSuperadmin } from '../middleware/authMiddleware.js';
import {
  getDashboardStats,
  getUsers,
  getUserDetail,
  createUserAnyRole,
  updateUserAnyRole,
  deleteUserAnyRole,
  getPlans,
  createPlanHandler,
  updatePlanHandler,
  deletePlanHandler,
  getOrders,
} from '../controllers/superadminController.js';

const router = Router();

// Semua route di bawah ini wajib login DAN role superadmin
router.use(authenticate, authorizeSuperadmin);

// Dashboard
router.get('/dashboard/stats', getDashboardStats);

// Users (CRUD semua role: superadmin, admin, manajer_produksi, staff_gudang, pelanggan)
router.get('/users', getUsers);
router.get('/users/:id', getUserDetail);
router.post('/users', createUserAnyRole);
router.put('/users/:id', updateUserAnyRole);
router.delete('/users/:id', deleteUserAnyRole);

// Subscription Plans (CRUD)
router.get('/plans', getPlans);
router.post('/plans', createPlanHandler);
router.put('/plans/:id', updatePlanHandler);
router.delete('/plans/:id', deletePlanHandler);

// Orders / transaksi semua pelanggan
router.get('/orders', getOrders);

export default router;