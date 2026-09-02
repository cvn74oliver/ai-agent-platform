# ACE-048 Framework-First Decision Workspace Refactor — PM Brief

Date: 2026-08-31
Status: `PHASES 1-3 HUMAN-ACCEPTED / CLOSED; PHASE 4 DISCOVERY COMPLETED / TARGET-LOCKED; IMPLEMENTATION AWAITING EXPLICIT DECISION`
Governing event: `ACE-048`
Execution mode: `transitional_self_verification`
Problem class: mixed — architecture boundary, runtime contract, and UI grammar
Reasoning level: EXTRA-HIGH — this is a staged cross-layer architecture migration over accepted runtime behavior.

## Executive summary

### What is changing

- Automata becomes a provider-neutral decision workspace rather than a Gmail-shaped application with later connectors attached.
- Gmail remains the first explicit provider adapter. Gmail sync, indexing, message evidence, and Gmail actions keep truthful provider-specific names behind that boundary.
- Shared workflow surfaces consume a generic decision-workspace contract for subjects, activity, evidence, review groups, decisions, capabilities, risk, reversibility, and execution lifecycle.
- The prior narrow `Decision Intelligence` naming brief is superseded before implementation because Oliver expanded the governing requirement to the full workflow.

### What the operator will get

- One reusable workflow that can review senders, ads, assets, transactions, documents, or another decision subject without rebuilding the product shell.
- Provider-appropriate nouns and actions inside each workspace, including multiple connected sources without one provider's language leaking into the aggregate view.
- The accepted Gmail cleanup groups, linked charts, Decision Mode behavior, and published data retained as the regression baseline during migration.

### Why it matters

A mechanical Gmail-to-generic rename would only hide coupling. The platform must own decision concepts while adapters own provider data and operations. This creates a real plug-and-play boundary instead of a cosmetic one.

## Product and architecture decision

Recommended model:

1. **Platform core owns the decision loop.** It defines workspace identity, review-unit membership, time/activity projection, evidence, recommendations, decisions, approvals, execution lifecycle, history, and shared presentation behavior.
2. **Provider adapters own source truth.** A Gmail adapter owns Gmail authentication, sync/indexing, sender/message mapping, archive/unsubscribe capabilities, and Gmail-specific status. Future Facebook Ads, crypto, and tax adapters own their corresponding APIs, schemas, and actions.
3. **Workspace definitions own vocabulary and capabilities.** Each workflow declares its subject labels, activity labels and measures, evidence kinds, available actions, risk/reversibility, and execution semantics.
4. **Aggregate multi-source views use common primitives only.** Cross-source dashboards may show items in scope, activity, candidates, decisions, recommendations, and execution state. Provider nouns appear only after a source/workflow is selected or where an adapter explicitly supplies them.

This boundary intentionally does **not** rename Gmail connector internals to generic names. Provider-specific code should remain obviously provider-specific.

## Product model: reporting -> recommendation -> human decision -> controlled action

Automata is a visual reporting and decision system for agent-operated workflows. Its reusable loop is:

`Source data -> agent/SOP analysis -> evidence-backed recommendation -> human decision -> approved execution -> measured outcome`

The interface must answer six questions quickly in every domain:

1. What is happening?
2. What needs attention now?
3. Why did the agent recommend this?
4. Which SOP, rule, or workflow objective produced that recommendation?
5. What changes if the human accepts or rejects it?
6. Did the approved action actually execute and improve the intended outcome?

Gmail cleanup currently demonstrates portions of this loop, but the reusable product must make all six questions first-class rather than encoding them in Gmail-specific pages and copy.

## Initial system roadmap

The framework must support any future provider or decision domain. The first practical validation portfolio reflects Oliver's operating experience and is prioritized as follows:

1. **Customer service** — Zendesk, live chat, support email, refunds, escalation, service quality, and resolution outcomes.
2. **Investments** — real-estate scouting plus crypto opportunity/portfolio management, with capital-deployment, risk, liquidity, and return decisions.
3. **Paid media and advertising** — Facebook, Google, TikTok, and email ad buying, with performance, creative, budget, pause/scale, and return decisions.
4. **Finance** — bookkeeping and tax accounting, including classification, documentation, anomaly, compliance, and escalation decisions.

