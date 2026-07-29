'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function PelangganDashboard() {
  const router = useRouter();
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('TOKEN');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [subRes, plansRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/subscription/me`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/plans`),
        ]);
        setSubscription(subRes.data.data);
        setPlans(plansRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const script = document.createElement('script');
    script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '');
    document.body.appendChild(script);
  }, [router]);

  const handleSubscribe = async (planId) => {
    setCheckoutLoading(planId);
    const token = localStorage.getItem('TOKEN');

    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/payments/checkout`,
        { plan_id: planId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { snap_token } = res.data.data;

      window.snap.pay(snap_token, {
        onSuccess: () => window.location.reload(),
        onPending: () => window.location.reload(),
        onError: () => alert('Pembayaran gagal, silakan coba lagi.'),
        onClose: () => setCheckoutLoading(null),
      });
    } catch (err) {
      alert('Gagal memulai pembayaran: ' + (err.response?.data?.message || err.message));
      setCheckoutLoading(null);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Poppins, sans-serif' }}>
        Memuat data langganan...
      </div>
    );
  }

  const isActive = subscription?.status === 'active';

  return (
    <div style={{ fontFamily: 'Poppins, sans-serif', minHeight: '100vh', background: '#f8faff', padding: '48px 32px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', marginBottom: 24 }}>
          Dashboard Langganan
        </h1>

        <div style={{
          background: '#fff', borderRadius: 16, padding: 24, marginBottom: 32,
          border: `1.5px solid ${isActive ? '#4f46e5' : '#e2e8f0'}`,
        }}>
          {isActive ? (
            <>
              <div style={{ fontSize: '0.8rem', color: '#4f46e5', fontWeight: 700, marginBottom: 6 }}>
                PAKET AKTIF: {subscription?.plan?.name}
              </div>
              <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
                Berlaku sampai{' '}
                {subscription?.expires_at &&
                  new Date(subscription.expires_at).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
              </div>
            </>
          ) : (
            <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
              Anda belum berlangganan paket apapun. Pilih paket di bawah untuk mulai.
            </div>
          )}
        </div>

        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
          {isActive ? 'Upgrade / Perpanjang Paket' : 'Pilih Paket'}
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {plans.map((plan) => (
            <div key={plan.id} style={{
              background: '#fff', borderRadius: 14, padding: 20,
              border: subscription?.plan?.id === plan.id ? '2px solid #4f46e5' : '1.5px solid #e2e8f0',
            }}>
              <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a', marginBottom: 6 }}>{plan.name}</h3>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
                Rp {Number(plan.price).toLocaleString('id-ID')}
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}> /bulan</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: 16, lineHeight: 1.6 }}>
                {plan.description}
              </p>
              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={checkoutLoading === plan.id}
                style={{
                  width: '100%', padding: '10px', borderRadius: 8, border: 'none',
                  background: '#4f46e5', color: '#fff', fontWeight: 700, fontSize: '0.85rem',
                  cursor: 'pointer', fontFamily: 'Poppins, sans-serif',
                }}
              >
                {checkoutLoading === plan.id ? 'Memproses...' : 'Pilih Paket'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}