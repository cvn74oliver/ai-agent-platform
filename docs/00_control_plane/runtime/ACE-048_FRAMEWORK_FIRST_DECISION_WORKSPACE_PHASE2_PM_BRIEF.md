# ACE-048 Framework-First Decision Workspace Phase 2 — Target-Locked PM Brief

Date: 2026-08-31
Status: `HUMAN-ACCEPTED / CLOSED`
Governing event: `ACE-048`
Feature domain: shared Agents/Operations presentation and decision-workspace grammar
Mode: `PLAN MODE`
Execution mode: `transitional_self_verification`
Reasoning level: `HIGH`
Problem class: `UI grammar / rendering`
Execution readiness: `target-locked / execution authorized`
Target-lock source: `inferred_target_lock`

## Executive summary

### What is changing

Automata's existing Operations workspace will gain one framework-owned presentation layer. The framework will keep stable decision concepts while each workflow adapter supplies its real business nouns, metrics, evidence, actions, and provider controls. Gmail remains the reference application and regression baseline; it does not become the platform model.

### What the operator will get

The same understandable decision workflow can support Gmail, customer service, real estate, crypto, paid media, bookkeeping, tax, purchasing, shipping, spreadsheet maintenance, and future agent-operated workflows. Specialized needs can be added through declared capabilities and bounded add-ons without forking the shared workspace or redesigning the platform.

### Why it matters

Humans should be able to understand what is happening, what needs attention, why an agent recommends something, what decision is required, what action will occur, and what outcome followed—regardless of company or provider. The resulting decisions, corrections, SOPs, and outcomes feed the tenant-owned proprietary brain as durable, inspectable institutional memory.

## Accepted product direction

1. **Framework first.** Future applications use the shared reporting -> recommendation -> human decision -> approved action -> measured outcome loop wherever it fits.
2. **Gmail as reference adapter.** Gmail proves the framework against a mature workflow and remains frozen regression truth during this phase.
3. **Arbitrary workflow composition.** A business may coordinate purchasing agents, spreadsheet-maintenance agents, shipping or inventory agents, and feedback between those stages without creating a new platform shell. Presentation metadata must not assume one agent, one workflow, or one provider; every rendered recommendation, decision, action, and outcome must retain its source, workflow, agent-role, and provenance identity where applicable.
4. **Customization through explicit seams.** Domain needs extend the system through versioned workflow definitions, adapter vocabulary, semantic metrics, evidence types, capability declarations, action catalogs, and bounded provider add-ons—not one-off global forks.
5. **No forced false abstraction.** Real Gmail sync/index controls, provider receipts, regulated approval gates, or domain-specific actions retain truthful names and behavior.
6. **Human decision quality is the test.** Shared presentation must improve comprehension, prioritization, rationale, consequence awareness, and outcome visibility.
7. **Durable learning is platform memory.** Agent improvement is captured through versioned SOPs, approved examples, corrections, decisions, outcomes, provenance, and feedback in the private proprietary brain. Improvement must remain inspectable, human-governed, evaluated, and reversible. It is not hidden LLM training, automatic fine-tuning, uncontrolled self-modification, or silent cross-tenant learning.
8. **Evolution without overhaul.** Preserve the working system and introduce the smallest additive presentation seam needed for portability. Broader runtime or route changes remain later phases.

## Objective

Introduce a provider-neutral presentation definition and context across the currently rendered Operations workspace so framework-owned labels are stable, adapter-owned domain language is explicit, and provider-operational controls appear only when the selected workflow/source declares them. Preserve accepted Gmail behavior, route identity, data truth, actions, and request behavior.

## Proven render path and target lock

Authoritative shared chain:

`web/src/app/agents/[id]/operations/layout.tsx`
-> `DashboardLayout`
-> `OperationsWorkspaceShell`
-> `OperationsRuntimeProvider`
-> active Operations route page

Ownership findings:

- `DashboardLayout` owns generic application framing and does not require Phase 2 modification.
- `OperationsWorkspaceShell` owns Operations navigation, captions, assistant context/prompts, workspace explanation, analysis wording, and current Gmail operational controls.
- The route pages remain separate Gmail-shaped presentation implementations and must consume the shared presentation context incrementally.
- `GmailCleanupComponents.tsx` owns reusable visible overview/decision widgets whose user-facing nouns must come from presentation metadata.
- The accepted Phase 1 decision-workspace contract and Gmail review-unit adapter already establish the core/adapter boundary and are not changed in Phase 2.

Locked route file:

- `web/src/app/agents/[id]/operations/layout.tsx`

Locked existing files:

1. `web/package.json`
2. `web/src/app/agents/[id]/operations/layout.tsx`
3. `web/src/app/agents/[id]/operations/page.tsx`
4. `web/src/components/runtime/OperationsWorkspaceShell.tsx`
5. `web/src/app/agents/[id]/operations/intelligence/page.tsx`
6. `web/src/app/agents/[id]/operations/clusters/page.tsx`
7. `web/src/app/agents/[id]/operations/review/page.tsx`
8. `web/src/app/agents/[id]/operations/management/page.tsx`
9. `web/src/components/runtime/GmailCleanupComponents.tsx`
10. `web/src/lib/runtime/cleanupGroupPresentation.ts`

Locked new files:

1. `web/src/lib/runtime/decisionWorkspacePresentation.ts`
2. `web/src/components/runtime/DecisionWorkspacePresentationContext.tsx`
3. `web/src/lib/integrations/gmail/gmailDecisionWorkspacePresentation.ts`
4. `web/scripts/workspace-decision-presentation-fixtures.mjs`

No other product/source file is authorized by this brief. An unexpected required target is scope expansion and must return to the Project Manager.

## Presentation ownership contract

### Framework-owned semantic slots and fallback vocabulary

- health overview (`Decision health` fallback)
- Review Groups
- Item Overview
- Decision Mode
- Decision Management
- Items in scope
- Review candidates
- Decisions made
- Recommendations
- Execution status
- universal attention stages: Start Here; Work Through Older Items; Review Carefully; Optional Specialized Groups; Reference Only

The framework owns stable semantic slot IDs, required meaning, accessibility requirements, validation, and safe generic fallbacks. An adapter may supply approved visible domain titles for those slots but may not change their meaning or lifecycle role.

### Adapter-provided domain language

- visible domain title and subtitle for a framework semantic slot
- universe label
- decision-subject singular and plural
- activity/event nouns
- semantic metric labels, measures, units, and aggregation compatibility
- evidence labels
- action labels
- provider/source names
- domain-specific guidance and prompts

Adapter language may specialize a workflow but may not redefine the shared decision lifecycle. Curated adapters supply deterministic defaults; for example, the same health-overview slot may render `Inbox health` for Gmail, `Portfolio health` for investments, `Campaign health` for paid media, `Compliance health` for tax, or `Service health` for support. Missing, invalid, or unsafe metadata must fail closed or use the framework fallback `Decision health`; it must never leak Gmail vocabulary into another domain.

### Provider-operational controls

The following remain intentionally explicit and capability/source-gated:

- Gmail Smart Sync
- Continue Backfill
- full mailbox reindex
- mailbox index and connection status
- Push to Gmail
- Inbox restore
- provider receipts and provider errors

A multi-source workspace must render operational state per source. It must not inherit one global Gmail-shaped sync panel.

### Legacy/internal vocabulary deferred beyond Phase 2

- Gmail DTO, component, and module names
- current route slugs such as `/intelligence` and `/clusters`
- route-facing fields such as `cleanup_candidate_universe` and `runtime_mailbox_profile`
- Gmail API routes and provider service internals

These may remain internal compatibility seams until the separately gated runtime-facade and compatibility phases.

## Required presentation definition

The generic presentation definition must be declarative, validated, and additive. It must provide:

