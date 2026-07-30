import { db } from '../core/config/knex.js';

export const getAllOrders = async ({ status, search, limit, offset }) => {
  let query = db('orders')
    .leftJoin('users', 'orders.user_id', 'users.id')
    .leftJoin('subscription_plans', 'orders.plan_id', 'subscription_plans.id')
    .select(
      'orders.order_id', 'orders.gross_amount as amount', 'orders.status',
      'orders.bank', 'orders.va_number', 'orders.created_at', 'orders.updated_at',
      'users.full_name', 'users.email',
      'subscription_plans.name as plan_name'
    );

  if (status) query = query.where('orders.status', status);
  if (search) {
    query = query.where(function () {
      this.where('users.full_name', 'like', `%${search}%`)
        .orWhere('users.email', 'like', `%${search}%`)
        .orWhere('orders.order_id', 'like', `%${search}%`);
    });
  }

  const data = await query.clone().orderBy('orders.created_at', 'desc').limit(limit).offset(offset);
  const [{ total }] = await query.clone().clearSelect().clearOrder().count('orders.order_id as total');

  return { data, total: Number(total) };
};

export const getTotalRevenue = async () => {
  const result = await db('orders').where({ status: 'settlement' }).sum('gross_amount as total');
  return Number(result[0].total) || 0;
};

// ===================== REVENUE PER PAKET =====================
export const getRevenuePerPlan = async () => {
  const result = await db('orders')
    .join('subscription_plans', 'orders.plan_id', 'subscription_plans.id')
    .where('orders.status', 'settlement')
    .groupBy('subscription_plans.id', 'subscription_plans.name')
    .select(
      'subscription_plans.id as plan_id',
      'subscription_plans.name as plan_name'
    )
    .sum('orders.gross_amount as total_revenue')
    .count('orders.order_id as total_transaksi')
    .orderBy('total_revenue', 'desc');

  return result.map((r) => ({
    plan_id: r.plan_id,
    plan_name: r.plan_name,
    total_revenue: Number(r.total_revenue) || 0,
    total_transaksi: Number(r.total_transaksi) || 0,
  }));
};

// ===================== TREN REVENUE BULANAN =====================
export const getMonthlyRevenueTrend = async (months = 6) => {
  const result = await db('orders')
    .where('status', 'settlement')
    .andWhere('created_at', '>=', db.raw(`DATE_SUB(NOW(), INTERVAL ${Number(months)} MONTH)`))
    .select(db.raw("DATE_FORMAT(created_at, '%Y-%m') as bulan"))
    .sum('gross_amount as total_revenue')
    .count('order_id as total_transaksi')
    .groupBy('bulan')
    .orderBy('bulan', 'asc');

  return result.map((r) => ({
    bulan: r.bulan,
    total_revenue: Number(r.total_revenue) || 0,
    total_transaksi: Number(r.total_transaksi) || 0,
  }));
};

// ===================== PELANGGAN MAU EXPIRED (default 7 hari) =====================
export const getExpiringCustomers = async (days = 7) => {
  const result = await db('users')
    .where('users.role', 'PELANGGAN')
    .andWhere('users.subscription_status', 'active')
    .andWhere('users.subscription_expires_at', '<=', db.raw(`DATE_ADD(NOW(), INTERVAL ${Number(days)} DAY)`))
    .andWhere('users.subscription_expires_at', '>=', db.raw('NOW()'))
    .leftJoin('company_profiles', 'company_profiles.user_id', 'users.id')
    .select(
      'users.id',
      'users.full_name',
      'users.email',
      'users.subscription_status',
      'users.subscription_expires_at',
      'company_profiles.company_name'
    )
    .orderBy('users.subscription_expires_at', 'asc');

  return result;
};

// ===================== TOP CUSTOMER BY REVENUE =====================
export const getTopCustomers = async (limit = 10) => {
  const result = await db('orders')
    .join('users', 'orders.user_id', 'users.id')
    .where('orders.status', 'settlement')
    .groupBy('users.id', 'users.full_name', 'users.email')
    .select(
      'users.id as user_id',
      'users.full_name',
      'users.email'
    )
    .sum('orders.gross_amount as total_revenue')
    .count('orders.order_id as total_transaksi')
    .orderBy('total_revenue', 'desc')
    .limit(Number(limit));

  return result.map((r) => ({
    user_id: r.user_id,
    full_name: r.full_name,
    email: r.email,
    total_revenue: Number(r.total_revenue) || 0,
    total_transaksi: Number(r.total_transaksi) || 0,
  }));
};