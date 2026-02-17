import { useState, useEffect, useCallback, useMemo } from "react";

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION & CONSTANTS
// ═══════════════════════════════════════════════════════════════

const SCORING_WEIGHTS = {
  runway: 0.22,
  economics: 0.18,
  growthReadiness: 0.18,
  capitalFit: 0.15,
  governance: 0.12,
  riskProfile: 0.15,
};

const SCORE_BANDS = {
  green: { min: 66, label: "Green — Raise Equity Now", color: "#16a34a" },
  yellow: { min: 41, label: "Yellow — Raise Later / Conditional", color: "#d97706" },
  red: { min: 0, label: "Red — Do Not Raise Equity", color: "#dc2626" },
};

const BUSINESS_MODELS = [
  "SaaS / Recurring Revenue",
  "Marketplace / Platform",
  "Services / Agency",
  "Consumer / DTC",
  "Hardware / Physical Product",
  "Fintech / Lending",
  "Biotech / Deep Tech",
  "Other",
];

const CONSTRAINTS = [
  "Capital (need cash to grow)",
  "Sales capacity (can't sell fast enough)",
  "Product (not ready / gaps)",
  "Supply chain / fulfillment",
  "Talent (can't hire fast enough)",
  "Time (competitive window closing)",
  "Regulation / compliance",
  "Unit economics (not proven yet)",
];

const INVESTOR_PROFILES = [
  "Pre-Seed / Angel",
  "Seed VC",
  "Series A VC",
  "Growth Equity",
  "Strategic / Corporate",
  "PE Minority",
  "Family Office",
  "Not sure / exploring",
];

const ALTERNATIVES = [
  {
    name: "Cashflow Optimization",
    category: "Internal",
    speed: "Immediate",
    costOfCapital: "None (operational)",
    covenants: "None",
    governanceBurden: "None",
    bestFit: "Positive unit economics, pricing power, cost waste",
    trap: "When cuts kill growth capacity or signal distress to customers",
    dilution: "None",
  },
  {
    name: "Pricing / Re-packaging",
    category: "Internal",
    speed: "1–3 months",
    costOfCapital: "None",
    covenants: "None",
    governanceBurden: "None",
    bestFit: "Underpriced product, expansion revenue opportunity",
    trap: "When customers are price-sensitive and churn spikes",
    dilution: "None",
  },
  {
    name: "Customer Prepay / Deposits",
    category: "Internal",
    speed: "1–3 months",
    costOfCapital: "Implicit discount (3–10%)",
    covenants: "Delivery obligations",
    governanceBurden: "Low",
    bestFit: "Strong demand, long sales cycles, enterprise customers",
    trap: "When you can't deliver — prepay becomes a liability, not an asset",
    dilution: "None",
  },
  {
    name: "Revenue-Based Financing (RBF)",
    category: "Non-dilutive",
    speed: "2–6 weeks",
    costOfCapital: "12–30% total cost (factor rate)",
    covenants: "Revenue share until repaid (typically 1.2–1.8x)",
    governanceBurden: "Low — reporting only",
    bestFit: "Predictable recurring revenue, need for growth capital",
    trap: "When revenue dips — fixed % of lower revenue extends payback and cash drain persists",
    dilution: "None",
  },
  {
    name: "Venture Debt",
    category: "Non-dilutive",
    speed: "4–8 weeks",
    costOfCapital: "8–15% interest + 0.5–2% warrant coverage",
    covenants: "Financial covenants, minimum cash, revenue floors",
    governanceBurden: "Medium — monthly reporting, covenant monitoring",
    bestFit: "Post-equity raise, extending runway, bridge to milestone",
    trap: "When used as substitute for equity without the growth trajectory to support it — covenant breach risk",
    dilution: "Minimal (warrants)",
  },
  {
    name: "Asset-Based Lending (ABL)",
    category: "Non-dilutive",
    speed: "4–12 weeks",
    costOfCapital: "6–12% + fees",
    covenants: "Borrowing base limits, AR/inventory audits",
    governanceBurden: "Medium-High — ongoing audits, field exams",
    bestFit: "Strong AR or inventory base, working capital gaps",
    trap: "When receivables quality deteriorates — borrowing base shrinks when you need it most",
    dilution: "None",
  },
  {
    name: "Factoring / AR Financing",
    category: "Non-dilutive",
    speed: "1–3 weeks",
    costOfCapital: "1–5% per month (high annualized)",
    covenants: "Customer notification (sometimes), AR assignment",
    governanceBurden: "Low-Medium",
    bestFit: "Strong creditworthy customers, long payment terms",
    trap: "Expensive if used long-term; customer relationships can be impacted",
    dilution: "None",
  },
  {
    name: "Equipment Finance / Leasing",
    category: "Non-dilutive",
    speed: "2–6 weeks",
    costOfCapital: "5–12%",
    covenants: "Asset-specific, maintenance requirements",
    governanceBurden: "Low",
    bestFit: "Capital-intensive ops with identifiable assets",
    trap: "When the asset depreciates faster than the lease — underwater on residual",
    dilution: "None",
  },
  {
    name: "Strategic Partnership / Licensing",
    category: "Strategic",
    speed: "2–6 months",
    costOfCapital: "Varies (revenue share, exclusivity cost)",
    covenants: "Exclusivity, performance milestones, IP constraints",
    governanceBurden: "Medium — partner management, reporting",
    bestFit: "Unique IP/tech, distribution gaps, market access needs",
    trap: "When exclusivity locks you out of better deals or partner controls your roadmap",
    dilution: "None (but strategic constraints)",
  },
  {
    name: "Grants / Non-dilutive Programs",
    category: "Non-dilutive",
    speed: "2–12 months",
    costOfCapital: "None (free capital)",
    covenants: "Use restrictions, reporting, milestones",
    governanceBurden: "Medium — compliance, reporting burden",
    bestFit: "R&D-heavy, gov/defense, climate/impact, SBIR-eligible",
    trap: "When grant timelines don't match business urgency — distraction cost is real",
    dilution: "None",
  },
  {
    name: "Minority Secondary / Recap",
    category: "Structured",
    speed: "2–4 months",
    costOfCapital: "Dilution (negotiated discount to fair value)",
    covenants: "Typically light — information rights, tag-along",
    governanceBurden: "Low-Medium",
    bestFit: "Founder liquidity need, investor refresh, cap table cleanup",
    trap: "When it signals lack of confidence in future value — pricing anchors down",
    dilution: "Moderate",
  },
  {
    name: "Cost Structure Redesign",
    category: "Internal",
    speed: "1–3 months",
    costOfCapital: "None",
    covenants: "None",
    governanceBurden: "None",
    bestFit: "Bloated ops, low-ROI spend, margin expansion opportunity",
    trap: "When cuts are too deep — lose key people, break delivery capacity",
    dilution: "None",
  },
];

