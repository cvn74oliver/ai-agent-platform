# Gmail Workspace – Implementation Phase 1

## Purpose

Phase 1 focuses on stabilizing the **core sender‑first Gmail cleanup experience** before adding advanced AI or automation features.

This phase deliberately limits scope so that:

- The system becomes **fast, reliable, and testable**.
- The workflow becomes **clear and predictable for users**.
- Codex implementations can be validated **incrementally instead of rebuilding the entire system at once**.

Phase 1 is **not the final Gmail AI system**.

It is the foundation that ensures:

- correct sender‑first behavior
- stable data flow
- predictable execution
- fast navigation

Advanced intelligence layers will be implemented in later phases.

---

# Phase 1 Goals

Phase 1 must achieve the following outcomes:

1. The Gmail cleanup workflow loads quickly and reliably.
2. Users clearly understand how to move through the workflow.
3. Sender decisions persist and appear correctly in Confirmation.
4. Archive execution behaves predictably.
5. The system can be tested without waiting for large mailbox scans.

Phase 1 success is defined by **correct workflow behavior and strong performance**, not advanced AI features.

---

# Phase 1 Workflow Scope

Phase 1 includes **only the core decision workflow**.

Included pages:

1. Mailbox Intelligence
2. Cleanup Groups
3. Sender Decisions
4. Confirmation

These represent the **minimum viable sender‑first cleanup pipeline**.

The following pages are **not implemented in Phase 1**:

- Exceptions / Verification
- Rules / Automation
- Monitoring

These routes should remain present for stability but must:

- be hidden from the active workflow
- or show a "Coming in Phase 2" placeholder

This prevents UI breakage while preserving routing structure.

---

# Phase 1 Page Requirements

## 1. Mailbox Intelligence

Purpose:

Provide a **high‑level overview of the mailbox and sender ecosystem**.

This page acts as the **primary analytics dashboard** and must load quickly.

Required features:

- total senders
- total messages indexed
- sender volume distribution
- top senders
- protected senders

Required UI components:

- sender distribution bar chart
- message volume timeline chart
- category distribution chart
- top sender list

Mailbox Intelligence must also expose:

- clickable cleanup groups
- links into the cleanup workflow

Users should immediately understand:

- the size of their mailbox
- the dominant senders
- where cleanup opportunities exist

---

## 2. Cleanup Groups

Purpose:

Allow users to select which **sender cluster** they want to review.

Clusters must be **sender‑based**, not message‑behavior based.

Examples:

- Retail Promotions
- Travel Companies
- Subscriptions
- Social Platforms
- High Volume Senders

Each cluster card must display:

- sender count
- message count
- cluster description

Selecting a cluster must open the **Sender Decisions workspace**.

Cleanup Groups must **reuse cached mailbox intelligence data** rather than triggering a new mailbox analysis.

---

## 3. Sender Decisions

Purpose:

This is the **primary decision workspace**.

Users review **senders**, not individual messages.

Sender rows must include:

- sender name
- sender email/domain
- message count
- unread count
- last activity

Users must be able to choose one of the following actions:

- Keep
- Archive
- Quarantine
- Unsubscribe
- Custom Rule

Messages appear only as **evidence previews**.

Required Phase 1 features:

- sender table
- pagination
- preview drawer
- decision buttons

Phase 1 explicitly does NOT require:

- advanced sender filtering
- complex rule editing
- AI recommendation systems

The focus is **making sender decisions easy and fast**.

---

## 4. Confirmation

Purpose:

Display the **exact impact of sender decisions** before executing changes.

This page must show:

- senders selected
- total messages affected
- archive count

Archive execution must:

- resolve message IDs server‑side
- chunk Gmail batchModify calls (100 ids per call)

Confirmation must clearly state:

"This action will remove the Inbox label from X messages."

This ensures users understand the exact consequences before execution.

---

# Performance Requirements

Phase 1 must fix the primary usability issue identified during testing:

**slow page loads**.

The following performance improvements are required.

---

## Caching

Mailbox Intelligence and Cleanup Groups must share cached results.

Navigation between pages must **not trigger full mailbox recomputation**.

The following data should be cached per cleanup snapshot:

- sender universe
- cluster definitions
- sender statistics

---

## Lazy Loading

Sender lists must load incrementally.

Recommended configuration:

- 50 senders per page

Additional senders load only when users navigate pages.

---

## Async Data Processing

Large mailbox scans must run asynchronously.

UI behavior should include:

- progress indicators
- partial data rendering

Pages must never block for full mailbox scans.

---

# Phase 1 Testing Criteria

Phase 1 is considered successful when:

1. Mailbox Intelligence loads in under **3 seconds**.
2. Cleanup Groups load instantly after Intelligence.
3. Sender Decisions load within **2 seconds**.
4. Confirmation correctly reflects decisions.
5. Archive execution succeeds without Gmail API errors.

Only after these conditions are met should Phase 2 begin.

---

# Phase 1 Deliverables

Codex must deliver:

- stable sender‑first workflow
- correct archive execution
- fast page transitions
- consistent UI layout

Phase 1 must **prioritize stability over feature expansion**.

---

# Phase 1 Completion Rule

Phase 1 ends when:

- the workflow functions end‑to‑end
- navigation is fast
- the UI is understandable
- archive execution is reliable

Once these conditions are satisfied, the project may proceed to **Phase 2 development**.