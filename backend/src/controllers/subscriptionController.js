// controllers/subscriptionController.js
import { db } from '../core/config/knex.js';

export const getMySubscription = async (req, res) => {
  try {
    const user = await db('users')
      .where({ id: req.user.userId })
      .select('subscription_status', 'subscription_plan_id', 'subscription_expires_at')
      .first();

    let plan = null;
    if (user.subscription_plan_id) {
      plan = await db('subscription_plans').where({ id: user.subscription_plan_id }).first();
    }

    res.json({
      success: true,
      data: {
        status: user.subscription_status,
        expires_at: user.subscription_expires_at,
        plan,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};