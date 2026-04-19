# Codex Prompt Templates

## Purpose
This file standardizes how the Project Manager communicates with Codex.

It ensures:
- consistent execution
- no ambiguity
- proper use of Skills
- predictable outcomes

---

## Control Plane Requirement (MANDATORY)

Before executing any task, Codex MUST load the control plane:

- CURRENT_STATE.md
- TODO.md
- PROJECT_MANAGER_CONTEXT.md
- ACTIVE_CHANGE_EVENTS.md


Codex must not assume system state outside these files.

For any non-trivial Codex prompt, the Project Manager should explicitly list these files in the prompt rather than relying on the phrase "load the control plane" by itself.

Preferred pattern inside prompts:

```text
Control Plane (MANDATORY — load ALL):
- CURRENT_STATE.md
- TODO.md
- PROJECT_MANAGER_CONTEXT.md
- ACTIVE_CHANGE_EVENTS.md
```

Do NOT assume Codex will infer the exact file set from the phrase "control plane" alone.

### Minimal Context Framing (EFFICIENCY)

For manual workflows, the PM should include only the minimum context required to execute the task.

Preferred pattern:
- working area (feature / file)
- last known result
- current issue
- exact objective

Avoid pasting large context blocks when not required.

### Same-Thread Control Plane Carry-Forward (CRITICAL)

Full control-plane listing is mandatory for NEW threads.

Within the SAME thread, if control-plane state has not materially changed, the PM may use a compact carry-forward instead of re-listing all files.

Allowed forms:
- `Control plane unchanged`
- OR a compact delta block naming only changes

Minimum delta block when used:
- active ACE
- active phase
- last propagated point
- governing-truth change status
- accepted-fix change status
- execution scope continuity

If any of the above is unclear or changed:
- revert to full control-plane listing


### PLAN → EXECUTION Same-Flow Clarification (CRITICAL)

A transition from `PLAN MODE` to `EXECUTION MODE` within the SAME governed flow does NOT by itself require a full control-plane reload.

If ALL of the following remain unchanged:
- governing ACE
- active phase
- approved execution scope
- accepted-fix status
- governing-truth status

Then the execution pass MUST be treated as:
- same-thread continuation
- same governed runtime flow
- NOT a new control-plane load boundary

Rules:
- Do NOT reload the full control plane solely because the mode changed from PLAN → EXECUTION
- Do NOT reload the full control plane solely because a new message is sent in the same thread
- Skill changes (e.g., adding Playwright) do NOT require full reload if the governed flow is unchanged

Use:
- `Control plane unchanged`
- OR a compact delta block

ONLY use full control-plane reload when a genuine new governed flow begins.


Important distinction:
- A fresh chat/UI thread does NOT automatically mean a new governed runtime flow
- A new governed runtime flow is defined by changes in ACE, phase, scope, or governing truth

Project Managers must not treat interface resets as control-plane reload triggers.

## AGENTS.md Requirement (MANDATORY)

For any non-trivial Codex task, Codex MUST also load:

- `AGENTS.md`

Reason:
- `AGENTS.md` defines behavioral enforcement, stop conditions, documentation cadence, and skill-loading rules.

If a task is complex enough to use one of the templates below, `AGENTS.md` must be treated as part of the required execution context.

Best practice: include `AGENTS.md` explicitly in the prompt attachment/context list rather than assuming Codex will infer it from the template alone.

---

### Runtime Guardrail Context Requirement (CRITICAL)

For any task involving runtime behavior, artifact state, polling, Smart Sync, or inbox-analysis:

Codex MUST treat AGENTS.md guardrail rules as enforcement, not guidance.

Specifically:
- Runtime Load Declaration Rule MUST be followed
- Runtime Lifecycle Verification Rule MUST be followed
- Guardrail-sensitive scope rules MUST be enforced

If these rules are not explicitly satisfied in the prompt:
- Codex MUST STOP and request clarification before proceeding

### Playwright CLI Skill Routing (CRITICAL)

For runtime/UI verification work, the PM should explicitly consider whether Codex should also load the Playwright CLI Skill.

Use Playwright when the pass requires:
- real browser interaction
- terminal-driven runtime verification
- multi-step UI flow exercise
- screenshot capture from the actual runtime surface
- route/state confirmation through live browser automation

Preferred skill reference:
- Skill: playwright
- Skill Location: /Users/olivercarlin/.codex/skills/playwright/SKILL.md

Rule:
- Playwright should be treated as the preferred browser-automation verification tool when the verification path is reasonably executable through terminal-driven browser control.
- Playwright does NOT replace `implementation_pass`; it is loaded in addition when runtime/UI verification needs real browser automation.
- If runtime/UI verification is in scope and Playwright is not used, the PM should make that omission intentional rather than implicit.

## Mode Requirement (MANDATORY)

Every non-trivial Codex task should explicitly state the operating mode:

- `PLAN MODE` = Codex returns a plan only and must not execute changes
- `EXECUTION MODE` = Codex is allowed to implement scoped changes

If mode is not specified, default to:
- `EXECUTION MODE` for implementation, propagation, or integration work
- `PLAN MODE` only when the PM is explicitly requesting analysis, planning, or design before approval

### Mode Selection Guidance (IMPORTANT)

- `PLAN MODE` is REQUIRED for:
  - core logic changes
  - grouping / decision-model changes
  - data-model or contract changes
  - migrations
  - rebuilds
  - phase-level implementation changes
  - anything likely to break runtime behavior if executed incorrectly
  - any guardrail-sensitive runtime change (load shape, polling, artifact lifecycle)

- `PLAN MODE` is OPTIONAL for:
  - audits
  - validation passes
  - propagation passes
  - tightly scoped, low-risk, reversible implementation work

- `EXECUTION MODE` is allowed only when:
  - the task is fully defined
  - no design ambiguity exists
  - scope is constrained
  - rollback is simple or the change is easily reversible

- If uncertain, default to `PLAN MODE`.

- Control-plane alignment does NOT replace execution QA.
  - The control plane preserves continuity and active truth.
  - `PLAN MODE` remains the primary QA mechanism for high-risk work.

- If the prompt explicitly includes constraints like:
  - "NO code changes"
  - "analysis only"
  - "deliverable = evaluation"

  then `PLAN MODE` MUST be used.

### Retry / Rework Guard (CRITICAL)

If a prior execution attempt failed:
- DO NOT immediately retry in EXECUTION MODE
- switch to PLAN MODE
- diagnose the failure
- produce a constrained next step before re-execution

### Reasoning Tier Optimization (CRITICAL)

Default to the lightest reasoning tier that safely fits the task.

MEDIUM:
- propagation passes
- doc updates
- audits
- turnover preparation
- small bounded edits

HIGH:
- standard implementation
- runtime debugging after problem class is locked
- validation passes

EXTRA-HIGH:
- root-cause analysis
- cross-layer ambiguity
- architecture changes

Rule:
- avoid HIGH when MEDIUM is sufficient
- avoid EXTRA-HIGH when HIGH is sufficient

### Default Reasoning Strategy (EFFICIENCY)

- MEDIUM is the default for most tasks
- HIGH only when implementing or debugging within a locked problem class
- EXTRA-HIGH only when root cause or architecture is unclear

Avoid using HIGH/EXTRA-HIGH for:
- propagation
- doc updates
- summaries
- bounded edits

### Runtime Guardrail Reasoning Rule (CRITICAL)

If a task touches any of the following:
- runtime continuity
- artifact publication
- polling behavior
- Smart Sync lifecycle
- inbox-analysis request orchestration

Then reasoning tier MUST be:
- HIGH if the problem class is already locked
- EXTRA-HIGH if lifecycle edge, load shape, or enforcement layer is unclear

MEDIUM must NOT be used for:
- runtime guardrail design
- runtime lifecycle diagnosis
- artifact truth reconciliation

Reason:
These classes directly impact system stability and Supabase load safety.

### Threading Preference For High-Risk Work (IMPORTANT)

For high-risk work, the preferred flow is:
- `PLAN MODE` → approval → `EXECUTION MODE` in the SAME thread

