# ACE-048 Framework-First Decision Workspace Phase 3 Slice 2 — Discovery Handoff

Date: 2026-09-01
Status: `COMPLETED / TARGET-LOCKED; IMPLEMENTATION AWAITING SEPARATE DECISION`
Governing event: `ACE-048`
Role: Project Manager
Execution mode: `transitional_self_verification`
Problem class: `runtime data-facade boundary with read lifecycle preservation`

## Operator decision

Oliver approved the next bounded Phase 3 discovery/target-lock pass on 2026-09-01 after Human-accepting and closing Phase 3 Slice 1.

This remains the same Automata project and the same ACE-048 framework-first program. The approval authorizes discovery and target locking only; it does not authorize Slice 2 implementation.

## Compact control-plane delta

- Active ACE: `ACE-048`, unchanged.
- Active phase: Phase 3 generic runtime/data facade, Slice 2 discovery and target lock.
- Last propagated point: Phase 3 Slice 1 Human acceptance, Recovery Contract, and verified milestone backup.
- Governing truth changed: only Slice 2 discovery authorization and the target selected below.
- Accepted-fix status changed: no; Phases 1-2 and Phase 3 Slice 1 remain Human-accepted and closed.
- Approved scope: read-only repository discovery and reuse of accepted runtime artifacts; Slice 2 implementation remains separately gated.

## Discovery result

Decision Intelligence, rendered as Gmail `Inbox health`, is the safest next facade consumer.

- The root Operations page is only a redirect and would not prove a meaningful data boundary.
- Decision Intelligence is an accepted read-oriented decision-support surface. It has no direct provider mutation and its page uses helper-mediated reads rather than direct `fetch(...)` calls.
- Sender Overview is a `14,706`-line high-interaction page with linked charts, pagination, Decision Mode, evidence, drafts, and workflow-window lifecycle; it is too risky for the next slice.
- Decision Management is a provider-execution surface with direct Gmail push/restore and memory writes; it belongs after capability/lifecycle work, not in this Phase 3 read-facade slice.
- Pending Approvals and History are legacy/audit routes and are not the primary framework validation surface.

The authoritative execution contract is:

`docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE3_SLICE2_DECISION_INTELLIGENCE_PM_BRIEF.md`

## Exact current path proved

```text
operations/layout.tsx
  -> OperationsWorkspaceShell
  -> OperationsRuntimeProvider
       -> POST /api/agents/playground
       -> GET /api/integrations/gmail/mailbox-index
  -> DecisionWorkspaceReadProvider (Slice 1 boundary)
  -> operations/intelligence/page.tsx
       -> runtime cleanup plan / runtime mailbox intelligence
       -> Gmail browser caches and latest-stable intelligence
       -> POST /api/integrations/gmail/inbox-analysis
            action=mailbox_intelligence
            action=mailbox_pressure_trend
       -> GET /api/runtime/gmail-memory?view=decision_management
       -> Gmail workflow drafts from browser storage
       -> InboxHealthGauge / MailboxMissionPanel / MailboxIntelligenceDashboard
```

The page currently imports Gmail data types, cache readers, request helpers, draft readers, and Gmail-named component contracts directly. The existing Slice 1 provider and Gmail adapter are the authoritative insertion seam; no new provider, context root, cache, or request family is needed.

## Accepted runtime evidence reused

The accepted Phase 2 artifact at `output/playwright/ace-048-phase2-presentation/after-verification.json` proves the exact canonical Intelligence route settled with:

- headings `Inbox health` and `AI-guided next move`;
- `5,144` senders, approximately `259,422` supporting messages, `1,999` review candidates, and `17` decisions;
- health score `5 / 100` and the accepted approval-queue recommendation;
- explicit Gmail provider controls;
- zero console errors and zero page errors;
- the existing runtime, mailbox-index, Gmail-memory, and inbox-analysis request families only.

Runtime discovery was not repeated. The accepted artifact is sufficient to lock the visible route and request baseline, while repository tracing resolves the exact data/import boundary. No provider or runtime state was contacted or changed during discovery.

## Cross-domain result

The same read slots support Gmail, customer service, real estate, crypto, multi-source paid media, bookkeeping, tax, and multi-role purchasing/shipping when each adapter supplies:

- a versioned health/decision-readiness definition and directionality;
- subject/activity vocabulary and compatible metric definitions;
- source, role, provenance, freshness, and quality identity;
- a time-series metric with explicit unit/time basis;
- recommendation rationale, evidence references, expected impact, and confidence;
- generic lifecycle signals such as awaiting approval, executing/verifying, failed, completed/reversible, or deferred/unsupported.

Health scores are not assumed to be comparable across workflows unless they share the same metric definition. Provider actions and controls remain outside this read model.

## Target lock

- Locked route: `/agents/[id]/operations/intelligence`
- Exact accepted Gmail route: `/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/intelligence`
- Locked source allowlist: exactly six files, listed in the PM Brief.
- Target-lock source: `inferred_target_lock` from route/import/request tracing plus accepted post-settle artifacts.
- Execution readiness: ready only after Oliver explicitly authorizes `ACCEPT PHASE 3 SLICE 2 IMPLEMENTATION`.

## Authority boundary

No source/UI implementation, provider/data/database/artifact/index/publication mutation, route change, request/polling/cache/lifecycle change, Decision Mode or Management behavior change, commit, push, or deployment occurred or is authorized by this discovery.

Checkpoint Status: `none` — Slice 2 discovery findings, target lock, PM Brief, and separate implementation gate are propagated.
