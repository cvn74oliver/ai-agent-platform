

# ARTIFACT ENGINE DECISIONS

## Purpose
Capture key decisions made during the Artifact Engine build so they are not lost, re-argued, or accidentally reversed in future development.

This document explains **why** things are the way they are.

---

## Core Architectural Decisions

### 1. Truth-First Architecture
**Decision:** All UI must read from persisted artifact truth, not recomputed or inferred data.

**Why:**
- Prevents drift between surfaces
- Ensures consistency across Cleanup Groups and Sender Overview
- Eliminates hidden logic differences

---

### 2. Single Semantic System
**Decision:** Cleanup groups and sender overview must use the same semantic system.

**Why:**
- Avoids conflicting interpretations of the same data
- Ensures grouping and explanation are aligned
- Prevents duplication of logic

---

### 3. Meaning Always Exists
**Decision:** Every entity must have a semantic family (no null meaning).

**Why:**
- Prevents “I don’t know” buckets from dominating
- Forces system to express uncertainty explicitly instead

---

### 4. Separate Meaning from Uncertainty
**Decision:** Meaning (family/pattern) must never encode uncertainty.

**Why:**
- Keeps interpretation clean
- Allows trust layer to communicate ambiguity without corrupting meaning

---

### 5. Structural vs Semantic Groups
**Decision:** Not all groups are semantic.

Group types:
- `structural_only`
- `structural_backlog`
- `semantic_first`

**Why:**
- Some groups exist for routing, not meaning
- Prevents UI from misrepresenting structural buckets as semantic insights

---

### 6. Decomposition Over Collapse
**Decision:** Dominant buckets must be evaluated for decomposition.

**Why:**
- Prevents single-bucket dominance (e.g., 94% marketing)
- Preserves meaningful subtype structure

---

### 7. Subtype Truth Rules
**Decision:** Subtypes are only shown when evidence is strong enough.

States:
- `suppressed`
- `provisional`
- `survives`

**Why:**
- Avoids fake precision
- Keeps system honest when data is weak

---

### 8. Rebuild Discipline
**Decision:** Rebuilds are treated as publication events.

**Why:**
- Prevents trial-and-error rebuild loops
- Forces planning before execution

---

## Marketing Decomposition Decision

### Keep Top-Level Family
**Decision:** `marketing_promotional` remains a top-level family.

**Why:**
- It is directionally correct
- It represents real grouping at scale

---

### Add Subtypes Instead of Replacing Family
**Decision:** Add subtypes under marketing instead of replacing it.

Subtypes:
- `editorial_newsletter`
- `offer_campaign`
- `product_marketing_update`

**Why:**
- Preserves correct high-level grouping
- Adds needed granularity underneath

---

### Do Not Promote General Updates
**Decision:** `general_updates` is evidence, not a visible marketing subtype.

**Why:**
- It is too broad and ambiguous
- It corrupts semantic clarity if promoted

---

## Artifact vs UI Decision

### UI Does Not Define Truth
**Decision:** UI is a read-only interpretation layer.

**Why:**
- Prevents UI-driven logic drift
- Keeps system stable and testable

---

### Presentation Honesty Over Design
**Decision:** UI must reflect truth, even if imperfect.

**Why:**
- Honest systems build trust
- Fake clarity causes long-term failure

---

## Cross-Workspace Decision

### Gmail Is Reference Implementation
**Decision:** Gmail is the first implementation, not the final system.

**Why:**
- We are building a reusable artifact engine
- Other workspaces will reuse the same structure

---

### Domain Logic Lives in Resolver
**Decision:** Each workspace defines its own semantic resolver.

**Why:**
- Keeps engine universal
- Keeps domain logic modular

---

## Current Phase Map (Locked)

### Phase A — Marketing Decomposition (ACTIVE)
- Improve subtype depth under marketing

### Phase B — Subtype Validation
- Confirm improved subtype coverage
- Validate semantic truth stability

### Phase C — Cleanup Group Refinement
- Adjust grouping logic if needed

### Phase D — Rich Artifact Exposure
- Surface advanced artifact signals

---

## When to Return to Artifacts (Critical Answer)

**Decision:** We do NOT fully "leave" artifacts until Phase B is complete.

**Correct sequence:**

1. Finish Phase A (marketing decomposition)
2. Validate Phase B (subtype quality is good)
3. If stable → artifacts are considered **functionally complete for Gmail**
4. Then move to UI completion and system finishing

---

## When to Revisit Artifacts Later

We return to artifacts AFTER:

- Gmail system is fully functional end-to-end
- UI is stable and trustworthy
- Agent workflows are operational

At that point:

👉 We generalize artifacts for cross-workspace use
👉 Build workspace-agnostic artifact resolvers
👉 Expand subtype depth across domains

---

## Workspace Builder Decision

**Decision:** Do NOT block Workspace Builder on full artifact perfection.

**Why:**
- Workspace Builder can use the artifact framework
- Domain-specific refinement can happen iteratively

**Correct order:**

1. Finish Gmail artifact baseline (Phases A–B)
2. Complete UI + workflow system
3. Build Workspace Builder
4. Then expand artifact system for new domains

---

## Biggest Lessons Learned

- Fixing UI before truth causes regressions
- Rebuild loops without planning waste time
- Dominant buckets must be decomposed, not ignored
- Structural groups must not pretend to be semantic
- Persistence is critical for consistency

---

## Summary

The artifact system is now:
- structurally sound
- semantically improving
- close to completion for Gmail

Remaining work is refinement, not reconstruction.

The next major milestone is completing marketing decomposition and validating subtype quality.

---

# END OF DECISIONS