import * as GoogleCalendarService from '../services/googleCalendarService.js';
import { isConnected } from '../models/googleAuthModel.js';
import { success, error } from '../utils/response.js';

export const redirectToGoogle = (req, res) => {
  const url = GoogleCalendarService.getAuthUrl(req.user.userId);
  res.redirect(url);
};

export const handleCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    await GoogleCalendarService.saveTokensFromCode(code, state);
    res.redirect(`${process.env.FRONTEND_URL}/settings?calendar=connected`);
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    res.redirect(`${process.env.FRONTEND_URL}/settings?calendar=error`);
  }
};

export const checkStatus = async (req, res) => {
  try {
    const connected = await isConnected(req.user.userId);
    return success(res, 'Berhasil mengambil status koneksi', { connected });
  } catch (err) {
    console.error('checkStatus error:', err);
    return error(res, 'Terjadi kesalahan server');
  }
};