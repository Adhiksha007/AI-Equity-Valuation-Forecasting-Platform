import React from 'react'
import Plot from 'react-plotly.js'

const LAYOUT_BASE = {
  template: 'plotly_dark',
  paper_bgcolor: 'transparent',
  plot_bgcolor:  'transparent',
  font: { family: 'IBM Plex Mono, monospace', color: '#7a8799', size: 11 },
  margin: { l: 50, r: 20, t: 30, b: 40 },
}

function fmt(v, prefix = '$') {
  if (v == null) return 'N/A'
  return `${prefix}${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function fmtB(v) {
  if (v == null) return 'N/A'
  return `$${(v / 1e9).toFixed(2)}B`
}
function fmtPct(v) {
  if (v == null) return 'N/A'
  return `${Number(v * 100).toFixed(2)}%`
}

export default function DcfTab({ dcf }) {
  if (!dcf || dcf.error) {
    return (
      <div className="error-banner">
        DCF Error: {dcf?.error ?? 'Unknown error'}
      </div>
    )
  }

  const signalColor = dcf.valuation_signal?.includes('Under') ? 'var(--green)'
    : dcf.valuation_signal?.includes('Over') ? 'var(--red)' : 'var(--amber)'

  const projFcfs = dcf.projected_fcfs ?? []

  return (
    <div className="tab-content">
      <h3 style={{ marginBottom: 16 }}>Discounted Cash Flow Valuation</h3>

      {/* Metric row */}
      <div className="col-2" style={{ gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Intrinsic Value / Share', val: fmt(dcf.intrinsic_value) },
          { label: 'Current Price',           val: fmt(dcf.current_price) },
          { label: 'Margin of Safety',        val: dcf.margin_of_safety != null ? `${Number(dcf.margin_of_safety).toFixed(1)}%` : 'N/A' },
          { label: 'Valuation Signal',        val: null, signal: dcf.valuation_signal },
        ].map(({ label, val, signal }) => (
          <div key={label} className="card" style={{ textAlign: 'center' }}>
            <div className="kpi-label">{label}</div>
            {signal
              ? <div className="kpi-value" style={{ color: signalColor, fontSize: '1rem' }}>{signal}</div>
              : <div className="kpi-value">{val}</div>
            }
          </div>
        ))}
      </div>

      {/* Assumptions + Breakdown */}
      <div className="col-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <p className="section-title" style={{ marginTop: 0 }}>DCF Assumptions</p>
          <table className="data-table">
            <tbody>
              {[
                ['WACC (Discount Rate)',   fmtPct(dcf.wacc)],
                ['FCF Growth Rate',        fmtPct(dcf.fcf_growth_rate)],
                ['Terminal Growth Rate',   '2.50%'],
                ['Forecast Years',         `${dcf.forecast_years} years`],
                ['Base FCF',               fmtB(dcf.base_fcf)],
              ].map(([p, v]) => (
                <tr key={p}>
                  <td style={{ color: 'var(--text-secondary)' }}>{p}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <p className="section-title" style={{ marginTop: 0 }}>Value Breakdown</p>
          <table className="data-table">
            <tbody>
              {[
                ['PV of Forecasted FCFs',   fmtB(dcf.pv_fcfs)],
                ['PV of Terminal Value',     fmtB(dcf.pv_terminal)],
                ['Total Enterprise Value',   fmtB(dcf.total_intrinsic)],
                ['Intrinsic Value / Share',  fmt(dcf.intrinsic_value)],
              ].map(([p, v]) => (
                <tr key={p}>
                  <td style={{ color: 'var(--text-secondary)' }}>{p}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Projected FCF bar chart */}
      {projFcfs.length > 0 && (
        <>
          <p className="section-title">Projected Free Cash Flows</p>
          <Plot
            data={[{
              x: projFcfs.map(r => `Year ${r.year}`),
              y: projFcfs.map(r => r.fcf / 1e9),
              type: 'bar',
              marker: { color: '#2563eb' },
              text: projFcfs.map(r => `$${(r.fcf / 1e9).toFixed(2)}B`),
              textposition: 'outside',
            }]}
            layout={{
              ...LAYOUT_BASE,
              height: 300,
              yaxis: { title: 'FCF ($ Billions)', gridcolor: '#1e1e2e' },
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%' }}
            useResizeHandler
          />
        </>
      )}
    </div>
  )
}
