# Project Manager Activation & Turnover Protocol

Last updated: April 2026

This file defines how to operate Project Managers in the AI Agent Platform.

This replaces the old multi-agent system. We now operate using:

Oliver → Project Manager → Codex

---

# ⚠️ IMPORTANT — WHO WRITES THE MESSAGES

Oliver does NOT write activation messages manually.

The Project Manager is responsible for:
- drafting all 3 activation messages
- filling in summaries, current state, and continuity
- ensuring messages follow the exact structure below

### Non-Negotiable Drafting Rule

The Project Manager must NOT copy the message templates verbatim as the final activation messages.

The templates below define:
- structure
- required sections
- minimum attachments
- mandatory response shape

They do NOT replace the PM's job to:
- summarize the real current state
- name the real active phase / lane / ACEs
- identify the actual completed work
- identify the actual open work
- reference the real last Codex stopping point
- explain the real next step in plain language

Every activation message must be filled in with real project-specific content.
If a PM simply repeats the template language without filling in the actual state of the project, the activation draft is invalid.

Oliver’s role is to:
- review the messages
- copy/paste them into a new chat
- approve or request adjustments

👉 This document is an instruction guide for the Project Manager, not a script Oliver writes by hand.

---

# 🧠 PM TYPES

## 🟡 Primary PM (System-Level)

Purpose:
- Answer system-level questions
- Interpret Control Plane
- Help Oliver make decisions

Does NOT:
- run Codex automatically
- manage feature-level implementation

---

## 🟢 Lane PM (Execution-Level)

Purpose:
- Own a specific lane (feature or subsystem)
- Plan execution
- send structured Codex tasks

Examples:
- Cleanup Groups PM
- Analysis Rail PM

---

# 🔁 CORE RULE

PMs do NOT communicate with each other.

All communication happens through:
- CURRENT_STATE.md
- TODO.md
- ACTIVE_CHANGE_EVENTS.md
- PROJECT_MANAGER_CONTEXT.md

Lane-specific docs are supplemental only.
They must never override the control plane.
If a lane has been reset, superseded, or re-planned through the control plane, prior lane docs must be treated as historical/reference-only unless explicitly re-authorized.

When activation or turnover spans multiple worktrees:
- sync control-plane docs through docs-only sync first
- do not block PM activation on unresolved shared hot-file code merges
- route shared hot-file overlap into a separate Codex-assisted integration pass
- carry forward the preflight packet instead of handing Oliver a raw merge state

---

# 🚀 ACTIVATION (3 MESSAGE SYSTEM)

## 📌 Always use this structure

---

## 🟢 MESSAGE 1 — CONTROL PLANE

Attach:
- CURRENT_STATE.md
- TODO.md
- PROJECT_MANAGER_CONTEXT.md
- ACTIVE_CHANGE_EVENTS.md
- SYSTEM_MEMORY_MAP.md
- AGENTS.md
- CODEX_PROMPT_TEMPLATES.md

Purpose:
- establish system truth
- establish current work

Drafting rule:
- Message 1 must contain a real control-plane summary, not a generic instruction block.
- The PM must explicitly state:
  - current system state
  - active lane(s)
  - current active phase for the relevant lane
  - governing ACEs
  - what is complete vs still open
- Do NOT just restate “summarize current system state” as the message itself.

---

## 🟡 MESSAGE 2 — ORIENTATION

Attach:
- system_overview.md
- PM_ONBOARDING_BRIEF.md

Purpose:
- explain system
- prevent narrow thinking

Drafting rule:
- Message 2 must briefly interpret the platform orientation for the receiving PM.
- It must explain the system/lane relationship in plain language.
- Do NOT just restate “this is system-level context” without adding real explanatory framing.

---

## 🔴 MESSAGE 3 — CONTINUITY

### Message 3 — Execution Continuity (MANDATORY STRUCTURE)

The Project Manager MUST fill this out completely.

