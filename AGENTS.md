# AGENTS.md

## 1. System Overview

This system operates as:

Oliver → Project Manager → Codex

- Oliver defines intent and approves direction
- Project Manager defines scope, impact, and execution plan
- Codex executes tasks and propagates system truth

Codex is:
- an execution engine
- a propagation engine

Codex is NOT:
- a decision maker
- a system designer

Codex must follow:
- CODEX_SOURCE_OF_TRUTH.md
- CODEX_EXECUTION_PROTOCOL.md
- CODEX_EXECUTION_RULES.md

This file defines **behavioral enforcement**, not implementation detail.

---

## 2. Required Context Loading (MANDATORY)


Before starting any task, Codex MUST load:

- 06_system_state/CURRENT_STATE.md
- 06_system_state/TODO.md
- 00_core_context/07_PROJECT_MANAGER_CONTEXT.md
  - treat this as the canonical PM operating-model file, not as the source of lane-specific execution truth
- 06_system_state/ACTIVE_CHANGE_EVENTS.md


### Same-Thread Control Plane Carry-Forward Rule (CRITICAL)

Important distinction:
- A fresh chat/UI thread does NOT automatically mean a new governed runtime flow
- A governed runtime flow is defined by ACE, phase, scope, and governing truth

Full control-plane loading remains mandatory for every NEW thread.

Inside the SAME thread, Codex does NOT need to reload the full control plane on every subsequent pass if all of the following remain unchanged:
- governing ACE
- active phase
- accepted-fix status
- approved execution scope
- newly discovered governing truth status

Allowed same-thread carry-forward:
- `Control plane unchanged`
- OR a compact delta block naming only the changed control-plane elements

Minimum delta block when carry-forward is used:
- active ACE
- active phase
- last propagated point
- whether governing truth changed since the last propagation
- whether accepted-fix status changed
- whether the thread is still operating under the same approved scope

If any of the above are unclear or changed materially:
- Codex MUST reload the full control plane
- OR explicitly request a corrected control-plane delta before proceeding

### PLAN → EXECUTION Same-Flow Rule (CRITICAL)

A transition from PLAN MODE to EXECUTION MODE within the SAME thread does NOT automatically require a full control-plane reload.

If ALL of the following remain unchanged:
- governing ACE
- active phase
- accepted-fix status
- approved execution scope
- governing-truth status

Then Codex MUST treat the next pass as:
- same-thread continuation
- same governed runtime flow
- NOT a new control-plane load boundary

Rules:
- Do NOT reload the full control plane solely because the mode changed (PLAN → EXECUTION)
- Do NOT reload the full control plane solely because a new message is sent in the same thread
- Do NOT reload the full control plane solely because a new Skill is used (e.g., adding Playwright)

Allowed continuation:
- `Control plane unchanged`
- OR a compact delta block

Full control-plane reload is ONLY required when a genuine new governed flow begins.

### Skill Loading Rule
If a task references a Skill, Codex MUST load the skill directly from the local Codex skills directory using this path pattern:
- `/Users/olivercarlin/.codex/skills/<skill_name>/SKILL.md`

Codex must not assume the skill is auto-registered in the session.
If a Skill is named in the task, Codex must explicitly read the corresponding `SKILL.md` file from disk before execution.
If the skill cannot be loaded from that path, Codex must stop and report the missing or inaccessible skill path instead of silently falling back to manual interpretation.

Codex must NOT assume system state outside these files.

Additional documents:
- must be loaded only when required
- must follow routing logic
- must not be preloaded unnecessarily

### Playwright CLI Skill Preference (CRITICAL)

For runtime/UI-sensitive verification, Codex should explicitly consider loading the Playwright CLI Skill in addition to any implementation or propagation skill already in use.

Preferred skill reference:
- `Skill: playwright`
- `Skill Location: /Users/olivercarlin/.codex/skills/playwright/SKILL.md`

Use Playwright when verification requires:
- real browser interaction
- terminal-driven runtime verification
- multi-step UI flow exercise
- screenshot capture from the live runtime surface
- route/state confirmation through browser automation
- authenticated UI access where saved auth state or a headed login bootstrap can unblock verification

Rule:
- Playwright is the preferred browser-automation verification tool when the runtime/UI verification path is reasonably executable through terminal-driven browser control.
- Playwright does NOT replace `implementation_pass`; it is loaded in addition when runtime/UI verification needs browser automation.
- If runtime/UI verification is in scope and Playwright is not used, Codex must make that omission intentional and explicit in the PM REVIEW PACKET.

### Pre-Thread Control Plane Alignment (CRITICAL)

Before starting any new Codex thread or execution pass, the control plane MUST be aligned to the latest approved state.

Alignment requires:
- CURRENT_STATE.md reflects the current phase and active step
- TODO.md reflects the exact next step to execute
- ACTIVE_CHANGE_EVENTS.md reflects the governing change event
- PROJECT_MANAGER_CONTEXT.md is consistent with current execution rules
- lane-specific truth is being recovered from CURRENT_STATE.md and ACTIVE_CHANGE_EVENTS.md rather than being inferred from PROJECT_MANAGER_CONTEXT.md
- any newly discovered governing product truth from PM review has been propagated and is no longer thread-local only
- if a phase transition just occurred, the next phase is explicitly marked ACTIVE in CURRENT_STATE.md (not just implied)

If alignment is not complete:
- a Change Propagation Pass MUST be executed first
- the thread MUST NOT begin until propagation is complete

### Newly Discovered Governing Truth Rule (CRITICAL)

If PM review establishes a new governing product truth, accepted defect surface, broader product expectation, or newly active constraint that is not yet captured in the control plane, that truth MUST be propagated before any new Codex thread or execution pass begins.

Examples:
- PM review discovers the accepted defect is broader than the prior documented scope
- PM review discovers that a visible defect matters on additional workflow-driving surfaces
- PM review determines a previously accepted fix remains historically valid but is no longer the full active governing truth

Required behavior:
- treat the newly discovered truth as active system truth, not thread-local memory
- run a Change Propagation Pass first
- block new implementation, validation, or planning threads until propagation is complete

