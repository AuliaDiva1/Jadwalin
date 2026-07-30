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