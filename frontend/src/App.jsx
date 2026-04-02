import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Sidebar from './components/Layout/Sidebar'
import Header from './components/Layout/Header'
import Loader from './components/UI/Loader'
import ErrorBanner from './components/UI/ErrorBanner'
import LandingPage from './pages/LandingPage'
import AnalysisPage from './pages/AnalysisPage'
import client from './api/client'
import './index.css'
import { LineChart, DollarSign, Scale, Cpu, FileSpreadsheet, Activity, Download } from 'lucide-react'

const TABS = [
  { id: 'price', icon: LineChart, label: 'Stock Price' },
  { id: 'dcf', icon: DollarSign, label: 'DCF Valuation' },
  { id: 'relative', icon: Scale, label: 'Relative Valuation' },
  { id: 'prediction', icon: Cpu, label: 'ML Prediction' },
  { id: 'financials', icon: FileSpreadsheet, label: 'Financial Statements' },
  { id: 'fundamental', icon: Activity, label: 'Fundamental Health' },
  { id: 'export', icon: Download, label: 'Export Data' },
]

export default function App() {
  const [ticker, setTicker] = useState('AAPL')
  const [forecastYears, setForecastYears] = useState(5)
  const [forecastDays, setForecastDays] = useState(30)
  
  const [activeTab, setActiveTab] = useState('price')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const [analysisData, setAnalysisData] = useState(null)
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  // Theme Management
  const [theme, setTheme] = useState('dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  async function handleAnalyze() {
    if (!ticker.trim()) return
    
    setLoading(true)
    setError(null)
    setAnalysisData(null)
    
    try {
      setIsSidebarOpen(false) // Collapse sidebar when running analysis
      
      const { data } = await client.post('/analyze', {
        ticker: ticker.trim().toUpperCase(),
        forecast_years: forecastYears,
        forecast_days: forecastDays
      })
      setAnalysisData(data)
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'An error occurred during analysis.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-shell">
      <Header 
        theme={theme}
        toggleTheme={toggleTheme}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      
      <div className="app-body">
        {/* Mobile overlay for offcanvas drawer */}
        <div 
          className={`mobile-overlay ${isSidebarOpen ? 'active' : ''}`}
          onClick={() => setIsSidebarOpen(false)}
        />

        <Sidebar
          ticker={ticker}
          setTicker={setTicker}
          forecastYears={forecastYears}
          setForecastYears={setForecastYears}
          forecastDays={forecastDays}
          setForecastDays={setForecastDays}
          onAnalyze={handleAnalyze}
          loading={loading}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
          tabs={TABS}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          hasData={!!analysisData}
        />
      
      <main className="main-content">
        <ErrorBanner message={error} />
        
        {!analysisData && !loading && !error && <LandingPage />}
        
        {analysisData && (
          <AnalysisPage 
            data={analysisData} 
            forecastDays={forecastDays} 
            forecastYears={forecastYears} 
            activeTab={activeTab}
          />
        )}
        </main>
      </div>

      <Loader visible={loading} />
    </div>
  )
}
