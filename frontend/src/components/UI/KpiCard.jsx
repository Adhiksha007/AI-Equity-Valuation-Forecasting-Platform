import React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'

export default function KpiCard({ label, value, delta, deltaType, index = 0 }) {
  return (
    <motion.div
      className="kpi-card card-hover"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      <div className="kpi-header">
        <span className="kpi-label">{label}</span>
      </div>
      <div className="kpi-value">{value ?? '—'}</div>
      {delta != null && (
        <div className={`kpi-delta ${deltaType}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {deltaType === 'positive' ? <TrendingUp size={14} /> : deltaType === 'negative' ? <TrendingDown size={14} /> : null}
          {delta}
        </div>
      )}
    </motion.div>
  )
}
