# implementation_pass

## Purpose
Execute a scoped implementation task with full validation and required document updates.


## Rules
- Follow AGENTS.md at all times
- Do NOT expand scope
- Do NOT introduce new abstractions unless required
- Do NOT modify unrelated files

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
- Codex must NOT reopen, rewrite, or "improve" protected files during implementation passes.
- Protected files may only be edited if they are explicitly listed in the task scope.
- If Codex determines a protected file needs modification but it is not in scope:
  - STOP execution
  - explain why the change is required
  - wait for explicit approval before proceeding

A protected-file violation is considered a system-integrity failure.

## Mode & Risk Awareness (CRITICAL)
- This skill runs in EXECUTION MODE. It MUST NOT be used to replace PLAN MODE for high-risk work.
- If the task involves core logic, data model changes, migrations, rebuilds, or phase-level changes and there is no approved plan captured in the control plane, Codex MUST STOP and request PLAN MODE first.
- If uncertainty exists about behavior impact or regressions, STOP and request clarification or PLAN MODE.
- If PM review has established newly discovered governing product truth that is not yet propagated into the control plane, STOP and require a Change Propagation Pass before execution.

## Steps

1. Load control plane:
   - CURRENT_STATE.md
   - TODO.md
   - PROJECT_MANAGER_CONTEXT.md
   - ACTIVE_CHANGE_EVENTS.md

   Same-thread carry-forward rule:
   - full control-plane loading remains mandatory for NEW threads
   - inside the SAME thread, full reload is not required if all of the following remain unchanged:
     - governing ACE
     - active phase
     - accepted-fix status
     - approved execution scope
     - newly discovered governing truth status
   - allowed carry-forward forms:
     - `Control plane unchanged`
     - OR a compact delta block naming only the changed control-plane elements
   - if any of the above changed materially or is unclear:
     - reload the full control plane
     - OR STOP and request a corrected control-plane delta before proceeding

2. Check governing-truth continuity before routing:
   - determine whether PM review established any newly discovered governing product truth after the last propagation point
   - if broader or corrected governing truth exists only in PM/Codex thread context and not in the control plane:
     - STOP execution
     - require a Change Propagation Pass first
     - do NOT continue implementation from stale control-plane scope

3. Load routed domain context:
   - Use SYSTEM_MEMORY_MAP.md
   - Load only required docs
   - For runtime/UI-sensitive verification, explicitly consider whether the Playwright CLI Skill should also be loaded:
     - `Skill: playwright`
     - `Skill Location: /Users/olivercarlin/.codex/skills/playwright/SKILL.md`
     - use it in addition to `implementation_pass` when browser automation is feasible

4. Restate task:
   - objective
   - constraints
   - exact scope
   - whether any newly discovered governing truth was already propagated before this thread began
   - whether historical accepted truth differs from the newly active governing truth for this execution

5. Identify:
   - impacted files
   - impacted subsystems
   - impacted documents
   - explicitly confirm that no protected files are included in the impacted file set unless authorized

6. Predict (explicit):
   - list exact risks (logic, data, UI, performance)
   - list potential regressions by surface (routes, components, APIs)
   - identify any cross-file dependencies that could break
   - define how each risk will be validated after execution
   - explicitly identify whether the change affects:
     - visual-only state
     - route/query state
     - shared workflow/data truth across multiple visible surfaces
   - if shared workflow/data truth is affected, list all linked surfaces that must remain consistent (e.g., workflow totals, distribution counts, sender rows, Time Context, Decision Mode)
   - explicitly determine whether execution depends on broader or corrected governing truth discovered in PM review after the prior pass
   - if yes, confirm that truth is already present in:
     - ACTIVE_CHANGE_EVENTS.md
     - CURRENT_STATE.md
     - TODO.md
     - PROJECT_MANAGER_CONTEXT.md (when needed)
   - if not, STOP and require propagation before execution

7. Execute:
   - implement changes
   - stay strictly within scope
   - do NOT modify any protected files unless they are explicitly in scope

