'use client';
import { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const STATUS_CONFIG = {
  settlement: { label: 'Berhasil',    severity: 'success',   bg: '#dcfce7', color: '#16a34a' },
  paid:       { label: 'Berhasil',    severity: 'success',   bg: '#dcfce7', color: '#16a34a' },
  pending:    { label: 'Menunggu',    severity: 'warning',   bg: '#fef9c3', color: '#b45309' },
  failed:     { label: 'Gagal',       severity: 'danger',    bg: '#fee2e2', color: '#dc2626' },
  expired:    { label: 'Kedaluwarsa', severity: 'secondary', bg: '#f1f5f9', color: '#64748b' },
  cancel:     { label: 'Dibatalkan',  severity: 'secondary', bg: '#f1f5f9', color: '#64748b' },
};

const card = { borderRadius: 12, border: '1px solid var(--surface-200)', background: 'var(--surface-card)', padding: '1.25rem' };

function getStatusConfig(status) {
  return STATUS_CONFIG[status?.toLowerCase()] ?? { label: status || '-', severity: 'secondary', bg: '#f1f5f9', color: '#64748b' };
}

function formatDate(val, opts) {
  return val ? new Date(val).toLocaleString('id-ID', opts || { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
}
function formatRupiah(val) {
  return `Rp ${Number(val || 0).toLocaleString('id-ID')}`;
}

// ===================== Summary Cards =====================
function SummaryCard({ icon, label, value, tint }) {
  return (
    <div style={{
      ...card, display: 'flex', alignItems: 'center', gap: 14, padding: '1.1rem 1.25rem',
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: 10, background: tint.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <i className={`pi ${icon}`} style={{ color: tint.color, fontSize: '1.05rem' }} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-color-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          {label}
        </div>
        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-color)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {value}
        </div>
      </div>
    </div>
  );
}

// ===================== Detail Modal =====================
function DetailRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '9px 0', borderBottom: '1px solid #f1f5f9' }}>
      <span style={{ color: '#94a3b8' }}>{label}</span>
      <span style={{ color: '#0f172a', fontWeight: 600, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

function TransactionDetailModal({ trx, onClose }) {
  if (!trx) return null;
  const cfg = getStatusConfig(trx.status);

  return (
    <Dialog
      header={null}
      visible={!!trx}
      onHide={onClose}
      style={{ width: '95vw', maxWidth: 520 }}
      showHeader={false}
      dismissableMask
    >
      <div style={{
        background: 'linear-gradient(135deg,#1e1b4b,#4f46e5 55%,#7c3aed)',
        margin: '-1.25rem -1.25rem 0', padding: '24px 26px', borderRadius: '6px 6px 0 0',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -50, right: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
            Detail Transaksi
          </div>
          <div style={{ color: '#fff', fontSize: '1.15rem', fontWeight: 800 }}>#{trx.order_id || trx.id}</div>
          <span style={{
            display: 'inline-block', marginTop: 10, padding: '4px 12px', borderRadius: 99,
            background: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 700, fontSize: '0.7rem',
          }}>
            {cfg.label}
          </span>
        </div>
      </div>

      <div style={{ padding: '20px 4px 4px' }}>
        <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
          Pelanggan
        </div>
        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>{trx.full_name || '-'}</div>
        <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 18 }}>{trx.email || '-'}</div>

        <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
          Detail Pembayaran
        </div>
        <DetailRow label="Paket" value={trx.plan_name || '-'} />
        <DetailRow label="Jumlah" value={formatRupiah(trx.amount)} />
        <DetailRow label="Metode" value={trx.bank ? `${trx.bank.toUpperCase()} Virtual Account` : (trx.payment_type || '-')} />
        <DetailRow label="No. VA" value={trx.va_number || '-'} />
        <DetailRow label="Order ID" value={trx.order_id || '-'} />
        <DetailRow label="Transaction ID" value={trx.transaction_id || '-'} />
        <DetailRow label="Tanggal Transaksi" value={formatDate(trx.created_at, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} />
        <DetailRow label="Terakhir Diperbarui" value={formatDate(trx.updated_at, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} />

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 0 4px', marginTop: 8, borderTop: '1.5px dashed #e2e8f0',
        }}>
          <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>Total</span>
          <span style={{ fontWeight: 800, color: '#4f46e5', fontSize: '1.15rem' }}>{formatRupiah(trx.amount)}</span>
        </div>
      </div>
    </Dialog>
  );
}

// ===================== Main Page =====================
export default function SuperadminTransaksiPage() {
  const toast = useRef(null);
  const [data, setData]       = useState([]);
  const [total, setTotal]     = useState(0);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState(null);
  const [dateRange, setDateRange] = useState(null); // [start, end]
  const [page, setPage]       = useState(1);
  const [selectedTrx, setSelectedTrx] = useState(null);
  const limit = 10;

  const getToken = () => localStorage.getItem('TOKEN');

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${getToken()}` };
      const params = new URLSearchParams({ search, page, limit });
      if (status) params.set('status', status);
      if (dateRange?.[0]) params.set('start_date', dateRange[0].toISOString().slice(0, 10));
      if (dateRange?.[1]) params.set('end_date', dateRange[1].toISOString().slice(0, 10));

      const res = await fetch(`${BASE_URL}/superadmin/orders?${params}`, { headers });
      const json = await res.json();
      if (json.success) {
        setData(json.data.data);
        setTotal(json.data.meta.total);
        // Backend idealnya mengembalikan ringkasan keseluruhan (bukan cuma halaman ini) di json.data.summary
        if (json.data.summary) setSummary(json.data.summary);
      }
    } catch (err) {
      console.error(err);
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Gagal memuat transaksi' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [search, status, dateRange, page]);

  const statusTemplate = (row) => {
    const cfg = getStatusConfig(row.status);
    return <Tag value={cfg.label} severity={cfg.severity} />;
  };

  const detailTemplate = (row) => (
    <Button
      icon="pi pi-eye"
      label="Detail"
      size="small"
      outlined
      onClick={() => setSelectedTrx(row)}
    />
  );

  const exportCSV = () => {
    const headers = ['Order ID', 'Pelanggan', 'Email', 'Paket', 'Jumlah', 'Bank', 'Status', 'Tanggal'];
    const rows = data.map((r) => [
      r.order_id, r.full_name || '', r.email || '', r.plan_name || '-',
      r.amount, r.bank || '-', getStatusConfig(r.status).label, formatDate(r.created_at),
    ]);
    const csv = [headers, ...rows].map((row) => row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transaksi-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Fallback ringkasan dari data halaman ini kalau backend belum kirim summary global
  const fallbackSummary = {
    total_transaksi: total,
    total_revenue: data.filter((o) => ['settlement', 'paid'].includes(o.status?.toLowerCase())).reduce((a, o) => a + Number(o.amount), 0),
    total_berhasil: data.filter((o) => ['settlement', 'paid'].includes(o.status?.toLowerCase())).length,
    total_pending: data.filter((o) => o.status?.toLowerCase() === 'pending').length,
    total_gagal: data.filter((o) => ['failed', 'expired', 'cancel'].includes(o.status?.toLowerCase())).length,
  };
  const s = summary || fallbackSummary;

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 0.5rem' }}>
      <Toast ref={toast} />

      <div style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ margin: 0, marginBottom: 4, fontSize: '1.2rem', fontWeight: 700 }}>Riwayat Transaksi</h2>
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-color-secondary)' }}>Semua transaksi Midtrans dari seluruh pelanggan</p>
        {!summary && (
          <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: '#f59e0b' }}>
            * Ringkasan di bawah dihitung dari halaman yang tampil saja — tambahkan field <code>summary</code> di response <code>/superadmin/orders</code> untuk ringkasan total keseluruhan.
          </p>
        )}
      </div>

      {/* Summary cards */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: '1.25rem',
      }}>
        <SummaryCard icon="pi-wallet" label="Total Revenue" value={formatRupiah(s.total_revenue)} tint={{ bg: '#ede9fe', color: '#7c3aed' }} />
        <SummaryCard icon="pi-list" label="Total Transaksi" value={s.total_transaksi} tint={{ bg: '#e0e7ff', color: '#4f46e5' }} />
        <SummaryCard icon="pi-check-circle" label="Berhasil" value={s.total_berhasil} tint={{ bg: '#dcfce7', color: '#16a34a' }} />
        <SummaryCard icon="pi-clock" label="Menunggu" value={s.total_pending} tint={{ bg: '#fef9c3', color: '#b45309' }} />
        <SummaryCard icon="pi-times-circle" label="Gagal / Kedaluwarsa" value={s.total_gagal} tint={{ bg: '#fee2e2', color: '#dc2626' }} />
      </div>

      <div style={card}>
        <div style={{ display: 'flex', gap: 10, marginBottom: '1rem', flexWrap: 'wrap' }}>
          <span className="p-input-icon-left" style={{ flex: 1, minWidth: 220 }}>
            <i className="pi pi-search" />
            <InputText placeholder="Cari nama, email, atau order ID..." value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} style={{ width: '100%' }} />
          </span>
          <Dropdown
            value={status}
            onChange={(e) => { setPage(1); setStatus(e.value); }}
            options={[
              { label: 'Semua Status', value: null },
              { label: 'Berhasil', value: 'settlement' },
              { label: 'Menunggu', value: 'pending' },
              { label: 'Gagal', value: 'failed' },
              { label: 'Kedaluwarsa', value: 'expired' },
            ]}
            placeholder="Semua Status"
            style={{ minWidth: 170 }}
          />
          <Calendar
            value={dateRange}
            onChange={(e) => { setPage(1); setDateRange(e.value); }}
            selectionMode="range"
            readOnlyInput
            placeholder="Rentang tanggal"
            dateFormat="dd/mm/yy"
            style={{ minWidth: 200 }}
            showButtonBar
          />
          <Button icon="pi pi-refresh" outlined onClick={fetchData} loading={loading} />
          <Button icon="pi pi-download" label="Export CSV" outlined onClick={exportCSV} disabled={data.length === 0} />
        </div>

        <DataTable value={data} loading={loading} emptyMessage="Belum ada transaksi" size="small" stripedRows style={{ fontSize: '0.82rem' }}>
          <Column header="No"          body={(_, o) => (page - 1) * limit + o.rowIndex + 1} style={{ width: '3rem', textAlign: 'center' }} />
          <Column field="order_id"     header="Order ID" />
          <Column field="full_name"    header="Pelanggan" style={{ fontWeight: 600 }} body={(r) => r.full_name || r.email} />
          <Column field="plan_name"    header="Paket" body={(r) => r.plan_name || '-'} />
          <Column header="Jumlah"      body={(r) => formatRupiah(r.amount)} />
          <Column field="bank"         header="Bank" body={(r) => r.bank || '-'} />
          <Column header="Status"      body={statusTemplate} />
          <Column header="Tanggal"     body={(r) => formatDate(r.created_at)} />
          <Column header="Aksi"        body={detailTemplate} style={{ width: '7rem' }} />
        </DataTable>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-color-secondary)' }}>
            Menampilkan {data.length} dari {total} transaksi
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button label="Sebelumnya" size="small" outlined disabled={page === 1} onClick={() => setPage((p) => p - 1)} />
            <Button label="Berikutnya" size="small" outlined disabled={page * limit >= total} onClick={() => setPage((p) => p + 1)} />
          </div>
        </div>
      </div>

      <TransactionDetailModal trx={selectedTrx} onClose={() => setSelectedTrx(null)} />
    </div>
  );
}