import React from 'react'

export default function TabSidebar({ tabs, active, onChange }) {
  return (
    <nav className="analysis-sidebar" role="navigation">
      {tabs.map((tab) => {
        const Icon = tab.icon
        return (
          <button
            key={tab.id}
            className={`nav-btn${active === tab.id ? ' active' : ''}`}
            onClick={() => onChange(tab.id)}
          >
            <Icon size={18} strokeWidth={2} />
            <span>{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
