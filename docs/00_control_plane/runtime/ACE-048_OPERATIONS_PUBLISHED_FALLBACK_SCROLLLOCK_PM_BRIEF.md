# ACE-048 Operations Published Fallback and Scroll-Lock PM Brief

Status: APPROVED FOR EXECUTION
Owner: Project Manager
Governing event: ACE-048
Mode: PLAN-approved same-flow execution
Execution mode: `transitional_self_verification`
Reasoning: HIGH

## Executive summary

- What is changing: restore the last successful semantic artifact when a newer rebuild fails, bound cleanup refresh load, and prevent Decision Mode from freezing page scrolling when no overlay is visible.
- What Oliver will get: Mailbox Intelligence and its linked cleanup surfaces render the preserved semantic groups again, failed-refresh truth remains visible, and Operations pages scroll normally.
- Why it matters: the app must preserve useful published truth without rebuilding or overwhelming Supabase, and the sender-first workflow must remain navigable.

## Objective

Restore the accepted Operations baseline without rebuilding semantic artifacts or changing Supabase data. Correct the two proven mechanisms sequentially and verify linked visible truth.

## Feature domain

Gmail Operations workspace: semantic artifact hydration, cleanup-group availability, linked sender surfaces, refresh lifecycle/load, and Decision Mode overlay scroll ownership.

## Locked problem classes

1. Slice A — artifact / publication truth plus bounded runtime behavior.
2. Slice B — UI lifecycle / rendering behavior.

The two slices must not be blended into a broad refactor.

## Governing evidence

- Exact route: `http://localhost:3000/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/intelligence`.
- Published version `full-mailbox-20260415024237593`: 13 cluster summaries and one Intelligence snapshot.
- Failed unpublished candidate: `full-mailbox-20260815081528697`.
- Blank-surface mechanism: publication readiness treats failed candidate/refresh state as global unavailability despite a valid published version.
- Scroll mechanism: unscoped `mode=decision` can set body overflow hidden before a no-cluster early return, leaving no overlay to own the lock.

## Slice A locked scope

Candidate implementation files:

- `web/src/lib/runtime/runtimeStateService.ts`
- `web/src/lib/integrations/gmail/gmailCleanupWorkspace.ts`
- `web/src/app/api/integrations/gmail/inbox-analysis/route.ts`
- `web/src/components/runtime/OperationsRuntimeContext.tsx`
- `web/src/components/runtime/OperationsWorkspaceShell.tsx`
- `web/src/app/api/agents/playground/route.ts` only if required to enforce the locked single-flight/load ceiling

Required behavior:

- A non-empty published version remains the last-known-good read authority when a later candidate/refresh fails, provided its required snapshot and summary rows pass bounded integrity checks.
- Candidate/build failure remains separately visible as freshness/refresh status; it must not be rewritten as successful or hidden.
- No request-time raw mailbox reconstruction, direct message-table scan, publication mutation, stale-build reclaim, database cleanup, or full rebuild.
- Refresh request family: `/api/agents/playground` rehydrate plus artifact-backed reads only.
- Polling must be bounded and self-terminating. Steady state on an accepted route must produce zero repeated heavy refresh requests.
- One operator refresh may create at most one active refresh owner for the same tenant/scope; duplicate same-key requests must attach, reuse, or return a machine-readable guard result.
- A failed terminal candidate with a usable publication must settle promptly to published-data-ready plus a visible warning; it must not poll for a version transition that cannot occur.

## Slice B locked scope

Locked implementation file:

- `web/src/app/agents/[id]/operations/review/page.tsx`

Required behavior:

- Body scrolling is locked only while the full-screen Decision Mode overlay is actually rendered.
- No selected cluster / no renderable decision scope must return the guidance surface with normal page scrolling.
- A valid overlay retains internal scrolling while preventing background scroll.
- Close, route navigation, early return, and unmount restore the prior body overflow state exactly.

## Constraints and prohibitions

- No Supabase write, rebuild, publication, schema change, migration, Gmail sync, full reindex, deployment, merge, branch deletion, worktree deletion, or history rewrite.
- Do not overwrite cleanup-authority files wholesale or use blanket merge resolution.
- Preserve the cleanup branch `c690dff` and current main `64632b3` until later semantic integration is accepted.
- Full semantic rebuild requires a new explicit plan and Oliver authorization after pretesting; it is not an automatic fallback.

## Regression protections

- Published artifact data must remain immutable and available after candidate failure.
- Building candidates must never masquerade as published data.
- Failed/stale state must remain visible without suppressing last-known-good content.
- Linked sender counts and membership must not mix artifact versions or scopes.
- No new polling loop, request fanout, raw mailbox scan, or read-triggered lifecycle mutation.
- Valid Decision Mode overlay behavior must not regress while fixing the no-cluster route.

## Verification ladder

### Diagnostic/correction proof

- Focused selector fixtures for published+failed-candidate, published+building-candidate, published+fresh, and no-published-artifact states.
- Targeted TypeScript and lint for changed files.
- Fresh Next production build.
- Exact canonical-route exercise using saved authentication.

### Accepted-fix closeout

- Playwright after route-specific settle, with screenshot, DOM/state capture, and request trace for each accepted row.
- Cold Mailbox Intelligence load renders semantic groups from the published version and visibly distinguishes failed refresh state.
- One bounded Refresh Cleanup Analysis interaction settles without hidden data, repeated heavy polling, raw mailbox scan, mutation, or rebuild.
- Linked-surface parity: Mailbox Intelligence, Cleanup Groups, Sender Overview, Sender Distribution, workflow totals, sender rows, Time Context, and Decision Mode.
- Scroll State Transition Matrix: Intelligence normal scroll; unscoped Decision Mode normal scroll/guidance; valid Decision overlay background locked/internal scroll; close/back restores page scroll.
- Console/server errors and guard churn explicitly classified.
- Verification Confidence must be HIGH for closeout.

## Human Review

After verifier acceptance, enter `Status: Awaiting Decision` and ask Oliver to check only the exact accepted routes and visible questions supplied in the review packet. Silence or broad approval is not acceptance.

## Rollback

Revert only the bounded code changes. No data rollback is required because this brief authorizes no Supabase or artifact mutation.

## Execution readiness

Target lock: READY.
Approved scope: READY.
Problem classes: LOCKED as two sequential slices.
Implementation may begin after control-plane propagation validation.