- stable framework labels and page descriptions;
- stable semantic slot IDs with required meaning, accessibility text, and safe generic fallbacks;
- adapter-supplied subject, activity, evidence, metric, and action vocabulary;
- adapter/workflow-supplied visible title, subtitle, and approved explanatory copy for each eligible semantic slot;
- tokenized operator copy that rejects unknown or missing tokens;
- declared provider/source controls tied to capabilities;
- per-source status presentation for multi-source workspaces;
- explicit source, workflow, agent-role, and provenance identity without assuming a single active agent, workflow, or provider;
- defaults that preserve the current Gmail-visible result through the Gmail compatibility presentation adapter;
- no network, persistence, polling, or lifecycle behavior.

The presentation context is a render dependency only. It must not become a duplicate runtime store, workflow builder, provider client, or source of decision truth.

AI may later propose presentation labels during separately governed workflow/adapter setup, but the accepted result must be human-reviewable, versioned with the published workflow/presentation definition, deterministic at render time, and reversible. Phase 2 must not call a model on page load or generate/rewrite titles at runtime.

## Seven-domain vocabulary test

| Reference workflow | Overview subject | Supporting activity/evidence | Representative domain actions or controls |
|---|---|---|---|
| Gmail | Sender Overview | Messages / Supporting messages | Archive, unsubscribe, Gmail sync/index controls |
| Customer service | Case Overview | Case events | Escalate, resolve case, issue refund |
| Real estate | Property Overview | Market observations | Shortlist, request due diligence |
| Crypto | Position Overview | Position observations | Monitor, rebalance position |
| Multi-source paid media | Campaign Overview | Spend / attributed revenue | Keep observing, pause, scale; per-source status |
| Bookkeeping | Transaction Overview | Ledger entries / transactions | Escalate, categorize transaction |
| Tax | Tax Issue Overview | Compliance observations | Review with accountant |

Acceptance implications:

- Generic `Activity` cannot assume a count. Semantic metrics may use count, currency, ratio, duration, or another declared measure.
- Cross-source aggregation is allowed only for explicitly compatible semantic metrics.
- A domain-specific action or control is absent unless the workflow/source declares the corresponding capability.
- The shipping/purchasing example must compose from the same primitives: purchases or shipments as decision subjects, orders/updates as activity, receipts/tracking records as evidence, spreadsheet updates as controlled actions, and delivery/cost/exception outcomes as measurements.
- Generated presentation fixtures must prove that multiple agent roles, workflows, and providers can retain distinct source/workflow/provenance identity without changing the shared framework vocabulary.
- Fixtures must prove that one stable health-overview semantic slot renders different approved domain titles and subtitles, while missing/unsafe metadata fails closed or renders `Decision health` without provider leakage.
- Any proprietary-brain improvement represented in presentation metadata must identify its version and provenance and remain subject to human governance, evaluation, and rollback; Phase 2 must not implement learning, training, self-modification, or cross-tenant transfer behavior.

## Execution slices

1. **Presentation contract and fixtures** — add the generic definition, validator, token renderer, context, Gmail compatibility metadata, and seven-domain fixtures.
2. **Shared shell** — make Operations navigation, captions, assistant copy, workspace explanation, and provider-control presentation consume the definition.
3. **Decision Intelligence and Review Groups** — replace platform-level Gmail wording and fixed metric labels while preserving data and group identity.
4. **Item Overview, Decision Mode, and Decision Management** — consume subject/evidence/action vocabulary while retaining explicit Gmail operations and unchanged behavior.
5. **Verification and leakage discovery** — prove Gmail parity, all seven reference definitions, capability gating, multi-source control separation, and zero new request behavior.

Each slice must stop on unexpected runtime coupling, action-semantic change, or an additional file requirement.

## Constraints and exclusions

- No route rename or alias.
- No runtime DTO/facade migration; that remains Phase 3.
- No capability-driven action behavior change; that remains Phase 4.
- No provider connection, Gmail access, Smart Sync execution, indexing, database, artifact, publication, or data mutation.
- No new request, endpoint, polling, cache, lifecycle, or background behavior.
- No page-load model call, dynamic title generation, nondeterministic copy, or silent copy drift.
- No Workflow Studio, marketplace, shared-learning pipeline, model-selection, or proprietary-brain UI implementation.
- No multi-agent orchestration implementation; multi-role/source/workflow identity is a presentation-contract constraint only.
- No uncontrolled self-modification, silent learning, or cross-tenant knowledge transfer.
- No provider data/state mutation and no change to action semantics.
- No commit, push, deployment, or worktree integration.
- Preserve all unrelated dirty state.