Why:
- same-thread continuation preserves the strongest execution context
- it reduces quality loss between planning and implementation
- it lowers the chance of drift on nuanced or high-impact work

Split-thread execution is still allowed when needed, but only if:
- the approved plan is captured in the control plane first
- the implementation thread can recover the plan from docs alone

## Approved Plan Capture Rule (CRITICAL)

If a `PLAN MODE` task produces an approved plan that will be executed later in a separate thread or separate pass, that approved plan must NOT remain thread-local only.

Before the implementation thread begins, the approved plan must be captured into the control plane through a dedicated propagation/logging step.

Minimum requirement:
- log or update the relevant entry in `ACTIVE_CHANGE_EVENTS.md`
- propagate the approved plan/decision into the required control-plane docs
- ensure a future thread can recover the approved plan from docs, not from chat memory

Do NOT allow this workflow:
1. Codex produces a plan in `PLAN MODE`
2. Oliver/PM approves the plan in chat
3. thread is closed
4. a new implementation thread starts without the approved plan being recorded in the control plane

That workflow is invalid because it breaks continuity and creates hidden context loss.

## Pre-Thread Control Plane Alignment (CRITICAL)

Before issuing ANY new Codex thread or execution prompt, the Project Manager MUST verify that the control plane is fully aligned with the current approved state.
This includes explicit phase activation when a prior phase was just closed and a next phase is intended.

Alignment requires:
- CURRENT_STATE.md reflects the current phase and active step
- TODO.md reflects the exact next step to execute
- ACTIVE_CHANGE_EVENTS.md reflects the governing change event
- PROJECT_MANAGER_CONTEXT.md is consistent with current execution rules
- any newly discovered governing product truth from PM review has been propagated and is no longer thread-local only
- if the prior phase was closed, the next phase is explicitly marked ACTIVE rather than merely intended
- if same-thread carry-forward is being used, confirm no material control-plane state has changed since last propagation

If any of the above are NOT true:
- a Change Propagation Pass MUST be executed first
- the new thread MUST NOT begin until propagation is complete

### Newly Discovered Governing Truth Rule (CRITICAL)

If PM review establishes a new governing product truth, accepted defect surface, broader product expectation, or newly active constraint that was not yet captured in the control plane, that truth MUST be propagated before any new Codex thread begins.

Examples:
- PM review discovers the accepted defect is broader than the prior documented scope
- PM review discovers that a visible defect matters on additional workflow-driving surfaces
- PM review determines a previously accepted fix remains historically valid but is no longer the full active governing truth

Required behavior:
- treat the newly discovered truth as active system truth, not thread-local memory
- run a Change Propagation Pass first
- block any new Codex implementation or validation thread until propagation is complete

Invalid workflow (STRICTLY PROHIBITED):
1. Plan is approved
2. Control plane is NOT updated
3. A new Codex thread is started

This will cause execution blocking and is considered a system failure.

Another invalid workflow (STRICTLY PROHIBITED):
1. A phase is closed
2. The next phase is intended but not explicitly activated in the control plane
3. A new Codex thread is started

---

# 1. Implementation Pass

Feature Domain: [DOMAIN]  
Reasoning Level: [LOW / MEDIUM / HIGH / EXTRA-HIGH]  
Mode: [PLAN MODE / EXECUTION MODE]  
# NOTE: Use PLAN MODE first for high-risk work. Use EXECUTION MODE only when the task is fully defined, low-ambiguity, and safe to implement within a tightly constrained scope.
Skill: implementation_pass  
Skill Location: /Users/olivercarlin/.codex/skills/implementation_pass/SKILL.md  
Codex MUST explicitly load this skill file before execution.  
Control Plane (MANDATORY — explicitly list ALL in the prompt):
- CURRENT_STATE.md
- TODO.md
- PROJECT_MANAGER_CONTEXT.md
- ACTIVE_CHANGE_EVENTS.md


Required Additional Context:
- AGENTS.md

Include when relevant:
- Playwright Skill (preferred for runtime/UI verification when browser automation is feasible)
  - Skill: playwright
  - Skill Location: /Users/olivercarlin/.codex/skills/playwright/SKILL.md

Include when relevant:
- CHANGELOG.md (MANDATORY if this pass may produce or close out an accepted fix)

Files:
@file1
@file2

Objective:
- what is wrong
- desired outcome
- constraints
- what must NOT change
- whether the changed interaction/control affects:
  - visual-only state
  - route/query state
  - shared workflow/data truth across multiple visible surfaces
- if shared workflow/data truth is affected, list every linked surface that must remain in parity before closeout
- Accepted Defect Surface(s):
  - explicitly name the exact runtime/UI surfaces that must be fixed (e.g., "Time Context 1W", "Time Context 1M")
- Disallowed Substitute Proof Surfaces:
  - list surfaces that must NOT be used as substitutes for verification (e.g., "1D", "Custom")
- Governing Truth Status:
  - state whether PM review introduced any newly discovered governing product truth after the last propagation point
  - if yes, implementation MUST NOT proceed until that truth is logged into the control plane
- Problem Class:
  - classify as one of:
    - UI grammar / rendering
    - runtime behavior
    - artifact / publication truth
    - source / index truth
    - mixed / unresolved
  - if unresolved, remain in PLAN MODE before heavy implementation