8. Propagate changes (MANDATORY):
   - update CURRENT_STATE.md
   - update TODO.md
   - update PROJECT_MANAGER_CONTEXT.md
   - update ACTIVE_CHANGE_EVENTS.md (if relevant)

   If this pass results in an ACCEPTED FIX:
   - create or update a corresponding entry in CHANGELOG.md
   - include a full Recovery Contract (see Step 8.2)
   - ensure the completed ACE entry includes:
     - `Recovery Contract: CHANGELOG -> <entry>`

9. Validate (MANDATORY – depth depends on risk):
   Verification ladder rule:
   - preserve the current strong accepted-fix closeout standard
   - do NOT pay full accepted-fix proof cost too early in the diagnostic cycle

   Validation stages:
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
   - Stage-fit proof rule (CRITICAL):
     - capture only the proof required for the current validation stage unless accepted-fix closeout is explicitly in scope
     - diagnostic work must not default to full artifact-bundle capture
     - accepted-fix closeout must still satisfy the full Runtime/UI Closeout Contract when applicable
   - Code-level checks:
     - project builds successfully (no compile/type errors)
     - lint/typecheck passes (if applicable)
   - Proof-of-completion checks (CRITICAL):
     - Codex must not claim any result as fixed, verified, or complete without matching proof
     - every claimed result must be backed by direct evidence tied to the accepted defect surface or validation surface
     - if proof is partial or incomplete, Codex must explicitly label it as partial proof, not full completion
     - if accepted proof is incomplete, blocked, or only partial, Codex must not close out the job or use completion language that implies the pass is done

   - Machine-enforced verification verdicts (CRITICAL):
     - verification scripts, browser collectors, and comparison utilities must act as verdict engines, not evidence collectors only
     - if a check computes pass/fail-relevant comparisons, those comparisons MUST be turned into explicit PASS/FAIL outcomes
     - logging mismatches without failing the pass is invalid
     - if any required verification check fails, Codex MUST classify the pass as failed or blocked; it must NOT proceed with success messaging
     - if a script is used for verification and it does not enforce verdicts directly, Codex MUST manually apply explicit PASS/FAIL judgment before returning
   - Verification continuation (CRITICAL):
     - missing proof is NOT a valid stopping condition by itself
     - Codex MUST classify missing proof as:
       - `Missing Proof Type: Blocked`
       - `Missing Proof Type: Obtainable`
     - if `Missing Proof Type: Obtainable`:
       - Codex MUST continue execution in the same thread to obtain the proof
       - Codex MUST state the exact continuation step it is taking (for example: trigger lifecycle edge, exercise route, bounded wait/retry, complete unattempted verification step)
       - Codex MUST NOT return a partial result solely because proof is still incomplete
       - if the exact runtime route is open but the accepted visible state is not yet proven, Codex MUST treat that as `Obtainable` proof and continue with bounded recovery/verification attempts instead of stopping early
     - if `Missing Proof Type: Blocked`:
       - Codex MUST state the exact blocking reason
       - Codex MUST justify why further attempts are unlikely to succeed
   - Runtime checks:
   - Browser-automation verification preference (CRITICAL):
     - if runtime/UI verification is in scope and the acceptance path can be reasonably exercised through terminal-driven browser automation, Codex should load and use the Playwright CLI Skill in addition to `implementation_pass`
     - prefer Playwright-driven live browser verification before falling back to narrower manual/operator verification
     - if Playwright is not used for a runtime/UI-sensitive pass, explicitly document why in the PM REVIEW PACKET
     - start the app / relevant services when needed
     - exercise the exact modified flows (UI routes, API endpoints, actions)
     - confirm no console/server errors (e.g., no 4xx/5xx, no uncaught exceptions)
   - Behavior checks:
     - verify the feature works as intended end-to-end
     - confirm edge cases for the change (invalid input, empty state, reload/rehydrate)
   - Regression checks (scoped):
     - re-test only the directly impacted surfaces identified in Step 4
     - confirm no unintended changes outside scope
   - Parity checks (when applicable):
     - if UI-driven: ensure UI state matches underlying data/response
     - if data-driven: ensure outputs match expected contract/shape
   - Linked-surface parity checks (CRITICAL when applicable):
     - if multiple visible surfaces represent the same filtered/shared dataset, verify consistency across ALL of them
     - confirm counts, rows, summaries, and derived views align
     - do NOT treat one matching surface as sufficient proof when others exist

   - Cross-scope reconciliation enforcement (CRITICAL when applicable):
     - when acceptance depends on overlap or reconciliation across scopes/surfaces, Codex MUST produce explicit reconciliation verdicts for each required comparison
     - examples:
       - daily vs overlapping weekly bucket
       - weekly vs overlapping monthly bucket
       - current month vs yearly current-month projection
       - yearly current month vs all-history / all-indexed current month
     - any reconciliation mismatch MUST be treated as FAIL unless the pass explicitly enters Human Visual Adjudication or a blocked-proof state
     - computed comparisons that are only printed/logged do NOT satisfy verification
   - Final UI truth checks (CRITICAL when applicable):
     - Codex MUST inspect the final rendered UI state directly (not just logs, data, or route state)
     - confirm the UI no longer visibly shows the original defect
     - verify charts, layouts, and visual continuity are correct when relevant
     - do NOT treat correct data or parity as sufficient if the rendered UI still looks wrong
   - Reproduction checks (MANDATORY when fixing a bug):
     - reproduce the reported defect BEFORE the fix (or simulate via fixture)
     - confirm the defect no longer occurs AFTER the fix (before/after comparison)
   - Continuation-first proof gathering (EFFICIENCY + COMPLETENESS):
     - if required proof is incomplete but still reasonably obtainable, perform at least one bounded continuation attempt before returning
     - prefer triggering the required state or lifecycle edge over reporting incompleteness prematurely
     - only stop when the proof is truly blocked or the bounded continuation attempt has failed for an explicit reason
   - Route/flow exercise (MANDATORY when a specific surface is named):
     - directly exercise the exact route/flow mentioned in the task (e.g., page URL, API endpoint)
     - confirm expected behavior matches acceptance criteria
   - Accepted defect surface checks (CRITICAL when applicable):
     - explicitly restate the Accepted Defect Surface(s) before verification
     - ensure verification is performed on those exact surfaces
     - do NOT substitute adjacent surfaces (e.g., 1D or Custom when the defect is on 1W or 1M)
     - if verification is performed on the wrong surface, treat the pass as invalid

   - Artifact completeness enforcement (CRITICAL):
     - for every required proof surface, Codex MUST verify that the decisive UI region is actually visible in the screenshot/artifact
     - a screenshot is invalid if it captures the page but misses the actual chart, workflow card, or acceptance surface being claimed as verified
     - screenshot present != surface captured
     - if the accepted surface is not visibly present, the artifact bundle MUST be marked incomplete and the pass MUST NOT close as verified
   - Evidence capture (MANDATORY for non-trivial work):
     - capture concrete evidence of verification (e.g., screenshots, logs, console output, request/response samples)

