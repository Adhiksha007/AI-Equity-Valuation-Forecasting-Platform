import React from 'react'
import Plot from 'react-plotly.js'

const LAYOUT_BASE = {
  template: 'plotly_dark',
  paper_bgcolor: 'transparent',
  plot_bgcolor:  'transparent',
  font: { family: 'IBM Plex Mono, monospace', color: '#7a8799', size: 11 },
  margin: { l: 50, r: 20, t: 40, b: 40 },
  legend: { orientation: 'h', yanchor: 'bottom', y: 1.02, x: 0 },
}

const SIGNAL_COLORS = {
  undervalued: 'var(--green)',
  overvalued:  'var(--red)',
  neutral:     'var(--amber)',
}

export default function RelativeTab({ relative, ticker }) {
  if (!relative) return null

  const { sector_used, company_multiples, peer_medians, comparison_table, signals } = relative

  const multiples = ['pe', 'ev_ebitda', 'pb', 'ps']
  const labels    = ['P/E', 'EV/EBITDA', 'P/B', 'P/S']

  const compVals = multiples.map(k => company_multiples?.[k])
  const peerVals = multiples.map(k => peer_medians?.[k])

  const valid = labels
    .map((l, i) => ({ l, c: compVals[i], p: peerVals[i] }))
    .filter(v => v.c != null && v.p != null)

  return (
    <div className="tab-content">
      <h3 style={{ marginBottom: 4 }}>Relative Valuation</h3>
      <p style={{ marginBottom: 16, fontSize: '0.8rem' }}>
        Sector: <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{sector_used}</span>
      </p>

      {/* Comparison table */}
      {comparison_table?.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Multiple</th>
                <th>{ticker ?? 'Company'}</th>
                <th>Sector Median</th>
                <th>vs Peers</th>
                <th>Implied Price</th>
              </tr>
            </thead>
            <tbody>
              {comparison_table.map(row => (
                <tr key={row.multiple}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{row.multiple}</td>
                  <td>{row.company ?? 'N/A'}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{row.sector_median ?? 'N/A'}</td>
                  <td>
                    <span style={{
                      color: row.vs_peers?.startsWith('+') ? 'var(--red)' :
                             row.vs_peers?.startsWith('-') ? 'var(--green)' : 'var(--amber)',
                      fontFamily: 'var(--font-mono)',
                    }}>
                      {row.vs_peers}
                    </span>
                  </td>
                  <td style={{ color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>
                    {row.implied_price != null ? `$${row.implied_price}` : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Grouped bar chart */}
      {valid.length > 0 && (
        <>
          <p className="section-title">Multiples Comparison</p>
          <Plot
            data={[
              { x: valid.map(v => v.l), y: valid.map(v => v.c), type: 'bar', name: ticker ?? 'Company', marker: { color: '#2563eb' } },
              { x: valid.map(v => v.l), y: valid.map(v => v.p), type: 'bar', name: 'Sector Median',      marker: { color: '#64748b' } },
            ]}
            layout={{ ...LAYOUT_BASE, barmode: 'group', height: 300, yaxis: { gridcolor: '#1e1e2e' } }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%' }}
            useResizeHandler
          />
        </>
      )}

      {/* Signals */}
      {signals?.length > 0 && (
        <>
          <p className="section-title">Valuation Signals</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {signals.map(s => (
              <div key={s.metric} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '10px 14px',
              }}>
                <span className={`badge badge-${s.type === 'undervalued' ? 'green' : s.type === 'overvalued' ? 'red' : 'amber'}`}>
                  {s.metric}
                </span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{s.text}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
