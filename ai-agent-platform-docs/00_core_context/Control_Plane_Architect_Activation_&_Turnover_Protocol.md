# Control Plane Architect Activation & Turnover Protocol

## Purpose

This document defines the **formal turnover process for the Control Plane Architect role**.

It ensures that when a session becomes too long or requires reset:
- continuity is preserved
- system knowledge is not lost
- the next architect can resume immediately without drift

This is a **lightweight but strict protocol**, similar to Project Manager turnover, but focused on:
- system rules
- control-plane integrity
- operating-system behavior

---

## When To Use This Protocol

Run this protocol when:
- chat/session becomes too long
- response quality degrades
- drift or hallucination is observed
- you want a clean architect reset

---

## Overview (3-Step Process)

The Control Plane Architect must provide:

1. **Active Change Event (ACE) Entry**
2. **Change Propagation Prompt**
3. **3 Activation Messages for the new Architect**

Note:
- If the relevant ACE has already been created and fully propagated before turnover, Steps 1 and 2 may be skipped.
- In that case, the Architect should only provide the 3 activation messages (Step 3).

---

## Step 1 — Architect ACE Entry (MANDATORY)

The current Architect must create an ACE representing:
- current system state
- newly introduced system rules
- hardening changes made during the session

### Required Content

- title: `ACE-XXX — Control Plane Hardening / Architect Turnover`
- status: Active (then Completed after propagation)
- scope:
  - what system rules were added/modified
- impact:
  - templates
  - AGENTS.md
  - skills
  - protocols

The ACE must capture:

### 🚨 NEW GOVERNING TRUTH CHECK (MANDATORY)

Before creating the Architect ACE, the outgoing Architect must explicitly determine whether any newly discovered governing product or system truth exists that is not yet reflected in the control plane.

Examples:
- system-level rules changed based on recent PM or runtime review
- verification discipline expanded beyond what was previously enforced
- execution constraints or boundaries were corrected during the session

If newly discovered governing truth exists:
- it MUST be treated as blocking continuity work
- it MUST be captured in the ACE and propagated
- it MUST NOT remain only in Architect session context

> system-level changes AND any still-unlogged system-state — not chat history

### 🧠 FULL STATE CAPTURE REQUIREMENT (CRITICAL)

The Architect ACE MUST function as a **system-state preservation artifact**, not a simple change log.

This is an incremental capture requirement — not a requirement to rewrite everything already logged.


### 🔎 REQUIRED SOURCE CHECK — WHAT IS ALREADY LOGGED VS NOT YET LOGGED

Before writing the Architect ACE, the outgoing Architect MUST explicitly check what the control plane already contains. `ACTIVE_CHANGE_EVENTS.md` is the primary comparison surface, but it is NOT sufficient by itself.

Minimum required comparison workflow:
1. Re-read ACTIVE_CHANGE_EVENTS.md first as the primary ledger of active/open continuity
2. Re-read the relevant sections in:
   - CURRENT_STATE.md
   - TODO.md
   - PROJECT_MANAGER_CONTEXT.md
3. Re-read relevant CHANGELOG.md Recovery Contract entries only when the next step depends on recent accepted fixes or prior verification baselines
4. Compare those authoritative logs against the current system state still held in the Architect session
5. Capture ONLY the system-critical facts that are still missing, under-logged, or too thinly logged to preserve continuity

The Architect must also compare newly derived system rules and conclusions from the current session against the control plane to detect any governing truth that is still missing.

Best-practice priority order:
- ACTIVE_CHANGE_EVENTS.md = primary surface for what is active / still open / still changing
- CURRENT_STATE.md = current reality snapshot
- TODO.md = next-step truth
- PROJECT_MANAGER_CONTEXT.md = operating context and continuity framing
- CHANGELOG.md = accepted-fix recovery memory only when needed

Purpose:
- prevent accidental loss of unlogged system state
- prevent unnecessary duplication of already-propagated history
- force a real quality check before retirement
- avoid false confidence from checking only ACTIVE_CHANGE_EVENTS.md when adjacent control-plane docs contain additional authoritative context

