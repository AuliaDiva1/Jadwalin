'use client';
import { useState, useEffect, useRef } from 'react';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { useRouter } from 'next/navigation';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const PLAN_STATUS_CONFIG = {
  active:  { label: 'Aktif',       severity: 'success'   },
  pending: { label: 'Menunggu',    severity: 'warning'   },
  expired: { label: 'Kedaluwarsa', severity: 'secondary' },
};

const ORDER_STATUS_CONFIG = {
  settlement: { label: 'Berhasil', severity: 'success'   },
  paid:       { label: 'Berhasil', severity: 'success'   },
  pending:    { label: 'Menunggu', severity: 'warning'   },
  failed:     { label: 'Gagal',    severity: 'danger'    },
  expired:    { label: 'Kedaluwarsa', severity: 'secondary' },
  cancel:     { label: 'Dibatalkan', severity: 'secondary' },
};

const card = {
  borderRadius: 12,
  border: '1px solid var(--surface-200)',
  background: 'var(--surface-card)',
  padding: '1.25rem',
};

const SectionTitle = ({ children }) => (
  <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-color-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
    {children}
  </p>
);

const EmptyState = ({ icon, text }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '2rem 0', color: 'var(--text-color-secondary)' }}>
    <i className={`pi ${icon}`} style={{ fontSize: '1.5rem', opacity: 0.45 }} />
    <p style={{ margin: 0, fontSize: '0.82rem' }}>{text}</p>
  </div>
);

