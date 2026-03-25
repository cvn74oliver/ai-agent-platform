

# ARTIFACT ENGINE TODO

## Purpose
Track all remaining work required to complete the Artifact Engine so it becomes stable, reusable, and portable across all Automata workspaces.

This document prevents loss of context and ensures no critical artifact work is forgotten.

---

## Current Status (March 2026)

### Completed
- 100% sender coverage achieved (no unassigned entities)
- Cleanup-group model established (8 groups)
- Semantic model implemented (family + pattern + resolution + confidence + provenance)
- Semantic rollups implemented and persisted
- Shared `semantic_rollup` contract established across artifact surfaces
- Runtime now reads from persisted artifacts instead of recomputing
- UI presentation honesty pass completed (basic framing fixed)
- Artifact Engine Blueprint created
- Workspace Artifact Methodology created

---

## In Progress

### 1. Marketing Promotional Decomposition (CRITICAL)
Goal:
- Break down dominant `marketing_promotional` umbrella into meaningful subtypes

Current Problem:
- ~94% dominance in `subscription-senders`
- Only ~29% resolved subtype coverage
- Subtype truth exists but is weak / suppressed

Next Actions:
- Implement subtype resolver for:
  - `editorial_newsletter`
  - `offer_campaign`
  - `product_marketing_update`
- Rebuild artifacts once after implementation
- Validate subtype coverage improvement

---

## Not Yet Completed

### 2. Subtype Depth Expansion (Beyond Marketing)
Goal:
- Ensure all major families have meaningful decomposition layers

Scope:
- commerce_transactional
- account_notification
- social_community
- system_notification

Notes:
- Must follow same decomposition rules
- Must remain portable across workspaces
- Do NOT expand prematurely without evidence

---

### 3. Needs-Review Reduction
Goal:
- Reduce size of `needs-review-senders` group (~1100 senders currently)

Problem:
- Too many senders fall into thin-history / mixed buckets

Approach:
- Improve semantic resolution first
- Then tighten assignment thresholds
- Avoid forcing classification when evidence is weak

---

### 4. Cleanup-Group Refinement
Goal:
- Validate whether current 8 cleanup groups remain optimal

Questions:
- Should some groups merge?
- Should some groups split?
- Should grouping become more semantic-driven over time?

Note:
- Do NOT change groups until semantic quality is stable

---

### 5. Rich Artifact Surface Expansion
Goal:
- Expose richer artifact signals to the user

Currently Underused:
- subtype coverage and persistence state
- trust distributions (resolution / confidence / provenance)
- pattern_mix
- operator_profile reasoning
- human vs automated signals

Future Work:
- Surface these in UI in a human-readable way
- Avoid overwhelming user
- Keep meaning → decomposition → trust hierarchy

---

### 6. Sender-Level Alignment
Goal:
- Ensure sender rows match group-level semantics

Problem:
- Sender cards still partially reflect legacy categories

Fix:
- Align sender-level display with semantic_family + subtype
- Remove legacy “category-first” thinking

---

### 7. UI Clarity & Inspection Layer
Goal:
- Make artifact data easy to evaluate instantly

Requirements:
- Bars and percentages must always match
- Labels must be human-readable
- Trust must be understandable without jargon

Note:
- This is refinement, not redesign

---

### 8. Artifact Engine Generalization (Cross-Workspace)
Goal:
- Make artifact system reusable for any workspace

Required:
- Define how new workspaces plug into semantic resolver
- Ensure portability of families, patterns, subtypes
- Avoid Gmail-specific assumptions in core engine

Example Targets:
- Crypto workspace
- Tax/accounting workspace
- Marketing automation workspace

---

### 9. Artifact Engine Blueprint Expansion
Goal:
- Expand blueprint into full system specification

Include:
- semantic resolver interface
- rollup builder interface
- decomposition engine rules
- validation framework

---

### 10. Validation & Testing Framework
Goal:
- Ensure artifact system remains correct over time

Needed:
- automated audits for coverage
- semantic consistency checks
- rollup congruence validation
- rebuild validation scripts

---

## Future Phases

### Phase A — Final Semantic Stabilization
- Complete marketing decomposition
- Improve subtype coverage across families

### Phase B — Cleanup Group Optimization
- Re-evaluate grouping using improved semantics

### Phase C — Rich Artifact Exposure
- Surface advanced artifact signals to UI

### Phase D — Cross-Workspace Enablement
- Apply artifact engine to new workspace types

---

## Known Risks

- Over-decomposition creating fake precision
- Under-decomposition hiding meaningful structure
- Mixing structural and semantic logic
- UI misrepresenting artifact truth
- Rebuild loops without clear plan

---

## Guiding Rule

Always follow this order:

1. Fix semantic truth
2. Fix rollups
3. Fix grouping
4. Then improve UI
5. Rebuild only once per completed phase

---

## Summary

The artifact engine is now functional but not complete.

Remaining work focuses on:
- improving semantic depth
- reducing fallback buckets
- aligning grouping with meaning
- exposing richer intelligence
- enabling reuse across all Automata workspaces

---

# END OF TODO