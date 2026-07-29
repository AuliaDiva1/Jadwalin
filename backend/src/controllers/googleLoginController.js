import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import * as GoogleCalendarService from '../services/googleCalendarService.js';
import { saveTokens } from '../models/googleAuthModel.js';
import {
  findUserByEmail,
  findUserByGoogleId,
  linkGoogleId,
  createUser, // ⬅️ tambahin import ini
} from '../models/authModel.js';

export const redirectToGoogleLogin = (req, res) => {
  const nonce = crypto.randomBytes(16).toString('hex');

  res.cookie('g_login_state', nonce, {
    httpOnly: true,
    maxAge: 5 * 60 * 1000,
    sameSite: 'lax',
  });

  const url = GoogleCalendarService.getLoginUrl(nonce);
  res.redirect(url);
};

export const handleGoogleLoginCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    const savedState = req.cookies?.g_login_state;

    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=missing_code`);
    }

    if (!state || state !== savedState) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=invalid_state`);
    }
    res.clearCookie('g_login_state');

    const { profile, tokens } = await GoogleCalendarService.exchangeCodeForProfile(code);

    if (!profile?.email) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_email_from_google`);
    }

    let user = await findUserByGoogleId(profile.id);
    let isNewUser = false;

    if (!user) {
      user = await findUserByEmail(profile.email);

      if (!user) {
        // ⬅️ GANTI: dari redirect error jadi auto-register sebagai PELANGGAN
        const baseUsername = profile.email.split('@')[0].replace(/[^a-zA-Z0-9._-]/g, '');
        const uniqueSuffix = crypto.randomBytes(3).toString('hex');

        user = await createUser({
          username: `${baseUsername}_${uniqueSuffix}`,
          full_name: profile.name || baseUsername,
          email: profile.email,
          password: null,
          role: 'PELANGGAN',
          google_id: profile.id,
        });
        isNewUser = true;
      } else {
        if (!user.is_active) {
          return res.redirect(`${process.env.FRONTEND_URL}/login?error=account_inactive`);
        }
        await linkGoogleId(user.id, profile.id);
      }
    }

    // Simpan token calendar HANYA kalau ada refresh_token
    // (karena scope login sekarang gak minta calendar, ini biasanya bakal kosong — itu normal)
    if (tokens.refresh_token) {
      const tokenPayload = {
        accessToken: tokens.access_token,
        expiryDate: tokens.expiry_date,
        refreshToken: tokens.refresh_token,
      };
      await saveTokens(user.id, tokenPayload);
    }

    const appToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    return res.redirect(`${process.env.FRONTEND_URL}/auth/callback#token=${appToken}`);
  } catch (err) {
    console.error('Google login callback error:', err);
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=google_login_failed`);
  }
};