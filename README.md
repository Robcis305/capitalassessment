# Capital Decision Tool

A board-ready decision framework that helps founders and their boards determine whether to raise outside equity capital — and evaluates alternatives with explicit tradeoffs.

**Built with:** React + Vite · Claude API (Sonnet) for AI narrative generation · Serverless API proxy

## What It Does

- **4-step wizard** collects business fundamentals, growth/runway, capital/governance, and economics/risk inputs
- **Client-side scoring engine** produces a 0–100 composite score across 6 weighted dimensions with Green/Yellow/Red bands
- **Red flag detection** auto-identifies deal-breakers that override scores
- **Decision gates** evaluate Need vs. Want, Can vs. Should, ROI Mechanism, and Timing
- **12-option alternatives tradeoff matrix** with best-fit conditions and "when it's a trap"
- **AI narrative generation** (Claude API) produces a consultant-grade board-ready summary from your inputs
- **Next 30 Days action plan** calibrated to the scoring band

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

Opens at `http://localhost:3000`. The scoring engine works immediately. AI narrative requires the API key.

## Using Claude Code

Open the project directory in Claude Code to iterate on it:

```bash
cd capital-decision-tool
claude
```

Example things to ask Claude Code:

- "Add PDF export for the full assessment"
- "Add the one-slide board summary as a visual component"
- "Make the scoring weights configurable by the user"
- "Add a comparison mode to run multiple scenarios side by side"
- "Add email capture before showing results"
- "Embed this as a section of my existing Next.js site"

## Project Structure

```
capital-decision-tool/
├── api/
│   └── generate.js          # Serverless proxy for Claude API (keeps key server-side)
├── src/
│   ├── main.jsx              # React entry point
│   └── CapitalDecisionTool.jsx  # Main app component (wizard + scoring + results)
├── index.html                # HTML shell
├── package.json
├── vite.config.js
├── .env.example              # Environment variable template
└── .gitignore
```

## Deployment

### Vercel (recommended — zero config)

```bash
npm i -g vercel
vercel

# Set your API key in Vercel dashboard:
# Settings → Environment Variables → ANTHROPIC_API_KEY
```

Vercel auto-detects the `/api/generate.js` serverless function. Done.

### Netlify

```bash
# Move the API function to Netlify's expected location
mkdir -p netlify/functions
cp api/generate.js netlify/functions/generate.js

# Create netlify.toml
cat > netlify.toml << 'EOF'
[build]
  command = "npm run build"
  publish = "dist"

[functions]
  directory = "netlify/functions"

[[redirects]]
  from = "/api/generate"
  to = "/.netlify/functions/generate"
  status = 200
EOF

# Deploy
npx netlify-cli deploy --prod
```

Set `ANTHROPIC_API_KEY` in Netlify dashboard → Site settings → Environment variables.

### Cloudflare Pages

Build the static site and use a Cloudflare Worker for the API proxy:

```bash
npm run build
# Deploy `dist/` to Cloudflare Pages
# Create a Worker for /api/generate with the same logic as api/generate.js
```

### Self-hosted (any Node.js server)

```bash
npm run build

# Serve the dist/ folder with any static server
# Mount api/generate.js as a POST route at /api/generate
# Example with Express:
```

```js
import express from 'express';
import handler from './api/generate.js';

const app = express();
app.use(express.json());
app.use(express.static('dist'));
app.post('/api/generate', (req, res) => handler(req, res));
app.listen(3000);
```

### Static-only (no AI narrative)

If you don't need the AI narrative feature, just build and deploy the static files:

```bash
npm run build
# Upload dist/ to any static host (GitHub Pages, S3, etc.)
```

The scoring engine, decision gates, alternatives matrix, and action plans all work without the API.

## Scoring Model

| Dimension | Weight | What It Measures |
|-----------|--------|-----------------|
| Runway & Liquidity | 22% | Months of cash, urgency of capital need |
| Unit Economics | 18% | Gross margin, CAC payback, proven economics |
| Growth Readiness | 18% | Growth plan clarity, use of funds, constraint alignment |
| Capital Fit | 15% | Investor market fit, dilution tolerance, prior raises |
| Risk Profile | 15% | Risk tolerance, customer concentration, profitability |
| Governance | 12% | Control preferences, board composition, existing obligations |

**Bands:** Green (66–100) → Raise Now · Yellow (41–65) → Raise Later · Red (0–40) → Don't Raise

**Red flag overrides:** 2+ red flags → forced RED. 1 red flag + GREEN → downgraded to YELLOW.

## Customization

The scoring weights, red flag triggers, and alternatives data are all defined as constants at the top of `CapitalDecisionTool.jsx`. Modify them to match your advisory framework.

## License

MIT

## Deployment (Vercel)

This project is configured for easy deployment to Vercel. The repository includes a `vercel.json` which builds the Vite app and exposes the serverless API under `/api`.

Recommended Vercel settings:

- Build Command: `npm run build`
- Output Directory: `dist`

Environment variables (set these in the Vercel dashboard — Project → Settings → Environment Variables):

- `VITE_SUPABASE_URL` — your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — your Supabase anon/public key
- `ANTHROPIC_API_KEY` — (optional) if you enable the AI narrative proxy in `api/generate.js`

Notes:

- The Supabase client reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (Vite prefixes are required for client-side access).
- Serverless API functions in `/api` will run on Vercel as Node functions; for server-side secrets prefer using `ANTHROPIC_API_KEY` in project environment variables and reference them from server code (not exposed to client).

To deploy from the command line, install the Vercel CLI and run:

```bash
npm i -g vercel
vercel login
vercel --prod
```