9.1 Evidence (REQUIRED for non-trivial work):
   - summarize what was actually executed and verified
   - include key outputs (logs, responses, before/after notes)
   - note any limitations in verification

9.2 Recovery Contract (MANDATORY for accepted fixes):
   A fix is NOT complete until a recovery-grade contract is written to CHANGELOG.md.

   The contract MUST include:
   - Accepted invariant
   - Source layer fixed (UI / runtime / artifact / API)
   - Touched files/functions (exact)
   - Canonical verification route (exact URL)
   - Acceptance proof (exact outputs / numbers)
   - Replay steps (deterministic)
   - Rollback guidance (if applicable)

   If the change is exploratory, partial, or not accepted as a stable fix:
   - do NOT create a recovery contract
   - clearly state that the fix is not yet accepted

9.3 UI Verification (REQUIRED when UI is affected):
   - Codex MUST attempt to verify UI behavior directly when feasible (e.g., via local dev server, browser automation, or inspection tools)
   - when browser automation is feasible, prefer Playwright CLI Skill for live route exercise, interaction flow, screenshot capture, and settled-state confirmation
   - Must confirm:
     - visible state matches expected outcome
     - interactions (clicks, navigation, filters) behave as intended
     - no console errors occur during interaction
     - when shared dataset truth is involved, verify the same dataset produces consistent visible results across all linked UI surfaces
     - confirm that the final rendered UI does not visibly contain the original bug, broken visual state, incorrect gaps, or contradictions
   - If full UI verification is not possible:
     - explicitly state the limitation
     - provide precise, minimal Oliver Verification steps only for the remaining gap

