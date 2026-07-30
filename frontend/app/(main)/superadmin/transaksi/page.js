'use client';
import { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const STATUS_CONFIG = {
  settlement: { label: 'Berhasil',    severity: 'success'   },
  paid:       { label: 'Berhasil',    severity: 'success'   },
  pending:    { label: 'Menunggu',    severity: 'warning'   },
  failed:     { label: 'Gagal',       severity: 'danger'    },
  expired:    { label: 'Kedaluwarsa', severity: 'secondary' },
  cancel:     { label: 'Dibatalkan',  severity: 'secondary' },
};

const card = { borderRadius: 12, border: '1px solid var(--surface-200)', background: 'var(--surface-card)', padding: '1.25rem' };

export default function SuperadminTransaksiPage() {
  const toast = useRef(null);
  const [data, setData]       = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState(null);
  const [page, setPage]       = useState(1);
  const limit = 10;

  const getToken = () => localStorage.getItem('TOKEN');

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${getToken()}` };
      const params = new URLSearchParams({ search, page, limit });
      if (status) params.set('status', status);
      const res = await fetch(`${BASE_URL}/superadmin/orders?${params}`, { headers });
      const json = await res.json();
      if (json.success) {
        setData(json.data.data);
        setTotal(json.data.meta.total);
      }
    } catch (err) {
      console.error(err);
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Gagal memuat transaksi' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [search, status, page]);

  const formatDate = (val) => val ? new Date(val).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
  const formatRupiah = (val) => `Rp ${Number(val || 0).toLocaleString('id-ID')}`;

  const statusTemplate = (row) => {
    const config = STATUS_CONFIG[row.status?.toLowerCase()] ?? { label: row.status || '-', severity: 'secondary' };
    return <Tag value={config.label} severity={config.severity} />;
  };

  const totalBerhasil = data.filter((o) => ['settlement', 'paid'].includes(o.status?.toLowerCase())).reduce((a, o) => a + Number(o.amount), 0);

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 0.5rem' }}>
      <Toast ref={toast} />

      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, marginBottom: 4, fontSize: '1.2rem', fontWeight: 700 }}>Riwayat Transaksi</h2>
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-color-secondary)' }}>Semua transaksi Midtrans dari seluruh pelanggan</p>
      </div>

      <div style={card}>
        <div style={{ display: 'flex', gap: 10, marginBottom: '1rem', flexWrap: 'wrap' }}>
          <span className="p-input-icon-left" style={{ flex: 1, minWidth: 240 }}>
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
            style={{ minWidth: 180 }}
          />
          <Button icon="pi pi-refresh" outlined onClick={fetchData} loading={loading} />
        </div>

        <DataTable value={data} loading={loading} emptyMessage="Belum ada transaksi" size="small" stripedRows style={{ fontSize: '0.82rem' }}>
          <Column header="No"          body={(_, o) => o.rowIndex + 1} style={{ width: '3rem', textAlign: 'center' }} />
          <Column field="order_id"     header="Order ID" />
          <Column field="full_name"    header="Pelanggan" style={{ fontWeight: 600 }} body={(r) => r.full_name || r.email} />
          <Column field="plan_name"    header="Paket" body={(r) => r.plan_name || '-'} />
          <Column header="Jumlah"      body={(r) => formatRupiah(r.amount)} />
          <Column field="bank"         header="Bank" body={(r) => r.bank || '-'} />
          <Column header="Status"      body={statusTemplate} />
          <Column header="Tanggal"     body={(r) => formatDate(r.created_at)} />
        </DataTable>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-color-secondary)' }}>
            Menampilkan {data.length} dari {total} transaksi &middot; Total berhasil (halaman ini): <strong>{formatRupiah(totalBerhasil)}</strong>
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button label="Sebelumnya" size="small" outlined disabled={page === 1} onClick={() => setPage((p) => p - 1)} />
            <Button label="Berikutnya" size="small" outlined disabled={page * limit >= total} onClick={() => setPage((p) => p + 1)} />
          </div>
        </div>
      </div>
    </div>
  );
}