Instructions:
  - implement the required changes
  - scope guard (MANDATORY):
    - do NOT expand scope beyond the stated objective
    - do NOT introduce unrelated changes or refactors
  - stay strictly within scope
  - follow verification ladder:
    - diagnostic falsification (minimal proof)
    - correction proof (targeted proof)
    - accepted-fix closeout (full artifact proof)
  - do NOT perform full artifact bundle capture during early diagnostic stages unless explicitly required
    - stage-fit verification (EFFICIENCY):
      - use minimal proof during diagnosis
      - use targeted proof during correction
    - continuation-first verification (EFFICIENCY):
      - when proof is incomplete but obtainable, perform one bounded continuation attempt before returning
      - prefer triggering the required state (e.g., lifecycle edge, route exercise) over reporting incompleteness
  - use full artifact proof only at accepted-fix closeout
  - Codex MUST verify its own work directly before returning
  - runtime ready-state gate (CRITICAL):
    - for runtime/UI-sensitive verification, Codex MUST define a route-specific ready-state contract before evaluating accepted surfaces
    - ready-state typically requires:
      - accepted route opened (canonical route with required identifiers)
      - required tab/control visible and selected
      - component/rail state is `ready` (or equivalent settled state)
      - no loading placeholders/skeletons
      - no fallback-only copy
    - Codex MUST prove ready-state with:
      - screenshot (decisive surface visible in-frame)
      - DOM/state capture tied to that screenshot
      - request trace aligned to that same state
    - Codex MUST state the settle signal used and any wait/retry strategy
  - pre-settle evidence rule (CRITICAL):
    - observations captured before ready-state (bootstrap/shell/fallback/loading) are NON-ADMISSIBLE as final acceptance evidence
    - pre-settle artifacts may be used for diagnosis only
    - Codex MUST NOT PASS or FAIL accepted defect surfaces using pre-settle evidence
    - if the pass is about lifecycle-edge behavior, label evidence as lifecycle-edge proof and still capture post-settle proof for final UI truth when applicable
  - lifecycle-ready checklist (CRITICAL):
    - Codex MUST report:
      - `Ready-state satisfied: YES/NO`
      - `Ready-state signals:` <list>
      - `Wait/settle approach:` <retries/delay/event>
      - `Screenshots captured AFTER settle: YES/NO`
    - if `Ready-state satisfied: NO`:
      - classify as `Missing Proof Type: Obtainable` or `Blocked`
      - continue verification if obtainable, otherwise request narrow assist
  - browser-automation verification preference (CRITICAL):
    - if runtime/UI verification is in scope and can be reasonably exercised through terminal-driven browser automation, Codex should load and use the Playwright CLI Skill in addition to `implementation_pass`
    - prefer Playwright-driven verification before falling back to narrower manual/operator verification
  - Playwright accepted-route proof (CRITICAL):
    - when using Playwright, Codex MUST prove:
      - authentication established or valid session reused
      - accepted route opened (canonical route)
      - ready-state reached (as defined above)
    - rules:
      - "Logged in successfully" is NOT sufficient proof
      - pre-settle screenshots MUST NOT be used for PASS/FAIL
      - final PASS/FAIL screenshots MUST be captured AFTER ready-state
  - machine-enforced verification (CRITICAL):
    - verification must produce explicit PASS/FAIL/BLOCKED outcomes, not just logs or captured artifacts
    - any computed comparison or reconciliation check MUST be converted into a PASS/FAIL decision
    - logging mismatches without failing the pass is invalid
    - if any required verification check = FAIL, Codex MUST NOT proceed with success or completion messaging
  - automation exit semantics (CRITICAL):
    - when verification uses scripts or Playwright flows, a failed check MUST cause a non-success outcome
    - if the tool supports exit codes, failures MUST result in non-zero exit or equivalent failure signaling
    - Codex must not interpret a successful process/CLI exit as verification success without evaluating verdicts
    - if the script does not enforce exit on failure, Codex MUST enforce the failure in its own verdicts and block completion
  - verification continuation (CRITICAL):
    - missing proof is NOT a valid stopping condition by itself
    - Codex MUST classify missing proof as:
      - `Missing Proof Type: Blocked`
      - `Missing Proof Type: Obtainable`
    - if `Obtainable`:
      - Codex MUST continue execution in the same thread to obtain the proof
      - Codex MUST state the exact continuation step it is taking
      - Codex MUST NOT return a partial result solely due to incomplete proof
    - if `Blocked`:
      - Codex MUST state the exact blocking reason (auth, runtime target, operator assist, external dependency)
      - Codex MUST justify why further attempts are unlikely to succeed
  - artifact completeness enforcement (CRITICAL):
    - screenshots must include the actual accepted defect surface (chart, UI element, workflow surface)
    - screenshot present ≠ surface verified
    - if the decisive UI surface is not visible, the artifact is INVALID and verification must continue
  - collector-only verification is prohibited (CRITICAL):
    - scripts or Playwright flows that only gather screenshots, logs, traces, or computed values without issuing verification verdicts are NOT sufficient for closeout
    - if the toolchain is collector-only, Codex MUST add the missing assertion/verdict layer itself before returning
    - a pass must not be presented as verified just because an artifact bundle exists
  - checkpoint classification (MANDATORY before closeout):
    - Codex MUST explicitly declare one of:
      - `Checkpoint Status: none`
      - `Checkpoint Status: propagation required before closeout`
      - `Checkpoint Status: continuity checkpoint created`
    - if propagation is required:
      - Codex MUST STOP and require a Change Propagation Pass
    - if a continuity checkpoint is created:
      - Codex MUST list what unpropagated state exists and when it must be propagated
  - Codex must PROVE claimed completion, not merely state it
  - thread lifecycle enforcement (CRITICAL):
    - Codex MUST evaluate whether a thread closeout condition has been reached before finalizing the pass
    - if any of the following are true, Codex MUST recommend thread closure:
      - accepted fix completed and fully propagated
      - phase or slice boundary completed
      - checkpoint status is `none`
      - scope has materially changed from original objective
      - multiple major passes have accumulated
      - thread performance is degraded (lag, scroll instability, navigation issues)
    - when recommending closure, Codex MUST:
      - explicitly state that a new thread is recommended
      - confirm control-plane state is sufficient for restart
      - ensure no material unpropagated state remains
    - Codex MUST NOT silently continue indefinitely in the same thread across multiple slices or phases
  - verification gap reporting (MANDATORY when proof incomplete):
  - mandatory verification verdicts (CRITICAL):
    - Codex MUST output:
      - `UI Truth: PASS/FAIL`
      - `Cross-Scope Parity: PASS/FAIL` (when applicable)
      - `Artifact Completeness: PASS/FAIL`
      - `Final Verdict: PASS/FAIL/BLOCKED`
    - if any of the above = FAIL, the pass MUST NOT be treated as successful
  - verification confidence enforcement (CRITICAL):
    - for decisive runtime/UI acceptance questions, Codex MUST report:
      - `Verification Confidence: HIGH / MEDIUM / LOW`
    - Codex may ONLY close a decisive runtime/UI pass as verified if:
      - `Verification Confidence: HIGH`
    - if confidence is `MEDIUM` or `LOW`:
      - Codex MUST NOT close the pass as verified
      - Codex MUST either:
        - continue verification if stronger proof is still obtainable
        - OR classify the pass as BLOCKED and request only the narrow assist required
    - confidence is a reporting signal, not permission to close
    - confidence escalation requirement (CRITICAL):
      - if `Verification Confidence` is `MEDIUM` or `LOW` and stronger proof appears obtainable, Codex MUST perform at least one additional bounded verification attempt before returning
      - preferred escalation actions include:
        - re-exercising the runtime path
        - re-capturing screenshots with corrected framing (ensure surface visible)
        - completing a missing switch loop or lifecycle step
        - resolving minor blocking interaction if reasonably possible
      - Codex MUST NOT default to `BLOCKED` if a reasonable additional attempt could increase confidence
      - only after a bounded escalation attempt fails may Codex classify the pass as `BLOCKED`
  - explicit reconciliation assertions (CRITICAL when applicable):
    - when overlap/reconciliation is part of acceptance, include explicit assertions such as:
      - `Assert: 1D latest bucket equals corresponding 1W day -> PASS/FAIL`
      - `Assert: 1W overlapping range aligns with 1M buckets -> PASS/FAIL`
      - `Assert: 1M current month aligns with 1Y current-month projection -> PASS/FAIL`
    - each assertion MUST yield a PASS/FAIL outcome
    - any assertion = FAIL must force `Final Verdict: FAIL` unless the pass is BLOCKED with justification
  - fail-fast assertion pattern (CRITICAL when applicable):
    - when Codex uses a verification script, browser automation flow, or comparison helper, it should structure the checks as explicit assertions rather than passive output
    - preferred pattern:
      - `Assertion:` <what must be true>
      - `Observed:` <actual observed result>
      - `Verdict:` PASS/FAIL
    - if any assertion yields `FAIL`, Codex MUST stop success messaging and set `Final Verdict: FAIL` unless the pass is explicitly `BLOCKED`
  - confidence vs verdict rule (CRITICAL):
    - `Final Verdict: PASS` requires both:
      - all required checks = PASS
      - `Verification Confidence: HIGH`
    - any mismatch or visible contradiction should be treated as `FAIL`, not low-confidence PASS
    - if the screenshot or UI truth cannot be judged confidently, use Human Visual Adjudication instead of guessing
  - include:
    - `Missing Proof Type: Blocked` or `Obtainable`
    - if `Obtainable`, the exact next step being taken (or just taken) to obtain proof
    - if `Blocked`, the precise blocker and why continuation cannot proceed
  - every claimed fixed/verified item must be paired with direct proof tied to the accepted defect surface or accepted validation surface
  - if Codex cannot prove a claimed result directly, it must report that result as unproven or partially proven rather than complete
  - no regressions
  - feature works as intended
  - scope respected
  - if the pass affects shared workflow/data truth across multiple visible surfaces, Codex MUST verify cross-surface parity across all linked surfaces before closeout
  - Codex MUST inspect the final rendered UI state itself and confirm it is visually consistent with the intended outcome, not just numerically or contractually correct
  - if the UI still visibly shows the defect, contradiction, broken chart shape, incorrect gaps, or other obvious render error, the pass MUST NOT close as verified even if data contracts or parity checks pass
  - if acceptance depends on a visual condition that Codex may not be able to judge confidently from the screenshot alone, Codex MUST treat that as a blocked visual-verification dependency rather than closing the pass
  - Codex MUST explicitly describe what it visually sees in each accepted-surface screenshot (for example: bars present or missing, gaps visible or not, chart continuity correct or not)
  - if Codex cannot confidently determine visible correctness from the screenshot itself, Codex MUST report `cannot verify visible UI truth` and pause for Oliver visual adjudication before closeout
  - interaction proof alone is NOT sufficient when linked data surfaces are supposed to reflect the same filtered/shared dataset
  - route/query proof alone is NOT sufficient when linked data surfaces are supposed to reflect the same filtered/shared dataset
  - if UI/runtime behavior was changed, Codex must exercise the changed surface itself whenever reasonably possible
  - Codex must NOT hand off a pass to Oliver as “complete” if it has not attempted direct verification of the changed behavior
  - for runtime/UI-sensitive work, Codex must capture artifact-backed proof of the accepted visible state before calling the pass verified
  - backend success or one good response is NOT sufficient UI acceptance proof by itself
  - if artifact proof is incomplete, the pass must be reported as `artifact proof incomplete`, not as fully verified
  - Proof-Surface Identity Enforcement (CRITICAL):
    - Codex MUST explicitly verify the Accepted Defect Surface(s)
    - artifact bundles that do NOT include those exact surfaces are invalid
    - adjacent or alternate surfaces MUST NOT be used as substitutes
  - Artifact Coverage Enforcement (CRITICAL):
    - for EACH Accepted Defect Surface, Codex MUST include:
      - final settled UI screenshot
      - DOM/state capture tied to that screenshot
      - request trace tied to that same state
    - if any Accepted Defect Surface is missing from the artifact bundle, the pass MUST NOT close
  - Live-Path Relevance Check (CRITICAL):
    - Codex MUST confirm the fix affects the actual runtime path where the defect exists
    - if the fix does not affect the live path, Codex MUST explicitly state:
      - "fix does not affect the actual live path"
    - this condition MUST block closeout
