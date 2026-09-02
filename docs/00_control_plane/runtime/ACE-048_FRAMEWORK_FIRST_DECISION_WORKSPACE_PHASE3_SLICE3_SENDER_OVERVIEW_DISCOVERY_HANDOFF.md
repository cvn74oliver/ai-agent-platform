# ACE-048 Framework-First Decision Workspace Phase 3 Slice 3 — Sender Overview Discovery Handoff

Date: 2026-09-01
Status: `COMPLETED / TARGET-LOCKED; IMPLEMENTATION AWAITING SEPARATE DECISION`
Governing event: `ACE-048`
Role: Project Manager
Execution mode: `transitional_self_verification`
Problem class: `runtime data-facade boundary with lifecycle preservation`

## Operator decision

Oliver replied `accept` to the explicit Phase 3 Slice 3 discovery decision on 2026-09-01.

This is the next bounded slice of the same Automata framework-first program. The approval authorized read-only discovery and target locking only. It did not authorize source/UI/runtime implementation.

## Compact control-plane delta

- Active ACE: `ACE-048`, unchanged.
- Active phase: Phase 3 generic runtime/data facade, Slice 3 Sender Overview discovery and target lock.
- Last propagated point: Phase 3 Slice 2 Decision Intelligence Human acceptance, Recovery Contract, and verified Human-acceptance backup.
- Governing truth changed: only Slice 3 discovery authorization and the target lock recorded below.
- Accepted-fix status changed: no; Phases 1-2 and Phase 3 Slices 1-2 remain Human-accepted and closed.
- Approved scope: repository discovery plus reuse of accepted runtime artifacts; Slice 3 implementation remains separately gated.

## Executive recommendation

### What is changing

The recommended implementation will put Sender Overview's read-side workspace, window, distribution, evidence, and pagination data behind the existing Decision Workspace adapter. Gmail will keep supplying the same accepted data and provider operations.

### What Oliver will get

The Gmail page should look and behave the same, while the same framework slot can later render cases, properties, positions, campaigns, transactions, tax issues, orders, or shipments using approved domain vocabulary.

### Why it matters

This is the highest-value remaining read-facade boundary and the first one that proves the framework can support detailed human review without assuming one provider, one agent, one data source, or one workflow. A full page rewrite is not recommended; a bounded adapter extraction preserves the accepted lifecycle.

## Discovery result

The exact target is the read side of the existing `item_overview` semantic slot on the shared Operations review route.

- The route is mounted under the existing presentation and read providers.
- `OperationsReviewPage` is the sole page owner of route state, cache continuity, request ownership, transient-guard attachment, workflow-window state, subset identity, pagination, evidence expansion, Decision Mode entry, and Decision Mode close/return.
- The page currently contains `14,706` lines, `31` state-hook call sites, `58` effect-hook call sites, `178` memo-hook call sites, and `23` callback-hook call sites. This confirms that moving lifecycle ownership would be a high-regression architecture change.
- The safe seam is therefore an adapter-owned read service invoked by the page; the page keeps lifecycle sequencing and the Gmail adapter keeps provider cache/request translation.
- Direct provider mutation through `POST /api/runtime/gmail-destinations` is inside the same file but is not part of the read facade. It remains explicitly Gmail-specific and frozen.
- Generic message preview/snippet helpers already live in `operationsWorkspace`; they require no new facade or request family.

The authoritative execution contract is:

`docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE3_SLICE3_SENDER_OVERVIEW_PM_BRIEF.md`

## Exact current render/data/request path

```text
web/src/app/agents/[id]/operations/layout.tsx
  -> DecisionWorkspacePresentationProvider
       -> gmailDecisionWorkspacePresentation
       -> semantic slot item_overview renders as Sender Overview
  -> OperationsWorkspaceShell
       -> OperationsRuntimeProvider
       -> DecisionWorkspaceReadProvider(adapterId=gmail)
            -> gmailDecisionWorkspaceReadAdapter
  -> web/src/app/agents/[id]/operations/review/page.tsx
       -> route/query/window/subset/review-unit ownership
       -> runtime cleanup plan + mailbox intelligence identity
       -> Gmail cached sender workspace reads
       -> POST /api/integrations/gmail/inbox-analysis action=sender_workspace
       -> Gmail cached overview-window reads
       -> POST /api/integrations/gmail/inbox-analysis action=sender_overview_window
       -> Gmail cached sender-distribution reads
       -> POST /api/integrations/gmail/inbox-analysis action=sender_distribution
       -> generic message preview/snippet reads
       -> shared Time Context / Sender Distribution / sender-card components
       -> in-place Decision Mode and exact close/return state
       -> Gmail provider action POST /api/runtime/gmail-destinations (frozen and excluded)
```

