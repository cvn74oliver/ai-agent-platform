# ACE-048 Framework-First Decision Workspace Phase 2 — Verifier Review Packet

Date: 2026-08-31
Status: `HUMAN-ACCEPTED / CLOSED`
Governing event: `ACE-048`
Feature domain: shared Agents/Operations presentation and decision-workspace grammar
Problem class: `UI grammar / rendering`
Execution mode: `transitional_self_verification`
Verification stage: `accepted-fix closeout candidate`
Verification confidence: `HIGH`

## Executive summary

### What changed

Automata now renders the existing Operations workspace through one deterministic presentation-metadata layer. The framework owns stable decision concepts and safe fallbacks, while the Gmail adapter supplies approved Gmail language, semantic metric labels, and provider-specific controls.

### What the operator gets

Gmail keeps its accepted data, routes, controls, decisions, and workflows, while the same presentation contract can express customer service, real estate, investments, paid media, bookkeeping, tax, shipping, and future company workflows without turning Gmail into the platform model.

### Why it matters

The shared decision framework can grow across very different businesses while keeping human-facing language truthful, provider operations explicit, and institutional learning versioned, inspectable, human-governed, provenance-backed, evaluated, and reversible.

## Authority and scope result

- Oliver explicitly authorized `ACCEPT PHASE 2 IMPLEMENTATION` for the target-locked 14-file/five-slice brief.
- The product/source implementation used only files in the locked allowlist.
- No route, API, provider, data, database, artifact, index, publication, cache, polling, lifecycle, commit, push, or deployment operation was changed.
- No Workflow Studio, proprietary-brain UI, shared-learning system, marketplace, live label generation, or multi-agent orchestration was added.
- The domain-adaptive title clarification was absorbed inside the existing presentation contract and locked source set.

## Implementation result

### New product/source files

- `web/src/lib/runtime/decisionWorkspacePresentation.ts`
- `web/src/components/runtime/DecisionWorkspacePresentationContext.tsx`
- `web/src/lib/integrations/gmail/gmailDecisionWorkspacePresentation.ts`
- `web/scripts/workspace-decision-presentation-fixtures.mjs`

### Modified product/source files

- `web/package.json`
- `web/src/app/agents/[id]/operations/layout.tsx`
- `web/src/app/agents/[id]/operations/page.tsx`
- `web/src/components/runtime/OperationsWorkspaceShell.tsx`
- `web/src/app/agents/[id]/operations/intelligence/page.tsx`
- `web/src/app/agents/[id]/operations/clusters/page.tsx`
- `web/src/app/agents/[id]/operations/review/page.tsx`
- `web/src/app/agents/[id]/operations/management/page.tsx`
- `web/src/components/runtime/GmailCleanupComponents.tsx`

`web/src/lib/runtime/cleanupGroupPresentation.ts` was allowlisted but did not require a change. Protected Phase 1/runtime/provider files were not modified by this pass.

### Presentation contract delivered

- Stable semantic slots: workspace, health overview, review groups, item overview, Decision Mode, and Decision Management.
- Safe framework fallbacks, including `Decision health`.
- Deterministic adapter/workflow titles and subtitles, semantic metric labels, subject/activity nouns, evidence/action language, and approved explanatory copy.
- Validation and token rendering that reject unknown/missing tokens and prevent provider-language leakage.
- Explicit source, workflow, agent-role, version, provenance, human approval, and reversibility identity.
- Provider controls rendered only from declared source capabilities; Gmail operations retain their explicit Gmail names.
- No model call at page load and no new request family.

## Dirty-state accounting

- Pre-existing diff status: `present`.
- Were all inherited diffs part of this Phase 2 pass: `no`.
- Existing unrelated documentation, Phase 1, Gmail runtime, fixture, and provider-related changes were preserved untouched.
- New edits made in this pass: the exact source files listed above plus the Phase 2 PM/control-plane/review artifacts.
- No source file outside the locked 14-file allowlist was added or modified by this Phase 2 implementation.

## Static verification

| Check | Result |
|---|---|
| `npm run test:workspace-decision-presentation` | PASS |
| Seven reference domains | PASS |
| Shipping/purchasing multi-role and multi-source fixture | PASS |
| Domain-adaptive titles from one health semantic slot | PASS |
| Unsafe/missing title fallback to `Decision health` | PASS |
| Unknown semantic slot / missing token fail-closed checks | PASS |
| Human-approved, versioned, provenance-backed, reversible metadata checks | PASS |
| Page-load model calls added | `0` |
| Request families added | `0` |
| Existing Phase 1 and Gmail regression fixtures | PASS |
| TypeScript: `tsc --noEmit` | PASS |
| Targeted ESLint | PASS — 0 errors; 14 pre-existing warnings in the large review page |
| `git diff --check` | PASS |

The presentation fixture rendered these approved titles from the shared health-overview slot: Gmail `Inbox health`, customer service `Service health`, real estate and crypto `Portfolio health`, paid media `Campaign health`, bookkeeping `Books health`, and tax `Compliance health`. Paid media retained four distinct source/control identities; the shipping reference retained three agent roles and three source identities.

