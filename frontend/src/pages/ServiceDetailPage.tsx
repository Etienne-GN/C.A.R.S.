import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { deleteAttachment, deleteService, getService, uploadAttachment } from '../api/services';
import ConfirmDialog from '../components/ConfirmDialog';
import type { ServiceRecord } from '../types/service';

function fmtDate(d?: string) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });
}

function fmtCurrency(n: number) {
  return n.toLocaleString('en-CA', { style: 'currency', currency: 'CAD' });
}

function isImage(mime?: string) {
  return mime?.startsWith('image/') ?? false;
}

export default function ServiceDetailPage() {
  const { carId, serviceId } = useParams<{ carId: string; serviceId: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<ServiceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    if (!serviceId) return;
    getService(Number(serviceId))
      .then(setRecord)
      .catch(() => setError('Service record not found.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [serviceId]);

  const handleDelete = async () => {
    await deleteService(Number(serviceId));
    navigate(`/cars/${carId}`);
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || !serviceId) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      try {
        await uploadAttachment(Number(serviceId), file);
      } catch {
        setError(`Failed to upload ${file.name}.`);
      }
    }
    setUploading(false);
    load();
  };

  const removeAttachment = async (id: number) => {
    await deleteAttachment(id);
    load();
  };

  if (loading) return <div className="loading-page"><span className="spinner" /></div>;
  if (error && !record) return (
    <div>
      <div className="error-msg">{error}</div>
      <Link to={`/cars/${carId}`} className="back-link">← Back to Car</Link>
    </div>
  );
  if (!record) return null;

  const partsTotal = record.parts.reduce((s, p) => s + p.total_cost, 0);

  return (
    <div>
      {confirmDelete && (
        <ConfirmDialog
          message={`Delete "${record.title}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
          confirmLabel="Delete"
          danger
        />
      )}

      <Link to={`/cars/${carId}`} className="back-link">← Back to Car</Link>

      <div className="page-header">
        <div>
          <div className="page-title">{record.title}</div>
          <div style={{ fontSize: '13px', color: 'var(--text-2)', marginTop: '4px' }}>
            {fmtDate(record.date)}
            {record.mileage_at_service && ` · ${record.mileage_at_service.toLocaleString()} km`}
            {record.shop_name && ` · ${record.shop_name}`}
          </div>
        </div>
        <div className="page-header-actions">
          <Link to={`/cars/${carId}/services/${serviceId}/edit`} className="btn btn-secondary">Edit</Link>
          <button className="btn btn-danger" onClick={() => setConfirmDelete(true)}>Delete</button>
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {/* Cost Summary */}
      <div className="cost-row" style={{ marginBottom: '24px' }}>
        <div className="cost-row-item">
          <span className="cost-row-label">Labour</span>
          <span className="cost-row-value" style={{ fontSize: '14px', color: 'var(--text-2)' }}>{fmtCurrency(record.labor_cost)}</span>
        </div>
        <div className="cost-row-item">
          <span className="cost-row-label">Parts</span>
          <span className="cost-row-value" style={{ fontSize: '14px', color: 'var(--text-2)' }}>{fmtCurrency(partsTotal)}</span>
        </div>
        <div className="cost-row-item">
          <span className="cost-row-label">Total</span>
          <span className="cost-row-value">{fmtCurrency(record.total_cost)}</span>
        </div>
      </div>

      {/* Notes */}
      {record.notes && (
        <div className="form-section" style={{ marginBottom: '20px' }}>
          <div className="form-section-title">Notes</div>
          <div style={{ padding: '16px 20px', fontSize: '14px', color: 'var(--text-2)', whiteSpace: 'pre-wrap' }}>
            {record.notes}
          </div>
        </div>
      )}

      {/* Parts */}
      {record.parts.length > 0 && (
        <div className="form-section" style={{ marginBottom: '20px' }}>
          <div className="form-section-title">Parts &amp; Materials</div>
          <div style={{ overflowX: 'auto' }}>
            <table className="parts-table">
              <thead>
                <tr>
                  <th>Part</th>
                  <th>Brand</th>
                  <th>Part #</th>
                  <th>Qty</th>
                  <th>Unit Cost</th>
                  <th>Total</th>
                  <th>Supplier</th>
                </tr>
              </thead>
              <tbody>
                {record.parts.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500 }}>{p.name}</td>
                    <td style={{ color: 'var(--text-2)' }}>{p.brand || '—'}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-2)' }}>{p.part_number || '—'}</td>
                    <td>{p.quantity}</td>
                    <td>{fmtCurrency(p.unit_cost)}</td>
                    <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{fmtCurrency(p.total_cost)}</td>
                    <td style={{ color: 'var(--text-2)' }}>{p.supplier || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Attachments */}
      <div className="form-section">
        <div className="form-section-title">Attachments</div>
        <div style={{ padding: '16px 20px' }}>
          <div
            className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
          >
            {uploading
              ? <><span className="spinner" style={{ marginRight: '8px' }} /> Uploading…</>
              : <>📎 Drop files here or click to upload · Photos, PDFs (max 20 MB)</>
            }
          </div>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*,application/pdf,text/plain"
            style={{ display: 'none' }}
            onChange={(e) => handleFiles(e.target.files)}
          />

          {record.attachments.length > 0 && (
            <div className="attachments-grid">
              {record.attachments.map((att) => (
                <div key={att.id} style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  {isImage(att.mime_type) ? (
                    <a href={`/uploads/${att.filename}`} target="_blank" rel="noreferrer">
                      <img
                        src={`/uploads/${att.filename}`}
                        alt={att.original_filename}
                        className="attachment-img-thumb"
                      />
                    </a>
                  ) : (
                    <a href={`/uploads/${att.filename}`} target="_blank" rel="noreferrer" className="attachment-item">
                      📄 {att.original_filename}
                    </a>
                  )}
                  <button
                    className="btn btn-sm btn-ghost"
                    style={{ fontSize: '11px', padding: '2px 6px' }}
                    onClick={() => removeAttachment(att.id)}
                    title="Remove"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