The outgoing Architect must ask:
- What has already been logged clearly enough to preserve continuity?
- What is still only in this session?
- What was logged too thinly and needs correction or expansion before retirement?
- Did this session produce any new governing system truth that future execution must follow?
- Does CHANGELOG.md contain a Recovery Contract that matters for deterministic recovery here?

Required structure (for any still-unlogged system state):

1. System State Snapshot
   - current verified system behavior
   - partially implemented or unstable areas
   - not-started or deferred work

2. Verification Discipline State
   - what rules are enforced
   - where verification has failed or is weak
   - recent regressions or breakdowns

3. Known System Risks
   - drift risks
   - enforcement gaps
   - unreliable Codex behavior areas

4. Active Constraints
   - protected files and boundaries
   - what must NOT change
   - explicitly deferred system changes

5. Execution Discipline State
   - PLAN vs EXECUTION discipline health
   - control-plane alignment health
   - verification compliance consistency

6. Next System-Level Action (RECOVERED — NOT GUESSED)
   - derived from control-plane truth
   - not from chat memory

#### Incremental Rule

- The Architect MUST use ACTIVE_CHANGE_EVENTS.md as the primary comparison surface, but MUST also cross-check CURRENT_STATE.md, TODO.md, and PROJECT_MANAGER_CONTEXT.md before deciding nothing new needs to be logged
- If current session-held system state does not appear in the control-plane records strongly enough to support recovery, it must be added before turnover
- Evidence that the Architect compared current session state against existing control-plane logging must be implicit in the ACE content

- DO include any important system state not yet logged
- DO NOT duplicate already-propagated system history
- If earlier logs already captured something correctly, do NOT restate it

#### PROHIBITED

- writing ACE as a simple turnover note
- omitting state because "it's in chat"
- duplicating already-propagated system history
- relying on chat memory for continuity

If this structure is not satisfied:
- turnover is INVALID

---

## Step 2 — Change Propagation (MANDATORY)

The Architect must generate a Codex prompt that:

- updates all affected control-plane docs
- ensures system consistency
- aligns control-plane documents only:
  - CURRENT_STATE.md
  - TODO.md
  - PROJECT_MANAGER_CONTEXT.md
  - ACTIVE_CHANGE_EVENTS.md
  - CHANGELOG.md (if applicable)
- limit all propagation to control-plane documents only (do not modify protected files)

### Critical Rule

The system must not rely on chat memory.

This includes newly discovered governing system truth from Architect reasoning or PM review. If system rules or execution boundaries were corrected during the session, they must be written into the control plane before turnover.

All logic must be:
> written into the control plane

Clarification:
- Source rule files (AGENTS.md, CODEX_PROMPT_TEMPLATES.md, SKILL.md files) are considered already-authoritative unless explicitly scoped.
- This step is for control-plane alignment, not rule reimplementation.

### 🔁 PROPAGATION COMPLETENESS RULE

Propagation is NOT complete unless:
- control-plane documents are aligned AND
- the Architect ACE captures all still-unlogged system state

If either is missing:
- turnover must be blocked

Additionally, propagation is NOT complete unless the Architect has performed the required source-check comparison and captured any missing system state identified by that comparison.

Propagation is also incomplete if newly discovered governing system truth was not captured in the control plane before turnover.

## Protected Files (CRITICAL — DO NOT MODIFY)

The following files are architect-controlled and MUST NOT be modified by Codex during propagation unless explicitly instructed by Oliver:

- AGENTS.md
- CODEX_PROMPT_TEMPLATES.md
- Any `SKILL.md` files under `/Users/olivercarlin/.codex/skills/`
- ControlPlaneArchitectActivationAndTurnoverProtocol.md
- Project Manager Activation and Turnover Protocol.md
- One_Command_Activation_Message_for_Agent_Turnovers.md
- AGENT_TURNOVER_READINESS_CHECK.md

Rules:
- These files are already manually hardened and are considered authoritative.
- Codex must NOT reopen, rewrite, or "improve" them during turnover propagation.
- If Codex believes a change is required:
  - it MUST STOP
  - explain the reason
  - wait for explicit approval from Oliver

Violation of this rule is considered a propagation error.

---

