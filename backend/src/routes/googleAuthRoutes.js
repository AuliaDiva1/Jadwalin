import { Router } from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import * as GoogleAuthController from '../controllers/googleAuthController.js';
import * as AuthController from '../controllers/authController.js'; // ⬅️ ganti import

const router = Router();

// Connect calendar untuk user yang SUDAH login (tetap sama, tidak berubah)
router.get('/connect', verifyToken, GoogleAuthController.redirectToGoogle);
router.get('/callback', GoogleAuthController.handleCallback);
router.get('/status', verifyToken, GoogleAuthController.checkStatus);

// Login pakai Google — publik, pakai authController (auto-register PELANGGAN)
router.get('/login', AuthController.googleLogin);
router.get('/login/callback', AuthController.googleLoginCallback);

export default router;