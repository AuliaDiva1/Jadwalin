// src/models/userModel.js
import { db } from '../core/config/knex.js';

// =========================
// CRUD DASAR
// =========================

export const getAllUsers = async () => {
  return db('users').select(
    'id', 'username', 'full_name', 'email', 'role', 'is_active', 'created_at'
  );
};

export const getUserById = async (id) => {
  return db('users').where({ id }).first();
};

export const getUserByEmail = async (email) => {
  return db('users').where({ email }).first();
};

export const getUserByUsername = async (username) => {
  return db('users').where({ username }).first();
};

export const addUser = async ({ username, full_name, email, password, role }) => {
  const [id] = await db('users').insert({
    username,
    full_name,
    email,
    password,
    role,
    is_active: true,
    created_at: new Date(),
  });
  return getUserById(id);
};

export const updateUser = async (id, updateData) => {
  await db('users').where({ id }).update(updateData);
  return getUserById(id);
};

export const deleteUser = async (id) => {
  return db('users').where({ id }).del();
};

export const toggleUserStatus = async (id, is_active) => {
  await db('users').where({ id }).update({ is_active });
  return getUserById(id);
};

// =========================
// SUPERADMIN — TAMBAHAN
// =========================

export const countByRole = async (role) => {
  const result = await db('users').where({ role }).count('id as total');
  return Number(result[0].total);
};

export const getAllUsersDetailed = async ({ role, search, status, limit, offset }) => {
  let query = db('users')
    .leftJoin('company_profiles', 'users.id', 'company_profiles.user_id')
    .leftJoin('subscription_plans', 'users.subscription_plan_id', 'subscription_plans.id')
    .select(
      'users.id', 'users.username', 'users.full_name', 'users.email',
      'users.role', 'users.is_active', 'users.created_at as tanggal_daftar',
      'users.subscription_status', 'users.subscription_expires_at',
      'company_profiles.company_name', 'company_profiles.industry',
      'company_profiles.city', 'company_profiles.is_completed',
      'subscription_plans.name as plan_name'
    );

  if (role) query = query.where('users.role', role);

  if (search) {
    query = query.where(function () {
      this.where('users.full_name', 'like', `%${search}%`)
        .orWhere('users.email', 'like', `%${search}%`)
        .orWhere('company_profiles.company_name', 'like', `%${search}%`);
    });
  }

  if (status === 'buyer') query = query.where('users.subscription_status', 'active');
  if (status === 'trial') {
    query = query.where(function () {
      this.whereNot('users.subscription_status', 'active').orWhereNull('users.subscription_status');
    });
  }

  const data = await query.clone().orderBy('users.created_at', 'desc').limit(limit).offset(offset);
  const [{ total }] = await query.clone().clearSelect().clearOrder().count('users.id as total');

  return { data, total: Number(total) };
};

export const getUserDetailWithProfile = async (id) =>
  db('users')
    .leftJoin('company_profiles', 'users.id', 'company_profiles.user_id')
    .where('users.id', id)
    .select(
      'users.id', 'users.username', 'users.full_name', 'users.email',
      'users.role', 'users.is_active', 'users.created_at',
      'users.subscription_status', 'users.subscription_plan_id', 'users.subscription_expires_at',
      'company_profiles.*'
    )
    .first();

export const countActiveSubscribers = async () => {
  const result = await db('users').where({ role: 'PELANGGAN', subscription_status: 'active' }).count('id as total');
  return Number(result[0].total);
};

export const getRegistrationGrowth = async () =>
  db('users')
    .where({ role: 'PELANGGAN' })
    .select(db.raw("DATE_FORMAT(created_at, '%Y-%m') as bulan"))
    .count('id as jumlah')
    .groupBy('bulan')
    .orderBy('bulan', 'asc');