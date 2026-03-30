# Closeout Checklist (Authoritative Process)

## Purpose
Ensure every completed thread:
- is properly finalized
- leaves no ambiguity in system state
- updates all required documentation
- does not silently introduce regressions or hidden work

This is mandatory for all implementation threads.

---

## When to Use
Run this checklist **immediately after a thread is accepted** and before it is archived.

---

## Step 1 — Scope Confirmation
- Confirm what was in scope for the thread
- Explicitly state:
  - what is DONE
  - what is NOT done
- Ensure no scope creep is accidentally implied as complete

---

## Step 2 — Acceptance Decision
- Mark thread as:
  - ✅ Accepted
  - ❌ Rejected (with reason)
- If partial:
  - clearly define accepted vs rejected portions

---

## Step 3 — Outcome Summary (Required)
Document:
- What changed (behaviorally, not just technically)
- Why it matters (operator impact)
- What layer it affects:
  - UI
  - runtime
  - artifact
  - infra

---

## Step 4 — Remaining Work
Explicitly list:
- follow-on threads required
- known limitations
- anything intentionally deferred

---

## Step 5 — Documentation Updates (MANDATORY)

Update the following:

### 1. CHANGELOG.md
- What changed
- Why it mattered
- Date + short description

### 2. CURRENT_STATE.md
- Reflect new system behavior
- Update any affected flows or assumptions
- Ensure no stale descriptions remain

### 3. TODO.md (if applicable)
- Add new work discovered
- Remove completed work
- Reprioritize if needed

---

## Step 6 — Validation Check
Confirm:
- Feature works in real UI (not just logs)
- No regressions introduced
- Edge cases behave correctly
- No misleading states (empty, loading, fallback errors)

---

## Step 7 — Final Closeout Message
Thread must end with:
- clear acceptance statement
- summary of what shipped
- confirmation of doc updates
- explicit note of what remains open

---

## Step 8 — Archive
Only archive after:
- all steps above are complete
- docs are updated
- no ambiguity remains

---

## Non-Negotiables
- No thread is considered complete without doc updates
- No “implicit completion”
- No mixing of completed vs future work
- No silent regressions allowed

---

## Philosophy
This process ensures:
- the system evolves cleanly
- knowledge compounds instead of fragments
- future threads operate on truth, not guesswork