## Step 3 — New Architect Activation (3 Messages)

The outgoing Architect must produce **3 activation messages**.

These must be:
- fully written (NOT templates)
- specific to current system state
- free of placeholders
- must respect Protected Files rules and not include propagation that modifies those files

---

### Message 1 — Control Plane Load

Attachments:
- CURRENT_STATE.md
- TODO.md
- PROJECT_MANAGER_CONTEXT.md
- ACTIVE_CHANGE_EVENTS.md
- SYSTEM_MEMORY_MAP.md
- AGENTS.md
- CODEX_PROMPT_TEMPLATES.md

Purpose:
- establish system truth
- confirm current rules
- confirm active ACEs

Must include:
- current system state summary
- active rules (verification, runtime, route identity, etc.)
- confirmation that control plane is source of truth

End with:
"Ready for orientation."

---

### Message 2 — System Orientation

Attachments:
- system_overview.md
- PM_ONBOARDING_BRIEF.md (if relevant)

Purpose:
- enforce system-level thinking
- prevent feature-level drift

Must include:
- platform structure (Control Plane → System → Feature → Execution)
- architect role responsibilities

End with:
"Ready for continuity."

---

### Message 3 — Execution Continuity

Attachments (STRICT — minimal only):
- ACTIVE_CHANGE_EVENTS.md (MANDATORY — reattach for continuity reference)

Optional (ONLY if required for deterministic recovery):
- CHANGELOG.md (include only if the next step depends on a recent Recovery Contract)

Important:
- Do NOT reattach full control-plane files here (they were already loaded in Message 1)
- Do NOT attach AGENTS.md, CODEX_PROMPT_TEMPLATES.md, or any SKILL files
- Message 3 should carry only the minimal context required to resume execution
- ACTIVE_CHANGE_EVENTS.md is intentionally reattached here even though it was loaded in Message 1.
- Message 1 establishes full system context.
- Message 3 reanchors execution to the latest active ACE and prevents drift.
- This duplication is deliberate and required for continuity, not an error.


Purpose:
- resume work exactly where previous architect left off

Must include:
- current active issues
- recently added system rules
- next highest-impact action
- verification discipline state
- known enforcement gaps or risks
- explicit constraints that must be preserved

Rules:
- no guessing
- no missing context
- no template language

End with:
"Waiting for Oliver before execution."

---

## Non-Negotiable Rules

### 1. No Template Copying

All messages must be:
- filled in with real system state
- specific
- actionable

---

### 2. Control Plane Is Source of Truth

The new Architect must rely on:
- docs
- ACEs

NOT:
- chat history

---

### 3. No Drift Allowed

The new Architect must:
- follow AGENTS.md
- follow prompt templates
- enforce verification discipline

---

## Definition of Successful Turnover

A turnover is successful if:
- new Architect understands system immediately
- no re-explanation required
- no context gaps exist
- execution can resume within one message
- no system-level knowledge exists only in the retired session
- all enforcement rules, risks, and gaps are captured
- the Architect performed an explicit comparison against ACTIVE_CHANGE_EVENTS.md and adjacent control-plane docs before finalizing the ACE
- no newly discovered governing system truth exists only in the retired Architect session

---

## Architect Output Contract (MANDATORY)

When this protocol is invoked, the Architect MUST return:

1. Active Change Event entry (unless already completed)
2. Change Propagation Codex prompt (or explicit "NO PROPAGATION REQUIRED" if already complete)
3. Message 1 (Control Plane)
4. Message 2 (Orientation)
5. Message 3 (Continuity)

All five outputs must be:
- complete
- copy-paste ready
- fully filled in (no placeholders)

If any piece is missing:

### 🔒 OUTPUT VALIDITY RULE

Turnover is INVALID if:
- ACE does not capture still-unlogged system state
- risks or enforcement gaps are missing
- next step depends on chat memory
- the required source-check comparison was not performed or is not reflected in the ACE content
- newly discovered governing system truth was not captured and propagated before turnover

---

## Final Principle

We are not transferring conversation.

We are transferring:
> **system state, rules, risks, and execution capability — fully captured in the control plane**

---

END OF DOCUMENT