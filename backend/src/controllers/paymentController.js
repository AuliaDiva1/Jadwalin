import midtransClient from 'midtrans-client';
import { db } from '../core/config/knex.js';

const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
});

export const createPaymentController = async (req, res) => {
  try {
    const user_id = req.user.userId;
    const { plan_id } = req.body;

    if (!plan_id) {
      return res.status(400).json({ success: false, message: 'plan_id wajib diisi' });
    }

    const plan = await db('subscription_plans').where({ id: plan_id, is_active: true }).first();
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan tidak ditemukan' });
    }

    const order_id = `ORD-${Date.now()}`;

    await db('orders').insert({
      order_id,
      user_id,
      plan_id: plan.id,
      gross_amount: plan.price,
      status: 'pending',
    });

    const parameter = {
      transaction_details: {
        order_id,
        gross_amount: Number(plan.price),
      },
      item_details: [{
        id: String(plan.id),
        price: Number(plan.price),
        quantity: 1,
        name: `Langganan ${plan.name}`,
      }],
      customer_details: {
        first_name: req.user.name || 'Pengguna',
        email: req.user.email,
      },
      enabled_payments: ['bca_va', 'bni_va', 'bri_va', 'mandiri_va', 'permata_va', 'other_va', 'dana', 'gopay', 'shopeepay', 'qris'],
    };

    const transaction = await snap.createTransaction(parameter);

    res.status(201).json({
      success: true,
      message: 'Transaksi berhasil dibuat',
      data: {
        order_id,
        snap_token: transaction.token,
        redirect_url: transaction.redirect_url,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ================= UJI COBA GRATIS =================
export const startTrialController = async (req, res) => {
  try {
    const user_id = req.user.userId;
    const { plan_id } = req.body;

    if (!plan_id) {
      return res.status(400).json({ success: false, message: 'plan_id wajib diisi' });
    }

    const plan = await db('subscription_plans').where({ id: plan_id, is_active: true }).first();
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan tidak ditemukan' });
    }

    if (!plan.trial_days || plan.trial_days <= 0) {
      return res.status(400).json({ success: false, message: 'Paket ini tidak menyediakan uji coba gratis' });
    }

    const user = await db('users').where({ id: user_id }).first();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    if (user.has_used_trial) {
      return res.status(400).json({ success: false, message: 'Anda sudah pernah menggunakan uji coba gratis' });
    }

    if (user.subscription_status === 'active') {
      return res.status(400).json({ success: false, message: 'Anda sudah memiliki paket aktif' });
    }

    const order_id = `TRIAL-${Date.now()}`;
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + plan.trial_days);

    // Catat sebagai order dengan status 'trial' & amount 0, biar tetap muncul di riwayat
    await db('orders').insert({
      order_id,
      user_id,
      plan_id: plan.id,
      gross_amount: 0,
      status: 'trial',
      created_at: now,
      updated_at: now,
    });

    await db('users').where({ id: user_id }).update({
      subscription_status: 'active',
      subscription_plan_id: plan.id,
      subscription_expires_at: expiresAt,
      has_used_trial: true,
    });

    res.status(201).json({
      success: true,
      message: `Uji coba gratis ${plan.trial_days} hari untuk paket ${plan.name} berhasil diaktifkan`,
      data: {
        order_id,
        plan_name: plan.name,
        trial_days: plan.trial_days,
        expires_at: expiresAt,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const handlePaymentNotification = async (req, res) => {
  try {
    const statusResponse = await snap.transaction.notification(req.body);

    const orderId = statusResponse.order_id;
    const transactionStatus = statusResponse.transaction_status;

    let newStatus = 'pending';
    if (transactionStatus === 'settlement' || transactionStatus === 'capture') {
      newStatus = 'settlement';
    } else if (['cancel', 'deny', 'expire'].includes(transactionStatus)) {
      newStatus = 'failed';
    }

    let bankName = null;
    let vaNumber = null;
    if (statusResponse.va_numbers && statusResponse.va_numbers.length > 0) {
      bankName = statusResponse.va_numbers[0].bank;
      vaNumber = statusResponse.va_numbers[0].va_number;
    } else if (statusResponse.permata_va_number) {
      bankName = 'permata';
      vaNumber = statusResponse.permata_va_number;
    }

    await db('orders')
      .where({ order_id: orderId })
      .update({
        status: newStatus,
        bank: bankName,
        va_number: vaNumber,
        updated_at: new Date(),
      });

    if (newStatus === 'settlement') {
      const order = await db('orders').where({ order_id: orderId }).first();
      const plan = await db('subscription_plans').where({ id: order.plan_id }).first();

      if (order && plan) {
        const currentUser = await db('users').where({ id: order.user_id }).first();
        const now = new Date();
        const baseDate =
          currentUser?.subscription_expires_at && new Date(currentUser.subscription_expires_at) > now
            ? new Date(currentUser.subscription_expires_at)
            : now;

        const expiresAt = new Date(baseDate);
        expiresAt.setDate(expiresAt.getDate() + plan.duration_days);

        await db('users').where({ id: order.user_id }).update({
          subscription_status: 'active',
          subscription_plan_id: plan.id,
          subscription_expires_at: expiresAt,
        });
      }
    }

    res.status(200).json({ success: true, message: 'Notification handled successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getPaymentStatusController = async (req, res) => {
  try {
    const { order_id } = req.params;
    const order = await db('orders').where({ order_id }).first();

    if (!order) {
      return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan' });
    }

    if (order.user_id !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Akses ditolak' });
    }

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getPaymentHistoryController = async (req, res) => {
  try {
    const user_id = req.user.userId;

    const orders = await db('orders')
      .leftJoin('subscription_plans', 'orders.plan_id', 'subscription_plans.id')
      .where('orders.user_id', user_id)
      .select(
        'orders.order_id',
        'orders.gross_amount as amount',
        'orders.status',
        'orders.bank',
        'orders.va_number',
        'orders.created_at',
        'orders.updated_at',
        'subscription_plans.name as plan_name'
      )
      .orderBy('orders.created_at', 'desc');

    res.json({ success: true, data: orders });
  } catch (err) {
    console.error('GET /payments/history error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};