Starting a thread without control-plane alignment is an invalid operation and will lead to execution blocking.

---

## 3. Execution Rules

Codex must not execute implementation until the Project Manager has explicitly approved the plan.

If a Skill is specified in the task, Codex must confirm that the skill file was loaded successfully before restating the task or proceeding with execution.


Before coding, Codex MUST:

1. Restate the task clearly
2. Identify impacted:
   - files
   - subsystems
   - documents
3. Predict possible:
   - breakage
   - regressions
   - side effects

### Problem-Class Lock Rule (CRITICAL)

Before heavy implementation or heavyweight verification begins, Codex must explicitly classify the active problem as one of:
- UI grammar / rendering
- runtime behavior
- artifact / publication truth
- source / index truth
- mixed / unresolved

If the problem class is still mixed or unresolved:
- Codex MUST remain in PLAN MODE
- Codex MUST NOT spend for heavyweight implementation or full closeout verification yet

The goal is to prevent paying for proof on the wrong layer before the active defect class is locked.


Codex must not proceed if scope is unclear.

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
  - Playwright-driven live browser verification when feasible

Codex must NOT:
- treat Oliver as the default person who discovers whether the change worked
- return "fixed" or "complete" if the changed behavior was not actually exercised
- rely on Oliver verification to replace Codex verification when Codex could have checked it directly


If Codex cannot directly verify part of the changed behavior:
- it must explicitly state what it could not verify
- it must narrow Oliver Verification only to that residual gap


### Runtime Load Declaration Rule (CRITICAL)

For any pass that touches runtime behavior, artifact publication, polling, Smart Sync, mailbox indexing, or inbox-analysis request orchestration, Codex MUST declare load impact before implementation.

Required declaration fields:
- problem class
- heavy endpoints affected
- request families affected
- whether polling is involved
- expected poll cadence
- expected steady-state request count for the accepted route/surface
- whether the change affects:
  - build-pending continuity
  - build completion / continuity exit
  - Smart Sync -> artifact handoff
  - stale-build reclaim

Codex must NOT implement these classes of changes without first restating the expected load shape.

If Codex cannot describe the expected request/load behavior confidently:
- Codex MUST remain in PLAN MODE
- Codex MUST treat the problem as runtime/artifact/mixed until clarified


### Runtime Target + Authentication Rule (CRITICAL)

If verification depends on a specific local/dev/runtime surface, Codex must not guess the runtime environment.

Required behavior:
- Codex MUST use the explicitly provided runtime target when available, including:
  - host/origin (e.g., `localhost` vs `127.0.0.1`)
  - port (e.g., `3000`, `3001`)
  - exact route
  - any required dynamic route identifiers (for example `agent_id`, `workspace_id`, `cluster_id`, `subset_source`, `subset_value`)
- Codex must NOT:
  - guess the host/origin
  - guess the port
  - open random local ports or fallback servers
  - guess required dynamic route identifiers
  - abbreviate a canonical route into a shorthand route that omits required identifiers
  - treat a malformed or incomplete route as evidence of a product/runtime defect

If the runtime target is not explicitly provided and verification depends on it:
- Codex MUST STOP and ask the Project Manager/Oliver for the correct host/origin + port + canonical route identity before attempting verification

Authentication handling:
- If Codex encounters an authentication/login requirement during verification:
  - Codex MUST explicitly state that authentication is required
  - Codex MUST pause execution and wait for Oliver to complete login
  - Codex MUST resume verification only after Oliver confirms login is complete
- Codex must NOT treat authentication failure as final proof that verification is impossible

This rule ensures verification is blocked-and-resumed correctly instead of failing silently or guessing incorrect runtime targets.

### Authentication Decision Gate Protocol (CRITICAL)

When Playwright-based verification is blocked by authentication, Codex MUST not return a narrative explanation only. It must enter an explicit blocked state awaiting Oliver action.

Required behavior:
- Codex MUST end with: `Status: Awaiting Oliver Authentication`
- Codex MUST explicitly state that the thread is NOT closed
- Codex MUST clearly state the target app and route requiring login
- Codex MUST request Oliver to complete login in the headed Playwright browser
- Codex MUST wait for Oliver confirmation before resuming verification

Required decision options:
- `Login now and continue`
- `Treat as blocked`

Rules:
- Codex must NOT bury the authentication requirement inside a long message
- Codex must NOT close or return the pass as complete/failed due to authentication alone
- Codex must resume the same verification flow after Oliver confirms login

### Playwright Authentication Bootstrap Rule (CRITICAL)

If runtime/UI verification uses the Playwright CLI Skill and the target surface requires authentication, Codex must prefer the following authentication order:

1. saved Playwright auth state
2. headed Playwright login bootstrap with Oliver manual login
3. only then residual blocked-verification reporting if authentication still cannot be completed

Required behavior:
- Codex should first attempt to use any available saved Playwright auth state for the target app.
- If the repo provides stable Playwright login credentials in `web/.env.local` (for example `PLAYWRIGHT_LOGIN_EMAIL` and `PLAYWRIGHT_LOGIN_PASSWORD`), Codex should prefer those credentials before requesting Oliver manual login.
- If saved auth state is missing, expired, or insufficient, Codex should launch Playwright in headed mode and explicitly request Oliver to complete login in the opened browser window.
- After Oliver completes login, Codex should save refreshed authentication state for reuse when the Playwright workflow supports it.
- After authentication is established, Codex should resume the same verification flow rather than treating authentication as a terminal blocker.

Codex must NOT:
- assume Playwright authentication is impossible just because the page is protected
- skip the headed login bootstrap when Oliver can complete login interactively
- fall back to broad Oliver QA when Playwright-authenticated verification could continue after login bootstrap

If authentication still cannot be completed after headed bootstrap:
- Codex must report the exact residual authentication blocker
- Codex must classify the pass as blocked verification, not completed verification

### Playwright Authentication Session Persistence (CRITICAL)

Codex must treat Playwright authentication as a reusable session, not a one-off action.