### Pre-Execution Governing-Truth Gate (CRITICAL)

Before execution begins, the Project Manager must explicitly resolve whether PM review changed the governing truth after the previous thread or previous accepted closeout.

Required resolution:
- historical accepted fix remains valid as historical closeout
- newly discovered broader or corrected truth is now the active governing truth

If newly active governing truth exists, the PM must:
- update `ACTIVE_CHANGE_EVENTS.md`
- update `CURRENT_STATE.md`
- update `TODO.md`
- update `PROJECT_MANAGER_CONTEXT.md` when needed
- run the propagation step BEFORE starting a new Codex thread

A new Codex thread must NOT begin from stale control-plane scope when PM review has already established broader or corrected governing truth.

### Codex Self-Verification Rule (CRITICAL)

Codex is the primary verifier of its own work.
Oliver is the secondary verifier for fast QA confirmation, not the default first-line checker.

Required rule:
- Codex MUST verify the changed behavior itself whenever reasonably possible before returning a PM REVIEW PACKET.
- Codex must use the strongest available verification method for the task, including when applicable:
  - targeted lint / typecheck
  - direct route exercise
  - runtime interaction
  - screenshot/browser inspection
  - console / server-log inspection
  - fixture reproduction
  - before/after comparison

Codex must NOT:
- treat Oliver as the default person who discovers whether the change worked
- return "fixed" or "complete" if the changed behavior was not actually exercised
- rely on Oliver verification to replace Codex verification when Codex could have checked it directly

If Codex cannot directly verify part of the changed behavior:
- it must explicitly state what it could not verify
- it must narrow Oliver Verification only to that residual gap

### Runtime Target + Authentication Rule (CRITICAL)

If direct verification depends on a specific local/dev/runtime surface, the PM must specify the correct runtime target whenever it is not already unambiguous.

The prompt should explicitly provide when relevant:
- canonical host/origin (for example `localhost` vs `127.0.0.1`)
- canonical port (for example `3000` vs `3001`)
- exact route to verify
- whether an authenticated session is required
- any required dynamic route identifiers (for example `agent_id`, `workspace_id`, `cluster_id`, `subset_source`, `subset_value`)

Codex must NOT:
- guess the runtime host/origin
- guess the port
- open random fallback ports or unrelated local servers hoping one is correct
- guess required dynamic route identifiers
- abbreviate a canonical route into a shorthand route that omits required identifiers
- treat a malformed or incomplete route as evidence of a product/runtime defect
- treat authentication failure as final proof that verification is impossible

If the correct runtime target is unclear and verification depends on it:
- Codex MUST STOP and ask for the exact host/origin + port + canonical route identity before attempting verification

If verification requires login/authentication and Codex hits an auth gate:
- Codex MUST explicitly tell Oliver that authentication is required
- Codex MUST pause and wait for Oliver to complete login
- Codex MUST resume verification only after Oliver confirms login is complete
- Codex should frame this as a blocked verification dependency, not as a completed pass


Oliver Verification must not be expanded just because Codex failed to request the right runtime target or authentication state.

### Canonical Route Identity Rule (CRITICAL)

For runtime/UI verification, Codex must not guess required route identity components.

Examples:
- `agent_id`
- `workspace_id`
- `cluster_id`
- `subset_source`
- `subset_value`
- any required dynamic segment in the route path

Required behavior:
- the PM should provide the exact canonical URL whenever verification depends on a route with required identifiers
- Codex MUST use the exact canonical route when it is provided
- if a required route identifier is missing or unclear, Codex MUST STOP and ask before opening the route
- a missing required route identifier is a blocked verification dependency, not product proof

Codex must NOT:
- invent a shorthand route when the canonical route requires additional identifiers
- troubleshoot product behavior on a route that is malformed, incomplete, or missing required identifiers
- treat a route-resolution failure caused by a missing identifier as evidence that the feature itself is broken


### Runtime/UI Closeout Contract (CRITICAL)

For runtime/UI-sensitive work, Codex must not treat partial subsystem proof as end-to-end proof.
A pass is only verified when the final accepted visible state is proven directly.

### Proof-of-Completion Rule (CRITICAL)

Codex must not claim completion without matching proof.

Required behavior:
- every claimed fix must be backed by direct evidence
- the evidence must match the accepted defect surface, accepted route, and accepted runtime state being claimed
- if only part of the result is proven, Codex must label it as partial proof, not full completion

Required reporting standard:
- `claimed fixed` -> must include proof
- `claimed verified` -> must include proof
- `claimed complete` -> must include proof

If proof is missing, mis-targeted, or only covers an adjacent surface, Codex must not present the pass as complete.

### Final UI Truth Verification Rule (CRITICAL)

Codex must verify the final rendered UI truth, not just the underlying data contract, route state, or interaction mechanics.

Required behavior:
- Codex MUST inspect the final rendered UI state itself before closeout
- Codex MUST evaluate whether the visible UI still shows the problem the pass was supposed to fix
- Codex MUST treat obvious visual defects as verification failures even when:
  - interaction works
  - route/query state is correct
  - data contracts pass
  - linked-surface counts/parity pass

Examples of visible defects that block closeout:
- charts that still show incorrect gaps when data should render continuously
- visibly broken chart shape or continuity
- visible contradictions between the UI and the expected user-facing result
- screenshots that still contain the bug being claimed as fixed

A pass is NOT complete if the screenshot or rendered UI still visibly looks wrong.

### Visual Failure Override Rule (CRITICAL)

If a screenshot visibly contains the defect, Codex must fail the pass regardless of:
- correct data
- correct counts
- correct DOM/state
- clean request traces
- correct route/query state

Visible UI truth overrides machine-readable proof when they conflict.

### Human Visual Adjudication Gate (CRITICAL)

If acceptance depends on a visual condition that Codex cannot judge confidently from the screenshot alone, Codex must not guess and must not close the pass.

Required behavior:
- Codex MUST explicitly state the exact visual question it cannot resolve
- Codex MUST surface the screenshot as unresolved evidence
- Codex MUST request narrow Oliver adjudication of that screenshot
- Codex MUST pause the task until Oliver responds
- Codex MUST resume verification only after Oliver provides the visual ruling

Allowed use:
- visual bar presence vs absence
- visible chart continuity vs broken continuity
- obvious visible gaps vs expected zero-slot preservation
- other screenshot-driven visible truth questions where Codex is uncertain

This is a blocked verification dependency, not a successful closeout.

### Accepted Defect Surface Enforcement (CRITICAL)

Codex must not treat verification on adjacent or alternate surfaces as valid proof.

Required behavior:
- Codex MUST restate the Accepted Defect Surface(s) before verification
- Codex MUST capture artifact proof for those exact surfaces
- Codex MUST confirm the defect is resolved on those surfaces specifically