The PM must write this as a real turnover summary.
Do NOT copy the placeholders into the final message.
Every bullet must be replaced with actual lane-specific facts.

```
🚀 EXECUTION CONTINUITY

Lane: [INSERT LANE NAME]

Current State Snapshot (FACTUAL — no guessing):
- Completed:
  - [real completed items]
- Partially complete:
  - [real partial items]
- NOT started:
  - [real not-started items]

Verification State:
- Verified / accepted reality:
  - [real proven state only]
- Known verification failures or weak proof:
  - [what Codex missed / what Oliver caught / what remains weak]

Known Issues & Risks:
- [unstable surfaces]
- [regression risks]
- [misleading or incorrect UI states]

Active Constraints:
- [scope boundaries]
- [what must NOT change]
- [deferred work explicitly out of scope]

Canonical Runtime References (when applicable):
- [exact canonical routes]
- [required query params / identifiers]
- [known route pitfalls or identity requirements]

Last Codex Context:
- Reference the exact most recent PM REVIEW PACKET or Codex output
- Name the exact pass / slice / milestone it corresponds to
- State why it is the authoritative stopping point
- State the last valid execution context beyond the packet itself:
  - what was proven
  - what was assumed
  - what remains unresolved

Attachments (Oliver must attach these):
- LAST CODEX CONTEXT (PM REVIEW PACKET or final Codex output)
- 2–5 lane-specific docs ONLY if they are still execution-authoritative
- Current implementation/spec docs ONLY if they are not superseded by the control plane
- relevant CHANGELOG.md recovery entries ONLY when needed for deterministic replay of accepted fixes

If lane-specific docs have been superseded, reset, or replaced by control-plane truth:
- do NOT attach the superseded docs
- attach only the authoritative current materials
- explicitly state in the message that prior lane docs are superseded and must not be used as execution authority

- If the active lane depends on one or more recent accepted fixes:
  - identify the relevant CHANGELOG.md Recovery Contract entries
  - include them ONLY if needed for replay or regression recovery
  - do NOT attach unrelated changelog history


Your Task:
1. Identify the next highest-impact step
2. Explain:
   - what to do
   - why it is correct
   - how Codex should approach it
3. Use actual lane facts, not template language or placeholders

Rules:
- DO NOT write the Codex prompt yet
- DO NOT skip alignment with Oliver
- DO NOT assume missing context
- DO NOT reduce turnover to a retirement/activation note
- DO NOT leave any lane-critical state only in chat
- DO NOT omit verification failures, risks, or constraints
- If lane state is missing from the turnover ACE, the turnover is invalid

STOP and wait for Oliver
```

---

# 🧠 ACTIVATION RULE

Activation is complete when:
- PM understands system
- PM identifies next step
- PM waits for Oliver

---

# ✅ POST-ACTIVATION VALIDATION (MANDATORY)

After Message 3 is sent, the Project Manager must respond with:

1. Confirmation of understanding:
   - current system state
   - their role (Primary vs Lane)

2. Clear statement of:
   - what they believe the next step is
   - why that is the correct next step

3. Confirmation that they are:
   - waiting for Oliver
   - not executing Codex yet

Oliver must review this response before continuing.

## 🧾 TURNOVER ACE WRITING STANDARD (MANDATORY)

When retiring a PM or replacing a PM mid-lane, the outgoing PM must create or update an ACE entry that captures any lane-critical state that is still missing from the control plane.

This is an incremental capture requirement — not a requirement to rewrite or duplicate everything already logged.

The turnover ACE should capture:
- new activity since the last authoritative log/propagation point
- any state, decisions, constraints, risks, or verification findings that still exist only in the retiring PM session
- any corrections needed because prior logging was too thin to preserve continuity


The turnover ACE is NOT a simple turnover log.
It is the authoritative state-preservation artifact for any still-unlogged lane state that would otherwise be lost when the PM session is retired.

### 🚨 NEW GOVERNING TRUTH CHECK (MANDATORY)

