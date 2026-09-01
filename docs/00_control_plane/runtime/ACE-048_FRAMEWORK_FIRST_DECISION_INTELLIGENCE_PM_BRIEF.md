# ACE-048 Framework-First Decision Intelligence — PM Brief

Date: 2026-08-31
Status: `SUPERSEDED BEFORE IMPLEMENTATION`
Governing event: `ACE-048`
Execution mode: `transitional_self_verification`
Problem class: UI grammar / metric meaning
Reasoning level: HIGH — the visible change is bounded, but it establishes reusable cross-domain vocabulary.

## Executive summary

> Supersession note — 2026-08-31: Oliver accepted the naming direction but immediately expanded the governing requirement to the full provider-neutral workflow. This brief was not implemented. It is replaced by `ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_REFACTOR_PM_BRIEF.md` so the platform contract is corrected before visible copy is migrated.

### What is changing

- Rename the visible `Mailbox Intelligence` feature to `Decision Intelligence` without changing its route.
- Replace `Senders in review` with `Review candidates` and explain that the count is the unique published subjects organized into Cleanup Groups, not subjects currently opened by a person.
- Make the metric a clear handoff to Cleanup Groups.
- Move framework-level page copy to decision/coverage/activity language while keeping adapter-owned nouns such as sender and message.

### What the operator will get

- A dashboard name that still makes sense for email, crypto, tax, or another future workspace.
- A truthful `1,999` metric: unique senders eligible for cleanup review and still awaiting a decision.
- A direct way to inspect those candidates instead of guessing what “in review” means.

### Why it matters

The page should describe the reusable decision workflow, while each adapter supplies its own subject and activity vocabulary. This prevents Gmail terminology from becoming platform architecture and removes a misleading workflow-state claim.

## Locked product meaning

- The displayed `1,999` comes directly from `cleanup_candidate_universe.sender_count` in the active published Intelligence artifact.
- It is a unique sender count for the published cleanup-candidate universe.
- It does **not** mean a human has opened 1,999 senders, that 1,999 local draft decisions exist, or that all 1,999 are in one active session.
- Cleanup Groups is the authoritative inspection surface for this universe.
- Recommended label: `Review candidates`.
- Recommended helper: `Unique senders organized into Cleanup Groups and still awaiting a decision. Open the groups to begin review.`
- Recommended interaction: the metric card links to the existing Cleanup Groups route and is keyboard-accessible. It does not mutate scope or create a new filter.

## Framework-first vocabulary contract

- Framework-owned labels: `Decision Intelligence`, `Decision health`, `Decision coverage goal`, `Review candidates`, `activity`, `decision coverage`, and `review groups`.
- Adapter-owned nouns: the decision subject (`Sender` / `Senders` for Gmail), evidence/activity unit (`Message` / `Messages` for Gmail), workspace universe label, and adapter-specific action guidance.
- Gmail/index controls may retain Gmail-specific wording where they describe real provider behavior, such as Smart Sync, mailbox reindex, or archive execution. Those operational boundaries must not be generalized inaccurately.
- The existing review-unit blueprint remains the vocabulary authority. Gmail is the reference adapter; future crypto/tax adapters supply their own subject and activity labels.

## Scope

Locked route:

- `http://localhost:3000/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/intelligence`

Locked implementation files:

- `web/src/components/runtime/GmailCleanupComponents.tsx`
- `web/src/components/runtime/OperationsWorkspaceShell.tsx`
- `web/src/app/agents/[id]/operations/intelligence/page.tsx`
- `web/src/lib/runtime/cleanupGroupPresentation.ts`

Read-only contract references:

- `web/src/lib/runtime/reviewUnitContract.ts`
- `web/src/lib/integrations/gmail/gmailReviewUnitContract.ts`

Allowed implementation:

- Visible label and explanatory-copy corrections on the Intelligence route and navigation/assistant context.
- A presentation-vocabulary seam driven by the existing decision-workflow blueprint.
- A keyboard-accessible Cleanup Groups link from the Review candidates metric.
- Targeted static/contract fixtures for Gmail plus at least two non-Gmail vocabulary examples.

Out of scope:

- Route rename or redirect.
- Count, artifact, taxonomy, cleanup membership, grouping, ranking, health-score, or recommendation-rule changes.
- New filtering or workflow state.
- Backend/API/RPC/schema/migration changes.
- Sync, backfill, reindex, rebuild, publication, deployment, commit, or push.
- Broad copy changes outside the active Intelligence/navigation surface.

## Runtime load declaration

- Heavy endpoints affected: none.
- Request families affected: none; existing Intelligence and Pressure Trend reads remain unchanged.
- Polling involved: no new polling.
- Expected poll cadence: unchanged.
- Expected steady-state request count: unchanged from the accepted route.
- Build-pending continuity, build completion, Smart Sync handoff, and stale-build reclaim: unaffected.

## Risks and regression protections

- Metric drift: the card must continue reading the exact published cleanup-candidate sender count; no recomputation or deduplication change.
- Navigation drift: the route remains `/operations/intelligence`; existing bookmarks and assistant context remain valid.
- Scope drift: clicking Review candidates opens Cleanup Groups but does not change analysis scope or filter state.
- Vocabulary drift: framework text must not hardcode Gmail nouns; adapter operational controls must not lose truthful Gmail-specific wording.
- Accessibility: the interactive metric must expose a descriptive accessible name and visible destination cue.
- Linked truth: Indexed subjects, supporting activity, review candidates, decided subjects, Cleanup Groups totals, and mission-control copy must retain their accepted numeric relationships.

## Verification expectations

Accepted proof surfaces:

1. Cold-load the exact canonical Intelligence route.
2. Verify navigation shows `Decision Intelligence` and the hero shows `Decision health` with no framework-level Mailbox/Inbox title leakage.
3. Verify `Review candidates` shows the same published count and truthful helper text.
4. Activate the metric by mouse and keyboard; require the canonical Cleanup Groups route with no new scope mutation.
5. Return to Intelligence and require the accepted Pressure Trend, totals, and recommendation handoff to remain populated.
6. Run framework vocabulary fixtures proving Gmail sender/message, crypto position/activity, and tax document/activity labels do not inherit one another.

Required closeout artifacts:

- Before and after screenshots with stable paths.
- DOM/state capture and request trace tied to the settled after-state.
- State Transition Matrix for mouse activation, keyboard activation, and return navigation.
- Console/runtime-overlay review.
- Targeted TypeScript, lint, vocabulary fixtures, and `git diff --check`.
- Final visible-language audit of the locked route after settle.

## Execution readiness

Classification: `target-locked / execution-ready after explicit plan acceptance`.

The active render path and metric source are proven. No backend or data-model ambiguity remains. Implementation must not begin until Oliver explicitly accepts this brief.

Checkpoint Status: continuity checkpoint created. Newly governing metric semantics and framework-first naming direction are captured; implementation awaits explicit plan acceptance.