9.4 Runtime Target + Authentication (CRITICAL for verification)
   When verification depends on a local/dev/runtime surface, Codex must not guess the environment.

   Required behavior:
   - Use the explicitly provided runtime target when available, including:
     - host/origin (e.g., `localhost` vs `127.0.0.1`)
     - port (e.g., `3000`, `3001`)
     - exact route to verify
     - any required dynamic route identifiers (for example `agent_id`, `workspace_id`, `cluster_id`, `subset_source`, `subset_value`)

   Do NOT:
   - guess host/origin
   - guess port
   - open random local ports or fallback servers
   - guess required dynamic route identifiers
   - abbreviate a canonical route into a shorthand route that omits required identifiers
   - treat a malformed or incomplete route as evidence of a product/runtime defect

   If the runtime target is not explicitly provided and verification depends on it:
   - STOP and ask for the exact host/origin + port + canonical route identity before attempting verification


   Authentication handling:
   - If verification requires login/authentication and Codex hits an auth gate:
     - explicitly state that authentication is required
     - PAUSE and wait for Oliver to complete login
     - RESUME verification only after Oliver confirms login is complete
   - Do NOT treat authentication failure as final proof that verification is impossible

9.4.A Playwright Authentication Session Persistence (CRITICAL)
   Codex must treat Playwright authentication as a reusable session, not a one-off action.

   Required behavior:
   - prefer reusing saved Playwright auth state for the same target app/environment within the same thread and across subsequent passes when applicable
   - after a successful headed login bootstrap, save or refresh the Playwright auth state when the workflow supports it
   - reuse persisted auth state for subsequent verification steps instead of requesting repeated re-authentication
   - do NOT request repeated re-authentication in the same session unless the auth state is clearly expired, invalid, or not persisting
   - if repeated authentication is required, explicitly report that auth state is not persisting and treat it as a verification-quality issue, not normal flow


   Reporting requirement:
   - Clearly mark verification as "blocked (awaiting auth)" when paused
   - After resume, continue validation and include evidence in the PM REVIEW PACKET

9.4.B Authentication Decision Gate Protocol (CRITICAL)
   When Playwright-based verification is blocked by authentication, Codex must not return only a narrative explanation. It must enter an explicit blocked state awaiting Oliver action.

   Required behavior:
   - end with: `Status: Awaiting Oliver Authentication`
   - explicitly state that the thread is NOT closed
   - clearly state the target app and route requiring login
   - request Oliver to complete login in the headed Playwright browser
   - wait for Oliver confirmation before resuming verification

   Required decision options:
   - `Login now and continue`
   - `Treat as blocked`

   Rules:
   - do NOT bury the authentication requirement inside a long message
   - do NOT close or return the pass as complete/failed due to authentication alone
   - resume the same verification flow after Oliver confirms login

9.4.1 Canonical Route Identity (CRITICAL)
   When verification depends on a specific route, Codex must not guess required identity components.

   Examples:
   - agent_id
   - workspace_id
   - cluster_id
   - subset_source
   - subset_value

   Required behavior:
   - use the exact canonical route when provided
   - if any required identifier is missing, STOP and ask before proceeding
   - treat missing identifiers as a blocked verification dependency, not a product failure

   Codex must NOT:
   - invent shorthand routes that omit required identifiers
   - troubleshoot behavior on incomplete or malformed URLs
   - treat a routing error caused by a missing identifier as evidence the feature is broken