### Build classification

- Direct TypeScript compilation and the Next production source/type phase passed.
- The isolated no-environment production build reached prerendering and then stopped at `/agents/new` because the isolated worktree had no Supabase URL/key.
- One environment-backed build attempt remained at `Creating an optimized production build` without a new diagnostic and was bounded/interrupted under the no-duplicate-work rule.
- Missing proof type: `Blocked` for a terminal production artifact in this isolated environment.
- This environmental build gap does not contradict the full authenticated runtime proof below and is permitted for this `transitional_self_verification` pass; it must not be represented as a successful deploy/build artifact.

## Authenticated Playwright proof

Runtime target: `http://localhost:3000`

Accepted route identity: agent `d256b48e-5acf-4b3d-af22-003d52e7e582` and the six exact PM-Brief paths.

Ready-state contract:

- exact accepted URL or documented baseline-preserved redirect reached;
- decisive route surface visible;
- final route-ready signal true;
- loaders and fallback-only copy absent;
- screenshot, DOM/state capture, request trace, and console state recorded after settle.

Ready-state satisfied: `YES` on all six path exercises.

Ready-state signals used: route-specific heading/hero or Review Groups surface, final-ready signal, loaders-cleared signal, and stable settled URL.

Settle strategy: authenticated cold load, bounded route-specific readiness wait, loader clearance, and post-settle capture. The composite review path additionally opened Decision Mode and returned through the visible Close control.

Artifacts captured post-settle: `YES`.

### Request and console parity

| Evidence | Before | After |
|---|---:|---:|
| Total browser requests | 229 | 236 |
| API requests | 19 | 19 |
| Failed requests | 0 | 0 |
| `409` guard responses | 0 | 0 |
| Model/assistant requests | 0 | 0 |
| Console errors | 0 | 0 |
| Console warnings | 0 | 0 |
| Page errors | 0 | 0 |

The seven-request total difference is static/RSC development-chunk loading. Exact API method/path families remained identical before and after:

- `GET /api/integrations/gmail/mailbox-index`
- `GET /api/runtime/gmail-memory`
- `POST /api/agents/playground`
- `POST /api/integrations/gmail/inbox-analysis`

Guard-churn classification: none observed. No `409 already_running`, `409 cooldown_active`, or equivalent interference occurred.

## State Transition Matrix

| Mode / Path | Baseline visible state before action | Operator action performed | Settled visible state after action | Downstream gate/status/result after action | Remaining blocker, if any | Separate blocker? | Verdict |
|---|---|---|---|---|---|---|---|
| Intelligence cold load | Gmail decision workspace; 5,144 senders; ~259,422 messages; 1,999 candidates; 17 decisions | Open exact Intelligence URL | `Inbox health` and metadata-driven labels; the same 5,144 / ~259,422 / 1,999 / 17 truth | Ready; Gmail sync/index controls remain explicit | None | NA | PASS |
| Review Groups cold load | Cleanup-group surface; 7 main, 3 optional/reference, 0 started, 5,144 senders | Open exact Clusters URL | `Review Groups` and bounded-review guidance; the same 7 / 3 / 0 / 5,144 truth | Ready; all guided stages and controls visible | None | NA | PASS |
| Simple review / last month | Deals and special offers; 108 senders, 1 managed, 107 remaining, 1,030 messages; 12 Decision Mode entries | Open exact simple review URL | Same route/query, unit, window, rows, counts, and 12 Decision Mode entries with metadata-driven shell/action labels | Ready; no mutation performed | None | NA | PASS |
| Composite review / last month | Recurring promotions and newsletters; 43 senders, 0 managed, 43 remaining, 132 messages; 12 Decision Mode entries | Open exact composite review URL | Same route/query, unit, window, rows, counts, and 12 Decision Mode entries | Ready | None | NA | PASS |
| Composite Decision Mode open/return | Settled composite Sender Overview | Click first visible `Decision Mode`, then visible `Close` | Decision Mode opened; close returned to the exact composite URL; review hero and 12 entries restored | Return/continuity gate satisfied; no destination action taken | None | NA | PASS |
| Editorial review identity | The requested editorial review URL deterministically redirects to Review Groups in the accepted baseline | Open the exact requested editorial URL | The same redirect to `/operations/clusters`; 7 main, 3 optional/reference, 0 started, 5,144 senders | Baseline behavior preserved; not misrepresented as an editorial review render | None | NA | PASS |
| Decision Management cold load | 17 managed, 3 archive ready, 2 custom rules, 10 quarantined, 0 archive applied, 2 keep | Open exact Management URL | Same management truth with metadata-driven heading/copy | Ready; `Push to Gmail` and Gmail operations remain explicit; no action clicked | None | NA | PASS |
| Provider/request boundary | Gmail provider controls and four existing API families | Complete the six-route cold-load loop and one open/return transition without provider action | Same API families and 19 API requests; zero failures, `409`s, model calls, console errors, or page errors | Zero new request/poll/lifecycle behavior | None | NA | PASS |
| Cross-domain/static presentation | Shared health slot plus domain/source/workflow/role/provenance fixtures | Render and validate seven domains plus shipping multi-role/multi-source fixture | Distinct approved titles and identities; unsafe/missing values fall back or fail closed | Deterministic, human-governed presentation contract passes | None | NA | PASS |

