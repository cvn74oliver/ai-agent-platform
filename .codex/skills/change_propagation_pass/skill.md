# change_propagation_pass

## Purpose
Propagate a logged change event across all affected documentation and system layers.

## Rules
- Follow ACTIVE_CHANGE_EVENTS.md as the source of truth
- Do NOT introduce new changes
- Only propagate existing decisions

## Protected Files (CRITICAL — DO NOT MODIFY)

The following files are architect-controlled and must be treated as read-only unless Oliver explicitly authorizes edits in the current pass:

- AGENTS.md
- CODEX_PROMPT_TEMPLATES.md
- any `SKILL.md` file under `/Users/olivercarlin/.codex/skills/`
- ControlPlaneArchitectActivationAndTurnoverProtocol.md
- Project Manager Activation and Turnover Protocol.md
- One Command Activation Message for Agent Turnovers.md
- AGENT_TURNOVER_READINESS_CHECK.md

Rules:
- Codex must NOT reopen, rewrite, or "improve" protected files during propagation passes.
- Protected files may only be edited if they are explicitly listed in the propagation scope.
- If Codex determines a protected file needs modification but it is not in scope:
  - STOP execution
  - explain why the change is required
  - wait for explicit approval before proceeding

A protected-file violation is considered a system-integrity failure.

## Mode & Preconditions (CRITICAL)
- This skill runs in EXECUTION MODE for documentation/control-plane updates only.
- It MUST NOT introduce new product behavior or code changes.
- If the target change event is not Active or scope is unclear, STOP and request clarification.
- If the propagation depends on a phase transition, ensure the next phase is explicitly ACTIVE in CURRENT_STATE.md (not implied).
- If control-plane alignment is incomplete, complete propagation before any new thread is allowed to start.
- Default reasoning tier: MEDIUM for propagation passes unless explicitly justified otherwise.
- Prefer batching updates at defined checkpoints; avoid multiple propagation passes for closely related micro-steps within the same thread.

## Steps

1. Load:
   - ACTIVE_CHANGE_EVENTS.md
   - CURRENT_STATE.md
   - TODO.md
   - PROJECT_MANAGER_CONTEXT.md

2. Select target change event:
   - confirm event is Active
   - confirm propagation scope is explicit (docs to update are known)
   - identify if this includes:
     - approved-plan capture
     - phase closeout
     - phase activation
   - identify whether this propagation includes an accepted-fix closeout that requires a Recovery Contract in CHANGELOG.md
   - detect whether PM review introduced newly discovered governing product truth that is not yet captured in the control plane
   - if newly discovered governing truth exists and is not reflected in ACTIVE_CHANGE_EVENTS.md:
     - expand the propagation scope to include creating or updating the governing ACE for that truth
     - DO NOT proceed with a partial propagation that omits this truth

2.1 No-op / Short-Circuit Check (CRITICAL)
   - if all target documents already reflect the intended state:
     - DO NOT perform redundant writes
     - return a no-op summary instead
   - if only a subset requires updates:
     - update only the minimal necessary files

3. Identify:
   - listed documents
   - any additional affected docs
   - explicitly confirm that no protected files are included in the propagation set unless authorized

4. Update:
   - do NOT modify any protected files unless explicitly included in scope
   - minimize write scope:
     - update only sections that require change
     - avoid rewriting entire documents when a scoped edit is sufficient
   - all listed documents
   - CURRENT_STATE.md
   - TODO.md
   - PROJECT_MANAGER_CONTEXT.md
   - if phase transition is involved:
     - mark prior phase CLOSED (if applicable)
     - mark next phase explicitly ACTIVE
     - ensure TODO reflects the first executable step of the active phase
   - if this propagation includes an accepted fix:
     - ensure CHANGELOG.md contains the corresponding Recovery Contract
     - ensure the completed ACE entry includes:
       - `Recovery Contract: CHANGELOG -> <entry>`
   - Governing truth capture (MANDATORY when applicable):
     - if PM review established broader or corrected governing truth, ensure:
       - ACTIVE_CHANGE_EVENTS.md contains a new or updated ACE representing the active governing truth
       - CURRENT_STATE.md reflects the corrected/broader governing truth
       - TODO.md reflects the next step under the new governing truth
       - PROJECT_MANAGER_CONTEXT.md is updated if execution rules or scope boundaries changed
     - preserve any historical accepted-fix truth as historical context; do NOT overwrite it when it remains valid historically