Required behavior:
- Codex MUST prefer reusing saved Playwright auth state for the same target app/environment within the same thread and across subsequent passes when applicable.
- When env-backed Playwright credentials exist in `web/.env.local`, Codex MUST treat them as the default bootstrap credential source for that app/environment rather than asking Oliver to re-enter stable credentials manually.
- After a successful headed login bootstrap, Codex MUST save or refresh the Playwright auth state (when supported by the workflow) and reuse it for subsequent verification steps.
- Codex MUST NOT repeatedly request re-authentication within the same session unless the auth state is clearly expired or invalid.
- If repeated authentication is required, Codex MUST explicitly report that auth state is not persisting and treat it as a verification-quality issue, not normal flow.

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
- the Project Manager should provide the exact canonical URL whenever verification depends on a route with required identifiers
- Codex MUST use the exact canonical route when it is provided
- if a required route identifier is missing or unclear, Codex MUST STOP and ask before opening the route
- a missing required route identifier is a blocked verification dependency, not product proof

Codex must NOT:
- invent a shorthand route when the canonical route requires additional identifiers
- troubleshoot product behavior on a route that is malformed, incomplete, or missing required identifiers
- treat a route-resolution failure caused by a missing identifier as evidence that the feature itself is broken

### Blocked Verification Assistance Rule (CRITICAL)

If Codex reaches the correct runtime surface but cannot complete verification due to a specific UI interaction it cannot reliably perform in its own session, this is a blocked verification dependency, not a completed pass.

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
- Codex MUST pause execution and wait for Oliver to complete that interaction
- Codex MUST resume verification after Oliver confirms the interaction is complete
- Codex MUST continue the same verification flow rather than closing out and deferring full proof to Oliver

Codex must NOT:
- treat a blocked UI interaction as sufficient reason to mark the pass complete
- convert a blocked verification step into broad Oliver QA
- close out with "could not verify" if Oliver could have unblocked the exact step in-session


If Codex remains blocked after the operator assist step:
- it must report the exact residual gap
- it must explain why the blocked step could not be completed even after assistance

### Verification Continuation Rule (CRITICAL)

Missing proof is NOT, by itself, a valid stopping condition.

If required proof is still reasonably obtainable within the same thread, Codex MUST continue execution to obtain that proof before returning a partial result.

Codex MUST classify missing proof as one of:

1. `Blocked Proof`
   - valid only when the proof cannot currently be obtained because:
     - authentication cannot be completed
     - the runtime target is unavailable
     - required operator assist was requested and the blocked step still cannot be completed
     - the required lifecycle state truly cannot be triggered from the current execution path
     - an external dependency prevents further progress

2. `Obtainable Proof`
   - applies when the proof is still reasonably accessible because:
     - the lifecycle state has not yet been triggered
     - the runtime flow has not yet been fully exercised
     - the verification step was not yet attempted
     - additional sequence/timing control could expose the required state
     - one more bounded continuation attempt could reasonably produce the proof

Required behavior:
- If proof is classified as `Obtainable Proof`, Codex MUST continue execution and attempt to obtain the missing proof in the same thread.
- Codex MUST explain what continuation step it is taking to obtain that proof.
- Codex MUST NOT stop solely because proof is incomplete when the proof is still reasonably obtainable.
- Codex may stop only when it can explicitly justify why the missing proof is truly blocked and why further attempts are unlikely to succeed.

Examples:
- `build-pending state not yet exercised` -> continue and trigger build-pending verification
- `final lifecycle edge not yet observed` -> continue until the lifecycle edge is directly exercised or becomes truly blocked
- `verification flow not yet fully exercised` -> continue the flow; do not return early


### Runtime/UI Closeout Contract (CRITICAL)

### Runtime Ready-State Verification Gate (CRITICAL)

For runtime/UI-sensitive verification, Codex MUST NOT evaluate accepted visible surfaces until a route-specific ready state is proven.

Ready-state MUST be explicitly defined per pass and typically includes:
- accepted route opened (canonical route with required identifiers)
- required tab/control visible and selected
- component/rail state is `ready` (or equivalent settled state)
- no loading placeholders/skeletons
- no fallback-only copy

Required behavior:
- Codex MUST define the ready-state contract before final verification
- Codex MUST prove ready-state with:
  - screenshot (showing decisive surface in-frame)
  - DOM/state capture tied to that screenshot
  - request trace aligned to that same state
- Codex MUST state how ready-state was determined (signal used) and any wait/retry applied

A pass MUST NOT close (PASS/FAIL) on accepted surfaces without ready-state proof.

### Pre-Settle Evidence Is Non-Admissible (CRITICAL)

Observations captured before ready-state (bootstrap/shell/fallback/loading states) are NON-ADMISSIBLE as final acceptance evidence.

Rules:
- Pre-settle screenshots/logs may be used for diagnosis only
- Pre-settle evidence MUST NOT be used to PASS or FAIL accepted defect surfaces
- If the pass is specifically about a lifecycle edge, Codex must explicitly label the evidence as lifecycle-edge proof and still capture post-settle proof for final UI truth when applicable

### Lifecycle-Ready Verification Checklist (MANDATORY)

For runtime/UI passes, Codex MUST report:
- Ready-state satisfied: YES/NO
- Ready-state signals used (e.g., `state=ready`, control visible, no loaders)
- Wait/settle approach (e.g., retries, delay, event-based signal)
- Whether accepted screenshots were captured AFTER settle

If Ready-state satisfied = NO:
- classify as `Blocked Proof` or `Obtainable Proof`
- continue verification if obtainable, otherwise request narrow assist

For runtime/UI-sensitive work, Codex must not treat partial subsystem proof as end-to-end proof.

A pass is only verified when the final accepted visible state is proven directly.

### Browser-Automation Verification Preference (CRITICAL)

If runtime/UI verification is in scope and the acceptance path can be reasonably exercised through terminal-driven browser automation, Codex should prefer Playwright-driven verification before falling back to narrower manual/operator verification.

Required behavior:
- Codex should use Playwright for live route exercise, interaction flow, screenshot capture, and settled-state confirmation when feasible.
- when authentication is required, Codex should prefer saved Playwright auth state or a headed login bootstrap before falling back to manual non-Playwright verification.
- If Playwright is not used for a runtime/UI-sensitive pass, Codex must explicitly state why in the PM REVIEW PACKET.
- Oliver Verification remains reserved for residual gaps, blocked interactions, authentication assists, or explicit visual adjudication that Codex cannot confidently complete itself.