Failure conditions:
- verifying `1D` when the defect is on `1W` or `1M`
- verifying `Custom` when the defect is on workflow-driving ranges
- providing screenshots that do not include the actual defect surface

If any Accepted Defect Surface is not directly verified, the pass is INVALID.

### Linked-Surface Parity Requirement (CRITICAL)

If a runtime/UI pass affects a shared filtered universe or shared dataset truth, Codex must verify all linked visible surfaces that are supposed to represent that same truth before closing the pass.

Examples of linked surfaces can include:
- workflow totals
- distribution counts
- sender rows
- Time Context
- Decision Mode
- summary cards
- any other visible surface representing the same filtered or shared dataset

Required behavior:
- Codex must explicitly identify whether the changed control/interaction affects:
  - visual-only state
  - route/state only
  - shared workflow/data truth across multiple surfaces
- If shared workflow/data truth is affected:
  - interaction proof alone is NOT sufficient
  - route/query proof alone is NOT sufficient
  - one linked-surface match is NOT sufficient
  - closeout MUST require cross-surface parity proof across all linked surfaces that should reflect the same dataset

Codex must NOT close the pass as verified when:
- the control works
- the route/query state updates correctly
- but one or more linked data surfaces remain inconsistent, stale, or unverified

Required proof surfaces:
- cold load
- switch loop (when the surface includes interactive switching such as chips/toggles/range changes)
- final settled UI

Minimum artifact bundle for each required proof surface:
- screenshot of the final visible state
- DOM/state capture tied to that same final state
- request trace tied to that same final state

For charted / time-based / bucketed surfaces, the proof must explicitly state when applicable:
- visible granularity
- visible bucket count
- whether zero buckets/gaps are visibly preserved
- final ready/settled state
- route/href actually verified

Rules:
- a backend payload, console log, or response body is NOT sufficient by itself
- a good partial proof must not be presented as full verification
- if the accepted visible state was not captured, the pass must not close as fully verified
- if a switch flow is part of the acceptance target, Codex must verify the final state after the switch loop, not just after cold load

### Guard-Churn Reporting Rule (CRITICAL)

If the verified runtime/UI flow can trigger overlapping request families, retries, or guard conditions, Codex must explicitly report that in the closeout proof.

Examples:
- `409 already_running`
- `409 cooldown_active`
- overlapping request families that may affect the same visible route/surface

Required behavior:
- capture the request families observed during the accepted flow
- state whether each family was:
  - required
  - background but harmless
  - unexpected / interfering
- if repeated `409` or guard churn occurred during the accepted flow:
  - do NOT silently ignore it
  - explain whether it was user-visible or non-user-visible
  - do NOT close the pass as fully verified unless the churn is explicitly shown to be non-interfering with the accepted final UI

If Codex reaches the correct runtime surface but cannot complete verification because a UI interaction cannot be performed reliably in its own session, Codex must treat that as a blocked verification dependency, not as a completed pass.

Examples:
- a chip, toggle, or control cannot be clicked reliably
- a date picker / custom range input requires manual operator interaction
- a modal, popover, or browser state requires a human step to continue
- the authenticated page is open, but a specific in-app interaction is still blocked in automation
- the screenshot is captured, but the decisive acceptance check depends on a visual judgment Codex cannot make confidently

Required behavior:
- Codex MUST explicitly state the exact verification step that is blocked
- if the block is visual uncertainty, Codex MUST explicitly state the exact visual question requiring Oliver adjudication
- Codex MUST request the minimum operator action required to unblock verification
- Codex MUST pause and wait for Oliver to complete that interaction
- Codex MUST resume verification after Oliver confirms the interaction is complete
- Codex must continue the same verification flow rather than closing out and deferring the full proof to Oliver

Codex must NOT:
- treat a blocked UI interaction as sufficient reason to mark the pass complete
- convert a blocked verification step into broad Oliver QA
- close out with "could not verify" if Oliver could have unblocked the exact step in-session

If Codex remains blocked after the operator assist step:
- it must report the exact residual gap
- it must explain why the blocked step could not be completed even after assistance

### Pre-Execution Gate (REQUIRED when implementation follows a prior approved plan)

If this implementation pass is based on a plan that was approved earlier in a different thread or earlier phase, the PM must confirm one of the following before execution:

- the approved plan was already propagated into the control plane
- OR this message includes an explicit instruction to run the required change-propagation/logging step first

Implementation must not rely on prior chat approval alone.
Implementation must also not rely on intended-but-unlogged phase activation.

The implementation thread must be able to recover the approved plan from:
- `ACTIVE_CHANGE_EVENTS.md`
- `CURRENT_STATE.md`
- `TODO.md`
- other explicitly updated authoritative docs when applicable

### Accepted-Fix Closeout Rule (REQUIRED when a stable fix is accepted)

If this implementation pass results in an accepted fix, the PM must require Codex to:
- create or update the corresponding `CHANGELOG.md` entry
- include a full Recovery Contract
- ensure the completed ACE entry includes:
  - `Recovery Contract: CHANGELOG -> <entry>`

An accepted fix is NOT complete without this recovery-contract capture.

### Oliver Verification (REQUIRED — include in initial PM message)

The Project Manager MUST include a short verification checklist in the SAME message where the Codex instruction is sent (outside the Codex prompt).

It is NOT the place to move primary verification steps that Codex could complete after a small unblock from Oliver (for example login, one blocked click, or a date input assist).
It is also NOT the place to compensate for missing artifact-backed proof that Codex should have captured itself for cold load, switch-loop behavior, or final settled UI.

Oliver Verification must not be used to supply proof that Codex should have provided for a claimed complete pass.
The one exception is narrow visual adjudication when Codex explicitly reports that it cannot confidently determine visible UI truth from the accepted-surface screenshot itself.

Its purpose is to confirm:
- UI behavior
- interaction behavior
- visible runtime behavior
- terminal/log output when Oliver must observe it directly
- the same linked proof surfaces Codex was required to verify when shared dataset truth is involved
- final rendered UI truth when the user-facing acceptance depends on visible chart, layout, continuity, or absence of obvious visual defects

This checklist must be:
- 3–6 bullets maximum
- fast to execute (1–2 minutes)
- strictly scoped to what changed
- limited to validation Oliver can perform directly

Include only:
- where to run verification (URL / page / entry point)
- what to click, trigger, or observe in the UI (if applicable)
- what visible runtime behavior to confirm
- what terminal/log output to check only if Oliver must look at it directly
- what “correct” looks like from Oliver’s point of view
- when shared dataset truth is involved, the same linked-surface parity expectations Codex was required to verify
- when final visible correctness matters, what the UI should visibly look like and what obvious defect should no longer appear
- when Codex reports blocked visual uncertainty, the exact yes/no visual ruling Oliver must provide for the accepted-surface screenshot

Do NOT include:
- PM judgment tasks
- plan review tasks
- architecture review
- “confirm the plan is good” style checks
- “confirm this matches the spec” style checks unless there is a visible UI/runtime behavior Oliver can directly verify
- full test plans
- unrelated validation
- anything Codex or the PM should validate themselves
- a narrower proof surface than the one Codex was required to verify when linked visible surfaces share the same dataset truth
- require a second message to provide verification steps

---

# 2. Change Propagation Pass

Feature Domain: SYSTEM  
Reasoning Level: HIGH  
Mode: EXECUTION MODE  
Skill: change_propagation_pass  
Skill Location: /Users/olivercarlin/.codex/skills/change_propagation_pass/SKILL.md  
Codex MUST explicitly load this skill file before execution.  
Control Plane (MANDATORY — explicitly list ALL in the prompt):
- CURRENT_STATE.md
- TODO.md
- PROJECT_MANAGER_CONTEXT.md
- ACTIVE_CHANGE_EVENTS.md


Required Additional Context:
- AGENTS.md
### Codex Self-Verification Rule (CRITICAL)

For propagation work, Codex must verify that the targeted docs actually reflect the intended state before returning.

Minimum expectation:
- confirm the listed docs were updated
- confirm no conflicting wording remains in the updated docs
- confirm the final reported state matches the actual edited files