## Lifecycle proof

The page, not the helper module or component library, currently owns the accepted lifecycle:

- cached/runtime/passive snapshot selection before a network read;
- mode-specific page sizes and evidence hydration;
- one workspace request plan for the active route state;
- a `5,000ms` transient-guard cache-attachment window sampled every `150ms` for workspace reads;
- a maximum five `1,200ms` transient-guard retries for explicit Sender Overview window reads;
- request-key and generation ownership for Sender Distribution, including a `5,000ms` / `150ms` guard-attachment window;
- `AbortController` cancellation where already present;
- no interval poller;
- route-backed workflow window, review-unit, semantic focus, time bucket, page, and Decision Mode return context.

The implementation must wrap existing helper calls without moving, duplicating, or broadening any of those rules.

## Framework vocabulary decision

Keep the accepted stable semantic slot ID `item_overview`. Use `decision subject` as the generic data-model noun and adapter vocabulary for the visible domain noun.

- Framework fallback title: `Item Overview`.
- Gmail adapter title: `Sender Overview`.
- Framework model noun: `subject` / `subjects`.
- Adapter examples: sender, case, property, position, campaign, transaction, tax issue, order, or shipment.
- Framework activity noun: `activity` / `activities`.
- Adapter examples: email, case event, observation, market event, conversion, ledger event, deadline, purchase event, or tracking event.

The framework owns stable meaning, validation, accessibility, safe fallback behavior, and deterministic render contracts. The workflow/adapter owns approved titles, nouns, labels, classification vocabulary, and explanatory copy. No label is generated on page load.

## Cross-domain result

The proposed contract fits all eight reference domains without provider leakage:

| Domain | Adapter-visible overview | Subject | Activity/evidence | Multi-source or multi-role requirement |
|---|---|---|---|---|
| Gmail | Sender Overview | sender | email/message evidence | Gmail index; mailbox operator |
| Customer service | Case Overview | case | case, chat, call, SLA events | support, chat, and email sources |
| Real estate | Property Overview | property | inspection, market, cash-flow observations | property and market sources |
| Crypto | Position Overview | position/asset | trade, custody, price, and risk events | market and exchange/custody sources |
| Paid media | Campaign Overview | campaign/ad set | spend, impression, conversion, and attribution evidence | Facebook, Google, TikTok, and email sources |
| Bookkeeping | Transaction Overview | transaction/account | ledger entry, receipt, and reconciliation evidence | ledger and document sources |
| Tax | Compliance Item Overview | filing/issue/record | deadline, document, and rule evidence | tax records and filing sources |
| Purchasing/shipping | Order & Shipment Overview | order/shipment | purchase, spreadsheet, fulfillment, and tracking events | purchasing, records, and shipping agents plus commerce, spreadsheet, and carrier sources |

The contract must preserve source IDs, workflow definition/version, runtime instance, agent-role IDs, provenance references, freshness, quality, and evidence identity. Multi-source metrics may aggregate only under compatible semantic definitions and units; otherwise validation fails closed.

## Target lock

- Locked route template: `/agents/[id]/operations/review`
- Locked route file: `web/src/app/agents/[id]/operations/review/page.tsx`
- Exact accepted Gmail agent: `d256b48e-5acf-4b3d-af22-003d52e7e582`
- Exact accepted Gmail paths and transition matrix are listed in the PM Brief.
- Locked source allowlist: exactly six files, listed in the PM Brief.
- Target-lock source: `inferred_target_lock` from route/provider composition, import/call/request/lifecycle tracing, and accepted post-settle Phase 2 artifacts.
- Execution readiness: target-locked and execution-ready only after Oliver explicitly authorizes `ACCEPT PHASE 3 SLICE 3 IMPLEMENTATION`.

## Runtime discovery decision

No new runtime or provider contact was needed. The accepted Phase 2 browser artifact already proves the canonical Gmail review paths, visible titles, Decision Mode return, request families, and clean console/page state. Repository discovery resolved the remaining ownership and target-lock questions without touching provider or runtime state.

## Dirty-state boundary

The worktree contains accepted inherited changes. The six target files are not a clean rollback baseline: four are untracked accepted framework files and the review page/component file contain accepted pre-existing diffs. Implementation must record pre-pass hashes and scoped diffs, create the governed incremental backup, and roll back only Slice 3 seams if needed.

## Authority boundary

No source/UI/runtime implementation, provider/data/database/artifact/index/publication mutation, route change, request/polling/cache/lifecycle change, Decision Mode or Management behavior change, commit, push, or deployment occurred during discovery.

Checkpoint Status: `none` — discovery findings, exact target lock, execution-ready PM Brief, and separate implementation decision gate are propagated.