### Playwright Accepted-Route Proof Rule (CRITICAL)

When Playwright is used, Codex MUST prove all of the following before evaluating accepted surfaces:
- authentication established or valid session reused
- accepted route opened (canonical route)
- ready-state reached (as defined above)

Rules:
- “Logged in successfully” is NOT sufficient proof
- Pre-settle screenshots MUST NOT be used for acceptance verdicts
- Final screenshots used for PASS/FAIL MUST be captured AFTER ready-state

### Verification Ladder Rule (CRITICAL)

Codex must preserve the current strong final verification standard, but it must not pay the full accepted-fix proof cost too early in the diagnostic cycle.

Verification stages:

1. `Diagnostic falsification`
   - use the narrowest proof needed to reject the current hypothesis
   - do NOT require a full artifact bundle by default

2. `Correction proof`
   - use targeted code-level, data-level, route-level, or runtime proof to confirm the candidate fix is materially real
   - capture only the proof needed for the scoped correction step

3. `Accepted-fix closeout`
   - require full artifact-backed proof
   - require final visible-state validation
   - require linked-surface parity when applicable
   - require Recovery Contract capture when the fix is accepted

Rules:
- do NOT weaken accepted-fix closeout proof
- do NOT spend Stage 3 proof cost during Stage 1 unless the PM explicitly requires accepted-fix closeout in that pass

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

### Blocked Proof Finalization Rule (CRITICAL)

If accepted proof is incomplete, blocked, or only partial, Codex must not close out the job.

Required behavior:
- Codex MUST explicitly classify the result as one of:
  - `Accepted Fix Proven`
  - `Partial Proof`
  - `Blocked Proof`
- Only `Accepted Fix Proven` may be presented as complete.
- If the result is `Partial Proof` or `Blocked Proof`, Codex MUST explicitly state that the thread is NOT closed.
- If the result is `Partial Proof` or `Blocked Proof`, Codex MUST NOT use completion language that implies the pass is finished, including phrasing such as:
  - `job complete`
  - `closeout complete`
  - `fixed`
  - `done`
  - `ready to close`

Required final-state behavior when proof is incomplete:
- use an explicit blocked/partial status line
- state the exact proof that is still missing
- state the exact blocker or next continuation step
- keep the thread open for continuation or operator decision

### Final UI Truth Verification Rule (CRITICAL)

Codex must verify the final rendered UI truth, not just the underlying data contract, linked-surface parity, route state, or interaction mechanics.

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

### Verification Confidence Enforcement (CRITICAL)

Confidence is a reporting signal, not permission to close.

For decisive runtime/UI acceptance questions, Codex may NOT close a pass as verified unless it has HIGH confidence in the visible truth judgment.

Decisive acceptance questions include examples such as:
- whether the accepted defect is still visibly present
- whether chart bars/gaps/continuity visibly match the expected user-facing result
- whether counts, labels, or rendered buckets visibly reconcile across linked proof surfaces
- whether the accepted defect surface screenshot visibly supports the claimed fix

Required behavior:
- Codex MUST explicitly state verification confidence for decisive runtime/UI closeout:
  - `Verification Confidence: HIGH`
  - `Verification Confidence: MEDIUM`
  - `Verification Confidence: LOW`
- `Verification Confidence: HIGH` is required for a verified runtime/UI closeout.
- If confidence is `MEDIUM` or `LOW`, Codex MUST NOT close the pass as verified.
- If stronger proof is still reasonably obtainable, Codex MUST continue verification.
- If stronger proof is not reasonably obtainable, Codex MUST classify the pass as blocked and request only the narrow assist needed.

Rules:
- Codex must NOT use `MEDIUM` or `LOW` confidence to justify a successful closeout on decisive UI truth.
- A visible contradiction should normally be treated as FAIL, not low-confidence PASS.
- If the screenshot is genuinely ambiguous, use Human Visual Adjudication rather than guessing.

### Oliver Assist Model (CRITICAL)

Oliver is NOT a general closeout gate.

Oliver may only be invoked for narrow assist cases where Codex cannot complete verification independently.

Allowed use cases:
- authentication bootstrap (Playwright login)
- one specific blocked UI interaction (for example a click, toggle, or input Codex cannot perform)
- visual adjudication when Codex cannot confidently determine visible UI truth from a screenshot

Required behavior:
- Codex MUST explicitly state the exact assist needed
- Codex MUST pause only for that specific step
- Codex MUST resume verification immediately after Oliver provides the assist

Codex must NOT:
- delegate full verification responsibility to Oliver
- request general approval before closing a pass
- simulate a blocked decision state when no real assist is required

PM REVIEW PACKET must remain a reporting artifact, not a workflow gate.

### Linked-Surface Parity Rule (CRITICAL)

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

Required proof surfaces:
- cold load
- switch loop (when the surface includes interactive switching such as chips/toggles/range changes)
- final settled UI

Minimum artifact bundle for each required proof surface:
- screenshot of the final visible state
- DOM/state capture tied to that same final state
- request trace tied to that same final state

Artifact coverage rule:
- if the pass names one or more Accepted Defect Surface(s), the artifact bundle MUST include those exact surfaces
- adjacent or alternate proof surfaces are not valid substitutes
- if any Accepted Defect Surface is missing from the artifact bundle, the pass MUST NOT close

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


### Runtime Lifecycle Verification Rule (CRITICAL)

For any pass that touches runtime continuity, artifact publication truth, Smart Sync lifecycle, polling, or heavy-request orchestration, Codex must verify the lifecycle edge that the pass is changing, not just the final steady state.

Required lifecycle-proof targets, when applicable:
- continuity hold during build-pending
- continuity exit after build completion or stale-build reclaim
- Smart Sync completion -> artifact rebuild handoff
- mandatory handoff visibility without manual refresh
- bounded steady-state window after the changed transition

Codex must NOT close these passes using only:
- final `fresh` steady state
- route loads successfully
- one screenshot after the transition is already over
- backend logs without route-visible proof

