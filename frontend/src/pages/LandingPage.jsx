import React from 'react'
import { motion } from 'framer-motion'
import { DollarSign, Scale, Cpu, Activity } from 'lucide-react'

const FEATURES = [
  { icon: DollarSign, label: 'DCF Valuation',      desc: 'WACC estimation, FCF forecast, Terminal Value, intrinsic value per share' },
  { icon: Scale,      label: 'Relative Valuation', desc: 'P/E, EV/EBITDA, P/B, P/S vs sector benchmarks' },
  { icon: Cpu,        label: 'ML Prediction',      desc: 'Linear Regression + Random Forest price forecasting' },
  { icon: Activity,   label: 'Fundamental Health', desc: '4-pillar health score: Profitability, Liquidity, Leverage, Efficiency' },
]

const container = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.1 } },
}
const item = {
  hidden: { opacity: 0, y: 24, scale: 0.95 },
  show:   { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } },
}

export default function LandingPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 style={{ marginBottom: 12, fontSize: '2.5rem', letterSpacing: '-0.04em' }}>
        AI Equity Valuation <br/><span style={{ color: 'var(--accent)' }}>&amp; Forecasting</span>
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 8, fontSize: '1.1rem', maxWidth: '600px' }}>
        A professional-grade valuation platform combining traditional DCF modeling, sector relative multiples, and machine learning trend predictions.
      </p>
      
      <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: 16 }}>
        Enter a ticker symbol in the sidebar and click <strong style={{ color: 'var(--text-primary)' }}>Run Analysis</strong> to begin.
      </p>

      <motion.div
        className="feature-grid"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {FEATURES.map(f => {
          const Icon = f.icon
          return (
            <motion.div key={f.label} className="feature-card card card-hover" variants={item}>
              <div className="feature-icon-wrapper">
                <Icon size={24} strokeWidth={2} />
              </div>
              <div className="feature-title">{f.label}</div>
              <div className="feature-desc">{f.desc}</div>
            </motion.div>
          )
        })}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        style={{ marginTop: 24, textAlign: 'center', display: 'flex', justifyContent: 'center' }}
      >
        <div style={{ padding: '8px 16px', background: 'var(--card)', borderRadius: '100px', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Stack: yfinance · scikit-learn · FastAPI · React+Vite
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}
