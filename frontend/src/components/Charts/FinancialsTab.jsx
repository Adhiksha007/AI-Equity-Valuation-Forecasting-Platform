import React, { useState } from 'react'
import Plot from 'react-plotly.js'

const LAYOUT_BASE = {
  template: 'plotly_dark',
  paper_bgcolor: 'transparent',
  plot_bgcolor:  'transparent',
  font: { family: 'IBM Plex Mono, monospace', color: '#7a8799', size: 11 },
  margin: { l: 55, r: 20, t: 40, b: 40 },
}

export default function FinancialsTab({ financials, financialsWithMargins }) {
  const [showRaw, setShowRaw] = useState(false)

  if (!financials?.length) {
    return <p style={{ color: 'var(--text-muted)' }}>No financial statement data available.</p>
  }

  const years = financials.map(r => r.year)
  const toB   = arr => arr.map(v => v != null ? v / 1e9 : null)

  const subplots = [
    { y: toB(financials.map(r => r.revenue)),          color: '#2563eb', name: 'Revenue',          row: 1, col: 1 },
    { y: toB(financials.map(r => r.net_income)),        color: '#22c55e', name: 'Net Income',       row: 1, col: 2 },
    { y: toB(financials.map(r => r.operating_income)), color: '#f59e0b', name: 'Operating Income', row: 2, col: 1 },
    { y: toB(financials.map(r => r.cash_flow)),        color: '#a855f7', name: 'Free Cash Flow',   row: 2, col: 2 },
  ]

  return (
    <div className="tab-content">
      <h3 style={{ marginBottom: 16 }}>Financial Statement Trends</h3>

      {/* 2×2 bar charts using plotly subplots via individual Plots in a grid */}
      <div className="col-2" style={{ gap: 12, marginBottom: 12 }}>
        {subplots.map(s => (
          <div key={s.name} className="card" style={{ padding: 12 }}>
            <Plot
              data={[{
                x: years, y: s.y, type: 'bar',
                marker: { color: s.color }, name: s.name,
              }]}
              layout={{
                ...LAYOUT_BASE,
                height: 220,
                showlegend: false,
                title: { text: s.name, font: { size: 12, color: '#e8edf3' }, x: 0.04 },
                yaxis: { title: '$ Billions', gridcolor: '#1e1e2e' },
                xaxis: { gridcolor: '#1e1e2e' },
                margin: { l: 50, r: 10, t: 36, b: 36 },
              }}
              config={{ displayModeBar: false, responsive: true }}
              style={{ width: '100%' }}
              useResizeHandler
            />
          </div>
        ))}
      </div>

      {/* Margin trends */}
      {financialsWithMargins?.length > 0 && (
        <>
          <p className="section-title">Margin Trends</p>
          <Plot
            data={[
              {
                x: financialsWithMargins.map(r => r.year),
                y: financialsWithMargins.map(r => r.net_margin != null ? r.net_margin * 100 : null),
                name: 'Net Margin', type: 'scatter', mode: 'lines+markers',
                line: { color: '#22c55e', width: 2 },
              },
              {
                x: financialsWithMargins.map(r => r.year),
                y: financialsWithMargins.map(r => r.operating_margin != null ? r.operating_margin * 100 : null),
                name: 'Operating Margin', type: 'scatter', mode: 'lines+markers',
                line: { color: '#f59e0b', width: 2 },
              },
            ]}
            layout={{
              ...LAYOUT_BASE,
              height: 260,
              legend: { orientation: 'h', yanchor: 'bottom', y: 1.02, x: 0 },
              yaxis: { title: 'Margin (%)', gridcolor: '#1e1e2e' },
              xaxis: { gridcolor: '#1e1e2e' },
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%' }}
            useResizeHandler
          />
        </>
      )}

      {/* Raw data table (expandable) */}
      <div style={{ marginTop: 20 }}>
        <button
          className="btn btn-secondary"
          style={{ fontSize: '0.78rem', padding: '7px 14px' }}
          onClick={() => setShowRaw(v => !v)}
        >
          {showRaw ? '▲ Hide' : '▼ View'} Raw Financial Data
        </button>
        {showRaw && (
          <div className="card" style={{ marginTop: 12, overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  {['Year','Revenue','Op. Income','Net Income','Total Assets','Total Liabilities','Free Cash Flow'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {financials.map(r => (
                  <tr key={r.year}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{r.year}</td>
                    {['revenue','operating_income','net_income','total_assets','total_liabilities','cash_flow'].map(k => (
                      <td key={k} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                        {r[k] != null ? `$${(r[k] / 1e9).toFixed(2)}B` : '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