## Artifact index

Artifact root: `output/playwright/ace-048-phase2-presentation/`

Machine-readable evidence:

- `before-verification.json`
- `after-verification.json`
- `before-trace.zip`
- `after-trace.zip`

Human-visible before/after evidence:

- `before-intelligence.png` / `after-intelligence.png`
- `before-clusters.png` / `after-clusters.png`
- `before-review-simple-last-month.png` / `after-review-simple-last-month.png`
- `before-review-composite-last-month.png` / `after-review-composite-last-month.png`
- `before-review-composite-last-month-decision-mode.png` / `after-review-composite-last-month-decision-mode.png`
- `before-review-composite-last-month-return.png` / `after-review-composite-last-month-return.png`
- `before-review-editorial.png` / `after-review-editorial.png`
- `before-management.png` / `after-management.png`

`before-login-blocked.png` is an authentication-bootstrap diagnostic and is not acceptance evidence. The local authentication state file is sensitive verification support and must not be published or treated as a product artifact.

## Human Review bootstrap recovery — 2026-09-01

Oliver's first Human Review attempt reached a Next.js runtime overlay at `http://localhost:3000/agents`: `@supabase/ssr` reported that the project URL and API key were missing. Read-only process and environment inspection proved that port `3000` was serving this exact Phase 2 worktree while the worktree had no `.env.local`; the established saved checkout retained the required local environment variable names. This was an environment/bootstrap failure, not a Phase 2 presentation or Supabase service defect.

The failed worktree server was stopped and restarted from the same worktree with the existing local environment loaded in-process and with Next bound only to `127.0.0.1:3000`. No credential was copied, printed, committed, or exposed on a network interface. Fresh checks then proved:

- `http://localhost:3000/agents` -> `200 OK`;
- authenticated exact Intelligence route -> `200 OK` and settled `Inbox health` surface;
- visible counts `5,144`, `~259,422`, `1,999`, and `17`;
- browser console errors `0`, warnings `0`;
- runtime overlay absent;
- duplicate-key warnings absent;
- post-recovery screenshot: `.playwright-cli/page-2026-08-31T22-25-57-659Z.png`.

At that recovery checkpoint, Human Review was unblocked but still pending. The later Human decision is recorded in the closed gate below; runtime recovery alone did not constitute acceptance or authorize a later phase.

## Final rendered UI truth

The post-settle screenshots for Intelligence, Review Groups, both live review units, the Decision Mode overlay and return, the baseline-preserved editorial redirect, and Decision Management were visually inspected. The rendered surfaces are coherent; no accepted Gmail count, chart/window identity, row/action surface, provider control, or close/return behavior is visibly contradicted. Approved framework-level wording is present without genericizing Gmail operations.

Verification Confidence: `HIGH`.

## Guided exploratory discovery

Question asked: `What else breaks under realistic user behavior or an arbitrary non-Gmail workflow?`

Bounded probes covered:

- different visible titles from the same semantic slot;
- unsafe/missing titles and tokens;
- currency, count, ratio, and domain-specific semantic metrics;
- four-source paid-media controls;
- three-role/three-source shipping workflow identity;
- provider capability omission;
- deterministic human-governance metadata;
- baseline-preserved redirect behavior;
- Decision Mode open/return continuity;
- request-family and guard-churn comparison.

No additional Phase 2 defect or adjacent fragility was found inside the accepted surface. Broader runtime facades, action-capability behavior, non-Gmail live workspaces, route compatibility, Workflow Studio, learning systems, and orchestration remain separately gated future work.

## Verifier decision

Decision: `ACCEPT`

Reason: the locked presentation implementation is source-bounded, static and runtime checks pass, Gmail visible truth and behavior are preserved, cross-domain metadata proves portability, provider operations remain provider-specific, and no new request/runtime behavior appeared.

Oliver subsequently returned Human Review `ACCEPT` on 2026-09-01 after inspecting the recovered exact worktree runtime. Recovery Contract: `CHANGELOG.md` -> `September 1, 2026 — ACE-048 Framework-First Decision Workspace Phase 2 Accepted`.

Human-acceptance milestone backup: `/Users/olivercarlin/Documents/Backups/September 2026/2026-09-01/ai-agent-platform-worktree-8642 (incremental 1 September 2026 - ACE-048 framework-first Decision Workspace Phase 2 Human acceptance)`; the directory, note, accepted presentation source, and this review packet were verified present.

## Human Review decision gate

Status: `ACCEPTED / CLOSED`

Human decision: `ACCEPT` — 2026-09-01.

Acceptance boundary: Phase 2 presentation/workspace-shell only. Phase 3 and all later implementation, provider/data mutation, commit, push, and deployment remain separately gated.

Checkpoint Status: `none` — Human acceptance, the Recovery Contract, and the verified Human-acceptance milestone backup are propagated.