export default function SuperadminDashboard() {
  const toast   = useRef(null);
  const router  = useRouter();

  const [stats,       setStats]       = useState(null);
  const [pelanggan,   setPelanggan]   = useState([]);
  const [orders,      setOrders]      = useState([]);
  const [search,      setSearch]      = useState('');
  const [loading,     setLoading]     = useState(true);

  const getToken = () => localStorage.getItem('TOKEN');

  const fetchAll = async () => {
    setLoading(true);
    const headers = { Authorization: `Bearer ${getToken()}` };
    try {
      const [resStats, resPelanggan, resOrders] = await Promise.all([
        fetch(`${BASE_URL}/superadmin/dashboard/stats`, { headers }),
        fetch(`${BASE_URL}/superadmin/users?role=PELANGGAN&limit=8`, { headers }),
        fetch(`${BASE_URL}/superadmin/orders?limit=8`, { headers }),
      ]);

      const [dStats, dPelanggan, dOrders] = await Promise.all([
        resStats.json(), resPelanggan.json(), resOrders.json(),
      ]);

      if (dStats.success)     setStats(dStats.data);
      if (dPelanggan.success) setPelanggan(dPelanggan.data?.data || []);
      if (dOrders.success)    setOrders(dOrders.data?.data || []);
    } catch (err) {
      console.error('fetchAll error:', err);
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Gagal memuat data dashboard' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const formatDate = (val) =>
    val ? new Date(val).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

  const formatRupiah = (val) =>
    `Rp ${Number(val || 0).toLocaleString('id-ID')}`;

  const planStatusTemplate = (row) => {
    const key = row.subscription_status;
    const config = PLAN_STATUS_CONFIG[key] ?? { label: 'Belum Beli', severity: 'secondary' };
    return <Tag value={row.plan_name ? `${config.label} — ${row.plan_name}` : config.label} severity={config.severity} />;
  };

  const orderStatusTemplate = (row) => {
    const key = row.status?.toLowerCase();
    const config = ORDER_STATUS_CONFIG[key] ?? { label: row.status || '-', severity: 'secondary' };
    return <Tag value={config.label} severity={config.severity} />;
  };

  const statCards = [
    { label: 'Total Pendaftar', value: stats?.total_pendaftar,      sub: 'akun role PELANGGAN',           icon: 'pi-users',        color: '#4f46e5', bg: '#eef2ff', route: '/superadmin/pelanggan' },
    { label: 'Profil Lengkap',  value: stats?.total_profil_lengkap, sub: 'sudah isi data perusahaan',      icon: 'pi-building',     color: '#0891b2', bg: '#e0f2fe', route: '/superadmin/perusahaan' },
    { label: 'Pembeli Aktif',   value: stats?.total_pembeli,        sub: 'langganan status aktif',         icon: 'pi-verified',     color: '#059669', bg: '#d1fae5', route: '/superadmin/pelanggan' },
    { label: 'Total Revenue',   value: formatRupiah(stats?.total_revenue), sub: 'dari transaksi berhasil', icon: 'pi-wallet',       color: '#d97706', bg: '#fef3c7', route: '/superadmin/transaksi' },
    { label: 'Conversion Rate', value: `${stats?.conversion_rate ?? 0}%`,  sub: 'pendaftar jadi pembeli',  icon: 'pi-chart-line',   color: '#7c3aed', bg: '#f5f3ff', route: '/superadmin/pelanggan' },
  ];

  const menuShortcuts = [
    { label: 'Pendaftar & Pelanggan', icon: 'pi-users',    desc: 'Lihat semua pendaftar dan status pembeliannya', route: '/superadmin/pelanggan', color: '#4f46e5', bg: '#eef2ff' },
    { label: 'Profil Perusahaan',     icon: 'pi-building', desc: 'Data perusahaan yang sudah diisi pelanggan',    route: '/superadmin/perusahaan', color: '#0891b2', bg: '#e0f2fe' },
    { label: 'Paket Langganan',       icon: 'pi-tags',     desc: 'Kelola harga dan fitur paket Starter/Growth/Pro', route: '/superadmin/plans',    color: '#059669', bg: '#d1fae5' },
    { label: 'Riwayat Transaksi',     icon: 'pi-wallet',   desc: 'Semua transaksi Midtrans dari seluruh pelanggan', route: '/superadmin/transaksi', color: '#d97706', bg: '#fef3c7' },
    { label: 'Semua Pengguna',        icon: 'pi-user-edit', desc: 'Kelola akun lintas role (admin, manajer, dst)', route: '/superadmin/users',      color: '#7c3aed', bg: '#f5f3ff' },
  ];

  const maxGrowth = Math.max(1, ...(stats?.growth?.map((g) => g.jumlah) || [1]));

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 0.5rem' }}>
      <Toast ref={toast} />

      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', paddingBottom: '1rem', borderBottom: '1px solid var(--surface-200)' }}>
        <div>
          <h2 style={{ margin: 0, marginBottom: 4, fontSize: '1.2rem', fontWeight: 700 }}>Dashboard Superadmin</h2>
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-color-secondary)' }}>Panel bisnis SaaS — pendaftar, pelanggan, dan langganan Jadwalin</p>
        </div>
        <Button label="Refresh" icon="pi pi-refresh" outlined size="small" onClick={fetchAll} loading={loading} />
      </div>

      {/* STAT CARDS */}
      <SectionTitle>Ringkasan Bisnis</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: '1.75rem' }}>
        {statCards.map((s, i) => (
          <div key={i} onClick={() => router.push(s.route)}
            style={{ ...card, borderLeft: `3px solid ${s.color}`, cursor: 'pointer', transition: 'box-shadow 0.2s, transform 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 18px rgba(0,0,0,0.09)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <p style={{ margin: 0, fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-color-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1.3 }}>{s.label}</p>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className={`pi ${s.icon}`} style={{ fontSize: '0.82rem', color: s.color }} />
              </div>
            </div>
            <p style={{ margin: 0, marginBottom: 3, fontSize: '1.4rem', fontWeight: 700, color: s.color, lineHeight: 1 }}>{loading ? '—' : s.value ?? 0}</p>
            <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-color-secondary)' }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* GROWTH PENDAFTAR */}
      {stats?.growth?.length > 0 && (
        <>
          <SectionTitle>Pertumbuhan Pendaftar per Bulan</SectionTitle>
          <div style={{ ...card, marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 140 }}>
              {stats.growth.map((g, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#4f46e5' }}>{g.jumlah}</span>
                  <div style={{
                    width: '100%', maxWidth: 36,
                    height: `${Math.max(6, (g.jumlah / maxGrowth) * 100)}px`,
                    background: 'linear-gradient(180deg,#818cf8,#4f46e5)',
                    borderRadius: 6,
                  }} />
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-color-secondary)' }}>{g.bulan}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* PENDAFTAR TERBARU + TRANSAKSI TERBARU */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: '1.75rem' }}>
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="pi pi-users" style={{ color: '#4f46e5', fontSize: '0.9rem' }} />
              <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Pendaftar Terbaru</span>
            </div>
            <Button label="Lihat Semua" text size="small" onClick={() => router.push('/superadmin/pelanggan')} />
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}><i className="pi pi-spin pi-spinner" /></div>
          ) : pelanggan.length === 0 ? (
            <EmptyState icon="pi-users" text="Belum ada pendaftar" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {pelanggan.slice(0, 6).map((p) => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 8, background: 'var(--surface-50)', border: '1px solid var(--surface-200)' }}>
                  <div style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.full_name}</p>
                    <p style={{ margin: 0, marginTop: 2, fontSize: '0.72rem', color: 'var(--text-color-secondary)' }}>
                      {p.company_name || 'Belum isi profil'} · {formatDate(p.tanggal_daftar)}
                    </p>
                  </div>
                  {planStatusTemplate(p)}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="pi pi-wallet" style={{ color: '#d97706', fontSize: '0.9rem' }} />
              <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Transaksi Terbaru</span>
            </div>
            <Button label="Lihat Semua" text size="small" onClick={() => router.push('/superadmin/transaksi')} />
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}><i className="pi pi-spin pi-spinner" /></div>
          ) : orders.length === 0 ? (
            <EmptyState icon="pi-wallet" text="Belum ada transaksi" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {orders.slice(0, 6).map((o) => (
                <div key={o.order_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 8, background: 'var(--surface-50)', border: '1px solid var(--surface-200)' }}>
                  <div style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.full_name || o.email}</p>
                    <p style={{ margin: 0, marginTop: 2, fontSize: '0.72rem', color: 'var(--text-color-secondary)' }}>
                      {o.plan_name || '-'} · {formatRupiah(o.amount)}
                    </p>
                  </div>
                  {orderStatusTemplate(o)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AKSES CEPAT */}
      <SectionTitle>Akses Cepat</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {menuShortcuts.map((m, i) => (
          <div key={i} onClick={() => router.push(m.route)}
            style={{ ...card, display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', padding: '1rem', transition: 'box-shadow 0.2s, transform 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 9, background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className={`pi ${m.icon}`} style={{ fontSize: '0.9rem', color: m.color }} />
            </div>
            <div>
              <p style={{ margin: 0, marginBottom: 3, fontWeight: 600, fontSize: '0.85rem' }}>{m.label}</p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-color-secondary)', lineHeight: 1.5 }}>{m.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}