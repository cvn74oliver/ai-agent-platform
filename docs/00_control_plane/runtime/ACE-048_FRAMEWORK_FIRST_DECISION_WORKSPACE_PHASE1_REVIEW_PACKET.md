# ACE-048 Framework-First Decision Workspace Phase 1 — Review Packet

Date: 2026-08-31
Status: `HUMAN ACCEPTED / CLOSED`
Governing event: `ACE-048`
Execution mode: `transitional_self_verification`
Problem class: generic architecture contract extraction with frozen Gmail runtime behavior

## Executive summary

### What changed

Automata now has one provider-neutral decision-workspace contract for workflow identity, sources, subjects, activity, semantic metrics, evidence, recommendations, human decisions, controlled actions, lifecycle history, provider receipts, review-unit sizing, entity links, and governance. Gmail uses that contract as the first compatibility adapter.

### What the operator gets

The same framework can describe customer service, real-estate and crypto investments, multi-channel paid media, bookkeeping, tax accounting, Gmail, and arbitrary future systems without putting provider nouns into the shared core. Company knowledge is explicitly governed as a private proprietary brain, not an LLM-training or fine-tuning system.

### Why it matters

Future integrations can register their own sources, vocabulary, measures, evidence, capabilities, and approval rules while preserving one auditable recommendation -> human decision -> controlled execution loop. Incompatible metrics and unsafe provider actions fail closed.

## Implementation scope

New or materially changed Phase 1 code:

- `web/src/lib/runtime/decisionWorkspaceContract.ts` — canonical provider-neutral contract and validators
- `web/src/lib/runtime/reviewUnitContract.ts` — bridges the accepted review-unit engine to the canonical contract
- `web/src/lib/integrations/gmail/gmailReviewUnitContract.ts` — explicit Gmail compatibility adapter
- `web/scripts/workspace-decision-contract-fixtures.mjs` — cross-domain and fail-closed fixtures
- `web/package.json` — targeted contract fixture command

Control-plane and architecture truth was incrementally updated in the active ACE, current state, TODO, execution dashboard, system overview, onboarding brief, and governing PM brief. The newly authoritative runtime artifact is this review packet.

## Contract behavior proven

- Gmail validates without changing its review-unit IDs, counts, grouping, or time-window behavior.
- Customer service validates with Zendesk, live chat, support email, escalation, resolution, and refund capabilities.
- Investments validate as two distinct workflows: real-estate scouting and crypto portfolio decisions.
- Paid media validates across Facebook, Google, TikTok, and email ad buying in one multi-source workspace.
- Finance validates with two different decision subjects in one workspace: bookkeeping transactions and tax issues.
- Compatible paid-media spend metrics aggregate through an explicit compatibility key; unrelated refund values and forbidden metrics do not combine.
- Provider writes require a declared source capability and idempotency; medium/high-risk writes cannot silently bypass approval.
- Recommendations retain the exact published workflow/SOP version, governing rule, evidence source record, observation/ingestion timestamps, transformation version, freshness, and quality.
- Human decisions remain distinct immutable records with actor, time, outcome, reason, scope, and selected action.
- Execution history starts at proposed, remains contiguous, ends at the current state, and requires a provider receipt for executed provider writes.
- Proprietary-brain governance requires tenant ownership, private storage semantics, source provenance, feedback capture, and explicit exclusion of foundation-model training.

## Verification evidence

All checks passed:

1. `npm run test:workspace-decision-contract`
2. `npm run test:workspace-review-unit-contract`
3. `npm run test:gmail-review-unit-contract`
4. `npm run test:review-unit-window-projection-contract`
5. `npm run test:gmail-review-unit-window-projection-contract`
6. `npm run test:gmail-cleanup-group-assignment`
7. `./node_modules/.bin/tsc --noEmit`
8. Targeted ESLint on the new contract, bridge, Gmail adapter, and fixture
9. `git diff --check`

The fixture runner emits `PASS` for seven reference contracts and explicitly proves multi-source support, multiple decision subjects, fail-closed metric compatibility, guarded provider writes, versioned recommendation/decision/execution history, lifecycle receipts, and the proprietary-brain boundary.

## Runtime and regression posture

- Heavy endpoints affected: none
- Request families affected: none
- Polling involved: no
- Expected steady-state request change: zero
- Smart Sync, indexing, artifact build/publication, database, and provider mutations: none
- Visible UI behavior: unchanged
- Playwright: not used because Phase 1 changes only TypeScript contracts, validators, adapter metadata, and deterministic fixtures; no rendered or interactive surface changed
- Human-visible screenshot artifacts: not applicable to this non-UI phase
- State Transition Matrix: not applicable; no UI control, routing gate, or runtime state transition changed

The existing Gmail review-unit, cleanup-assignment, generic projection, and Gmail projection fixtures all pass after the contract bridge. This is targeted regression proof, not a claim that later UI/runtime migration phases are complete.

## Dirty-state and scope accounting

- Pre-existing diff status: present
- Were existing diffs part of prior accepted/recovery work?: yes, mixed accepted ACE-048 work and control-plane propagation were already present
- New Phase 1 implementation files/seams: the five code/fixture/package targets listed above plus bounded control-plane updates
- Unrelated dirty files modified by this Phase 1 pass: none
- Commit, push, deployment, live integration, and publication: not performed

## Backup evidence

Verifier-checkpoint and Human-acceptance milestone incrementals were created successfully with normal seven-day project-scoped pruning and `KEEP` preservation:

`/Users/olivercarlin/Documents/Backups/August 2026/2026-08-31/ai-agent-platform (incremental 31 August 2026 - ACE-048 framework-first decision workspace Phase 1 verifier checkpoint)`

`/Users/olivercarlin/Documents/Backups/August 2026/2026-08-31/ai-agent-platform (incremental 31 August 2026 - ACE-048 framework-first decision workspace Phase 1 Human acceptance)`

## Verifier decision

Verdict: `ACCEPT`

Ready-state satisfied: `N/A — no runtime/UI surface changed`

Artifacts captured post-settle: `N/A`

Verification Confidence: `HIGH`

The bounded Phase 1 implementation matches the accepted PM brief and preserves the Gmail regression surface. Later UI wording, runtime facade, capability-driven Decision Mode/Management, real integrations, marketplace, proprietary-brain UI migration, shared-learning implementation, commit, push, and deployment remain separate gates.

## Human decision

Status: `ACCEPTED`

Oliver recorded `ACCEPT` on 2026-08-31. Recovery Contract:

`CHANGELOG.md` -> `August 31, 2026 — ACE-048 Framework-First Decision Workspace Phase 1 Accepted`

Phase 2 remains a fresh `candidate-grounded / pre-execution discovery` work unit. This acceptance does not authorize a broad UI/runtime migration.

Checkpoint Status: `none`
