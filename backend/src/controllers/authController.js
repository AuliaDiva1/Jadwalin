// src/controllers/authController.js
import {
  findUserByEmail,
  findUserByUsername,
  createUser,
  countByRole,
  addLoginHistory,
  blacklistToken,
  isTokenBlacklisted,
  updatePassword,
  getAllUsers,
  updateUserStatus,
  findUserById,
  findUserByGoogleId,
  linkGoogleId,
} from '../models/authModel.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import { success, error } from '../utils/response.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { getLoginUrl, exchangeCodeForProfile } from '../services/googleCalendarService.js';

// ─── Register ────────────────────────────────────────────────────────────────
export const register = async (req, res) => {
  try {
    const { username, full_name, email, password } = req.body;

    if (!username || !full_name || !email || !password) {
      return error(res, 'Semua field wajib diisi', 400);
    }

    const adminCount = await countByRole('ADMIN');
    if (adminCount > 0) {
      if (!req.user || req.user.role !== 'ADMIN') {
        return error(res, 'Registrasi hanya bisa dilakukan oleh ADMIN', 403);
      }
    }

    const emailExists = await findUserByEmail(email);
    if (emailExists) return error(res, 'Email sudah terdaftar', 400);

    const usernameExists = await findUserByUsername(username);
    if (usernameExists) return error(res, 'Username sudah digunakan', 400);

    const hashed = await hashPassword(password);
    const role = adminCount === 0 ? 'ADMIN' : (req.body.role || 'STAFF_GUDANG');

    const user = await createUser({ username, full_name, email, password: hashed, role });

    return success(res, 'Registrasi berhasil', {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
    }, 201);
  } catch (err) {
    console.error('register error:', err);
    return error(res, 'Terjadi kesalahan server');
  }
};

// ─── Login ───────────────────────────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const ip        = req.ip;
    const userAgent = req.headers['user-agent'];

    if (!email || !password) {
      return error(res, 'Email dan password wajib diisi', 400);
    }

    const user = await findUserByEmail(email);

    if (!user) {
      await addLoginHistory({ userId: null, action: 'LOGIN', status: 'FAILED', ip, userAgent });
      return error(res, 'Email atau password salah', 401);
    }

    if (!user.is_active) {
      return error(res, 'Akun Anda telah dinonaktifkan', 403);
    }

    if (!user.password) {
      return error(res, 'Akun ini terdaftar via Google, silakan gunakan tombol "Login dengan Google"', 400);
    }

    const valid = await comparePassword(password, user.password);
    if (!valid) {
      await addLoginHistory({ userId: user.id, action: 'LOGIN', status: 'FAILED', ip, userAgent });
      return error(res, 'Email atau password salah', 401);
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    await addLoginHistory({ userId: user.id, action: 'LOGIN', status: 'SUCCESS', ip, userAgent });

    return success(res, 'Login berhasil', {
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('login error:', err);
    return error(res, 'Terjadi kesalahan server');
  }
};

// ─── Logout ──────────────────────────────────────────────────────────────────
export const logout = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token      = authHeader && authHeader.split(' ')[1];

    if (!token) return error(res, 'Token tidak ditemukan', 400);

    const decoded  = jwt.decode(token);
    const expiredAt = decoded?.exp
      ? new Date(decoded.exp * 1000)
      : new Date(Date.now() + 8 * 60 * 60 * 1000);

    await blacklistToken(token, expiredAt);
    await addLoginHistory({
      userId    : req.user.userId,
      action    : 'LOGOUT',
      status    : 'SUCCESS',
      ip        : req.ip,
      userAgent : req.headers['user-agent'],
    });

    return success(res, 'Logout berhasil');
  } catch (err) {
    console.error('logout error:', err);
    return error(res, 'Terjadi kesalahan server');
  }
};

// ─── Get Profile ─────────────────────────────────────────────────────────────
export const getProfile = async (req, res) => {
  try {
    const user = await findUserById(req.user.userId);
    if (!user) return error(res, 'User tidak ditemukan', 404);
    return success(res, 'Berhasil mengambil profil', user);
  } catch (err) {
    console.error('getProfile error:', err);
    return error(res, 'Terjadi kesalahan server');
  }
};