These are reference validation systems, not hard-coded framework categories. Third parties must be able to register other providers, subjects, metrics, evidence, workflows, and actions without editing shared page logic.

The framework must also support arbitrary cross-agent operating chains—for example, purchasing agents acquiring discounted products, other agents maintaining spreadsheets, shipping or inventory agents tracking fulfillment, and measured outcomes feeding back into future decisions. Variations should use versioned workflow definitions, adapters, semantic metrics, declared capabilities, and bounded add-ons before any shared-platform overhaul or company-specific fork is considered.

Future product layers:

- a marketplace of reusable connectors, workflow/SOP templates, reporting packs, decision policies, and agent configurations;
- AI-guided creation that can use approved MCP capabilities to assemble workflows, automations, and the company-owned proprietary brain while still producing explicit versioned artifacts;
- high-level-to-fine-grained monitoring of agent observations, recommendations, decisions, actions, and outcomes;
- operator feedback that records approvals, overrides, corrections, and rationale for governed agent learning;
- a company-owned proprietary brain: a versioned application-layer knowledge and memory system for SOPs, policies, examples, corrections, decisions, outcomes, and retrieval context.

The proprietary brain is not an LLM, a newly created model, or a fine-tuning dataset. Foundation models may reason over its authorized context at runtime, but durable company learning lives in the platform as versioned, inspectable knowledge, memory, feedback, and workflow artifacts. Topic coverage, source provenance, quality labels, representative examples, missing-knowledge gaps, human corrections, and outcome feedback remain useful concepts from the earlier training UI and should be preserved under this new model.

Shared learning must be privacy-first and separately governed. Proprietary SOPs, raw records, credentials, identities, examples, corrections, and tenant-specific decisions remain private by default. Any cross-customer learning requires explicit opt-in, aggregation/de-identification, minimum cohort/privacy thresholds, provenance, evaluation, rollback, and a clear distinction between de-identified platform learning and each company's private proprietary brain.

## Product-area ownership

Oliver's intended placement is retained with one boundary refinement:

| Product area | Owns |
|---|---|
| Settings / Connections | Provider accounts, authentication, permissions/scopes, connection health, and reusable capability inventory |
| Automations / Workflow Studio | Guided workflow/SOP authoring, triggers, connected sources, agent assignment/instructions, analysis rules, metrics, decision gates, actions, schedules, tests, and versioned publication |
| Agents / Operations | Runtime instances of published workflows: reporting, groups/items needing attention, evidence-backed recommendations, human decisions, approvals, execution truth, outcomes, and history |
| Dashboard | Cross-workflow and cross-source status using only compatible shared metrics |

Automations is therefore the design-time control plane for workflows/SOPs; Agents is the run-time decision surface. The decision-workspace contract references a published workflow definition and version but does not become a second workflow builder.

The workflow builder may offer integration selection/configuration, but credentials and reusable provider connections stay centralized in Settings. A workflow references a connection and requests capabilities; it does not own or duplicate the secret-bearing connection itself.

Recommended future Automations lifecycle:

`Draft -> validate -> simulate/test -> publish version -> assign to agent/workspace -> run -> observe -> revise as a new version`

Published versions are immutable for auditability. Editing creates a new draft/version so historical recommendations and decisions continue to point to the exact SOP that governed them.

## Flexibility audit: additional platform capabilities required

The current system has useful pieces—time/activity projections, group distributions, recommendations, approvals, risk/reversibility display, execution history, freshness, and evidence—but they are fragmented and frequently Gmail-shaped. The framework should consolidate them into the following reusable contracts.

### 1. Versioned SOP and workflow context

