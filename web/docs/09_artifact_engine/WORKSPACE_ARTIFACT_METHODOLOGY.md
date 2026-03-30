

# WORKSPACE ARTIFACT METHODOLOGY

## Purpose
Provide a practical, repeatable method for applying the Artifact Engine Blueprint to any workspace (email, crypto, tax, marketing, ops, etc.).

This document answers:
- What a new workspace must define
- What the Artifact Engine provides automatically
- How to map raw data → semantic meaning → artifacts
- How to avoid dominant-bucket collapse and fake precision

---

## What Every Workspace Must Define (Inputs)

Each workspace must supply a **semantic resolver** tailored to its domain. The resolver maps raw records into the universal artifact structure.

### 1) Entity Definition
Define the core entity to classify (e.g., sender, transaction, ticket, lead).

Examples:
- Email: sender
- Crypto: asset / position / signal
- Tax: document / filing / notice
- Marketing: campaign / lead / contact

### 2) Semantic Families (Top-Level Meaning)
Define a small, durable set (≈4–8) of **families** that answer: “What kind of thing is this?”

Rules:
- Conceptual (portable across tools)
- Mutually exclusive at top level
- Not tool-specific (avoid Gmail/CRM-specific labels)

Examples:
- Email: marketing_promotional, commerce_transactional, account_notification, security_alert, social_community, human_personal
- Crypto: market_signal, position_management, risk_alert, treasury_operation, execution_event, compliance_event
- Tax: filing_requirement, notice_action, bookkeeping_event, payroll_event, client_request, audit_risk

### 3) Pattern Classes (Behavioral Cycles)
Define a small set of **pattern classes** that answer: “What kind of behavior or cycle is this?”

Rules:
- Stable across domains (cycle-oriented)
- Independent from family (can cross families when appropriate)

Examples:
- promotional_cycle
- transactional_cycle
- service_update_cycle
- security_cycle
- social_activity_cycle
- human_correspondence_cycle

### 4) Subtypes (Decomposition Layer)
Define **optional subtypes** under families for when a family becomes too broad.

Rules:
- Portable keys (snake_case identifiers)
- Labels are display-only (can change per UI)
- Do not create subtypes until evidence exists

Examples (email marketing):
- editorial_newsletter
- offer_campaign
- product_marketing_update

Examples (crypto signals):
- price_breakout
- volatility_spike
- liquidity_event

### 5) Evidence Sources
Define what signals the resolver can use (ranked by reliability):

Primary (durable):
- historical distributions
- structured fields
- long-term behavior

Secondary (corroborating):
- text/subject parsing
- tags/labels
- heuristics

Never primary:
- UI context
- group membership
- user actions in the current session

---

## What the Artifact Engine Provides (Automatic)

Once the workspace provides the semantic resolver, the engine handles:

### 1) Resolution Layer
- resolution: clear | mixed | thin_history
- confidence: high | medium | low
- provenance: where evidence came from

### 2) Rollups (Group-Level)
- family_distribution
- pattern_distribution
- subtype coverage
- trust distributions (resolution/confidence/provenance)
- umbrella share

### 3) Decomposition Logic
- Detect dominant buckets (e.g., ≥60%)
- Decide:
  - suppressed
  - provisional
  - survives
- Preserve subtype truth when strong

### 4) Persistence
- Build canonical `semantic_rollup`
- Persist identically across all artifact surfaces
- Enforce congruence (hash + schema version)

### 5) Presentation Contract
- Meaning first
- Decomposition second (if valid)
- Trust third
- Respect group policy mode

---

## Standard Workflow (Step-by-Step)

### Step 1 — Map Raw Data to Entity
- Identify the unit of analysis
- Ensure stable identifiers and timestamps

### Step 2 — Assign Semantic Family
- Use strongest available evidence
- Never emit null
- If weak → set low confidence, not fake category

### Step 3 — Assign Pattern Class
- Determine behavioral cycle
- Keep independent from family where possible

### Step 4 — Attempt Subtype Resolution
- Only if:
  - sufficient data (e.g., ≥8 records)
  - meaningful evidence exists
- Otherwise leave subtype null

### Step 5 — Attach Resolution + Trust
- resolution
- confidence
- provenance

### Step 6 — Build Group Rollups
- aggregate from entity-level truth
- compute distributions + trust

### Step 7 — Apply Decomposition Rules
- evaluate dominant buckets
- mark subtype persistence state
- compute subtype coverage

### Step 8 — Persist Canonical Rollup
- write identical `semantic_rollup` to all artifact locations
- include schema version + hash

### Step 9 — Present (Read-Only)
- UI reads persisted truth
- no recompute unless compatibility fallback

---

## Dominant Bucket Handling (Critical)

When a family dominates a group:

1. Check subtype evidence
2. If strong → allow subtype survival
3. If weak → keep umbrella, mark provisional

Never:
- Force decomposition
- Hide strong subtype truth
- Present umbrella as final when decomposition is valid

---

## Structural vs Semantic Groups

Each workspace may define groups with different intent:

- structural_only
  - routing/coverage buckets
  - semantics descriptive only

- structural_backlog
  - time/attention state (e.g., dormant)
  - semantics support context

- semantic_first
  - meaningful clustering
  - semantics can headline

The engine enforces presentation behavior based on this mode.

---

## Portability Guidelines

To ensure cross-workspace reuse:

- Families must be conceptual, not tool-specific
- Pattern classes must be behavior-based, not feature-based
- Subtype keys must be portable identifiers
- Labels must be decoupled from logic
- Avoid domain-specific hacks in the core engine

---

## Anti-Patterns (Do NOT Do)

- Do not create “unknown” as a primary category
- Do not use UI context as classification input
- Do not flatten subtype truth into umbrella categories
- Do not rebuild repeatedly to explore behavior
- Do not let group assignment override semantic truth

---

## Example Mapping (Email vs Crypto)

| Layer | Email | Crypto |
|------|------|--------|
| Entity | Sender | Asset / Signal |
| Family | marketing_promotional | market_signal |
| Pattern | promotional_cycle | transactional_cycle |
| Subtype | editorial_newsletter | price_breakout |
| Resolution | mixed | clear |
| Confidence | medium | high |

Same structure. Different domain.

---

## What This Methodology Enables

- Consistent artifact behavior across all workspaces
- Honest representation of uncertainty
- Automatic handling of dominant buckets
- Shared rollup logic across products
- Scalable system design

---

## Summary

This methodology ensures that any workspace can:
- define its own meaning
- plug into a universal artifact engine
- produce consistent, trustworthy, decomposable intelligence

The Artifact Engine provides the structure.
Each workspace provides the domain-specific meaning.

---

# END OF METHODOLOGY