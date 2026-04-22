import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getFusePanel } from '../api/fuses';
import type { FuseGrid, FuseItem, FusePanel, FuseSection } from '../types/fuses';

function textColorFor(hex: string): string {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#000' : '#fff';
}

function Grid({ grid, items }: { grid: FuseGrid; items: Record<string, FuseItem> }) {
  return (
    <div
      className="fuse-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${grid.columns}, minmax(0, 1fr))`,
        ...(grid.rows ? { gridTemplateRows: `repeat(${grid.rows}, 1fr)` } : {}),
        gap: '6px',
      }}
    >
      {grid.items.map((id) => {
        const item = items[id];
        if (!item) return <div key={id} />;
        const bg = item.empty ? '#3a3a3a' : item.color;
        const fg = item.empty ? '#888' : textColorFor(item.color);
        return (
          <div
            key={id}
            title={`${id} — ${item.value}: ${item.description}`}
            style={{
              background: bg,
              color: fg,
              border: '1px solid #222',
              borderRadius: '4px',
              padding: '8px 4px',
              textAlign: 'center',
              fontWeight: 600,
              fontSize: '12px',
              minHeight: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {id}
          </div>
        );
      })}
    </div>
  );
}

function SectionView({ section }: { section: FuseSection }) {
  const itemEntries = Object.entries(section.items);

  return (
    <div className="form-section" style={{ marginBottom: '20px' }}>
      <div className="form-section-title">{section.title}</div>
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
          {section.grids.map((grid, i) => (
            <Grid key={i} grid={grid} items={section.items} />
          ))}
        </div>

        {section.note && (
          <div style={{ marginTop: '20px', padding: '12px 16px', background: 'var(--surface-2, #1f2328)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '13px', color: 'var(--text-2)' }}>
            {section.note}
          </div>
        )}

        <div style={{ overflowX: 'auto', marginTop: '20px' }}>
          <table className="parts-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: '70px' }}>{section.itemLabel}</th>
                <th style={{ width: '140px' }}>{section.valueLabel}</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {itemEntries.map(([id, item]) => (
                <tr key={id}>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: '12px',
                        height: '12px',
                        background: item.empty ? '#3a3a3a' : item.color,
                        borderRadius: '2px',
                        marginRight: '8px',
                        verticalAlign: 'middle',
                      }}
                    />
                    {id}
                  </td>
                  <td style={{ textAlign: 'center' }}>{item.value || '—'}</td>
                  <td>{item.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function FusePanelDetailPage() {
  const { panelKey } = useParams<{ panelKey: string }>();
  const [panel, setPanel] = useState<FusePanel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('');

  useEffect(() => {
    if (!panelKey) return;
    const ctrl = new AbortController();
    getFusePanel(panelKey, ctrl.signal)
      .then((p) => {
        setPanel(p);
        if (p.sections.length > 0) setActiveSection(p.sections[0].key);
      })
      .catch(() => setError('Fuse panel not found.'))
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [panelKey]);

  if (loading) return <div className="loading-page"><span className="spinner" /></div>;
  if (error || !panel) return (
    <div>
      <div className="error-msg">{error ?? 'Fuse panel not found.'}</div>
      <Link to="/modules/fuses" className="back-link">← Back to Fuse Panels</Link>
    </div>
  );

  const current = panel.sections.find((s) => s.key === activeSection) ?? panel.sections[0];

  return (
    <div>
      <Link to="/modules/fuses" className="back-link">← Fuse Panels</Link>

      <div className="page-header">
        <div>
          <div className="page-title">{panel.title}</div>
          {panel.description && <div className="page-subtitle">{panel.description}</div>}
        </div>
      </div>

      {panel.sections.length > 1 && (
        <div className="tabs">
          {panel.sections.map((s) => (
            <button
              key={s.key}
              className={`tab ${activeSection === s.key ? 'active' : ''}`}
              onClick={() => setActiveSection(s.key)}
            >
              {s.title}
            </button>
          ))}
        </div>
      )}

      {current && <SectionView section={current} />}

      {panel.links && panel.links.length > 0 && (
        <div className="form-section">
          <div className="form-section-title">References</div>
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {panel.links.map((l) => (
              <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
                {l.label} ↗
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
