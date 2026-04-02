import React from 'react'
import Plot from 'react-plotly.js'
import { motion } from 'framer-motion'

const LAYOUT_BASE = {
  template: 'plotly_dark',
  paper_bgcolor: 'transparent',
  plot_bgcolor:  'transparent',
  font: { family: 'IBM Plex Mono, monospace', color: '#7a8799', size: 11 },
}

function scoreColor(score) {
  if (score >= 70) return '#22c55e'
  if (score >= 45) return '#f59e0b'
  return '#ef4444'
}

function DimBar({ label, score, index }) {
  return (
    <motion.div
      className="dim-bar-wrap"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <div className="dim-bar-header">
        <span className="dim-bar-label">{label}</span>
        <span className="dim-bar-score">{score?.toFixed(0)}/100</span>
      </div>
      <div className="dim-bar-track">
        <motion.div
          className="dim-bar-fill"
          style={{ background: scoreColor(score), width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, delay: index * 0.1 }}
        />
      </div>
    </motion.div>
  )
}

export default function FundamentalTab({ fundamental }) {
  if (!fundamental) return null

  const { overall_score, grade, summary, dimension_scores, metrics } = fundamental

  const dimEntries = Object.entries(dimension_scores ?? {})

  // Radar / spider chart
  const radarCategories = dimEntries.map(([k]) => k)
  const radarValues     = dimEntries.map(([, v]) => v)
  radarCategories.push(radarCategories[0])
  radarValues.push(radarValues[0])

  const gradeColor = overall_score >= 75 ? '#22c55e' : overall_score >= 55 ? '#f59e0b' : '#ef4444'

  return (
    <div className="tab-content">
      <h3 style={{ marginBottom: 16 }}>Fundamental Financial Health</h3>

      <div className="col-2" style={{ gap: 20, marginBottom: 24 }}>
        {/* Gauge */}
        <div className="card">
          <Plot
            data={[{
              type: 'indicator',
              mode: 'gauge+number+delta',
              value: overall_score,
              delta: { reference: 60 },
              title: { text: `Health Score<br><span style="font-size:1.1rem;color:#9ca3af">Grade: ${grade}</span>` },
              gauge: {
                axis: { range: [0, 100], tickcolor: '#4a5568' },
                bar:  { color: '#2563eb' },
                steps: [
                  { range: [0, 35],   color: '#1f2937' },
                  { range: [35, 60],  color: '#374151' },
                  { range: [60, 80],  color: '#4b5563' },
                  { range: [80, 100], color: '#6b7280' },
                ],
                threshold: { line: { color: '#22c55e', width: 4 }, value: 75 },
              },
            }]}
            layout={{
              ...LAYOUT_BASE,
              height: 260,
              margin: { l: 20, r: 20, t: 30, b: 0 },
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%' }}
            useResizeHandler
          />
        </div>

        {/* AI Summary */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p className="section-title" style={{ marginTop: 0 }}>AI-Generated Analysis</p>
          <div className="summary-box">{summary ?? 'No summary available.'}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 'auto' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', color: gradeColor, fontWeight: 700 }}>{grade}</span>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>OVERALL GRADE</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.3rem', color: gradeColor }}>{overall_score?.toFixed(0)}/100</div>
            </div>
          </div>
        </div>
      </div>

      {/* Dimension score bars */}
      <p className="section-title">Dimension Scores</p>
      <div className="card" style={{ marginBottom: 20 }}>
        {dimEntries.map(([label, score], i) => (
          <DimBar key={label} label={label} score={score} index={i} />
        ))}
      </div>

      {/* Key ratios table */}
      <p className="section-title">Key Financial Ratios</p>
      <div className="card" style={{ marginBottom: 20 }}>
        <table className="data-table">
          <thead>
            <tr><th>Metric</th><th>Value</th><th>Assessment</th></tr>
          </thead>
          <tbody>
            {[
              { label: 'ROE',              val: metrics?.roe,              fmt: v => `${(v * 100).toFixed(1)}%`, assess: v => v > 0.15 ? 'Strong' : v > 0.05 ? 'Moderate' : 'Weak' },
              { label: 'Net Margin',       val: metrics?.net_margin,       fmt: v => `${(v * 100).toFixed(1)}%`, assess: v => v > 0.15 ? 'Strong' : v > 0.05 ? 'Moderate' : 'Weak' },
              { label: 'Operating Margin', val: metrics?.operating_margin, fmt: v => `${(v * 100).toFixed(1)}%`, assess: v => v > 0.15 ? 'Strong' : 'Moderate' },
              { label: 'Current Ratio',    val: metrics?.current_ratio,    fmt: v => `${v.toFixed(2)}x`,        assess: v => v > 1.5 ? 'Healthy' : 'Tight' },
              { label: 'Debt/Equity',      val: metrics?.debt_to_equity,   fmt: v => `${v.toFixed(2)}x`,        assess: v => v < 0.5 ? 'Low Risk' : v < 1.5 ? 'Moderate Risk' : 'High Risk' },
              { label: 'Asset Turnover',   val: metrics?.asset_turnover,   fmt: v => `${v.toFixed(2)}x`,        assess: v => v > 0.8 ? 'Efficient' : 'Average' },
            ].map(({ label, val, fmt, assess }) => {
              const assessment = val != null ? assess(val) : '—'
              const aColor = assessment === 'Strong' || assessment === 'Healthy' || assessment === 'Low Risk' || assessment === 'Efficient' ? 'var(--green)'
                : assessment === 'High Risk' || assessment === 'Weak' ? 'var(--red)' : 'var(--amber)'
              return (
                <tr key={label}>
                  <td>{label}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{val != null ? fmt(val) : '—'}</td>
                  <td><span style={{ color: aColor, fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>{assessment}</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Spider chart */}
      {radarCategories.length > 1 && (
        <>
          <p className="section-title">Dimension Radar</p>
          <Plot
            data={[{
              type: 'scatterpolar',
              r: radarValues, theta: radarCategories,
              fill: 'toself', fillcolor: 'rgba(37,99,235,0.18)',
              line: { color: '#2563eb', width: 2 },
              name: 'Health Profile',
            }]}
            layout={{
              ...LAYOUT_BASE,
              height: 360,
              polar: { radialaxis: { visible: true, range: [0, 100], gridcolor: '#1e1e2e', tickcolor: '#4a5568' }, angularaxis: { gridcolor: '#1e1e2e' } },
              showlegend: false,
              margin: { l: 40, r: 40, t: 40, b: 40 },
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
