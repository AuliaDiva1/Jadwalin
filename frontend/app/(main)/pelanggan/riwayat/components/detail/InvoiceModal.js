'use client';

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

function DetailRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
      <span style={{ color: '#94a3b8' }}>{label}</span>
      <span style={{ color: '#0f172a', fontWeight: 600, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

export default function InvoiceModal({ trx, onClose }) {
  if (!trx) return null;

  const style = getStatusStyle(trx.status);
  const orderId = trx.order_id || trx.transaction_id || trx.id || '-';
  const planName = trx.plan?.name || trx.plan_name || '-';
  const amount = trx.amount ? Number(trx.amount) : 0;
  const createdAt = trx.created_at ? new Date(trx.created_at) : null;
  const updatedAt = trx.updated_at ? new Date(trx.updated_at) : null;

  // Info penerima (pelanggan) — ambil dari trx kalau ada, fallback '-'
  const customerName = trx.customer_name || trx.user?.name || trx.name || '-';
  const customerEmail = trx.customer_email || trx.user?.email || trx.email || '-';
  const customerPhone = trx.customer_phone || trx.user?.phone || trx.phone || '-';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      onClick={onClose}
      className="invoice-overlay"
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      {/* CSS khusus print */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .invoice-printable, .invoice-printable * { visibility: visible; }
          .invoice-printable {
            position: absolute !important;
            top: 0; left: 0; width: 100% !important;
            max-height: none !important; overflow: visible !important;
            box-shadow: none !important; border-radius: 0 !important;
          }
          .invoice-overlay { position: static !important; background: none !important; padding: 0 !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        className="invoice-printable"
        style={{
          background: '#fff', borderRadius: 20, width: '100%', maxWidth: 480,
          maxHeight: '90vh', overflowY: 'auto', fontFamily: "'Poppins', sans-serif",
          boxShadow: '0 30px 70px rgba(0,0,0,0.25)',
        }}
      >
        {/* Header invoice */}
        <div style={{
          background: 'linear-gradient(135deg,#1e1b4b,#4f46e5 55%,#7c3aed)',
          borderRadius: '20px 20px 0 0', padding: '26px 28px', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -50, right: -30, width: 180, height: 180,
            borderRadius: '50%', background: 'rgba(255,255,255,0.06)',
          }} />
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 800, letterSpacing: '-0.01em', marginBottom: 6 }}>
                Jadwalin
              </div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                Invoice
              </div>
              <div style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 800 }}>
                #{orderId}
              </div>
            </div>
            <button
              onClick={onClose}
              className="no-print"
              style={{
                background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8,
                width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#fff',
              }}
            >
              <i className="pi pi-times" style={{ fontSize: '0.8rem' }} />
            </button>
          </div>
          <div style={{ marginTop: 14 }}>
            <span style={{
              display: 'inline-block', padding: '4px 12px', borderRadius: 99,
              background: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 700, fontSize: '0.72rem',
            }}>
              {style.label}
            </span>
          </div>
        </div>

        {/* Body detail */}
        <div style={{ padding: '24px 28px' }}>

          {/* Dari & Kepada */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 22, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                Dari
              </div>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem' }}>Jadwalin</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Sistem Penjadwalan Produksi</div>
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                Kepada
              </div>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem' }}>{customerName}</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{customerEmail}</div>
              {customerPhone !== '-' && (
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{customerPhone}</div>
              )}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>
              Detail Paket
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 16px', background: '#f8faff', borderRadius: 12,
            }}>
              <div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>{planName}</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Langganan bulanan</div>
              </div>
              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem' }}>
                Rp {amount.toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>
              Informasi Pembayaran
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <DetailRow label="Nomor Order" value={orderId} />
              <DetailRow label="Metode Pembayaran" value={trx.bank ? trx.bank.toUpperCase() + ' Virtual Account' : '-'} />
              <DetailRow label="Nomor VA" value={trx.va_number || '-'} />
              <DetailRow
                label="Tanggal Transaksi"
                value={createdAt ? createdAt.toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
              />
              <DetailRow
                label="Terakhir Diperbarui"
                value={updatedAt ? updatedAt.toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
              />
            </div>
          </div>

          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '16px 0', borderTop: '1.5px dashed #e2e8f0', marginBottom: 22,
          }}>
            <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>Total Dibayar</span>
            <span style={{ fontWeight: 800, color: '#4f46e5', fontSize: '1.2rem' }}>
              Rp {amount.toLocaleString('id-ID')}
            </span>
          </div>

          <div style={{ textAlign: 'center', marginBottom: 4, fontSize: '0.7rem', color: '#cbd5e1' }} className="print-footer">
            Invoice ini dibuat otomatis oleh sistem Jadwalin.
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 18 }} className="no-print">
            <button
              onClick={onClose}
              style={{
                flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid #e2e8f0',
                background: '#fff', color: '#374151', fontWeight: 600, fontSize: '0.85rem',
                cursor: 'pointer', fontFamily: "'Poppins', sans-serif",
              }}
            >
              Tutup
            </button>
            <button
              onClick={handlePrint}
              style={{
                flex: 1, padding: '11px', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: '#fff', fontWeight: 700,
                fontSize: '0.85rem', cursor: 'pointer', fontFamily: "'Poppins', sans-serif",
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <i className="pi pi-print" style={{ fontSize: '0.75rem' }} /> Cetak Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}