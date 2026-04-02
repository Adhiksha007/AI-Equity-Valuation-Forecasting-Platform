import React from 'react'
import { motion } from 'framer-motion'
import { Search, Calendar, Activity, Rocket, Info, AlertCircle, Loader2, PanelLeftClose, PanelLeftOpen } from 'lucide-react'

export default function Sidebar({
  ticker, setTicker,
  forecastYears, setForecastYears,
  forecastDays, setForecastDays,
  onAnalyze, loading,
  isOpen, setIsOpen,
  tabs, activeTab, setActiveTab, hasData
}) {
  return (
    <motion.aside
      className={`sidebar ${!isOpen ? 'collapsed' : ''}`}
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="sidebar-top-row" style={{ display: 'flex', alignItems: 'center', justifyContent: isOpen ? 'space-between' : 'center', width: '100%', marginBottom: '0', gap: '8px' }}>
        {isOpen && (
          <div className="sidebar-tagline" style={{ margin: 0, padding: 0, lineHeight: 1.3 }}>
            Equity Valuation &amp; Forecasting
          </div>
        )}
        <div className="desktop-sidebar-toggle" style={{ flexShrink: 0 }}>
          <button
            className="btn-icon"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle Sidebar"
          >
            {isOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
          </button>
        </div>
      </div>

      {hasData && tabs && (
        <div className="global-nav-strip" style={{
          display: 'flex', flexDirection: 'column', gap: '8px',
          marginBottom: isOpen ? '24px' : '0',
          marginTop: isOpen ? '16px' : '24px'
        }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`global-nav-btn ${activeTab === tab.id ? 'active' : ''} ${!isOpen ? 'icon-only' : ''}`}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (window.innerWidth <= 768) setIsOpen(false);
                }}
                title={tab.label}
              >
                <Icon size={20} />
                {isOpen && <span className="global-nav-label">{tab.label}</span>}
              </button>
            )
          })}
        </div>
      )}

      {/* Config Form (Hides when collapsed on desktop) */}
      <div className="sidebar-content">

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
