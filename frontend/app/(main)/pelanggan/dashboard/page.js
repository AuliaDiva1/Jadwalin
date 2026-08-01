'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const STATUS_STYLES = {
  paid:       { bg: '#dcfce7', color: '#16a34a', label: 'Berhasil' },
  settlement: { bg: '#dcfce7', color: '#16a34a', label: 'Berhasil' },
  success:    { bg: '#dcfce7', color: '#16a34a', label: 'Berhasil' },
  trial:      { bg: '#ede9fe', color: '#7c3aed', label: 'Uji Coba Gratis' },
  pending:    { bg: '#fef9c3', color: '#b45309', label: 'Menunggu' },
  failed:     { bg: '#fee2e2', color: '#dc2626', label: 'Gagal' },
  expired:    { bg: '#f1f5f9', color: '#64748b', label: 'Kedaluwarsa' },
  cancel:     { bg: '#f1f5f9', color: '#64748b', label: 'Dibatalkan' },
};

function getStatusStyle(status) {
  return STATUS_STYLES[status?.toLowerCase()] || { bg: '#f1f5f9', color: '#64748b', label: status || '-' };
}

export default function PelangganDashboard() {
  const router = useRouter();
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const [showPlans, setShowPlans] = useState(false); // toggle upgrade/perpanjang saat sudah aktif

  useEffect(() => {
    const token = localStorage.getItem('TOKEN');
    if (!token) {
      router.push('/auth/login');
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

    const fetchHistory = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/payments/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setHistory(res.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchData();
    fetchHistory();

    // ==========================================
    // SNAP.JS LOADER — PRODUCTION
    // ==========================================
    // Sebelumnya: https://app.sandbox.midtrans.com/snap/snap.js (testing, uang simulasi)
    // Sekarang  : https://app.midtrans.com/snap/snap.js         (production, uang asli)
    //
    // Pastikan NEXT_PUBLIC_MIDTRANS_CLIENT_KEY di environment variable Vercel
    // juga sudah diisi Client Key PRODUCTION (format: Mid-client-xxxxx),
    // bukan Client Key sandbox (format: SB-Mid-client-xxxxx).
    const script = document.createElement('script');
    script.src = 'https://app.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '');
    document.body.appendChild(script);

    return () => {
      // bersihkan script kalau komponen unmount, biar gak numpuk kalau navigasi bolak-balik
      document.body.removeChild(script);
    };
  }, [router]);

  const refreshHistory = async () => {
    const token = localStorage.getItem('TOKEN');
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/payments/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistory(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // sudah pernah pakai trial kalau ada satu aja transaksi berstatus 'trial' di riwayat
  const hasUsedTrial = history.some((trx) => trx.status?.toLowerCase() === 'trial');

  const handleSubscribe = async (planId) => {
    setCheckoutLoading(planId);
    const token = localStorage.getItem('TOKEN');
    const plan = plans.find((p) => p.id === planId);
    const isTrialEligible = plan?.trial_days > 0 && !hasUsedTrial && !isActive;

    try {
      if (isTrialEligible) {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/payments/trial`,
          { plan_id: planId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        window.location.reload();
        return;
      }

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
        onClose: () => {
          setCheckoutLoading(null);
          refreshHistory();
        },
      });
    } catch (err) {
      alert('Gagal memulai: ' + (err.response?.data?.message || err.message));
      setCheckoutLoading(null);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 16, fontFamily: "'Poppins', sans-serif", background: '#f8faff',
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%', border: '3px solid #e0e7ff',
          borderTopColor: '#4f46e5', animation: 'spin 0.8s linear infinite',
        }} />
        <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Memuat data langganan...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const isActive = subscription?.status === 'active';

  // Sisa hari sampai expired (buat ditampilin di banner)
  let daysLeft = null;
  if (isActive && subscription?.expires_at) {
    const diff = new Date(subscription.expires_at).getTime() - Date.now();
    daysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif", minHeight: '100vh', background: '#f8faff' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .plan-card { transition: transform 0.25s ease, box-shadow 0.25s ease; }
        .plan-card:hover { transform: translateY(-4px); box-shadow: 0 20px 44px rgba(79,70,229,0.14); }
        .history-row { transition: background 0.2s; }
        .history-row:hover { background: #f8faff; }
        .cta-btn { transition: transform 0.2s ease; }
        .cta-btn:hover { transform: translateY(-2px); }
        @media (max-width: 640px) {
          .history-table thead { display: none; }
          .history-table tr { display: block; margin-bottom: 12px; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 14px; }
          .history-table td { display: flex; justify-content: space-between; padding: 4px 0 !important; border: none !important; }
          .history-table td::before { content: attr(data-label); font-weight: 600; color: #94a3b8; font-size: 0.72rem; }
        }
      `}</style>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28, animation: 'fadeUp 0.5s both' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 18px rgba(79,70,229,0.35)',
          }}>
            <i className="pi pi-verified" style={{ color: '#fff', fontSize: '1.1rem' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              Dashboard Langganan
            </h1>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Kelola paket dan riwayat pemesanan Anda</p>
          </div>
        </div>

        {isActive ? (
          <>
            {/* ===== HERO: paket aktif ===== */}
            <div style={{
              borderRadius: 20, padding: 32, marginBottom: 24,
              background: 'linear-gradient(135deg,#1e1b4b,#4f46e5 55%,#7c3aed)',
              boxShadow: '0 20px 50px rgba(79,70,229,0.3)',
              position: 'relative', overflow: 'hidden', animation: 'fadeUp 0.55s 0.05s both',
            }}>
              <div style={{
                position: 'absolute', top: -60, right: -40, width: 220, height: 220,
                borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none',
              }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)',
                  borderRadius: 99, padding: '4px 12px', fontSize: '0.68rem', fontWeight: 700,
                  color: '#c7d2fe', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
                  Paket {subscription?.plan?.name} Aktif
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginBottom: 6, letterSpacing: '-0.01em' }}>
                  Langganan Anda aktif
                </div>
                <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.88rem', marginBottom: 22 }}>
                  Berlaku sampai{' '}
                  {subscription?.expires_at &&
                    new Date(subscription.expires_at).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  {daysLeft !== null && ` · ${daysLeft} hari lagi`}
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <button
                    className="cta-btn"
                    onClick={() => router.push('/pelanggan/profil-perusahaan')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '13px 22px', borderRadius: 12,
                      border: 'none', background: '#fff', color: '#4f46e5', fontWeight: 700, fontSize: '0.88rem',
                      cursor: 'pointer', fontFamily: "'Poppins', sans-serif", boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                    }}
                  >
                    <i className="pi pi-building" style={{ fontSize: '0.8rem' }} /> Kelola Profil Perusahaan
                  </button>
                  <button
                    onClick={() => setShowPlans((v) => !v)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '13px 22px', borderRadius: 12,
                      border: '1.5px solid rgba(255,255,255,0.35)', background: 'transparent', color: '#fff',
                      fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', fontFamily: "'Poppins', sans-serif",
                    }}
                  >
                    {showPlans ? 'Sembunyikan Paket' : 'Upgrade / Perpanjang Paket'}
                  </button>
                </div>
              </div>
            </div>

            {/* Plans - disembunyikan default, muncul kalau user memang mau upgrade/perpanjang */}
            {showPlans && (
              <div style={{ marginBottom: 40, animation: 'fadeUp 0.4s both' }}>
                <div style={{ marginBottom: 16 }}>
                  <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                    Upgrade / Perpanjang Paket
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Semua paket bisa dibayar langsung lewat Midtrans.</p>
                </div>
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16,
                }}>
                  {plans.map((plan) => {
                    const isCurrent = subscription?.plan?.id === plan.id;
                    return (
                      <div
                        key={plan.id}
                        className="plan-card"
                        style={{
                          background: '#fff', borderRadius: 16, padding: 20, position: 'relative',
                          border: isCurrent ? '2px solid #4f46e5' : '1.5px solid #e2e8f0',
                          boxShadow: isCurrent ? '0 10px 26px rgba(79,70,229,0.12)' : '0 2px 8px rgba(0,0,0,0.03)',
                        }}
                      >
                        {isCurrent && (
                          <div style={{
                            position: 'absolute', top: -1, right: 16, background: '#4f46e5', color: '#fff',
                            fontSize: '0.6rem', fontWeight: 700, padding: '3px 10px', borderRadius: '0 0 8px 8px',
                            letterSpacing: '0.04em', textTransform: 'uppercase',
                          }}>
                            Paket Anda
                          </div>
                        )}
                        <h3 style={{ fontWeight: 700, fontSize: '0.98rem', color: '#0f172a', marginBottom: 8 }}>{plan.name}</h3>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
                          Rp {Number(plan.price).toLocaleString('id-ID')}
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500 }}> /bulan</span>
                        </div>
                        <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: 16, lineHeight: 1.6 }}>
                          {plan.description}
                        </p>
                        <button
                          onClick={() => handleSubscribe(plan.id)}
                          disabled={checkoutLoading === plan.id}
                          style={{
                            width: '100%', padding: '10px', borderRadius: 10, border: 'none',
                            background: checkoutLoading === plan.id ? '#a5b4fc' : 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                            color: '#fff', fontWeight: 700, fontSize: '0.82rem',
                            cursor: checkoutLoading === plan.id ? 'not-allowed' : 'pointer',
                            fontFamily: "'Poppins', sans-serif",
                          }}
                        >
                          {checkoutLoading === plan.id ? 'Memproses...' : (isCurrent ? 'Perpanjang' : 'Pilih Paket')}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* ===== Belum aktif -> paket jadi fokus utama ===== */}
            <div style={{
              borderRadius: 20, padding: 26, marginBottom: 36, background: '#ffffff',
              border: '1.5px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              display: 'flex', alignItems: 'center', gap: 14, animation: 'fadeUp 0.55s 0.05s both',
            }}>
              <div style={{
                width: 46, height: 46, borderRadius: 12, background: '#f0f4ff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <i className="pi pi-info-circle" style={{ color: '#4f46e5', fontSize: '1.2rem' }} />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', marginBottom: 2 }}>
                  Belum ada paket aktif
                </div>
                <div style={{ color: '#64748b', fontSize: '0.85rem' }}>
                  Pilih salah satu paket di bawah untuk mulai berlangganan.
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                Pilih Paket
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Semua paket bisa dibayar langsung lewat Midtrans.</p>
            </div>

            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18, marginBottom: 56,
            }}>
              {plans.map((plan, i) => {
                const isTrialAvailable = plan.trial_days > 0 && !hasUsedTrial;
                return (
                  <div
                    key={plan.id}
                    className="plan-card"
                    style={{
                      background: '#fff', borderRadius: 18, padding: 22, position: 'relative',
                      border: isTrialAvailable ? '1.5px solid #c4b5fd' : '1.5px solid #e2e8f0',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                      animation: `fadeUp 0.5s ${0.1 + i * 0.08}s both`,
                    }}
                  >
                    <h3 style={{ fontWeight: 700, fontSize: '1.02rem', color: '#0f172a', marginBottom: 8 }}>{plan.name}</h3>

                    {isTrialAvailable && (
                      <span style={{
                        display: 'inline-block', marginBottom: 8, padding: '3px 10px', borderRadius: 99,
                        background: '#ede9fe', color: '#7c3aed', fontWeight: 700, fontSize: '0.65rem',
                      }}>
                        Uji coba {plan.trial_days} hari gratis
                      </span>
                    )}

                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>
                      Rp {Number(plan.price).toLocaleString('id-ID')}
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}> /bulan</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 20, lineHeight: 1.65 }}>
                      {plan.description}
                    </p>
                    <button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={checkoutLoading === plan.id}
                      style={{
                        width: '100%', padding: '11px', borderRadius: 10, border: 'none',
                        background: checkoutLoading === plan.id ? '#a5b4fc' : 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                        color: '#fff', fontWeight: 700, fontSize: '0.85rem',
                        cursor: checkoutLoading === plan.id ? 'not-allowed' : 'pointer',
                        fontFamily: "'Poppins', sans-serif", display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: 8, boxShadow: '0 6px 18px rgba(79,70,229,0.3)',
                      }}
                    >
                      {checkoutLoading === plan.id ? 'Memproses...' : (
                        <>
                          <i className={`pi ${isTrialAvailable ? 'pi-gift' : 'pi-arrow-right'}`} style={{ fontSize: '0.75rem' }} />
                          {isTrialAvailable ? `Coba Gratis ${plan.trial_days} Hari` : 'Pilih Paket'}
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Riwayat Pemesanan - tetap tampil buat siapa aja */}
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Riwayat Pemesanan</h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Semua transaksi langganan yang pernah Anda buat.</p>
          </div>
          <button
            onClick={refreshHistory}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8,
              border: '1.5px solid #e2e8f0', background: '#fff', color: '#4f46e5', fontWeight: 600,
              fontSize: '0.78rem', cursor: 'pointer', fontFamily: "'Poppins', sans-serif",
            }}
          >
            <i className="pi pi-refresh" style={{ fontSize: '0.7rem' }} /> Muat Ulang
          </button>
        </div>

        <div style={{
          background: '#fff', borderRadius: 18, border: '1.5px solid #e2e8f0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)', overflow: 'hidden', animation: 'fadeUp 0.5s 0.15s both',
        }}>
          {historyLoading ? (
            <div style={{ padding: '40px 24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
              Memuat riwayat pemesanan...
            </div>
          ) : history.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <i className="pi pi-inbox" style={{ fontSize: '2rem', color: '#cbd5e1', marginBottom: 12, display: 'block' }} />
              <div style={{ color: '#64748b', fontWeight: 600, fontSize: '0.9rem', marginBottom: 4 }}>
                Belum ada riwayat transaksi
              </div>
              <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                Transaksi langganan Anda akan muncul di sini.
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="history-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f8faff' }}>
                    <th style={{ textAlign: 'left', padding: '14px 20px', color: '#94a3b8', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tanggal</th>
                    <th style={{ textAlign: 'left', padding: '14px 20px', color: '#94a3b8', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Paket</th>
                    <th style={{ textAlign: 'left', padding: '14px 20px', color: '#94a3b8', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Jumlah</th>
                    <th style={{ textAlign: 'left', padding: '14px 20px', color: '#94a3b8', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((trx, i) => {
                    const style = getStatusStyle(trx.status);
                    return (
                      <tr key={trx.id || i} className="history-row" style={{ borderTop: '1px solid #f1f5f9' }}>
                        <td data-label="Tanggal" style={{ padding: '16px 20px', color: '#374151' }}>
                          {trx.created_at
                            ? new Date(trx.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                            : '-'}
                        </td>
                        <td data-label="Paket" style={{ padding: '16px 20px', color: '#0f172a', fontWeight: 600 }}>
                          {trx.plan?.name || trx.plan_name || '-'}
                        </td>
                        <td data-label="Jumlah" style={{ padding: '16px 20px', color: '#374151' }}>
                          {trx.amount ? `Rp ${Number(trx.amount).toLocaleString('id-ID')}` : '-'}
                        </td>
                        <td data-label="Status" style={{ padding: '16px 20px' }}>
                          <span style={{
                            display: 'inline-block', padding: '4px 12px', borderRadius: 99,
                            background: style.bg, color: style.color, fontWeight: 700, fontSize: '0.72rem',
                          }}>
                            {style.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