- Every recommendation identifies the governing SOP/workflow, version, objective, rule/checkpoint, and agent assignment that produced it.
- A later SOP update must not rewrite the historical reason for an earlier recommendation or decision.
- Workflows declare stages, exit criteria, escalation paths, and which decisions require a human.
- Workflow definitions are authored and published in Automations; Operations stores only a stable reference to the published definition/version plus its runtime instance state.

### 2. Metric and visualization semantics

- Every metric declares an ID, label, unit, aggregation, directionality, time basis, comparison rule, and whether it is safe to aggregate across sources.
- Charts render from semantic metric definitions rather than assuming “messages” or one count measure.
- The visual grammar supports volume, value, rate, score, distribution, trend, anomaly, target, forecast, and status without forcing unrelated domains into email-shaped bars.

### 3. Evidence, provenance, freshness, and data quality

- Each evidence item identifies its source connector, source record, observation time, ingestion time, transformation/version, and freshness.
- Recommendations visibly distinguish missing, stale, partial, conflicting, and low-quality evidence from a genuinely negative result.
- Aggregate claims retain drill-down lineage to the contributing sources and records.

### 4. Recommendation contract

- Recommendations carry the proposed action, rationale, confidence, expected impact, urgency, alternatives, assumptions, governing SOP reference, evidence references, and expiration/re-evaluation time.
- Confidence is not approval authority. Low confidence or high risk can route a recommendation to closer review without hiding it.
- The system can compare the agent recommendation with the human decision and later outcome for learning and reporting.

### 5. Decision and action contract

- Human decisions record actor, time, selected option, reason/override, scope, and the recommendation version reviewed.
- Actions declare provider capability, prerequisites, approval policy, risk, reversibility, idempotency key, dry-run/preview support, execution status, provider receipt, and rollback path.
- “Decision made” remains distinct from “action approved,” “action executed,” and “desired outcome observed.”

### 6. Multi-source composition

- A workspace may contain multiple connectors and multiple workflows per connector.
- The framework must not merge incompatible metrics merely because they share a timeframe.
- Cross-source relationships use explicit entity/link definitions and conflict rules; they never rely on labels alone.
- Source health/freshness stays separate from workflow health and decision coverage.

### 7. Human attention and reporting model

- The framework supports priority, urgency, materiality/impact, confidence, risk, freshness, and effort as separate dimensions.
- Decision queues can be sorted and filtered by those dimensions without changing the underlying universe.
- Reports distinguish descriptive truth (what happened), diagnostic truth (why), predictive guidance (what may happen), and prescriptive guidance (what to do).

### 8. Governance and extensibility

- Connector permissions, workspace/tenant identity, data retention, audit history, and redaction rules are explicit.
- Adapter and contract versions are validated before a workflow becomes active.
- Unsupported capabilities fail closed and are shown as unavailable; the UI does not invent generic actions a provider cannot perform.
- New adapters can be added through registration/configuration and fixtures without editing every shared page.
- Company-specific SOP and memory stores remain tenant-isolated; marketplace publication and shared learning are explicit, revocable acts rather than default data flows.
- The proprietary brain is modeled as versioned knowledge, memory, feedback, and provenance—not model training. Legacy `LLM training`, `fine-tune dataset`, and `training example` surfaces must later migrate to brain-oriented vocabulary without deleting their accepted coverage, quality, example, and correction semantics.

## Existing foundation and locked diagnosis

The repository already contains the correct architectural seed:

- `web/src/lib/runtime/reviewUnitContract.ts` defines a generic workflow blueprint, decision subject, action catalog, review-unit adapter, exact membership, and validation.
- `web/src/lib/runtime/reviewUnitWindowProjection.ts` projects generic entity activity and measure payloads over time.
- Generic contract fixtures already prove crypto positions and tax transactions/documents, including multiple decision subjects in one workspace.
- `web/src/lib/integrations/gmail/gmailReviewUnitContract.ts` correctly acts as a Gmail adapter for the generic review-unit engine.

The remaining coupling is primarily above and around that foundation:

