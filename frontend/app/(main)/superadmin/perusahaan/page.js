'use client';
import { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const card = { borderRadius: 12, border: '1px solid var(--surface-200)', background: 'var(--surface-card)', padding: '1.25rem' };

export default function SuperadminPerusahaanPage() {
  const toast = useRef(null);
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [detail, setDetail]   = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const getToken = () => localStorage.getItem('TOKEN');

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${getToken()}` };
      const params = new URLSearchParams({ role: 'PELANGGAN', search, limit: 100 });
      const res = await fetch(`${BASE_URL}/superadmin/users?${params}`, { headers });
      const json = await res.json();
      if (json.success) {
        setData(json.data.data.filter((u) => u.is_completed));
      }
    } catch (err) {
      console.error(err);
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Gagal memuat profil perusahaan' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [search]);

  const openDetail = async (row) => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${getToken()}` };
      const res = await fetch(`${BASE_URL}/superadmin/users/${row.id}`, { headers });
      const json = await res.json();
      if (json.success) {
        setDetail(json.data);
        setDetailOpen(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const aksiTemplate = (row) => (
    <Button icon="pi pi-eye" label="Detail" text size="small" onClick={() => openDetail(row)} />
  );

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 0.5rem' }}>
      <Toast ref={toast} />

      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, marginBottom: 4, fontSize: '1.2rem', fontWeight: 700 }}>Profil Perusahaan</h2>
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-color-secondary)' }}>Data perusahaan yang sudah diisi pelanggan setelah login</p>
      </div>

      <div style={card}>
        <span className="p-input-icon-left" style={{ display: 'block', marginBottom: '1rem', maxWidth: 320 }}>
          <i className="pi pi-search" />
          <InputText placeholder="Cari nama perusahaan..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%' }} />
        </span>

        <DataTable value={data} loading={loading} emptyMessage="Belum ada profil perusahaan lengkap" size="small" stripedRows style={{ fontSize: '0.82rem' }}>
          <Column header="No"           body={(_, o) => o.rowIndex + 1} style={{ width: '3rem', textAlign: 'center' }} />
          <Column field="company_name"  header="Nama Perusahaan" style={{ fontWeight: 600 }} />
          <Column field="industry"      header="Industri"   body={(r) => r.industry || '-'} />
          <Column field="city"          header="Kota"       body={(r) => r.city || '-'} />
          <Column field="full_name"     header="PIC / Kontak" />
          <Column field="email"         header="Email" />
          <Column header="Aksi" body={aksiTemplate} style={{ width: '7rem' }} />
        </DataTable>
      </div>

      <Dialog header="Detail Perusahaan" visible={detailOpen} style={{ width: 460 }} onHide={() => setDetailOpen(false)}>
        {detail && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.85rem' }}>
            {[
              ['Nama Perusahaan', detail.company_name],
              ['Industri', detail.industry],
              ['Ukuran Perusahaan', detail.company_size],
              ['Kota', detail.city],
              ['Alamat', detail.address],
              ['No. Telepon', detail.phone_number],
              ['Website', detail.website],
              ['PIC', detail.full_name],
              ['Email', detail.email],
            ].map(([label, val], i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ color: 'var(--text-color-secondary)' }}>{label}</span>
                <span style={{ fontWeight: 600, textAlign: 'right' }}>{val || '-'}</span>
              </div>
            ))}
          </div>
        )}
      </Dialog>
    </div>
  );
}