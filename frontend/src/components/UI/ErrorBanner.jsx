import React from 'react'
import { motion } from 'framer-motion'
import { AlertCircle } from 'lucide-react'

export default function ErrorBanner({ message }) {
  if (!message) return null
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="error-banner"
    >
      <AlertCircle size={20} strokeWidth={2.5} style={{ flexShrink: 0 }} /> 
      <span>{message}</span>
    </motion.div>
  )
}