9.5 Blocked Verification Assistance (CRITICAL)
   If Codex reaches the correct runtime surface but cannot complete verification because a specific UI interaction cannot be performed reliably in its own session, this is a blocked verification dependency, not a completed pass.

   Examples:
   - a chip, toggle, or control cannot be clicked reliably
   - a date picker / custom range input requires manual operator interaction
   - a modal, popover, or browser state requires a human step to continue
   - the authenticated page is open, but a specific in-app interaction is still blocked in automation
   - the screenshot is captured, but the decisive acceptance check depends on a visual judgment Codex cannot make confidently

   Required behavior:
   - explicitly state the exact verification step that is blocked
   - if the block is visual uncertainty, explicitly state the exact visual question requiring Oliver adjudication
   - request the minimum operator action required to unblock verification
   - PAUSE and wait for Oliver to complete that interaction
   - RESUME verification after Oliver confirms the interaction is complete
   - continue the same verification flow rather than closing out and deferring full proof to Oliver

   Do NOT:
   - treat a blocked UI interaction as sufficient reason to mark the pass complete
   - convert a blocked verification step into broad Oliver QA
   - close out with "could not verify" if Oliver could have unblocked the exact step in-session

   If Codex remains blocked after the operator assist step:
   - report the exact residual gap
   - explain why the blocked step could not be completed even after assistance

9.6 Runtime/UI Closeout Contract (CRITICAL)
   For runtime/UI-sensitive work, Codex must not treat partial subsystem proof as end-to-end proof.
   A pass is only verified when the final accepted visible state is proven directly.

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

   ### Final UI Truth Verification Rule (CRITICAL)

   Codex must verify the final rendered UI truth, not just data contracts, parity checks, route state, or interaction behavior.

   Required behavior:
   - Codex MUST inspect the final rendered UI state itself before closeout
   - Codex MUST evaluate whether the UI still visibly shows the problem that was supposed to be fixed
   - Codex MUST treat obvious visual defects as verification failures even when:
     - interaction works
     - route/query state is correct
     - data contracts pass
     - linked-surface parity checks pass

   Examples of visible defects that block closeout:
   - charts that still show incorrect gaps when data should render continuously
   - visibly broken chart continuity or incorrect visual shape
   - visible contradictions between UI output and expected user-facing result
   - screenshots that still contain the bug being claimed as fixed

   A pass is NOT complete if the rendered UI still visibly looks wrong.

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

   ### Linked-Surface Parity Requirement (CRITICAL)

   If a pass affects shared workflow/data truth across multiple visible surfaces, Codex must verify cross-surface parity before closing the pass.

   Required behavior:
   - interaction proof alone is NOT sufficient
   - route/query proof alone is NOT sufficient
   - one surface matching is NOT sufficient
   - all linked surfaces representing the same dataset must align

   Codex must NOT close the pass as verified when:
   - the control works
   - the route updates correctly
   - but one or more linked surfaces remain inconsistent, stale, or unverified

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

   ### Proof-of-Completion Enforcement (CRITICAL)

   Codex must not return a pass as complete unless every claimed fix is supported by matching proof.

   Required behavior:
   - claimed fixes must map directly to evidence in the artifact bundle
   - proof must correspond to the accepted defect surface and runtime state
   - if proof is missing, mis-targeted, or incomplete, the pass must be marked incomplete

   Codex must NOT:
   - claim "fixed" without proof
   - claim "verified" without proof
   - claim "complete" when proof only covers adjacent or unrelated surfaces

   ### Accepted Defect Surface Enforcement (CRITICAL)

   Codex must verify the exact surface where the defect exists.

   Required behavior:
   - restate Accepted Defect Surface(s) before validation
   - capture artifact proof for those exact surfaces
   - confirm the defect is resolved on those surfaces specifically

   Failure conditions:
   - verifying 1D when defect exists on 1W or 1M
   - verifying Custom when defect exists on workflow-driving ranges
   - missing artifact proof for the actual defect surface

   If any Accepted Defect Surface is not verified, the pass is INVALID.

9.7 Guard-Churn Reporting (CRITICAL)
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

