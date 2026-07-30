// src/controllers/superadminController.js
import {
  getAllUsersDetailed,
  getUserDetailWithProfile,
  countActiveSubscribers,
  getRegistrationGrowth,
  addUser as createUser,
  getUserByEmail,
  getUserByUsername,
  updateUser as updateUserModel,
  deleteUser as deleteUserModel,
  countByRole,
} from '../models/userModel.js';
import { countCompletedProfiles } from '../models/companyProfileModel.js';
import {
  getAllPlans,
  createPlan,
  updatePlan,
  deactivatePlan,
  getPlanById,
} from '../models/subscriptionPlanModel.js';
import {
  getAllOrders,
  getTotalRevenue,
  getRevenuePerPlan,
  getMonthlyRevenueTrend,
  getExpiringCustomers,
  getTopCustomers,
} from '../models/orderModel.js';
import { hashPassword } from '../utils/hash.js';
import { success, error } from '../utils/response.js';

const ALL_ROLES = ['SUPERADMIN', 'ADMIN', 'MANAJER_PRODUKSI', 'STAFF_GUDANG', 'PELANGGAN'];

// ===================== DASHBOARD =====================
export const getDashboardStats = async (req, res) => {
  try {
    const totalPendaftar = await countByRole('PELANGGAN');
    const totalProfilLengkap = await countCompletedProfiles();
    const totalPembeli = await countActiveSubscribers();
    const totalRevenue = await getTotalRevenue();
    const growth = await getRegistrationGrowth();

    return success(res, 'Berhasil mengambil statistik SaaS', {
      total_pendaftar: totalPendaftar,
      total_profil_lengkap: totalProfilLengkap,
      total_pembeli: totalPembeli,
      total_revenue: totalRevenue,
      conversion_rate:
        totalPendaftar > 0
          ? ((totalPembeli / totalPendaftar) * 100).toFixed(1)
          : 0,
      growth,
    });
  } catch (err) {
    console.error('getDashboardStats error:', err);
    return error(res, 'Terjadi kesalahan server');
  }
};

// ===================== DASHBOARD DETAIL (BARU) =====================
export const getDashboardRevenuePerPlan = async (req, res) => {
  try {
    const data = await getRevenuePerPlan();
    return success(res, 'Berhasil mengambil revenue per paket', data);
  } catch (err) {
    console.error('getDashboardRevenuePerPlan error:', err);
    return error(res, 'Terjadi kesalahan server');
  }
};

export const getDashboardRevenueTrend = async (req, res) => {
  try {
    const { months = 6 } = req.query;
    const data = await getMonthlyRevenueTrend(months);
    return success(res, 'Berhasil mengambil tren revenue bulanan', data);
  } catch (err) {
    console.error('getDashboardRevenueTrend error:', err);
    return error(res, 'Terjadi kesalahan server');
  }
};

export const getDashboardExpiringCustomers = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const data = await getExpiringCustomers(days);
    return success(res, 'Berhasil mengambil pelanggan yang akan expired', data);
  } catch (err) {
    console.error('getDashboardExpiringCustomers error:', err);
    return error(res, 'Terjadi kesalahan server');
  }
};

export const getDashboardTopCustomers = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const data = await getTopCustomers(limit);
    return success(res, 'Berhasil mengambil top customer', data);
  } catch (err) {
    console.error('getDashboardTopCustomers error:', err);
    return error(res, 'Terjadi kesalahan server');
  }
};

// ===================== USERS (CRUD semua role) =====================
export const getUsers = async (req, res) => {
  try {
    const { role, search = '', status = 'all', page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { data, total } = await getAllUsersDetailed({ role, search, status, limit, offset });

    return success(res, 'Berhasil mengambil data pengguna', {
      data,
      meta: { total, page: Number(page), limit: Number(limit) },
    });
  } catch (err) {
    console.error('getUsers error:', err);
    return error(res, 'Terjadi kesalahan server');
  }
};

export const getUserDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await getUserDetailWithProfile(id);
    if (!user) return error(res, 'User tidak ditemukan', 404);

    const { data: orders } = await getAllOrders({ status: null, search: '', limit: 100, offset: 0 });
    const userOrders = orders.filter((o) => o.email === user.email);

    return success(res, 'Berhasil mengambil detail pengguna', { ...user, orders: userOrders });
  } catch (err) {
    console.error('getUserDetail error:', err);
    return error(res, 'Terjadi kesalahan server');
  }
};

