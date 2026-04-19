# One-Command Activation Message for Agent Turnovers

## Purpose

This document provides **copy-paste-ready prompts** to trigger a full, clean turnover for any agent role:

- Primary Project Manager
- Lane Project Manager
- Control Plane Architect

It ensures:
- nothing is forgotten
- the correct files are attached
- the Active Change Event is created directly
- turnover messages are generated in one response

---

## Core Workflow (MANDATORY)

When performing any turnover:

1. Send the **one-command activation message** below
2. Attach the correct protocol file
3. Attach the current control-plane files so the retiring agent can compare what is already logged vs what is still only in session:
   - `CURRENT_STATE.md`
   - `TODO.md`
   - `PROJECT_MANAGER_CONTEXT.md`
   - `ACTIVE_CHANGE_EVENTS.md`
4. Let the retiring agent:
   - review the attached control-plane files first
   - compare them against current session-held state
   - edit `ACTIVE_CHANGE_EVENTS.md` directly through Visual Code Builder to capture any still-unlogged critical continuity
   - return a Codex propagation prompt that ONLY updates control-plane documents
   - return the 3 activation messages
   - explicitly detect whether PM/Architect review established any newly discovered governing product/system truth that is not yet in the control plane
   - if such governing truth exists, treat it as blocking continuity work and ensure it is captured in ACTIVE_CHANGE_EVENTS.md before allowing turnover to complete

---

## Required Attachments

### Always attach:
- `CURRENT_STATE.md`
- `TODO.md`
- `PROJECT_MANAGER_CONTEXT.md`
- `ACTIVE_CHANGE_EVENTS.md` (via Visual Code Builder)

Purpose:
- the retiring agent must compare current session-held state against the active control plane before deciding what needs to be added to the turnover ACE
- `ACTIVE_CHANGE_EVENTS.md` is the primary comparison surface, but it is not sufficient by itself

### Then attach ONE of the following depending on role:

#### For Project Manager turnover:
- `Project Manager Activation and Turnover Protocol.md`

#### For Control Plane Architect turnover:
- `ControlPlaneArchitectActivationAndTurnoverProtocol.md`

### Attach when needed (not always):
- relevant `CHANGELOG.md` Recovery Contract entries only when the retiring agent needs them to determine accepted-fix recovery context or recent verified baselines

---

## Protected Files (CRITICAL — DO NOT MODIFY)

The following files are considered architect-controlled and MUST NOT be modified by Codex during turnover or propagation unless explicitly instructed by Oliver:

- AGENTS.md
- CODEX_PROMPT_TEMPLATES.md
- Any `SKILL.md` files under `/Users/olivercarlin/.codex/skills/`
- ControlPlaneArchitectActivationAndTurnoverProtocol.md
- Project Manager Activation and Turnover Protocol.md
- One_Command_Activation_Message_for_Agent_Turnovers.md
- AGENT_TURNOVER_READINESS_CHECK.md

Rules:
- These files are already manually hardened and should be treated as authoritative.
- Codex must NOT reopen, rewrite, or "improve" them during turnover propagation.
- If Codex believes a change is needed:
  - it MUST STOP
  - explain the reason
  - wait for explicit approval

Violation of this rule is considered a propagation error.

---

## One-Command Prompt — Project Manager Turnover

Copy and paste this into the retiring PM:

```text
Project Manager Turnover — Execute Now

You are being retired as the _____________ PM v# and replaced by a new _____ Project Manager session called __________ PM v#.

Follow:
- Project_Manager_Activation_&_Turnover_Protocol.md (ATTACHED)

Control plane files are also attached for review:
- CURRENT_STATE.md
- TODO.md
- PROJECT_MANAGER_CONTEXT.md
- ACTIVE_CHANGE_EVENTS.md

ACTIVE_CHANGE_EVENTS.md is attached through Visual Code Builder for direct review and editing, and the other control-plane files are attached so you can compare what is already logged vs what is still only in your session.
You MUST edit that file directly to create the ACE entry.
You MUST review the attached control-plane files first and only capture still-unlogged critical continuity; do NOT duplicate already-propagated history.

You MUST explicitly determine whether PM review established any newly discovered governing product truth that is not yet reflected in the control plane.
If such governing truth exists, you MUST capture it in ACTIVE_CHANGE_EVENTS.md and it MUST be included in the propagation scope.
Do NOT allow the thread to close if governing truth remains only in this session.

Return the COMPLETE turnover package in one response.

Required outputs:
1. Confirmation that ACTIVE_CHANGE_EVENTS.md was edited directly
1b. Explicit statement confirming whether newly discovered governing truth existed and was captured (or confirming none existed)
2. Codex prompt to propagate that entry
3. Message 1 — Control Plane
4. Message 2 — Orientation
5. Message 3 — Execution Continuity

Rules:
- fully filled in
- no placeholders
- no template language
- specific to current system state
- must not allow thread-local governing truth; any newly discovered governing truth must be propagated before turnover
- compare current session-held state against the attached control-plane files before deciding what belongs in the turnover ACE
- treat ACTIVE_CHANGE_EVENTS.md as the primary comparison surface, but cross-check CURRENT_STATE.md, TODO.md, and PROJECT_MANAGER_CONTEXT.md before deciding nothing new needs to be logged
- copy-paste ready
- DO NOT modify any protected files (AGENTS.md, CODEX_PROMPT_TEMPLATES.md, SKILL.md files, or turnover protocol files)
- limit all changes to control-plane documents only

Do NOT:
- tell Oliver what to write in ACTIVE_CHANGE_EVENTS.md
- paste the ACE entry into chat
- omit any section
- summarize

Return everything in one response.
```