- shared route/page copy and navigation use Mailbox, Inbox, Sender, and Cleanup as platform concepts;
- `OperationsWorkspaceShell` supplies Gmail-specific assistant context and workflow labels;
- runtime client/data-transfer modules expose Gmail-shaped types and request names directly to shared pages;
- Decision Mode and Management action semantics are still fixed around Gmail rather than declared adapter capabilities.

Therefore the work is a staged dependency inversion, not a rewrite of the accepted review-unit and projection engines.

## Canonical framework vocabulary

Framework-owned visible concepts:

- `Decision Intelligence`
- `Review Groups`
- `Item Overview` (adapter may render `Sender Overview`, `Ad Overview`, `Asset Overview`, or `Transaction Overview` inside a selected workflow)
- `Decision Mode`
- `Decision Management`
- `Items in scope`
- `Activity`
- `Review candidates`
- `Decisions made`
- `Recommendations`
- `Execution status`

Adapter-owned examples:

| Adapter | Decision subject | Activity/measures | Example actions |
|---|---|---|---|
| Gmail | Sender | Messages, unread state, engagement | Keep, archive, unsubscribe, quarantine |
| Facebook Ads | Ad or campaign | Spend, impressions, clicks, conversions | Keep running, pause, scale, reduce budget |
| Crypto | Asset, position, or opportunity | Price/liquidity/risk signals, trades | Watch, invest, hold, reduce, exit |
| Tax accounting | Transaction, document, or issue | Amount, classification, documentation state | Accept, recategorize, match, flag, escalate |

The adapter chooses the subject for each workflow; a provider is not restricted to one subject type.

## Contract required before UI migration

The platform-level decision-workspace definition must support:

- source/workspace/workflow identity;
- published automation/workflow definition ID, version, and runtime-instance identity;
- universe and decision-subject vocabulary;
- activity noun, event identity, time field, and named measures;
- evidence and recommendation kinds;
- versioned SOP/workflow references, objectives, rules, and escalation points;
- semantic metric definitions with units, aggregation, directionality, time basis, and cross-source compatibility;
- evidence provenance, freshness, completeness/quality, and transformation lineage;
- recommendation rationale, confidence, expected impact, alternatives, assumptions, and expiry;
- review-unit dimensions and sizing policy;
- action catalog with capability requirements;
- action risk, reversibility, approval requirement, and provider execution mapping;
- lifecycle states for proposed, approved, executing, executed, failed, and reverted work;
- immutable human-decision records and provider execution receipts;
- explicit multi-source entity links and metric compatibility rules;
- provider/source status that remains separate from platform workflow status;
- private proprietary-brain governance that explicitly models versioned knowledge/memory, provenance, and feedback while excluding foundation-model training;
- optional presentation labels without permitting an adapter to alter stable membership, counts, or decision truth.

## Phased migration

### Phase 0 — Governing plan and boundary lock (this pass)

- Supersede the narrow naming-only brief.
- Preserve the accepted Gmail surface as a frozen regression baseline.
- Record the adapter/core boundary and phased migration contract.
- No product code, runtime, provider, database, or publication mutation.

### Phase 1 — Generic decision-workspace contract

Objective: create the provider-neutral contract without changing visible Gmail behavior.

Target-locked files:

- `web/src/lib/runtime/decisionWorkspaceContract.ts` (new)
- `web/src/lib/runtime/reviewUnitContract.ts`
- `web/src/lib/integrations/gmail/gmailReviewUnitContract.ts`
- `web/scripts/workspace-decision-contract-fixtures.mjs` (new)
- `web/scripts/workspace-review-unit-contract-fixtures.mjs`
- `web/package.json`

Required proof:

- Gmail, Facebook Ads, crypto, and tax workflow definitions validate independently.
- At least one workspace exposes multiple decision-subject workflows.
- A mixed-source aggregate can use common metrics without inheriting any provider noun.
- SOP, metric, evidence, recommendation, decision, and action definitions validate without depending on Gmail fields.
- Incompatible cross-source measures fail closed rather than being silently combined.
- Historical recommendations retain their SOP/contract version and evidence provenance.
- Runtime records reference a published Automation definition/version without duplicating the builder's full mutable draft state.
- Existing Gmail review-unit, window-projection, cleanup-assignment, and published-data fixtures remain byte/behavior compatible where the contract does not require an intentional additive field.
- TypeScript, targeted lint, fixtures, and `git diff --check` pass.