const RED_FLAGS = [
  { id: "runway_critical", label: "Runway < 6 months with no clear path to extend", check: (d) => d.runwayMonths && d.runwayMonths < 6 },
  { id: "negative_margin", label: "Negative gross margin with no path to positive", check: (d) => d.grossMargin && d.grossMargin < 0 },
  { id: "no_use_of_funds", label: "No clear use of funds or ROI mechanism defined", check: (d) => !d.useOfFunds || d.useOfFunds.trim() === "" },
  { id: "founder_control_conflict", label: "Founder unwilling to accept any dilution but needs capital", check: (d) => d.dilutionTolerance === "none" && d.primaryConstraint === "Capital (need cash to grow)" },
  { id: "no_growth_plan", label: "No defined growth objective for next 24–36 months", check: (d) => !d.growthGoal || d.growthGoal.trim() === "" },
  { id: "customer_concentration", label: "Top customer > 40% of revenue (fundraising risk)", check: (d) => d.customerConcentration && d.customerConcentration > 40 },
];

// ═══════════════════════════════════════════════════════════════
// SCORING ENGINE
// ═══════════════════════════════════════════════════════════════

function computeRunwayScore(data) {
  const months = data.runwayMonths || 0;
  if (months >= 18) return 95;
  if (months >= 12) return 75;
  if (months >= 9) return 55;
  if (months >= 6) return 35;
  return 15;
}

function computeEconomicsScore(data) {
  let score = 50;
  const gm = data.grossMargin;
  if (gm >= 70) score += 25;
  else if (gm >= 50) score += 15;
  else if (gm >= 30) score += 5;
  else if (gm < 30) score -= 15;

  if (data.unitEconomics === "strong") score += 20;
  else if (data.unitEconomics === "emerging") score += 10;
  else if (data.unitEconomics === "unproven") score -= 10;

  if (data.cacPayback && data.cacPayback <= 12) score += 10;
  else if (data.cacPayback && data.cacPayback <= 18) score += 5;

  return Math.max(0, Math.min(100, score));
}

function computeGrowthReadinessScore(data) {
  let score = 50;
  if (data.growthGoal && data.growthGoal.trim()) score += 10;
  if (data.useOfFunds && data.useOfFunds.trim()) score += 15;

  if (data.primaryConstraint === "Capital (need cash to grow)") score += 10;
  else if (data.primaryConstraint === "Time (competitive window closing)") score += 10;
  else if (data.primaryConstraint === "Sales capacity (can't sell fast enough)") score += 5;
  else if (data.primaryConstraint === "Unit economics (not proven yet)") score -= 15;

  if (data.revenueGrowthRate >= 100) score += 15;
  else if (data.revenueGrowthRate >= 50) score += 10;
  else if (data.revenueGrowthRate >= 20) score += 5;

  return Math.max(0, Math.min(100, score));
}

function computeCapitalFitScore(data) {
  let score = 50;
  const profile = data.investorProfile;
  if (profile && profile !== "Not sure / exploring") score += 10;

  if (data.dilutionTolerance === "comfortable") score += 20;
  else if (data.dilutionTolerance === "moderate") score += 10;
  else if (data.dilutionTolerance === "minimal") score -= 5;
  else if (data.dilutionTolerance === "none") score -= 25;

  if (data.hasTermSheets) score += 15;
  if (data.priorRaises > 0) score += 5;

  return Math.max(0, Math.min(100, score));
}

function computeGovernanceScore(data) {
  let score = 60;
  if (data.controlPreference === "maintain_full") score -= 20;
  else if (data.controlPreference === "share_strategic") score += 10;
  else if (data.controlPreference === "flexible") score += 20;

  if (data.existingDebt && data.existingDebt !== "none") score -= 10;
  if (data.boardSeats === "founder_majority") score += 5;

  return Math.max(0, Math.min(100, score));
}

function computeRiskScore(data) {
  let score = 50;
  if (data.riskTolerance === "high") score += 20;
  else if (data.riskTolerance === "moderate") score += 10;
  else if (data.riskTolerance === "low") score -= 10;

  if (data.runwayMonths && data.runwayMonths < 6) score -= 20;
  if (data.customerConcentration && data.customerConcentration > 40) score -= 15;
  if (data.profitability === "profitable") score += 15;
  else if (data.profitability === "breakeven") score += 5;

  return Math.max(0, Math.min(100, score));
}

function computeAllScores(data) {
  const scores = {
    runway: computeRunwayScore(data),
    economics: computeEconomicsScore(data),
    growthReadiness: computeGrowthReadinessScore(data),
    capitalFit: computeCapitalFitScore(data),
    governance: computeGovernanceScore(data),
    riskProfile: computeRiskScore(data),
  };

  const weighted = Object.entries(SCORING_WEIGHTS).reduce(
    (sum, [key, weight]) => sum + scores[key] * weight,
    0
  );

  const band = weighted >= 66 ? "green" : weighted >= 41 ? "yellow" : "red";
  const activeRedFlags = RED_FLAGS.filter((rf) => rf.check(data));

  // Red flags can force downgrade
  const adjustedBand = activeRedFlags.length >= 2 ? "red" : activeRedFlags.length === 1 && band === "green" ? "yellow" : band;

  return {
    dimensions: scores,
    composite: Math.round(weighted),
    band: adjustedBand,
    redFlags: activeRedFlags,
  };
}

function getDecision(band) {
  if (band === "green") return { action: "Raise Equity Now", description: "Conditions support an equity raise. Proceed to investor preparation and timeline planning." };
  if (band === "yellow") return { action: "Raise Later / Conditional", description: "Equity raise is viable but not optimal today. Address gating issues first, then re-score." };
  return { action: "Do Not Raise Equity", description: "Equity is the wrong tool right now. Evaluate non-dilutive alternatives or fix fundamentals first." };
}

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const palette = {
  bg: "#0c0f14",
  surface: "#141820",
  surfaceHover: "#1a1f2a",
  border: "#252b38",
  borderLight: "#2d3548",
  text: "#e8eaf0",
  textMuted: "#8b92a5",
  textDim: "#5c637a",
  accent: "#4f8fea",
  accentDim: "#2a4a7a",
  green: "#22c55e",
  greenDim: "#0a2e1a",
  yellow: "#eab308",
  yellowDim: "#2e2a0a",
  red: "#ef4444",
  redDim: "#2e0a0a",
  white: "#ffffff",
};