Explicitly protected from Phase 2 edits:

- `web/src/lib/runtime/decisionWorkspaceContract.ts`
- `web/src/lib/integrations/gmail/gmailReviewUnitContract.ts`
- `web/src/components/runtime/OperationsRuntimeContext.tsx`
- `web/src/lib/integrations/gmail/gmailCleanupWorkspace.ts`
- all API routes
- `DashboardLayout`
- provider data/state and publication code

## Load declaration

- Problem class: `UI grammar / rendering`
- Heavy endpoints affected: none
- Request families affected: none
- Polling involved: no
- Expected steady-state request delta: zero
- Build-pending continuity: unaffected
- Build completion / continuity exit: unaffected
- Smart Sync -> artifact handoff: unaffected
- Stale-build reclaim: unaffected

Any new request family, poller, provider call, guard churn, or lifecycle change is a Phase 2 failure.

## Accepted proof surfaces

Static and fixture proof:

- seven-domain presentation fixture;
- existing Phase 1 decision-workspace fixtures;
- existing Gmail review-unit, cleanup-assignment, and window-projection fixtures;
- validator proof that adapters cannot override framework vocabulary;
- leakage scan showing non-Gmail definitions do not render Gmail chrome;
- capability/source proof that provider controls appear only when declared;
- generated-chrome proof that multi-agent-role, multi-workflow, and multi-provider definitions preserve source/workflow/provenance identity without Gmail leakage;
- generated-chrome proof that the shared health-overview slot renders curated domain-adaptive titles and that missing/unsafe titles use `Decision health` or fail validation;
- static governance proof that proprietary-brain presentation fields are versioned/provenance-backed and cannot imply automatic mutation or cross-tenant learning;
- targeted TypeScript, lint, fixture scripts, and `git diff --check`.

Runtime/browser proof after route-specific ready state:

- `/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/intelligence`
- `/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/clusters`
- `/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/review?cluster_id=semantic.marketing_subscriptions&subset_source=review_unit&subset_value=family%3Aoffer_campaign&sender_overview_window=last_month`
- `/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/review?cluster_id=semantic.marketing_subscriptions&subset_source=review_unit&subset_value=review-unit%3Asemantic_parent_subscription_senders_family_marketing_promotional%3Asubtype-marketing_promotional_remainder%3Apattern-promotional_cycle&sender_overview_window=last_month`
- `/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/review?cluster_id=semantic.marketing_subscriptions&subset_source=review_unit&subset_value=family%3Amarketing_candidate_editorial_content`
- `/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/management`

Browser verification must use the explicit port-`3000` runtime target only when supplied/started under the later execution authority. It must capture post-settle screenshots, DOM/state, request traces, console state, and a row-by-row State Transition Matrix for affected paths. PM discovery evidence is not verifier closeout evidence.

## Verification expectations

- Gmail route/query identity, published universe, counts, groups, windows, rows, Decision Mode return, action choices, and provider controls remain unchanged except for approved framework-level wording.
- No provider operation is relabeled as a generic promise the system cannot fulfill.
- No generic presentation copy leaks Gmail terms when a non-Gmail definition is active.
- Multi-source status is source-specific and compatible metrics only are combined.
- Multiple agent roles and workflows retain distinct source, workflow, role, and provenance identity; the presentation layer must not collapse them into a single-agent or single-workflow assumption.
- Unknown/missing presentation tokens fail closed during validation.
- Visible titles are deterministic from the versioned presentation definition; no page-load AI request or runtime rewrite occurs.
- No new requests, polling, console errors, failed APIs, or `409` guard churn are introduced.
- Final rendered UI truth must be inspected; machine-readable parity cannot override a visible contradiction.
- Guided discovery must ask: `What else breaks under realistic user behavior or an arbitrary non-Gmail workflow?`

## Regression protections