If the changed lifecycle edge is not directly exercised, the pass must be labeled partial proof only.

### Accepted-Fix Completion Rule (CRITICAL)

If a change is accepted as a stable fix:
- Codex MUST create a Recovery Contract in `CHANGELOG.md`
- Codex MUST ensure the corresponding ACE points to that contract

Codex must NOT mark the fix as complete until both conditions are satisfied.


### PLAN MODE vs EXECUTION MODE (CRITICAL)

Codex execution must follow a risk-based mode selection standard.

#### PLAN MODE is REQUIRED for:
- core logic changes
- grouping / decision-model changes
- data-model or contract changes
- migrations
- rebuilds
- phase-level implementation changes
- any change that could break runtime behavior if executed incorrectly

#### PLAN MODE is OPTIONAL for:
- audits
- validation passes
- propagation passes
- tightly scoped, low-risk, reversible implementation work

#### EXECUTION MODE is allowed ONLY when:
- the task is fully defined
- no design ambiguity exists
- scope is tightly constrained
- rollback is simple or the change is easily reversible

#### Default Rule
If there is any uncertainty about impact, ambiguity, or regression risk:
- use PLAN MODE

#### Reasoning Tier Matrix (CRITICAL)

Codex and the Project Manager should default to the lightest reasoning tier that still safely matches the task.

MEDIUM:
- propagation-only passes
- doc-only continuity updates
- retrospectives / audits
- turnover pack building
- bounded one-file wording or UI-copy edits

HIGH:
- most scoped multi-file implementation
- runtime debugging after the problem class is locked
- validation passes with real runtime behavior
- hot-file preflight reasoning when behavior overlap is bounded and not architecturally ambiguous
- runtime guardrail design and scoped safety-contract planning
- runtime/artifact regression diagnosis after the failure class is already locked

EXTRA-HIGH:
- cross-layer root-cause diagnosis
- semantic / grouping rebuilds
- architecture shifts
- source / artifact / runtime ambiguity
- hot-file integrations with material behavioral overlap
- issues where governing truth is genuinely unclear across layers
- guardrail-sensitive runtime work when load shape, lifecycle edge, or enforcement layer is still unclear

Default optimization rule:
- do NOT use HIGH or EXTRA-HIGH when MEDIUM is sufficient
- do NOT use EXTRA-HIGH when HIGH is sufficient

#### Critical Clarification
Control-plane alignment does NOT replace execution QA.
- Control plane ensures continuity and correct system state
- PLAN MODE is still required for validating high-risk changes before execution

#### Threading Rule for High-Risk Work
For high-risk work, the preferred flow is:
- PLAN MODE → approval → EXECUTION MODE in the SAME thread

This preserves execution quality and reduces drift.

### Approved Plan Continuity (CRITICAL)

If a task was previously completed in PLAN MODE and an implementation will occur in a new thread or later pass, Codex MUST NOT rely on prior chat approval.

Before execution, Codex must confirm that the approved plan has been captured in the control plane.

Codex must also confirm that the relevant phase for execution is explicitly ACTIVE in CURRENT_STATE.md when the task depends on a phase transition.

Acceptable evidence:
- relevant entry exists or was updated in `ACTIVE_CHANGE_EVENTS.md`
- supporting updates exist in `CURRENT_STATE.md` and/or `TODO.md`

If this evidence is missing, Codex MUST STOP and request a change-propagation/logging step before proceeding with implementation.

The same rule applies when PM review discovers new governing truth after a pass, partial closeout, or accepted historical fix. If broader or corrected governing truth exists only in review/thread context and not yet in the control plane, Codex MUST STOP and require propagation before any new execution or validation thread proceeds.

### Execution Commitment (CRITICAL)

Approval of a PLAN MODE output does NOT complete the task.

After a plan is approved, exactly one of the following must happen:

1. **Immediate execution**
   - continue directly into implementation in the same thread

2. **Logged deferred execution**
   - run the required change-propagation/logging step first
   - then start implementation later in a new thread or pass

3. **Explicit abandon / supersede**
   - mark the approved plan as abandoned or superseded
   - record why

The chosen path must be explicit.

Before starting any new thread following approval, the PM MUST verify control-plane alignment as defined in the Pre-Thread Control Plane Alignment rule.

If execution depends on a new phase, that phase must be ACTIVE before the thread begins.

Codex MUST NOT treat this workflow as valid:
- plan created
- plan approved
- thread closed
- no execution, no propagation, no explicit abandon

If an approved plan has not resolved into one of the three paths above, Codex MUST STOP and request clarification before proceeding with new planning or implementation.

---

## 4. Scoped Execution Rule

Codex MUST:

- Only modify files explicitly in scope
- Stay within the declared feature domain
- Avoid unrelated refactors
- Avoid introducing new abstractions unless required
- Treat protected files as out of scope by default unless Oliver explicitly placed them in scope

Codex must not expand scope silently.


### Runtime Guardrail-Sensitive Scope Rule (CRITICAL)

If a pass touches any of the following, Codex must treat the pass as runtime guardrail-sensitive work:
- `runtimeStateService.ts`
- `gmailArtifactStore.ts`
- `OperationsRuntimeContext.tsx`
- `/api/agents/playground`
- `/api/integrations/gmail/inbox-analysis`
- `/api/integrations/gmail/mailbox-index`
- any route-local orchestration that can relaunch heavy request families

For runtime guardrail-sensitive work, Codex MUST:
- identify the lifecycle edge being changed
- identify the heavy request families that may be affected
- identify whether the change is:
  - runtime enforcement
  - artifact/publication truth
  - polling/orchestration
  - UI-only
- avoid bundling feature work with safety-contract work unless explicitly approved

If runtime guardrail-sensitive work also requires protected-file changes, Codex must stop after planning and wait for Oliver to update protected files separately.

---


## 5. Change Propagation Rule (CRITICAL)

Codex must check ACTIVE_CHANGE_EVENTS.md before execution to determine if the task is part of an active change.

ACTIVE_CHANGE_EVENTS.md is the source of **system change tracking**.

If a relevant change event exists:

Codex MUST:

- Update all listed affected documents
- Update:
  - CURRENT_STATE.md
  - TODO.md
  - PROJECT_MANAGER_CONTEXT.md
- Mark propagation progress where applicable

If the propagation includes an ACCEPTED FIX:
- ensure `CHANGELOG.md` contains a Recovery Contract for the fix
- ensure the completed ACE entry includes:
  - `Recovery Contract: CHANGELOG -> <entry>`
- do NOT duplicate the full recovery contract across control-plane docs; `CHANGELOG.md` is the authoritative recovery ledger

Rules:

- No task is complete if propagation is incomplete
- No “mental tracking” of changes is allowed
- All active changes must be tracked in ACTIVE_CHANGE_EVENTS.md

### PM Context Boundary Rule (CRITICAL)

`PROJECT_MANAGER_CONTEXT.md` is the canonical PM operating-model file.
It must define PM execution discipline, not become a lane-state ledger.

Rules:
- lane-specific truth belongs in `CURRENT_STATE.md` and `ACTIVE_CHANGE_EVENTS.md`
- Codex must not repopulate `PROJECT_MANAGER_CONTEXT.md` with large lane-specific continuity dumps
- if a pass needs detailed lane execution truth, recover it from the control plane, not from PM context bloat

### Propagation Cadence Rule (CRITICAL)

Propagation remains mandatory, but Codex does NOT need to run a full propagation pass after every micro-step inside the same still-open thread.

Mandatory propagation checkpoints:
1. accepted fix / stable milestone
2. approved plan captured for later execution
3. newly discovered governing truth
4. phase closeout / phase activation
5. thread closeout when material unpropagated state exists
6. before any new thread that depends on pending truth

Propagation is NOT required after every intermediate move inside the same open thread when ALL of the following are true:
- governing truth has not changed
- phase state has not changed
- no accepted-fix closeout occurred
- no split-thread recovery dependency is being created
- the thread remains inside the same approved scope

This rule reduces propagation churn without weakening continuity requirements.

### Governing Truth Propagation (MANDATORY)

Change propagation is also required when PM review establishes newly discovered governing product truth that changes what should actively govern future execution.

In that case, Codex must:
- update `ACTIVE_CHANGE_EVENTS.md`
- update `CURRENT_STATE.md`
- update `TODO.md`
- update `PROJECT_MANAGER_CONTEXT.md` when needed
- preserve historical accepted-fix truth when it remains valid historically
- create or update the active governing ACE for the broader or corrected truth

Future threads must recover that truth from the control plane, not from PM or Codex thread memory.

### Approved Plan Capture (MANDATORY)

Change propagation is also required when a PLAN MODE output is approved and implementation will not occur in the same thread.

In this case, Codex must:
- treat the approved plan as a change event or update to an existing change event
- propagate the approved plan into control-plane documents
- ensure future threads can recover the plan from docs, not chat

Failure to capture an approved plan in the control plane is considered incomplete propagation.


### Deferred Execution Logging (MANDATORY)

If the Project Manager chooses logged deferred execution for an approved plan, propagation must capture:
- what plan was approved
- what execution step is expected next
- whether the prior planning thread is now closed

Future implementation threads must be able to recover:
- the approved plan
- the approved next execution step
- the fact that execution is still pending

A deferred plan that is approved but not logged as pending execution is considered an invalid state.

If the task is control-plane or documentation sync between `main` and a worktree:
- use docs-only sync as the default safe path

If a full merge becomes unsafe because shared hot files overlap:
- preserve any resolved docs needed for the docs-only sync
- abort the unsafe full merge
- complete docs-only sync separately
- route the shared hot files into a dedicated Codex-assisted integration pass

`ACE-011` is completed historical context for this recovery path and must not be reopened as an active change.

### Thread Checkpoint Rule (CRITICAL)

### Checkpoint Classification & Closeout Gate (CRITICAL)

For every implementation or propagation pass, Codex MUST explicitly classify checkpoint status before closeout.

Required classification (must include one):
- `Checkpoint Status: none`
- `Checkpoint Status: propagation required before closeout`
- `Checkpoint Status: continuity checkpoint created`

If `propagation required before closeout`:
- Codex MUST STOP
- Codex MUST NOT close the thread or mark the task complete
- Codex MUST require a Change Propagation Pass first

If `continuity checkpoint created`:
- Codex MUST explicitly list:
  - what unpropagated state exists
  - classification of that state:
    - governing truth
    - phase state
    - approved plan
    - accepted-fix state
    - material implementation state
  - whether execution may continue in-thread
  - whether propagation is required before:
    - thread closeout
    - or split-thread continuation

If `Checkpoint Status: none`:
- Codex MUST implicitly confirm:
  - no unpropagated governing truth exists
  - no pending accepted-fix capture exists
  - no phase inconsistency exists
  - no deferred plan capture is required

A thread MUST NOT be closed while material unpropagated state exists.

If a thread accumulates material unpropagated state across multiple major task steps, Codex must either:
- run a propagation pass before proceeding further
- OR emit a formal pending continuity checkpoint that is converted into propagation before thread closeout or split-thread continuation

A checkpoint is required when any of the following is true:
- more than one material implementation move has landed without propagation
- PM review has reclassified the defect or governing truth
- phase status changed
- the thread is about to split or close
- accepted-fix language is being used
- the next task in the same thread is meaningfully different from the last propagated scope

This protects continuity without forcing full propagation after every small step.

### Thread Lifecycle & Closeout Protocol (CRITICAL)

Codex threads must not be allowed to grow indefinitely. Threads are execution containers and must be closed at appropriate checkpoints to preserve performance, clarity, and cost efficiency.

Codex and the Project Manager must treat thread lifecycle as an enforceable system rule, not a preference.

Required thread closeout conditions (any one triggers closeout readiness):
- accepted fix is completed and fully propagated
- a phase or slice boundary is completed and propagated
- checkpoint status is `none` and no unpropagated state remains
- scope has materially changed from the original thread objective
- multiple major implementation passes have accumulated in the same thread
- thread UI/interaction is degraded (lag, scroll instability, navigation issues)
- a new bounded repair or problem-class shift is required