export const createUserAnyRole = async (req, res) => {
  try {
    const { username, full_name, email, password, role } = req.body;

    if (!username || !full_name || !email || !password || !role) {
      return error(res, 'Semua field wajib diisi', 400);
    }

    if (!ALL_ROLES.includes(role)) {
      return error(res, `Role tidak valid. Pilihan: ${ALL_ROLES.join(', ')}`, 400);
    }

    const emailExists = await getUserByEmail(email);
    if (emailExists) return error(res, 'Email sudah terdaftar', 400);

    const usernameExists = await getUserByUsername(username);
    if (usernameExists) return error(res, 'Username sudah digunakan', 400);

    const hashed = await hashPassword(password);
    const user = await createUser({ username, full_name, email, password: hashed, role });

    return success(res, 'User berhasil dibuat', user, 201);
  } catch (err) {
    console.error('createUserAnyRole error:', err);
    return error(res, 'Terjadi kesalahan server');
  }
};

export const updateUserAnyRole = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      username,
      full_name,
      email,
      password,
      role,
      is_active,
      subscription_status,
      subscription_expires_at,
    } = req.body;

    if (role && !ALL_ROLES.includes(role)) {
      return error(res, `Role tidak valid. Pilihan: ${ALL_ROLES.join(', ')}`, 400);
    }

    const updateData = {};
    if (username) updateData.username = username;
    if (full_name) updateData.full_name = full_name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (typeof is_active === 'boolean') updateData.is_active = is_active;
    if (subscription_status) updateData.subscription_status = subscription_status;
    if (subscription_expires_at) updateData.subscription_expires_at = subscription_expires_at;
    if (password) updateData.password = await hashPassword(password);

    const updated = await updateUserModel(id, updateData);
    if (!updated) return error(res, 'User tidak ditemukan', 404);

    return success(res, 'User berhasil diupdate', updated);
  } catch (err) {
    console.error('updateUserAnyRole error:', err);
    return error(res, 'Terjadi kesalahan server');
  }
};

export const deleteUserAnyRole = async (req, res) => {
  try {
    const { id } = req.params;

    if (Number(id) === req.user.userId) {
      return error(res, 'Tidak dapat menghapus akun sendiri', 400);
    }

    await deleteUserModel(id);
    return success(res, 'User berhasil dihapus');
  } catch (err) {
    console.error('deleteUserAnyRole error:', err);
    return error(res, 'Terjadi kesalahan server');
  }
};

// ===================== SUBSCRIPTION PLANS (CRUD) =====================
export const getPlans = async (req, res) => {
  try {
    const plans = await getAllPlans();
    return success(res, 'Berhasil mengambil semua plan', plans);
  } catch (err) {
    console.error('getPlans error:', err);
    return error(res, 'Terjadi kesalahan server');
  }
};

export const createPlanHandler = async (req, res) => {
  try {
    const { name, price, duration_days, description } = req.body;

    if (!name || !price || !duration_days) {
      return error(res, 'name, price, dan duration_days wajib diisi', 400);
    }

    const plan = await createPlan({ name, price, duration_days, description });
    return success(res, 'Plan berhasil dibuat', plan, 201);
  } catch (err) {
    console.error('createPlanHandler error:', err);
    return error(res, 'Terjadi kesalahan server');
  }
};

export const updatePlanHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await getPlanById(id);
    if (!existing) return error(res, 'Plan tidak ditemukan', 404);

    const { name, price, duration_days, description, is_active } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (price) updateData.price = price;
    if (duration_days) updateData.duration_days = duration_days;
    if (description !== undefined) updateData.description = description;
    if (typeof is_active === 'boolean') updateData.is_active = is_active;

    const plan = await updatePlan(id, updateData);
    return success(res, 'Plan berhasil diupdate', plan);
  } catch (err) {
    console.error('updatePlanHandler error:', err);
    return error(res, 'Terjadi kesalahan server');
  }
};

export const deletePlanHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await getPlanById(id);
    if (!existing) return error(res, 'Plan tidak ditemukan', 404);

    await deactivatePlan(id);
    return success(res, 'Plan berhasil dinonaktifkan');
  } catch (err) {
    console.error('deletePlanHandler error:', err);
    return error(res, 'Terjadi kesalahan server');
  }
};

// ===================== ORDERS (semua transaksi) =====================
export const getOrders = async (req, res) => {
  try {
    const { status, search = '', page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { data, total } = await getAllOrders({ status, search, limit, offset });

    return success(res, 'Berhasil mengambil semua transaksi', {
      data,
      meta: { total, page: Number(page), limit: Number(limit) },
    });
  } catch (err) {
    console.error('getOrders error:', err);
    return error(res, 'Terjadi kesalahan server');
  }
};