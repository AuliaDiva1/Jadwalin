import { db } from '../core/config/knex.js';

export const getCompanyProfileByUserId = async (userId) =>
  db('company_profiles').where({ user_id: userId }).first();

export const upsertCompanyProfile = async (userId, data) => {
  const existing = await getCompanyProfileByUserId(userId);
  const payload = { ...data, is_completed: true, updated_at: db.fn.now() };

  if (existing) {
    await db('company_profiles').where({ user_id: userId }).update(payload);
  } else {
    await db('company_profiles').insert({ ...payload, user_id: userId });
  }
  return getCompanyProfileByUserId(userId);
};

export const countCompletedProfiles = async () => {
  const result = await db('company_profiles').where({ is_completed: true }).count('id as total');
  return Number(result[0].total);
};