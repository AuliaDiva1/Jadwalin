'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import * as XLSX from 'xlsx';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ImportJobPage() {
  const router     = useRouter();
  const toast      = useRef(null);
  const fileInput  = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [result,    setResult]    = useState(null);
  const [fileName,  setFileName]  = useState(null);

  const getToken = () => localStorage.getItem('TOKEN');

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Jenis Operasi':     'Contoh: Drilling',
        'Kode Bahan Baku':   'Contoh: BB-001',
        'Jumlah Material':   10,
        'Urgent':            'Tidak',
        'Deadline Customer': '2026-08-01 17:00:00',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Job');
    XLSX.writeFile(wb, 'template_import_job.xlsx');
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${BASE_URL}/jobs/import`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body:    formData,
      });

      const data = await res.json();

      if (data.success) {
        setResult(data.data);
        toast.current.show({
          severity: data.data.failed > 0 ? 'warn' : 'success',
          summary:  'Import Selesai',
          detail:   data.message,
          life: 5000,
        });
      } else {
        toast.current.show({ severity: 'error', summary: 'Gagal', detail: data.message });
      }
    } catch {
      toast.current.show({ severity: 'error', summary: 'Error', detail: 'Gagal mengunggah file. Periksa koneksi ke server.' });
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const handleReset = () => {
    setResult(null);
    setFileName(null);
  };

  return (
    <div>
      <Toast ref={toast} />

      <div className="flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="m-0 mb-1">Import Job dari Excel</h2>
          <p className="m-0 text-color-secondary text-sm">
            Tambahkan banyak job sekaligus lewat file Excel (.xlsx)
          </p>
        </div>
        <Button
          label="Kembali ke Input Manual"
          icon="pi pi-arrow-left"
          severity="secondary"
          text
          onClick={() => router.push('/manajer/job/input')}
        />
      </div>

      <div className="card p-3 mb-4 flex align-items-start gap-3"
        style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
        <i className="pi pi-info-circle mt-1" style={{ color: '#3b82f6' }} />
        <div className="text-sm" style={{ color: '#1e40af' }}>
          Unduh template terlebih dahulu, isi data sesuai format kolom yang tersedia,
          lalu unggah kembali. Baris yang gagal (misal bahan baku tidak ditemukan atau
          stok tidak cukup) akan dilewati dan dilaporkan di akhir — job lain yang valid
          tetap akan ditambahkan.
        </div>
      </div>

      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <div className="card" style={{ borderRadius: '16px', padding: '2rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.1rem' }}>
            Unggah File Excel
          </h3>

          <div style={{
            border: '2px dashed var(--surface-border)',
            borderRadius: '12px',
            padding: '2.5rem 1.5rem',
            textAlign: 'center',
            marginBottom: '1.5rem',
            background: 'var(--surface-ground)',
          }}>
            <i className="pi pi-file-excel" style={{ fontSize: '2.5rem', color: '#22c55e', marginBottom: '1rem', display: 'block' }} />

            {fileName && !uploading && (
              <p style={{ marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--text-color-secondary)' }}>
                File terakhir: <b>{fileName}</b>
              </p>
            )}

            <Button
              label={uploading ? 'Mengunggah...' : 'Pilih File Excel'}
              icon={uploading ? 'pi pi-spin pi-spinner' : 'pi pi-upload'}
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
              style={{ borderRadius: '10px' }}
            />
            <input
              ref={fileInput}
              type="file"
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            <p style={{ marginTop: '1rem', marginBottom: 0, fontSize: '0.8rem', color: 'var(--text-color-secondary)' }}>
              Format yang didukung: .xlsx, .xls
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              label="Download Template Excel"
              icon="pi pi-download"
              severity="secondary"
              outlined
              onClick={handleDownloadTemplate}
              style={{ borderRadius: '10px' }}
            />
          </div>
        </div>

        {/* Hasil Import */}
        {result && (
          <div className="card" style={{ borderRadius: '16px', padding: '2rem', marginTop: '1.5rem' }}>
            <div className="flex justify-content-between align-items-center mb-4">
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Hasil Import</h3>
              <Button
                label="Import Lagi"
                icon="pi pi-refresh"
                severity="secondary"
                text
                onClick={handleReset}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ flex: 1, textAlign: 'center', padding: '1rem', borderRadius: '10px', background: '#f8fafc' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{result.total}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-color-secondary)' }}>Total Baris</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center', padding: '1rem', borderRadius: '10px', background: '#f0fdf4' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#22c55e' }}>{result.success}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-color-secondary)' }}>Berhasil</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center', padding: '1rem', borderRadius: '10px', background: '#fef2f2' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444' }}>{result.failed}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-color-secondary)' }}>Gagal</div>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                  Detail Baris Gagal
                </p>
                <div style={{ maxHeight: '320px', overflowY: 'auto', border: '1px solid var(--surface-border)', borderRadius: '10px' }}>
                  <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ textAlign: 'left', background: 'var(--surface-ground)', position: 'sticky', top: 0 }}>
                        <th style={{ padding: '10px 12px', width: '80px' }}>Baris</th>
                        <th style={{ padding: '10px 12px' }}>Alasan Gagal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.errors.map((e, i) => (
                        <tr key={i} style={{ borderTop: '1px solid var(--surface-border)' }}>
                          <td style={{ padding: '10px 12px' }}>
                            <Tag severity="danger" value={`#${e.row}`} />
                          </td>
                          <td style={{ padding: '10px 12px', color: '#ef4444' }}>{e.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {result.success > 0 && (
              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  label="Lihat Riwayat Job"
                  icon="pi pi-list"
                  onClick={() => router.push('/manajer/job')}
                  style={{ borderRadius: '10px' }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}