// ═══════════════════════════════════════════════════════════════
// REUSABLE COMPONENTS
// ═══════════════════════════════════════════════════════════════

function ProgressBar({ step, total }) {
  const pct = ((step + 1) / total) * 100;
  return (
    <div style={{ width: "100%", marginBottom: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12, color: palette.textMuted, fontFamily: "'DM Sans', sans-serif", letterSpacing: 1, textTransform: "uppercase" }}>
        <span>Step {step + 1} of {total}</span>
        <span>{Math.round(pct)}% complete</span>
      </div>
      <div style={{ width: "100%", height: 3, background: palette.border, borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg, ${palette.accent}, ${palette.green})`, borderRadius: 2, transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }} />
      </div>
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div style={{
      background: palette.surface,
      border: `1px solid ${palette.border}`,
      borderRadius: 12,
      padding: 28,
      ...style,
    }}>
      {children}
    </div>
  );
}

function Label({ children, sub }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: palette.text, fontFamily: "'DM Sans', sans-serif", letterSpacing: 0.2 }}>{children}</label>
      {sub && <span style={{ fontSize: 12, color: palette.textMuted, fontFamily: "'DM Sans', sans-serif", marginTop: 2, display: "block" }}>{sub}</span>}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text", ...rest }) {
  return (
    <input
      type={type}
      value={value || ""}
      onChange={(e) => onChange(type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%",
        padding: "10px 14px",
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        borderRadius: 8,
        color: palette.text,
        fontSize: 14,
        fontFamily: "'DM Sans', sans-serif",
        outline: "none",
        boxSizing: "border-box",
        transition: "border-color 0.2s",
      }}
      onFocus={(e) => (e.target.style.borderColor = palette.accent)}
      onBlur={(e) => (e.target.style.borderColor = palette.border)}
      {...rest}
    />
  );
}

function TextArea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: "100%",
        padding: "10px 14px",
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        borderRadius: 8,
        color: palette.text,
        fontSize: 14,
        fontFamily: "'DM Sans', sans-serif",
        outline: "none",
        resize: "vertical",
        boxSizing: "border-box",
        lineHeight: 1.5,
      }}
      onFocus={(e) => (e.target.style.borderColor = palette.accent)}
      onBlur={(e) => (e.target.style.borderColor = palette.border)}
    />
  );
}

function Select({ value, onChange, options, placeholder }) {
  return (
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        padding: "10px 14px",
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        borderRadius: 8,
        color: value ? palette.text : palette.textDim,
        fontSize: 14,
        fontFamily: "'DM Sans', sans-serif",
        outline: "none",
        boxSizing: "border-box",
        cursor: "pointer",
        appearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%238b92a5' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 14px center",
        paddingRight: 36,
      }}
    >
      <option value="" disabled>{placeholder || "Select..."}</option>
      {options.map((o) => (
        <option key={o} value={o} style={{ background: palette.bg, color: palette.text }}>{o}</option>
      ))}
    </select>
  );
}

function RadioGroup({ value, onChange, options }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {options.map((o) => {
        const selected = value === o.value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            style={{
              padding: "8px 16px",
              background: selected ? palette.accentDim : palette.bg,
              border: `1px solid ${selected ? palette.accent : palette.border}`,
              borderRadius: 8,
              color: selected ? palette.accent : palette.textMuted,
              fontSize: 13,
              fontFamily: "'DM Sans', sans-serif",
              cursor: "pointer",
              transition: "all 0.2s",
              fontWeight: selected ? 600 : 400,
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Button({ children, onClick, variant = "primary", disabled, style: extraStyle }) {
  const styles = {
    primary: {
      background: `linear-gradient(135deg, ${palette.accent}, #3a6fd8)`,
      color: palette.white,
      border: "none",
      fontWeight: 600,
    },
    secondary: {
      background: "transparent",
      color: palette.textMuted,
      border: `1px solid ${palette.border}`,
      fontWeight: 500,
    },
    danger: {
      background: palette.redDim,
      color: palette.red,
      border: `1px solid ${palette.red}33`,
      fontWeight: 500,
    },
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "12px 28px",
        borderRadius: 10,
        fontSize: 14,
        fontFamily: "'DM Sans', sans-serif",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        transition: "all 0.2s",
        letterSpacing: 0.3,
        ...styles[variant],
        ...extraStyle,
      }}
    >
      {children}
    </button>
  );
}

function ScoreBadge({ score, size = "large" }) {
  const bandColor = score >= 66 ? palette.green : score >= 41 ? palette.yellow : palette.red;
  const bandBg = score >= 66 ? palette.greenDim : score >= 41 ? palette.yellowDim : palette.redDim;
  const bandLabel = score >= 66 ? "GREEN" : score >= 41 ? "YELLOW" : "RED";
  const isLarge = size === "large";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: isLarge ? 16 : 10 }}>
      <div style={{
        width: isLarge ? 72 : 44,
        height: isLarge ? 72 : 44,
        borderRadius: "50%",
        background: bandBg,
        border: `2px solid ${bandColor}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: isLarge ? 26 : 16,
        fontWeight: 700,
        color: bandColor,
        fontFamily: "'Playfair Display', serif",
      }}>
        {score}
      </div>
      <div>
        <div style={{ fontSize: isLarge ? 11 : 10, fontWeight: 700, color: bandColor, letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif" }}>{bandLabel}</div>
        {isLarge && <div style={{ fontSize: 12, color: palette.textMuted, fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>Composite Score</div>}
      </div>
    </div>
  );
}

function DimensionBar({ label, score, weight }) {
  const bandColor = score >= 66 ? palette.green : score >= 41 ? palette.yellow : palette.red;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: palette.text, fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 12, color: palette.textMuted, fontFamily: "'DM Sans', sans-serif" }}>{score}/100 · {Math.round(weight * 100)}% weight</span>
      </div>
      <div style={{ width: "100%", height: 6, background: palette.border, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${score}%`, height: "100%", background: bandColor, borderRadius: 3, transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)" }} />
      </div>
    </div>
  );
}

function FieldGroup({ children }) {
  return <div style={{ marginBottom: 22 }}>{children}</div>;
}

