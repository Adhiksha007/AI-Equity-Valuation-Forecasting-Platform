import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LineChart, DollarSign, Scale, Cpu, FileSpreadsheet, Activity, Download } from 'lucide-react'

import KpiCard from '../components/UI/KpiCard'
import TabSidebar from '../components/UI/TabSidebar'

import StockPriceTab from '../components/Charts/StockPriceTab'
import DcfTab from '../components/Charts/DcfTab'
import RelativeTab from '../components/Charts/RelativeTab'
import PredictionTab from '../components/Charts/PredictionTab'
import FinancialsTab from '../components/Charts/FinancialsTab'
import FundamentalTab from '../components/Charts/FundamentalTab'
import ExportTab from '../components/Charts/ExportTab'

const TABS = [
  { id: 'price', icon: LineChart, label: 'Stock Price' },
  { id: 'dcf', icon: DollarSign, label: 'DCF Valuation' },
  { id: 'relative', icon: Scale, label: 'Relative Valuation' },
  { id: 'prediction', icon: Cpu, label: 'ML Prediction' },
  { id: 'financials', icon: FileSpreadsheet, label: 'Financial Statements' },
  { id: 'fundamental', icon: Activity, label: 'Fundamental Health' },
  { id: 'export', icon: Download, label: 'Export Data' },
]

function fmt(v, prefix = '$', decimals = 2) {
  if (v == null) return '—'
  return `${prefix}${Number(v).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
}

export default function AnalysisPage({ data, forecastDays, forecastYears }) {
  const [activeTab, setActiveTab] = useState('price')

  const { ticker, company_name, sector, industry, exchange, kpi } = data

  const kpiCards = [
    { label: 'Current Price', value: fmt(kpi.current_price) },
    { label: 'Market Cap', value: kpi.market_cap != null ? `$${(kpi.market_cap / 1e9).toFixed(1)}B` : '—' },
    { label: 'P/E Ratio', value: kpi.pe_ratio != null ? `${Number(kpi.pe_ratio).toFixed(1)}x` : '—' },
    { label: 'Beta', value: kpi.beta != null ? Number(kpi.beta).toFixed(2) : '—' },
    {
      label: 'Intrinsic Value',
      value: fmt(kpi.intrinsic_value),
      delta: kpi.margin_of_safety != null ? `${Number(kpi.margin_of_safety).toFixed(1)}% MoS` : null,
      deltaType: (kpi.margin_of_safety ?? 0) >= 0 ? 'positive' : 'negative',
    },
    { label: 'Health Score', value: kpi.health_score != null ? `${Number(kpi.health_score).toFixed(0)}/100` : '—' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      key={ticker}
    >
      {/* Company header */}
      <div className="company-header">
        <h2 className="company-name">{company_name} <span style={{ color: 'var(--text-muted)' }}>({ticker})</span></h2>
        <div className="company-meta">
          <span className="company-meta-item">{sector}</span>
          <span className="company-meta-item">{industry}</span>
          <span className="company-meta-item">{exchange}</span>
        </div>
      </div>

      {/* KPI row */}
      <div className="kpi-grid">
        {kpiCards.map((card, i) => (
          <KpiCard key={card.label} {...card} index={i} />
        ))}
      </div>

      {/* Modern Dashboard 2-pane Layout */}
      <div className="analysis-layout">

        {/* Secondary Vertical Navigation */}
        <TabSidebar tabs={TABS} active={activeTab} onChange={setActiveTab} />

        {/* Main Content Area */}
        <div className="analysis-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {activeTab === 'price' && (
                <StockPriceTab priceHistory={data.price_history} priceFeatures={data.price_features} />
              )}
              {activeTab === 'dcf' && <DcfTab dcf={data.dcf} />}
              {activeTab === 'relative' && <RelativeTab relative={data.relative} ticker={ticker} />}
              {activeTab === 'prediction' && (
                <PredictionTab prediction={data.prediction} forecastDays={forecastDays} />
              )}
              {activeTab === 'financials' && (
                <FinancialsTab financials={data.financials} financialsWithMargins={data.financials_with_margins} />
              )}
              {activeTab === 'fundamental' && <FundamentalTab fundamental={data.fundamental} />}
              {activeTab === 'export' && (
                <ExportTab ticker={ticker} forecastYears={forecastYears} forecastDays={forecastDays} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </motion.div>
  )
}
