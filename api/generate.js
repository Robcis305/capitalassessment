// Simple serverless handler placeholder for AI narrative proxy
// Replace fetch logic with your preferred AI provider and set ANTHROPIC_API_KEY in environment

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }

  // Demo response — implement real proxy in production
  res.statusCode = 200
  res.end(JSON.stringify({ text: 'Demo AI narrative — set up your API key and proxy to enable.' }))
}