function SectionTitle({ children, sub }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 28, fontWeight: 700, color: palette.text, fontFamily: "'Playfair Display', serif", margin: 0, lineHeight: 1.2 }}>{children}</h2>
      {sub && <p style={{ fontSize: 14, color: palette.textMuted, fontFamily: "'DM Sans', sans-serif", marginTop: 6, lineHeight: 1.5 }}>{sub}</p>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// WIZARD STEPS
// ═══════════════════════════════════════════════════════════════

function Step0_Fundamentals({ data, setData }) {
  return (
    <>
      <SectionTitle sub="The basics that shape every decision downstream. Get these right and the rest of the tool calibrates itself.">Business Fundamentals</SectionTitle>
      <FieldGroup>
        <Label sub="How you make money determines which capital paths even apply">Business Model</Label>
        <Select value={data.businessModel} onChange={(v) => setData({ ...data, businessModel: v })} options={BUSINESS_MODELS} placeholder="Select your business model" />
      </FieldGroup>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <FieldGroup>
          <Label sub="Annual recurring or trailing twelve-month revenue ($)">Current Revenue / ARR</Label>
          <Input value={data.revenue} onChange={(v) => setData({ ...data, revenue: v })} placeholder="e.g. 2500000" type="number" />
        </FieldGroup>
        <FieldGroup>
          <Label sub="Revenue minus COGS (%)">Gross Margin %</Label>
          <Input value={data.grossMargin} onChange={(v) => setData({ ...data, grossMargin: v })} placeholder="e.g. 72" type="number" min={-100} max={100} />
        </FieldGroup>
      </div>
      <FieldGroup>
        <Label sub="Where are you on the path to profitability?">Profitability Status</Label>
        <RadioGroup
          value={data.profitability}
          onChange={(v) => setData({ ...data, profitability: v })}
          options={[
            { value: "profitable", label: "Profitable" },
            { value: "breakeven", label: "Break-even" },
            { value: "burning_moderate", label: "Burning (controlled)" },
            { value: "burning_heavy", label: "Burning (heavy)" },
          ]}
        />
      </FieldGroup>
      <FieldGroup>
        <Label sub="Monthly net cash burn ($) — leave blank if profitable">Monthly Burn Rate</Label>
        <Input value={data.monthlyBurn} onChange={(v) => setData({ ...data, monthlyBurn: v })} placeholder="e.g. 150000" type="number" />
      </FieldGroup>
    </>
  );
}

function Step1_GrowthRunway({ data, setData }) {
  return (
    <>
      <SectionTitle sub="Runway tells you how urgent the decision is. Growth goals tell you how much capital you might need. The constraint tells you where the money actually goes.">Growth & Runway</SectionTitle>
      <FieldGroup>
        <Label sub="Months of cash at current burn rate">Cash Runway (months)</Label>
        <Input value={data.runwayMonths} onChange={(v) => setData({ ...data, runwayMonths: v })} placeholder="e.g. 14" type="number" min={0} max={120} />
      </FieldGroup>
      <FieldGroup>
        <Label sub="What 'winning' looks like in 24–36 months — be specific (revenue target, market position, product milestone)">Growth Objective</Label>
        <TextArea value={data.growthGoal} onChange={(v) => setData({ ...data, growthGoal: v })} placeholder="e.g. Reach $10M ARR, expand to 3 new markets, achieve 120% NRR" />
      </FieldGroup>
      <FieldGroup>
        <Label sub="The single biggest bottleneck to hitting that growth objective">Primary Constraint</Label>
        <Select value={data.primaryConstraint} onChange={(v) => setData({ ...data, primaryConstraint: v })} options={CONSTRAINTS} placeholder="What's the #1 bottleneck?" />
      </FieldGroup>
      <FieldGroup>
        <Label sub="If you raise capital, what specifically does the money do? Be concrete.">Use of Funds (top 2–3)</Label>
        <TextArea value={data.useOfFunds} onChange={(v) => setData({ ...data, useOfFunds: v })} placeholder="e.g. 1) Hire 5 AEs to expand mid-market ($600K/yr), 2) Invest in platform infra for enterprise readiness ($400K), 3) Working capital for net-60 enterprise terms ($300K)" />
      </FieldGroup>
      <FieldGroup>
        <Label sub="YoY revenue growth rate (%)">Revenue Growth Rate %</Label>
        <Input value={data.revenueGrowthRate} onChange={(v) => setData({ ...data, revenueGrowthRate: v })} placeholder="e.g. 85" type="number" />
      </FieldGroup>
    </>
  );
}

function Step2_CapitalGovernance({ data, setData }) {
  return (
    <>
      <SectionTitle sub="This is where 'can raise' meets 'should raise.' Dilution tolerance and governance preferences aren't just preferences — they're constraints that shape which capital paths are actually on the table.">Capital & Governance</SectionTitle>
      <FieldGroup>
        <Label sub="How much ownership are founders prepared to give up?">Dilution Tolerance</Label>
        <RadioGroup
          value={data.dilutionTolerance}
          onChange={(v) => setData({ ...data, dilutionTolerance: v })}
          options={[
            { value: "comfortable", label: "Comfortable (15–25%)" },
            { value: "moderate", label: "Moderate (10–15%)" },
            { value: "minimal", label: "Minimal (<10%)" },
            { value: "none", label: "No dilution" },
          ]}
        />
      </FieldGroup>
      <FieldGroup>
        <Label sub="How do founders feel about sharing strategic decision-making?">Control Preference</Label>
        <RadioGroup
          value={data.controlPreference}
          onChange={(v) => setData({ ...data, controlPreference: v })}
          options={[
            { value: "maintain_full", label: "Maintain full control" },
            { value: "share_strategic", label: "Share strategic decisions" },
            { value: "flexible", label: "Flexible / outcome-driven" },
          ]}
        />
      </FieldGroup>
      <FieldGroup>
        <Label sub="Current or target board composition">Board Composition</Label>
        <RadioGroup
          value={data.boardSeats}
          onChange={(v) => setData({ ...data, boardSeats: v })}
          options={[
            { value: "founder_only", label: "Founder(s) only" },
            { value: "founder_majority", label: "Founder majority" },
            { value: "balanced", label: "Balanced" },
            { value: "investor_majority", label: "Investor majority" },
          ]}
        />
      </FieldGroup>
      <FieldGroup>
        <Label sub="Most likely investor type you'd target">Likely Investor Profile</Label>
        <Select value={data.investorProfile} onChange={(v) => setData({ ...data, investorProfile: v })} options={INVESTOR_PROFILES} placeholder="Select investor type" />
      </FieldGroup>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <FieldGroup>
          <Label sub="Number of prior equity rounds">Prior Equity Raises</Label>
          <Input value={data.priorRaises} onChange={(v) => setData({ ...data, priorRaises: v })} placeholder="e.g. 1" type="number" min={0} />
        </FieldGroup>
        <FieldGroup>
          <Label sub="Any active term sheets or LOIs?">Term Sheets in Hand?</Label>
          <RadioGroup
            value={data.hasTermSheets}
            onChange={(v) => setData({ ...data, hasTermSheets: v })}
            options={[
              { value: true, label: "Yes" },
              { value: false, label: "No" },
            ]}
          />
        </FieldGroup>
      </div>
    </>
  );
}

function Step3_EconomicsRisk({ data, setData }) {
  return (
    <>
      <SectionTitle sub="This is the CFO's section. Unit economics determine whether capital can actually produce returns. Risk profile determines what breaks when things go sideways — and they always go sideways.">Economics & Risk</SectionTitle>
      <FieldGroup>
        <Label sub="How proven are your unit economics?">Unit Economics Status</Label>
        <RadioGroup
          value={data.unitEconomics}
          onChange={(v) => setData({ ...data, unitEconomics: v })}
          options={[
            { value: "strong", label: "Strong & proven" },
            { value: "emerging", label: "Emerging / directional" },
            { value: "unproven", label: "Unproven / pre-scale" },
          ]}
        />
      </FieldGroup>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <FieldGroup>
          <Label sub="Months to recover customer acquisition cost">CAC Payback (months)</Label>
          <Input value={data.cacPayback} onChange={(v) => setData({ ...data, cacPayback: v })} placeholder="e.g. 14" type="number" />
        </FieldGroup>
        <FieldGroup>
          <Label sub="% of revenue from your largest single customer">Top Customer Concentration %</Label>
          <Input value={data.customerConcentration} onChange={(v) => setData({ ...data, customerConcentration: v })} placeholder="e.g. 15" type="number" min={0} max={100} />
        </FieldGroup>
      </div>
      <FieldGroup>
        <Label sub="Any existing debt, credit lines, or structured capital?">Existing Debt</Label>
        <RadioGroup
          value={data.existingDebt}
          onChange={(v) => setData({ ...data, existingDebt: v })}
          options={[
            { value: "none", label: "None" },
            { value: "light", label: "Light (small LOC / term loan)" },
            { value: "moderate", label: "Moderate (venture debt / RBF)" },
            { value: "heavy", label: "Heavy (significant obligations)" },
          ]}
        />
      </FieldGroup>
      <FieldGroup>
        <Label sub="Founder + board appetite for risk">Risk Tolerance</Label>
        <RadioGroup
          value={data.riskTolerance}
          onChange={(v) => setData({ ...data, riskTolerance: v })}
          options={[
            { value: "high", label: "High (swing for the fences)" },
            { value: "moderate", label: "Moderate (calculated bets)" },
            { value: "low", label: "Low (protect downside first)" },
          ]}
        />
      </FieldGroup>
      <FieldGroup>
        <Label sub="If revenue drops 30% for 6 months, what breaks first? This is your CFO's nightmare scenario — name it.">Downside Scenario: What Breaks First?</Label>
        <TextArea value={data.downsideBreak} onChange={(v) => setData({ ...data, downsideBreak: v })} placeholder="e.g. Runway drops below 4 months, covenant breach on venture debt minimum revenue floor, can't make payroll by Q3" />
      </FieldGroup>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// RESULTS VIEW
// ═══════════════════════════════════════════════════════════════

function ResultsView({ data, scores, onReset, aiNarrative, onGenerateAI, aiLoading }) {
  const decision = getDecision(scores.band);
  const bandColor = scores.band === "green" ? palette.green : scores.band === "yellow" ? palette.yellow : palette.red;
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [expandedAlt, setExpandedAlt] = useState(null);

  return (
    <div>
      {/* HEADER */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: palette.textMuted, fontFamily: "'DM Sans', sans-serif", marginBottom: 12 }}>Capital Decision Tool — Final Assessment</div>
        <h1 style={{ fontSize: 36, fontWeight: 700, color: palette.text, fontFamily: "'Playfair Display', serif", margin: 0, lineHeight: 1.2 }}>
          {decision.action}
        </h1>
        <p style={{ fontSize: 15, color: palette.textMuted, fontFamily: "'DM Sans', sans-serif", marginTop: 10, maxWidth: 560, margin: "10px auto 0" }}>{decision.description}</p>
      </div>

      {/* COMPOSITE SCORE */}
      <Card style={{ marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
        <ScoreBadge score={scores.composite} />
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ fontSize: 13, color: palette.textMuted, fontFamily: "'DM Sans', sans-serif", marginBottom: 4 }}>
            Band: <span style={{ color: bandColor, fontWeight: 700 }}>{SCORE_BANDS[scores.band].label}</span>
          </div>
          <div style={{ fontSize: 12, color: palette.textDim, fontFamily: "'DM Sans', sans-serif" }}>
            Score factors: Runway ({SCORING_WEIGHTS.runway * 100}%) · Economics ({SCORING_WEIGHTS.economics * 100}%) · Growth Readiness ({SCORING_WEIGHTS.growthReadiness * 100}%) · Capital Fit ({SCORING_WEIGHTS.capitalFit * 100}%) · Governance ({SCORING_WEIGHTS.governance * 100}%) · Risk ({SCORING_WEIGHTS.riskProfile * 100}%)
          </div>
        </div>
      </Card>

      {/* DIMENSION SCORES */}
      <Card style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, color: palette.text, fontFamily: "'DM Sans', sans-serif", marginBottom: 16, letterSpacing: 0.5, textTransform: "uppercase", fontSize: 11 }}>Scoring Dimensions</div>
        <DimensionBar label="Runway & Liquidity" score={scores.dimensions.runway} weight={SCORING_WEIGHTS.runway} />
        <DimensionBar label="Unit Economics" score={scores.dimensions.economics} weight={SCORING_WEIGHTS.economics} />
        <DimensionBar label="Growth Readiness" score={scores.dimensions.growthReadiness} weight={SCORING_WEIGHTS.growthReadiness} />
        <DimensionBar label="Capital Fit & Market" score={scores.dimensions.capitalFit} weight={SCORING_WEIGHTS.capitalFit} />
        <DimensionBar label="Governance & Control" score={scores.dimensions.governance} weight={SCORING_WEIGHTS.governance} />
        <DimensionBar label="Risk Profile" score={scores.dimensions.riskProfile} weight={SCORING_WEIGHTS.riskProfile} />
      </Card>

      {/* RED FLAGS */}
      {scores.redFlags.length > 0 && (
        <Card style={{ marginBottom: 20, borderColor: `${palette.red}44`, background: palette.redDim }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: palette.red, fontFamily: "'DM Sans', sans-serif", marginBottom: 12, letterSpacing: 1.5, textTransform: "uppercase" }}>⚠ Red Flags Detected</div>
          {scores.redFlags.map((rf) => (
            <div key={rf.id} style={{ fontSize: 13, color: palette.text, fontFamily: "'DM Sans', sans-serif", marginBottom: 8, paddingLeft: 16, borderLeft: `2px solid ${palette.red}66` }}>
              {rf.label}
            </div>
          ))}
          <div style={{ fontSize: 12, color: palette.textMuted, fontFamily: "'DM Sans', sans-serif", marginTop: 12 }}>
            Red flags can override score bands. {scores.redFlags.length >= 2 ? "2+ red flags forces a RED band regardless of composite score." : "1 red flag downgrades GREEN → YELLOW."}
          </div>
        </Card>
      )}

      {/* DECISION GATES */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: palette.textMuted, fontFamily: "'DM Sans', sans-serif", marginBottom: 16, letterSpacing: 1.5, textTransform: "uppercase" }}>Decision Gates</div>
        {[
          { gate: "Need vs. Want", q: "Is capital required to survive or only to accelerate?", answer: data.runwayMonths < 9 ? "Need — runway pressure is real" : "Want — growth acceleration, not survival" },
          { gate: "Can vs. Should", q: "Can you raise on reasonable terms? Should you?", answer: scores.composite >= 66 ? "Can and should — conditions are favorable" : scores.composite >= 41 ? "Can, but should address issues first" : "Should not raise equity in current state" },
          { gate: "ROI Mechanism", q: "Is there a clear path from capital → value creation?", answer: data.useOfFunds ? "Defined — use of funds articulated" : "Missing — no clear ROI mechanism defined" },
          { gate: "Timing", q: "Is now the right window?", answer: data.runwayMonths < 6 ? "Urgent — limited negotiating leverage" : data.hasTermSheets ? "Active — term sheets in hand" : "Flexible — runway allows timing optimization" },
        ].map((g) => (
          <div key={g.gate} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${palette.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: palette.text, fontFamily: "'DM Sans', sans-serif" }}>{g.gate}</span>
            </div>
            <div style={{ fontSize: 12, color: palette.textDim, fontFamily: "'DM Sans', sans-serif", marginBottom: 4 }}>{g.q}</div>
            <div style={{ fontSize: 13, color: palette.accent, fontFamily: "'DM Sans', sans-serif" }}>{g.answer}</div>
          </div>
        ))}
      </Card>

      {/* ALTERNATIVES TRADEOFF MATRIX */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: palette.textMuted, fontFamily: "'DM Sans', sans-serif", letterSpacing: 1.5, textTransform: "uppercase" }}>Alternatives to Equity — Tradeoff Matrix</div>
          <button onClick={() => setShowAlternatives(!showAlternatives)} style={{ background: "none", border: `1px solid ${palette.border}`, color: palette.accent, fontSize: 12, fontFamily: "'DM Sans', sans-serif", padding: "4px 12px", borderRadius: 6, cursor: "pointer" }}>
            {showAlternatives ? "Collapse" : "Expand All"}
          </button>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>
            <thead>
              <tr>
                {["Option", "Category", "Speed", "Cost of Capital", "Covenants", "Dilution"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 10px", borderBottom: `1px solid ${palette.border}`, color: palette.textMuted, fontWeight: 600, fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALTERNATIVES.map((alt) => (
                <>
                  <tr key={alt.name} onClick={() => setExpandedAlt(expandedAlt === alt.name ? null : alt.name)} style={{ cursor: "pointer", transition: "background 0.15s" }} onMouseEnter={(e) => e.currentTarget.style.background = palette.surfaceHover} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "10px", borderBottom: `1px solid ${palette.border}22`, color: palette.accent, fontWeight: 500 }}>{alt.name}</td>
                    <td style={{ padding: "10px", borderBottom: `1px solid ${palette.border}22`, color: palette.textMuted }}>{alt.category}</td>
                    <td style={{ padding: "10px", borderBottom: `1px solid ${palette.border}22`, color: palette.textMuted }}>{alt.speed}</td>
                    <td style={{ padding: "10px", borderBottom: `1px solid ${palette.border}22`, color: palette.text }}>{alt.costOfCapital}</td>
                    <td style={{ padding: "10px", borderBottom: `1px solid ${palette.border}22`, color: palette.textMuted, maxWidth: 200 }}>{alt.covenants}</td>
                    <td style={{ padding: "10px", borderBottom: `1px solid ${palette.border}22`, color: palette.textMuted }}>{alt.dilution}</td>
                  </tr>
                  {(showAlternatives || expandedAlt === alt.name) && (
                    <tr key={alt.name + "_detail"}>
                      <td colSpan={6} style={{ padding: "12px 10px 16px", borderBottom: `1px solid ${palette.border}44`, background: palette.bg }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          <div>
                            <span style={{ fontSize: 10, fontWeight: 700, color: palette.green, letterSpacing: 1, textTransform: "uppercase" }}>Best Fit</span>
                            <p style={{ margin: "4px 0 0", color: palette.textMuted, lineHeight: 1.4 }}>{alt.bestFit}</p>
                          </div>
                          <div>
                            <span style={{ fontSize: 10, fontWeight: 700, color: palette.red, letterSpacing: 1, textTransform: "uppercase" }}>When It's a Trap</span>
                            <p style={{ margin: "4px 0 0", color: palette.textMuted, lineHeight: 1.4 }}>{alt.trap}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* GOVERNANCE + OPERATING BURDEN */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: palette.textMuted, fontFamily: "'DM Sans', sans-serif", marginBottom: 16, letterSpacing: 1.5, textTransform: "uppercase" }}>Governance & Operating Burden by Capital Type</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {[
            { type: "Equity (VC/PE)", board: "Board seat(s), veto rights, prefs", reporting: "Quarterly board deck, financials, KPIs", pressure: "High — growth expectations, timeline pressure, exit alignment", hidden: "Fundraising takes 3–6 months; investor management is ongoing" },
            { type: "Venture Debt", board: "Observer rights (sometimes), covenants", reporting: "Monthly financials, covenant compliance", pressure: "Medium — financial covenants, refinancing risk", hidden: "Covenant breach triggers can accelerate repayment at worst time" },
            { type: "RBF / Non-dilutive", board: "None typically", reporting: "Revenue reporting (automated)", pressure: "Low-Medium — payment obligations reduce operating cash", hidden: "Revenue dips extend payback; can't 'turn off' the obligation" },
          ].map((g) => (
            <div key={g.type} style={{ background: palette.bg, borderRadius: 8, padding: 16, border: `1px solid ${palette.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: palette.accent, fontFamily: "'DM Sans', sans-serif", marginBottom: 10 }}>{g.type}</div>
              {[
                { label: "Board Rights", value: g.board },
                { label: "Reporting", value: g.reporting },
                { label: "Operating Pressure", value: g.pressure },
                { label: "Hidden Cost", value: g.hidden },
              ].map((item) => (
                <div key={item.label} style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: palette.textDim, letterSpacing: 0.8, textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif" }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: palette.textMuted, fontFamily: "'DM Sans', sans-serif", marginTop: 2, lineHeight: 1.4 }}>{item.value}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Card>

      {/* NEXT 30 DAYS */}
      <Card style={{ marginBottom: 20, borderColor: `${palette.accent}33` }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: palette.accent, fontFamily: "'DM Sans', sans-serif", marginBottom: 16, letterSpacing: 1.5, textTransform: "uppercase" }}>Next 30 Days — Action Plan</div>
        {scores.band === "green" ? (
          <>
            {["Finalize investor target list and outreach strategy — Owner: CEO", "Prepare data room (financials, cohort data, cap table, projections) — Owner: CFO/Finance", "Draft board memo with capital decision recommendation — Owner: CEO + CFO", "Set fundraising timeline and process milestones — Owner: CEO", "Align board on terms framework (valuation floor, dilution ceiling, governance) — Owner: CEO + Board"].map((a, i) => (
              <div key={i} style={{ fontSize: 13, color: palette.text, fontFamily: "'DM Sans', sans-serif", marginBottom: 8, paddingLeft: 16, borderLeft: `2px solid ${palette.accent}66` }}>{a}</div>
            ))}
          </>
        ) : scores.band === "yellow" ? (
          <>
            {["Identify and prioritize gating issues from this assessment — Owner: CEO", "Build 90-day plan to address top 2 gating issues — Owner: CEO + functional leads", "Model runway scenarios (base/downside/ugly) with current trajectory — Owner: CFO", "Explore non-dilutive alternatives from the tradeoff matrix — Owner: CFO", "Re-run this assessment in 60–90 days — Owner: CEO"].map((a, i) => (
              <div key={i} style={{ fontSize: 13, color: palette.text, fontFamily: "'DM Sans', sans-serif", marginBottom: 8, paddingLeft: 16, borderLeft: `2px solid ${palette.yellow}66` }}>{a}</div>
            ))}
          </>
        ) : (
          <>
            {["Diagnose root cause(s) for red flags identified above — Owner: CEO + CFO", "Build a survival plan: extend runway to 12+ months without equity — Owner: CFO", "Evaluate top 3 non-dilutive alternatives from the tradeoff matrix — Owner: CFO", "Identify what must be true to revisit equity raise in 6+ months — Owner: CEO", "Present alternatives plan to board within 2 weeks — Owner: CEO"].map((a, i) => (
              <div key={i} style={{ fontSize: 13, color: palette.text, fontFamily: "'DM Sans', sans-serif", marginBottom: 8, paddingLeft: 16, borderLeft: `2px solid ${palette.red}66` }}>{a}</div>
            ))}
          </>
        )}
      </Card>

      {/* AI NARRATIVE */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: palette.textMuted, fontFamily: "'DM Sans', sans-serif", letterSpacing: 1.5, textTransform: "uppercase" }}>AI-Generated Board Narrative</div>
            <div style={{ fontSize: 12, color: palette.textDim, fontFamily: "'DM Sans', sans-serif", marginTop: 4 }}>Uses Claude to generate a consultant-grade narrative analysis from your inputs</div>
          </div>
          <Button onClick={onGenerateAI} disabled={aiLoading} variant={aiNarrative ? "secondary" : "primary"} style={{ fontSize: 12, padding: "8px 18px" }}>
            {aiLoading ? "Generating..." : aiNarrative ? "Regenerate" : "Generate Narrative"}
          </Button>
        </div>
        {aiLoading && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 20 }}>
            <div style={{ width: 16, height: 16, border: `2px solid ${palette.accent}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <span style={{ fontSize: 13, color: palette.textMuted, fontFamily: "'DM Sans', sans-serif" }}>Generating board-ready narrative analysis...</span>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}
        {aiNarrative && !aiLoading && (
          <div style={{ fontSize: 13, color: palette.text, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.7, whiteSpace: "pre-wrap", background: palette.bg, borderRadius: 8, padding: 20, border: `1px solid ${palette.border}` }}>
            {aiNarrative}
          </div>
        )}
      </Card>

      {/* DOWNSIDE SCENARIOS */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: palette.textMuted, fontFamily: "'DM Sans', sans-serif", marginBottom: 16, letterSpacing: 1.5, textTransform: "uppercase" }}>Base / Downside / Ugly — What Breaks First</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {[
            { label: "Base", color: palette.green, desc: "Plan works. Growth on track. Runway sufficient.", metric: data.runwayMonths ? `Runway holds at ${data.runwayMonths}+ months` : "[Need: runway data]" },
            { label: "Downside", color: palette.yellow, desc: "Revenue misses by 20–30%. Growth slows.", metric: data.runwayMonths ? `Runway drops to ~${Math.max(2, Math.round(data.runwayMonths * 0.6))} months` : "[Need: runway data]" },
            { label: "Ugly", color: palette.red, desc: "Revenue drops 40%+. Multiple misses.", metric: data.downsideBreak || "[Need: downside scenario input]" },
          ].map((s) => (
            <div key={s.label} style={{ background: palette.bg, borderRadius: 8, padding: 16, border: `1px solid ${s.color}33` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: s.color, letterSpacing: 1, textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif", marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontSize: 12, color: palette.textMuted, fontFamily: "'DM Sans', sans-serif", marginBottom: 8, lineHeight: 1.4 }}>{s.desc}</div>
              <div style={{ fontSize: 12, color: palette.text, fontFamily: "'DM Sans', sans-serif", fontWeight: 500, padding: "6px 10px", background: `${s.color}11`, borderRadius: 6, borderLeft: `2px solid ${s.color}66` }}>{s.metric}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* ACTIONS */}
      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 32 }}>
        <Button onClick={onReset} variant="secondary">Start Over</Button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════

const STEPS = [
  { title: "Business Fundamentals", component: Step0_Fundamentals },
  { title: "Growth & Runway", component: Step1_GrowthRunway },
  { title: "Capital & Governance", component: Step2_CapitalGovernance },
  { title: "Economics & Risk", component: Step3_EconomicsRisk },
];

export default function CapitalDecisionTool() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [aiNarrative, setAiNarrative] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const scores = useMemo(() => computeAllScores(data), [data]);

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else setShowResults(true);
  };

  const handleBack = () => {
    if (showResults) setShowResults(false);
    else if (step > 0) setStep(step - 1);
  };

  const handleReset = () => {
    setStep(0);
    setData({});
    setShowResults(false);
    setAiNarrative(null);
  };

  const generateAINarrative = async () => {
    setAiLoading(true);
    try {
      const decision = getDecision(scores.band);
      const contextBlock = `CONTEXT:
- Business model: ${data.businessModel || "Unknown"}
- Current revenue/ARR: $${data.revenue ? Number(data.revenue).toLocaleString() : "Unknown"}
- Gross margin: ${data.grossMargin ? data.grossMargin + "%" : "Unknown"}
- Profitability/burn: ${data.profitability || "Unknown"}${data.monthlyBurn ? ` ($${Number(data.monthlyBurn).toLocaleString()}/mo burn)` : ""}
- Cash runway: ${data.runwayMonths ? data.runwayMonths + " months" : "Unknown"}
- Growth goal (24–36 months): ${data.growthGoal || "Not defined"}
- Primary constraint: ${data.primaryConstraint || "Not identified"}
- Use of funds: ${data.useOfFunds || "Not defined"}
- Dilution tolerance: ${data.dilutionTolerance || "Unknown"}
- Governance/control preferences: ${data.controlPreference || "Unknown"}
- Risk tolerance: ${data.riskTolerance || "Unknown"}
- Investor profile: ${data.investorProfile || "Unknown"}
- Existing debt: ${data.existingDebt || "None"}
- Unit economics: ${data.unitEconomics || "Unknown"}
- CAC payback: ${data.cacPayback ? data.cacPayback + " months" : "Unknown"}
- Customer concentration: ${data.customerConcentration ? data.customerConcentration + "%" : "Unknown"}
- Revenue growth rate: ${data.revenueGrowthRate ? data.revenueGrowthRate + "% YoY" : "Unknown"}
- Prior raises: ${data.priorRaises || 0}
- Term sheets in hand: ${data.hasTermSheets ? "Yes" : "No"}

SCORING RESULTS:
- Composite score: ${scores.composite}/100 (${scores.band.toUpperCase()} band)
- Runway: ${scores.dimensions.runway}/100
- Economics: ${scores.dimensions.economics}/100
- Growth readiness: ${scores.dimensions.growthReadiness}/100
- Capital fit: ${scores.dimensions.capitalFit}/100
- Governance: ${scores.dimensions.governance}/100
- Risk profile: ${scores.dimensions.riskProfile}/100
- Red flags: ${scores.redFlags.length > 0 ? scores.redFlags.map(rf => rf.label).join("; ") : "None"}
- Decision: ${decision.action}`;

      // Uses /api/generate endpoint — see api/generate.js for the serverless function
      // In development, you can also hit Anthropic directly if you set VITE_ANTHROPIC_API_KEY
      const apiUrl = import.meta.env.VITE_API_URL || "/api/generate";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: contextBlock,
          model: "claude-sonnet-4-20250514",
        }),
      });

      const result = await response.json();
      const text = result.narrative || result.content?.map((c) => c.text || "").join("\n") || "Unable to generate narrative. Please try again.";
      setAiNarrative(text);
    } catch (err) {
      setAiNarrative("Error generating narrative: " + err.message + ". This feature requires the Claude API to be accessible.");
    } finally {
      setAiLoading(false);
    }
  };

  const StepComponent = STEPS[step]?.component;

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{
        minHeight: "100vh",
        background: palette.bg,
        color: palette.text,
        fontFamily: "'DM Sans', sans-serif",
        padding: "0 16px",
      }}>
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "40px 0 80px" }}>

          {/* APP HEADER */}
          {!showResults && (
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: palette.accent }} />
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: palette.textMuted }}>Capital Decision Tool</span>
              </div>
              <h1 style={{ fontSize: 32, fontWeight: 700, color: palette.text, fontFamily: "'Playfair Display', serif", margin: 0, lineHeight: 1.2 }}>
                Should You Raise Outside Equity?
              </h1>
              <p style={{ fontSize: 14, color: palette.textMuted, marginTop: 8, lineHeight: 1.5 }}>
                A structured decision framework for founders and boards. Scores your readiness, evaluates alternatives, and produces a board-ready recommendation.
              </p>
            </div>
          )}

          {/* STEP NAV */}
          {!showResults && (
            <div style={{ display: "flex", gap: 4, marginBottom: 28 }}>
              {STEPS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  style={{
                    flex: 1,
                    padding: "10px 8px",
                    background: i === step ? palette.surface : "transparent",
                    border: `1px solid ${i === step ? palette.border : "transparent"}`,
                    borderRadius: 8,
                    color: i === step ? palette.text : i < step ? palette.accent : palette.textDim,
                    fontSize: 12,
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: i === step ? 600 : 400,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    textAlign: "center",
                  }}
                >
                  {s.title}
                </button>
              ))}
            </div>
          )}

          {showResults ? (
            <ResultsView
              data={data}
              scores={scores}
              onReset={handleReset}
              aiNarrative={aiNarrative}
              onGenerateAI={generateAINarrative}
              aiLoading={aiLoading}
            />
          ) : (
            <>
              <ProgressBar step={step} total={STEPS.length} />
              <Card>
                <StepComponent data={data} setData={setData} />
              </Card>

              {/* LIVE SCORE PREVIEW */}
              <div style={{ marginTop: 20, padding: "12px 16px", background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <ScoreBadge score={scores.composite} size="small" />
                  <span style={{ fontSize: 12, color: palette.textDim, fontFamily: "'DM Sans', sans-serif" }}>Live score — updates as you fill in data</span>
                </div>
                {scores.redFlags.length > 0 && (
                  <span style={{ fontSize: 11, color: palette.red, fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
                    {scores.redFlags.length} red flag{scores.redFlags.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {/* NAV BUTTONS */}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
                <Button onClick={handleBack} variant="secondary" disabled={step === 0}>Back</Button>
                <Button onClick={handleNext}>
                  {step === STEPS.length - 1 ? "Generate Assessment" : "Continue"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
