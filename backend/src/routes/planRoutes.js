// routes/planRoutes.js
import express from 'express';
import { getPlansController } from '../controllers/planController.js';

const router = express.Router();
router.get('/', getPlansController); // publik, gak perlu login buat lihat harga

export default router;