9.8 Artifact Bundle Format (STANDARDIZED)
   When artifact-backed proof is required, Codex MUST structure the proof clearly and consistently.

   Required structure:
   - cold_load:
     - screenshot reference
     - DOM/state summary
     - request trace summary
   - switch_loop (if applicable):
     - steps executed (e.g., 1W → 1D → 1W → 1D)
     - screenshot reference
     - DOM/state summary
     - request trace summary
   - final_settled_ui:
     - screenshot reference
     - DOM/state summary
     - request trace summary

   Each artifact bundle must:
   - refer to the SAME final rendered state
   - not mix evidence from different states or times
   - clearly tie UI output to the underlying request behavior

   If full artifact capture is not possible:
   - explicitly mark: `artifact proof incomplete`
   - state which surface is missing (cold_load / switch_loop / final_settled_ui)

10. Return:
   - PM REVIEW PACKET
   - files changed
   - validation summary (what was tested and results)
   - explicit validation-stage statement (`diagnostic falsification`, `correction proof`, or `accepted-fix closeout`)
   - explicit continuity statement confirming whether newly discovered governing truth was already propagated before execution, or whether execution was correctly blocked pending propagation
   - checkpoint classification (MANDATORY):
     - explicitly declare one of:
       - `Checkpoint Status: none`
       - `Checkpoint Status: propagation required before closeout`
       - `Checkpoint Status: continuity checkpoint created`
     - if `Checkpoint Status: propagation required before closeout`:
       - explicitly state what must be propagated
       - do NOT mark the pass complete
     - if `Checkpoint Status: continuity checkpoint created`:
       - explicitly state:
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
   - explicit list of verified behaviors
   - mandatory verdict summary for runtime/UI-sensitive verification:
     - `UI Truth: PASS` or `FAIL`
     - `Cross-Scope Parity: PASS` or `FAIL` (when applicable)
     - `Artifact Completeness: PASS` or `FAIL`
     - `Final Verdict: PASS`, `FAIL`, or `BLOCKED`
   - explicit Playwright usage statement for runtime/UI-sensitive passes (used / not used, and why)
   - explicit list of NOT verified (requires Oliver)
   - explicit list of any blocked verification steps that required operator assist and whether they were resumed successfully

   - authentication gate block when applicable:
     - `Status: Awaiting Oliver Authentication`
     - explicit statement that the thread is NOT closed
     - target app and route requiring login
     - explicit list of allowed options:
       - `Login now and continue`
       - `Treat as blocked`
   - verification gap classification (when proof is incomplete):
     - `Missing Proof Type: Blocked` or `Missing Proof Type: Obtainable`
     - if `Obtainable`, the exact continuation step taken (or being taken) to obtain the proof
     - if `Blocked`, the exact blocker and why continuation cannot currently proceed

   - verification confidence (MANDATORY for decisive runtime/UI closeout):
     - `Verification Confidence: HIGH / MEDIUM / LOW`
     - if confidence is not HIGH, explicitly state whether:
       - stronger proof is still obtainable and is being pursued
       - OR the pass is blocked pending narrow Oliver assist
   - final result classification (MANDATORY):
     - explicitly classify the pass as one of:
       - `Accepted Fix Proven`
       - `Partial Proof`
       - `Blocked Proof`
     - only `Accepted Fix Proven` may be presented as complete
     - if the result is `Partial Proof` or `Blocked Proof`:
       - explicitly state that the thread is NOT closed
       - do NOT use completion language such as `complete`, `done`, `fixed`, `ready to close`, or equivalent
       - explicitly state the exact missing proof and the next continuation step or blocker
   - explicit artifact bundle references for each proof surface (cold load, switch loop if applicable, final settled UI)

   - per-surface verdict matrix (MANDATORY for runtime/UI-sensitive accepted surfaces):
     - for each accepted surface include:
       - `Surface:` <name>
       - `Screenshot Present:` YES/NO
       - `Accepted Surface Actually Visible:` YES/NO
       - `DOM/State Attached:` YES/NO
       - `Request Trace Attached:` YES/NO
       - `Linked-Surface Parity:` PASS/FAIL/NA
       - `Visual Verdict:` PASS/FAIL/BLOCKED
   - outstanding risks (if any)
   - evidence artifacts or references (screenshots/log snippets/outputs) supporting the validation

