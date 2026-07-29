// controllers/planController.js
import { db } from '../core/config/knex.js';

export const getPlansController = async (req, res) => {
  try {
    const plans = await db('subscription_plans')
      .where({ is_active: true })
      .orderBy('price', 'asc');
    res.json({ success: true, data: plans });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};