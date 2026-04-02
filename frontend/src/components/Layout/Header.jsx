import React from 'react'
import { Moon, Sun, TrendingUp, PanelLeftClose, PanelLeftOpen } from 'lucide-react'

export default function Header({ theme, toggleTheme, isSidebarOpen, setIsSidebarOpen }) {
  return (
    <header className="app-header">
      <div className="header-left">
        <button 
          className="btn-icon mobile-menu-btn" 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
          aria-label="Toggle Sidebar" 
        >
          {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
        </button>
        
        <div className="header-brand desktop-brand">
          <div className="header-brand-icon">
            <TrendingUp size={20} strokeWidth={2.5} />
          </div>
          <span className="header-brand-name">StockAI</span>
        </div>
      </div>

      <div className="header-center mobile-brand">
        <div className="header-brand-icon">
          <TrendingUp size={20} strokeWidth={2.5} />
        </div>
        <span className="header-brand-name">StockAI</span>
      </div>

      <div className="header-right">
        <button 
          className="btn-icon" 
          onClick={toggleTheme} 
          aria-label="Toggle Theme" 
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </header>
  )
}