Phase 1 classification: `target-locked / execution-ready only after explicit plan acceptance`.

### Phase 2 — Generic presentation and workspace shell

- Introduce shared navigation/presentation metadata for Decision Intelligence, Review Groups, Item Overview, Decision Mode, and Decision Management.
- Replace hard-coded Gmail assistant context and platform-level copy with contract-driven text.
- Keep current routes stable initially; route renames or aliases require a separate compatibility decision.
- Keep provider-operational controls explicit, such as Gmail Smart Sync or reindex.

Phase 2 is Human-accepted and closed as of 2026-09-01. The authoritative brief and review packet are `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE2_PM_BRIEF.md` and `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE2_REVIEW_PACKET.md`. Recovery Contract: `CHANGELOG.md` -> `September 1, 2026 — ACE-048 Framework-First Decision Workspace Phase 2 Accepted`. The verified Human-acceptance milestone backup is `/Users/olivercarlin/Documents/Backups/September 2026/2026-09-01/ai-agent-platform-worktree-8642 (incremental 1 September 2026 - ACE-048 framework-first Decision Workspace Phase 2 Human acceptance)`.

### Phase 3 — Generic runtime/data facade

Status: `SLICES 1-4 HUMAN-ACCEPTED / RECOVERY-BACKED / CLOSED`. Slice 1 established the generic Review Groups read boundary, Slice 2 established Decision Intelligence, Slice 3 established Sender Overview/Item Overview, and Slice 4 established the managed decision-state read facade while preserving lifecycle ownership and existing Gmail behavior. Recovery Contract: `CHANGELOG.md` -> `September 2, 2026 — ACE-048 Framework-First Decision Workspace Phase 3 Slice 4 Accepted`.

- Define platform DTOs for decision intelligence, review groups, decision items, activity series, evidence, recommendations, and management summaries.
- Make shared pages call a generic workspace service/facade.
- Keep Gmail fetchers, provider schemas, and API routes behind the Gmail adapter.
- Add reusable provenance/freshness/data-quality envelopes and semantic metric series to the read model.
- Migrate one accepted surface at a time, with linked-surface parity after every slice.

### Phase 4 — Capability-driven Decision Mode and Management

Status: `DISCOVERY COMPLETED / TARGET-LOCKED; IMPLEMENTATION AWAITING EXPLICIT DECISION`. Authoritative discovery context: `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE4_DISCOVERY_HANDOFF.md`. Exact first-slice execution contract: `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE4_SLICE1_ACTION_PRESENTATION_PM_BRIEF.md`.

- Render available actions from the adapter action catalog rather than fixed Gmail actions.
- Enforce capability, risk, approval, reversibility, and execution lifecycle consistently.
- Preserve optional-evidence behavior, exact selected review unit/window, and existing decision return state.
- Show the governing SOP/rule, rationale, confidence, expected impact, alternatives, and evidence quality on the decision surface.
- Keep recommendation, human decision, approval, provider execution, and measured outcome as separate lifecycle events.

### Phase 5 — Portability and multi-source proof

- Add read-only/mock Facebook Ads, crypto, and tax adapters using representative fixture data.
- Prove the same workflow shell renders each domain without Gmail imports or Gmail vocabulary leakage.
- Prove a multi-source aggregate uses only common primitives and drills into the correct adapter-specific workspace.
- Prove incompatible metrics cannot be aggregated, source freshness does not masquerade as workflow health, and every recommendation can trace back to its SOP plus source evidence.
- These are contract/fixture adapters only unless Oliver separately authorizes real provider integration work.

### Separate future workstream — Automations / Workflow Studio

