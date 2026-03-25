

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
2. Cleanup group semantics (group meaning)
3. Sender Overview visualization model (how meaning is shown)

Only AFTER those are aligned:
→ one rebuild

---

# 8. Next Thread Objective

The next Codex thread must focus on:

## PRIMARY GOAL
Unify:
- cleanup groups
- sender semantics
- sender overview visualization

into one coherent product model

---

## NOT the goal
- patching charts
- small UI tweaks
- rebuilding artifacts again

---

# 9. Required Next Phase Direction

Next thread should:

1. Re-evaluate semantic presentation model
2. Define correct visualization rules:
   - absolute vs relative
   - when to show full distribution vs top-N
   - how to represent uncertainty
3. Decide cleanup-group refinement using semantic rollups
4. Only then move to implementation

---

# 10. Hard Constraints for Next Thread

- No rebuild until plan is locked
- No fallback categories as primary meaning
- No dominant bucket collapse allowed
- Always-present meaning must remain
- Uncertainty must be layered, not substituted

---

# 11. Biggest Remaining Risk

The biggest risk is:

> making multiple structural changes (taxonomy, grouping, visualization)
> and only validating once via rebuild

If that final output is wrong, root cause becomes unclear.

Mitigation:
- plan thoroughly
- validate logically first
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

# END OF HANDOFF