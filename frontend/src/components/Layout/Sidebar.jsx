import React from 'react'
import { motion } from 'framer-motion'
import { Search, Calendar, Activity, Rocket, Info, AlertCircle, Moon, Sun, BarChart3, Loader2, PanelLeftClose, PanelLeftOpen } from 'lucide-react'

export default function Sidebar({ 
  ticker, setTicker, 
  forecastYears, setForecastYears,
  forecastDays, setForecastDays, 
  onAnalyze, loading,
  theme, toggleTheme,
  isOpen, setIsOpen
}) {
  return (
    <motion.aside
      className={`sidebar ${!isOpen ? 'collapsed' : ''}`}
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Brand & Sidebar Toggle */}
      <div className="sidebar-brand" style={{ justifyContent: isOpen ? 'space-between' : 'center', width: '100%', marginBottom: isOpen ? '8px' : '0' }}>
        {isOpen && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="sidebar-brand-icon">
              <BarChart3 size={24} strokeWidth={2.5} />
            </div>
            <span className="sidebar-brand-name" style={{ fontSize: '1.25rem' }}>StockAI</span>
          </div>
        )}
        
        {/* Toggle Theme & Collapse */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: isOpen ? 'auto' : '0', flexDirection: isOpen ? 'row' : 'column' }}>
          <button 
            className="btn-icon" 
            onClick={toggleTheme} 
            aria-label="Toggle Theme" 
            style={{ padding: '6px' }}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          <button 
            className="btn-icon" 
            onClick={() => setIsOpen(!isOpen)} 
            aria-label="Toggle Sidebar" 
            style={{ padding: '6px' }}
          >
            {isOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
          </button>
        </div>
      </div>

      <div className="sidebar-content">
        <div className="sidebar-tagline">Equity Valuation &amp; Forecasting</div>

        <div className="sidebar-divider" style={{ margin: '16px 0' }} />

        {/* Controls */}
        <div className="sidebar-label">Analysis Config</div>

        <div className="form-group">
          <label className="form-label" htmlFor="ticker-input">
            <Search size={14} /> Ticker Symbol
          </label>
          <input
            id="ticker-input"
            className="form-input"
            value={ticker}
            onChange={e => setTicker(e.target.value.toUpperCase())}
            placeholder="e.g. AAPL"
            maxLength={10}
            onKeyDown={e => e.key === 'Enter' && !loading && onAnalyze()}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="forecast-years">
            <Calendar size={14} /> DCF Forecast Horizon
          </label>
          <select
            id="forecast-years"
            className="form-select"
            value={forecastYears}
            onChange={e => setForecastYears(Number(e.target.value))}
          >
            {[3, 5, 7, 10].map(y => (
              <option key={y} value={y}>{y} years</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="forecast-days">
            <Activity size={14} /> Price Prediction Days
            <span className="range-value">{forecastDays}d</span>
          </label>
          <input
            id="forecast-days"
            className="form-range"
            type="range"
            min={10} max={90} step={5}
            value={forecastDays}
            onChange={e => setForecastDays(Number(e.target.value))}
          />
        </div>

        <div className="sidebar-divider" style={{ margin: '16px 0' }} />

        <button
          id="run-analysis-btn"
          className="btn btn-primary"
          onClick={onAnalyze}
          disabled={loading || !ticker.trim()}
        >
          {loading ? (
            <><Loader2 size={16} className="lucide-spin" /> Analysing…</>
          ) : (
            <><Rocket size={16} /> Run Analysis</>
          )}
        </button>

        <div className="sidebar-divider" style={{ margin: '24px 0' }} />

        {/* About */}
        <div className="sidebar-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Info size={12} /> About
        </div>
        <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Automates equity valuation using DCF, relative multiples, and ML.
        </p>

        <div style={{ marginTop: 16 }}>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
            <AlertCircle size={14} style={{ flexShrink: 0 }} /> 
            Not financial advice.
          </p>
        </div>
      </div>
    </motion.aside>
  )
}
