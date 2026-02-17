import React from 'react'
import { createRoot } from 'react-dom/client'
import CapitalDecisionTool from './CapitalDecisionTool'
import './styles.css'

function App() {
  return <CapitalDecisionTool />
}

createRoot(document.getElementById('root')).render(<App />)
