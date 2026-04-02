import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Sidebar from './components/Layout/Sidebar'
import Loader from './components/UI/Loader'
import ErrorBanner from './components/UI/ErrorBanner'
import LandingPage from './pages/LandingPage'
import AnalysisPage from './pages/AnalysisPage'
import client from './api/client'
import './index.css'

export default function App() {
  const [ticker, setTicker] = useState('AAPL')
  const [forecastYears, setForecastYears] = useState(5)
  const [forecastDays, setForecastDays] = useState(30)
  
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
      <Sidebar
        ticker={ticker}
        setTicker={setTicker}
        forecastYears={forecastYears}
        setForecastYears={setForecastYears}
        forecastDays={forecastDays}
        setForecastDays={setForecastDays}
        onAnalyze={handleAnalyze}
        loading={loading}
        theme={theme}
        toggleTheme={toggleTheme}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      
      <main className="main-content">
        <ErrorBanner message={error} />
        
        {!analysisData && !loading && !error && <LandingPage />}
        
        {analysisData && (
          <AnalysisPage 
            data={analysisData} 
            forecastDays={forecastDays} 
            forecastYears={forecastYears} 
          />
        )}
      </main>

      <Loader visible={loading} />
    </div>
  )
}
