'use client';
import { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const card = { borderRadius: 12, border: '1px solid var(--surface-200)', background: 'var(--surface-card)', padding: '1.25rem' };

const ROLE_OPTIONS = [
  { label: 'Superadmin',        value: 'SUPERADMIN' },
  { label: 'Admin',             value: 'ADMIN' },
  { label: 'Manajer Produksi',  value: 'MANAJER_PRODUKSI' },
  { label: 'Staff Gudang',      value: 'STAFF_GUDANG' },
  { label: 'Pelanggan',         value: 'PELANGGAN' },
];

const ROLE_SEVERITY = {
  SUPERADMIN: 'danger',
  ADMIN: 'info',
  MANAJER_PRODUKSI: 'warning',
  STAFF_GUDANG: 'success',
  PELANGGAN: 'secondary',
};

const EMPTY_FORM = { id: null, username: '', full_name: '', email: '', password: '', role: 'STAFF_GUDANG', is_active: true };

export default function SuperadminUsersPage() {
  const toast = useRef(null);
  const [users, setUsers]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [roleFilter, setRoleFilter] = useState(null);
  const [page, setPage]       = useState(1);
  const limit = 10;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm]       = useState(EMPTY_FORM);
  const [saving, setSaving]   = useState(false);

  const getToken = () => localStorage.getItem('TOKEN');
  const headers = () => ({ Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, page, limit });
      if (roleFilter) params.set('role', roleFilter);
      const res = await fetch(`${BASE_URL}/superadmin/users?${params}`, { headers: headers() });
      const json = await res.json();
      if (json.success) {
        setUsers(json.data.data);
        setTotal(json.data.meta.total);
      }
    } catch (err) {
      console.error(err);
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Gagal memuat pengguna' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [search, roleFilter, page]);

  const openCreate = () => { setForm(EMPTY_FORM); setDialogOpen(true); };
  const openEdit = (row) => { setForm({ ...row, password: '' }); setDialogOpen(true); };

  const handleSave = async () => {
    const isEdit = !!form.id;
    if (!isEdit && (!form.username || !form.full_name || !form.email || !form.password || !form.role)) {
      toast.current?.show({ severity: 'warn', summary: 'Peringatan', detail: 'Semua field wajib diisi' });
      return;
    }
    setSaving(true);
    try {
      const url = isEdit ? `${BASE_URL}/superadmin/users/${form.id}` : `${BASE_URL}/superadmin/users`;
      const body = isEdit
        ? { username: form.username, full_name: form.full_name, email: form.email, role: form.role, is_active: form.is_active, ...(form.password ? { password: form.password } : {}) }
        : { username: form.username, full_name: form.full_name, email: form.email, password: form.password, role: form.role };

      const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: headers(), body: JSON.stringify(body) });
      const json = await res.json();
      if (json.success) {
        toast.current?.show({ severity: 'success', summary: 'Berhasil', detail: json.message });
        setDialogOpen(false);
        fetchUsers();
      } else {
        toast.current?.show({ severity: 'error', summary: 'Gagal', detail: json.message });
      }
    } catch (err) {
      console.error(err);
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Gagal menyimpan pengguna' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (row) => {
    confirmDialog({
      message: `Hapus akun "${row.full_name}"? Tindakan ini tidak bisa dibatalkan.`,
      header: 'Konfirmasi Hapus',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        try {
          const res = await fetch(`${BASE_URL}/superadmin/users/${row.id}`, { method: 'DELETE', headers: headers() });
          const json = await res.json();
          if (json.success) {
            toast.current?.show({ severity: 'success', summary: 'Berhasil', detail: json.message });
            fetchUsers();
          } else {
            toast.current?.show({ severity: 'error', summary: 'Gagal', detail: json.message });
          }
        } catch (err) {
          console.error(err);
        }
      },
    });
  };

  const roleTemplate = (row) => <Tag value={row.role} severity={ROLE_SEVERITY[row.role] ?? 'secondary'} />;
  const statusTemplate = (row) => row.is_active ? <Tag value="Aktif" severity="success" /> : <Tag value="Nonaktif" severity="secondary" />;

  const aksiTemplate = (row) => (
    <div style={{ display: 'flex', gap: 4 }}>
      <Button icon="pi pi-pencil" text size="small" onClick={() => openEdit(row)} />
      <Button icon="pi pi-trash" text size="small" severity="danger" onClick={() => handleDelete(row)} />
    </div>
  );

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 0.5rem' }}>
      <Toast ref={toast} />
      <ConfirmDialog />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0, marginBottom: 4, fontSize: '1.2rem', fontWeight: 700 }}>Semua Pengguna</h2>
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-color-secondary)' }}>Kelola akun lintas role — superadmin, admin, manajer, staff, pelanggan</p>
        </div>
        <Button label="Tambah Pengguna" icon="pi pi-plus" onClick={openCreate} />
      </div>

      <div style={card}>
        <div style={{ display: 'flex', gap: 10, marginBottom: '1rem', flexWrap: 'wrap' }}>
          <span className="p-input-icon-left" style={{ flex: 1, minWidth: 240 }}>
            <i className="pi pi-search" />
            <InputText placeholder="Cari nama, email, username..." value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} style={{ width: '100%' }} />
          </span>
          <Dropdown
            value={roleFilter}
            onChange={(e) => { setPage(1); setRoleFilter(e.value); }}
            options={[{ label: 'Semua Role', value: null }, ...ROLE_OPTIONS]}
            placeholder="Semua Role"
            style={{ minWidth: 200 }}
          />
          <Button icon="pi pi-refresh" outlined onClick={fetchUsers} loading={loading} />
        </div>

        <DataTable value={users} loading={loading} emptyMessage="Belum ada pengguna" size="small" stripedRows style={{ fontSize: '0.82rem' }}>
          <Column header="No"          body={(_, o) => o.rowIndex + 1} style={{ width: '3rem', textAlign: 'center' }} />
          <Column field="full_name"    header="Nama"     style={{ fontWeight: 600 }} />
          <Column field="username"     header="Username" />
          <Column field="email"        header="Email" />
          <Column header="Role"        body={roleTemplate} />
          <Column header="Status"      body={statusTemplate} />
          <Column header="Aksi"        body={aksiTemplate} style={{ width: '6rem' }} />
        </DataTable>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-color-secondary)' }}>
            Menampilkan {users.length} dari {total} pengguna
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button label="Sebelumnya" size="small" outlined disabled={page === 1} onClick={() => setPage((p) => p - 1)} />
            <Button label="Berikutnya" size="small" outlined disabled={page * limit >= total} onClick={() => setPage((p) => p + 1)} />
          </div>
        </div>
      </div>

      <Dialog header={form.id ? 'Edit Pengguna' : 'Tambah Pengguna'} visible={dialogOpen} style={{ width: 420 }} onHide={() => setDialogOpen(false)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: 8 }}>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Nama Lengkap</label>
            <InputText value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Username</label>
            <InputText value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Email</label>
            <InputText value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>
              Password {form.id && <span style={{ fontWeight: 400, color: 'var(--text-color-secondary)' }}>(kosongkan kalau tidak diubah)</span>}
            </label>
            <Password value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} toggleMask feedback={false} style={{ width: '100%' }} inputStyle={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Role</label>
            <Dropdown value={form.role} onChange={(e) => setForm({ ...form, role: e.value })} options={ROLE_OPTIONS} style={{ width: '100%' }} />
          </div>
          <Button label={saving ? 'Menyimpan...' : 'Simpan'} icon="pi pi-check" onClick={handleSave} loading={saving} />
        </div>
      </Dialog>
    </div>
  );
}