'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import InvoiceModal from '../../components/detail/page'; // [BARU] sesuaikan path relatif ke file kamu

const STATUS_STYLES = {
  paid:       { bg: '#dcfce7', color: '#16a34a', label: 'Berhasil' },
  settlement: { bg: '#dcfce7', color: '#16a34a', label: 'Berhasil' },
  success:    { bg: '#dcfce7', color: '#16a34a', label: 'Berhasil' },
  pending:    { bg: '#fef9c3', color: '#b45309', label: 'Menunggu' },
  failed:     { bg: '#fee2e2', color: '#dc2626', label: 'Gagal' },
  expired:    { bg: '#f1f5f9', color: '#64748b', label: 'Kedaluwarsa' },
  cancel:     { bg: '#f1f5f9', color: '#64748b', label: 'Dibatalkan' },
};

function getStatusStyle(status) {
  return STATUS_STYLES[status?.toLowerCase()] || { bg: '#f1f5f9', color: '#64748b', label: status || '-' };
}

export default function RiwayatPemesananPage() {
  const router = useRouter();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState(null); // [BARU]

  const fetchHistory = async () => {
    const token = localStorage.getItem('TOKEN');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/payments/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistory(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredHistory = filter === 'all'
    ? history
    : history.filter((trx) => {
        const s = trx.status?.toLowerCase();
        if (filter === 'success') return ['paid', 'settlement', 'success'].includes(s);
        if (filter === 'pending') return s === 'pending';
        if (filter === 'failed') return ['failed', 'expired', 'cancel'].includes(s);
        return true;
      });

  const filterOptions = [
    { key: 'all', label: 'Semua' },
    { key: 'success', label: 'Berhasil' },
    { key: 'pending', label: 'Menunggu' },
    { key: 'failed', label: 'Gagal' },
  ];

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif", minHeight: '100vh', background: '#f8faff' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .history-row { transition: background 0.2s; }
        .history-row:hover { background: #f8faff; }
        .filter-btn { transition: all 0.2s; }
        @media (max-width: 640px) {
          .history-table thead { display: none; }
          .history-table tr { display: block; margin-bottom: 12px; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 14px; }
          .history-table td { display: flex; justify-content: space-between; padding: 4px 0 !important; border: none !important; }
          .history-table td::before { content: attr(data-label); font-weight: 600; color: #94a3b8; font-size: 0.72rem; }
        }
      `}</style>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, animation: 'fadeUp 0.5s both' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 18px rgba(79,70,229,0.35)',
          }}>
            <i className="pi pi-history" style={{ color: '#fff', fontSize: '1.1rem' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              Riwayat Pemesanan
            </h1>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Semua transaksi langganan yang pernah Anda buat</p>
          </div>
        </div>

        {/* Filter */}
        <div style={{ display: 'flex', gap: 8, margin: '28px 0 20px', flexWrap: 'wrap' }}>
          {filterOptions.map((opt) => (
            <button
              key={opt.key}
              className="filter-btn"
              onClick={() => setFilter(opt.key)}
              style={{
                padding: '8px 16px', borderRadius: 99, border: filter === opt.key ? 'none' : '1.5px solid #e2e8f0',
                background: filter === opt.key ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : '#fff',
                color: filter === opt.key ? '#fff' : '#64748b', fontWeight: 600, fontSize: '0.8rem',
                cursor: 'pointer', fontFamily: "'Poppins', sans-serif",
                boxShadow: filter === opt.key ? '0 6px 16px rgba(79,70,229,0.3)' : 'none',
              }}
            >
              {opt.label}
            </button>
          ))}
          <button
            onClick={() => { setLoading(true); fetchHistory(); }}
            style={{
              marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
              borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', color: '#4f46e5',
              fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', fontFamily: "'Poppins', sans-serif",
            }}
          >
            <i className="pi pi-refresh" style={{ fontSize: '0.7rem' }} /> Muat Ulang
          </button>
        </div>

        {/* Table card */}
        <div style={{
          background: '#fff', borderRadius: 18, border: '1.5px solid #e2e8f0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)', overflow: 'hidden', animation: 'fadeUp 0.5s 0.1s both',
        }}>
          {loading ? (
            <div style={{ padding: '60px 24px', textAlign: 'center' }}>
              <div style={{
                width: 32, height: 32, margin: '0 auto 14px', borderRadius: '50%', border: '3px solid #e0e7ff',
                borderTopColor: '#4f46e5', animation: 'spin 0.8s linear infinite',
              }} />
              <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Memuat riwayat pemesanan...</span>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div style={{ padding: '56px 24px', textAlign: 'center' }}>
              <i className="pi pi-inbox" style={{ fontSize: '2.2rem', color: '#cbd5e1', marginBottom: 14, display: 'block' }} />
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
                    <th style={{ textAlign: 'left', padding: '14px 20px', color: '#94a3b8', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>No. Transaksi</th>
                    <th style={{ textAlign: 'left', padding: '14px 20px', color: '#94a3b8', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((trx, i) => {
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
                        <td data-label="No. Transaksi" style={{ padding: '16px 20px', color: '#94a3b8', fontSize: '0.78rem' }}>
                          {trx.order_id || trx.transaction_id || '-'}
                        </td>
                        <td data-label="Aksi" style={{ padding: '16px 20px' }}>
                          <button
                            onClick={() => setSelectedInvoice(trx)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8,
                              border: '1.5px solid #e2e8f0', background: '#fff', color: '#4f46e5', fontWeight: 600,
                              fontSize: '0.75rem', cursor: 'pointer', fontFamily: "'Poppins', sans-serif",
                            }}
                          >
                            <i className="pi pi-eye" style={{ fontSize: '0.7rem' }} /> Detail
                          </button>
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

      <InvoiceModal trx={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
    </div>
  );
}