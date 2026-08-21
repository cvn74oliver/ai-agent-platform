# ACE-048 Pressure Trend Auth-Storm Correction PM Brief

Status: CORRECTION PROOF PASS/HIGH — AWAITING HUMAN REVIEW
Mode: `transitional_self_verification`
Reasoning: HIGH
Problem class: runtime behavior

## Objective

Stop Mailbox Intelligence Pressure Trend from resubmitting the same failed inbox-analysis request without bound. Preserve normal one-request behavior when the semantic pressure-window key changes.

## Locked scope

- Route: `http://localhost:3000/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/intelligence`
- File: `web/src/app/agents/[id]/operations/intelligence/page.tsx`
- Request family: `mailbox_pressure_trend` through `/api/integrations/gmail/inbox-analysis`

## Exact write packet

- Add `loading` to the Pressure Trend state contract with the active request key.
- Before dispatch, store `loading` for the current semantic key.
- Treat any non-idle state already owned by that same key (`loading`, `ready`, or `error`) as terminal for effect re-entry.
- A changed semantic key or route remount may make one new request.
- Preserve abort behavior for interactive window changes and preserve visible terminal errors.

## Load contract

- Cold/new semantic key: at most one Pressure Trend request.
- Authentication or other terminal failure: zero steady-state requests after the first response.
- Polling: none.
- Retry: none in this effect.
- No raw mailbox scan, semantic rebuild, artifact mutation, publication mutation, Supabase write, Gmail mutation, or worktree integration.

## Regression protections

- Existing cached/seeded ready Pressure Trend data remains authoritative.
- Changing pressure window/cache/cluster identity may request the new key once.
- Interactive abort must not commit stale state.
- Mailbox Intelligence and cleanup-group data contracts remain unchanged.

## Verification

1. Non-incremental TypeScript.
2. Targeted ESLint for the locked file.
3. `git diff --check`.
4. Fresh build before restart.
5. Exact-route browser proof with aligned screenshot, DOM/state, request trace, and server-log delta.
6. Confirm bounded request count and zero repeated auth failures after settle.

No Accepted Fix or Recovery Contract is created until verifier proof and explicit Human Review acceptance.

## Verification result — 2026-08-21

- TypeScript, targeted lint, diff check, and `63/63` production build: PASS.
- Cold All indexed: one deferred request, HTTP `200`, `57` yearly buckets.
- All indexed to 1M: one interactive new-key request, HTTP `200`, `30` daily buckets.
- Final 20-second steady state: exactly two total inbox-analysis requests; zero retries/polling/guard churn.
- Final visible 1M state: daily bars, `Pressure is steady`; browser console `0` errors / `0` warnings.
- Proof: `output/playwright/ace048-pressure-trend-auth-storm/correction-proof.json`.
- No database, Gmail, artifact, publication, rebuild, merge, commit, push, or deployment mutation.
