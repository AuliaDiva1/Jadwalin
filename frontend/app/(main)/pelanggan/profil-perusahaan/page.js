'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const FIELD_LABELS = [
  { key: 'company_name', label: 'Nama Perusahaan', icon: 'pi-building' },
  { key: 'industry', label: 'Industri', icon: 'pi-briefcase' },
  { key: 'company_size', label: 'Skala Perusahaan', icon: 'pi-chart-bar' },
  { key: 'city', label: 'Kota', icon: 'pi-map-marker' },
  { key: 'phone_number', label: 'No. Telepon', icon: 'pi-phone' },
  { key: 'website', label: 'Website', icon: 'pi-globe' },
  { key: 'address', label: 'Alamat Lengkap', icon: 'pi-map', full: true },
];

export default function ProfilPerusahaanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState('view'); // 'view' | 'edit'
  const [message, setMessage] = useState(null);
  const [profile, setProfile] = useState(null); // data tersimpan (buat tampilan)

  const [form, setForm] = useState({
    company_name: '',
    industry: '',
    company_size: '',
    city: '',
    address: '',
    phone_number: '',
    website: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('TOKEN');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetchProfile();
  }, [router]);

  const fetchProfile = async () => {
    const token = localStorage.getItem('TOKEN');
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/company-profile/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data?.data;
      if (data) {
        setProfile(data);
        setForm({
          company_name: data.company_name || '',
          industry: data.industry || '',
          company_size: data.company_size || '',
          city: data.city || '',
          address: data.address || '',
          phone_number: data.phone_number || '',
          website: data.website || '',
        });
        setMode('view');
      } else {
        setMode('edit'); // belum ada data -> langsung suruh isi
      }
    } catch (err) {
      // 404 wajar kalau belum pernah isi profil
      setProfile(null);
      setMode('edit');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const token = localStorage.getItem('TOKEN');

    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/company-profile`,
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProfile(res.data?.data || { ...form });
      setMessage({ type: 'success', text: 'Profil perusahaan berhasil disimpan.' });
      setMode('view');
    } catch (err) {
      setMessage({
        type: 'error',
        text: 'Gagal menyimpan: ' + (err.response?.data?.message || err.message),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (profile) {
      setForm({
        company_name: profile.company_name || '',
        industry: profile.industry || '',
        company_size: profile.company_size || '',
        city: profile.city || '',
        address: profile.address || '',
        phone_number: profile.phone_number || '',
        website: profile.website || '',
      });
      setMode('view');
    }
    setMessage(null);
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
        <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Memuat profil perusahaan...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const inputStyle = {
    width: '100%',
    padding: '11px 14px',
    borderRadius: 10,
    border: '1.5px solid #e2e8f0',
    fontSize: '0.88rem',
    fontFamily: "'Poppins', sans-serif",
    color: '#0f172a',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#374151',
    marginBottom: 6,
  };

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif", minHeight: '100vh', background: '#f8faff' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        input:focus, textarea:focus, select:focus { border-color: #4f46e5 !important; }
      `}</style>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 28, animation: 'fadeUp 0.5s both', flexWrap: 'wrap', gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 18px rgba(79,70,229,0.35)',
            }}>
              <i className="pi pi-building" style={{ color: '#fff', fontSize: '1.1rem' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                Profil Perusahaan
              </h1>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                {mode === 'view' ? 'Data perusahaan Anda' : 'Lengkapi data perusahaan Anda'}
              </p>
            </div>
          </div>

          {mode === 'view' && profile && (
            <button
              onClick={() => setMode('edit')}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10,
                border: 'none', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: '#fff',
                fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', fontFamily: "'Poppins', sans-serif",
                boxShadow: '0 6px 18px rgba(79,70,229,0.3)',
              }}
            >
              <i className="pi pi-pencil" style={{ fontSize: '0.75rem' }} /> Edit Profil
            </button>
          )}
        </div>

        {message && (
          <div style={{
            padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: '0.85rem', fontWeight: 500,
            background: message.type === 'success' ? '#dcfce7' : '#fee2e2',
            color: message.type === 'success' ? '#16a34a' : '#dc2626',
          }}>
            {message.text}
          </div>
        )}

        {/* ===== MODE VIEW: tampilan data, bukan tabel/form ===== */}
        {mode === 'view' && profile && (
          <div style={{
            background: '#fff', borderRadius: 18, border: '1.5px solid #e2e8f0',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)', padding: 28, animation: 'fadeUp 0.5s 0.05s both',
          }}>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 22,
            }}>
              {FIELD_LABELS.map((f) => (
                <div
                  key={f.key}
                  style={{ gridColumn: f.full ? '1 / -1' : 'auto' }}
                >
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6,
                  }}>
                    <i className={`pi ${f.icon}`} style={{ fontSize: '0.7rem', color: '#94a3b8' }} />
                    <span style={{
                      fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600,
                      textTransform: 'uppercase', letterSpacing: '0.04em',
                    }}>
                      {f.label}
                    </span>
                  </div>
                  <div style={{
                    fontSize: '0.92rem', fontWeight: 600, color: '#0f172a',
                    lineHeight: 1.5, wordBreak: 'break-word',
                  }}>
                    {profile[f.key] || <span style={{ color: '#cbd5e1', fontWeight: 500 }}>Belum diisi</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== MODE EDIT: form isi/ubah data ===== */}
        {mode === 'edit' && (
          <form
            onSubmit={handleSubmit}
            style={{
              background: '#fff', borderRadius: 18, border: '1.5px solid #e2e8f0',
              boxShadow: '0 2px 10px rgba(0,0,0,0.03)', padding: 28, animation: 'fadeUp 0.5s 0.05s both',
            }}
          >
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Nama Perusahaan</label>
              <input
                type="text"
                value={form.company_name}
                onChange={handleChange('company_name')}
                placeholder="PT Contoh Sejahtera"
                required
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
              <div>
                <label style={labelStyle}>Industri</label>
                <input
                  type="text"
                  value={form.industry}
                  onChange={handleChange('industry')}
                  placeholder="Manufaktur, Makanan & Minuman, dll."
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Skala Perusahaan</label>
                <select
                  value={form.company_size}
                  onChange={handleChange('company_size')}
                  style={inputStyle}
                >
                  <option value="">Pilih skala</option>
                  <option value="Mikro">Mikro</option>
                  <option value="Kecil">Kecil</option>
                  <option value="Menengah">Menengah</option>
                  <option value="Besar">Besar</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
              <div>
                <label style={labelStyle}>Kota</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={handleChange('city')}
                  placeholder="Surakarta"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>No. Telepon</label>
                <input
                  type="text"
                  value={form.phone_number}
                  onChange={handleChange('phone_number')}
                  placeholder="08xxxxxxxxxx"
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Website</label>
              <input
                type="text"
                value={form.website}
                onChange={handleChange('website')}
                placeholder="https://contoh.co.id"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 26 }}>
              <label style={labelStyle}>Alamat Lengkap</label>
              <textarea
                value={form.address}
                onChange={handleChange('address')}
                placeholder="Jl. Contoh No. 123, Kecamatan, Kabupaten"
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              {profile && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  style={{
                    flex: 1, padding: '12px', borderRadius: 10, border: '1.5px solid #e2e8f0',
                    background: '#fff', color: '#374151', fontWeight: 600, fontSize: '0.88rem',
                    cursor: 'pointer', fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  Batal
                </button>
              )}
              <button
                type="submit"
                disabled={saving}
                style={{
                  flex: 2, padding: '12px', borderRadius: 10, border: 'none',
                  background: saving ? '#a5b4fc' : 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                  color: '#fff', fontWeight: 700, fontSize: '0.88rem',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontFamily: "'Poppins', sans-serif", display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: 8, boxShadow: '0 6px 18px rgba(79,70,229,0.3)',
                }}
              >
                <i className="pi pi-save" style={{ fontSize: '0.8rem' }} />
                {saving ? 'Menyimpan...' : 'Simpan Profil'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}