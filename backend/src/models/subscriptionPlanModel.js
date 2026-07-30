import { db } from '../core/config/knex.js';

export const getAllPlans = async () =>
  db('subscription_plans').orderBy('price', 'asc');

export const getActivePlans = async () =>
  db('subscription_plans').where({ is_active: true }).orderBy('price', 'asc');

export const getPlanById = async (id) =>
  db('subscription_plans').where({ id }).first();

export const createPlan = async ({ name, price, duration_days, description }) => {
  const [id] = await db('subscription_plans').insert({
    name, price, duration_days, description: description || null, is_active: true,
  });
  return getPlanById(id);
};

export const updatePlan = async (id, data) => {
  await db('subscription_plans').where({ id }).update(data);
  return getPlanById(id);
};

// Soft delete — plan lama mungkin masih dipakai order/riwayat, jangan del()
export const deactivatePlan = async (id) =>
  db('subscription_plans').where({ id }).update({ is_active: false });