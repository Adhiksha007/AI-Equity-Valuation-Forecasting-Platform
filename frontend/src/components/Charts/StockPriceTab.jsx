import React from 'react'
import Plot from 'react-plotly.js'

const LAYOUT_BASE = {
  template: 'plotly_dark',
  paper_bgcolor: 'transparent',
  plot_bgcolor:  'transparent',
  font: { family: 'IBM Plex Mono, monospace', color: '#7a8799', size: 11 },
  margin: { l: 50, r: 20, t: 30, b: 40 },
  legend: { orientation: 'h', yanchor: 'bottom', y: 1.02, x: 0 },
}

export default function StockPriceTab({ priceHistory, priceFeatures }) {
  if (!priceHistory?.length) {
    return <p style={{ color: 'var(--text-muted)' }}>No historical price data available.</p>
  }

  const dates  = priceHistory.map(r => r.date)
  const closes = priceHistory.map(r => r.close_price)
  const vols   = priceHistory.map(r => r.volume)

  const priceTraces = [
    {
      x: dates, y: closes,
      type: 'scatter', mode: 'lines', name: 'Close Price',
      line: { color: '#2563eb', width: 2 },
      fill: 'tozeroy', fillcolor: 'rgba(37,99,235,0.06)',
    },
  ]

  // Moving averages from price_features
  if (priceFeatures?.length) {
    const fd = priceFeatures
    const mas = [
      { key: 'ma_20',  color: '#f59e0b', label: 'MA 20' },
      { key: 'ma_50',  color: '#22c55e', label: 'MA 50' },
      { key: 'ma_200', color: '#ef4444', label: 'MA 200' },
    ]
    mas.forEach(({ key, color, label }) => {
      if (fd[0]?.[key] !== undefined) {
        priceTraces.push({
          x: fd.map(r => r.date), y: fd.map(r => r[key]),
          type: 'scatter', mode: 'lines', name: label,
          line: { color, width: 1.5, dash: 'dot' },
        })
      }
    })
  }

  return (
    <div className="tab-content">
      <h3 style={{ marginBottom: 16 }}>Historical Stock Price</h3>

      <Plot
        data={priceTraces}
        layout={{
          ...LAYOUT_BASE,
          height: 400,
          xaxis: { title: 'Date', gridcolor: '#1e1e2e' },
          yaxis: { title: 'Price (USD)', gridcolor: '#1e1e2e' },
        }}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%' }}
        useResizeHandler
      />

      <div style={{ marginTop: 12 }}>
        <Plot
          data={[{
            x: dates, y: vols,
            type: 'bar', name: 'Volume',
            marker: { color: 'rgba(37,99,235,0.45)' },
          }]}
          layout={{
            ...LAYOUT_BASE,
            height: 160,
            showlegend: false,
            margin: { l: 50, r: 20, t: 10, b: 40 },
            xaxis: { gridcolor: '#1e1e2e' },
            yaxis: { title: 'Volume', gridcolor: '#1e1e2e' },
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%' }}
          useResizeHandler
        />
      </div>
    </div>
  )
}
