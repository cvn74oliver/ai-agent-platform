# turnover_pack_builder

## Purpose
Generate a minimal, correct Project Manager activation package for fast turnover.

## Rules
- Follow agent_activation_checklist.md
- Do NOT overload context
- Always use SYSTEM_MEMORY_MAP.md for routing

## Mode & Preconditions (CRITICAL)
- This skill runs in EXECUTION MODE for packaging and summarization only.
- It MUST NOT introduce new decisions, plans, or system changes.
- If the control plane is not aligned, STOP and request a change propagation pass before building the turnover package.
- If phase state is unclear or inconsistent, STOP and request clarification.
- If any material unpropagated state exists (governing truth, accepted-fix capture, approved plan, phase state, or material implementation state), STOP and require a Change Propagation Pass before building the turnover package.

## Steps

1. Load control plane:
   - CURRENT_STATE.md
   - TODO.md
   - PROJECT_MANAGER_CONTEXT.md
   - ACTIVE_CHANGE_EVENTS.md

2. Summarize (accurate, not inferred):
   - current system state from control plane (not memory)
   - active changes and governing ACEs
   - current ACTIVE phase (must be explicit, not implied)

3. Identify (strictly from control plane):
   - next immediate executable task (from TODO.md)
   - required domain documents (2–5 max, only what is needed)
   - confirm that the next step is valid and phase is ACTIVE

3.1 Checkpoint Gate (CRITICAL):
   - determine whether any unpropagated state exists:
     - governing truth
     - phase state
     - approved plan
     - accepted-fix state
     - material implementation state
   - if any of the above exists and is not reflected in the control plane:
     - STOP
     - require a Change Propagation Pass
     - do NOT proceed with turnover packaging

4. Build activation package:

Message 1 (Control Plane):
- PROJECT_MANAGER_CONTEXT.md
- CURRENT_STATE.md
- TODO.md
- ACTIVE_CHANGE_EVENTS.md
- SYSTEM_MEMORY_MAP.md
- AGENTS.md
- include CHANGELOG.md when the active lane depends on recent accepted fixes

Message 2 (Orientation):
- system_overview.md
- PM_ONBOARDING_BRIEF.md

Message 3 (Execution Continuity):
- last Codex context
- task-specific docs (2–5 max)
- relevant CHANGELOG.md recovery entries (ONLY if needed for deterministic recovery)
- next-step recommendation

Recovery Ledger Rule (MANDATORY when applicable):
- If the active lane depends on one or more recent accepted fixes:
  - identify the relevant CHANGELOG.md Recovery Contract entries
  - include them in Message 3 ONLY if they are required for replay or regression recovery
  - do NOT attach unrelated or historical changelog entries
- CHANGELOG.md is the authoritative recovery source for accepted fixes; do not attempt to reconstruct recovery logic from chat or memory

5. Return:
   - ready-to-send 3-message activation package
   - explicit statement of:
     - current ACTIVE phase
     - next executable step
   - confirmation that control-plane alignment is complete
   - checkpoint classification (MANDATORY):
     - must explicitly state:
       - `Checkpoint Status: none`
     - confirm that no propagation is required before turnover or next-thread activation
   - no extra documents

## Enforcement Notes
- Turnover packages must be reconstructable from control-plane documents alone.
- Any missing or ambiguous state is a failure and must be resolved before returning.
- Do NOT carry forward assumptions from prior threads.
- The next PM must be able to execute immediately without re-planning.
- If a lane depends on recent accepted fixes, failure to include the relevant CHANGELOG recovery context is considered an incomplete turnover.
- Turnover must preserve not just state, but recovery capability for accepted fixes.
- Turnover is invalid if checkpoint closure conditions are not satisfied.
- A turnover package must not be generated if `Checkpoint Status: propagation required before closeout` would apply.