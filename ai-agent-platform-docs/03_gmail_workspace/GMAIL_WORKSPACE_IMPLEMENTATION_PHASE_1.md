

# Gmail Workspace – Implementation Phase 1

## Purpose

Phase 1 focuses on stabilizing the **core sender‑first Gmail cleanup experience** before adding advanced features.

This phase intentionally limits scope so that:

- The system becomes **fast, reliable, and testable**.
- The product flow becomes **clear and understandable**.
- Codex implementations can be validated **incrementally instead of all at once**.

No advanced automation, clustering intelligence tuning, or monitoring AI behavior should be expanded in this phase.

Phase 1 is about making the **core sender decision workflow correct and performant**.

---

# Phase 1 Goals

Phase 1 must achieve the following outcomes:

1. The Gmail cleanup workflow loads quickly and reliably.
2. Users clearly understand how to move through the workflow.
3. Sender decisions persist and appear correctly in Confirmation.
4. Archive execution behaves predictably.
5. The system can be tested without waiting for large mailbox scans.

Phase 1 should **not attempt to finalize the entire Gmail AI system**.

Only the core workflow is implemented.

---

# Phase 1 Workflow Scope

Phase 1 includes the following pages only:

1. Mailbox Intelligence
2. Cleanup Groups
3. Sender Decisions
4. Confirmation

The following pages are **not implemented in Phase 1**:

- Exceptions / Verification
- Rules / Automation
- Monitoring

Those pages will be implemented in later phases.

For Phase 1 they should either:

- be hidden
- or display a "Coming in Phase 2" placeholder

---

# Phase 1 Page Requirements

## 1. Mailbox Intelligence

Purpose:

Provide a **high‑level overview of the mailbox and senders**.

This page should load quickly and present summary analytics only.

Required features:

- total senders
- total messages indexed
- sender volume distribution
- top senders
- protected senders

Required UI components:

- sender distribution bar chart
- message volume chart
- top sender list

Users must be able to click a **cleanup group** from this page.

---

## 2. Cleanup Groups

Purpose:

Allow users to select which **sender cluster** they want to review.

Clusters are **sender groups**, not message groups.

Examples:

- Retail Promotions
- Travel Companies
- Subscriptions
- Social Platforms
- High Volume Senders

Each cluster card must show:

- sender count
- message count
- cluster description

Selecting a cluster opens **Sender Decisions**.

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

Users must be able to choose:

- Keep
- Archive
- Quarantine
- Unsubscribe
- Custom Rule

Messages should appear only as **evidence previews**.

Phase 1 features:

- sender table
- pagination
- preview drawer
- decision buttons

Phase 1 does NOT require:

- advanced filtering
- rule editing UI

---

## 4. Confirmation

Purpose:

Display the **exact impact of sender decisions** before executing changes.

This page must show:

- senders selected
- messages affected
- archive count

Archive execution must:

- resolve message ids server‑side
- chunk Gmail batchModify calls (100 ids per call)

Confirmation must clearly show:

"This action will remove the Inbox label from X messages."

---

# Performance Requirements

Phase 1 must address the major usability issue observed in testing:

**slow page loads**.

Required improvements:

### Caching

Mailbox Intelligence and Cleanup Groups must cache results.

Navigation between pages should not trigger full recomputation.

### Lazy Loading

Sender lists should load in pages.

Example:

- 50 senders per page

### Async Data Fetching

Large mailbox scans must run asynchronously.

Pages should show progress indicators rather than blocking.

---

# Phase 1 Testing Criteria

Phase 1 is considered successful when:

1. Mailbox Intelligence loads in under 3 seconds
2. Cleanup Groups load instantly after intelligence
3. Sender Decisions load within 2 seconds
4. Confirmation correctly reflects decisions
5. Archive execution succeeds without Gmail API errors

Only after these conditions are met should Phase 2 begin.

---

# Phase 1 Deliverables

Codex must deliver:

- stable sender‑first workflow
- correct archive execution
- fast page transitions
- consistent UI layout

Non‑essential AI behavior and automation will be implemented later.

---

# Phase 1 Completion Rule

Phase 1 ends when:

- the workflow works end‑to‑end
- the UI is understandable
- performance is acceptable

Only then should the project proceed to Phase 2.