Codex must check ACTIVE_CHANGE_EVENTS.md BEFORE restating the task to ensure alignment with active system changes.

- Fast execution without validation is considered failure.
- Codex must prioritize correctness and verified behavior over speed.
- Efficiency optimization must never weaken accepted-fix closeout proof; it only reduces unnecessary proof cost before accepted-fix stage.
- If a change increases uncertainty or introduces regression risk, Codex must slow down, re-evaluate, or request PLAN MODE.
- Execution is incomplete and invalid if newly discovered governing truth from PM review still exists only in thread context and was not propagated before implementation began.
- Execution is incomplete if Codex attempts to close the pass without explicit checkpoint classification and material unpropagated state still exists.
- A thread must not be closed when `Checkpoint Status: propagation required before closeout` applies; Codex must stop and require a Change Propagation Pass first.
- If `Checkpoint Status: continuity checkpoint created` is used, Codex must explicitly document the residual unpropagated state and the exact propagation boundary before thread closeout or split-thread continuation.
- An accepted fix without a Recovery Contract in CHANGELOG.md is considered incomplete.
- Codex must not mark a fix as complete until the Recovery Contract is written and referenced by the ACE.
- Failing to exercise the changed surface (route/UI/API) when it was explicitly part of the task is considered incomplete validation.
- If verification depends on a specific runtime target or authentication state and Codex did not request clarification or pause appropriately, the task is considered incomplete.
- Playwright-based verification is incomplete if Codex repeatedly requests authentication in the same session without reusing persisted auth state when reuse was reasonably available.
- Playwright-based verification is incomplete if authentication is required but Codex does not end in `Status: Awaiting Oliver Authentication` with a paused state and explicit options.
- Runtime/UI-sensitive work is incomplete if Playwright-driven verification was reasonably feasible, but Codex neither used the Playwright CLI Skill nor explicitly documented why it was not used.
- If a blocked UI verification step could have been unblocked by minimal operator assist and Codex did not request that assist, pause, and resume, the task is considered incomplete.
- Execution is incomplete if Codex stops or returns partial verification solely because proof is incomplete even though the missing proof was still reasonably obtainable within the same thread.
- Any incomplete proof must be explicitly classified as `Blocked` or `Obtainable`; a pass is not done while `Obtainable` proof remains unpursued.
- Runtime/UI-sensitive work is incomplete if artifact-backed proof of the accepted visible state is missing (must be captured or marked `artifact proof incomplete`).
- Runtime/UI-sensitive work is incomplete if shared dataset truth spans multiple visible surfaces and cross-surface parity was not verified or explicitly marked as an open gap
- Runtime/UI-sensitive work is incomplete if the final rendered UI still visibly shows the defect, even if data contracts, route behavior, or parity checks passed
- Runtime/UI-sensitive work is incomplete if a decisive screenshot-based visual judgment was required, Codex could not make that judgment confidently, and Codex did not pause for narrow Oliver visual adjudication before closeout
- Runtime/UI-sensitive decisive closeout is incomplete if Codex presents the pass as verified without `Verification Confidence: HIGH`.
- If guard churn (e.g., repeated 409s or overlapping request interference) occurs in the accepted flow and is not explicitly reported and classified, the task is considered incomplete.
- Any attempt to modify a protected file without explicit scope authorization must be treated as a blocking error.
- Runtime/UI-sensitive work is incomplete if Codex claims completion without matching proof tied to the accepted defect surface
- Runtime/UI-sensitive verification is incomplete if Codex collects evidence or computes mismatches but does not convert them into explicit PASS/FAIL verdicts.
- Runtime/UI-sensitive verification is incomplete if any required verification check fails and Codex still proceeds with success, completion, or accepted-fix language.
- Runtime/UI-sensitive verification is incomplete if a required screenshot exists but the decisive acceptance surface is not actually visible within the artifact.
- Runtime/UI-sensitive verification is incomplete if the PM REVIEW PACKET omits the mandatory verdict summary or per-surface verdict matrix for accepted runtime/UI surfaces.
- Runtime/UI-sensitive work is incomplete if artifact bundles do not include the exact accepted defect surface and instead rely on substitute surfaces
