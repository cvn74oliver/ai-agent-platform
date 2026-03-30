# Sender Overview Semantic Rebuild — Handoff Document
## (Authoritative Reset for Next Codex Thread)

---

# 1. Purpose of This Document

This document serves as the **single source of truth** for:
- where the Gmail Workspace currently stands
- what is stable vs unstable
- what has been attempted
- what has regressed
- what must happen next

This is a **hard reset checkpoint** before continuing development in a new Codex thread.

---

# 2. Current Stable State (Do NOT break)

The following are **working and validated**:

## 2.1 Data Architecture
- Artifact-backed request system is stable
- No request-time mailbox scans
- Published artifact is the only runtime data source

## 2.2 Mailbox Coverage
- 100% sender coverage achieved
- Total senders: ~4,869
- All senders assigned to exactly one cleanup group
- No unassigned or multi-assigned senders

## 2.3 Cleanup Groups (Structural Model)
Current groups:
- protected-trusted-senders
- subscription-senders
- dormant-backlog-senders
- historical-out-of-inbox-senders
- needs-review-senders
- system-notification-senders
- retail-commerce-senders
- social-platform-senders

This structure is now:
- mutually exclusive
- collectively exhaustive

Note:
- The current cleanup group structure is now considered a temporary baseline.
- It is structurally correct for coverage, but NOT validated as the final grouping model.
- A full artifact-driven rediscovery phase is planned and must not be blocked by this baseline.

## 2.4 Semantic Model (Pass 1)
Sender-level semantics now include:
- semantic_family
- semantic_pattern (pattern_class)
- resolution
- confidence
- provenance
- decomposition metadata

Legacy fields remain but are deprecated.

## 2.5 Semantic Rollups (Pass 2)
Cluster-level analytics now derive from:
- semantic_family
- semantic_pattern
- resolution / confidence / provenance

NOT from legacy fields.

---

# 3. Current Broken / Unstable State

## 3.1 Sender Overview — Semantic Row (CRITICAL ISSUE)

The second-layer visualization is currently **not product-usable**.

Observed problems:

- Bar widths and percentages mismatch visually
- Charts feel either:
  - misleading (previous version), or
  - too weak / unreadable (current version)
- Users cannot trust what they are seeing

## 3.2 Semantic Output Quality

Across groups:
- Overuse of fallback-like behavior (thin_history / mixed)
- Weak subtype decomposition
- Broad umbrella categories still dominate perception

## 3.3 Cleanup Group Semantics Not Final

Although coverage is correct:
- protected-trusted is too large
- needs-review is too large
- smaller groups may not justify being standalone

These groups are structurally correct, but **not yet product-final**.

## 3.4 System Fragmentation (Cross-Layer Misalignment)

Although individual components are now stable, the system still lacks full alignment between:
- analysis (charts / rails)
- grouping (cleanup groups)
- workflow (sender list)
- execution (Decision Mode)

This creates risk of:
- duplicated logic
- inconsistent ordering
- competing interpretations of data

The next phase must unify these layers under a single authoritative model.

---

# 4. Regressions to Acknowledge

We explicitly record:

### Regression 1
Old behavior:
- bars inflated → misleading

### Regression 2
New behavior:
- mathematically correct but visually unusable

Conclusion:
- **mathematical correctness alone is not sufficient**
- visualization must also be product-usable

---

# 5. What We Learned

## 5.1 Core Insight
The real problem was never just data.

It was:
> mixing meaning, uncertainty, and fallback into the same layer

This is now fixed structurally.

## 5.2 New Reality
We now have:
- correct data model
- correct grouping coverage
- correct semantic separation

But we do NOT yet have:
- correct product representation

## 5.3 System-Level Insight (NEW)

We are not building isolated features.

We are building a unified decision system composed of:
- Analysis Rail (who + when)
- Cleanup Groups (where to start)
- Workflow subset (what to act on)
- Decision Mode (execution)

All four must:
- share the same underlying truth
- share the same ordering
- avoid duplicating logic

Any divergence between these layers must be treated as a regression.

---

# 6. Rebuild Policy (NON-NEGOTIABLE)

From this point forward:

## DO:
- plan fully first
- implement once
- rebuild once
- verify once

## DO NOT:
- rebuild after each change
- “test” ideas via rebuild
- treat rebuild like refresh

Rebuild = **final materialization step only**

---

# 7. What Must Happen Before Next Rebuild

We must finalize:

1. Sender semantic taxonomy (meaning layer)
2. Cleanup group rediscovery (artifact-driven grouping model)
3. Sender Overview visualization model (analysis rail + distribution + time context)
4. Shared workflow subset contract (single source of truth across chart/list/decision)

Only AFTER those are aligned:
→ one rebuild

---

# 8. Next Thread Objective

The next Codex thread must focus on system unification.

## PRIMARY GOAL
Unify:
- cleanup groups (rediscovered from artifact truth)
- sender semantics (taxonomy)
- analysis rail (distribution + time context)
- workflow subset (shared contract)
- Decision Mode (execution)

into ONE coherent decision system.

## NOT the goal
- patching charts in isolation
- incremental tweaks to existing groups
- rebuilding artifacts without a locked model

---

# 9. Required Next Phase Direction

Next thread should:

1. Complete cleanup-group rediscovery (full disposition matrix)
2. Define canonical grouping model (semantic / structural / secondary / context)
3. Finalize analysis rail behavior (tabbed system + scope rules)
4. Define shared workflow subset contract across all layers
5. Define visualization rules that match the unified model
6. Only then move to implementation planning

---

# 10. Hard Constraints for Next Thread

- No rebuild until plan is locked
- No fallback categories as primary meaning
- No dominant bucket collapse allowed
- Always-present meaning must remain
- Uncertainty must be layered, not substituted

- No parallel decision systems allowed (chart, list, and decision must share one truth)
- No UI-driven logic that overrides artifact-backed ordering
- No system-level changes without cross-layer consistency (analysis, grouping, workflow, execution)

---

# 11. Biggest Remaining Risk

The biggest risk is:

> making multiple structural changes (taxonomy, grouping, visualization)
> and only validating once via rebuild

If that final output is wrong, root cause becomes unclear.

Mitigation:
- plan thoroughly at the SYSTEM level (not feature level)
- validate logic across all layers (analysis, grouping, workflow, execution)
- ensure all components share the same truth model
- rebuild once

---

# 12. Final State of This Thread

This thread is now:
- architecturally valuable
- context-rich
- but no longer safe for continued iteration

We are intentionally stopping here to:
- preserve clarity
- avoid compounding regressions
- reset cleanly

---

# 13. Relationship To Current System Tracks (NEW)

This handoff connects to the following active tracks:

- Shared Analysis Rail (tabbed distribution + time context)
- Sender Distribution Chart (workflow-driving surface)
- Cleanup Groups Rediscovery (artifact-driven restructure)

This document should NOT be used to independently drive those tracks.

It exists to:
- align them
- unify them
- ensure they converge into one system

---

# END OF HANDOFF