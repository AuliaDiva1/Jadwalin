import midtransClient from 'midtrans-client';
import { db } from '../core/config/knex.js';

const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
});

export const createPaymentController = async (req, res) => {
  try {
    const { amount, user_id } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Jumlah pembayaran tidak valid' });
    }

    const order_id = `ORD-${Date.now()}`;

    await db('orders').insert({
      order_id,
      user_id: user_id ?? null,
      gross_amount: amount,
      status: 'pending',
    });

    const parameter = {
      transaction_details: {
        order_id,
        gross_amount: Number(amount),
      },
      enabled_payments: [
        'bca_va',
        'bni_va',
        'bri_va',
        'mandiri_va',
        'permata_va',
        'other_va',
      ],
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

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};