// ─── Change Password ─────────────────────────────────────────────────────────
export const changePassword = async (req, res) => {
  try {
    const { old_password, new_password } = req.body;

    if (!old_password || !new_password) {
      return error(res, 'Password lama dan baru wajib diisi', 400);
    }

    const user = await findUserByEmail(
      (await findUserById(req.user.userId)).email
    );

    if (!user.password) {
      return error(res, 'Akun ini login via Google, tidak ada password untuk diubah di sini', 400);
    }

    const valid = await comparePassword(old_password, user.password);
    if (!valid) return error(res, 'Password lama salah', 400);

    if (new_password.length < 6) {
      return error(res, 'Password baru minimal 6 karakter', 400);
    }

    const hashed = await hashPassword(new_password);
    await updatePassword(req.user.userId, hashed);

    return success(res, 'Password berhasil diubah');
  } catch (err) {
    console.error('changePassword error:', err);
    return error(res, 'Terjadi kesalahan server');
  }
};

// ─── Get All Users (ADMIN) ───────────────────────────────────────────────────
export const getUsers = async (req, res) => {
  try {
    const users = await getAllUsers();
    return success(res, 'Berhasil mengambil data users', users);
  } catch (err) {
    console.error('getUsers error:', err);
    return error(res, 'Terjadi kesalahan server');
  }
};

// ─── Toggle User Status (ADMIN) ──────────────────────────────────────────────
export const toggleUserStatus = async (req, res) => {
  try {
    const { id }       = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return error(res, 'is_active harus boolean', 400);
    }

    if (Number(id) === req.user.userId) {
      return error(res, 'Tidak dapat mengubah status akun sendiri', 400);
    }

    const user = await findUserById(id);
    if (!user) return error(res, 'User tidak ditemukan', 404);

    await updateUserStatus(id, is_active);
    return success(res, `User berhasil ${is_active ? 'diaktifkan' : 'dinonaktifkan'}`);
  } catch (err) {
    console.error('toggleUserStatus error:', err);
    return error(res, 'Terjadi kesalahan server');
  }
};

// ─── Google Login: Redirect ke Google ─────────────────────────────────────────
export const googleLogin = async (req, res) => {
  try {
    const nonce = crypto.randomBytes(16).toString('hex');
    const url = getLoginUrl(nonce);
    return res.redirect(url);
  } catch (err) {
    console.error('googleLogin error:', err);
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=google_login_failed`);
  }
};

// ─── Google Login: Callback dari Google ────────────────────────────────────────
export const googleLoginCallback = async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=google_login_failed`);
    }

    const { profile } = await exchangeCodeForProfile(code);

    let user = await findUserByGoogleId(profile.id);
    let isNewUser = false;

    if (!user) {
      user = await findUserByEmail(profile.email);

      if (user) {
        await linkGoogleId(user.id, profile.id);
      } else {
        const baseUsername = profile.email.split('@')[0].replace(/[^a-zA-Z0-9._-]/g, '');
        const uniqueSuffix  = crypto.randomBytes(3).toString('hex');

        user = await createUser({
          username: `${baseUsername}_${uniqueSuffix}`,
          full_name: profile.name || baseUsername,
          email: profile.email,
          password: null,
          role: 'PELANGGAN',
          google_id: profile.id,
        });
        isNewUser = true;
      }
    }

    if (!user.is_active) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=account_disabled`);
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    await addLoginHistory({
      userId: user.id,
      action: 'LOGIN', // ⬅️ FIXED: enum DB cuma support LOGIN/LOGOUT, REGISTER dihapus
      status: 'SUCCESS',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.redirect(`${process.env.FRONTEND_URL}/auth/callback#token=${token}`);
  } catch (err) {
    console.error('googleLoginCallback error:', err);
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=google_login_failed`);
  }
};