Oliver Verification must not be used as a substitute for Codex checking its own propagation results.

Include when relevant:
- CHANGELOG.md (MANDATORY if the propagation includes an accepted-fix closeout)

Files:
@ACTIVE_CHANGE_EVENTS.md
@CURRENT_STATE.md
@TODO.md

Objective:
- propagate a logged change event
- align all affected documentation
- capture any newly discovered governing product truth before future execution threads begin

Instructions:
- locate the target ACE
- update all listed docs
- ensure consistency across system

Validation:
  - no conflicting language remains
  - propagation status updated
  - system reflects current truth
  - checkpoint closure validation (MANDATORY):
    - confirm no unpropagated governing truth remains
    - confirm no pending accepted-fix capture remains
    - confirm no phase-state inconsistency remains
    - confirm no deferred plan capture remains
    - explicitly state: `Checkpoint Status: none`

### Required Use Cases (IMPORTANT)

This template must be used not only for completed implementation propagation, but also for approved-plan capture when:
- a `PLAN MODE` task was approved
- implementation will happen later
- continuity must survive thread closure or thread separation

In that case, the propagation pass should:
- log the approved plan as active system truth
- update the relevant control-plane files
- make the future implementation thread recoverable from docs alone

### Governing Truth Capture Use Case (MANDATORY when applicable)

This template must also be used when PM review establishes a new governing product truth that is not yet reflected in the control plane.

Examples:
- accepted defect surface broadens beyond what was previously logged
- workflow-driving surfaces are now confirmed in-scope for the defect
- a previously accepted narrow fix remains historically true, but broader active truth now governs future work

In that case, the propagation pass must:
- preserve the historical accepted fix record if still valid
- create or update the active ACE for the broader newly discovered truth
- update CURRENT_STATE.md, TODO.md, and PROJECT_MANAGER_CONTEXT.md as needed
- ensure future Codex threads recover the broader truth from docs, not chat memory

### Accepted-Fix Recovery Capture (MANDATORY when applicable)

If the propagation pass includes an accepted-fix closeout, it must:
- ensure `CHANGELOG.md` contains the Recovery Contract
- ensure the completed ACE entry points to it
- avoid duplicating the full recovery contract across control-plane docs

`CHANGELOG.md` is the authoritative recovery ledger for accepted fixes.

### Oliver Verification (REQUIRED — include in initial PM message)

The Project Manager MUST include a short verification checklist in the SAME message where the Codex instruction is sent (outside the Codex prompt).

This checklist is ONLY for fast Oliver-side QA of things the PM/Codex cannot fully verify themselves.

Its purpose is to confirm:
- UI behavior
- interaction behavior
- visible runtime behavior
- terminal/log output when Oliver must observe it directly

This checklist must be:
- 3–6 bullets maximum
- fast to execute (1–2 minutes)
- strictly scoped to what changed
- limited to validation Oliver can perform directly

Include only:
- where to run verification (URL / page / entry point)
- what to click, trigger, or observe in the UI (if applicable)
- what visible runtime behavior to confirm
- what terminal/log output to check only if Oliver must look at it directly
- what “correct” looks like from Oliver’s point of view

Do NOT include:
- PM judgment tasks
- plan review tasks
- architecture review
- “confirm the plan is good” style checks
- “confirm this matches the spec” style checks unless there is a visible UI/runtime behavior Oliver can directly verify
- full test plans
- unrelated validation
- anything Codex or the PM should validate themselves
- require a second message to provide verification steps

---

# 3. Shared Hot-File Integration Pass

Feature Domain: [DOMAIN]
Reasoning Level: HIGH
Mode: [PLAN MODE / EXECUTION MODE]
# NOTE: Use PLAN MODE for preflight / analysis of conflicts. Use EXECUTION MODE only when performing actual integration.
Skill: implementation_pass
Skill Location: /Users/olivercarlin/.codex/skills/implementation_pass/SKILL.md
Codex MUST explicitly load this skill file before execution.
Control Plane (MANDATORY — explicitly list ALL in the prompt):
- CURRENT_STATE.md
- TODO.md
- PROJECT_MANAGER_CONTEXT.md
- ACTIVE_CHANGE_EVENTS.md


Required Additional Context:
- AGENTS.md
### Codex Self-Verification Rule (CRITICAL)

Codex must verify the integrated behavior itself before returning the pass.

Required rule:
- exercise the affected shared surface directly whenever reasonably possible
- verify that the intended preserved behaviors from both sides still hold
- verify that the integration did not regress the explicitly listed validation surfaces

Oliver Verification is for fast confirmation of residual UI/runtime questions only, not for discovering whether the integration worked at all.

### Runtime Target + Authentication Rule (CRITICAL)

If hot-file verification depends on a specific local/dev/runtime surface, the PM must specify the correct runtime target whenever it is not already unambiguous.

The prompt should explicitly provide when relevant:
- canonical host/origin
- canonical port
- exact route to verify
- whether an authenticated session is required

Codex must NOT guess the runtime target.
If the target is unclear, Codex MUST STOP and ask.
If authentication is required, Codex MUST pause, request login, and resume only after Oliver confirms authentication is complete.

If verification is blocked by a specific UI interaction after the correct runtime target is open, Codex MUST request the minimum operator assist needed to continue verification, pause, then resume the integration check after Oliver confirms the interaction is complete.

Include when relevant:
- CHANGELOG.md (when the active lane depends on recent accepted-fix recovery context)

Files:
@hot_file_1
@hot_file_2

Preflight Packet:
- target branch
- source branch
- merge-base commit
- overlapping hot files
- non-hot companion files explicitly allowed in scope
- preserve-from-main notes
- preserve-from-worktree notes
- validation surfaces
- related ACEs/specs

Objective:
- integrate overlapping edits in shared hot files safely
- preserve accepted behavior on both sides
- keep docs-only sync separate from code integration

Instructions:
- run hot-file preflight before implementation
- classify overlap against the shared hot-file list using merge-base, two-sided overlap detection
- if classification = `hot_file_integration_required`, full git merge is prohibited
- use intentional comparison against merge base, target, and source instead of blind merge resolution
- apply the default merge bias rules unless PM explicitly overrides them:
  - UI files prefer `main`
  - runtime logic prefers the active worktree lane
  - imports union unless the conflict is semantic
  - types/interfaces prefer the superset, not reduction
- if docs/control-plane files also need syncing, handle that through docs-only sync separately
- do not use Oliver as the default manual merge resolver

Validation:
- hot-file overlap is reconciled intentionally
- regressions are checked for the affected shared surfaces
- if Codex fails the same hot-file integration twice, stop and return to PM
- PM REVIEW PACKET explains what was preserved, changed, and still needs product review

### Oliver Verification (REQUIRED — include in initial PM message)

The Project Manager MUST include a short verification checklist in the SAME message where the Codex instruction is sent (outside the Codex prompt).

This checklist is ONLY for fast Oliver-side QA of things the PM/Codex cannot fully verify themselves.

Its purpose is to confirm:
- UI behavior
- interaction behavior
- visible runtime behavior
- terminal/log output when Oliver must observe it directly

This checklist must be:
- 3–6 bullets maximum
- fast to execute (1–2 minutes)
- strictly scoped to what changed
- limited to validation Oliver can perform directly

Include only:
- where to run verification (URL / page / entry point)
- what to click, trigger, or observe in the UI (if applicable)
- what visible runtime behavior to confirm
- what terminal/log output to check only if Oliver must look at it directly
- what “correct” looks like from Oliver’s point of view

Do NOT include:
- PM judgment tasks
- plan review tasks
- architecture review
- “confirm the plan is good” style checks
- “confirm this matches the spec” style checks unless there is a visible UI/runtime behavior Oliver can directly verify
- full test plans
- unrelated validation
- anything Codex or the PM should validate themselves
- require a second message to provide verification steps

---

# 4. Turnover Pack Builder

