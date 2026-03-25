

# ARTIFACT ENGINE BLUEPRINT

## Purpose
Define a universal, workspace-agnostic system for transforming raw data into trustworthy, human-readable intelligence (“artifacts”) that can be reused across any Automata workspace (email, crypto, tax, ops, etc.).

This blueprint establishes the **rules of the engine**, not a Gmail-specific implementation.

---

## Core Principles

1. **Truth First, UI Second**
   - Artifacts must represent persisted, auditable truth.
   - UI must read from artifacts; it must not invent or repair truth.

2. **Meaning ≠ Uncertainty**
   - Always separate *what something is* (meaning) from *how sure we are* (uncertainty).
   - Never encode uncertainty as a fake category (e.g., “unknown” as primary meaning).

3. **No Null Meaning**
   - Every entity must have a best-effort semantic assignment.
   - If evidence is weak, reflect that in **resolution/confidence**, not by removing meaning.

4. **Decompose, Don’t Collapse**
   - If a category dominates (e.g., 90%+), treat it as an umbrella and evaluate decomposition.
   - Preserve subtype evidence when it is strong enough; do not flatten it away.

5. **Single Source of Truth**
   - Compute once → persist → read everywhere.
   - Cleanup groups and detail views must share the same persisted semantic rollup.

6. **Structural vs Semantic Separation**
   - Structural groupings (routing/coverage) must not be confused with semantic meaning.
   - Presentation must respect this distinction.

7. **Rebuilds Are Publication Events**
   - Rebuild only after model/taxonomy/rollups are locked.
   - Never rebuild to “see what happens.”

---

## Engine Layers

### 1) Source Truth Layer
- Raw records (messages, transactions, tickets, etc.)
- Stable identifiers and timestamps
- No semantic interpretation yet

### 2) Semantic Layer (Entity-Level)
- Assign each entity a **semantic family** and **pattern class**
- Add **subtype (optional)** for decomposition

Example (email):
- Family: `marketing_promotional`
- Pattern: `promotional_cycle`
- Subtype: `editorial_newsletter` (optional)

### 3) Resolution Layer
- How strong is the semantic read?
- Fields:
  - `resolution`: `clear | mixed | thin_history`
  - `confidence`: `high | medium | low`
  - `provenance`: where the evidence came from

### 4) Rollup Layer (Group-Level)
- Aggregate entity-level semantics into group distributions
- Compute:
  - family distribution
  - pattern distribution
  - subtype coverage
  - trust distributions (resolution/confidence/provenance)
  - umbrella share

### 5) Decomposition Layer
- Evaluate dominant buckets for subtype survival
- Persist per-lane state:
  - `suppressed`
  - `provisional`
  - `survives`
- Persist subtype coverage and top subtypes

### 6) Persistence Layer
- Persist a canonical `semantic_rollup` per group
- Store identically across all artifact surfaces
- Include:
  - schema version
  - hash
  - distributions
  - headline fields
  - subtype state
  - trust summaries

### 7) Presentation Layer
- Read only from persisted artifacts
- Respect group policy mode:
  - `structural_only`
  - `structural_backlog`
  - `semantic_first`
- Show meaning, then decomposition (if valid), then trust

---

## Canonical Data Contracts

### Entity (Sender/Record)
- `semantic_family`
- `semantic_pattern`
- `subtype_key` (optional)
- `resolution`
- `confidence`
- `provenance`
- `umbrella` (boolean)

### Group (Artifact Rollup)
- `group_policy_mode`
- `sender_basis` (counts)
- `headline` (dominant family/pattern)
- `family_distribution[]`
- `pattern_distribution[]`
- `subtype_persistence_state`
- `trust` (resolution/confidence/provenance distributions)
- `completeness` flags

---

## Group Policy Modes

- `structural_only`
  - Group exists for routing/coverage
  - Semantics are descriptive only

- `structural_backlog`
  - Group exists due to time/attention state
  - Semantics support but do not drive action

- `semantic_first`
  - Group represents meaningful semantic clustering
  - Semantic family can headline

---

## Anti-Dominant Bucket Rules

When a family or pattern exceeds threshold (e.g., ≥60%):
- Check subtype evidence
- If strong → allow subtype survival
- If weak → mark as `provisional` and keep umbrella

Never:
- Hide subtype evidence when strong
- Force subtype when evidence is weak

---

## Trust Model

Always expose:
- Resolution distribution (clear/mixed/thin)
- Confidence distribution (high/medium/low)
- Provenance distribution (source of evidence)
- Umbrella share

Trust must:
- Inform decisions
- Not replace meaning
- Not be presented as a separate competing dashboard

---

## Portability Rules (Critical)

This system must work across any workspace.

Therefore:
- Families and patterns are **conceptual, not tool-specific**
- Subtypes are **portable identifiers**, not Gmail labels
- Domain-specific logic lives in the **semantic resolver**, not the engine

Example:
- Email: `marketing_promotional`
- Crypto: `market_signal`
- Tax: `filing_requirement`

Same structure, different domain mapping.

---

## What This Blueprint Guarantees

If followed correctly, any workspace will have:
- Complete coverage (no unassigned entities)
- Non-null semantic meaning
- Honest uncertainty
- Decomposable dominant buckets
- Shared truth across all artifact surfaces
- UI that reflects data, not guesses

---

## What This Blueprint Does NOT Do

- It does not define domain-specific categories
- It does not define UI layouts
- It does not auto-infer correct taxonomy for every dataset

Those must be provided by each workspace’s semantic resolver.

---

## Summary

This blueprint defines a **universal artifact intelligence engine**:

- consistent
- auditable
- decomposable
- portable

Gmail is the first implementation.
Future workspaces must follow the same pattern to achieve reliable, scalable artifact intelligence.

---

# END OF BLUEPRINT