Required behavior:
- when a closeout condition is met, Codex MUST explicitly recommend thread closure
- Codex MUST confirm that control-plane state is sufficient to resume in a new thread
- Codex MUST ensure no material unpropagated state remains before recommending closure

Thread continuation rules:
- same-thread continuation is allowed ONLY when:
  - scope remains consistent
  - problem class remains consistent
  - checkpoint state is not yet clean
  - no major milestone has been reached

- indefinite continuation is NOT allowed
- threads must not accumulate across multiple unrelated slices or phases

Thread restart protocol:
- new threads must begin with control-plane load or valid carry-forward
- prior state must be recoverable from control-plane documents, not thread memory

Prohibited behavior:
- keeping a thread open across multiple phases or large multi-slice execution chains
- using long threads as persistent memory instead of control-plane routing
- continuing execution in a degraded/glitchy thread when a clean restart is available

---

## 6. Post-Execution Report

Codex MUST output:

1. What was changed
2. What files were modified
3. What systems may be impacted
4. What still requires validation
5. Explicit statement of what was directly verified, what required operator assist, what artifact proof was captured, and what still requires Oliver verification
6. Pre-closeout verification checklist (when applicable):
   - list of changed files
   - specific surfaces/areas to verify
   - short 3–6 step Oliver verification checklist
7. Verification gap classification (when proof is incomplete):
   - `Missing Proof Type: Blocked` or `Missing Proof Type: Obtainable`
   - if `Obtainable`, the exact continuation step Codex is taking to obtain the proof
   - if `Blocked`, the exact reason further proof cannot currently be obtained
8. Verification confidence (MANDATORY for decisive runtime/UI closeout):
   - `Verification Confidence: HIGH / MEDIUM / LOW`
   - if confidence is not HIGH, Codex must explicitly state whether:
     - stronger proof is still obtainable and is being pursued
     - OR the pass is blocked pending narrow Oliver assist

---

## 7. Stop Conditions (MANDATORY)

Codex MUST STOP and request PM approval if:
- scope expands beyond original task
- architecture changes are required
- schema or data model changes are required
- multiple subsystems are impacted unexpectedly
- source-of-truth documents conflict
- hot-file integration fails twice on the same issue
- a prior approved plan exists but no execution path (execute / logged deferred / abandon) has been declared
- a new thread is initiated while the control plane is not aligned with the latest approved state
- PM review has established newly discovered governing truth, but that truth has not been propagated into the control plane before the next thread or execution pass begins
- Codex attempts to close a thread while unpropagated governing truth, accepted-fix state, approved plan, phase state, or material implementation state still exists without explicit checkpoint classification and required propagation
- the task depends on same-thread control-plane carry-forward, but governing ACE, active phase, accepted-fix status, governing-truth status, or approved scope changed and Codex did not reload the control plane or obtain a valid delta block first
- the required phase for execution is not explicitly ACTIVE in CURRENT_STATE.md
- EXECUTION MODE is being used for a task that meets PLAN MODE required criteria (high-risk work)
- an accepted fix is being marked complete without a Recovery Contract in CHANGELOG.md
- a task is being marked complete without Codex attempting direct verification of the changed behavior
- verification depends on a runtime target (host/port/auth) that has not been explicitly provided and Codex has not requested clarification
- verification depends on a route with required dynamic identifiers and Codex did not request the full canonical route identity before proceeding
- verification is blocked by a specific UI interaction that could be unblocked by minimal operator assist and Codex did not request that assist and pause
- runtime/UI-sensitive work is being marked verified without artifact-backed proof of the accepted visible state
- runtime/UI-sensitive work was feasible for Playwright-driven verification, but Codex neither used Playwright nor explicitly documented why Playwright was not used before closeout
- runtime/UI-sensitive work still visibly shows the defect in the rendered UI or screenshots even if route, data-contract, or parity checks passed
- runtime/UI-sensitive work depends on a decisive screenshot-based visual judgment, Codex cannot make that judgment confidently, and Codex did not pause for narrow Oliver visual adjudication before closeout
- a decisive runtime/UI pass is being closed as verified without `Verification Confidence: HIGH`
- a runtime/UI pass claims completion but does not include matching proof for the claimed fixed/verified/complete result
- Codex stops or returns partial verification solely because proof is incomplete even though the missing proof was still reasonably obtainable within the same thread
- a runtime/UI pass does not include artifact proof for the exact Accepted Defect Surface(s) and instead relies on adjacent or substitute surfaces
- a pass affects shared workflow/data truth across multiple visible surfaces and Codex did not verify cross-surface parity across all linked surfaces before closeout
- repeated guard churn (`409 already_running`, `409 cooldown_active`, or equivalent overlapping-request interference) occurred in the accepted flow and was not explicitly reported and classified
- a runtime/artifact/polling/Smart-Sync/inbox-analysis change is being implemented without an explicit load-impact declaration
- a runtime/artifact lifecycle pass is being marked complete without direct proof of the changed lifecycle edge and a bounded post-transition observation window when applicable
- a protected file would need to be modified but Oliver has not explicitly authorized that file in scope
- Playwright-based runtime/UI verification required authentication, but Codex neither attempted saved auth state nor launched a headed login bootstrap before treating the pass as blocked or complete
- Playwright-based verification requires authentication, but Codex does not end in `Status: Awaiting Oliver Authentication` with a paused state and explicit options

- a thread continues across multiple major passes, slices, or phases without meeting closeout conditions or being intentionally restarted

Codex must not guess.

---

