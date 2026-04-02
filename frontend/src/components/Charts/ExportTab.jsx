import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Download, FileText } from 'lucide-react'

const CSV_FILES = [
  'company_overview.csv',
  'financial_statements.csv',
  'stock_prices.csv',
  'valuation_results.csv',
  'relative_valuation.csv',
  'prediction_actuals.csv',
  'future_predictions.csv',
  'fundamental_analysis.csv',
]

const POWERBI_STEPS = [
  'Open Power BI Desktop',
  'Click Get Data → Text/CSV',
  'Import each CSV from the downloaded ZIP archive',
  'Create relationships between tables on the Ticker column',
  'Build visuals: bar charts for financials, gauge for health score, line charts for price trends',
]

export default function ExportTab({ ticker, forecastYears, forecastDays }) {
  const [downloading, setDownloading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState(null)

  async function handleExport() {
    if (!ticker) return
    setDownloading(true)
    setDone(false)
    setError(null)
    try {
      const res = await fetch(`/api/export/${ticker}?forecast_years=${forecastYears}&forecast_days=${forecastDays}`)
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `${ticker}_analysis.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setDone(true)
    } catch (e) {
      setError(e.message)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="tab-content" style={{ marginTop: 24 }}>
      <h3 style={{ marginBottom: 12 }}>Export Data for Power BI</h3>
      <p style={{ marginBottom: 24, fontSize: '0.95rem' }}>
        Click the button below to export all analysis outputs as CSV files bundled in a ZIP archive.
        Import them into <strong style={{ color: 'var(--text-primary)' }}>Microsoft Power BI</strong> to build interactive dashboards.
      </p>

      <motion.button
        id="export-btn"
        className="btn btn-primary"
        style={{ width: 'auto', minWidth: 240, padding: '14px 24px', fontSize: '1rem' }}
        onClick={handleExport}
        disabled={downloading || !ticker}
        whileTap={{ scale: 0.97 }}
      >
        {downloading ? '⏳ Exporting…' : <><Download size={18} /> Export All CSVs (.zip)</>}
      </motion.button>

      {done && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          style={{ marginTop: 20, color: 'var(--green)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
        >
          ✅ {ticker}_analysis.zip downloaded to your Downloads folder!
        </motion.div>
      )}
      {error && <div className="error-banner" style={{ marginTop: 16 }}>Export failed: {error}</div>}

      {/* File list */}
      <p className="section-title" style={{ marginTop: 40 }}>Files Included in ZIP</p>
      <ul className="export-file-list">
        {CSV_FILES.map(f => (
          <li key={f}>
            <FileText size={16} color="var(--accent)" />
            {f}
          </li>
        ))}
      </ul>

      {/* Power BI instructions */}
      <p className="section-title" style={{ marginTop: 32 }}>Power BI Setup Instructions</p>
      <div className="card">
        <ol style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {POWERBI_STEPS.map((step, i) => (
            <li key={i} style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {step}
            </li>
          ))}
        </ol>

        <div className="sidebar-divider" style={{ margin: '24px 0' }} />

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          Suggested Dashboard Pages:
        </p>
        <ul style={{ paddingLeft: 20, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            'Page 1: Company Overview (KPIs + valuation signal)',
            'Page 2: Financial Trends (revenue, income, margins)',
            'Page 3: DCF Valuation (intrinsic value vs price)',
            'Page 4: Stock Price Prediction (forecast chart)',
            'Page 5: Fundamental Health Score (spider + ratios)',
          ].map(p => (
            <li key={p} style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{p}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