- Accepted Gmail data, cleanup groups, Sender Distribution, Time Context, Pressure Trend, workflows, Decision Mode behavior, and Management behavior are frozen regression truth.
- Existing provider actions and operational controls remain explicit.
- Routes and query identities remain stable.
- Shared labels originate from the presentation definition, not provider-shaped DTO names.
- Semantic metrics retain measure/unit/aggregation meaning.
- Presentation metadata cannot mutate runtime state or provider capability truth.
- No broad refactor or new abstraction beyond the locked presentation seam.

## Deferred phases and known later concerns

- Phase 3: generic runtime/data facade.
- Phase 4: capability-driven Decision Mode and Management.
- Phase 5: mock/read-only non-Gmail rendered workspaces and portability proof.
- Phase 6: route/module compatibility cleanup.
- Management follow-up: review-unit/window carry-forward, pagination of capped reads, action parity including unsubscribe, and summary-cache invalidation after mutations.

These items are not authorized by this brief.

## Execution authority and checkpoint

Oliver accepted the recommendation and target-locked direction on 2026-08-31, including Gmail as the reference application, framework-first future applications, arbitrary company workflows, bounded customization/add-ons, preservation of the working system, human decision quality, and the tenant-owned long-term brain.

The target-lock acceptance was initially captured as **logged deferred execution** and did not authorize source implementation.

Pre-execution authority reconciliation: the later conversational phrase `I accept everything` followed a question about whether additional information was needed and did not explicitly state `authorize Phase 2 implementation` or equivalent. Because the prior decision surface reserved implementation for a separate bounded decision, that phrase does not supersede logged deferred execution. Source/UI work remains prohibited until Oliver gives an unambiguous implementation instruction at the explicit gate below.

Required implementation decision:

- `ACCEPT PHASE 2 IMPLEMENTATION` — authorize only the locked files, five bounded slices, exclusions, and proof contract in this brief.
- `REJECT` — return the plan for correction.
- `BLOCKED` — identify the exact missing proof or dependency.
- `RETURN_TO_PM` — reconsider scope before execution.

Oliver subsequently supplied the explicit decision `ACCEPT PHASE 2 IMPLEMENTATION` on 2026-08-31 through the fresh bounded execution delegation. Implementation is now authorized only for the locked 14-file allowlist, five slices, exclusions, load declaration, and verification contract in this brief. This authority does not include commit, push, deployment, provider/data mutation, later phases, or any unlisted source file.

Pre-implementation milestone incremental backup completed at `/Users/olivercarlin/Documents/Backups/August 2026/2026-08-31/ai-agent-platform-worktree-8642 (incremental 31 August 2026 - Pre ACE-048 framework-first Decision Workspace Phase 2 presentation implementati)`. Normal seven-day pruning was limited to the refreshed worktree backup source; every `KEEP` archive remained preserved.

The five bounded slices are implemented and verifier-accepted at `HIGH` confidence. Static/cross-domain checks and full authenticated post-settle Playwright proof passed; Gmail data, route/query identity, counts, groups, windows, rows, Decision Mode return, actions, provider controls, and API families remain preserved. Review packet: `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE2_REVIEW_PACKET.md`.

Oliver returned Human Review `ACCEPT` on 2026-09-01 after inspecting the recovered exact worktree runtime and confirming the Gmail-facing result remained correct. Recovery Contract: `CHANGELOG.md` -> `September 1, 2026 — ACE-048 Framework-First Decision Workspace Phase 2 Accepted`.

Human-acceptance milestone backup completed and was verified at `/Users/olivercarlin/Documents/Backups/September 2026/2026-09-01/ai-agent-platform-worktree-8642 (incremental 1 September 2026 - ACE-048 framework-first Decision Workspace Phase 2 Human acceptance)`; normal pruning remained limited to the selected worktree backup family and `KEEP` preservation remained in force.

Phase 2 is closed. This acceptance does not authorize Phase 3 implementation, later phases, commit, push, deployment, or provider/data mutation. The next recommended gate is a fresh bounded Phase 3 runtime/data-facade discovery and target-lock pass.

Checkpoint Status: `none` — Human acceptance, the Recovery Contract, and the verified Human-acceptance milestone backup are propagated.
