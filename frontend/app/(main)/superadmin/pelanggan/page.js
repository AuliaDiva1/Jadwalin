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

const PLAN_STATUS_CONFIG = {
  active:  { label: 'Aktif',       severity: 'success'   },
  pending: { label: 'Menunggu',    severity: 'warning'   },
  expired: { label: 'Kedaluwarsa', severity: 'secondary' },
};

const card = { borderRadius: 12, border: '1px solid var(--surface-200)', background: 'var(--surface-card)', padding: '1.25rem' };

export default function SuperadminPelangganPage() {
  const toast = useRef(null);
  const [data, setData]         = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [status, setStatus]     = useState('all');
  const [page, setPage]         = useState(1);
  const limit = 10;

  const getToken = () => localStorage.getItem('TOKEN');

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${getToken()}` };
      const params = new URLSearchParams({ role: 'PELANGGAN', search, status, page, limit });
      const res = await fetch(`${BASE_URL}/superadmin/users?${params}`, { headers });
      const json = await res.json();
      if (json.success) {
        setData(json.data.data);
        setTotal(json.data.meta.total);
      }
    } catch (err) {
      console.error(err);
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Gagal memuat data pelanggan' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [search, status, page]);

  const formatDate = (val) => val ? new Date(val).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

  const statusTemplate = (row) => {
    const config = PLAN_STATUS_CONFIG[row.subscription_status] ?? { label: 'Belum Beli', severity: 'secondary' };
    return <Tag value={row.plan_name ? `${config.label} — ${row.plan_name}` : config.label} severity={config.severity} />;
  };

  const profilTemplate = (row) => row.is_completed
    ? <Tag value="Lengkap" severity="success" />
    : <Tag value="Belum Lengkap" severity="secondary" />;

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 0.5rem' }}>
      <Toast ref={toast} />

      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, marginBottom: 4, fontSize: '1.2rem', fontWeight: 700 }}>Pendaftar & Pelanggan</h2>
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-color-secondary)' }}>Semua akun dengan role PELANGGAN — status pendaftaran dan pembelian</p>
      </div>

      <div style={card}>
        <div style={{ display: 'flex', gap: 10, marginBottom: '1rem', flexWrap: 'wrap' }}>
          <span className="p-input-icon-left" style={{ flex: 1, minWidth: 240 }}>
            <i className="pi pi-search" />
            <InputText
              placeholder="Cari nama, email, atau perusahaan..."
              value={search}
              onChange={(e) => { setPage(1); setSearch(e.target.value); }}
              style={{ width: '100%' }}
            />
          </span>
          <Dropdown
            value={status}
            onChange={(e) => { setPage(1); setStatus(e.value); }}
            options={[
              { label: 'Semua', value: 'all' },
              { label: 'Sudah Membeli', value: 'buyer' },
              { label: 'Belum Membeli', value: 'trial' },
            ]}
            style={{ minWidth: 180 }}
          />
          <Button icon="pi pi-refresh" outlined onClick={fetchData} loading={loading} />
        </div>

        <DataTable value={data} loading={loading} emptyMessage="Belum ada pendaftar" size="small" stripedRows style={{ fontSize: '0.82rem' }}>
          <Column header="No"          body={(_, o) => o.rowIndex + 1} style={{ width: '3rem', textAlign: 'center' }} />
          <Column field="full_name"    header="Nama"       style={{ fontWeight: 600 }} />
          <Column field="email"        header="Email"      />
          <Column header="Perusahaan"  body={(r) => r.company_name || <span style={{ color: 'var(--text-color-secondary)' }}>Belum diisi</span>} />
          <Column field="industry"     header="Industri"   body={(r) => r.industry || '-'} />
          <Column field="city"         header="Kota"       body={(r) => r.city || '-'} />
          <Column header="Profil"      body={profilTemplate} />
          <Column header="Tgl Daftar"  body={(r) => formatDate(r.tanggal_daftar)} />
          <Column header="Status Paket" body={statusTemplate} />
        </DataTable>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-color-secondary)' }}>
            Menampilkan {data.length} dari {total} pendaftar
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