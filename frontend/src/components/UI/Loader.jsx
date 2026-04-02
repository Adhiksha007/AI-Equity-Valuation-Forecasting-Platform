import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const STEPS = [
  'Fetching market data…',
  'Processing financials…',
  'Running DCF model…',
  'Computing relative multiples…',
  'Training ML models…',
  'Scoring fundamental health…',
  'Persisting to database…',
]

export default function Loader({ visible }) {
  const [stepIdx] = useState(0)

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="loader-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div className="loader-spinner" />
          <motion.p
            className="loader-text"
            key={stepIdx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Analysing…
          </motion.p>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            ML training may take 30–60 seconds
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
