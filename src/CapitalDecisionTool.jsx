import React, { useState } from 'react'

export default function CapitalDecisionTool() {
  const [message, setMessage] = useState('Welcome — scoring engine ready')

  async function generateNarrative() {
    setMessage('Calling API...')
    try {
      const res = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: 'summary' }) })
      const data = await res.json()
      setMessage(data.text || JSON.stringify(data))
    } catch (err) {
      setMessage('API unavailable — set ANTHROPIC_API_KEY in .env and deploy serverless proxy')
    }
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
      <h1>Capital Decision Tool</h1>
      <p>{message}</p>
      <button onClick={generateNarrative}>Generate AI Narrative (demo)</button>
    </div>
  )
}
