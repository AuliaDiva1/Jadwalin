import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import * as GoogleCalendarService from '../services/googleCalendarService.js';
import { saveTokens } from '../models/googleAuthModel.js';
import {
  findUserByEmail,
  findUserByGoogleId,
  linkGoogleId,
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
  console.log('### STEP 1: callback masuk ###');
  try {
    const { code, state } = req.query;
    const savedState = req.cookies?.g_login_state;

    if (!code) {
      console.log('### STOP: no code ###');
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=missing_code`);
    }

    if (!state || state !== savedState) {
      console.log('### STOP: state mismatch ###', { state, savedState });
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=invalid_state`);
    }
    res.clearCookie('g_login_state');

    console.log('### STEP 2: sebelum exchangeCodeForProfile ###');
    const { profile, tokens } = await GoogleCalendarService.exchangeCodeForProfile(code);
    console.log('### STEP 3: sesudah exchangeCodeForProfile ###', {
      email: profile?.email,
      hasTokens: !!tokens,
      hasRefresh: !!tokens?.refresh_token,
    });

    if (!profile?.email) {
      console.log('### STOP: no email ###');
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_email_from_google`);
    }

    let user = await findUserByGoogleId(profile.id);
    console.log('### STEP 4: findUserByGoogleId ###', { found: !!user });

    if (!user) {
      user = await findUserByEmail(profile.email);
      console.log('### STEP 5: findUserByEmail ###', { found: !!user });

      if (!user) {
        console.log('### STOP: email not registered ###');
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=email_not_registered`);
      }

      if (!user.is_active) {
        console.log('### STOP: account inactive ###');
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=account_inactive`);
      }

      await linkGoogleId(user.id, profile.id);
      console.log('### STEP 6: linkGoogleId selesai ###');
    }

    const tokenPayload = {
      accessToken: tokens.access_token,
      expiryDate: tokens.expiry_date,
    };
    if (tokens.refresh_token) {
      tokenPayload.refreshToken = tokens.refresh_token;
    }

    console.log('### STEP 7: sebelum saveTokens ###', tokenPayload);
    await saveTokens(user.id, tokenPayload);
    console.log('### STEP 8: sesudah saveTokens ###');

    const appToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    return res.redirect(`${process.env.FRONTEND_URL}/auth/callback#token=${appToken}`);
  } catch (err) {
    console.error('### CATCH ERROR ###', err);
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=google_login_failed`);
  }
};