Feature Domain: SYSTEM  
Reasoning Level: MEDIUM  
Mode: EXECUTION MODE  
Skill: turnover_pack_builder  
Skill Location: /Users/olivercarlin/.codex/skills/turnover_pack_builder/SKILL.md  
Codex MUST explicitly load this skill file before execution.  
Control Plane (MANDATORY — explicitly list ALL in the prompt):
- CURRENT_STATE.md
- TODO.md
- PROJECT_MANAGER_CONTEXT.md
- ACTIVE_CHANGE_EVENTS.md

Required Additional Context:
- AGENTS.md
### Codex Self-Verification Rule (CRITICAL)

Codex must verify that the turnover package is internally consistent before returning it.

Required checks:
- all three messages are filled with real project-specific content
- the package reflects actual control-plane state
- required attachments/context are correctly identified
- no template placeholders remain

Oliver Verification must not be used to discover missing continuity details that Codex could have checked directly.

Files:
@CURRENT_STATE.md
@TODO.md
@PROJECT_MANAGER_CONTEXT.md

Objective:
- prepare PM activation package
- reduce turnover time

Instructions:
- summarize current state
- identify next task
- assemble 3-message activation

Validation:
- no unnecessary docs included
- context is clear and minimal
- activation ready to send

### Recovery-Ledger Continuity Rule (IMPORTANT)

If the active lane depends on one or more recent accepted fixes, the turnover package should:
- reference the relevant `CHANGELOG.md` recovery entry or entries
- include them in Message 3 attachments when they are needed for deterministic recovery
- avoid attaching unrelated historical changelog material

### Oliver Verification (REQUIRED — include in initial PM message)

The Project Manager MUST include a short verification checklist in the SAME message where the Codex instruction is sent (outside the Codex prompt).

This checklist is ONLY for fast Oliver-side QA of things the PM/Codex cannot fully verify themselves.

Its purpose is to confirm:
- UI behavior
- interaction behavior
- visible runtime behavior
- terminal/log output when Oliver must observe it directly

This checklist must be:
- 3–6 bullets maximum
- fast to execute (1–2 minutes)
- strictly scoped to what changed
- limited to validation Oliver can perform directly

Include only:
- where to run verification (URL / page / entry point)
- what to click, trigger, or observe in the UI (if applicable)
- what visible runtime behavior to confirm
- what terminal/log output to check only if Oliver must look at it directly
- what “correct” looks like from Oliver’s point of view

Do NOT include:
- PM judgment tasks
- plan review tasks
- architecture review
- “confirm the plan is good” style checks
- “confirm this matches the spec” style checks unless there is a visible UI/runtime behavior Oliver can directly verify
- full test plans
- unrelated validation
- anything Codex or the PM should validate themselves
- require a second message to provide verification steps

---

# Usage Rule

These templates are for non-trivial PM -> Codex tasks.

Use them when:
- Codex is expected to implement changes
- Codex is expected to propagate docs
- Codex is expected to handle worktree sync / hot-file integration
- Codex is expected to assemble turnover material
- the task is complex enough that scope, mode, skill, and validation need to be explicit

They are NOT required for every casual coordination message with Codex.

## Plan Mode Standard (MANDATORY)

The Project Manager must use the following default standard:

- High-risk work → `PLAN MODE` first
- Low-risk, tightly scoped, reversible work → `EXECUTION MODE` is acceptable
- If uncertain → use `PLAN MODE`

Examples of high-risk work:
- core logic changes
- grouping/model changes
- migrations
- rebuilds
- phase-opening implementation work
- anything that could create material regressions
- any runtime/artifact/polling/Smart Sync lifecycle change

Examples of low-risk work:
- small scoped fixes with clear rollback
- narrow propagation work
- validation-only tasks
- tightly bounded implementation adjustments with no design ambiguity

## Plan Approval Continuity Rule (MANDATORY)

If a non-trivial `PLAN MODE` task is approved, the PM must decide immediately between these two paths:

### Path A — Same-thread continuation
- continue directly into implementation in the same thread
- no separate continuity handoff required before execution

### Path B — Split-thread execution
- implementation will happen in a new thread or later pass
- a `Change Propagation Pass` must be run first to capture the approved plan in the control plane

If Path B is chosen, do NOT start the implementation thread until the approved plan has been logged and propagated.
The same rule applies when PM review discovers new governing truth after a pass or closeout: do NOT start the next thread until that truth has been propagated.
If the prior phase was closed as part of that approval, the next phase must also be explicitly activated in the control plane before the implementation thread begins.

The PM must confirm:
- the control plane is aligned
- the propagation step is complete

before issuing any new Codex thread or implementation prompt.

### Path C — Explicit Abandon
- explicitly mark the plan as abandoned or superseded
- record why

Examples where a full template is usually NOT necessary:
- quick clarification questions
- lightweight status checks
- asking Codex to explain what it just did
- simple follow-up questions that do not trigger new scoped execution

Every non-trivial Codex instruction should:
1. Specify a Mode
2. Specify a Skill
3. Include the Skill Location
4. Follow the relevant structure below
5. Include `AGENTS.md` in the execution context
6. Explicitly list all 4 control-plane files instead of relying on the phrase "control plane" alone
7. Include a short "Oliver Verification" checklist in the SAME message as the Codex instruction (outside the Codex prompt)
8. State the Codex self-verification expectation clearly; Oliver Verification is secondary QA, not the primary discovery step
9. Specify the runtime target explicitly when direct verification depends on a local/dev/authenticated surface (host/origin, port, route, and whether login is required)
10. Specify the full canonical route when verification depends on required dynamic identifiers (not just host, port, or a shorthand path)
11. If verification may depend on a blocked UI step, state that Codex must pause, request the minimum operator assist needed, and then resume verification instead of closing out early
12. For runtime/UI-sensitive work, require artifact-backed proof of cold load, switch-loop behavior (when applicable), and final settled UI before Codex can claim verification

### Oliver Verification Scope Rule (CRITICAL)

Oliver Verification is not a substitute for PM review or Codex self-validation.

Codex must first verify its own work directly whenever reasonably possible.

Oliver Verification must be limited to:
- user-interface checks
- interaction checks
- visible runtime behavior
- direct observation of logs/output only when Oliver is specifically needed

Oliver Verification must NOT ask Oliver to:
- judge whether the plan is correct
- review whether the approach is strategically sound
- confirm architectural alignment
- re-do PM review work
- re-do Codex validation work

When the task is worktree sync related:
- use `Change Propagation Pass` for docs-only sync or conflict recovery at the docs/control-plane layer
- use `Shared Hot-File Integration Pass` for overlapping shared runtime files

For simple or lightweight tasks, a reduced prompt may be used, but if a Skill is referenced the corresponding Skill Location must still be provided.

Do NOT send ambiguous or unscoped prompts to Codex.

Approved-plan execution should prefer same-thread continuation when possible to avoid redundant context reload and coordination overhead.

## Common Mistake (CRITICAL)

 
A fifth common mistake is letting Codex guess the runtime verification target for a local or authenticated surface. If verification depends on `localhost` / `127.0.0.1`, a specific port, or an authenticated session, the PM must specify that target or Codex must stop and ask instead of guessing.

A fifth-b mistake is letting Codex guess or omit required route identifiers during runtime verification. If a route depends on an `agent_id`, `cluster_id`, or other dynamic identity component, Codex must use the full canonical route or stop and ask instead of troubleshooting a malformed URL.

 A sixth common mistake is allowing Codex to abandon primary verification when a small in-session unblock would let verification continue. If login, one blocked click, or one manual input would unblock the exact verification flow, Codex should request that assist, pause, and resume instead of closing out early.

A seventh common mistake is letting Codex present partial subsystem proof as end-to-end UI verification. A good backend response, route param, or console observation is not enough unless the final accepted visible state is also captured.

An eighth-a common mistake is letting Codex close a pass after verifying only the control interaction or route change when multiple visible surfaces are supposed to reflect the same filtered/shared dataset. If shared dataset truth is involved, all linked visible surfaces must be verified for parity before closeout.

An eighth common mistake is allowing runtime/UI closeout without artifact-backed proof for the final accepted state. If cold load, switch-loop behavior, or final settled UI were part of the acceptance target, those proof surfaces must be captured or the pass must remain explicitly incomplete.