Before retiring a PM or closing a Codex thread, the outgoing PM must explicitly determine whether PM review established any newly discovered governing product truth that is not yet reflected in the control plane.

Examples:
- the accepted defect surface is broader than the prior documented scope
- a visible defect now matters on additional workflow-driving surfaces
- a previously accepted narrow fix remains historically valid, but broader active truth now governs future execution

If newly discovered governing truth exists:
- it MUST be treated as blocking continuity work
- it MUST be propagated before the PM or Codex thread is retired
- it MUST NOT remain only in PM/Codex thread context

### 🔎 REQUIRED SOURCE CHECK — WHAT IS ALREADY LOGGED VS NOT YET LOGGED

Before writing the turnover ACE, the outgoing PM MUST explicitly check what the control plane already contains. ACTIVE_CHANGE_EVENTS.md is the primary comparison surface, but it is NOT sufficient by itself.

Minimum required comparison workflow:
1. Re-read [1mACTIVE_CHANGE_EVENTS.md[0m first as the primary ledger of active/open continuity
2. Re-read the relevant lane sections in:
   - [1mCURRENT_STATE.md[0m
   - [1mTODO.md[0m
   - [1mPROJECT_MANAGER_CONTEXT.md[0m
3. Re-read relevant [1mCHANGELOG.md[0m Recovery Contract entries only when the lane depends on recent accepted fixes or prior accepted verification baselines
4. Compare those authoritative logs against the current lane state still held in the PM session
5. Capture ONLY the lane-critical facts that are still missing, under-logged, or too thinly logged to preserve continuity

The outgoing PM must also compare current PM review conclusions against the control plane to determine whether any newly discovered governing truth is still missing from authoritative docs.

Best-practice priority order:
- ACTIVE_CHANGE_EVENTS.md = primary surface for what is active / still open / still changing
- CURRENT_STATE.md = current reality snapshot
- TODO.md = next-step truth
- PROJECT_MANAGER_CONTEXT.md = operating context and lane continuity framing
- CHANGELOG.md = accepted-fix recovery memory only when needed

Purpose:
- prevent accidental loss of unlogged state
- prevent unnecessary duplication of already-propagated history
- force a real quality check before retirement
- avoid false confidence from checking only ACTIVE_CHANGE_EVENTS.md when adjacent control-plane docs contain additional authoritative context

The outgoing PM must ask:
- What has already been logged clearly enough to preserve continuity?
- What is still only in this chat/session?
- What was logged too thinly and needs correction or expansion before retirement?
- Did PM review establish any broader or corrected governing truth that future threads must inherit from docs rather than chat memory?
- Does CHANGELOG.md contain a Recovery Contract or accepted-fix baseline that matters for deterministic recovery in this lane?

Minimum required content inside the turnover ACE:

Apply this requirement incrementally:
- DO include anything important that has not yet been logged into the control plane
- DO NOT restate or duplicate older state that is already captured accurately in prior ACE entries, CURRENT_STATE.md, TODO.md, CHANGELOG.md, or other authoritative control-plane docs
- If earlier logging already preserved a fact correctly, reference or preserve that earlier authority instead of rewriting it
- The PM MUST use [1mACTIVE_CHANGE_EVENTS.md[0m as the primary comparison surface, but MUST also cross-check CURRENT_STATE.md, TODO.md, and PROJECT_MANAGER_CONTEXT.md before deciding nothing new needs to be logged
- If current chat-held lane state does not appear in the active/control-plane records strongly enough to support recovery, it must be added before turnover
- evidence that the PM compared current chat-held state against existing control-plane logging before deciding what to add
- lane state snapshot:
  - completed
  - partially complete
  - not started
- verification state:
  - what is actually proven
  - what was falsely or weakly treated as complete
  - what Oliver caught that Codex missed
- known issues and risks
- active constraints and out-of-scope boundaries
- canonical runtime references when applicable
- last valid execution context
- recovered next step

A turnover ACE is INVALID if it only says things like:
- PM retired
- new PM activated
- protocol executed
- continue under existing ACE

Those may be included as metadata, but they do not satisfy state-capture requirements.

### Required principle

Before a PM session is retired, the outgoing PM must assume:
- anything NEW that is not captured in the turnover ACE or control plane will be lost
- the incoming PM must be able to recover the lane without relying on the retired chat session
- already-propagated state does not need to be duplicated just because a turnover is happening
- the turnover ACE is for preserving missing continuity, not for rewriting the entire lane history
- the outgoing PM must actively compare current session state against ACTIVE_CHANGE_EVENTS.md first, then the related control-plane docs, before deciding that nothing new needs to be logged
- if PM review changed what should govern future execution, that governing truth must be propagated before thread retirement or replacement

---

# 🔁 CLOSING THE LOOP (CRITICAL)

Whenever system truth changes:
This includes newly discovered governing product truth established during PM review, not just implementation outputs.

1. PM logs change in ACTIVE_CHANGE_EVENTS.md
2. PM runs change_propagation_pass
3. Codex updates all docs

### Accepted-Fix Propagation Rule

If the change being logged includes an accepted fix:
- the PM must ensure a Recovery Contract exists in CHANGELOG.md
- the ACE must reference that contract
- do NOT duplicate the full recovery contract across control-plane docs

CHANGELOG.md is the authoritative recovery ledger for accepted fixes.

If Codex made the change:
- docs are updated automatically

If humans made the decision:
- MUST log change event

If the immediate goal is only control-plane or operating-doc alignment between `main` and a worktree:
- use docs-only sync
- do not force a full merge just to prepare activation or turnover

If a full merge becomes unsafe because shared hot files overlap:
- preserve resolved docs
- abort the merge
- complete docs-only sync
- handle shared hot-file integration separately

If classification = `hot_file_integration_required`:
- full git merge is prohibited
- the next PM handoff must include the preflight packet from `07_reference/Shared_Hot_File_Merge_Protocol.md`

If Codex fails the same hot-file integration twice:
- stop
- return to PM for decision
- do not retry blindly

`ACE-011` is the completed historical recovery example for this path.

### Phase & Thread Transition Enforcement

When closing a phase OR retiring a PM:
- phase transitions must be explicitly logged (no implicit activation)
- control-plane alignment must be complete BEFORE any new thread begins
- a new PM must never rely on chat memory for continuity

---

# 🚨 DRIFT DETECTION

Red flags:
- no doc updates mentioned
- no PM REVIEW PACKET
- CURRENT_STATE outdated
- missing change events

If detected:
👉 re-run with correct Skill

---

# 🧩 WHEN TO CREATE A NEW PM

Create a new Lane PM when:
- working in parallel lanes
- task is complex
- risk of drift is high

Otherwise:
- use existing PM

---


# 🏁 WHEN TO RETIRE A PM

Retire when:
- lane is complete
- chat becomes slow
- context becomes unclear

Before retiring:
1. ensure docs are updated
2. run change_propagation_pass if needed
3. capture final state in control plane
4. compare current session state against ACTIVE_CHANGE_EVENTS.md and other control-plane docs to identify any missing continuity that still needs to be logged
5. explicitly determine whether PM review established newly discovered governing truth that must be propagated before retirement

### 🧠 TURNOVER ACE REQUIREMENT — FULL STATE CAPTURE (CRITICAL)

The turnover ACE entry MUST NOT be treated as a simple event log.

It MUST function as a **full lane-state capture before session retirement**.
This means a full capture of any lane-critical state that is still missing from authoritative logs at the moment of retirement.
It does NOT mean rewriting all previously logged lane history.

To determine what is still missing, the outgoing PM must compare the current lane state in chat against `ACTIVE_CHANGE_EVENTS.md` and the other control-plane docs before finalizing the turnover ACE.

Purpose:
- prevent loss of context that exists only in the outgoing PM session
- ensure deterministic recovery for the incoming PM
- eliminate reliance on chat memory

#### REQUIRED STRUCTURE (NON-NEGOTIABLE)

Every turnover ACE MUST include, for any still-unlogged lane-critical state:
- only after the PM has performed an explicit comparison against existing control-plane logging

1. **Lane State Snapshot (MANDATORY)**
   - Completed (verified only — not assumed)
   - Partially complete (with exact gaps)
   - NOT started

2. **Verification State (MANDATORY)**
   - what Codex claimed complete vs what was actually verified
   - any failures caught by Oliver
   - any known weak or incomplete verification passes

3. **Known Issues & Risks (MANDATORY)**
   - unstable surfaces
   - regression risks
   - known incorrect or misleading UI states

4. **Active Constraints (MANDATORY)**
   - scope boundaries
   - what must NOT change
   - deferred work explicitly out of scope

5. **Canonical Runtime References (MANDATORY when applicable)**
   - exact routes used for verification
   - required query params / identifiers
   - known route pitfalls (missing identity, etc.)

6. **Last Valid Execution Context (MANDATORY)**
   - last correct Codex pass or PM REVIEW PACKET
   - what made it authoritative
   - what was proven vs assumed

7. **Next Step (RECOVERED — NOT GUESSED)**
   - must be derived from control-plane + state
   - must NOT rely on chat memory

#### PROHIBITED TURNOVER BEHAVIOR

The following is NOT allowed:
- writing a turnover ACE as a simple status or activation note
- omitting lane state because "it's in chat"
- duplicating already-propagated lane history just because a turnover is happening
- assuming the next PM will infer context
- treating turnover as procedural instead of state-preserving

If any required section above is missing:
- the turnover is INVALID
- the PM MUST revise the ACE entry before retirement

#### PRINCIPLE

The turnover ACE is the **last chance to extract system state before destroying the session**.

If it is not captured here:
- it is lost
- the system regresses into re-diagnosis
- control-plane integrity is broken

### 🔒 TURNOVER ALIGNMENT RULE (CRITICAL)

Before activating a new Project Manager (including mid-lane replacement due to chat limits), the outgoing PM must ensure that NO critical state remains only in chat.

The PM must verify:
- all approved plans are captured in the control plane
- the current ACTIVE phase is explicitly set
- the next executable step is defined in TODO.md
- ACTIVE_CHANGE_EVENTS.md reflects the governing ACE and any new decisions
- any newly discovered governing truth from PM review has been propagated and is no longer thread-local only

If any of the above are NOT true:
- the PM MUST log/update the relevant change event
- the PM MUST run `change_propagation_pass`
- Codex MUST propagate updates across all control-plane docs

Only AFTER control-plane alignment is complete may a new PM be activated.

This prevents:
- context loss between PM instances
- Codex execution blocking
- invalid thread starts

### 🔁 TURNOVER ACE ENFORCEMENT EXTENSION

Control-plane alignment is NOT complete unless the turnover ACE also satisfies the FULL STATE CAPTURE requirement.

Alignment requires BOTH:
- control-plane docs are updated
- turnover ACE contains complete lane-state capture

If either is missing:
- PM activation MUST be blocked
- a correction pass is required before proceeding

The same blocking rule applies if PM review established broader or corrected governing truth that was not yet propagated into ACTIVE_CHANGE_EVENTS.md, CURRENT_STATE.md, TODO.md, and PROJECT_MANAGER_CONTEXT.md when needed.

---

# 🎯 SIMPLE WORKFLOW

Talk → Decide → Log → Skill → Codex → Review

---

# 🧠 OLIVER ROLE

Oliver:
- decides direction
- reviews output

Oliver does NOT:
- manage docs
- track propagation manually

---

# 🔥 FINAL PRINCIPLE

The system is the source of truth.

Not chat.

---

# 📩 COPY / PASTE ACTIVATION MESSAGES

---

## 👤 OLIVER ACTIONS (ATTACHMENTS)

For each message, Oliver is responsible for attaching the files listed below.

- The Project Manager drafts the message content.
- Oliver attaches the required documents and sends the message.

Message 1 attachments (Control Plane):
- CURRENT_STATE.md
- TODO.md
- PROJECT_MANAGER_CONTEXT.md
- ACTIVE_CHANGE_EVENTS.md
- SYSTEM_MEMORY_MAP.md
- AGENTS.md
- CODEX_PROMPT_TEMPLATES.md

Message 2 attachments (Orientation):
- system_overview.md
- PM_ONBOARDING_BRIEF.md
- Optional: visuals/screenshots if needed

Message 3 attachments (Execution Continuity):
- LAST CODEX CONTEXT (PM REVIEW PACKET or final Codex response)
- 2–5 lane-specific docs only if they are still execution-authoritative
- current implementation/spec docs for that lane only if they are not superseded
- if the lane was reset or rebuilt from the control plane, do NOT attach superseded docs; rely on control-plane truth plus current authoritative materials only

---

## 🟡 PRIMARY PM — ACTIVATION

Drafting standard for all 3 messages:
- The PM must convert the templates into real filled-out messages.
- The PM must not send generic instruction language as the final activation draft.
- If a message still reads like a template, Oliver should reject it and require a redraft.

### Message 1 — Control Plane

```
/resume_role

You are the PRIMARY PROJECT MANAGER for the AI Agent Platform.

Load Control Plane:
- CURRENT_STATE.md
- TODO.md
- PROJECT_MANAGER_CONTEXT.md
- ACTIVE_CHANGE_EVENTS.md

Summarize:
- current system state
- active lanes
- active change events

Confirm:
- Oliver → PM → Codex model
- use of Skills + AGENTS.md + SYSTEM_MEMORY_MAP

Do NOT propose execution.

End with:
"Ready for orientation."
```

---

### Message 2 — Orientation

```
This is system-level context.

This is NOT execution.

This platform includes:
- Workspaces (Gmail is one)
- RAG system
- LLM system
- Agent runtime

You must reason at system level first.

Do NOT propose execution.

End with:
"Ready for continuity."
```

---

### Message 3 — Strategic Role

```
You are NOT a lane PM.

Your role:
- answer system-level questions
- interpret Control Plane
- guide decisions

You do NOT:
- run Codex automatically
- manage feature lanes

Confirm your role and wait for Oliver.

After responding, provide a brief confirmation that you are fully aligned and waiting for Oliver.
```

---

## 🟢 LANE PM — ACTIVATION

Drafting standard for all 3 messages:
- The PM must convert the templates into real filled-out messages.
- The PM must not send generic instruction language as the final activation draft.
- If a message still reads like a template, Oliver should reject it and require a redraft.

### Message 1 — Control Plane

(Same as Primary PM Message 1)

---

### Message 2 — Orientation

(Same as Primary PM Message 2)

---

### Message 3 — Execution Continuity

```text
🚀 EXECUTION CONTINUITY

Lane: [INSERT LANE NAME]

Current State Snapshot (FACTUAL — no guessing):
- Completed:
  - [real completed items]
- Partially complete:
  - [real partial items with exact gaps]
- NOT started:
  - [real not-started items]

Verification State:
- Verified / accepted reality:
  - [real proven state only]
- Known verification failures or weak proof:
  - [what Codex missed / what Oliver caught / what remains weak]

Known Issues & Risks:
- [unstable surfaces]
- [regression risks]
- [misleading or incorrect UI states]

Active Constraints:
- [scope boundaries]
- [what must NOT change]
- [deferred work explicitly out of scope]

Canonical Runtime References (when applicable):
- [exact canonical routes]
- [required query params / identifiers]
- [known route pitfalls or identity requirements]

Last Codex Context:
- [exact PM REVIEW PACKET or final Codex output]
- [why it is the authoritative stopping point]
- [what was proven vs assumed vs unresolved]

Attach:
- LAST CODEX CONTEXT (PM REVIEW PACKET or final Codex output)
- 2–5 lane-specific docs only if they are still execution-authoritative
- if prior lane docs were superseded by the control plane, do NOT attach them; state clearly that control-plane truth is authoritative for this activation
- relevant CHANGELOG.md Recovery Contract entries ONLY when needed for deterministic replay

Your task:
1. Identify the next highest-impact step
2. Explain what to do
3. Explain why it is correct
4. Explain how Codex should approach it

Rules:
- DO NOT write Codex prompt yet
- DO NOT reduce turnover to a retirement/activation note
- DO NOT rely on prior chat context
- WAIT for Oliver

After responding, confirm alignment and wait for Oliver before any Codex execution.
```

---

## 🔁 CONTINUITY MESSAGE (WHEN RESUMING WORK)

```
Resume from Control Plane.

Re-read:
- CURRENT_STATE.md
- TODO.md
- ACTIVE_CHANGE_EVENTS.md

Identify:
- where work stopped
- next highest-impact step

Do NOT assume prior chat context.
```

---

## 🏁 CLOSEOUT MESSAGE (RETIRING PM)

```text
Provide final closeout summary:

- completed work (verified only — not assumed)
- partially complete work with exact gaps
- not-started work still relevant to the lane
- verification failures or weak proof still open
- known risks / unstable surfaces
- active constraints / what must NOT change
- canonical runtime references when needed
- recommended next step recovered from control-plane truth

Ensure BEFORE stopping:
- CURRENT_STATE updated
- TODO updated
- ACTIVE_CHANGE_EVENTS updated
- turnover ACE contains full lane-state capture

Then stop.
```

Confirm that control-plane alignment is complete before stopping.

The retiring PM must write this as a real closeout summary with actual completed work, open work, risks, and next step — not as a copied template.

The retiring PM must also ensure the turnover ACE is a state-preservation artifact, not a simple retirement note. If lane-critical facts remain only in chat, the turnover is incomplete and must not proceed.

```md
### Accepted-Fix Closeout Requirement (CRITICAL)

If the retiring PM closed out or validated an accepted fix, they must ensure:
- a Recovery Contract exists in CHANGELOG.md for that fix
- the corresponding ACE entry references it using:
  - `Recovery Contract: CHANGELOG -> <entry>`

A fix is not considered fully closed at turnover without recovery-contract capture.
```

---

## 🔥 RULE

If you are unsure what to send:
👉 Use these templates exactly
👉 Do NOT improvise
👉 If unsure, the Project Manager must draft the message first and Oliver reviews before sending.

---

# ✅ TURNOVER VALIDITY CHECK

Before retiring a PM or activating a replacement PM, verify ALL of the following:

- control-plane docs are updated
- the outgoing PM explicitly compared current session state against ACTIVE_CHANGE_EVENTS.md, CURRENT_STATE.md, TODO.md, PROJECT_MANAGER_CONTEXT.md, and relevant CHANGELOG.md Recovery Contracts when needed
- the turnover ACE includes full lane-state capture
- the turnover ACE includes any missing continuity discovered by that comparison
- any newly discovered governing truth from PM review has been explicitly propagated before retirement / replacement when it changes future execution authority
- verification failures / weak proof are explicitly captured
- current constraints and out-of-scope boundaries are explicit
- canonical routes / identifiers are captured when relevant
- the next step can be recovered without the retired chat

If any item above is false:
- the turnover is not valid
- PM retirement must be blocked until corrected

# 🧠 FINAL PRINCIPLE (READ THIS FIRST EVERY TIME)

This is NOT a loose template.

This is a structured handoff protocol.

If messages are vague, incomplete, or missing context:
👉 The system will drift.

If messages are precise and complete:
👉 The system stays aligned and fast.

The Project Manager is responsible for precision.
Oliver is responsible for approval.

---