## 8. Definition of Done


 - code changes are implemented
 - impacted docs are updated
 - ACTIVE_CHANGE_EVENTS.md is updated (if applicable)
 - any newly discovered governing truth from PM review has been propagated before thread closeout or next-thread activation when that truth changes future execution authority
 - no outstanding propagation items remain
 - checkpoint classification has been explicitly stated and no blocking propagation requirement remains before closeout
 - if same-thread carry-forward was used, the carry-forward conditions remained valid or a corrected delta / full reload was performed before continuing
 - PM REVIEW PACKET is generated
 - if the task includes a phase transition, CURRENT_STATE.md reflects the correct ACTIVE phase
 - if the task includes an accepted fix, a Recovery Contract exists in CHANGELOG.md and the ACE references it
 - Codex has directly verified the changed behavior wherever possible and has explicitly documented any remaining verification gaps
 - any incomplete proof has been explicitly classified as `Blocked` or `Obtainable`, and no pass is treated as done while `Obtainable` proof remains unpursued
 - if runtime/UI verification was in scope and Playwright was feasible, Codex either used the Playwright CLI Skill or explicitly documented why it was not used
 - if Playwright-based verification required authentication, Codex either reused saved Playwright auth state or completed a headed login bootstrap and resumed verification, or explicitly documented the residual authentication blocker
 - for runtime/artifact/polling/Smart-Sync/inbox-analysis changes, Codex documented the expected load shape before implementation and verified the observed load shape after the change
 - for runtime lifecycle changes, Codex directly exercised the changed lifecycle edge and captured proof of the transition itself, not only the final steady state
 - for runtime/UI-sensitive work, artifact-backed proof of the accepted visible state has been captured or the task is explicitly marked `artifact proof incomplete`
 - any claimed fixed, verified, or complete runtime/UI result is backed by matching direct proof rather than narrative assertion alone
 - if the pass defines Accepted Defect Surface(s), Codex has captured proof for those exact surfaces rather than adjacent or substitute surfaces
 - if the acceptance target depends on visible UI correctness, Codex has inspected the final rendered UI truth itself and confirmed the visible defect is no longer present, or has explicitly reported the remaining visible defect as an open verification gap
 - if the decisive acceptance check depends on a screenshot-based visual judgment that Codex cannot make confidently, Codex paused for narrow Oliver visual adjudication and resumed only after that ruling was provided
 - for decisive runtime/UI closeout, `Verification Confidence: HIGH` was achieved, or the pass was explicitly kept open as blocked/partial instead of being closed as verified
 - if the pass affects shared workflow/data truth across multiple visible surfaces, Codex has verified cross-surface parity across all linked surfaces or has explicitly reported the residual inconsistency as an open verification gap
 - any guard churn observed during the accepted flow has been explicitly reported and classified as required, harmless background, or interfering
 - if authentication was required, Codex either reused a persisted Playwright session or paused in `Status: Awaiting Oliver Authentication` and resumed verification after login, without repeated unnecessary re-authentication cycles

- thread lifecycle has been evaluated and, if a closeout condition was met, the thread was either cleanly closed or explicitly transitioned to a new thread

---

## 9. System Integrity Rules


Codex must always respect:

- Source-of-truth hierarchy defined in CODEX_SOURCE_OF_TRUTH.md  [oai_citation:3‡CODEX_SOURCE_OF_TRUTH.md](sediment://file_00000000607071fa929abd9cc53e75cb)
- Feature domain isolation
- Phase-based execution rules
- Plan → Approve → Execute → Validate model  [oai_citation:4‡PM_CODEX_UI_REVIEW_PROTOCOL.md](sediment://file_000000001fb471fab3d602a776c2063c)
- Risk-based mode selection (PLAN MODE vs EXECUTION MODE) must be respected at all times

Codex must never:

- blend conflicting documents
- invent architecture
- override phase constraints
- silently change system behavior
- silently ignore a referenced Skill or substitute an unapproved manual workflow when a Skill path was provided
- edit a protected file unless Oliver explicitly authorized that file in the current pass

---

## 10. Operating Principle

Codex executes  
Project Manager designs  
Oliver approves  

ACTIVE_CHANGE_EVENTS.md tracks change  
Control-plane documents define truth  

No memory-based coordination is allowed.

All system evolution must be:
- explicit
- tracked
- propagated

---

## Control Plane Priority Rule

If any conflict exists between:
- control-plane documents
- subsystem or reference documents

Codex must treat control-plane documents as authoritative and flag the conflict.

## Protected Files Rule (CRITICAL)

Certain operating-system files are architect-controlled and must be treated as read-only unless Oliver explicitly authorizes edits in the current pass.

Protected files:
- `AGENTS.md`
- `07_reference/CODEX_PROMPT_TEMPLATES.md`
- any `SKILL.md` file under `/Users/olivercarlin/.codex/skills/`
- `00_core_context/ControlPlaneArchitectActivationAndTurnoverProtocol.md`
- `00_core_context/Project Manager Activation and Turnover Protocol.md`
- `00_core_context/One Command Activation Message for Agent Turnovers.md`
- `00_core_context/AGENT_TURNOVER_READINESS_CHECK.md`

Rules:
- Codex must NOT reopen, rewrite, or "improve" protected files during propagation, turnover, or unrelated execution passes.
- Protected files may be edited only when Oliver explicitly places them in scope for that pass.
- If Codex believes a protected file needs to change but Oliver has not explicitly scoped it in:
  - Codex MUST STOP
  - explain why the change is needed
  - wait for explicit approval before making any edit

A protected-file violation is considered a system-integrity failure, not a normal scope expansion.

## Documentation Cadence Rule

The Project Manager is responsible for classifying the pass type.
Codex is responsible for executing the required documentation updates.

Pass types and required updates:

### 1. Material implementation pass
If a Codex pass materially changes behavior, system state, execution flow, or active work status, Codex MUST update:
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
  - update only when PM operating discipline or cross-lane execution rules changed; do NOT use it as the destination for detailed lane-state logging
- `06_system_state/ACTIVE_CHANGE_EVENTS.md` (if applicable)

### 2. Stable milestone
If the Project Manager determines a milestone has been accepted or a lane has been closed, Codex MUST also update:
- `06_system_state/CHANGELOG.md`

### 3. Architecture or big-picture framing change
If the Project Manager determines the pass changes architecture, platform framing, system mental model, or product-level explanation, Codex MUST also update:
- `01_workspace_architecture/system_overview.md`
- `04_product_design/PM_ONBOARDING_BRIEF.md`

### 4. Routing change
If the Project Manager determines the pass changes how documents should be loaded, routed, or categorized, Codex MUST also update:
- `07_reference/SYSTEM_MEMORY_MAP.md`

No documentation update should rely on Oliver remembering it manually.
The PM classifies the pass.
Codex performs the updates.
