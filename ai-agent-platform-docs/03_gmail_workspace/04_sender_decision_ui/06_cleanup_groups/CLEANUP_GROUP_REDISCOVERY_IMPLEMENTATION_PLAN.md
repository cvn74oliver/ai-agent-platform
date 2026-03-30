

# Cleanup Groups — Rediscovery & Implementation Plan

## Purpose
Define a phased, artifact-driven approach to rediscover, redesign, and roll out Cleanup Groups.

This is NOT a refinement of existing groups.
This is a controlled transition from heuristic grouping → artifact-driven grouping.

This document is the execution source of truth for Codex.

---

# Core Principles (DO NOT VIOLATE)

1. Discovery over preservation
   - No existing group survives by default
   - All groups must justify existence via artifact evidence

2. Framework over instance
   - Works for Gmail, finance, marketing, ops
   - Avoid Gmail-specific logic in core grouping model

3. Operator-first
   - Groups must make decisions faster and clearer
   - Remove anything that adds confusion or delay

4. Artifact-backed only
   - No new heavy query patterns
   - Use existing artifact + semantic rollups

5. Safe rollout
   - No breaking of existing routes or saved state
   - Alias model required during transition

---

# System Model (Target)

## Lanes (top-level)
- Action (semantic parents)
- Backlog (structural backlog)
- Coverage (structural safety/unresolved)
- Secondary (coherent but smaller groups)
- Context (collapsed / historical)

## Group Types
- semantic.<name>
- structural.<name>
- secondary.<name>
- context.<name>
- child.<name>
- review.<name>

## Identity
- Canonical IDs (new)
- Legacy IDs (aliases)
- Compatibility-only aliases (temporary)

---

# Phased Execution Plan

---

## PHASE 1 — Artifact-Driven Rediscovery (NO UI CHANGES)

### Goal
Evaluate all existing groups using current artifact truth.

### Work
- Build full Disposition Matrix
- For each group:
  - sender_count
  - dominant_family
  - dominant_share
  - clear_share
  - classification
  - action (keep / rename / split / demote / collapse / remove)
- Identify:
  - true semantic parent candidates
  - structural lanes
  - weak/misleading groups
  - missing parent opportunities

### Deliverable
- Completed Disposition Matrix
- Proposed canonical parent set
- Candidate replacement groups

### Do NOT
- change UI
- change routes
- change backend

---

## PHASE 2 — Canonical Model Design

### Goal
Define the new grouping system.

### Work
- Define canonical IDs for all surviving groups
- Define alias mapping from current IDs
- Define lane structure (Action / Backlog / Coverage / Secondary / Context)
- Define durable child vs runtime review-unit rules
- Define evidence thresholds for:
  - semantic parents
  - structural parents
  - secondary groups

### Deliverable
- Canonical ID map
- Alias plan
- Final lane structure

---

## PHASE 3 — Product Surface Redesign (UI PLAN ONLY)

### Goal
Define what users see first.

### Work
- Define Fresh Start Surface:
  - lane order
  - group order
  - default expansion/collapse
  - recommended first click
- Define card structure:
  - counts
  - rationale
  - entry actions
- Define context behavior

### Deliverable
- First-screen experience spec

---

## PHASE 4 — Runtime Identity & Alias Layer

### Goal
Introduce canonical + alias system safely.

### Work
- Implement canonical ID resolution
- Implement alias redirects
- Preserve existing routes and saved state
- Ensure no duplicate groups appear

### Files (expected)
- gmailCleanupClusterIdentity.ts
- gmailCleanupWorkspace.ts
- runtimeStateService.ts

### Constraints
- No new DB schema
- No breaking existing URLs

---

## PHASE 5 — UI Migration (SAFE SWITCH)

### Goal
Move UI to canonical groups.

### Work
- Update Cleanup Groups page
- Replace legacy groups with canonical ones
- Keep alias handling active
- Ensure counts and ordering match artifact truth

### Constraints
- No page-wide rehydrate
- No heavy queries

---

## PHASE 6 — Workflow Integration

### Goal
Align grouping with execution system.

### Work
- Update routing to open canonical groups
- Ensure Decision Mode uses canonical identity
- Ensure subset routing still works

---

## PHASE 7 — Cleanup & Hardening

### Goal
Finalize system

### Work
- Remove compatibility-only aliases (when safe)
- Clean unused logic
- Performance validation
- Final audit

---

# Disposition Matrix (Required Output)

| current_group_id | sender_count | dominant_family | dominant_share_pct | clear_share_pct | classification | action | target_canonical_id | notes |

This table is mandatory before Phase 2 begins.

---

# Acceptance Criteria

- 100% sender coverage maintained
- No duplicate group representations
- Canonical + alias resolution works across:
  - Cleanup Groups
  - Sender Overview
  - Decision Mode
- Groups reflect artifact truth (not legacy assumptions)
- System works generically beyond Gmail

---

# Execution Order (STRICT)

1. Phase 1 — Rediscovery
2. Phase 2 — Model Design
3. Phase 3 — UI Plan
4. Phase 4 — Runtime Identity
5. Phase 5 — UI Migration
6. Phase 6 — Workflow Integration
7. Phase 7 — Hardening

Do NOT skip phases.
Do NOT combine phases.

---

# Notes

- Gmail is only the first dataset
- This system becomes the foundation for all future workspaces
- Do not optimize for current UI convenience over long-term correctness