---

## One-Command Prompt — Control Plane Architect Turnover

Copy and paste this into the retiring Architect:

```text
Control Plane Architect Turnover — Execute Now

You are being retired and replaced by a new Control Plane Architect session.

Follow:
- Control_Plane_Architect_Activation_&_Turnover_Protocol.md (ATTACHED)

Control plane files are also attached for review:
- CURRENT_STATE.md
- TODO.md
- PROJECT_MANAGER_CONTEXT.md
- ACTIVE_CHANGE_EVENTS.md

ACTIVE_CHANGE_EVENTS.md is attached through Visual Code Builder for direct review and editing, and the other control-plane files are attached so you can compare what is already logged vs what is still only in your session.
You MUST edit that file directly to create the ACE entry.
You MUST review the attached control-plane files first and only capture still-unlogged critical continuity; do NOT duplicate already-propagated history.

You MUST explicitly determine whether any newly discovered governing system truth exists that is not yet reflected in the control plane.
If such governing truth exists, you MUST capture it in ACTIVE_CHANGE_EVENTS.md and include it in the propagation scope.
Do NOT allow the session to close if governing truth remains only in this session.

Return the COMPLETE turnover package in one response.

Required outputs:
1. Confirmation that ACTIVE_CHANGE_EVENTS.md was edited directly
1b. Explicit statement confirming whether newly discovered governing system truth existed and was captured (or confirming none existed)
2. Codex prompt to propagate that entry
3. Message 1 — Control Plane Load
4. Message 2 — System Orientation
5. Message 3 — Execution Continuity

Rules:
- fully filled in
- no placeholders
- no template language
- specific to current system state
- must not allow session-local governing truth; any newly discovered governing system truth must be propagated before turnover
- compare current session-held state against the attached control-plane files before deciding what belongs in the turnover ACE
- treat ACTIVE_CHANGE_EVENTS.md as the primary comparison surface, but cross-check CURRENT_STATE.md, TODO.md, and PROJECT_MANAGER_CONTEXT.md before deciding nothing new needs to be logged
- copy-paste ready
- DO NOT modify any protected files (AGENTS.md, CODEX_PROMPT_TEMPLATES.md, SKILL.md files, or turnover protocol files)
- limit all changes to control-plane documents only

Do NOT:
- tell Oliver what to write in ACTIVE_CHANGE_EVENTS.md
- paste the ACE entry into chat
- omit any section
- summarize

Return everything in one response.
```

---

## Operator Checklist (Quick Use)

Before sending the prompt:

- [ ] Open this file
- [ ] Copy correct prompt (PM or Architect)
- [ ] Attach protocol file
- [ ] Attach `CURRENT_STATE.md`
- [ ] Attach `TODO.md`
- [ ] Attach `PROJECT_MANAGER_CONTEXT.md`
- [ ] Attach `ACTIVE_CHANGE_EVENTS.md`
- [ ] Attach relevant `CHANGELOG.md` Recovery Contract entries only if needed
- [ ] Send

After receiving response:

- [ ] Confirm ACTIVE_CHANGE_EVENTS.md was edited directly
- [ ] Confirm the retiring agent clearly used the attached control-plane files to determine what was already logged vs still missing
- [ ] Confirm the ACE captures missing continuity only, not duplicated history
- [ ] Confirm the response explicitly addressed newly discovered governing truth (either captured or confirmed none existed)
- [ ] Confirm no governing truth remains only in the retiring session
- [ ] Confirm NO protected files are included in the Codex propagation scope
- [ ] Copy Codex propagation prompt -> run it
- [ ] Send Message 1
- [ ] Send Message 2
- [ ] Send Message 3

---

## Source-Check Principle (CRITICAL)

A turnover should never rely on the retiring agent's memory alone.

The retiring agent must compare current session-held state against the attached control-plane files before deciding what to add to the turnover ACE.

Correct comparison order:
1. `ACTIVE_CHANGE_EVENTS.md` first as the primary ledger of active/open continuity
2. `CURRENT_STATE.md` for current-reality truth
3. `TODO.md` for next-step truth
4. `PROJECT_MANAGER_CONTEXT.md` for continuity framing
5. `CHANGELOG.md` Recovery Contracts only when needed

The goal is:
- preserve still-unlogged continuity
- avoid duplicating already-propagated history
- ensure the next agent can recover without the retired session

Additionally:
- the retiring agent must detect and extract any newly discovered governing product/system truth
- such truth must be promoted into the control plane before turnover completes
- turnover is invalid if governing truth remains only in the retiring session

---

## Final Principle

This system ensures:

> Turnovers are consistent, complete, comparison-driven, and stateless

No memory.
No guessing.
No missing steps.

---

## Failure Handling Rule (IMPORTANT)

If the returned turnover package is incomplete:

- DO NOT fix it manually
- DO NOT proceed
- DO NOT allow turnover to complete if governing truth extraction is missing or unclear

Instead:
- resend the same one-command prompt
- require the agent to correct its output

Turnover must be:
- complete
- consistent
- fully generated by the retiring agent

---

END OF DOCUMENT
