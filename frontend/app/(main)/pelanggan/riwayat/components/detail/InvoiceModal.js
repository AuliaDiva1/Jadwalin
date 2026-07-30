'use client';

const STATUS_STYLES = {
  paid:       { color: '#16a34a', bg: '#dcfce7', label: 'PAID' },
  settlement: { color: '#16a34a', bg: '#dcfce7', label: 'PAID' },
  success:    { color: '#16a34a', bg: '#dcfce7', label: 'PAID' },
  pending:    { color: '#b45309', bg: '#fef9c3', label: 'PENDING' },
  failed:     { color: '#dc2626', bg: '#fee2e2', label: 'FAILED' },
  expired:    { color: '#64748b', bg: '#f1f5f9', label: 'EXPIRED' },
  cancel:     { color: '#64748b', bg: '#f1f5f9', label: 'CANCELLED' },
};

function getStatusStyle(status) {
  return STATUS_STYLES[status?.toLowerCase()] || { color: '#64748b', bg: '#f1f5f9', label: (status || '-').toUpperCase() };
}

function InfoLine({ label, value, bold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 5 }}>
      <span style={{ color: '#64748b' }}>{label}</span>
      <span style={{ color: '#0f172a', fontWeight: bold ? 700 : 600 }}>{value}</span>
    </div>
  );
}

export default function InvoiceModal({ trx, billedTo, onClose }) {
  if (!trx) return null;

  const style = getStatusStyle(trx.status);
  const orderId = trx.order_id || trx.transaction_id || trx.id || '-';
  const planName = trx.plan?.name || trx.plan_name || '-';
  const amount = trx.amount ? Number(trx.amount) : 0;
  const createdAt = trx.created_at ? new Date(trx.created_at) : null;

  // Perkiraan tanggal billing berikutnya: +1 bulan dari tanggal transaksi (langganan bulanan)
  const nextBillingDate = createdAt ? new Date(createdAt) : null;
  if (nextBillingDate) nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

  const invoiceNumber = `INV-${orderId}`;
  const fmtDate = (d) => d ? d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
  const fmtRp = (v) => `Rp ${Number(v || 0).toLocaleString('id-ID')}`;

  const handlePrint = () => window.print();

  return (
    <div
      onClick={onClose}
      className="invoice-overlay"
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
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
          background: '#fff', borderRadius: 16, width: '100%', maxWidth: 620,
          maxHeight: '92vh', overflowY: 'auto', fontFamily: "'Poppins', sans-serif",
          boxShadow: '0 30px 70px rgba(0,0,0,0.25)', padding: '32px 36px',
        }}
      >
        {/* Close button */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: -8 }}>
          <button
            onClick={onClose}
            style={{
              background: '#f1f5f9', border: 'none', borderRadius: 8,
              width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#64748b',
            }}
          >
            <i className="pi pi-times" style={{ fontSize: '0.75rem' }} />
          </button>
        </div>

        {/* Header: perusahaan + status */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          marginBottom: 28, paddingBottom: 24, borderBottom: '1.5px solid #f1f5f9', flexWrap: 'wrap', gap: 16,
        }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#0f172a', marginBottom: 4 }}>Jadwalin</div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.6, maxWidth: 260 }}>
              Sistem Penjadwalan Produksi Berbasis Web<br />
              PSDKU Universitas Sebelas Maret, Madiun<br />
              Jawa Timur, Indonesia
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              Invoice
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a', marginBottom: 10 }}>
              {invoiceNumber}
            </div>
            <span style={{
              display: 'inline-block', padding: '5px 14px', borderRadius: 6,
              background: style.bg, color: style.color, fontWeight: 800, fontSize: '0.72rem', letterSpacing: '0.04em',
            }}>
              {style.label}
            </span>
          </div>
        </div>

        {/* Invoice meta + Billed to */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 26, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
              Billed To
            </div>
            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem', marginBottom: 3 }}>
              {billedTo?.name || 'Memuat...'}
            </div>
            {billedTo?.address && billedTo.address !== '-' && (
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{billedTo.address}</div>
            )}
            {billedTo?.city && billedTo.city !== '-' && (
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{billedTo.city}, Indonesia</div>
            )}
            {billedTo?.email && billedTo.email !== '-' && (
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 4 }}>{billedTo.email}</div>
            )}
            {billedTo?.phone && billedTo.phone !== '-' && (
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{billedTo.phone}</div>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
              Detail Invoice
            </div>
            <InfoLine label="Invoice Issued" value={fmtDate(createdAt)} />
            <InfoLine label="Next Billing Date" value={style.label === 'PAID' ? fmtDate(nextBillingDate) : '-'} />
            <InfoLine label="Order Nr." value={orderId} />
            <InfoLine label="Metode Pembayaran" value={trx.bank ? `${trx.bank.toUpperCase()} VA` : '-'} />
            <InfoLine label="Nomor VA" value={trx.va_number || '-'} />
          </div>
        </div>

        {/* Tabel deskripsi */}
        <div style={{ marginBottom: 22 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ background: '#f8faff' }}>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#94a3b8', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.04em', borderRadius: '8px 0 0 8px' }}>
                  Deskripsi
                </th>
                <th style={{ textAlign: 'right', padding: '10px 12px', color: '#94a3b8', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.04em', borderRadius: '0 8px 8px 0' }}>
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '14px 12px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>Paket {planName}</div>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                    Langganan bulanan{createdAt && nextBillingDate ? ` · ${fmtDate(createdAt)} s/d ${fmtDate(nextBillingDate)}` : ''}
                  </div>
                </td>
                <td style={{ padding: '14px 12px', textAlign: 'right', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #f1f5f9', verticalAlign: 'top' }}>
                  {fmtRp(amount)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Total breakdown */}
        <div style={{ marginLeft: 'auto', maxWidth: 280, marginBottom: 26 }}>
          <InfoLine label="Subtotal" value={fmtRp(amount)} />
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 0', marginTop: 8, borderTop: '1.5px dashed #e2e8f0',
          }}>
            <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>Total</span>
            <span style={{ fontWeight: 800, color: '#4f46e5', fontSize: '1.15rem' }}>{fmtRp(amount)}</span>
          </div>
          <InfoLine
            label="Amount Due"
            value={style.label === 'PAID' ? fmtRp(0) : fmtRp(amount)}
            bold
          />
        </div>

        <div style={{ textAlign: 'center', marginBottom: 24, fontSize: '0.7rem', color: '#cbd5e1' }}>
          Invoice ini dibuat otomatis oleh sistem Jadwalin.
        </div>

        <div style={{ display: 'flex', gap: 10 }} className="no-print">
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
  );
}