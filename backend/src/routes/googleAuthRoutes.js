import { Router } from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import * as GoogleAuthController from '../controllers/googleAuthController.js';
import * as GoogleLoginController from '../controllers/googleLoginController.js';

const router = Router();

// Connect calendar untuk user yang SUDAH login (sudah ada sebelumnya, TIDAK berubah)
router.get('/connect', verifyToken, GoogleAuthController.redirectToGoogle);
router.get('/callback', GoogleAuthController.handleCallback);
router.get('/status', verifyToken, GoogleAuthController.checkStatus);

// Login pakai Google (BARU) - publik, belum ada user login
router.get('/login', GoogleLoginController.redirectToGoogleLogin);
router.get('/login/callback', GoogleLoginController.handleGoogleLoginCallback);

export default router;