The existing Automations page is only an early workflow list plus prompt-based generator. A future separately governed workstream should design the guided builder around:

- goal and success criteria;
- selected provider connections and required permissions;
- trigger/schedule/event inputs;
- agent assignment and instructions;
- SOP steps, conditions, branches, and escalation;
- semantic metrics and reporting views;
- recommendation and human-decision gates;
- allowed actions, risk, approval, reversibility, and failure handling;
- test/simulation data and expected outcomes;
- immutable publication versions, pause/resume, rollback, and change history.

That workstream is not authorized by this ACE-048 Phase 1 plan. Phase 1 only ensures Operations can reference such a definition cleanly when the builder is developed.

### Phase 6 — Compatibility cleanup

- Rename or retire obsolete Gmail-shaped shared modules only after all accepted Gmail surfaces reach parity through the generic facade.
- Preserve provider-specific Gmail modules under the Gmail integration boundary.
- Decide route aliases, migration notes, commits, push, and deployment as separate gates.

## Constraints and exclusions

- No big-bang rewrite.
- No deletion or recomputation of accepted Gmail data, artifacts, review units, memberships, counts, or projections.
- No sync, backfill, reindex, rebuild, publication, provider mutation, migration application, or deployment in Phases 0-1.
- No real Facebook Ads, crypto, tax, exchange, or accounting integration is authorized by this plan.
- No Automations guided-builder implementation is authorized by this plan.
- No mechanical global search-and-replace of Gmail terms.
- No generic label may hide a real provider operation or capability boundary.
- No commit or push is implied by product-plan acceptance.
- Existing dirty work and accepted recovery evidence must be preserved.

## Regression protections

- The active Gmail publication remains the numeric source of truth for its workspace.
- Cleanup/Review Group membership, tiering, exact child identity, and counts remain unchanged.
- Sender Distribution, Time Context, Pressure Trend, workflow totals, rows, and Decision Mode continue reading the same shared data within a selected Gmail workflow.
- Provider-specific actions cannot appear in a workspace unless its adapter declares and can execute them.
- Aggregate multi-source metrics cannot add incompatible measures together without an explicit normalized definition.
- Provider status and platform decision status remain separate so a sync state cannot masquerade as review or execution state.

## Verification strategy

Verification follows the implementation -> targeted verification -> diagnosis -> correction -> re-verification -> bounded discovery -> final verification loop for each phase.

For later runtime/UI phases, accepted Gmail proof surfaces include:

1. Decision Intelligence cold load and timeframe switch loop.
2. Review Groups chooser and simple/composite child entry.
3. Item/Sender Overview across All Indexed and narrowed windows.
4. Sender Distribution and Time Context linked parity.
5. Decision Mode open, decide/close, and exact return state.
6. Decision Management destination/execution truth.
7. Final rendered vocabulary audit plus request trace and console/overlay review.

Each UI slice requires post-settle Playwright screenshots, DOM/state capture, request trace, and a State Transition Matrix. The accepted Gmail behavior is the regression oracle; non-Gmail adapters prove portability without changing that truth.

## Approval decision

Oliver has separately Human-accepted Phase 1, Phase 2, and Phase 3 Slices 1-3. Oliver then approved and Codex completed the bounded read-only Phase 3 completion audit captured in `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE3_COMPLETION_DISCOVERY_HANDOFF.md`. The audit produced the exact target-locked Slice 4 brief named above, and Oliver replied `accept` directly to its explicit implementation gate on 2026-09-01. Phase 4-6 work and any real initial-system integration remain separately scoped and gated.

The prior naming-only plan is explicitly abandoned/superseded because it would improve visible wording without resolving the broader architectural coupling Oliver identified.

Checkpoint Status: continuity checkpoint created. The broader framework-first truth, Human-accepted Slices 1-3, completed discovery handoff, exact Slice 4 target lock, explicit implementation authorization, and verified pre-implementation backup are propagated. Slice 4 may execute in the fresh bounded task; Phase 4-6 work, real integrations, commit, push, and deployment remain separately gated.