5. Validate (MANDATORY):
   - consistency across all updated documents
   - no conflicting statements remain
   - CURRENT_STATE, TODO, ACTIVE_CHANGE_EVENTS, and PROJECT_MANAGER_CONTEXT all agree on:
     - active phase
     - next step
     - governing ACE
   - no “intended but not logged” states exist
   - efficiency validation:
     - confirm no redundant propagation work was performed
     - confirm updates were limited to the minimal necessary scope
   - if this pass includes an accepted fix:
     - CHANGELOG.md contains a Recovery Contract with:
       - Accepted invariant
       - Source layer fixed
       - Touched files/functions
       - Canonical verification route
       - Acceptance proof
       - Replay steps
       - Rollback guidance
     - ACTIVE_CHANGE_EVENTS.md points to that CHANGELOG recovery entry
   - governing truth validation:
     - confirm no newly discovered governing truth remains only in PM/Codex thread context
     - confirm ACTIVE_CHANGE_EVENTS.md reflects the active governing truth (not just historical narrow fixes)
     - confirm CURRENT_STATE.md and TODO.md are aligned with that governing truth
   - checkpoint closure validation (CRITICAL):
     - confirm no unpropagated governing truth remains
     - confirm no pending accepted-fix capture remains
     - confirm no phase-state inconsistency remains
     - confirm no deferred plan capture remains

6. Update event:
   - mark completed propagation items
   - update status if fully propagated
   - if this pass captured an approved plan or phase activation:
     - ensure the event clearly reflects the next execution step
   - if this pass closed out an accepted fix:
     - include `Recovery Contract: CHANGELOG -> <entry>` in the completed ACE entry
   - if this pass captured newly discovered governing truth:
     - ensure the ACE clearly distinguishes between:
       - historical accepted-fix truth
       - newly active governing truth
     - ensure the ACE explicitly governs future execution scope

7. Return:
   - summary of updates
   - files modified
   - explicit statement of:
     - current ACTIVE phase
     - next executable step
   - confirmation that control-plane alignment is complete
   - remaining propagation items (if any)
   - checkpoint classification (MANDATORY):
     - explicitly declare:
       - `Checkpoint Status: none`
     - confirm that no propagation is required before thread closeout or next-thread execution

If propagation requires creating new documents, Codex must create them following system naming conventions and update SYSTEM_MEMORY_MAP.md if routing changes.

## Enforcement Notes
- Incomplete propagation is considered a system failure.
- Control-plane alignment must be achieved before any new execution thread begins.
- Propagation is incomplete if newly discovered governing product truth from PM review is not captured in the control plane before thread closeout or next-thread activation.
- It is invalid to begin a new Codex thread when governing truth exists only in thread memory and not in ACTIVE_CHANGE_EVENTS.md, CURRENT_STATE.md, TODO.md, or PROJECT_MANAGER_CONTEXT.md.
- Propagation must remove ambiguity; “intended but not logged” states are not allowed.
- Propagation is incomplete if checkpoint closure conditions are not satisfied.
- A thread must not be closed until propagation establishes `Checkpoint Status: none`.
- Efficiency optimization must not remove required propagation checkpoints; it only reduces redundant or repeated propagation work within the same thread.
- Accepted-fix propagation is incomplete until the Recovery Contract exists in CHANGELOG.md and the ACE points to it.
- CHANGELOG.md is the authoritative recovery ledger for accepted fixes; do not duplicate the full contract across control-plane docs.
- Any attempt to modify a protected file without explicit scope authorization must be treated as a blocking error.