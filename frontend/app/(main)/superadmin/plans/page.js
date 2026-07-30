'use client';
import { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const card = { borderRadius: 12, border: '1px solid var(--surface-200)', background: 'var(--surface-card)', padding: '1.25rem' };
const EMPTY_FORM = { id: null, name: '', price: 0, duration_days: 30, description: '', is_active: true };

export default function SuperadminPlansPage() {
  const toast = useRef(null);
  const [plans, setPlans]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm]       = useState(EMPTY_FORM);
  const [saving, setSaving]   = useState(false);

  const getToken = () => localStorage.getItem('TOKEN');
  const headers = () => ({ Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' });

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/superadmin/plans`, { headers: headers() });
      const json = await res.json();
      if (json.success) setPlans(json.data);
    } catch (err) {
      console.error(err);
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Gagal memuat plan' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlans(); }, []);

  const openCreate = () => { setForm(EMPTY_FORM); setDialogOpen(true); };
  const openEdit = (row) => { setForm({ ...row }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.duration_days) {
      toast.current?.show({ severity: 'warn', summary: 'Peringatan', detail: 'Nama, harga, dan durasi wajib diisi' });
      return;
    }
    setSaving(true);
    try {
      const isEdit = !!form.id;
      const url = isEdit ? `${BASE_URL}/superadmin/plans/${form.id}` : `${BASE_URL}/superadmin/plans`;
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: headers(),
        body: JSON.stringify({
          name: form.name, price: form.price, duration_days: form.duration_days,
          description: form.description, is_active: form.is_active,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.current?.show({ severity: 'success', summary: 'Berhasil', detail: json.message });
        setDialogOpen(false);
        fetchPlans();
      } else {
        toast.current?.show({ severity: 'error', summary: 'Gagal', detail: json.message });
      }
    } catch (err) {
      console.error(err);
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Gagal menyimpan plan' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = (row) => {
    confirmDialog({
      message: `Nonaktifkan paket "${row.name}"? Paket lama tetap tersimpan buat riwayat transaksi.`,
      header: 'Konfirmasi',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          const res = await fetch(`${BASE_URL}/superadmin/plans/${row.id}`, { method: 'DELETE', headers: headers() });
          const json = await res.json();
          if (json.success) {
            toast.current?.show({ severity: 'success', summary: 'Berhasil', detail: json.message });
            fetchPlans();
          }
        } catch (err) {
          console.error(err);
        }
      },
    });
  };

  const formatRupiah = (val) => `Rp ${Number(val || 0).toLocaleString('id-ID')}`;

  const aksiTemplate = (row) => (
    <div style={{ display: 'flex', gap: 4 }}>
      <Button icon="pi pi-pencil" text size="small" onClick={() => openEdit(row)} />
      <Button icon="pi pi-trash" text size="small" severity="danger" onClick={() => handleDeactivate(row)} disabled={!row.is_active} />
    </div>
  );

  const statusTemplate = (row) => row.is_active
    ? <Tag value="Aktif" severity="success" />
    : <Tag value="Nonaktif" severity="secondary" />;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 0.5rem' }}>
      <Toast ref={toast} />
      <ConfirmDialog />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0, marginBottom: 4, fontSize: '1.2rem', fontWeight: 700 }}>Paket Langganan</h2>
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-color-secondary)' }}>Kelola harga dan fitur paket Starter/Growth/Pro</p>
        </div>
        <Button label="Tambah Paket" icon="pi pi-plus" onClick={openCreate} />
      </div>

      <div style={card}>
        <DataTable value={plans} loading={loading} emptyMessage="Belum ada paket" size="small" stripedRows style={{ fontSize: '0.82rem' }}>
          <Column header="No"            body={(_, o) => o.rowIndex + 1} style={{ width: '3rem', textAlign: 'center' }} />
          <Column field="name"           header="Nama Paket" style={{ fontWeight: 600 }} />
          <Column header="Harga"         body={(r) => formatRupiah(r.price)} />
          <Column header="Durasi"        body={(r) => `${r.duration_days} hari`} />
          <Column field="description"    header="Deskripsi" body={(r) => (
            <span style={{ display: 'block', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description || '-'}</span>
          )} />
          <Column header="Status"        body={statusTemplate} />
          <Column header="Aksi"          body={aksiTemplate} style={{ width: '6rem' }} />
        </DataTable>
      </div>

      <Dialog header={form.id ? 'Edit Paket' : 'Tambah Paket'} visible={dialogOpen} style={{ width: 420 }} onHide={() => setDialogOpen(false)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: 8 }}>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Nama Paket</label>
            <InputText value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ width: '100%' }} placeholder="Starter / Growth / Pro" />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Harga (Rp)</label>
            <InputNumber value={form.price} onValueChange={(e) => setForm({ ...form, price: e.value })} style={{ width: '100%' }} inputStyle={{ width: '100%' }} min={0} />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Durasi (hari)</label>
            <InputNumber value={form.duration_days} onValueChange={(e) => setForm({ ...form, duration_days: e.value })} style={{ width: '100%' }} inputStyle={{ width: '100%' }} min={1} />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Deskripsi</label>
            <InputTextarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} style={{ width: '100%' }} />
          </div>
          <Button label={saving ? 'Menyimpan...' : 'Simpan'} icon="pi pi-check" onClick={handleSave} loading={saving} />
        </div>
      </Dialog>
    </div>
  );
}