An eighth-b common mistake is letting Codex verify data correctness, parity, or route behavior while failing to inspect the actual rendered UI truth. If the screenshot still visibly shows the bug, broken chart continuity, or an obvious visual contradiction, the pass must not close as verified.

An eighth-c common mistake is allowing Codex to verify the wrong proof surface. If the defect exists on `1W` or `1M`, verification on `1D` or `Custom` is invalid and must not be accepted.


An eighth-d common mistake is assembling an artifact bundle that does not include the accepted defect surface. Missing required screenshots, DOM captures, or request traces for the exact surface must block closeout.


An eighth-e common mistake is letting Codex state that something is fixed, verified, or complete without forcing a matching proof package. Claimed completion without proof must be treated as incomplete, not accepted.

An eighth-f common mistake is letting newly discovered governing product truth remain thread-local after PM review. If PM review broadened or corrected the accepted defect surface or governing product expectation, a new Codex thread must not start until that truth is propagated into the control plane.

An eighth-g common mistake is letting Codex treat visible screenshot defects as subordinate to counts, DOM/state, or request traces. If the screenshot still visibly shows the bug, the pass must fail unless Codex explicitly pauses for narrow human visual adjudication because the screenshot is genuinely ambiguous.

Do NOT use `EXECUTION MODE` for analysis-only tasks.

If Codex is being asked to:
- evaluate
- classify
- produce a matrix
- analyze system state

then the correct mode is `PLAN MODE`, even if a Skill is referenced.

Incorrect mode selection can cause:
- unintended execution attempts
- scope confusion
- violation of constraints (e.g., "no code changes")

A fourth common mistake is assuming that control-plane alignment removes the need for `PLAN MODE` on risky work. It does not. Control-plane alignment preserves continuity; `PLAN MODE` is still the primary QA mechanism for high-risk execution.

A second common mistake is approving a `PLAN MODE` output and then starting a new implementation thread without first propagating that approved plan into the control plane. That creates continuity gaps and forces future threads to rely on chat memory instead of authoritative docs.

A third common mistake is closing a phase and then starting the next thread based on intent alone without explicitly activating the next phase in the control plane. That creates a valid Codex stop condition and forces unnecessary restart loops.

An eighth-h common mistake is allowing Codex to implement runtime or artifact changes without explicitly declaring the expected load shape (request frequency, polling behavior, heavy endpoints). This can silently reintroduce Supabase load risks.

An eighth-i common mistake is allowing Codex to verify only steady-state outcomes while skipping lifecycle-edge verification (for example Smart Sync completion, build-pending entry/exit, or artifact handoff). This leads to hidden transition bugs.

An eighth-j common mistake is proceeding with runtime-sensitive implementation when the prompt does not explicitly include a load-impact declaration requirement. This must trigger a STOP condition, not silent continuation.

---

# Summary

This file ensures:
- PM → Codex communication is standardized for non-trivial work
- mode is explicit
- Skills are used correctly
- `AGENTS.md` is part of required execution context
- Execution is predictable and repeatable
- Oliver is used only for narrow assist cases (authentication, blocked interaction, or visual adjudication), not as a general closeout gate
- high-risk work defaults to `PLAN MODE`; control-plane alignment does not replace execution QA
- non-trivial prompts must explicitly name the 4 control-plane files, not just say "load the control plane"
- accepted fixes must be recoverable; when relevant, prompts must route through `CHANGELOG.md` as the recovery ledger
- runtime/UI closeout requires artifact-backed proof of the accepted visible state; partial subsystem proof cannot be presented as full verification
- when a pass affects shared dataset truth across multiple visible surfaces, closeout also requires linked-surface parity proof rather than interaction-only or route-only proof
- when the acceptance target depends on visible UI correctness, closeout also requires final UI truth validation; correct data alone is not sufficient if the rendered UI still visibly looks wrong
- runtime verification must use the full canonical route identity when dynamic route identifiers are required; malformed shorthand routes are not valid proof surfaces
- runtime/UI passes must verify the exact accepted defect surface; adjacent or alternate surfaces are not valid substitutes for proof
- artifact bundles must cover every accepted defect surface or the pass cannot close
- Codex must prove claimed completion; any claimed fixed, verified, or complete result must have matching direct proof rather than narrative assertion alone
- newly discovered governing product truth from PM review must be propagated before any new Codex thread begins; thread-local truth is not allowed to govern future execution
- Codex is the primary verifier of changed behavior; Oliver Verification is only a scoped secondary QA layer
- when screenshot-driven visible truth is decisive and Codex cannot judge it confidently, the pass must pause for narrow Oliver visual adjudication instead of closing with guessed or data-only verification
- blocked verification steps should trigger a pause-and-resume assist flow, not premature closeout or broad QA handoff
- same-thread continuation is preferred to reduce repeated control-plane loading when state is unchanged
- propagation should occur at defined checkpoints rather than after every micro-step
- every non-trivial pass must explicitly declare checkpoint status before closeout; thread closure without checkpoint clearance is invalid
- verification cost should scale with stage (diagnosis vs accepted-fix closeout)
- reasoning level should match task complexity to avoid unnecessary token usage
- runtime/artifact/polling changes must declare AND verify load shape (request frequency, polling cadence, heavy endpoints) to protect Supabase
- lifecycle-edge verification is required; steady-state proof alone is insufficient for runtime correctness
- guardrail-sensitive work must use appropriate reasoning tier and must not default to lower-cost reasoning when safety is involved
- manual workflows should minimize context size, retries, and reasoning tier to reduce cost while preserving correctness
- runtime/UI-sensitive work should prefer Playwright CLI Skill for live browser verification when feasible, with Oliver verification reserved for residual or blocked gaps
- Codex must continue to obtain missing proof when it is reasonably accessible; early exit due to incomplete proof is invalid unless explicitly classified as blocked
- threads must be treated as bounded execution containers; long-running threads must be closed and restarted at defined checkpoints to preserve performance, clarity, and cost efficiency
- verification must be verdict-driven; evidence collection alone is not sufficient
- any failed verification check must block success or completion messaging
- verification that relies on scripts or browser automation must enforce failure via verdicts and/or exit semantics; successful execution alone is not proof of correctness
- verification prompts should prefer fail-fast assertions (`Assertion / Observed / Verdict`) so mismatches become explicit failures instead of passive logged output
- decisive runtime/UI verification may only close as PASS when `Verification Confidence: HIGH`; otherwise the pass must continue or be classified as BLOCKED
- Codex should attempt one bounded escalation step when confidence is not HIGH before returning BLOCKED, ensuring maximum verification completeness
- PLAN → EXECUTION transitions within the same governed flow must use control-plane carry-forward, not full reload, unless restart conditions are met
- runtime/UI verification must be performed on a proven ready-state; pre-settle evidence is non-admissible for acceptance verdicts

## Execution Commitment Rule (CRITICAL)

A PLAN MODE task is NOT complete when the plan is approved.

After approval, the Project Manager MUST immediately choose ONE of the following:

The chosen path MUST be explicitly stated in the message (no implicit or assumed transition).
Before starting any new thread following approval, the PM MUST verify control-plane alignment as defined in the Pre-Thread Control Plane Alignment rule.
If the approved transition closes one phase and begins another, the new phase must be explicitly ACTIVE before the thread begins.

### Path A — Immediate Execution (RECOMMENDED)
- proceed directly into an Implementation Pass in the SAME thread

### Path B — Logged Deferred Execution
- run a Change Propagation Pass to capture the approved plan
- THEN start an implementation thread

### Path C — Explicit Abandon
- explicitly mark the plan as abandoned or superseded
- record why

### Enforcement

Codex must not proceed with any new planning or implementation task if the prior approved plan has not resolved into one of these three paths.

If no path is declared, Codex MUST STOP and request clarification.

---

❌ The following is NOT allowed:

PLAN → APPROVE → END THREAD → START NEW PLAN

This creates execution drift and is considered a system failure.

---

Before closing any planning thread, the PM must confirm:

- execution has started
OR
- the plan has been logged for execution
OR
- the plan is explicitly abandoned

If none of these are true, the plan is incomplete.