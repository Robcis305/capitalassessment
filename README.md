# Capital Decision Tool

A board-ready decision framework that helps founders and their boards determine whether to raise outside equity capital — and evaluates alternatives with explicit tradeoffs.

**Built with:** React + Vite · Claude API (Sonnet) for AI narrative generation · Serverless API proxy

## Quick Start

```bash
# Clone or copy project files
cd capital-decision-tool

# Install dependencies
npm install

# Copy env template and add your Anthropic API key
cp .env.example .env
# Edit .env → set ANTHROPIC_API_KEY=sk-ant-...

# Start dev server
npm run dev
```

Opens at `http://localhost:5173` by default. The scoring engine works immediately. AI narrative requires the API key.

## Project Structure

```
capital-decision-tool/
├── api/
│   └── generate.js          # Serverless proxy placeholder
├── src/
│   ├── main.jsx             # React entry point
│   └── CapitalDecisionTool.jsx  # Main app component (wizard + scoring + results)
├── index.html               # HTML shell
├── package.json
├── vite.config.js
├── .env.example
└── .gitignore
```

## License

MIT
