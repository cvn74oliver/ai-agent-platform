# CURRENT_STATE — AI Agent Platform

Last updated: 2026-09-03
Project Manager: Automata Control Plane active (current implementation environment: Codex; Claude turnover deferred)

---

## Automata Revival — Security and Rebaseline ACTIVE

### Current governing state

- `ACE-048` is the sole active revival/stabilization authority; `ACE-049` is queued/inactive.
- PR #3 is **MERGED TO MAIN / PRODUCTION-DEPLOYED / MERGE TREE VERIFIED** as of 2026-09-02. Oliver explicitly authorized a merge commit and accepted the automatic Vercel consequences. GitHub created merge commit `c766da06709e3df266dfc9146395459910fadca7` with ordered parents `49f863c055787ff0a0eb696a76d4609dd3d7568f` and `ccf2c27ef92511d7b611e8621d5840e00efad185`; its tree `c9f506cdadf3e004852c626b5627149020c27a5c` is byte-identical to the accepted PR head tree. The automatic deployments first surfaced seven `GET /api/runtime/gmail-memory` `500` errors through `08:46:48Z` on `ai-agent-platform`, each reporting `supabaseKey is required`; `ai-agent-platform-e6cc` had no matching error group. Oliver then explicitly authorized `ACCEPT VERCEL PRODUCTION KEY FIX`. PM adjudication locked `ai-agent-platform` as canonical because it owns `orinexlabs.com` / `www.orinexlabs.com`; the existing project-matched service-role key was added as a Secret scoped only to Production, and `main@bf9f401c5fa9fc76170e8303c47a298a351990b9` was redeployed as `dpl_Aa2BVRAZAwwCwLQtTYeCmf9UVSTt`. The deployment reached `READY` with canonical aliases and no alias error. Authenticated post-settle proof found no runtime overlay or key error; deployment-scoped logs recorded two `/api/runtime/gmail-memory` HTTP `200` responses and no route error in the verification window. Preview, `e6cc`, domains, source, provider/data, Supabase schema/data, artifacts, and indexes were untouched. Recovery Contract: `CHANGELOG.md` -> `September 2, 2026 — ACE-048 Vercel Production Service-Key Configuration Accepted`.
- The Vercel-fix control-plane packet is **MERGED / PRODUCTION-VERIFIED** through PR #4. Oliver explicitly authorized merge plus automatic consequences; GitHub created merge commit `003a06229c05ddd02af5eeb1c8c359b27f818c45` from base `bf9f401c5fa9fc76170e8303c47a298a351990b9` and accepted head `7e5438fcbbf1f1c0a9c9486821bc8e1d05672e69`. Canonical deployment `dpl_5qpg7KLUJU2MUpJsJ9KHEPp3J39j` and duplicate deployment `dpl_FfeyA9WdwijPEM5kdBHUtw4zuHWL` reached Production `READY`; both GitHub contexts passed and both reported `aliasError=null`. The exact authenticated canonical route settled with no overlay or console error, preserved `259,422` indexed rows, and recorded two `/api/runtime/gmail-memory` HTTP `200` responses with no 15-minute runtime-error finding.
- Post-merge publication interpretation is explicit: the accepted feature worktree is clean; the accepted branch has zero unique commits/content relative to `main`; `main` contains later closeout-only commits; and GitHub's historical PR `73 files / +17,261 / -1,839` display remains immutable review history. These facts are not interchangeable, and the historical PR counter is not evidence of unpublished local work.
- Project-scoped completed-task archival is now part of the PM operating procedure: only fully propagated, completed one-time Automata tasks with no unresolved decision, checkpoint, approval, blocker, or continuation are eligible; standing long-term role tasks and all active, blocked, or awaiting-decision tasks remain open; archival is reversible, discoverable/restorable, and owned only by this project's PM. No cross-project archival is authorized.
- Post-merge publication recovery is **HUMAN-ACCEPTED** as of 2026-08-31. The guarded compare-and-set transition promoted `full-mailbox-20260831062356983` from its proven candidate state over predecessor `full-mailbox-20260825031402535`; the publication is `published / fresh` and the predecessor remains the rollback version. Canonical port-`3000` proof directly confirms visible May/June Pressure Trend continuity, exact Cleanup Groups tiering, and simple/composite review-unit parity across `All Indexed`, `1Y`, `1M`, `1W`, Time Context, workflow rows, and Decision Mode return. Recovery Contract: `CHANGELOG.md` -> `August 31, 2026 — ACE-048 Published Continuity and Linked Analysis Truth Accepted`.
- The prior verifier packet in `docs/00_control_plane/runtime/ACE-048_POST_MERGE_PUBLICATION_RECOVERY_PM_BRIEF.md` remains bounded historical evidence. Its three discovery packets—indexed-source continuity, framework-first small-group presentation policy, and representative all-child narrowed-window projection/runtime diagnosis—are resolved by the accepted published correction. Git commit/push, deployment, Smart Sync, reindex, rebuild, rollback, and further publication remain separately gated.
- Diagnosis is complete. Pressure Trend is faithfully showing a raw index hole: May/June have zero indexed rows because fresh-head Smart Sync stopped at its fixed `45`-day cutoff in July without bridging to the prior April endpoint. Narrowed composite children fail because the runtime projection parent is not resolved from the exact manifest identity; authenticated RPC proof succeeds for both simple and composite units with `semantic-parent:subscription-senders:family:marketing_promotional` and fails with the presentation/legacy aliases. Cleanup-choice clutter is a presentation issue, not a reason to delete exact units.
- Oliver recorded `ACCEPT` on the source-correction review packet and authorized the bounded live bridge/candidate step, then directed Codex to resolve the remaining gaps after clarifying that the repaired candidate had not yet been published. The bridge processed `22,500` messages over `45` pages and increased indexed rows from `244,628` to `259,422`; artifact `full-mailbox-20260831062356983` processed `5,144` senders and `259,422` messages and is now the active publication. Authenticated canonical proof shows Pressure Trend May `1,894` / June `1,940`, composite Time Context May `67` messages from `22` senders / June `63` from `22`, continuous bars, exact tiered groups, populated narrowed workflows, and zero failed API requests or `409` churn. The final fresh local production build remained `Missing Proof Type: Blocked` by pre-existing environment behavior; the accepted runtime correction is captured under `transitional_self_verification`. The later explicitly authorized PR #3 merge and successful automatic Vercel production builds are recorded above; they did not authorize provider/data mutation or later Phase 4 implementation.
- A full pre-change `KEEP` backup completed with archive-readability and checksum evidence at `/Users/olivercarlin/Documents/Backups/August 2026/2026-08-31/ai-agent-platform (backup 31 August 2026 - Pre ACE-048 August artifact publication recovery - KEEP).tar.gz`; pruning was skipped.
- A verifier-checkpoint incremental backup completed at `/Users/olivercarlin/Documents/Backups/August 2026/2026-08-31/ai-agent-platform (incremental 31 August 2026 - ACE-048 post-merge publication recovery verifier checkpoint before Human Review)`; normal seven-day pruning ran only for refreshed Automata incrementals, and `KEEP` archives were preserved.
- A pre-publication milestone incremental completed at `/Users/olivercarlin/Documents/Backups/August 2026/2026-08-31/ai-agent-platform (incremental 31 August 2026 - Pre ACE-048 repaired candidate publication after Human Review confirmation)`; normal seven-day pruning remained project-scoped and every `KEEP` archive was preserved.
- A Human-acceptance milestone incremental completed at `/Users/olivercarlin/Documents/Backups/August 2026/2026-08-31/ai-agent-platform (incremental 31 August 2026 - ACE-048 published continuity, cleanup tiering, and linked chart Human acceptance)`; normal seven-day pruning remained project-scoped and every `KEEP` archive was preserved.
- Oliver accepted the narrow Decision Intelligence naming direction but immediately expanded the governing requirement before implementation: Automata's entire shared workflow must be provider-neutral and support Gmail, Facebook Ads, crypto, tax, and multiple connected sources through explicit adapters. The unexecuted naming-only brief is superseded. The authoritative phased plan is `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_REFACTOR_PM_BRIEF.md`; Phases 1 and 2 and Phase 3 Slice 1 are Human-accepted/closed.
- Oliver further locked the product model as a visual reporting and human-decision system for agent-operated SOP/workflow execution. The reusable loop is source data -> agent/SOP analysis -> evidence-backed recommendation -> human decision -> approved execution -> measured outcome. The framework plan now includes versioned SOP/workflow references, semantic metric definitions, evidence provenance/freshness/quality, recommendation rationale/confidence/impact, immutable decision and execution lifecycle, multi-source compatibility rules, and reusable reporting/attention semantics. These are contract requirements, not authorization for a broad implementation.
- Oliver clarified that the framework must remain open to arbitrary cross-agent company workflows, including purchasing, spreadsheet maintenance, shipping/inventory tracking, and feedback between those stages. Gmail is the reference application, not the product boundary. Domain variation should be expressed first through versioned workflows, adapter vocabulary, semantic metrics, declared capabilities, action catalogs, and bounded add-ons; preserve the working shared system and avoid company-specific forks or broad overhauls unless the framework genuinely cannot express the requirement. The quality test is whether humans make better decisions and whether approved SOPs, corrections, decisions, and measured outcomes strengthen the tenant-owned proprietary brain over time.
- Product-area ownership is now explicit: Settings/Connections owns provider authentication, scopes, connection health, and reusable capabilities; Automations becomes the guided design-time Workflow Studio for versioned SOP/workflow authoring and publication; Agents/Operations consumes published workflow versions as the runtime reporting/decision/action surface; Dashboard provides compatible cross-workflow status. Operations must reference the exact published workflow/version and must not become a second workflow builder. The future Automations builder remains a separately governed workstream.
- Oliver recorded `ACCEPT` for Phase 1 immediate same-flow execution. Active scope is limited to the generic decision-workspace contract, its bridge to the existing generic review-unit blueprint/Gmail adapter, and representative contract fixtures. No visible UI behavior, external provider connection, live data, database, artifact publication, Automations builder, marketplace, shared-learning pipeline, commit, push, or deployment is authorized.
- Initial modular validation roadmap: customer service (Zendesk/live chat/support email/refunds), investments (real-estate scouting and crypto), paid media (Facebook/Google/TikTok/email ad buying), and finance (bookkeeping/tax). These are validation domains, not hard-coded platform categories. Future marketplace, AI/MCP-guided workflow creation, agent monitoring/feedback, and the company-owned proprietary brain remain separately gated. The brain is a versioned application-layer knowledge and memory system—not an LLM or fine-tuned model—and preserves SOPs, policies, examples, corrections, decisions, outcomes, topic coverage, quality, and provenance. It is private by default; any shared learning requires explicit opt-in, de-identification/aggregation, privacy thresholds, provenance, evaluation, and rollback.
- Phase 1 is **HUMAN-ACCEPTED / CLOSED**. The canonical contract covers published workflow/runtime identity, arbitrary sources, subjects/activity, semantic metrics, entity links, evidence provenance, recommendations, immutable human decisions, capability/approval/idempotency rules, execution lifecycle/receipts, review-unit sizing, and private proprietary-brain governance. Gmail is an explicit compatibility adapter. Customer service, real estate, crypto, multi-source paid media, bookkeeping, and tax fixtures pass alongside the accepted Gmail review-unit/grouping/window fixtures, TypeScript, targeted lint, and diff check. Review packet: `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE1_REVIEW_PACKET.md`. Recovery Contract: `CHANGELOG.md` -> `August 31, 2026 — ACE-048 Framework-First Decision Workspace Phase 1 Accepted`.
- A Phase 1 verifier-checkpoint incremental backup completed at `/Users/olivercarlin/Documents/Backups/August 2026/2026-08-31/ai-agent-platform (incremental 31 August 2026 - ACE-048 framework-first decision workspace Phase 1 verifier checkpoint)` with normal seven-day project-scoped pruning and `KEEP` preservation.
- A Phase 1 Human-acceptance milestone incremental completed at `/Users/olivercarlin/Documents/Backups/August 2026/2026-08-31/ai-agent-platform (incremental 31 August 2026 - ACE-048 framework-first decision workspace Phase 1 Human acceptance)` with normal seven-day project-scoped pruning and `KEEP` preservation.
- Phase 2 discovery was **COMPLETED / TARGET-LOCKED**, and Oliver accepted the direction on 2026-08-31. The exact shared render path, framework/adapter/provider vocabulary boundary, seven-domain portability matrix, locked file set, regression protections, and execution slices are captured in `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE2_PM_BRIEF.md`. The accepted plan was initially logged for deferred execution pending a separate implementation decision.
- The pre-execution PM audit preserved that initial authority boundary: the general phrase `I accept everything`, made while discussing whether more information was needed, was not treated as the separately defined implementation authorization. Oliver later closed that gate with the explicit `ACCEPT PHASE 2 IMPLEMENTATION` decision recorded below.
- Phase 2 presentation metadata must remain compatible with multiple agent roles, workflows, providers, and sources while retaining source/workflow/role/provenance identity. This is a framework constraint only, not Phase 2 authority to implement multi-agent orchestration. Proprietary-brain improvement must remain versioned, inspectable, human-governed, provenance-backed, evaluated, and reversible; uncontrolled self-modification and silent cross-tenant learning are prohibited, and no training/shared-learning implementation is in Phase 2 scope.
- Oliver then issued the explicit decision `ACCEPT PHASE 2 IMPLEMENTATION` on 2026-08-31 through the fresh bounded execution delegation. Phase 2 implementation is **ACTIVE** only for the authoritative PM Brief's locked 14-file allowlist and five presentation slices, after a governed pre-implementation incremental backup. Routes, provider/data state, requests, polling, lifecycle behavior, accepted Gmail truth, later phases, commit, push, and deployment remain outside authority; any unlisted source-file requirement returns to PM.
- Oliver clarified the active presentation contract: provider-neutral semantics do not require generic visible titles. The framework owns semantic slots, meaning, accessibility, validation, and safe fallbacks; versioned adapter/workflow metadata may render approved domain titles such as `Inbox health`, `Portfolio health`, `Campaign health`, `Compliance health`, or `Service health`. Missing/unsafe labels fall back to `Decision health` or fail closed. Render-time labels must be deterministic and reversible; no page-load model call, request family, polling, latency, cost, nondeterminism, or silent copy drift is authorized.
- The required pre-implementation milestone incremental backup completed at `/Users/olivercarlin/Documents/Backups/August 2026/2026-08-31/ai-agent-platform-worktree-8642 (incremental 31 August 2026 - Pre ACE-048 framework-first Decision Workspace Phase 2 presentation implementati)`. Normal seven-day pruning was project/worktree-source scoped and all `KEEP` archives were preserved. The bounded source pass may now begin.
- Phase 2's five bounded presentation slices are **HUMAN-ACCEPTED / CLOSED** as of 2026-09-01. The shared deterministic metadata layer owns stable semantic slots and safe fallbacks; the Gmail adapter owns approved domain language and provider controls. Seven-domain plus shipping multi-role/multi-source fixtures, TypeScript, targeted lint, regression fixtures, diff hygiene, and authenticated post-settle Playwright proof pass. The six exact accepted paths retain Gmail counts, groups, windows, rows, Decision Mode return, Management truth, provider controls, and the same four API families with `19` API requests, zero failures, zero `409` churn, zero model calls, and zero console/page errors. Review packet: `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE2_REVIEW_PACKET.md`. Recovery Contract: `CHANGELOG.md` -> `September 1, 2026 — ACE-048 Framework-First Decision Workspace Phase 2 Accepted`.
- The Phase 2 Human-acceptance milestone incremental completed and was verified at `/Users/olivercarlin/Documents/Backups/September 2026/2026-09-01/ai-agent-platform-worktree-8642 (incremental 1 September 2026 - ACE-048 framework-first Decision Workspace Phase 2 Human acceptance)` with normal project-scoped seven-day pruning and `KEEP` preservation.
- Oliver's first Phase 2 Human Review attempt was blocked by a missing-worktree-environment overlay. The exact worktree server was recovered using the established environment in-process and loopback-only binding; fresh authenticated browser proof showed accepted Gmail truth and zero runtime overlay/console errors. Oliver then returned `ACCEPT`. No key was copied, printed, committed, or network-exposed.
- Phase 3 Slice 1 is **HUMAN-ACCEPTED / CLOSED** as of 2026-09-01. The exact eight-file Review Groups read-facade implementation makes the page consume a generic validated read model while the Gmail adapter owns the existing runtime/cache/semantic/draft projection. Eight-domain fixtures, all required Gmail regressions, TypeScript, targeted lint, diff hygiene, and full post-settle Playwright proof pass at verifier `ACCEPT / HIGH`. The exact Gmail surface retains `7` main groups, `3` optional/reference groups, `5,144` senders, the `915 / 75,844` recommendation, `67` review-unit links, exact child/return identity, Gmail provider controls, existing request families, and zero browser errors or `409` churn. Review packet: `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE3_SLICE1_REVIEW_PACKET.md`. Recovery Contract: `CHANGELOG.md` -> `September 1, 2026 — ACE-048 Framework-First Decision Workspace Phase 3 Slice 1 Accepted`. No later Phase 3 slice is authorized.
- The Phase 3 Slice 1 Human-acceptance milestone incremental completed and was verified at `/Users/olivercarlin/Documents/Backups/September 2026/2026-09-01/ai-agent-platform-worktree-8642 (incremental 1 September 2026 - ACE-048 framework-first Decision Workspace Phase 3 Slice 1 Human acceptance)` with `1,114` files, normal project-scoped seven-day pruning, and `KEEP` preservation.
- Phase 3 Slice 2 Decision Intelligence is **HUMAN-ACCEPTED / CLOSED** as of 2026-09-01. The exact six-file implementation makes Intelligence consume the generic validated Decision Workspace adapter service while Gmail retains its existing runtime/cache/request/draft projection. Eight-domain fixtures, required regressions, TypeScript, targeted lint, allowlist/diff checks, and exact-route authenticated post-settle browser proof pass at verifier `ACCEPT / HIGH`; Oliver then reviewed the page, reported no visible regression, and approved continuation. Review packet: `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE3_SLICE2_REVIEW_PACKET.md`. Recovery Contract: `CHANGELOG.md` -> `September 1, 2026 — ACE-048 Framework-First Decision Workspace Phase 3 Slice 2 Accepted`. No later Phase 3 slice is authorized.
- The required Phase 3 Slice 2 pre-implementation worktree incremental completed and was verified at `/Users/olivercarlin/Documents/Backups/September 2026/2026-09-01/ai-agent-platform-worktree-8642 (incremental 1 September 2026 - Pre ACE-048 framework-first Decision Workspace Phase 3 Slice 2 Decision Intellig)` with `1,116` files, normal project-scoped seven-day pruning, and preservation of all `23` discovered `KEEP` archives.
- The Phase 3 Slice 2 Human-acceptance milestone incremental completed and was verified at `/Users/olivercarlin/Documents/Backups/September 2026/2026-09-01/ai-agent-platform-worktree-8642 (incremental 1 September 2026 - ACE-048 framework-first Decision Workspace Phase 3 Slice 2 Human acceptance)` with `1,136` files, exact worktree source, normal project-scoped seven-day pruning, and `KEEP` exemption.
- Phase 3 Slice 3 Sender Overview is **HUMAN-ACCEPTED / CLOSED** as of 2026-09-01. The exact six-file Item Overview read-facade implementation stayed inside the allowlist: the framework owns portable subject/activity/evidence/metric/provenance validation and the generic read service; the Gmail adapter retains accepted cache/request/provider translation; the shared page retains lifecycle ownership and visible Gmail behavior. Eight-domain/static fixtures, required Gmail regressions, TypeScript, targeted lint, diff/allowlist checks, and authenticated post-settle Playwright proof pass at `ACCEPT / HIGH`. Offer campaign preserves the `267` All indexed and `108 / 84 / 2 / 100` tested windowed sender universes; the composite promotional-cycle path preserves `43` senders, Analysis Rail tabs, pagination, evidence, Decision Mode, full preview, and exact close/return; the editorial URL preserves its accepted Review Groups redirect. Browser errors, runtime overlays, provider mutations, new request families, polling, and `409` churn are zero. Oliver returned Human Review `ACCEPT`. Review packet: `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE3_SLICE3_REVIEW_PACKET.md`. Recovery Contract: `CHANGELOG.md` -> `September 1, 2026 — ACE-048 Framework-First Decision Workspace Phase 3 Slice 3 Accepted`. The Human-acceptance milestone snapshot contains `1,574` files at `/Users/olivercarlin/Documents/Backups/September 2026/2026-09-01/ai-agent-platform-worktree-8642 (incremental 1 September 2026 - ACE-048 framework-first Decision Workspace Phase 3 Slice 3 Human acceptance)` with normal seven-day project-scoped pruning and all `23` `KEEP` archives preserved. No later slice, commit, push, or deployment is authorized.
- Phase 3 completion discovery is **COMPLETED / TARGET-LOCKED** as of 2026-09-01. Repository-first tracing proved that Decision Mode's main workspace/evidence reads are already generic and isolated the remaining shared read leak to the direct `fetchGmailDecisionManagementSummary` calls in Decision Mode and Decision Management. The exact six-file Slice 4 managed decision-state read-facade contract is captured in `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE3_SLICE4_DECISION_MANAGEMENT_READ_FACADE_PM_BRIEF.md`; the completed discovery record remains `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE3_COMPLETION_DISCOVERY_HANDOFF.md`. Gmail destination commit, Management push/restore/reopen, approvals, execution receipts, retries, and lifecycle mutation remain provider-operational Phase 4 concerns and are excluded. No source/UI/runtime implementation, provider/data mutation, commit, push, or deployment is authorized until Oliver returns the separate exact implementation decision.
- Oliver replied `accept` directly to the explicit Phase 3 Slice 4 implementation gate on 2026-09-01. The exact six-file managed decision-state read-facade implementation and verification loop are authorized. The verified pre-implementation snapshot is `/Users/olivercarlin/Documents/Backups/September 2026/2026-09-01/ai-agent-platform-worktree-8642 (incremental 1 September 2026 - Pre ACE-048 framework-first Decision Workspace Phase 3 Slice 4 managed decision-)` with `1,579` files, detached HEAD `8f8e4d670cabdd21459c0b4b8e502d16e272afc0`, `53` changed paths at backup time, normal seven-day project-scoped pruning, and all `23` `KEEP` archives preserved. Phase 4 actions, provider/data mutation, commit, push, and deployment remain unauthorized.
- Phase 3 Slice 4 is **HUMAN-ACCEPTED / RECOVERY-BACKED / CLOSED** as of 2026-09-02. The exact six-file source allowlist exposes managed decision-state through the selected Decision Workspace adapter while the Gmail adapter preserves the existing management-summary helper, `15s` cache, per-key single-flight behavior, request family, provider controls, and lifecycle ownership. Eight-domain fail-closed fixtures, required regressions, TypeScript, targeted lint, diff/allowlist checks, and the default production build pass. The original verifier matrix and operator-requested delegated Playwright refresh both pass at `ACCEPT / HIGH` / `PASS / HIGH`, preserving Management `17 / 3 / 2 / 10 / 0 / 2`, offer-campaign `108 / 1 / 107 / 1,030`, composite promotional-cycle `43 / 0 / 43 / 132`, Decision Mode evidence and exact close/return, zero provider writes, zero settled browser errors, and zero `409` churn. Oliver returned explicit `Accept` after the delegated report; this acceptance is not inferred from the earlier general approval he had clarified was not review. Recovery Contract: `CHANGELOG.md` -> `September 2, 2026 — ACE-048 Framework-First Decision Workspace Phase 3 Slice 4 Accepted`. Explicit Human-acceptance snapshot: `/Users/olivercarlin/Documents/Backups/September 2026/2026-09-02/ai-agent-platform-worktree-8642 (incremental 2 September 2026 - ACE-048 Phase 3 Slice 4 explicit Human Review acceptance after delegated Playwri)` with `2,163` files, detached HEAD `8f8e4d670cabdd21459c0b4b8e502d16e272afc0`, `54` changed paths, normal seven-day pruning, and `KEEP` preservation. Phase 3 is closed across Slices 1-4.
- Oliver returned `ACCEPT PHASE 4 DISCOVERY` on 2026-09-02. Phase 4 capability/action discovery is **COMPLETED / TARGET-LOCKED** under `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE4_DISCOVERY_HANDOFF.md`. The exact live leaks are hard-coded Decision Mode action presentation and hard-coded Management action eligibility; current Gmail handlers, requests, provider operations, approvals, cache/reload behavior, and lifecycle owners remain frozen. The execution-ready eight-file first slice is `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE4_SLICE1_ACTION_PRESENTATION_PM_BRIEF.md`: deterministic adapter-selected action presentation and fail-closed state-derived availability with zero new requests, polling, cache, model call, provider action, or lifecycle owner. Implementation awaits the separate decision `ACCEPT PHASE 4 SLICE 1 IMPLEMENTATION`.
- Git publication safety was separately audited in `docs/00_control_plane/runtime/ACE-048_GIT_PUBLICATION_SAFETY_AUDIT.md`. The current Phase 1-4 worktree is detached and contains `23` modified tracked files plus `32` untracked entries, while the named recovery branch is checked out in another independently dirty worktree over the same `HEAD`. Local `main` and `origin/main` match and are two commits behind the current `HEAD`. No broad commit or push is safe until an exact staged-path/provenance packet is produced; no Git mutation occurred in the audit.
- Oliver accepted the recommended sequence and established a standing accepted-milestone publication policy on 2026-09-02: once a stable fix/slice/phase/milestone is Human-accepted, the verified backup must be followed by an exact-scope commit and normal non-force GitHub push. Accepted work may not remain stranded in a dirty worktree, detached checkout, or local-only branch. Root `AGENTS.md`, canonical PM context, and this control-plane state now carry that policy. Mixed provenance, secrets/auth state, generated output, failed verification, or remote divergence must block and remain `Git publication pending`; they do not permit broad staging or force operations.
- The same decision authorizes Git publication preparation and Phase 4 Slice 1 implementation in the recommended order. First publish the already accepted Phase 1-3 framework baseline plus authoritative Phase 4 discovery/target-lock documents through the exact-path safety packet; then execute only the eight-file Phase 4 Slice 1 brief after the governed backup. Provider/data mutation, approval/execution-facade integration, deployment, and later Phase 4 work remain unauthorized.
- The combined prerequisite recovery point is verified: `2,175`-file incremental plus readable full archive at `/Users/olivercarlin/Documents/Backups/September 2026/2026-09-02/ai-agent-platform-worktree-8642 (backup 2 September 2026 - Pre ACE-048 accepted baseline GitHub publication and Phase 4 Slice 1 implementat - for Cloud).tar.gz`, SHA-256 `2e755f53c3386c35e166868767fb5ffc0aa06f21ef95351f856c697a9ed9c8ab`, normal seven-day pruning, and `KEEP` preservation. The exact `61`-path publication packet is staged on `agent/ace-048-accepted-framework-baseline`; all accepted contract/Gmail fixtures, TypeScript, targeted lint, cached diff check, and the environment-corrected `63`-route production build pass. No provider/data mutation occurred.
- The accepted baseline is now published to canonical GitHub on `agent/ace-048-accepted-framework-baseline`: accepted-content commit `eef994f8a0a668164d68089ecffd4c5efe70b37f` plus publication-proof commit `1a04314c284a027cce6ebfde155cf6c35863855a`. Local `HEAD`, remote-tracking, live remote branch, and draft PR #3 head all match `1a04314` with `0 / 0` divergence. PR: `https://github.com/cvn74oliver/automata/pull/3`, base `main`. This normal non-force branch publication satisfies the accepted-baseline preservation checkpoint without moving `main`, merging, deploying, or deleting lineage.
- Phase 4 Slice 1 capability-driven action presentation is **HUMAN-ACCEPTED / RECOVERY-BACKED / GITHUB-PRESERVED / CLOSED** as of 2026-09-02. The exact eight-source-file allowlist adds a pure action/availability model, deterministic selected Gmail adapter, serializable client adapter-ID seam, and eight-domain/static fixtures; Review and Management now render adapter-owned labels and eligibility while all four existing commit/push/restore/reopen handler bodies remain byte-identical to the published baseline. Required framework/Gmail regressions, TypeScript, targeted lint (`0` errors), diff/allowlist/static guards, exact post-settle Playwright routes, both Decision Mode close/return paths, the full Management filter loop, 16-second idle hold, and direct final UI inspection pass at `ACCEPT / HIGH`. Preserved truth includes simple `108 / 1 / 107 / 1,030`, composite `43 / 0 / 43 / 132`, Management `17 / 3 / 2 / 10 / 0 / 2`, four Decision controls in accepted order, `3 / 0 / 15` Management controls, zero action POSTs, zero failed final-run requests, zero `409` churn, zero settled polling, and zero console/page errors. Oliver accepted the recommended verifier-backed result on 2026-09-02. Review packet: `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE4_SLICE1_REVIEW_PACKET.md`. Recovery Contract: `CHANGELOG.md` -> `September 2, 2026 — ACE-048 Framework-First Decision Workspace Phase 4 Slice 1 Accepted`. Verified Human-acceptance snapshot: `/Users/olivercarlin/Documents/Backups/September 2026/2026-09-02/ai-agent-platform-worktree-8642 (incremental 2 September 2026 - ACE-048 Phase 4 Slice 1 Human acceptance)` with `2,409` files, branch `agent/ace-048-accepted-framework-baseline`, HEAD `1a04314c284a027cce6ebfde155cf6c35863855a`, `15` changed paths, normal seven-day project-scoped pruning, and `KEEP` preservation. Accepted-content commit `9e27a122118215c11a49ce7f8b6a567adcae1ee8` was pushed normally without force; local, remote-tracking, live remote, and draft PR #3 head matched it before the final docs-only proof commit. Merge, deploy, provider/data mutation, later Phase 4 work, force operations, and lineage deletion remain unauthorized.
- Oliver approved the recommended next step on 2026-09-02: begin a fresh bounded Project Manager discovery/target-lock pass for the next Phase 4 capability/action slice. Authority is read-only discovery, recommendation, and an operator-readable execution-ready brief or precise blocker. It does not authorize source/runtime implementation, provider action, approval/execution-facade integration, data/database/artifact/index/publication mutation, route changes, new requests/polling/lifecycle behavior, commit, push, merge, deployment, or lineage deletion.
- Phase 4 Slice 2 is **HUMAN-ACCEPTED / RECOVERY-BACKED / GITHUB-PRESERVED / CLOSED**. Repository tracing selected the existing Operations Approval Queue as the next smallest safe presentation/read slice. The authoritative exact four-file brief is `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE4_SLICE2_APPROVAL_QUEUE_TRUTH_PM_BRIEF.md`; the verifier packet is `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE4_SLICE2_REVIEW_PACKET.md`; Recovery Contract: `CHANGELOG.md` -> `September 2, 2026 — ACE-048 Framework-First Decision Workspace Phase 4 Slice 2 Accepted`.
- Oliver returned `ACCEPT PHASE 4 SLICE 2 IMPLEMENTATION` and later explicit Human Review `accept` on 2026-09-02. The governed recovery checkpoint completed, and only the four locked source files changed. The page now renders every ordered proposed action with source/workflow/role/provenance, risk, reversibility, scope, evidence, and safety truth; unsafe or ambiguous bundles fail closed. Eight-domain and Gmail regressions, TypeScript, exact-file lint, diff/allowlist checks, byte-identical handler proof, frozen seam hashes, and authenticated canonical post-settle Playwright proof pass at verifier `ACCEPT / HIGH`. Gmail remains `3 / 0 / 8 / 46` with the same valid controls, zero action POSTs, zero failed final-run requests, zero `409` churn, and zero console errors. One production build attempt is `Missing Proof Type: Blocked` by the established local Turbopack stall under `transitional_self_verification`. The verified Human-acceptance snapshot contains `2,434` files at `/Users/olivercarlin/Documents/Backups/September 2026/2026-09-02/ai-agent-platform-worktree-8642 (incremental 2 September 2026 - ACE-048 Phase 4 Slice 2 Human acceptance)` with normal project-scoped pruning and `KEEP` preservation. Accepted-content commit `00f8c6e87ce49cc6884c1fea5520145bce785a13` was pushed normally without force; local, remote-tracking, live remote, and draft PR #3 head matched it with `0 / 0` divergence before final docs-only propagation. No fifth source file, endpoint/runtime hardening, provider/data mutation, route/request/cache/poll/lifecycle change, merge, deployment, force operation, or lineage deletion occurred. No later Phase 4 implementation is authorized.
- Oliver issued `ACCEPT PHASE 4 ENDPOINT-INTEGRITY DISCOVERY`, the exact implementation decision `ACCEPT PHASE 4 SLICE 3 ENDPOINT ACCESS IMPLEMENTATION`, and explicit Human Review `ACCEPT` on 2026-09-02. The bounded read-only discovery and exact 13-file correction are now **HUMAN ACCEPTED / RECOVERY BACKED / GITHUB PRESERVED / CLOSED** under `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE4_SLICE3_ENDPOINT_ACCESS_AND_DECISION_BINDING_PM_BRIEF.md`. Every locked endpoint now authenticates with the request-scoped SSR client, POST mutations gate same-origin before body parsing, agent ownership and tenant are proven before admin access, request/decision/execution history is same-agent and exact-request bound, latest-decision truth controls execution, replay is idempotent/fail-closed, and actor/tenant/request provenance is retained. The accepted Gmail Operations queue remains `3 / 0 / 8 / 46`; the legacy queue is visibly owner-scoped; anonymous probes return `401`; foreign and nonexistent UUIDs return the same `404`; and the live event count remained `910 -> 910`. Static fixtures, all required Decision Workspace/Gmail regressions, TypeScript, exact lint, diff/allowlist/frozen-hash checks, and authenticated post-settle Playwright proof pass at `ACCEPT / HIGH`. Review packet: `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE4_SLICE3_REVIEW_PACKET.md`. Recovery Contract: `CHANGELOG.md` -> `September 2, 2026 — ACE-048 Framework-First Decision Workspace Phase 4 Slice 3 Accepted`. The verified Human-acceptance incremental contains `2,466` files at `/Users/olivercarlin/Documents/Backups/September 2026/2026-09-02/ai-agent-platform-worktree-8642 (incremental 2 September 2026 - ACE-048 Phase 4 Slice 3 Human acceptance)` with exact worktree identity, `21` changed paths, normal seven-day project-scoped pruning, and `KEEP` preservation. Accepted-content commit `22243c25bdd16098c2bd5eb97719f0a0ac95874e` was pushed normally without force to `codex/ace-048-phase4-endpoint-integrity-discovery`. Atomic execution claim/receipt ledger, provider/data/schema mutation, new request/poll/cache/lifecycle behavior, merge, and deployment remain separately gated and unapproved.
- Oliver approved the bounded Phase 4 Slice 4A target-generation step, issued `ACCEPT PHASE 4 SLICE 4A STAGE A IMPLEMENTATION`, and then returned the exact Human Review decision `ACCEPT PHASE 4 SLICE 4A STAGE A` on 2026-09-03. The exact nine-file provider-neutral local-claim/per-action-receipt foundation is implemented, verifier-accepted at `HIGH`, Human-accepted, recovery-backed, GitHub-preserved, and closed under `transitional_self_verification`; the generated migration remains unapplied. Eight-domain/static fixtures, ten required lifecycle rows, all established Decision Workspace/Gmail regressions, TypeScript, exact lint, diff/allowlist/frozen hashes, and authenticated post-settle Approval Queue proof pass. Gmail remains `3 / 0 / 8 / 46`, with zero action POSTs, zero failed final requests, zero `409` churn, and a clean console. Exact inherited archive load truth is preserved: 100-ID chunks, up to four concurrent chunks, and the existing one-time 401 refresh retry; the ledger adds no new provider fanout. Review packet: `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE4_SLICE4A_STAGEA_REVIEW_PACKET.md`. Recovery Contract: `CHANGELOG.md` -> `September 3, 2026 — ACE-048 Framework-First Decision Workspace Phase 4 Slice 4A Stage A Accepted`. The verified `2,584`-file Human-acceptance snapshot is `/Users/olivercarlin/Documents/Backups/September 2026/2026-09-03/ai-agent-platform-worktree-8642 (incremental 3 September 2026 - ACE-048 Phase 4 Slice 4A Stage A Human acceptance)` with normal seven-day project-scoped pruning and `KEEP` preservation. Accepted-content commit `a4fdbc0` was pushed normally without force. Stage B migration application, live ledger/provider/data/schema mutation, automatic retry/reconciliation, merge, and deployment remain separate explicit gates.
- Stage B readiness authority — 2026-09-03: Oliver approved proceeding with the recommended fresh, bounded, read-only Stage B readiness review. The review may inspect the exact authored migration, current Supabase schema/migration history, grants/RLS/function definitions/advisors, and existing repository contracts; it must define an operator-readable additive-schema application plan, verification contract, and separately reviewed recovery procedure. It may return an execution-ready decision packet or a precise blocker. It may not apply/revert a migration, invoke ledger RPCs or providers, mutate data/schema/artifacts/indexes/publication, alter source/UI behavior, commit implementation, merge, or deploy.
- Stage B readiness result — 2026-09-03: `BLOCKED / RETURN_TO_PM`. The accepted migration file and SHA-256 are intact, Supabase project `cjpjekhlvzwjwtszqpmy` is `ACTIVE_HEALTHY`, proposed objects are absent, required dependencies/types exist, and the SQL remains structurally bounded to two RLS tables, three indexes, and four `SECURITY INVOKER` functions with explicit `search_path`, timeout, revokes, and `service_role` grants. However, `supabase migration list --linked` proves local/remote history drift, and `supabase db push --dry-run --linked` refuses with `Remote migration versions not found in local migrations directory`. Remote-only `20260406101500` and `20260407113000` are missing locally; four later applied migrations have same-name local equivalents under different timestamps (`20260821130242`/`20260823022435`, `20260824132718`/`20260825030532`, `20260825030822`/`20260825030928`, `20260828011458`/`20260828012004`). Stage B application is not execution-ready: `--include-all`, direct MCP application, or blind history reclassification could reapply DDL or worsen/falsify identity. Exact one-migration dry-run proof is blocked until a dedicated migration-history identity reconciliation is discovered, target-locked, separately approved, executed, and reverified. No migration, SQL mutation, ledger/provider call, repository edit, merge, or deployment occurred in the review.
- Migration-history reconciliation discovery authority — 2026-09-03: Oliver issued exact `ACCEPT MIGRATION-HISTORY RECONCILIATION DISCOVERY`. A fresh bounded read-only PM discovery/target-lock may recover authoritative definitions for remote-only `20260406101500` and `20260407113000`, compare SQL and live schema effects for the four local/remote timestamp aliases, determine whether each pair is byte-, semantic-, or effect-equivalent, and recommend one canonical non-reexecution mapping plus an exact later write/verification packet. It may inspect repository, Git history, Supabase migration history, catalog/schema state, and other read-only evidence. It may not create/rename/delete migration files, repair history, mark migrations applied/reverted, execute DDL/RPCs/provider actions, mutate data/schema/artifacts/indexes/publication, commit implementation, merge, or deploy. Stage B remains blocked.
- Migration-history reconciliation target lock and implementation authority — 2026-09-03: read-only discovery proved live Supabase project `cjpjekhlvzwjwtszqpmy` is correct and the blocker is local migration-file identity only. Authoritative ledger statements recover missing local versions `20260406101500` and `20260407113000`; four alias mappings are locked as `20260821130242` -> `20260823022435`, `20260824132718` -> `20260825030532`, `20260825030822` -> `20260825030928`, and `20260828011458` -> `20260828012004`. The second pair must restore exact historical Git blob `b53674...` because its current local file prematurely contains the four RLS optimizations owned by the following migration. Oliver issued exact `ACCEPT MIGRATION-HISTORY RECONCILIATION IMPLEMENTATION`, authorizing the governed backup and this local-only ten-path reconciliation plus linked list/dry-run verification. Remote history repair, applied/reverted marking, `--include-all`, `db pull`, non-dry-run push, DDL/RPC/provider/data/schema/artifact/index/publication mutation, Stage B application, merge, and deployment remain blocked.
- Migration-history reconciliation implementation/verifier result — 2026-09-03: the pre-implementation incremental completed with exact worktree identity, normal seven-day project-scoped pruning, and `KEEP` preservation. The two recovered April files match locked SHA-256 values `1d5c086...` and `1b953fd...`; all four aliases now use the remote timestamps; restored projection history matches `5d8506b...`; and the unapplied Stage 4A migration remains `6bba05d...`. `git diff --check` passed. `supabase migration list --linked` aligns all six recovered/retimestamped versions, and `supabase db push --dry-run --linked` completed successfully listing exactly `20260902141603_add_decision_workspace_execution_ledger.sql`. Zero migration application, history repair, DDL/RPC, provider/data/schema/artifact/index/publication mutation, merge, or deployment occurred. Result: verifier `ACCEPT`; status `Awaiting Decision` for Human Review. Stage B application remains separately gated.
- Migration-history reconciliation Human acceptance and GitHub preservation — 2026-09-03: Oliver returned explicit `ACCEPT`, accepting the verifier-proven local-only history correction. Recovery Contract: `CHANGELOG.md` -> `September 3, 2026 — ACE-048 Migration-History Reconciliation Accepted`. The Human-acceptance snapshot contains `2,586` files and `14` changed paths at baseline `420ab319a183525b39e4a8414450ad1351b27a3b`, with normal seven-day project-scoped pruning and `KEEP` preservation. Accepted content commit `0e859f3` was pushed normally without force to `codex/ace-048-phase4-endpoint-integrity-discovery`; the reconciliation is closed. Stage B migration application remains separately gated and unapplied.
- Phase 4 Slice 4A Stage B migration-application authority — 2026-09-03: Oliver issued exact `ACCEPT PHASE 4 SLICE 4A STAGE B MIGRATION APPLICATION`. The separately reviewed execution/recovery contract is `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE4_SLICE4A_STAGEB_MIGRATION_APPLICATION_EXECUTION_PACKET.md`. Authority is limited to a verified pre-application incremental, exact clean identity/hash/history/object/dry-run gates, one linked CLI application of only `20260902141603_add_decision_workspace_execution_ledger.sql`, and read-only post-application catalog/history/grant/RLS/function/zero-row/advisor proof. Ambiguous application state must be adjudicated before retry; immediate recovery is logical quarantine, and destructive removal remains separately gated. Live ledger RPC proof, provider/data action, source/UI/request/polling change, commit, push, merge, and deployment remain unauthorized.
- Phase 4 Slice 4A Stage B application/verifier result — 2026-09-03: the verified `2,587`-file pre-application incremental captured exact linked-worktree/branch/HEAD identity, `5` authorization/control-plane paths, normal seven-day project-scoped pruning, and `KEEP` preservation. All preflight gates passed against healthy project `cjpjekhlvzwjwtszqpmy`: accepted hash `6bba05d...`, target objects absent, historical identities aligned, and the linked dry run listed only `20260902141603`. One `supabase db push --linked --yes` invocation applied the target successfully. Post-application list shows the target both local and remote; a bounded debug dry-run follow-up reports the remote database is up to date. Catalog proof shows two empty RLS tables, three indexes, four `SECURITY INVOKER` functions with fixed search path/timeout, no anon/authenticated privileges, and intended service-role grants. Advisors produced only five expected target-specific `INFO` notices for no public policies and unused empty-table indexes, with zero target warning/error. No ledger RPC/provider/data/source/UI/request/polling/artifact/index-publication action, commit, push, merge, or deployment occurred. Review packet: `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE4_SLICE4A_STAGEB_REVIEW_PACKET.md`. Verifier: `ACCEPT / HIGH`; status: `Awaiting Decision` for Human Review.
- Phase 4 Slice 4A Stage B Human acceptance and GitHub preservation — 2026-09-03: Oliver returned explicit `accept`, accepting the verifier-proven additive migration application. Recovery Contract: `CHANGELOG.md` -> `September 3, 2026 — ACE-048 Framework-First Decision Workspace Phase 4 Slice 4A Stage B Migration Application Accepted`. Acceptance recheck confirms one migration record, four functions, and zero rows in both ledger tables. The verified Human-acceptance snapshot contains `2,588` files and `7` accepted changed paths at baseline `4ab5253504a885986c66890eb5f4f163106ed4f4`, with normal seven-day project-scoped pruning and `KEEP` preservation. Accepted content commit `000fdcb` was pushed normally without force to `codex/ace-048-phase4-endpoint-integrity-discovery`; Stage B is closed. The schema remains dormant and logically quarantinable; live ledger/RPC proof, provider execution, source integration, retry/reconciliation, merge, and deployment remain separate gates.
- Phase 4 live-ledger/RPC discovery authority — 2026-09-03: Oliver explicitly requested `Create the fresh live-ledger/RPC discovery task now` and then issued `ACCEPT DISCOVERY AUTHORITY PROPAGATION`. A fresh bounded Project Manager pass may inspect the four installed ledger RPC contracts, their accepted source definitions, existing application integration seams, identity/provenance requirements, and safe synthetic-proof options using repository and read-only Supabase evidence. It must separate schema/RPC contract proof, non-provider synthetic ledger exercise, provider execution, and application-source integration, and return an operator-readable recommendation plus an exact target-locked PM Brief or precise blocker. It may not invoke an RPC, write ledger/provider/customer data, change source/UI/routes/requests/polling/cache/lifecycle behavior, apply or alter migrations, merge, or deploy. The existing ledger remains dormant and empty while discovery is active.
- Phase 4 Slice 4A Stage C1 verifier result — 2026-09-03: the governed `2,589`-file pre-execution backup was verified with clean exact branch/HEAD identity, normal project-scoped seven-day pruning, and `KEEP` preservation. Live project `cjpjekhlvzwjwtszqpmy`, the migration, four function definitions/security/grants, service-role permissions, zero-row baseline, absence of fixed synthetic identities, and trigger/publication isolation all passed preflight. One explicit rollback-only transaction invoked exactly `15` RPC calls and returned `ACE048_STAGEC1_ASSERTION_SUCCESS`; success, identical replay without second authority, partial aggregation, stale-to-indeterminate/manual-required resolution, cross-tenant rejection, exact receipts/transitions/provenance, and compatibility-event binding all passed. Independent postflight proved `0` runs, `0` actions, and zero surviving synthetic agent/events/keys. The eight-domain fixture passed before and after, frozen source hashes remained unchanged, and no provider/HTTP/customer/persistent/source/migration/merge/deployment action occurred. Review packet: `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE4_SLICE4A_STAGEC1_ROLLBACK_ONLY_RPC_PROOF_REVIEW_PACKET.md`. Verifier: `ACCEPT / HIGH`; status: `Awaiting Decision` for Human Review.
- Phase 4 Slice 4A Stage C1 Human acceptance and GitHub preservation — 2026-09-03: Oliver returned exact `ACCEPT PHASE 4 SLICE 4A STAGE C1`. Recovery Contract: `CHANGELOG.md` -> `September 3, 2026 — ACE-048 Phase 4 Slice 4A Stage C1 Rollback-Only RPC Proof Accepted`. The verified Human-acceptance snapshot contains `2,590` files and `5` accepted changed paths at baseline `0c665f795381596db8e6bd60dd2347c9cbd1f34e`, with normal seven-day project-scoped pruning and `KEEP` preservation. Accepted content commit `edc4be2` was pushed normally without force to `codex/ace-048-phase4-endpoint-integrity-discovery`; Stage C1 is closed. The accepted database state remains `0` ledger rows and zero synthetic identities; source activation, application HTTP proof, provider/customer-data action, persistent test data, merge, and deployment remain separate gates.
- Phase 4 Slice 4A Stage C2 application-wrapper/HTTP discovery authority — 2026-09-03: Oliver approved the recommended fresh read-only discovery after Stage C1 closeout. The Project Manager may inspect the accepted application wrapper, execute-route binding, authentication/origin/ownership/approval/idempotency gates, sandbox action path, existing fixtures, and feasible rollback or zero-persistence verification seams. The required output is an operator-readable recommendation plus an exact target-locked PM Brief for the smallest application-level proof or a precise blocker. Discovery may use repository and read-only runtime/Supabase evidence but may not invoke the execution HTTP route, call ledger RPCs, create persistent data, perform Gmail/provider/customer actions, edit source, change requests/polling/cache/lifecycle behavior, merge, or deploy.
- Phase 4 Slice 4A Stage C2 discovery result and implementation authority — 2026-09-03: read-only discovery proved that a successful one-action sandbox HTTP path spans authentication, six access/approval/history reads, claim, two receipt transitions, and finalization as separate Supabase requests; a live request therefore cannot be wrapped in the single rollback-only transaction used by Stage C1 and would persist a run, action, and compatibility event. The target-locked safe proof is a localhost-only invocation of the real route handler and ledger wrappers against an in-memory Supabase substitute, with zero external/provider calls and zero persistent rows. The eight-domain ledger fixture passes; the older endpoint-integrity fixture has one stale frozen Gmail hash caused by the accepted Stage A receipt-propagation change, not a product defect. Oliver issued exact `ACCEPT PHASE 4 SLICE 4A STAGE C2 APPLICATION-WRAPPER/HTTP PROOF IMPLEMENTATION`. Authoritative brief: `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE4_SLICE4A_STAGEC2_APPLICATION_WRAPPER_HTTP_PROOF_PM_BRIEF.md`. Implementation is limited to one exact stale-hash reconciliation plus three new Stage C2 fixture files; all product source remains byte-identical. Live POST/RPC invocation, persistent data, provider/customer action, migration, product behavior change, true concurrency, merge, and deployment remain separate gates.
- Phase 4 Slice 4A Stage C2 Human acceptance, recovery, and GitHub preservation — 2026-09-03: the exact four-file test-only candidate executes the real handler and wrappers through eight localhost requests against an in-memory Supabase substitute. Authentication/origin before malformed-body parsing, agent/tenant ownership, rejected approval, one successful claim/receipt/finalization sequence, compatibility replay, durable replay, and conflicting fingerprint all pass. The successful path has the exact `11` upstream operations; external/provider/model/customer requests, live execute-route/RPC invocations, persistent writes, polling, timers, retries, and product changes are zero. Eight-domain and endpoint regressions, TypeScript, exact lint, diff/allowlist, and all six locked product hashes pass. Independent verifier: `ACCEPT / HIGH`; Oliver returned exact `ACCEPT PHASE 4 SLICE 4A STAGE C2`. Review packet: `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE4_SLICE4A_STAGEC2_APPLICATION_WRAPPER_HTTP_PROOF_REVIEW_PACKET.md`. Recovery Contract: `CHANGELOG.md` -> `September 3, 2026 — ACE-048 Phase 4 Slice 4A Stage C2 Application-Wrapper HTTP Proof Accepted`. The verified `2,594`-file Human-acceptance snapshot preserves the exact `4` candidate paths at baseline `ab3be8e97bf8f82fec05f29a3ea35557a47536a7`. Accepted-content commit `4db0a7086ce9e7a89cd0c0cdeec04a21a73f4384` and final closeout commit `7cffa434fc8fa2bc50c4381e93939f7cd0573b72` were pushed normally without force; clean local HEAD, upstream tracking ref, and live GitHub branch matched `7cffa434fc8fa2bc50c4381e93939f7cd0573b72` with `0 / 0` divergence. Stage C2 is closed. The next separate gate is PM discovery/target lock for publication readiness of the ledger-enabled application source; merge/deployment/Vercel, true concurrency, live route/RPC activation, providers/data, retry/reconciliation, migration, and artifact/index publication remain unauthorized.
- Phase 4 Slice 4A publication-readiness discovery authority — 2026-09-03: Oliver approved proceeding with the recommended fresh read-only discovery after Stage C2 closeout. The Project Manager may inspect the accepted branch, live `main`, GitHub publication/PR state, migration/source dependencies, deployment implications, and read-only Vercel/Supabase evidence only as useful to determine whether the ledger-enabled application source is safe to publish. The pass must separate source publication, GitHub merge, automatic Vercel consequences, database migration availability, live activation, provider/customer-data action, and true-concurrency proof; return an operator-readable recommendation plus an exact target-locked PM Brief or a precise blocker. It may not edit source or control-plane files, stage, commit, push, open or merge a PR, deploy, change Vercel configuration, invoke a live execute route/RPC, mutate database/provider/customer data, apply migrations, or publish artifacts/indexes.
- Codex remains the active Project Manager and stabilization lead. Claude turnover is **DEFERRED**; the Claude files are prepared, dormant continuity assets and are not an active assignment.
- Local-main consolidation Human Review is **ACCEPTED** as of 2026-08-30. Oliver confirmed the exact published Editorial/content child behaves correctly after the residual window check; the supplied captures show the full unit at `76` senders and the narrowed workflow at `25` senders with populated rows and window-aligned analysis state. This closes the residual old-artifact compatibility gate.
- Decision Mode optional-evidence availability is **HUMAN-ACCEPTED, INTEGRATED, AND LOCALLY VERIFIED** as of 2026-08-30. Preservation branch `codex/ace-048-decision-mode-optional-evidence` remains the accepted source lineage from baseline `7526afe49235265f0b257fbb3dd4a389c7ea129c`; local `main` contains the integration at `79ab1a6`. Oliver accepted the direct authenticated port-`3001` proof, and the same exact stable review-unit route subsequently passed authenticated port-`3000` integration verification: full `76` and narrowed `1M` `25` sender universes retained `12` loaded rows, subject/date evidence remained usable when optional detail degraded, settled states produced zero automatic repeats, explicit retry issued exactly one `200` request, close/return preserved the unit/window and nonzero rows, and no `412` or `409` churn remained. Recovery Contract: `CHANGELOG.md` -> `August 30, 2026 — ACE-048 Decision Mode Optional-Evidence Availability Accepted`.
- The accepted consolidation is now published to the canonical GitHub repository at `https://github.com/cvn74oliver/automata.git`. A normal non-force push advanced remote `main` from `64632b3faa0736cdf15534b4465cdef8a404a4e8` through cleanup commit `d7e21acd374d26c3b3e4552e60e70cb8f9a7e1cb`; post-push local `main`, `origin/main`, and live `refs/heads/main` were identical with zero divergence. Deployment, artifact publication, Gmail/index state, Supabase data, and every preserved recovery branch remain unchanged.
- Local and GitHub `main` contain the intentionally consolidated ACE-048 source through the accepted Decision Mode integration commit `79ab1a6` plus the approved governance, worktree-retirement, and generated-output hygiene commits. The governed pre-consolidation recovery branch remains `codex/ace-048-main-preconsolidation` at `22148cef9fc15e82730f19ef2f35eb3829763931`; all named archive and integration branches remain preserved.
- Worktree retirement completed on 2026-08-30: the seven obsolete ACE-048 checkouts and the later clean Decision Mode preservation checkout at `/Users/olivercarlin/.codex/worktrees/9e47/ai-agent-platform` were removed after exact branch/HEAD reattestation. Git now lists local `main` as the sole Automata worktree. The final checkout's sole commit `74eb4e7` is patch-equivalent to the accepted integration already on `main`; its named recovery branch and verified `KEEP` archive/snapshot remain intact. No branch was deleted. Dirty state discarded from `33ad`, `7865`, and `a985` was limited to explicitly excluded generated Playwright output and saved-auth residue, not product/control-plane source.
- Shared backup governance is active as of 2026-08-30 through `/Users/olivercarlin/Documents/Backups/backup-projects.sh`. The script presents explicit choices for Automata, Curative Mushrooms, and Curative Genetics, discovers their Git worktrees as separate recovery choices, uses milestone incrementals plus end-of-day/significant full archives, retains normal backups for seven days, and exempts `KEEP` full archives from automatic pruning. The accepted ACE-048 local-main milestone now has verified combined `KEEP` backups for `main@c28a7ba` and preservation worktree `9e47@74eb4e7`; verification manifest: `/Users/olivercarlin/Documents/Backups/August 2026/2026-08-30/ACE-048 backup verification 30 August 2026.txt`.
- The approved pre-publication full backup was created and passed archive-readability and checksum verification before cleanup: `/Users/olivercarlin/Documents/Backups/August 2026/2026-08-30/ai-agent-platform (backup 30 August 2026 - Pre-GitHub publication after ACE-048 consolidation).tar.gz`. The two generated output directories were then moved to recoverable Trash and are now excluded by narrow repository ignore rules.
- The prior published-artifact/cached-blank and Decision Mode corrections are not accepted. Human Review exposed a new active runtime incident: Mailbox Intelligence Pressure Trend retried the same failed inbox-analysis request without bound after authentication was missing. Execution mode remains `transitional_self_verification`.
- Exact authenticated localhost correction proof now passes for the bounded defect surface: Mailbox Intelligence hydrates automatically, Cleanup Groups renders the preserved semantic lanes, unscoped Decision Mode remains scrollable, and a valid protected overlay locks and restores body scrolling on backdrop close.
- Read-only Supabase truth: published `full-mailbox-20260415024237593` remains intact with `13` cluster summaries and one Intelligence snapshot; failed candidate `full-mailbox-20260815081528697` remains failed/unpublished. No rebuild, publication change, lifecycle reconciliation, mailbox scan, or database mutation is authorized by this repair.
- Oliver Human Review returned `REJECT` on 2026-08-21. The correction produced a temporary populated state but did not survive ordinary navigation: Mailbox Intelligence again rendered `No cleanup groups are available yet` while also showing `Refreshing cleanup analysis in the background` and AI Assistant `Syncing…`. The restoration is not stable, no Accepted Fix exists, and cleanup-lineage integration remains blocked.
- Latest incident containment: the runaway local dev process PID `57130` was terminated after reaching about `96%` CPU and `2.4 GB` memory; port `3000` is closed. The repeated log family was `/api/integrations/gmail/inbox-analysis` with `AuthSessionMissingError` at dozens of calls per second.
- Locked root cause is the Intelligence Pressure Trend effect: failed same-key state is an effect dependency and immediately resubmits itself. The approved correction is one file only, must produce one request per semantic key and zero steady requests after failure, and must not restart the app until static proof passes.
- Supabase/Gmail data, semantic artifacts, publication state, cleanup groups, and worktree lineage are not being rebuilt or mutated by this incident correction.
- The bounded one-file correction now has verifier correction proof PASS/HIGH. Cold All indexed produced one `200` Pressure Trend request with `57` yearly buckets; the 1M switch produced one additional `200` with `30` daily buckets; the total remained exactly two through a final `20s` steady-state window. Browser console errors/warnings were zero, production build passed `63/63`, and port `3000` is closed after proof.
- Human Review supersedes the prior narrow chart gate: the bounded same-key correction remains valid request-storm correction proof, but the broader Operations surface is `RETURN_TO_PM`. It is not an Accepted Fix and has no Recovery Contract.
- Index and artifact freshness are split: the Gmail index is current through August 15 at `244,628` rows; the public semantic artifact is still the April publication. The visible 1M/Custom cap at April 12 therefore reflects stale semantic-artifact coverage, not a failed Smart Sync.
- All-indexed Pressure Trend visibly begins in `1970` despite the first indexed message occurring in December 2022. The active defect is invalid lower-bound/leading-empty-bucket admission; exact stored-bucket origin remains a bounded read-only diagnosis target before implementation.
- Current main Cleanup Groups is an incomplete hybrid, not the accepted all-parent child-group model. Marketing exposes five artifact-backed units and blocks broad entry, while Backlog, Needs Review, and Protected/Trusted still expose broad-parent entry without finished child paths. Oliver returned this visible contradiction to PM on 2026-08-21.
- Governing finished-state contract: every visible parent has an intuitive operator-facing identity and a complete artifact-backed child-unit path; first click materially narrows; preferred size is `50–300`, hard maximum is `400`; parent/child/global counts reconcile exactly; all linked workflow surfaces preserve the same selected universe.
- Human Review checkpoint one returned to execution on 2026-08-23. Count reconciliation and the semantic groupings are valuable, but the visible workflow language is too technical and one exact child route can cold-load with correct header/distribution totals while sender rows remain empty until the analysis window changes. The prior warmed-session `60/60` matrix is correction evidence, not cold-load acceptance.
- Approved presentation contract: Automata exposes four universal actionable workflow stages—`Start Here`, `Work Through Older Items`, `Review Carefully`, and `Optional Specialized Groups`—plus collapsed `Reference Only` information. These are operator workflow roles, not Gmail taxonomy. Each workspace adapter supplies domain-specific child nouns and plain-language labels while stable IDs, membership, sizing, and count reconciliation remain engine-owned.
- Correction gate result: the isolated candidate now presents the four universal stages and plain Gmail-adapter parent/child labels without broad-parent review actions. The cold-load/child-switch lifecycle now rejects zero-row cache entries that contradict the published child count and does not reuse an already-aborted in-flight request. A clean authenticated browser proves the 138-sender Invoices child loads 12 rows, enters Decision Mode, and returns to the same child with 12 rows and no console error or `409` churn.
- Implementation checkpoint: the additive review-unit contract, nullable/indexed seed membership migration, generic all-parent chooser, exact-unit runtime resolution, invalid/stale-unit fail-safe, unchanged-key Decision Mode return correction, bounded Sender Distribution identity, Pressure Trend coverage-bound correction, exact preview-row counting, and replace-before-finalize behavior are implemented in the isolated candidate. The additive migration is applied and verified.
- Pre-rebuild verification checkpoint: deterministic contract fixtures PASS (including `857 = 347 + 218 + 160 + 76 + 56`, explicit remainders, stable IDs, and fail-closed units above `400`); Pressure Trend fixtures PASS with actual coverage `2022-12-02` through `2026-04-12` and no `1970`; non-incremental TypeScript, targeted lint, diff check, and the `63`-page production build pass.
- Authenticated post-settle Playwright correction proof on the exact Deals unit passes: `347` total, `12` rows, page `1 / 29`, and Sender Distribution `347`; Decision Mode close returns to the same exact child workspace without a workspace refetch or zero-row collapse. A stale unit ID returns safely to the chooser and does not issue a broad-parent workspace/distribution request. No `409`, retry loop, recurring heavy poll, console error, or warning was observed.
- Current April publication compatibility remains intentionally limited: Marketing can exercise its five bounded units; other oversized parents remain non-reviewable until a validated candidate exists. This is old-artifact readability, not final all-parent taxonomy acceptance.
- The one authorized unpublished candidate build completed as `full-mailbox-20260823022932121`, job `full-rebuild:085c8ef7-2fd7-4842-8499-cd605e894a77:all_indexed:full-mailbox-20260823022932121`, terminal `completed / candidate_ready`. No Gmail reindex or Smart Sync occurred, and the April published pointer remains unchanged.
- Framework-first gate correction — 2026-08-23: Oliver reaffirmed that Automata's reusable workspace framework is the product and Gmail is only the reference adapter. A bounded audit found the implemented invariants reusable but the materializer itself still binds entity fields, dimensions, labels, IDs, and validation types directly to Gmail. The migration and semantic candidate build are therefore **not ready to start**.
- Required architecture boundary before rebuild: a domain-neutral review-unit partition/validation engine plus a Gmail adapter that supplies sender-specific fields, decomposition dimensions, labels, compatibility IDs, and persistence. Future workspace adapters must be able to reuse the engine without copying Gmail logic or adopting Gmail vocabulary.
- Revised status: bounded framework extraction is approved and ACTIVE; the prior conditional rebuild approval is not treated as build authorization because its framework-first condition is not yet satisfied.
- Oliver approved the bounded framework-first extraction on 2026-08-23. Active execution scope is limited to extracting the domain-neutral engine, retaining Gmail-specific mapping/persistence in an adapter, adding non-Gmail contract fixtures, and proving unchanged Gmail behavior. Migration application and semantic build remain blocked.
- Approved platform refinement: the reusable contract is a declarative workspace workflow blueprint, not a sender-shaped or single-entity-per-workspace contract. Each workflow declares its universe, decision subject and vocabulary, evidence, actions, ordered semantic dimensions, and sizing policy. A crypto workspace may decide on positions/assets/opportunities/risk events; a tax workspace may decide on transactions/documents/accounts/issues/deadlines. New workspaces generate artifacts through adapters and configuration without rewriting the framework.
- Framework-extraction checkpoint: implementation and correction proof PASS/HIGH. The generic workflow-blueprint engine owns exact bounded partitioning and validation; Gmail is now an adapter while preserving its existing call sites and `857` fixture. Crypto position plus tax transaction/document fixtures prove non-Gmail portability and multiple decision subjects in one workspace. TypeScript, targeted lint, diff check, and the `63/63` production build pass.
- Oliver authorized the pre-rebuild data gate on 2026-08-23: apply the already-created additive migration and start exactly one unpublished semantic candidate build from the existing indexed mailbox. Publication, Smart Sync, Gmail reindex, main promotion, push, deployment, and lineage retirement remain unauthorized.
- Candidate-build safety correction: the current main-derived full-mailbox runner still publishes unconditionally, while preserved `cleanup-taxonomy-rebuild@0b5988d` contains the prior candidate-only lifecycle with resumable publication-state restoration and terminal `candidate_ready` job state. That proven seam must be restored and statically verified before the migration/build authorization is exercised; the publishing audit script must not be used for this gate.
- Candidate-build gate update: the preserved non-publishing lifecycle is restored for explicit candidate commands and passes TypeScript, targeted lint, four reconciliation fixture suites, and the `63/63` production build. The additive `review_unit_id` migration was applied directly and verified on linked Supabase project `cjpjekhlvzwjwtszqpmy` without using the drifted broad CLI push. Pre-build liveness confirms `244,628` indexed messages, no active mailbox-index run, and published version `full-mailbox-20260415024237593`; the next authorized operation is the single unpublished candidate build.
- Candidate reconciliation checkpoint: the initial validator failure was a planned-count false negative (`11,741` estimated versus `217,561` exact preview rows), compounded by upsert-only finalization retaining obsolete source-cluster rows. Exact paginated counting plus candidate-slice replacement correct the contract; the same candidate was re-finalized without a second mailbox scan or build.
- Final unpublished candidate truth: `5,024` global/unique senders across `7` parents, `5,024` seed rows, `5,024` rollups, `7` summaries, `1` Intelligence snapshot, `104` pressure buckets, and `217,561` preview rows. Every actionable parent has mutually exclusive persisted children, every child union equals its parent, every parent total equals the root, Context has no action, and the largest child is `296`.
- Candidate runtime proof PASS/HIGH: all `60/60` actionable child routes pass exact unit identity, displayed total, pagination, and Decision Mode entry; chooser -> child -> Decision Mode -> close -> child -> chooser preserves the selected universe and nonzero rows. A `230`-sender child reconciles across overview, Sender Distribution, Decision Mode, and return. The largest `296`-sender child uses bounded indexed reads (`329` workspace rows; `409 + 200` distribution rows; query concurrency `1`) with zero steady polling, retry, or `409` churn.
- Human Review checkpoint one returned to bounded presentation correction on 2026-08-24. Oliver accepted the overall four-stage direction and exact count reconciliation, but duplicate visible child names, ambiguous time/volume labels, an under-explained `Start Here` recommendation, and the `1,867`-sender protected decision group still make the workflow harder than necessary.
- Newly governing framework rule: the domain-neutral presentation layer must enforce unique human-facing choices within a decision group, explicit subject/time/volume wording, and cognitively bounded decision groups. A domain adapter supplies vocabulary and meaningful split axes; it must not change stable child identity, membership, or counts. Gmail remains only the reference adapter.
- Locked bounded correction: derive the `Start Here` value explanation from current group evidence; disambiguate duplicate child labels using the next meaningful semantic dimension; replace ambiguous activity/volume copy with plain subject-aware language; split the protected presentation group into exact, disjoint human-sized groups while preserving its existing child IDs and `1,867` total. No artifact rebuild, Gmail sync/reindex, publication change, or Supabase-wide read is authorized.
- Framework-level presentation correction proof — 2026-08-24: the generic presentation contract now rejects duplicate visible choices and invalid/mismatched presentation partitions, while the Gmail adapter supplies only human labels and meaningful grouping hints. The existing protected children render as four exact presentation contexts totaling `273 + 359 + 711 + 524 = 1,867`; persisted child IDs, membership, the `5,024` root, and candidate publication state are unchanged.
- Human-facing correction proof: technical cycle/spillover labels are replaced by subject-aware language, recency explains when the last email arrived, volume explains how many emails came from each sender, and `Start Here` explains decision value rather than repeating a percentage. All seven main presentation groups have unique child labels and exact child-to-parent reconciliation; no broad-parent review action is present.
- Authenticated post-settle Playwright proves the canonical chooser cold-loads with exact totals and zero console errors or recurring requests. Four representative children (`28`, `205`, `170`, and `239`) preserve stable review-unit route identity and nonzero rows. The `28`-sender child cold-loads `13` rows, enters Decision Mode, and returns to the same child with `13` rows; the request trace remains flat through a final `20s` hold with no `409` or refresh waterfall.
- Human Review ACCEPT — 2026-08-24: Oliver confirmed the corrected Cleanup Groups workflow is usable, the starting recommendation makes sense, and the framework-first direction is safe to proceed. Cleanup Groups checkpoint one is now an Accepted Fix with Recovery Contract `CHANGELOG.md` -> `August 24, 2026 — ACE-048 Framework-First Cleanup Groups Presentation Accepted`.
- Acceptance boundary: this closes the Cleanup Groups presentation and first-load/Decision Mode-return checkpoint only. The unpublished semantic candidate remains unpublished; artifact promotion, local-main promotion, push, deployment, and lineage retirement remain unauthorized.
- Read-only chart diagnosis — 2026-08-24: the candidate proves exact `all_indexed` review-unit membership, but selecting `1M` changes the requested analysis scope to `30d`; candidate `full-mailbox-20260823022932121` has no corresponding scoped review-unit artifact. The bounded page exposes only the unit page plus limited preview evidence, so exact preset/Custom membership and activity cannot be reconstructed safely at runtime. The separate Intelligence seam admits an empty Pressure Trend seed as usable and suppresses the one bounded bucket-family request.
- Oliver approved `RETURN_TO_PM` and a platform-generic planning expansion. Governing semantic decision: stable review-unit membership is immutable within an artifact version, while a window is a separate projection over that fixed membership. The UI and contracts must expose fixed unit count, active-in-window entity count, and window activity as distinct truths; window selection never creates or renames a child unit.
- Authoritative planning artifact: `docs/00_control_plane/runtime/ACE-048_WINDOWED_REVIEW_UNIT_ARTIFACT_CONTRACT_PM_BRIEF.md`. It defines generic manifests/activity buckets, bounded indexed projection reads, exact parity invariants, candidate failure isolation, the narrow Pressure Trend empty-seed correction, staged migration/new-candidate gates, rollback, target files, and accepted proof surfaces.
- Accepted Cleanup Groups labels, presentation groups, stable child IDs, membership, counts, cold load, and Decision Mode return remain frozen. The current candidate and active publication remain unchanged.
- Oliver plan decision — 2026-08-24: `ACCEPT`. Stages A/B are authorized: generic contract/runtime code, an unapplied additive migration, fixtures, and static/build proof. Migration application, candidate generation, publication, main promotion, push, deployment, Smart Sync, and Gmail reindex remain unauthorized.
- Stages A/B result — 2026-08-24: generic fixed-membership/window projection contracts, deterministic candidate materialization/validation, crypto/tax and Gmail adapter fixtures, bounded generic storage/read seams, candidate-generator integration, and unapplied migration `supabase/migrations/20260824132718_add_workspace_review_unit_window_projection.sql` are implemented in the isolated ACE-048 worktree. Fixtures, TypeScript, targeted lint, production build, and diff checks pass. Local SQL execution/RLS proof remains deferred to the application gate because no PostgreSQL server binary is installed; no Supabase data or publication pointer changed.
- Oliver decision — 2026-08-25: `APPROVED`. Stage C was limited to applying additive migration `20260824132718_add_workspace_review_unit_window_projection.sql` to Supabase project `cjpjekhlvzwjwtszqpmy`, verifying the new schema/RLS contract, and generating exactly one unpublished candidate from the existing indexed mailbox.
- Stage C result — 2026-08-25: migrations `20260825030532` and corrective RLS optimization `20260825030928` are applied. Candidate `full-mailbox-20260825031402535` reached `completed / candidate_ready` after one build trigger; no Smart Sync or Gmail reindex ran. The active publication remains `full-mailbox-20260415024237593`, `building_version` is null, and mailbox indexing is idle.
- Candidate reconciliation: `5,024` global unique senders across `7` parents; `4,965` actionable members across `60` manifests plus `59` informational Context senders; zero manifest/seed parity failures; zero within-parent duplicate memberships; largest child `296`. Projection coverage is `2022-12-02` through `2026-08-15`; no epoch manifest exists, and the bounded authenticated RPC returns fixed membership with exact active/activity truth for All Indexed, Custom, and ready-empty windows.
- Security/load result: tenant RLS allow/deny and RPC grants pass, database advisors report no finding against the new projection tables/RPC, and normal reads remain bounded. One transient preview-index upsert used the existing bounded store retry and recovered without a second build or mailbox scan.
- Oliver decision — 2026-08-25: `ACCEPT`. Stage D immediate same-flow execution is authorized on the isolated ACE-048 worktree. Scope is limited to the locked bounded projection read/runtime/API/review surfaces and the Pressure Trend empty-seed correction defined in the authoritative runtime brief.
- Stage D implementation result — 2026-08-25: the canonical child-review workspace, sender rows, Decision Mode, Sender Distribution, and Time Context share immutable `review_unit_id` projection identity. The bounded Pressure Trend seed guard rejects empty/invalid/epoch coverage, so All Indexed begins at real indexed coverage rather than 1970. No navigation-triggered build, sync, reindex, publication, or recurring heavy request was introduced.
- Human Review REJECT — 2026-08-27: the exact canonical route visibly retains all `278` fixed child members as Sender Distribution rank slots for All Indexed, `1Y`, `1Q`, and `1D`; narrowed windows only zero activity values. The `1D` screenshot therefore shows `278 RANKED SENDERS` with empty bars. This contradicts Oliver's intended workflow-filter behavior and invalidates the prior Stage D fixed-denominator proof as acceptance evidence.
- Locked mechanism: candidate projection truth already contains `unit_entity_total`, `active_entity_total`, and per-member `activity_count`. Runtime validates complete immutable membership, then maps every member into Distribution and workspace pagination regardless of zero activity. No semantic rebuild or new migration is required for this correction.
- Newly governing truth: immutable membership owns child identity and chooser/root reconciliation; a selected preset or Custom window owns the active working set. For non-All-Indexed windows, overview totals, sender rows, pagination, Decision Mode, and Sender Distribution must use exactly the unit members with qualifying window activity. Zero-activity members remain in projection audit truth but must not render as phantom workflow rows or rank slots. All Indexed continues to use full membership.
- Pressure Trend Human Review: its visual range is materially improved. Its coverage start/end must remain dynamically derived from the active tenant/workspace's real indexed/artifact coverage; no permanent user-independent date is allowed.
- Oliver decision — 2026-08-27: `APPROVED`. Stage D-R immediate same-flow implementation is authorized for the target-locked active-working-set correction and full preset/Custom linked-surface proof matrix. No rebuild, migration, publication, Smart Sync, Gmail reindex, deployment, push, local-main promotion, or lineage retirement is authorized.
- Stage D-R implementation/proof checkpoint — 2026-08-27: immutable unit membership remains fixed while one active working set now drives overview totals, sender rows, pagination, Decision Mode, Sender Distribution, and Time Context for narrowed windows. The canonical candidate child reconciles fixed `53` with active `39` (`1Y`), `23` (`1Q`), `22` (`1M`), `10` (`1W`), `0` (`1D` ready-empty), `17` (Custom Aug 1–15), and restored All Indexed `53`.
- Decision Mode on `1W` proves `5 of 10` and returns to the same `10`-sender overview; Pressure Trend renders from dynamic candidate coverage beginning in Q4 2022 and ending in Q3 2026 with no `1970` origin. Generic/Gmail fixtures, diff check, targeted ESLint with zero errors, production build, post-settle screenshots, linked-surface checks, console checks, and bounded request traces pass.
- No migration, rebuild, Smart Sync, Gmail reindex, publication, deployment, push, local-main promotion, or lineage retirement occurred. Candidate `full-mailbox-20260825031402535` and the active April publication pointer are unchanged.
- Human Review RETURN — 2026-08-27: active-window count parity is accepted as materially improved, but the Cleanup Groups -> Sender Overview transition is not accepted. `Start Here` children can return to the chooser instead of opening their review workspace, and successful child routes render the parent presentation title as the page H1 even though the goal/counts use the child identity.
- Locked mechanism: Cleanup Groups can emit links from cached/latest-stable mailbox intelligence while Review validates the selected `review_unit_id` against a different current runtime snapshot; the rejected child is then classified invalid and redirected. Separately, the Review hero is hard-wired to the parent presentation title instead of the selected child label.
- Oliver decision — 2026-08-27: `APPROVED`. Stage D-R2 immediate same-flow correction is authorized only to make chooser emission and Review validation use one authoritative artifact/intelligence identity and to render the selected child label as H1 with parent context beneath it. No taxonomy, membership, count, window, chart, migration, rebuild, publication, sync, reindex, deployment, push, main movement, or lineage retirement change is authorized.
- Stage D-R2 implementation/proof result — 2026-08-27: chooser and Review now resolve child identity from the current trusted candidate snapshot before cached fallback, valid child routes remain canonical, and the selected child label owns the Review H1 while the parent remains explicit `Inside ...` context. All `13/13` Start Here child routes settled without bouncing to Cleanup Groups; representative older/protected children also rendered their child title and correct parent context.
- The exact click path Cleanup Groups -> `Deals and special offers` settled at `262` active senders. The canonical `Newsletters and editorial updates` child reconciled fixed `53` with active `22` on `1M`; overview, pagination, Sender Distribution, and Decision Mode shared that `22`-sender universe, and Close returned to the same child/window with the overlay removed and nonzero rows preserved.
- Targeted generic/Gmail/window contract fixtures PASS, targeted ESLint reports `0` errors and `19` warnings, and `git diff --check` PASS. The isolated request trace shows one bounded workspace family plus one bounded distribution family per changed child/window key, query concurrency `1`, zero raw Gmail-message reads, zero `409`, and no recurring heavy poll after settle.
- Candidate `full-mailbox-20260825031402535` remains unpublished and the active April publication pointer is unchanged. No migration, rebuild, Smart Sync, Gmail reindex, publication, deployment, push, main movement, or lineage retirement occurred.
- Human Review ACCEPT — 2026-08-27: Oliver accepted the Stage D-R2 child-entry/title/return correction and the linked Sender Distribution window behavior. The accepted boundary does not include Time Context, which remains the next bounded correction surface.
- Newly governing Stage D-R3 truth — 2026-08-27: Time Context timeframe controls, bar selection, sender rows, Sender Distribution, Decision Mode, and the corresponding Pressure Trend projection must derive from one domain-neutral observation authority. A Time Context bar represents unique decision subjects active in that interval; supporting activity is a separate measure, and one subject may appear in multiple intervals.
- Oliver decision — 2026-08-27: `APPROVED`. Stage D-R3 immediate same-flow implementation is authorized for timeframe-state convergence, canonical interval-bound preservation, workflow-driving bar selection, plain-language metric semantics, and shared-observation parity proof. No taxonomy change, migration, rebuild, publication, Smart Sync, Gmail reindex, Supabase-wide scan, deployment, push, main movement, or lineage retirement is authorized.
- Stage D-R3 implementation/diagnostic result — 2026-08-27: Review now resolves Time Context from the selected published child workspace, one timeframe state owns the active control, and canonical bucket bounds survive the presentation path. Targeted generic/Gmail/window fixtures PASS; targeted lint reports zero errors. Authenticated post-settle proof shows the child source and selected control now converge without the prior `Timeframe not yet loaded` contradiction.
- Newly discovered governing truth — 2026-08-27: the persisted window-projection read contract exposes only summed `activity_count` per bucket. It does not expose the distinct decision-subject count already derivable from the materialized per-subject bucket rows. Live proof therefore showed an impossible `343` "active subjects" inside a `239`-subject All Indexed child, and `1,629` inside a `125`-subject `1Y` workflow. Relabeling, clamping, or reusing the activity total as a subject count is prohibited.
- Root Cause Execution Translation: extend the existing bounded projection RPC additively with `active_entity_count` computed from distinct materialized bucket entities; preserve `activity_count` as the separate supporting-activity measure; map both through the generic projection adapter; render Time Context bars from `active_entity_count`; and verify Pressure Trend, Time Context, Sender Distribution, rows, and Decision Mode against the same subject-observation authority. This requires no semantic rebuild, Gmail reindex, Smart Sync, publication change, or broad Supabase scan.
- Oliver decision — 2026-08-28: `ACCEPT`. The additive projection read-contract migration plus target-locked generic adapter/Time Context wiring is authorized for immediate same-flow execution. Authority remains bounded: no semantic rebuild, Gmail reindex, Smart Sync, artifact publication, broad Supabase scan, deployment, push, main movement, or lineage retirement.
- Stage D-R3 correction/proof result — 2026-08-28: additive migration `20260828011458_ace048_add_active_entity_count_to_projection.sql` is applied as remote version `20260828012004`; the bounded projection RPC now exposes distinct `active_entity_count` beside supporting `activity_count`. Generic/Gmail fixtures, targeted lint, diff check, and the production build pass.
- Authenticated post-settle Playwright on the exact canonical published-child route proves the selected Dec 2025 bucket at `98` distinct senders and `1,629` supporting messages. Sender Overview, Sender Distribution, sender rows/pagination, and Decision Mode share the same `98`-subject universe; Close returns to the same bucket without duplicate guard churn, Clear restores the `1Y` universe to `125`, and the full timeframe switch loop preserves the correct selected control with no fallback state or console error.
- Load/lifecycle proof: one bounded workspace/projection request family per changed timeframe or bucket key, zero recurring heavy requests after settle, no poller, and no observed `409` guard churn. No semantic rebuild, Gmail reindex, Smart Sync, artifact publication, broad Supabase scan, deployment, push, main movement, or lineage retirement occurred.
- Human Review RETURN — 2026-08-28: the distinct-subject correction is retained as valid filtering truth, but unique-subject bars are rejected as the primary Time Context visual. Time Context exists to show when and how much activity occurred, including repeated activity from the same subject across multiple intervals. The weekly example remains `10` unique senders, while its daily bars may legitimately contain more than `10` sender appearances and must show all message activity rather than suppressing repeat observations.
- Revised metric contract: Time Context bar height is additive observation/activity volume (`activity_count`; Gmail presentation: messages). Each bucket must separately show the distinct active-subject count (`active_entity_count`; Gmail presentation: senders). Clicking a bar narrows the workflow to those distinct subjects, while rows show each subject once with its activity volume. Sender Distribution, overview totals, pagination, and Decision Mode remain unique-subject views. All surfaces derive from the same canonical subject-observation facts but intentionally aggregate them through different lenses.
- Root Cause Execution Translation: preserve the additive projection read contract and existing unique-subject narrowing. Change only the target-locked Time Context presentation/metric mapper so chart scale, peak/latest/delta reads, accessible labels, and primary bucket copy use activity volume; retain distinct subjects as secondary bucket context and the filtering denominator. Explain visibly that one subject may contribute activity in multiple periods, so chart activity is additive while subject counts across buckets are not. No rebuild, migration, reindex, sync, publication, or new request family is required.
- Oliver decision — 2026-08-28: `APPROVED`. Immediate same-flow bounded correction and verification are authorized under the revised activity-volume contract.
- Stage D-R3 activity-volume correction/proof result — 2026-08-28: Time Context chart scale, bars, peak/latest/delta reads, accessible labels, hover copy, and focused-bucket truth now use additive `activity_count`, while `active_entity_count` remains the distinct-subject filtering denominator. The generic fixture explicitly proves four activities from two decision subjects in one interval.
- Authenticated post-settle Playwright on the exact weekly `Newsletters and editorial updates` route reconciles `10` unique workflow senders and `15` supporting messages. Aug 12 renders `5` messages from `4` senders; selecting it produces exactly `4` workflow rows, `4` active Sender Distribution subjects, and `Sender 1 of 4` in Decision Mode. Close returns to the same bucket, and the `1M` -> All Indexed -> `1W` switch loop restores the weekly `10` / `15` truth.
- Load/lifecycle proof: no new request family or poller was introduced; settled state produced zero requests over five seconds; no `409` guard churn occurred. One non-interfering `412` affected Decision Mode evidence-snippet hydration only and did not alter the accepted queue, chart, or close/return behavior.
- Proof artifact bundle: `/private/tmp/ace048-time-context-activity-proof/`. All accepted screenshots were captured after ready state.
- Human Review RETURN — dual-window authority — 2026-08-28: the Stage D-R3 activity-volume chart and `messages from senders` explanation are retained, but the Review page is not accepted. The left Operations Workspace scope control and the Analysis Rail timeframe controls can express different windows at the same time, producing mismatched highlights, resets to All Indexed, stalled loading, and contradictory workflow totals.
- Newly governing Stage D-R4 truth: a Review/Decision workflow may have exactly one mutable workflow-window authority. Sender Overview, Time Context, Sender Distribution, sender rows, pagination, and Decision Mode must consume that same canonical state. Artifact/discovery coverage may remain visible as read-only provenance, but it must not operate as a second competing workflow filter on this page.
- Stage D-R4 plan approval and implementation — 2026-08-28: Oliver approved the single-authority correction. On Review and Decision surfaces, the Analysis Rail `Workflow window` is now the sole mutable timeframe control; the Operations Workspace shows read-only indexed-coverage provenance. Legacy `workflow_scope` conflicts canonicalize to the lower workflow window and are removed from review-unit URLs.
- Stage D-R4 verifier result: `ACCEPT / HIGH` for the dual-window defect. Authenticated post-settle Playwright proved the conflicting legacy URL resolves to one selected `1W` state; `1W -> 1M -> All Indexed -> 1W` keeps URL, selected control, Overview totals, Sender Distribution, rows, pagination, Time Context, and Decision Mode aligned. Closing Decision Mode returns to the same `1W` workspace.
- Load/lifecycle proof: each changed workflow-window key produced one bounded sender-workspace request and one sender-distribution request, with no polling, repeated heavy requests, `409` churn, rebuild, sync, reindex, publication, or broad scan. A separate Decision Mode evidence-snippet `412` remains adjacent residual work and does not change the verified window state.
- Proof artifacts: the historical post-settle Playwright bundle was intentionally excluded from Git and retired with its obsolete worktree. The accepted visible baseline is now captured by Oliver's 2026-08-30 full-page screenshots listed in the consolidation integration packet.
- Human Review ACCEPT — 2026-08-28: Oliver accepted the completed Cleanup Groups and linked analysis surface, including Sender Distribution, activity-volume Time Context with distinct-subject narrowing, dynamic Pressure Trend coverage, and the Stage D-R4 single workflow-window authority. Recovery Contract: `CHANGELOG.md` -> `August 28, 2026 — ACE-048 Unified Analysis Window and Linked Chart Truth Accepted`.
- Local-main consolidation checkpoint — 2026-08-29: the accepted candidate ancestry plus the final eight-file analysis compatibility correction are committed on local `main` at `7866368c97a6ca8d241a9541f6f83570df2017f4`. Contract fixtures, TypeScript, targeted lint, diff checks, and the `63`-route production build pass. Generated browser output, saved authentication state, secrets, environment files, and `.codex/worktrees/` metadata were excluded; no worktree or branch was retired.
- Residual compatibility verification — accepted 2026-08-30: Oliver completed the requested exact-route check. The full unit renders `76` senders, the narrowed workflow renders `25` with populated rows and aligned analysis state, and no stale full-unit contradiction is visible.
- Exact next step: create and verify the pre-implementation recovery point, then execute and verify only the exact four-file Phase 4 Slice 2 Approval Queue truth-projection brief.
- Status: `ACE-048 FRAMEWORK-FIRST PHASES 1-3 AND PHASE 4 SLICE 1 HUMAN-ACCEPTED / RECOVERY-BACKED / GITHUB-PRESERVED; PHASE 4 SLICE 2 IMPLEMENTATION AUTHORIZED`.
- Checkpoint Status: continuity checkpoint created. The Slice 2 target lock and exact implementation authority are propagated; recovery checkpoint and execution are next.
- Current-tree auth-artifact remediation and the earlier scoped Contracts A/B correction remain accepted historical fixes with their Recovery Contracts. Git-history exposure remains OPEN.
- Exact Codex sequence: (1) control-plane consolidation; (2) recompute live semantic integration manifest and execution-ready PM Brief; (3) mutation-safe runtime verification and semantic-artifact disposition; (4) separate Dashboard repair; (5) manual cleanup semantic integration on main-derived isolated worktree; (6) post-integration build/Playwright/load-safety/human acceptance; (7) bounded security/platform stabilization and safe worktree retirement; (8) refresh/activate Claude handoff only after an accepted checkpoint.
- Pre-Claude stabilization is done only when the control plane is contradiction-free; intended branches are committed/pushed; valuable lineage is integrated or explicitly preserved; runtime candidate is accepted or authoritatively rejected; artifact/publication truth is safe; Dashboard is adjudicated; mailbox-cleanup cards/groups have verifier-backed canonical-route post-settle Playwright proof that sender counts, membership, semantic artifact source, group/subgroup identity, Sender Distribution, workflow totals, sender rows, Time Context, and Decision Mode agree; then an explicit `Status: Awaiting Decision` Human Review gate records Oliver's ACCEPT/REJECT/BLOCKED/RETURN_TO_PM decision; manual integration and exact main build/runtime/browser proof are accepted; a final explicit Human Review gate accepts stabilization closeout before any Claude activation; open security/platform debt is fixed or explicitly bounded; and redundant worktrees are safely retired or explicitly retained by Oliver. No Human Review is inferred from silence or general direction approval. If taxonomy or the accepted surface remains ambiguous after repository/document evidence, PM returns to Oliver for a screenshot walkthrough rather than guessing.
- Worktree/branch truth: local `main` is the sole Automata checkout after retiring the clean detached `3226` Management discovery worktree. Local/origin `cleanup-taxonomy-rebuild` at `c690dff` and every named recovery/archive branch remain preserved; no branch was deleted. The accepted semantic union was integrated seam-by-seam into `main`, while preserved branch lineage remains recovery evidence rather than an active checkout.
- The published-artifact review-unit-plan audit is complete. The April publication already carries schema-version-2 stable review-unit identities, so no rebuild is needed for the first integration packet. Marketing reconciles `857 = 347 + 218 + 160 + 76 + 56`, with every unit below the `400` hard maximum. Backlog (`487` oversized), Protected/Trusted (`1,660` oversized), and Unresolved (`1,110` oversized) are explicitly not child-complete.
- Active integration target lock: all actionable cleanup parents are chooser-only and expose one flat layer of exact, mutually exclusive published review units; no broad-parent shortcut is valid. Historical/Context is the sole informational no-review exception. Main remains the destination, `cleanup-taxonomy-rebuild@c690dff` remains mandatory feature-authority evidence, and hot files must be integrated seam-by-seam rather than copied or blindly merged.
- Isolated packet correction status: verifier `PASS / HIGH` in the main-derived candidate. The exact Deals child now settles to `347` unit senders, `3` managed, `344` remaining, `39,036` focused supporting messages, `347` ranked distribution entries, and `12` visible rows on page `1 / 29`; the broad Marketing escape is absent. Exactly one focused workspace plus one focused distribution request returned `200`, with zero `409`, polling, retries, console/page errors, or steady repeated heavy requests.
- Count reconciliation is a hard integration invariant: displayed parents must sum to the global cleanup scope; every exposed child plan must sum to its parent; charts, sender rows, pagination, and Decision Mode must use that same active universe. Current root proof reconciles `4,881 = 857 + 1,003 + 1,118 + 1,844 + 59`; Marketing reconciles `857 = 347 + 160 + 76 + 218 + 56`.
- The exact five-file transfer to current main is complete with byte parity. Static/build proof passes, and main root, exact Deals overview, and Decision Mode entry preserve the `347`-sender unit.
- Main return-loop status is verifier `REJECT`: Decision Mode close drops the explicit published-unit route and rewrites to legacy semantic-family/subtype state, after which the `347` unit hero and distribution disappear.
- First storage-condition correction was insufficient. Authenticated Chrome proof now preserves the explicit Deals `review_unit`, `347` hero, and `347` distribution after Close, but legacy semantic query state is still appended and the visible sender workflow collapses to `0` loaded rows instead of page `1 / 29`. Verifier status remains `REJECT / HIGH`; Human Review has not started.
- The storage-effect sanitization is implemented but remains insufficient under authenticated re-verification. Close preserves the `review_unit`, `347` hero, and `347` distribution, yet the shared URL builder still appends legacy semantic-family/subtype parameters and the sender rows collapse to `0`.
- Final lock: the shared review URL builder must enforce mutually exclusive route identity. A valid `review_unit` subset suppresses semantic-family/subtype query emission; non-review-unit semantic routes remain unchanged. The existing return-storage sanitization remains in place. Expected load delta: zero new requests, zero polling, no backend or artifact mutation.
- The builder correction is implemented and statically clean. Authenticated proof confirms the route is now clean after Close, but the visible sender workflow still collapses from `12` rows on page `1 / 29` to `0` while the `347` hero and distribution remain.
- Residual mechanism: the overview-mode transition effect clears the ready semantic-focus workspace on Decision Mode Close. Because the review-unit request key did not change across the in-place overlay, the fetch effect does not rerun, leaving permanent zero rows.
- The Deals overlay state-lifecycle correction remains required, but the former isolated PM decision gate is superseded by Oliver's broader Cleanup Groups return. Next is the revised all-parent inventory and proof matrix; hot-file execution resumes only from the resulting bounded packet. No rebuild, publication, Supabase mutation, merge commit, push, or cleanup-branch retirement is authorized.

### ACE-048 Operations published-fallback and scroll correction proof — 2026-08-21

- Published artifact `full-mailbox-20260415024237593` remains immutable and usable even though the later candidate failed. The correction exposes failed refresh state separately and prevents the fallback state from enqueueing a background rebuild.
- One manual `Refresh cleanup analysis` interaction settled to the last published semantic truth with an explicit failed-refresh warning and no repeated UI polling, raw mailbox reconstruction, database mutation, or semantic rebuild.
- A second cached-blank mechanism was corrected: missing cached mailbox health could previously start only the health request and return forever, leaving Cleanup Groups blank. The runtime now starts exactly one silent snapshot hydration when the cached cluster set is empty and not terminally unavailable.
- Mailbox Intelligence fresh-navigation proof: `4,923` indexed senders, `1,902` senders in review, approximately `237,628` supporting messages, mission/health panels visible, blank state absent, page scrollable.
- Cleanup Groups proof: `4` expanded decision lanes, `1` optional lane, `4,881` senders in cleanup scope, Marketing `857 / 70,522`, Backlog `1,003 / 16,776`, Protected `1,844 / 134,237`; page scrollable.
- Decision lifecycle proof: unscoped `mode=decision` had no overlay, empty body overflow, and real scroll `0 -> 650`; protected Decision Mode mounted one visible overlay with body overflow hidden, then backdrop close removed the overlay/query mode and restored empty overflow on the scrollable overview.
- Static/build proof: non-incremental TypeScript PASS; targeted lint `0` errors / `19` pre-existing warnings; `git diff --check` PASS; isolated fresh Next `16.0.10` Turbopack build PASS with `63` routes.
- Authoritative correction-proof bundle: `/Users/olivercarlin/Dev/ai-agent-platform/output/playwright/ace048-main-cleanup-restore-correction/correction-proof.json` plus numbered screenshots `01` through `07` in the same ignored proof root.
- Open baseline truth, not hidden by this pass: the published semantic artifact predates the current `244,628`-row index; Pressure Trend remained loading after the semantic Intelligence surface settled; protected Sender Distribution and sender rows are not ready. Those open surfaces belong to the next preservation-first integration/diagnosis program and prevent overall Operations or accepted-fix closeout claims.
- Human Review override: Oliver's later exact-route screenshot visibly contradicts the temporary PASS state. Existing code diffs and proof artifacts are now suspect prior-attempt evidence, not proof of a current correction. The active problem returns to diagnosis in `repeated_failure_visible_proof_mode`; the next correction must prove normal click-through/re-navigation persistence with new before/after artifacts before another Human Review.
- Persistence diagnosis is now locked: `OperationsRuntimeContext` accepts an old zero-cluster session snapshot as ready data without a semantic validity guard. The pages therefore render false terminal-empty copy while a new published-artifact read is still in flight. A controlled cold tab reproduced the transient blank and then repopulated after about `20s`; the Cleanup Groups -> Intelligence warm return stayed populated. This is stale client-cache admission, not loss of the published artifact.
- Root Cause Execution Translation: one-file correction in `web/src/components/runtime/OperationsRuntimeContext.tsx`. A zero-cluster snapshot is transient/invalid when indexed or published truth proves groups should exist; such a snapshot must not be mounted or persisted, must be evicted from exact client cache, and must not overwrite an already mounted non-empty snapshot. Cold/no-stable state must remain honest loading/error until the bounded live artifact read returns. No page-copy workaround, polling, raw scan, rebuild, or backend mutation is allowed.
- The one-file RETURN correction is implemented. New exact-route correction proof PASS/HIGH: cold Intelligence never rendered false terminal-empty copy, settled to the published semantic groups, Cleanup Groups remained populated, and the rail return to Intelligence was immediately ready; both pages remained scrollable. TypeScript, targeted lint, diff check, and isolated Next/Turbopack build (`63/63`) pass. Proof: `output/playwright/ace048-main-cleanup-restore-return/return-proof.json` plus screenshots `01` through `04`.
- Current decision state: `Status: Awaiting Decision`. Oliver must exercise the same cold/reload and Intelligence -> Cleanup Groups -> Intelligence loop in the existing Chrome profile. No Accepted Fix, Recovery Contract, integration, rebuild, database mutation, commit, push, merge, or deployment is authorized before that decision.

## Historical evidence — not current execution authority

The records below preserve accepted fixes, audits, prior commits, and rejected/blocked passes. They are historical snapshots; do not use their old heads, old next steps, or successor-activation wording as current state.

### Historical deferred successor direction — superseded by Codex continuation

- Oliver approved Claude Code as the future primary implementation environment after the current cleanup/reconciliation/stabilization cycle, not immediately.
- Current next step is read-only generated-worktree uniqueness audit and retirement preparation, followed by formal Claude handoff preparation. `ACE-049` remains queued/inactive.
- The future model is agent-neutral: `Oliver -> Automata Control Plane -> Codex / Claude / future agents -> isolated worktrees or branches -> Git -> verification -> authoritative state`.
- A future root `CLAUDE.md` must reference/import root `AGENTS.md` and add only Claude-specific entry/efficiency guidance; no parallel Claude control plane is permitted.
- Codex and Claude may never write the same working directory concurrently. Post-cutover Claude operates autonomously; Codex is not a required reviewer.
- Cutover requires explicit acceptance of the bounded stabilization gate, a coherent authoritative repository/control plane, intended work pushed, ambiguous worktrees/branches resolved or documented, recorded tests/builds and unresolved issues, and a formal handoff with live-state verification requirements.
- Claude's first post-cutover assignment is read-only institutional onboarding/reconciliation. No new product development begins after stabilization until successor readiness is handled.
- This draft predates the created Claude files and the subsequent decision to defer turnover. It is retained only as historical transition evidence.

### Historical rebaseline repository and platform truth

- `main` at `cce016b` is the eventual integration destination and authority for later unrelated main-line evolution, subject to semantic union.
- `cleanup-taxonomy-rebuild` at immutable committed head `382c9d6` plus exactly three verified local baseline corrections is the feature authority for sender-distribution semantics and its cleanup/taxonomy intent. It is not globally authoritative outside that feature family.
- Main must not silently override cleanup sender-distribution intent. Both worktrees' authoritative control-plane history is mandatory evidence for sender-distribution integration, while this current root control plane remains governing for execution.
- Wholesale merge, blanket conflict resolution, and broad overwrite are unsafe and unauthorized.
- Public Git history contains four tracked Playwright Supabase auth-state artifacts.
- The three Supabase Auth sessions referenced by the tracked storage-state files are verified revoked:
  - each exact session was confirmed present and refreshed only to revoke that same session locally
  - a follow-up `auth.sessions` query returned no rows for all three exact session IDs
  - no unrelated sessions were touched
- Current-tree auth-artifact remediation is implemented and independently verified:
  - root `.gitignore` rejects nested/root `.playwright-cli`, `playwright/.auth`, and JSON auth/login/storage-state filename variants
  - exactly four tracked auth-state files were deleted from the working tree
  - ordinary browser evidence remains unignored
  - tracked-current scan found zero files containing the Supabase auth-cookie marker without printing secret contents
  - independent verifier reported PASS with `Missing Proof Type: none`
  - `git diff --check` passed
- Oliver issued post-implementation `ACCEPT` for the bounded current-tree remediation.
- Recovery Contract: `CHANGELOG.md` -> `August 15, 2026 — ACE-048 Current-Tree Auth-Artifact Remediation Accepted`
- Git-history exposure remains open: all four blobs remain recoverable from current HEAD.
- Main HEAD and index remain unchanged; no commit or push occurred.
- The cleanup worktree was clean and untouched during auth-artifact remediation; it now contains the three uncommitted, independently verified cleanup correction paths recorded below.
- Multiple service-role API routes lack caller authentication and ownership checks.
- Next.js `16.0.10` is below the approved patched security baseline.
- Two Vercel projects deploy the same `main` commit; the canonical project is unresolved.
- Local Supabase migrations do not reproduce the live schema.
- Gmail is the mature reference vertical.
- A generalized visual builder / executable workspace compiler is not yet implemented.
- A governed model-training lifecycle is not yet implemented.
- A broader multi-agent company hierarchy is not yet implemented.

### Governing execution order

1. Accepted current-tree auth-artifact remediation — complete with Recovery Contract.
2. Accepted Main Contracts A/B sender-distribution scope-truth correction — complete with Recovery Contract.
3. Gmail OAuth plus sync/index recovery — PASS; semantic artifact recovery/publication remains open.
4. Load-safe semantic-artifact recovery/integration safety audit, controlled candidate-disposition plan, and approved PM Brief.
5. Separate Dashboard baseline diagnosis, PM Brief, correction, and verification loop.
6. Recompute the dual-worktree manifest and author the staged semantic-integration PM Brief under cleanup sender-distribution authority.
7. Manual preservation-first integration on a main-derived integration worktree.
8. Post-integration terminal-health and Playwright regression verification plus human acceptance before merge/commit/push.
9. Privileged-route caller-authentication and ownership hardening.
10. Next.js patched-baseline upgrade.
11. Canonical Vercel project adjudication.
12. Supabase live-schema reconciliation and reproducible migration baseline.
13. One complete Gmail closed loop.
14. Governed learning substrate.
15. Executable workspace compiler / visual builder.
16. Second-domain validation.
17. Broader multi-agent hierarchy.

### Gmail health and load-safety state

- Historical pre-Smart-Sync checkpoint: **Partial Proof — Gmail AUTH RECOVERED / MAILBOX SYNC NOT YET RESTORED**.
- Before reconnect, the Gmail connection retained non-empty tokens and correct scopes but had access expiry `2026-04-16`. The mailbox index was frozen at `237,628` total rows / `210,472` inbox rows, newest indexed message `2026-04-12`, status `incremental_sync_auth_failed`, failure `invalid_grant` / `auth_failed`, no active run, and `requires_reconnect=true`. The completed 24-month historical backfill from `2026-03-19` remains intact.
- Oliver manually reconnected/resynced in the headed app. The connection persisted at `2026-08-15 07:49:43.103+00` with fresh access expiry `08:49:42.103+00`, non-empty access and refresh tokens, and all required scopes. Token values were never printed or stored in control-plane truth.
- A minimal direct read-only Gmail `users/me/profile` request returned HTTP `200`, `gmail_authorized=true`, `614,856` messages, `569,764` threads, and a present history ID. OAuth/Gmail API access is restored.
- The mailbox index did not restart: the April failure state, counts, and timestamps did not change; `active_run=null`; no growth occurred. The mailbox-index endpoint still reports `requires_reconnect=true` from stale index failure truth.
- Callback and passive-load behavior is intentional: OAuth callback persists the connection and redirects to `/settings?gmail=connected`; it does not start indexing. Smart Sync is a separate operator action (`POST`, trigger `smart_sync`). Settings' row-existence Connected state is insufficient health truth.
- Artifact truth remains separate/stale: `all_indexed=refresh_failed`; `7d=refresh_in_progress` and stale; `30d` / `90d` / `180d` / `365d` publications unchanged.
- Ignored/local proof is under `/Users/olivercarlin/Dev/ai-agent-platform/output/playwright/ace048-cleanup-integration/gmail-health-audit/`; it is non-authoritative and must not be committed.
- Oliver authorized and initiated Smart Sync at `2026-08-15 08:03:39Z`. The bounded `45`-day, effectively full fresh-head recovery completed at `08:15:26Z`: `14 x 500` pages, `7,000` inserted/upserted, rows `237,628 -> 244,628`, newest `2026-08-15 07:49:35Z`, oldest boundary `2026-07-01 08:30:56Z`, terminal `recent_window_reached`, `active_run=null`, and no sync error/failure.
- Current classification: **Gmail OAuth + sync/index recovery PASS; semantic artifact recovery/publication NOT complete**. This remains neither an Accepted Fix nor milestone closeout; no Recovery Contract exists.
- Hard constraint: Supabase must not be exposed to repeated unbounded mailbox reads. Intended path: bounded final/index pull -> semantic candidate/publication -> compact published-artifact runtime reads.
- Observed unsafe load shape: Operations initially returned `100,000` indexed rows (`1,000` page size, concurrency `8`, `15.4s`); active-run UI polling hit mailbox-index every `5s`, and each GET performed exact counts plus index/recent/artifact reads. PM closed the tab.
- Full-effective completion planned six sequential rebuilds. Historical cost indicates roughly `1.5M` streamed row reads plus writes/retries across the six scopes.
- Published `all_indexed` `full-mailbox-20260415024237593` remains public. Candidate `full-mailbox-20260815081528697` remains unpublished/building; last job checkpoint was `running/projecting_sender_scope`, `675` senders / `28,588` messages. No public swap occurred.
- PM stopped exact local Next PID `58033` after sync completion and before fanout; port `3000` is closed. Do not mutate or reclaim the candidate in propagation; controlled disposition requires an approved safety plan.
- The April-stale `7d` build was reclaimed failed before the candidate; other prior scope publications remain. No PostgREST backlog was observed at the snapshot, but this does not weaken the architectural constraint.
- PM/verifier agents may click app controls during declared testing under Oliver's authorization; heavy or unbounded actions still require an explicit safety contract.
- The user-visible **Supabase & Artifact Safety Architect** task completed its read-only dual-worktree audit and produced the PM-Brief-ready plan below.
- Temporary screenshot and ignored Gmail-health proof root are local/non-authoritative; no authoritative runtime artifact was created.
- Dashboard correction, manifest recomputation, semantic integration, merge, `7d` / `1W` UI exploration, database cleanup, history remediation, and deployment remain blocked pending the safety plan and controlled candidate disposition.

### PM-Brief-ready Supabase and artifact safety plan

- Read-only dual-worktree audit result: HIGH confidence; no database or runtime change.
- Architecture: bounded ingestion/index -> single-flight asynchronous projector -> versioned candidate -> semantic/count/identity validation -> CAS pointer -> compact immutable published-artifact reads. Runtime/raw fallback is forbidden.
- Confirmed amplification: at least `1,712,396` raw-row reads for current full sender-stat scan plus six-scope fanout before writes/retries; request-time `100,000`-row reconstruction and expensive `5s` health polling are separate prohibited load seams.
- Orphan: keep public `full-mailbox-20260415024237593`; never resume or publish partial `full-mailbox-20260815081528697`. A later separately approved mutation pass must prove no live worker, CAS-reclaim only its stale lock, retain forensic rows/checkpoints, mark it abandoned/failed, and preserve the public pointer.
- Recovery order: runtime/raw isolation and O(1) status -> durable single-flight/fingerprints and fanout removal -> manual cleanup/main semantic union -> separately approved orphan abandonment -> one new locked-revision `all_indexed` candidate -> validation/CAS publication/pointer rollback -> recent scopes later and bounded.
- Governing budgets: runtime and polling raw rows `0`; artifact pages `12-50` default / `200` max / first paint `<=1,000`; artifact query concurrency `<2`; raw build pages `<=1,000` sequential and writes `<=500` sequential; one full build per tenant and one globally initially; one full raw scan per index revision; maximum one automatic full candidate per sync; bounded jittered polling with no idle/hidden polling; exact counts only at explicit boundaries/diagnostics; bounded retries and heartbeat/liveness reclamation.
- Stop immediately on runtime raw reads, concurrent/second-scope build, excessive page latency, retry/count failure, cursor/counter regression, stale lease, index-revision drift, validation failure, CAS drift, or partial candidate exposure.
- No-truth-lie: August 15 index freshness (`244,628` rows) does not make the April 16 published semantic artifact current; building candidates are never ready.
- Cleanup remains semantic/sender-distribution authority; main's later lifecycle/UI/request-ownership behavior must be preserved through manual seam integration, never wholesale hot-file merge.
- Historical decision gate: **RESOLVED — ACCEPT**. The acceptance authorizes only the bounded first slice below; it is not an Accepted Fix and does not authorize database action, artifact mutation, app restart, or downstream lanes.

### Active slice — Runtime Read Isolation + O(1) Lifecycle Status

- Status: source/correction recheck ACCEPT/HIGH; build-environment mechanism found/HIGH; exactly one bounded external-sandbox recovery build is active after propagation. Playwright and transfer remain blocked.
- Problem class: runtime behavior constrained by artifact/publication truth.
- Objective: preserve zero request/poll `gmail_messages` rows and zero read-time writes while making cache admission, terminal invalidation, linked-state clearing, and UI ownership obey current lifecycle identity.
- Load: runtime/poll raw rows `0`; request/poll writes `0`; cold workspace `1` then distribution `1`; cached workspace `0` then distribution `1`; unavailable distribution `0`; heavy concurrency `1`; artifact pages `12-50` default / `200` max; cold compact reads `<=30` queries / `<=501` rows; terminal visible single-flight poll `12-18s`; no hidden/idle polling or recurring exact counts.
- Preserved source baseline: the seven-file isolated candidate remains valuable but unaccepted. The next correction is locked only to runtime `gmailCleanupWorkspace.ts` and `review/page.tsx`; `OperationsRuntimeContext.tsx` and the other four candidate files must remain byte-identical.
- Historical transferred implementation files:
  - `web/src/lib/runtime/gmailCleanupWorkspace.ts`
  - `web/src/lib/runtime/runtimeStateService.ts`
  - `web/src/app/api/integrations/gmail/mailbox-index/route.ts`
  - `web/src/components/runtime/OperationsRuntimeContext.tsx`
  - `web/src/app/api/integrations/gmail/inbox-analysis/route.ts`
  - `web/src/lib/integrations/gmail/gmailCleanupWorkspace.ts`
  - `web/src/lib/integrations/gmail/gmailWorkspaceContracts.ts`
  - `web/src/lib/integrations/gmail/gmailArtifactStore.ts`
- No third production or test file is authorized for the correction. Any additional file returns to PM.
- Preserve cleanup semantic authority and all semantic/group/resolver/candidate/CAS behavior. Preserve the April public artifact; do not resume, publish, reclaim, or mutate the August candidate.
- Completed correction proof: actual-module lifecycle transitions/cache/linked-state clearing plus preserved truth/load fixtures; non-incremental TypeScript; exact three-file and seven-file regression lint; diff check. One production build attempt hung at optimized-build creation, was bounded to six minutes and terminated, with no `BUILD_ID`; this is Blocked Build Proof, not an implementation verdict. The independent source re-verifier now rejects a response-lifecycle race; no build retry is justified before any production runtime or Playwright proof.
- Propagation itself does not restart the app, query/mutate data, click controls, merge, deploy, or exercise `7d` / `1W`.

#### Response-lifecycle source re-verification — REJECT/HIGH; two-file correction lock

- The independent source/correction re-verifier proved that cache reads reject lifecycle-mismatched entries, but the successful network normalization/cache/return path does not compare the response lifecycle with the caller's `expectedLifecycle`; the linked reducer also omits result-lifecycle versus request-owner validation.
- Actual-module falsification: `resultOk=true`; response lifecycle `building`; expected lifecycle `degraded::pub-v1::no-building::refresh_failed::failed`; reduced status `building`; installed data `true`; later cache admission for the expected identity `false`. This is a visible-install race, not a cache-read-only defect.
- Exact correction lock: `web/src/lib/runtime/gmailCleanupWorkspace.ts` and `web/src/app/agents/[id]/operations/review/page.tsx`. No third file is authorized. The runtime client must reject mismatched successful response lifecycle before cache write/return with machine-readable expected/actual lifecycle; the page must independently reject lifecycle-mismatched installation for its current request owner.
- Required proof: actual-module degraded-owner/building-response and terminal-owner/usable-response cases, plus unchanged cache hit, one bounded transition refetch, workspace-before-distribution sequencing, and existing load counters. No new cache, request, polling, write, Gmail, or build path.
- Preserved PASS boundaries: explicit terminal clearing, valid degraded preservation, `12/50/200` bounds, read purity, matching-response load guards, polling, seven-file scope, and retained fixture.
- Build proof stays `BLOCKED/HIGH`, non-causal, and must not be retried in this correction or its source recheck. Runtime/Playwright verification and source transfer remain blocked until an independent source `ACCEPT/HIGH` after this correction.

#### Two-file response-lifecycle implementation checkpoint — static proof PASS

- Candidate detached `cce016b`, empty index/unmerged state, and fingerprint `e9fc350d...` remain unchanged. Runtime client is now `c78215364d399e28ddacbc88041659dae7ccd117a98053dcf93bebca90c4e7f6`; review page is now `988922673dcd746f742ed1c9fb1ed218b0652576549216e7b22e9a4453ffc898`. The other five governed files, including `OperationsRuntimeContext.tsx`, remain byte-identical.
- Success lifecycle now validates before cache/return; mismatch is structured `response_lifecycle_mismatch` with expected/actual lifecycle. Owner/reducer/page installation revalidate lifecycle for workspace, semantic focus, and distribution, preventing mismatched stale success from restoring linked state.
- Actual-module/static proof passes the degraded-owner/building-success and terminal-owner/usable-success fail-closed cases, no mismatched cache, exactly one correct lifecycle refetch, unchanged matching hit, `0/0`, `1/1`, `0/1`, `0/0` counts, stale-route ignore, writes/Gmail `0`, concurrency `1`, `12/50/200`, preserved lifecycle/polling, TypeScript zero, two-file lint `0/13`, seven-file lint `0/19`, and diff check.
- No build was run; the prior build block remains non-causal, with no `BUILD_ID` and no retry. No runtime, database, Gmail, Supabase, browser, server, transfer, or Git action occurred.
- Classification: Partial Proof; independent read-only source recheck is next. Accepted Fix NO; runtime acceptance REJECT; Playwright and transfer blocked.

#### Independent source/correction recheck — ACCEPT/HIGH; build diagnosis active

- The exact two-file response-lifecycle correction is source-accepted at HIGH confidence: lifecycle mismatch rejects before cache/return and linked installation; degraded-owner/building and terminal-owner/ready cases fail closed; correct lifecycle refetch and matching hit pass.
- Terminal clear/degraded preservation, counts, zero writes/Gmail, concurrency one, bounds, polling, and scope behavior remain PASS. No source findings or verifier writes occurred.
- This is not runtime acceptance or an Accepted Fix. Build proof remains `BLOCKED/HIGH` and non-causal, with no retry. Playwright and transfer remain blocked.
- Active next step: read-only/new-signal build-environment diagnosis comparing environment/process/toolchain, partial `.next`, blocked log, dependency-clone differences, and known successful main-build conditions. No build or source edit; a later recovery build requires a separately propagated, causal hypothesis.

#### Build-environment mechanism — recovery build active

- Root cause: sandbox denial of Node PID `12779` local ephemeral IPC bind (`network-bind local:*:0`) during Next worker-utils `server.listen(0)`, not source/compiler/TypeScript/OOM/crash behavior. The failed build predates the accepted runtime and review hashes and is stale for acceptance.
- Exactly one external-sandbox recovery build is authorized after propagation: frozen hashes, clean candidate-local dependencies, six native binaries byte-identical to original main with persistent provenance recorded as non-causal metadata, stale `.next` preserved to `/tmp`, `/opt/homebrew/bin/npm run build`, hard `180s`, no-progress `60s` abort, no retry.
- Pass only with exit `0`, a non-empty fresh `BUILD_ID`, fresh manifests newer than governed inputs, and sanitized evidence. Abort/no retry on bind denial, source error, or no progress.
- No source edit, runtime acceptance, Playwright, transfer, Git action, deployment, or DB/Gmail/Supabase/artifact action is authorized. Recovery-build outcome must be propagated before any later gate.

#### Recovery-build precheck abort — environment preparation correction

- No build ran and attempt count remains `0`; no `.next`, dependency, or environment mutation occurred. Packet/head/seven source hashes/package manifests/index/unmerged/process/lock checks passed.
- Use canonical default-porcelain candidate fingerprint `e9fc350d28b88335b17bbcb36ff1f7fd74793cee9d262a76f6768fee566ca61d`; supplied `48e3e70e` was wrong provenance. All-untracked and NUL fingerprints are distinct algorithms and are not blockers.
- Candidate `web/.env.local` is absent; original-main ignored `web/.env.local` is the approved existing environment source. Before the one bounded build, verify source existence/ignored status; copy byte-for-byte to candidate without reading/logging values; validate names/presence only; remove it after sanitized evidence capture and never include it in evidence.
- One recovery build remains authorized and unconsumed. Existing external-sandbox IPC, `180s`, `60s`, no-retry, success/abort, and all downstream blocks remain unchanged.

#### Recovery-build precheck abort #2 — provenance gate correction

- Attempt count remains `0`; no build, `BUILD_ID`, build log, environment copy, `.next` move, source/docs/Git, or external mutation occurred. Evidence root is `/tmp/ace048-build-recovery.hr73F1`.
- Canonical `e9fc...` preflight, seven hashes, index/unmerged, manifests, all `880` dependencies, locality, process/lock, and original-main ignored environment presence passed; six candidate native modules are byte-identical to original main.
- Persistent `com.apple.provenance` survived `xattr -d` and byte-identical `cp -X` temporary probe. It is known secondary/non-causal metadata; do not mutate xattrs again.
- Recovery preflight now verifies six native-binary byte identities and records provenance presence rather than requiring its removal. The sole recovery-build authorization remains pending and unconsumed; all other gates remain unchanged.

#### Recovery build PASS — runtime verification active

- One external-sandbox build passed in `21.724s`, exit `0`, `BUILD_ID` `N3LRSG7T4OiDVM8b8_QNf`, with compile, TypeScript, page-data collection, and `63` static pages complete. Required manifests are nonempty/fresh; log SHA-256 is `efc8b2d043a84304ce7a85c796b058cf85f991e12daa53f083a0e8940a0aafe1` under `/tmp/ace048-build-recovery.hr73F1`.
- Seven hashes, `cce016b`, `e9fc350d...`, index/unmerged remain unchanged; stale `.next` preserved, fresh `.next` retained, temporary environment removed, no secret values logged, no process remains.
- This is build proof only. Independent Playwright verification of canonical Protected and governed Marketing parent routes is active; transfer, runtime acceptance, and Accepted Fix remain blocked.

#### Candidate runtime verification BLOCKED/HIGH

- Saved ignored auth and fresh-BUILD_ID server lifecycle passed, but no accepted route opened: Protected cold All is pending, no matrix row ran, ready state NO, post-settle artifacts NO.
- Reviewer blocked navigation because historical reads can reclaim stale builds and persist publication/lifecycle mutation, violating no-mutation/Supabase safety constraints. No request family or Supabase inspection ran; no workaround occurred.
- Missing Proof Blocked; no product runtime verdict. Source ACCEPT/HIGH and build PASS remain valid; runtime acceptance REJECT, Accepted Fix NO, and transfer blocked.
- Continue only through explicit operator risk authorization or safely isolated non-mutating runtime. Active work is handoff/reconciliation planning; `ACE-049` stays queued/inactive.

#### Original-main landing PASS — Git preservation active

- Main/origin/main/live refs/heads/main resolve to `05249103ab23b3d7cbf30cccfa5747fac90616d6`; main is clean with diff-check PASS, unchanged nine runtime hashes, ignored `output/playwright/`, and `275` local ignored proofs.
- Candidate remains detached `cce016b`; cleanup remains `382c9d6` plus exact three local verified corrections. No build, runtime, DB, deploy, merge, rebase, or history rewrite occurred.
- Active packet reconstructs candidate from clean `0524910` main plus exact six-file candidate-vs-main delta, commits cleanup's exact three corrections on existing branch, pushes explicit named branches/commits, then proves parity before any generated-worktree retirement. Mailbox-index route and `gmailWorkspaceContracts.ts` are byte-identical to clean main and must not be copied/committed. No semantic integration or route action.

#### Git preservation PASS — successor preparation active

- Main/live parity is `2ffcae1fdf35ca246a94fc2172bba795f74bd809`; cleanup is preserved/live at `c690dffed054486e7758be344b680ce418a08ee2`; candidate branch is preserved/live at `87632d46891ec6b33eff4278acbc253fc04da77a` with exact six-file parity to `33ad` and excluded-file parity to main.
- Read-only uniqueness audit governs detached `33ad`, `56ab`, `7865`, `95b7`, `9ae2`, `a985`, and `ad0d`. Never delete a dirty or unique worktree; preserve branch/hash state first; no force/reset/history rewrite.
- After audit, prepare formal Claude handoff and root `CLAUDE.md` importing official `AGENTS.md`; first successor assignment is read-only audit. Final reconciliation/commit/push precedes any `ACE-049` activation.
- Semantic integration remains outside main, blocked by mutation-safety and unaccepted hot-file integration proof.

#### Final successor handoff — audit-ready, implementation not ready

- Preserved candidate branch is live `2597caf8a55da22aa4801958e156c2d665641c74` with seven accepted/build-proven files; archival intermediate branch is live `59f6c7a778084ccad4aaa60985a989d807e36af1`; main `2ffcae1f...`, cleanup `c690dffe...`.
- Root `CLAUDE.md` imports `AGENTS.md`; formal handoff and first read-only assignment are authoritative under `docs/00_control_plane/handoffs/`.
- `33ad`, `7865`, `a985`, and CPA `95b7` remain because destructive safety rejected deletion that could discard local variants/proof. Any deletion requires explicit operator authority after audit.
- The exact eight handoff/control-plane documents are live on main at `1caf3b20ff3694146845c1eba016cfae6323fbfd` (`docs: add Claude successor handoff`); local main, `origin/main`, and live remote main are in parity, with main worktree/index/unmerged clean.
- Next: Claude performs the read-only institutional audit. `ACE-049` remains inactive until successor-readiness criteria and final reconciliation are met; no implementation is authorized.

#### Worktree-retirement audit correction — bounded preservation active

- `56ab`, `9ae2`, `ad0d`, and cleanup checkout retired after redundancy proof; refs retained. `ad0d` ignored raw proof/auth files are not Git-recoverable but their outcomes/path summaries are controlled-plane truth; auth was never read.
- Candidate branch needs accepted artifact-store SHA `93ca4df4dae8191830a12c30199807c16bb3a690dbb96cfa04970144d0296375`; exact candidate preservation is seven files, and `33ad` cannot retire before all seven hashes match live branch.
- Archive identical `7865`/`a985` two-file intermediate bytes once on `codex/archive/ace-048-intermediate-lifecycle` from clean main, labeled superseded/non-authoritative; retire only after parity. `95b7` remains for handoff docs.

#### First transfer verifier rejection — historical correction checkpoint

- Independent verifier task `01a00480-e47b-75b1-9509-00e3b751fe15`: REJECT, confidence HIGH. Candidate transfer is prohibited.
- Candidate remains isolated at `/Users/olivercarlin/.codex/worktrees/9ae2/ai-agent-platform`; original main remains untouched by it and passes a fresh production build on Next `16.0.10`, all `63` routes.
- Defects: whole-artifact sender-scope-rollup enumeration; artifact-wide semantic compatibility reconstruction with a cluster-count rather than row-count gate; inconsistent Time Context identity across workspace/distribution/overview; fabricated route success metadata; readiness that can override explicit publication failure/staleness with count/timestamp movement.
- Correction: bound optional rollup enrichment to the current page (`<=200`) and aggregate queried rows (`<1,000`); consume persisted semantic rollups or fail closed; align the three Time Context families on bounded published projections or identical unavailable metadata; forward real publication status/reason/retry/version truth; make explicit freshness/build state authoritative.
- Preserve PASS: zero request/poll `gmail_messages`; bounded O(1) status; `12/50/200`; concurrency one; `10s/15s` jittered visibility-aware terminal polling; no recurring exact counts; no taxonomy, CAS/publication, candidate, orphan, DB, or Gmail mutation.
- At this checkpoint, the seven-file lock and read-only store boundary remained in force. The second rejection below supersedes that target lock with the PM-authorized eight-file boundary.
- No runtime/Playwright or `7d` / `1W` exercise until source re-verification accepts transfer.

#### Second source rejection and final correction lock

- Second independent verifier decision: REJECT/HIGH. Prior whole-loader, persisted-rollup, route-metadata, normal-polling, and O(1)-status corrections remain PASS.
- P0 lifecycle blocker: accepted `build_pending_poll` hydration can still reach selected-cluster cleanup discovery and its raw `100,000`-row mailbox path. Artifact-only mode must propagate through the bootstrap and return pending/unavailable truth.
- Ordering blocker: explicit terminal freshness/build state must precede missing-publication classification in both locked classifiers.
- Time Context blocker: `historical_out_of_inbox` overview must use the shared unavailable helper with normalized identity and publication-derived metadata.
- Store blocker: sequentialize the two rail reads; cap rail/header reads (recommended `<=100`); cap workspace headers `<=100`; cap previews below three per sender; count actual returned rows and fail closed before exceeding aggregate `<1,000`. Exact filters and cache/inflight semantics stay unchanged.
- `gmailArtifactStore.ts` may not change publication, build, CAS, reclaim, orphan, schema, index, or data behavior.

#### Third source rejection and final micro-correction

- Third independent source verifier: REJECT/HIGH. Every previously rejected functional mechanism now PASSes; the remaining failures are concurrency-one and actual-returned-row telemetry truth.
- Snapshot bootstrap currently fans up to seven missing scopes through `Promise.all`. Although the full chain remains below `1,000` rows (maximum `30` queries / `501` rows), concurrency can reach `7` and aggregate query/row telemetry is incomplete.
- Execution previews currently count deduplicated arrays rather than raw Supabase result lengths. Pre-query maximum `901` remains safe; post-query telemetry and guard undercount overlaps.
- Current-pass edit lock is exactly two files: `web/src/lib/runtime/runtimeStateService.ts` and `web/src/lib/integrations/gmail/gmailArtifactStore.ts`.
- Required correction: deterministic sequential snapshot awaits with truthful aggregate query/row telemetry propagated into plan detail and logs; pre-dedup preview result lengths used for actual-returned-row telemetry/guard while deduplicated output counts remain separate.
- Preserve cache, exact-query plus bounded `40`-row fallback, resolution semantics, sequential store reads, `901` pre-query max, output dedupe, exact filters, publication/cache/write mechanics, zero raw mailbox reads, O(1) status, poll/page caps, and all semantic behavior.
- No other source file may change. Runtime, transfer, build, and Playwright remain blocked pending independent source-verifier `ACCEPT`.

#### Transfer-only source gate — ACCEPT/HIGH

- Independent Supabase & Artifact Safety Verifier accepted the exact eight-file candidate for transfer at HIGH confidence.
- This is source acceptance only: Accepted Fix NO; runtime acceptance NO; artifact/DB/Gmail state unchanged and unqueried.
- Proven ceilings: cold bootstrap `30` queries / `501` raw compact rows; preview `901` raw rows; full-chain concurrency `1`; accepted request/poll raw mailbox rows `0`.
- Telemetry is truthful: raw pre-dedup rows, query count, cache hits, and cache misses propagate; `runtime_artifact_query_concurrency=1` covers the complete accepted chain.
- All prior source boundaries remain PASS, including artifact-only reads, persisted semantic rollups, terminal publication precedence, Time Context unavailable parity, O(1) status, bounded pages/polls, and no mutation path.
- Next transfer must be semantic and hunk-preserving across exactly eight files. Whole-file overwrite is prohibited, especially runtime `gmailCleanupWorkspace.ts` and `gmailArtifactStore.ts`, because original main has overlapping later edits.
- Runtime/build/Playwright remain unexecuted at this gate. No `7d` / `1W` or artifact/data action is permitted.

#### Original-main transfer and static/build checkpoint

- Exactly eight locked files transferred through semantic hunks; all final hashes match the accepted candidate. No ninth file or whole-file overwrite.
- Later-main overlap preserved: runtime `gmailCleanupWorkspace.ts` retained prior `+83/-18` plus transfer `+41/-2`; `gmailArtifactStore.ts` retained prior `+45/-2` plus transfer `+243/-77`.
- Six runtime-loader conflicts resolved additively; main request/snapshot behavior remains alongside publication freshness/build/version metadata. Store cache/liveness/publication/CAS/write logic remains preserved.
- Transfer total: `+1439/-1223`.
- Static proof PASS: non-incremental TypeScript; targeted ESLint zero errors/six inherited warnings; full source guard; sequential/bootstrap/pre-dedup fixture guard; diff check; no staged/unmerged entries.
- Fresh original-main production build PASS on Next `16.0.10`, including compile, TypeScript, and `63/63` static pages; build artifact newer than inputs.
- All source load and truth contracts remain preserved. No artifact/DB/Gmail/lifecycle mutation or `7d` / `1W` action occurred.
- Accepted Fix and runtime acceptance remain NO. The active gate is independent Playwright/runtime verification.

#### Post-transfer runtime verifier rejection

- Verdict: REJECT, confidence HIGH. Accepted Fix NO; no Recovery Contract.
- Protected cold All-indexed route authenticated through saved ignored state but never reached ready after `120` samples / about `90s`.
- Visible contradiction: unavailable scope, placeholder totals, no sender rows, and Sender Distribution error coexisted with a refreshed-publication-active claim.
- Both initial heavy inbox-analysis families started concurrently and returned one honest `409 artifact_building` each with `refresh_in_progress` / `building` and both publication versions. Per-family concurrency remained one; these were lifecycle responses, not guard churn.
- Two console errors corresponded to those lifecycle `409`s.
- Mailbox-index poll intervals ranged about `14.2-19.6s`; two exceeded the `15s +/-20%` ceiling.
- Safety PASS: zero request-time raw mailbox rows, artifact concurrency one, no raw endpoint/large read/`5xx`/page error/overlay/duplicate-key warning. Page `12` observed; `30/501`, `901`, and `50/200` remain source-gate proof only.
- Remaining matrix stopped correctly after decisive failure. Proof is local/non-authoritative at the recorded verifier root; server stopped and port closed.
- Next problem class remains runtime behavior constrained by artifact/publication truth. Diagnosis must resolve building-state precedence, linked-surface honesty, cross-family initial concurrency, and poll cadence before any correction.
- Existing eight-file lock is candidate scope only. No implementation target is locked yet; ninth file requires PM rescope.

#### PM-authorized diagnosis/RCT and correction target lock

- HIGH-confidence mechanism: server rejects non-terminal building before serving valid published truth; page coerces building to ready without continuity data; independent workspace/distribution effects overlap; linked surfaces combine ready/refreshed copy with unavailable data.
- Policy: a non-terminal refresh with a valid published version serves only that last published artifact and stays visibly Processing/building with published+building identities. Candidate is never read/displayed and lifecycle is never ready. Terminal or missing-publication states fail closed.
- PM authorizes the ninth file. Exact two-file correction lock:
  - `web/src/lib/integrations/gmail/gmailCleanupWorkspace.ts`
  - `web/src/app/agents/[id]/operations/review/page.tsx`
- No API route, Operations context, runtime client, artifact store, or polling-source edit is justified. Any third correction file requires PM rescope.
- Loader: narrow read-only stable-published-during-refresh pre/post-read allowance for workspace/distribution only; preserve terminal precedence, persisted rollups, and all mutation/publication boundaries.
- Page: continuity phase authoritative; no building-ready coercion; exact-key workspace before distribution; cached matching workspace may enable distribution; terminal/unavailable workspace suppresses distribution with shared reason; preserve ownership/generation and add no retries/pollers/queue/family.
- Load: cold maximum one workspace then one distribution; overall heavy concurrency one; recurring heavy requests zero; raw mailbox rows zero; existing row/page ceilings preserved.
- Poll code stays out of scope. Verify completion-relative `12-18s` cadence with deterministic timers and live response-end timing, plus hidden cancel and terminal stop.
- Historical pre-Gate-1 state: runtime acceptance remained REJECT/HIGH and actual-effect verification was required. That verification has now run and is superseded by the diagnosis gate below.

#### Candidate source state and transfer-gate proof rejection

- The PM-authorized two-file correction exists only in `/Users/olivercarlin/.codex/worktrees/33ad/ai-agent-platform`; original main remains unchanged by it.
- Candidate patch surfaces remain exactly integration `gmailCleanupWorkspace.ts` `+59/-6` (`c9252699...`) and `review/page.tsx` `+255/-29` (`32fa8f5d...`). No third source file is authorized.
- Independent source review passed terminal/default/missing precedence, four stable-published read-only opt-ins, identity and persisted-rollup guards, terminal linked-state clearing, normal workspace-then-distribution ordering, and absence of new retries/polls/queues/families or mutation/raw weakening.
- Transfer-only verdict is REJECT/HIGH because polling and orchestration fixtures did not execute the actual React effects. They substituted source-string matching, arithmetic, pure-gate mappings, and hard-coded outcomes for the real effect dependencies, requests, ownership/cache, stale-response, visibility, and terminal behavior.
- `Missing Proof Type: Obtainable`. No source implementation defect is proven and no correction may begin from this verdict.
- Rapid switching remains a runtime risk to measure because deferred overview workspace requests are not effect-aborted and single-flight is cache-key scoped.
- Historical planned gate: candidate-runtime proof. It returned `REJECT/HIGH` and now requires the read-only diagnosis/RCT recorded below; no transfer branch remains active.

#### Candidate actual-effect Gate 1 — REJECT/HIGH; read-triggered reclaim

- Protected cold All on the isolated candidate authenticated and settled far enough to execute the actual request path.
- One ostensibly read-only workspace request triggered hidden stale-build reclaim inside the application. Proof-time server telemetry captured `event=reclaimed_stale_build`, then `building_version_after=null`, `freshness_state_after=refresh_failed`, and `job_status_after=failed`.
- This records only the observed transition during proof. No claim is made about current database state.
- The verifier invoked no write control and made no direct Supabase query. The application read path performed the unexpected live publication/job mutation.
- Workspace returned one `503 artifact_unavailable`; distribution correctly remained at zero requests.
- UI retained stale pre-transition Processing copy and obsolete published/building identities while totals were placeholders, rows were zero, and distribution failed. This linked lifecycle installation is a separate active defect surface.
- Observed safety positives: accepted-heavy peak one; workspace page `12`; artifact rows `50`; raw mailbox rows zero; artifact concurrency one; no raw Gmail/large read, `409` churn, page error, overlay, or duplicate-key warning. One console error mapped to the `503`.
- Later matrix rows and polling behavior were not run after decisive Gate 1 failure. The proof bundle is local/non-authoritative at `/Users/olivercarlin/.codex/worktrees/ad0d/ai-agent-platform/output/playwright/ace048-candidate-actual-effects/.playwright-cli/runtime-proof/`.
- Candidate and original-main tracked source/build/status/HEAD invariance passed; server stopped and port closed.
- Preserve the two-file candidate as unaccepted but valuable. The newly discovered safety seam blocks transfer; it does not prove the candidate wholesale incorrect.
- Historical post-verifier requirement, now completed below: PLAN MODE diagnosis had to return the exact mutation call chain, observation-versus-maintenance contract, terminal/UI post-response lifecycle contract, and exact correction file/route target lock.

#### Source diagnosis/RCT — COMPLETE/HIGH; execution target locked

- Exact mutation chain: workspace request -> integration loader -> bounded published page loader -> `loadPublishedSenderWorkspaceArtifactHeaders` -> automatic `reconcileGmailArtifactBuildLiveness` -> reclaim publication CAS update + failed-job upsert + cache/telemetry.
- Sender distribution, confirmation preflight, and whole/page/focused/key/execution read loaders inherit the same mutation seam.
- Observational alternatives are source-proven: mailbox-intelligence request callers do not opt into reconciliation, `runtimeStateService` passes false, mailbox-index GET is observational, and explicit maintenance reconciliation exists in post-Smart-Sync planning and `gmailArtifactIncrementalUpdater`.
- Governing policy: request/poll readers write zero database rows; reclaim exists only behind explicit governed maintenance; a failed replacement candidate does not invalidate a usable matching published version.
- Publication outcomes are locked: ready; building with published continuity and `15s` retry; degraded usable with terminal no-retry copy; unavailable for stale/full-rebuild-required, missing terminal, or identity mismatch; missing+building remains `409` without data. Candidate rows never display and degraded is never ready.
- UI root cause spans runtime rehydrate, terminal context clearing, success/cache lifecycle preservation, current-generation page lifecycle installation, and linked-surface clearing/rendering.
- Exact seven-file correction lock:
  - `web/src/lib/integrations/gmail/gmailArtifactStore.ts`
  - `web/src/lib/integrations/gmail/gmailCleanupWorkspace.ts`
  - `web/src/app/api/integrations/gmail/inbox-analysis/route.ts`
  - `web/src/lib/runtime/gmailCleanupWorkspace.ts`
  - `web/src/lib/runtime/runtimeStateService.ts`
  - `web/src/components/runtime/OperationsRuntimeContext.tsx`
  - `web/src/app/agents/[id]/operations/review/page.tsx`
- Preserve and amend the existing isolated two-file candidate. Out of scope: mailbox-index route, incremental updater, schema, taxonomy/resolver, CAS publication, builders, data cleanup, and any eighth production file.
- Static current-module proof precedes runtime proof. If a committed test/source file is needed for the callsite guard, stop and return to PM.
- Load after correction: request/poll writes zero, raw mailbox rows zero, workspace then distribution, heavy concurrency one, `12/50/200`, cold `<=30/501`, O(1) visible single-flight terminal polling, no new family.
- Accepted Fix remains NO; transfer remains blocked; no Recovery Contract.

#### Seven-file candidate implementation checkpoint — LANDED; Executor proof PASS

- The prior integration `+59/-6` and review-page `+255/-29` diffs were pre-existing rejected-attempt baselines and were treated as suspect, not proof.
- Current pass changed exactly seven locked files, `+1133/-351`; candidate-versus-original total is `+1335/-274`; no eighth source/test file.
- Final hashes:
  - artifact store `93ca4df4dae8191830a12c30199807c16bb3a690dbb96cfa04970144d0296375`
  - integration workspace `4a81deee7eef7c7c3c5f5778ced2e15aa0e6bf3a2f0b0a38f80adff783ae8c52`
  - inbox-analysis route `47caea42dc90dcb9206bfd2169dc27c586cd87d5e8e2d1bc8b857605e561b6ec`
  - runtime client `88bd5329bd0ade01841b4c8a707cdc186a8335660b41b70ab16166f8d39a44bc`
  - runtime state `ea5cfb0b1565d37f3a1301f56ebb3671b9349fe58dcfcfa69427619da77196ed`
  - Operations context `1ee095f3a5fc80be153f0ad405d14022bcba0d94b2de1045921a7d6ae76ab9f0`
  - review page `a8467bfbb3382a2c24a029664d17c6d50674f0fb5a9b55bbbfc1f3871853bc65`
- Implementation establishes observational published reads; exact ready/building/degraded/unavailable truth; matching-published-only continuity; cache-v2 metadata; `degraded_usable`; terminal context clearing; current-identity/generation page installation; shared workspace-first distribution gating; exact degraded copy.
- Load remains request/poll writes zero, raw mailbox rows zero, cold `1+1`, cached `0+1`, unavailable distribution zero, heavy concurrency one, recurring heavy inbox-analysis zero, `12/50/200`, and completion-aware visible single-flight terminal polling `12-18s`.
- Executor actual-module fixtures PASS, TypeScript PASS, exact seven-file ESLint zero errors/19 warnings, diff check PASS, and one fresh Next build PASS (`63` pages).
- Proof scripts remain local/non-authoritative under `/tmp/ace048-seven-file.J9yiND/`; no runtime/browser/DB/Gmail/artifact action occurred.
- Candidate HEAD remains detached `cce016b`; index/unmerged empty. Candidate fingerprint is `c63ee0b...`; unrelated external control-plane/Playwright status churn requires verifier re-preflight. Main and cleanup locked source states remain unchanged.
- Active gate is independent source/correction verification. Accepted Fix NO; runtime acceptance remains REJECT; transfer blocked; no Recovery Contract.

#### Independent source/correction verifier — REJECT/HIGH; three-file correction locked

- Read-purity, reconciliation authority, publication truth tables, taxonomy, request/load ceilings, TypeScript, seven-file lint, and diff integrity independently PASS and remain regression boundaries.
- Build identity is missing because `.next` was cleaned. A verifier build attempt was blocked before compile by missing candidate-local dependencies; this is non-causal blocked proof. Rebuild only after correction with a known working dependency setup.
- Terminal clearing defect: context maps terminal unavailable to ambiguous null, retains prior persisted/status data, and can leave linked stale truth visible.
- Lifecycle cache/ownership defect: ten-minute runtime cache is keyed without lifecycle identity; same-key building can outlive newer degraded/unavailable truth. Distribution reuse/dependencies and banner precedence also omit or override newer lifecycle identity.
- Exact micro-correction lock:
  - `web/src/lib/runtime/gmailCleanupWorkspace.ts`
  - `web/src/components/runtime/OperationsRuntimeContext.tsx`
  - `web/src/app/agents/[id]/operations/review/page.tsx`
- Preserve byte-identically:
  - `web/src/lib/integrations/gmail/gmailArtifactStore.ts`
  - `web/src/lib/integrations/gmail/gmailCleanupWorkspace.ts`
  - `web/src/app/api/integrations/gmail/inbox-analysis/route.ts`
  - `web/src/lib/runtime/runtimeStateService.ts`
- Correction contract: lifecycle-aware existing-cache admission/eviction; explicit terminal unavailable and atomic persisted/in-memory/linked clearing; `degraded_usable` preservation; lifecycle identity in distribution reuse/ownership/dependencies; newest runtime terminal/degraded banner precedence; no heavy refresh, retry, or new family.
- Exact seven hashes and source remain unchanged at this checkpoint. Main and cleanup remain unchanged. Verifier made no tracked/source edit; only ignored partial `.next` diagnostics remain without `BUILD_ID`.
- Accepted Fix NO; runtime acceptance remains REJECT; Playwright and transfer blocked; no Recovery Contract.

#### Three-file correction implementation checkpoint — Partial Proof / Blocked Build Proof

- Candidate remains detached `cce016b` with fingerprint `e9fc350d28b88335b17bbcb36ff1f7fd74793cee9d262a76f6768fee566ca61d`.
- Current-pass hashes: runtime client `0bab929d63144e95bc11c00c74a69e130d4b144a4607adec1cf4ec5c2c2196a5`; Operations context `1edac4904e43c661645dba6dd7f1e87af57c25aea1e5a40f734cde82cea514b8`; review page `99862dedec6bb8e5c0324101858c6651f51657da8c7c924c23624a65cdab5bf1`.
- Other four locked files remain byte-identical. The correction preserves lifecycle-aware cache/inflight ownership, explicit atomic terminal clearing, degraded published-data preservation, lifecycle-keyed page reuse/owner/effects, linked UI/Decision Mode clearing, and newest runtime lifecycle precedence.
- Actual-module/static evidence PASSes all declared transition, request-count, polling, raw Gmail/write/concurrency, type, lint, and diff checks. Local fixture `/tmp/ace048-return.rrBRmq/ace048-return-fixture.cjs` is non-authoritative.
- One build attempt hung without output after `Creating an optimized production build`, was stopped after six minutes for cost control, returned exit `130`, and left no `BUILD_ID`; no retry occurred. The log and partial `.next` remain non-authoritative.
- Historical checkpoint next step: source recheck and build-proof classification. It is superseded by the recorded source `ACCEPT/HIGH`; the active step is the separately scoped read-only/new-signal build-environment diagnosis. No Playwright, transfer, Supabase access, or build retry by default.

Sequence-change rationale:
- Shared and hot files evolved in both refs.
- Performing privileged-route hardening before integration would increase semantic conflict risk and could duplicate or overwrite security work.
- Therefore cleanup integration and its post-integration acceptance gate must complete before privileged-route hardening begins.

### Cleanup lineage integration contract

- Freeze and preserve both refs before inventory or integration begins.
- Inventory cleanup-only and materially differing work from the merge base before selecting integration packets.
- Classify behavior seam-by-seam through explicit comparison; do not classify by branch age or blanket preference.
- Integrate only through bounded packets with locked files, behavior objectives, regression boundaries, and targeted verification.
- Do not perform a blind full merge, blanket conflict resolution, broad overwrite, branch deletion, or worktree deletion.
- An individual item may be marked superseded only when explicit comparison proves that classification and preserves any still-valuable behavior or evidence.
- The cleanup worktree must remain preserved until the integration program reaches explicit, verified closeout under Oliver's authority.
- Historical comparison baseline: `84` total / `47` identical / `37` disposition paths / `17` textual conflicts. It is now stale after the three verified cleanup corrections and must be recomputed before integration.
- Sender-distribution seams begin from cleanup feature intent; later unrelated main evolution is reconciled around that intent through semantic union.
- PM discovery and the revised integration brief must load repository, Git-history, Markdown, and authoritative control-plane evidence from both worktrees.
- Mandatory staged verification:
  1. start and verify `main` before integration with terminal health and Playwright CLI
  2. start and verify `cleanup-taxonomy-rebuild` before integration with terminal health and Playwright CLI
  3. execute preservation-first semantic integration through bounded packets
  4. start and verify the integrated app with terminal health and Playwright CLI against accepted surfaces
- Shared hot files require dedicated semantic integration; blanket `ours` / `theirs` resolution is prohibited.
- PLAN MODE remains mandatory until a complete PM Brief, locked file/seam manifest, exact runtime targets/routes, rollback posture, and verification contract are approved.
- Privileged-route hardening must not run concurrently with integration.
- Git-history remediation is a separate security program and must not be mixed into integration.

### Initial pre-integration baseline gate — both FAILED; current aggregate gate remains blocked by main

- Merge execution is BLOCKED.
- Main (`/Users/olivercarlin/Dev/ai-agent-platform/web`, `http://localhost:3000`):
  - lint FAIL; fresh build PASS (`63/63`); production start PASS and clean stop
  - authenticated UI remained partially broken: dashboard metrics loading; Sender Distribution unavailable on protected and Marketing review surfaces
  - runtime artifact state remained `refresh_failed` / `failed`
  - verdict FAIL, confidence HIGH
- Cleanup initial baseline (`/Users/olivercarlin/Dev/ai-agent-platform-cleanup-taxonomy-rebuild/web`, `http://localhost:3001`):
  - lint FAIL (`267`: `226` errors / `41` warnings)
  - fresh build FAIL at `web/src/app/agents/[id]/operations/review/page.tsx:934` on invalid async union return typing
  - production start blocked; bounded dev proof later blocked by clusters timeout
  - verdict FAIL; cleanup worktree remained source-clean
- Authoritative non-secret proof:
  - `/Users/olivercarlin/Dev/ai-agent-platform/output/playwright/ace048-cleanup-integration/main-pre/`
  - `/Users/olivercarlin/Dev/ai-agent-platform/output/playwright/ace048-cleanup-integration/cleanup-pre/`
- Sensitive ignored auth contexts:
  - `/Users/olivercarlin/Dev/ai-agent-platform/output/playwright/ace048-cleanup-integration/main-pre/.playwright-cli/main-auth-state.json`
  - `/Users/olivercarlin/Dev/ai-agent-platform/output/playwright/ace048-cleanup-integration/cleanup-pre/.playwright-cli/cleanup-auth-state.json`
  - never commit; delete when the integration flow closes
- No source, database, deployment, merge, stage, commit, push, or cleanup-lineage mutation occurred.

### Semantic archaeology baseline — historical and stale

- `84` cleanup paths: `47` byte-identical and `37` requiring disposition.
- Dispositions: `8` cleanup-unopposed, `7` cleanup-only, `22` both-changed.
- `17` textual conflicts; `5` auto-merges still require semantic review.
- Classification: `hot_file_integration_required`.
- Approved semantic-union waves: safety/baseline -> identity/contracts -> candidate/publication mechanics -> artifact-backed reads -> tooling -> UI -> final verification/propagation.
- This manifest is preserved historical discovery truth only. The corrected cleanup working tree invalidates it as a current integration manifest; recomputation is mandatory before implementation.

### Diagnosed correction mechanisms

- Cleanup — HIGH confidence:
  - `8` TypeScript errors are isolated to `review/page.tsx` and `inboxAnalysis.ts`
  - required fixes: named Promise result union with separated cancellation/abort/`ok` narrowing; exhaustive `GmailCleanupExclusionReason` label map
  - two cleanup-owned targeted lint errors in `gmailArtifactStore.ts` require a generic query constraint, not `any`
  - other `224` broad lint errors remain historical non-lineage debt
  - clusters timeout remains unresolved and must be retried after compile correction before any runtime fix
  - cleanup correction lands on cleanup first; original head `382c9d6` remains immutable; recompute `37` / `17` afterward
- Main — HIGH confidence mechanisms:
  - intentional `409 initial_paint_live_fetch_disabled` is converted into terminal UI error because machine-readable response metadata is discarded
  - active rail readiness is derived from Time Context rather than selected tab/current request key
  - artifact reader may accept failed publication/partial seeds; publisher may publish after row-count errors
  - exact data mismatch remains unknown pending metadata inspection
- Dashboard — separate HIGH-confidence defect:
  - direct browser Supabase queries are non-abortable across navigation and conflate profile/metric transport failures
  - admin/global dashboard endpoint must not be reused without authentication and tenant scope

### Correction contracts

- Preserve inbox-analysis status/reason/retry metadata as machine-readable state.
- Cold paint uses artifact-only truth or one bounded deferred post-ready request; zero known-rejected requests.
- Sender Distribution readiness requires selected-tab/current-key parity-complete truth or genuine-empty state.
- Loader returns structured `artifact_incomplete` on header/unique-seed mismatch with one bounded fallback and no mixed universe.
- Publication gate requires successful counts, header/seed parity, and required snapshot/header; prior immutable publication survives failure.
- Load ceiling: cold `1` workspace + `1` serialized/deferred distribution, scope switch `1` each per new key, zero guard `409`, no duplicate heavy key, no mailbox polling.
- Dashboard uses abortable queries, suppresses cancelled logging, and separates profile/metric errors.
- Changed lineage files require zero lint errors; broad historical lint debt remains out of scope.

### Read-only Supabase seam lock — complete

- Project `cjpjekhlvzwjwtszqpmy`; canonical agent `d256b48e-5acf-4b3d-af22-003d52e7e582`.
- Correct tenant resolution is `profiles.id = agents.user_id` -> `profiles.tenant_id`; the initial user-id-derived zero-row query was a diagnostic false assumption, not a defect.
- Counts: `6` publications, `341` jobs, `2,291` seed headers, `581,774` seed rows, `302` snapshots, `2,291` cluster summaries.
- All active published artifacts pass header/row sender parity, message-count parity, header-row presence, cluster-summary parity, and single-snapshot checks.
- `all_indexed full-mailbox-20260415024237593`: `13` headers/summaries, `9,846` projected rows, `4,923` distinct global senders; overlapping structural/semantic rows are valid.
- Selected universes are valid: protected/trusted `1,844`, Marketing `857`, overlap `0`.
- Main defect is selected-cluster keys compared with the `4,923` global universe, producing a false incomplete-distribution UI error.
- The earlier published `all_indexed` version is internally consistent despite later `failed` / `refresh_failed` metadata.
- `7d` lifecycle is separately orphaned: `full-mailbox-20260412003307051` remains building/running in `projecting_sender_scope`, no heartbeat since 2026-04-12, zero processed counts.
- Sender-workspace artifact reads bypass liveness reconciliation and can preserve stale lifecycle truth indefinitely.
- No database values changed and no sensitive material was surfaced.

### Locked main contracts

- A — selected-universe/UI truth:
  - selected distribution validates against selected-cluster keys, not global keys
  - global parity is limited to global-universe surfaces
  - readiness derives from active selected tab/current request key
  - valid published data remains usable while refresh-failure metadata is shown separately
  - zero known-rejected initial-paint POSTs and bounded request counts remain mandatory
- B — lifecycle:
  - all build/freshness read paths reconcile liveness through one bounded single-flight seam
  - CAS reclaims stale/dead locks without mutating healthy work
  - verify orphaned-`7d` transition and final steady state
  - code correction first; no production DB cleanup without separate authority

### Cleanup baseline correction — PASS

- Worktree: `/Users/olivercarlin/Dev/ai-agent-platform-cleanup-taxonomy-rebuild`.
- Exactly three uncommitted correction paths: `review/page.tsx`, `inboxAnalysis.ts`, and `gmailArtifactStore.ts`; `30` insertions / `18` deletions.
- Correction mechanisms match the approved cleanup contract: named Promise result union and split narrowing, exhaustive typed exclusion map, generic same-query-type CAS typing.
- Static proof: TypeScript PASS; targeted three-file ESLint PASS with zero errors and ten pre-existing warnings; fresh build PASS (`62` pages); diff check PASS.
- Production/browser proof at `http://localhost:3001`: PASS, confidence HIGH, verifier ACCEPT for cleanup baseline repair only.
- All seven routes settled; prior clusters timeout did not recur; Protected and Marketing review surfaces rendered their intended truth.
- No console/page/overlay/duplicate-key errors, guard churn, polling, overlapping heavy family, or mutating operation.
- Proof bundle: `/Users/olivercarlin/Dev/ai-agent-platform/output/playwright/ace048-cleanup-integration/cleanup-post-correction/` — ignored/local, not authoritative runtime context.
- Original head `382c9d6` remains immutable archaeological reference.
- Broad historical lint debt remains separate under differential no-new-error policy; repository-wide lint is not clean by implication.
- This verifier acceptance is baseline proof only, not a new Accepted Fix or Recovery Contract.

### First Main Contracts A/B verification — historical REJECT

- Current implementation touches exactly three authorized runtime files atop the prior `82` paths: `review/page.tsx`, runtime `gmailCleanupWorkspace.ts`, and `gmailArtifactStore.ts`.
- Static gates: TypeScript PASS; targeted ESLint `0` errors / `13` old warnings; fresh build PASS; diff check PASS.
- Contract B: PASS through a current-source in-memory FakeSupabase harness with bounded single-flight and CAS behavior; no network or database mutation.
- Contract A partial PASS surfaces: Protected cold All indexed (`1,844` bars), Marketing cold All indexed (`857` bars), Protected `1M -> 1Y` (`366` bars), Protected `1Y -> All` (`1,844` bars), structured metadata fixture, and incomplete cached-universe rejection/refetch.
- Contract A decisive FAIL: Protected `All -> 1M` reached active `30d` / `1M`; both workspace and distribution requests returned `200`, but after about `120s` / `117` samples the rail remained loading and retained stale `1,844` All-indexed bars. Ready-state was never satisfied.
- Locked remaining defect: the successful `30d` distribution response is not committed or recognized for the active request key; stale prior-scope success remains visible under loading.
- Accepted flow: four distribution plus four workspace POSTs, all `200`; zero initial-paint requests, `409`, polling, guard churn, or console/page/overlay errors.
- Proof: `/Users/olivercarlin/Dev/ai-agent-platform/output/playwright/ace048-cleanup-integration/main-contracts-post-correction/` — untracked/local, non-authoritative, and must not be committed.
- Overall verifier decision: REJECT, confidence HIGH. This is not an Accepted Fix and creates no Recovery Contract.

### First Contract A diagnosis and execution translation — historical, implemented

- Exactly one workspace and one distribution request returned `200`; authoritative `30d` distribution and complete-key workspace results were both empty.
- Root cause: same semantic request-key rerenders changed mutable workspace/expected-key inputs by identity, cancelling the only generation. Replacement work misread orphan `loading` as a live owner, while the valid response populated cache but could not visibly commit.
- Exact correction file: `web/src/app/agents/[id]/operations/review/page.tsx` only.
- Runtime `gmailCleanupWorkspace.ts` and `gmailArtifactStore.ts` are invariant-only and must not be edited by this correction.
- Lifecycle identity: `agentId + senderDistributionRequestKey`; mutable same-key plan inputs move to refs.
- Ownership: lifecycle key plus monotonic generation; loading suppresses work only with a live owner; orphan loading reattaches through existing per-key inflight deduplication.
- Commit rule: only matching active lifecycle key/generation commits visibly; superseded work may cache but cannot overwrite; cleanup invalidates only its own generation.
- Prior data may seed loading but cannot make a new scope ready. No new retry, interval, polling, expected-key hashing, or broad dependency deletion.
- Load contract: settled and cached revisit `0/0`; new uncached key maximum `1+1`; same-key replay one underlying request; rapid `30d -> 365d` cannot visibly overwrite; zero accepted-path `409`/polling.
- Proof contract: optional temporary deterministic ownership fixture, then focused post-settle Protected `All -> 1M`, `1M -> 1Y`, `1Y -> All`, cold Protected, and cold Marketing verification with State Transition Matrix and request traces. Contract B gets diff/invariant review only if its files remain unchanged.

### Contract A second verification — historical REJECT; ownership correction partial only

- The first ownership/generation correction removed stale `1,844` bars and orphan loading from `All -> 1M`; this is partial improvement, not an Accepted Fix.
- Protected cold All passed ready with `1,844` bars.
- Protected `All -> 1M` failed as `unavailable_scope`: both authoritative `30d` workspace and distribution requests returned one `200` and zero senders, but the UI presented incomplete-authority error instead of ready authoritative-empty truth.
- `1M -> 1Y`, `1Y -> All`, and Marketing cold are BLOCKED by the bounded stop after decisive failure.
- Load/error proof: zero initial-paint requests, `409`, polling, retries, console/page errors, overlays, or duplicate-key warnings.
- Contract B remains prior PASS and was not rerun. Cleanup remains PASS.
- Main HEAD `cce016b`; visible status path count `120`; no merge/rebase/cherry-pick. Server stopped and port `3000` closed.
- Proof: `/Users/olivercarlin/Dev/ai-agent-platform/output/playwright/ace048-cleanup-integration/main-contracts-return-verification/.playwright-cli/return-proof/` — ignored/local, non-authoritative, and must not be committed.
- Overall verifier decision remains REJECT, confidence HIGH. No Accepted Fix or Recovery Contract.

### Authoritative-empty selector correction contract — implemented and accepted

- Root cause: the shared key selector skips an exact empty active-scope workspace and falls through to All-indexed fallback keys; valid empty `30d` distribution is then compared against stale keys and misclassified incomplete.
- Source seams: `review/page.tsx:9129-9147`, `9696-9713`, `10214-10220`, and `10249-10258`.
- Only authorized file: `web/src/app/agents/[id]/operations/review/page.tsx`.
- Preserve exact empty active-scope authority; All-indexed data is continuity-only while the new pair is in flight.
- Ready+empty workspace/distribution must resolve shared workflow, distribution, sender rows, and Decision Mode to one zero-sender universe with visible empty-state copy.
- Preserve one workspace plus one distribution per uncached semantic key, cached All return without a new distribution request, and zero polling/retry/`409`.
- No runtime/store, dashboard, database, cleanup, integration, `7d`, or `1W` action.

### Contracts A/B accepted-fix closeout — ACCEPTED

- Candidate consists of the first ownership/generation correction plus the second authoritative-empty selector correction.
- Five-row State Transition Matrix: PASS with two stable ready samples and post-ready confirmation per row.
  - Protected cold All: `1,844` ready bars with linked senders.
  - `All -> 1M`: authoritative-empty ready; all linked sender surfaces and Decision Mode queue resolve to zero without error/loading/`unavailable_scope`.
  - `1M -> 1Y`: `366` ready bars with linked senders.
  - `1Y -> All`: `1,844` ready bars; cached return generated zero new heavy requests.
  - Marketing parent cold: exact parent, no invented subset, `857` ready bars with linked senders.
- Load: one workspace plus one distribution per uncached semantic key; cached All return `0/0`; `initial_paint=0`; `409=0`; no polling, retries, POST failures, console/page errors, duplicate-key warnings, or overlays.
- `21` aborted GET RSC/prefetch requests were harmless and non-interfering.
- Contract B hashes unchanged and remains PASS without a full harness rerun. Cleanup remains PASS.
- Fresh authenticated production proof ran at `localhost:3000`; no operator assist; server stopped and port closed.
- Main HEAD `cce016b`; visible status paths `120`.
- Proof: `/Users/olivercarlin/Dev/ai-agent-platform/output/playwright/ace048-cleanup-integration/main-contracts-return-verification/selector-correction/.playwright-cli/return-proof/` — ignored/local and non-authoritative; do not commit.
- Oliver provided explicit Human Review acceptance and authority to proceed on 2026-08-15.
- Recovery Contract: `CHANGELOG.md` -> `August 15, 2026 — ACE-048 Main Contracts A/B Sender-Distribution Scope Truth Accepted`
- Accepted scope is the Contracts A/B correction only; Dashboard, Gmail health, overall main baseline, and integration are not accepted or complete.
- Overall main integration baseline remains blocked by the semantic-artifact/load-safety decision gate and the separate Dashboard baseline failure; integration remains blocked.

### Next executable step

- After byte-exact propagation, run exactly one external-sandbox recovery build in the authoritative runtime packet.
- Freeze hashes; preserve stale `.next` to `/tmp`; use clean candidate-local dependencies; verify six native binaries byte-identical to original main and record persistent provenance as non-causal metadata; execute `/opt/homebrew/bin/npm run build` with hard `180s` and no-progress `60s` abort. Do not edit source.
- No database, Gmail, artifact, browser/server, `7d` / `1W`, transfer, integration, merge, history, or deployment action.
- Propagate the recovery-build result before any later gate. Dashboard remains later and blocked.
- Recompute the complete dual-worktree manifest against the corrected cleanup working tree under cleanup sender-distribution feature authority, then author the staged semantic-integration PM Brief.
- Integration remains blocked until the artifact/load-safety plan and candidate disposition, Dashboard/main baseline, and revised manifest/PM Brief gates resolve.
- No database cleanup, `7d` / `1W`, deployment, merge, commit, push, or Git-history credential action is authorized by this propagation.
- Do not create an integration branch or safety commit, merge, cherry-pick, resolve conflicts, start route hardening, or begin history remediation until both baseline gates pass or Oliver changes the gate.

### Historical boundary

- All state below this section is preserved as pre-revival historical context.
- Legacy `Active` labels below do not govern execution unless explicitly re-adjudicated under `ACE-048`.
- Accepted Recovery Contracts remain valid historical recovery memory.
- `ACE-011` remains closed historical context.

---

## 🚀 April 16 — ACE-047 Time Context Rebuild Active

### Current governing state

- `ACE-047` is now the active governing Time Context lane.
- Time Context is now under a controlled phased rebuild.
- Time Context execution is now spec-driven:
  - behavioral truth = `TIME_CONTEXT_SPEC.md`
  - execution sequencing = `TIME_CONTEXT_REBUILD_PHASED_EXECUTION_PLAN.md`
- No further Time Context implementation may proceed outside the defined phased rebuild.
- Active phase:
  - Phase 2 — Scope Semantics Lock
- Phase 1 — Runtime Safety / Churn Containment is accepted and complete.
- Runtime surface is stable.
- No request churn.
- Safe to proceed with Time Context post-settle semantic verification.
- Runtime READY blocker is resolved on the canonical protected-trust review route.
- Runtime snapshot attachment is no longer the active blocker for Phase 2 verification.
- Phase 2 remains active; the next step is final post-settle verification, not new implementation.
- Historical continuity remains preserved:
  - prior `ACE-046` runtime request-flood stabilization remains accepted historical truth
  - accepted runtime continuity, Smart Sync handoff, guardrail enforcement, and Time Context scoped-state rebuild remain preserved and must not be reopened without new canonical-route evidence
- The runtime continuity sub-layer under `ACE-046` is now accepted and complete for build-liveness reconciliation before build-pending continuity emission.
- `ACE-045` is now accepted and complete as the Operations Review hero/layout hierarchy cleanup.
- `ACE-044` remains accepted and complete as the Sender Distribution `All indexed` reconciliation cleanup.
- `ACE-043` remains accepted and complete as the coverage / backfill display contract cleanup.
- `ACE-042` remains accepted and complete as the Time Context render-authority and scope-unification contract.
- `ACE-040` remains accepted and complete as the Smart Sync continuity + UI stabilization contract.
- The current system state is:
  - Time Context phased rebuild lane is active
  - Phase 2 scope semantics lock is the active execution focus
  - accepted runtime continuity containment remains stable
  - stable runtime / Smart Sync continuity layer
  - stable Time Context render authority layer
  - stable coverage / backfill display contract layer
  - stable Sender Distribution `All indexed` reconciliation layer
  - stable Operations Review hero/layout hierarchy
  - stable Analysis Rail request-discipline historical baseline
  - stable runtime continuity build-liveness reconciliation layer
  - stable Smart Sync -> artifact rebuild handoff layer
  - stable runtime guardrail enforcement layer
  - stable runtime request-flood containment layer for build-pending and failed-artifact rehydrate paths
  - no further implementation may proceed outside the active defined rebuild phases

### Execution status

- `ACE-047` is now the active governing next lane.
- Phase 1 — Runtime Safety / Churn Containment is accepted and complete.
- Phase 2 — Scope Semantics Lock is explicitly active.
- Phase 1 accepted-fix closeout:
  - eliminated mailbox-index poll loop caused by stale `active_run` gating
  - runtime now polls only when `execution_state === 'running'`
  - cold load, scope switching, and idle now operate with zero unnecessary churn
- Recovery Contract: `CHANGELOG.md` -> `April 16, 2026 — Phase 1 Runtime Safety Fix`
- Runtime READY unblock accepted-fix closeout:
  - canonical protected-trust review route reaches READY within the locked protocol window
  - baseline runtime snapshot attaches without blocking on heavy selected-cluster bootstrap
  - `rehydrate_only` now returns enough same-scope baseline rail truth for route readiness while heavy rail hydration remains deferred
- Recovery Contract: `CHANGELOG.md` -> `April 16, 2026 — ACE-047 Runtime READY Unblock Accepted`
- `ACE-045` remains accepted and closed:
  - `Sender Review Goal` is restored inside the dark hero directly under the KPI cards
  - `Smart Sync continuity` remains outside the hero
  - `Page Truth Guide` remains outside the hero
  - Recovery Contract: `CHANGELOG.md` -> `April 9, 2026 — ACE-045 Operations Review Hero/Layout Cleanup Accepted`
- accepted `ACE-044`, `ACE-043`, `ACE-042`, and `ACE-040` remain stable historical fixed truth and must not be reopened without new canonical-route evidence
- `ACE-041` remains active unchanged as the control-plane execution-efficiency layer and does not govern product-lane scope.

### Next executable step

- Rerun Phase 2 final post-settle verification on the accepted route using the locked verification protocol.
- Objective:
  - prove post-settle `all_indexed` monthly chart truth on the accepted route
  - execute the locked scope loop only after READY is reached
  - confirm bucket counts, current-month visibility, and cross-scope parity under the post-settle protocol
- Scope:
  - Phase 2 verification only
  - canonical protected-trust review route
  - locked post-settle verification protocol
- Constraints:
  - preserve the accepted Phase 1 stable runtime surface
  - preserve the accepted runtime READY unblock
  - do not reopen runtime churn containment
  - do not implement new semantics during verification
  - do not move beyond the active rebuild phase
- Preserve accepted historical runtime stabilizations and scoped-state fixes while Phase 2 semantics work proceeds.

---

## 🚀 April 8 — ACE-043 Coverage / Backfill Display Contract Cleanup Accepted

### Current governing state

- `ACE-043` is now accepted and complete as the Analysis Rail coverage / backfill display contract cleanup on the Operations Review page.
- `ACE-042` remains accepted and complete as the Time Context render-authority and scope-unification contract on the Operations Review page.
- `ACE-040` remains accepted and complete as the stable Smart Sync continuity + UI stabilization contract.
- The current system state is:
  - stable runtime / Smart Sync continuity layer
  - stable Time Context render authority layer
  - stable coverage / backfill display contract layer
- `ACE-043` accepted scope:
  - removed visible `1970` / epoch fallback leakage
  - coverage now reflects the actual indexed / backfill window on the accepted shell
  - mailbox coverage display now aligns with mailbox-index truth
  - review-page display-contract interpretation now settles to final truth instead of staying stuck unavailable
- Keep separate follow-on lanes outside accepted `ACE-043`:
  - `all-indexed` Sender Distribution render inconsistency
  - hero/layout cleanup regression

### Execution status

- `ACE-043` is accepted and closed:
  - the accepted runtime continuity layer remains stable under `ACE-040`
  - the accepted Time Context render-authority layer remains stable under `ACE-042`
  - the shared mailbox coverage/backfill shell now settles onto real mailbox-index truth on the canonical review route
  - no visible `1970` remains on the accepted surface
  - Recovery Contract: `CHANGELOG.md` -> `April 8, 2026 — ACE-043 Coverage / Backfill Display Contract Cleanup Accepted`
- `ACE-040` remains accepted historical truth for runtime continuity and final ready-state UI stabilization.
- `ACE-042` is accepted and closed:
  - review-page render authority is unified
  - `All indexed -> 1D` and `1W -> 1D` settle to the same 24-hour chart contract
  - Smart Sync `1W` / `1M` drift validation passed with no flicker and no fallback/status swap
  - Recovery Contract: `CHANGELOG.md` -> `April 8, 2026 — ACE-042 Time Context Render Authority + Scope Unification Accepted`
- `ACE-041` remains active unchanged as the control-plane execution-efficiency layer and does not govern product-lane scope.

### Next executable step

- Hero/layout cleanup is now active under `ACE-045` on the Operations Review page.
- Preserve accepted `ACE-044` as the stable Sender Distribution `All indexed` reconciliation contract.
- Keep remaining lanes separated; do not reopen accepted distribution, coverage/backfill, runtime continuity, or Time Context contracts in the hero/layout pass.
- Do not reopen accepted `ACE-040`, `ACE-042`, `ACE-043`, or `ACE-044` unless new canonical-route evidence disproves those contracts.

---

## 🚀 April 7 — ACE-041 Execution Efficiency Optimization Layer Active

### Current governing state

- `ACE-041` is now active system behavior for control-plane execution efficiency.
- This is an operating-model optimization only:
  - no product behavior changed
  - no runtime behavior changed
  - no UI behavior changed
- Same-thread control-plane carry-forward is now allowed when:
  - governing ACE is unchanged
  - active phase is unchanged
  - accepted-fix status is unchanged
  - approved scope is unchanged
  - governing-truth status is unchanged
- Propagation cadence is now checkpoint-based:
  - accepted fix
  - governing-truth change
  - phase transition
  - thread closeout when material state exists
  - before a new thread that depends on pending truth
- Verification must follow the ladder:
  - diagnostic falsification
  - correction proof
  - accepted-fix closeout
- `MEDIUM` is now the default reasoning tier unless ambiguity, cross-layer risk, or architecture work justifies escalation.
- `PROJECT_MANAGER_CONTEXT.md` remains the canonical PM operating-model file only.
- Lane-specific execution truth must continue to live in:
  - `CURRENT_STATE.md`
  - `ACTIVE_CHANGE_EVENTS.md`

### Execution status

- `ACE-041` is propagated as active control-plane behavior.
- `AGENTS.md` already enforces the efficiency layer rules and required boundaries.
- `PROJECT_MANAGER_CONTEXT.md` already reflects:
  - same-thread carry-forward
  - propagation cadence
  - verification ladder
  - reasoning-tier optimization
  - PM context boundary rules
- `SYSTEM_MEMORY_MAP.md` remains consistent with PM context canonicalization and lane-truth routing.

## 🚀 April 8 — ACE-040 Smart Sync Continuity + UI Stabilization Accepted

### Current governing state

- `ACE-040` is now accepted and complete as the Smart Sync continuity + UI stabilization contract for the canonical Analysis Rail review route after `ACE-039`.
- `ACE-039` remains complete and accepted as the mailbox-index freshness / data-truth recovery contract.
- Smart Sync is now treated as a live continuity mechanism, not just a one-time recovery tool.
- Runtime snapshot / `cacheVersion` advancement is required only when a completed Smart Sync produces changed artifact/runtime truth that should update workflow truth.
- A no-op Smart Sync completion is not, by itself, continuity failure proof.
- Forced refresh must not attempt runtime regeneration while artifact publication remains:
  - `freshness_state = refresh_in_progress`
  - `build_status = building`
- During active artifact build, the system must keep the last stable runtime snapshot visible, expose build-pending status, and rotate `generated_at` / `cacheVersion` only after build-ready truth is published.
- Time Context rendering must remain deterministic by timeframe:
  - short ranges -> daily bars
  - medium ranges -> weekly bars
  - long ranges -> monthly bars
- `ACE-040` preserves the accepted invariant that the page must remain visibly populated through build-pending and ready-state swap:
  - no forced refresh crash during active build
  - no loading-only workspace at final settled ready state
  - no placeholder-only summary truth after the swap
- Keep adjacent Analysis Rail follow-up separate from the accepted `ACE-040` contract:
  - `1970` coverage display anomaly
  - `all-indexed` Sender Distribution render inconsistency

### Execution status

- `ACE-039` = complete:
  - accepted mailbox-index freshness / data-truth recovery
  - preserved as the fixed upstream source-layer contract
- `ACE-040` = complete:
  - accepted Smart Sync build-pending stable-snapshot contract
  - accepted automatic ready-state runtime swap
  - accepted UI stabilization across the swap, including downstream sender workspace / sender distribution completion
  - Recovery Contract: `CHANGELOG.md` -> `April 8, 2026 — ACE-040 Smart Sync Continuity + UI Stabilization Accepted`

### Next executable step

- `ACE-040` is accepted and closed.
- Subsequent Analysis Rail implementation moved through separate follow-on lanes, with Coverage / Backfill Display Contract Cleanup accepted under `ACE-043` and Sender Distribution `All indexed` reconciliation later accepted under `ACE-044`.
- Keep the `1970` coverage display anomaly and `all-indexed` Sender Distribution render inconsistency separate from the accepted `ACE-040` continuity contract.

## 🚀 April 6 — ACE-039 Mailbox-Index Freshness Recovery Accepted

### Current governing state

- `ACE-039` is now the accepted completed mailbox-index freshness recovery for current `1W` / `1M` Time Context failures.
- Current `1W` / `1M` failures must now be treated as a recent-period data-truth / source-of-truth recovery problem, not as a UI grammar-only problem.
- The chart remains the final pass surface, and the accepted fix now restores the upstream truth feeding that chart.
- The approved root cause is now classified as `stale index reuse`.
- The earliest proven failure boundary is the mailbox-index freshness / checkpoint layer.
- No future pass should try to "fix" `1W` / `1M` by hiding, compressing, or visually removing empty periods when the real expectation is that qualifying recent data should exist.
- `ACE-038` remains preserved as accepted historical context for the narrow fixed-slot UI grammar pass.
- `ACE-037` remains preserved as accepted historical context for compressed chart-only `1D` / `Custom`.

### Execution status

- Implementation is complete in:
  - `web/src/lib/integrations/gmail/gmailMailboxIndexer.ts`
  - `web/src/app/api/integrations/gmail/mailbox-index/route.ts`
- Live mailbox-index recovery verification confirmed:
  - false-healthy recent gaps are now detected and no longer qualify as usable cached truth
  - `smart_sync` recovery now upgrades to a fresh head-of-mailbox full run when recent truth is gapped
  - accepted recovery run settled as:
    - `requested_mode = incremental`
    - `effective_mode = full`
    - `started_from_checkpoint = false`
    - `terminal_reason = recent_window_reached`
  - mailbox-index state moved from:
    - `indexed_message_count = 234539`
    - `indexed_newest_message_at = 2026-04-06T07:59:04.000Z`
    - `last_sync_status = incremental_sync_complete`
    - `sync_health = healthy`
    - `usable_with_cached_index = true`
    to:
    - `indexed_message_count = 236627`
    - `indexed_newest_message_at = 2026-04-06T13:38:57.000Z`
    - `last_sync_status = full_scan_complete`
    - `sync_health = healthy`
    - `usable_with_cached_index = true`
    - `recent_window_health.false_healthy_state = false`
    - `recent_window_health.missing_recent_days = []`
  - raw indexed mailbox truth in `gmail_messages` now restored the previously missing recent span:
    - `2026-03-30: 0 -> 180`
    - `2026-03-31: 1 -> 241`
    - `2026-04-01: 1 -> 206`
    - `2026-04-02: 0 -> 175`
    - `2026-04-03: 0 -> 170`
  - derived sender truth in `gmail_sender_stats` now restored continuity across the same span:
    - `2026-03-30: 0 -> 7`
    - `2026-03-31: 1 -> 14`
    - `2026-04-01: 0 -> 17`
    - `2026-04-02: 0 -> 12`
    - `2026-04-03: 0 -> 12`
  - live runtime/UI verification on the canonical review route confirmed:
    - `1W` final settled state:
      - `workflow_scope = 7d`
      - `compressedMode = false`
      - `granularity = day`
      - `rawBucketCount = 7`
      - `renderBucketCount = 7`
      - visible buckets now populate every day from `Mar 31` through `Apr 6`
    - `1M` final settled state:
      - `workflow_scope = 30d`
      - `compressedMode = false`
      - `granularity = day`
      - `rawBucketCount = 30`
      - `renderBucketCount = 30`
      - visible buckets now continue through late March into early April with no unexplained zero run
    - corroborating `Custom` final settled state remained aligned:
      - `sender_overview_window = custom`
      - `sender_overview_start = 2026-03-08`
      - `sender_overview_end = 2026-03-27`
      - `customWorkspace.selected_cluster = 254 senders / 1143 messages`
      - `customOverview.summary = 254 active senders / 1143 supporting messages`
  - accepted proof artifacts captured screenshot, DOM/state, and request trace for:
    - `1W`
    - `1M`
    - `Custom`
  - no UI/chart code changed in this pass
  - no `409` guard churn interfered with the accepted flow
  - Recovery Contract: `CHANGELOG.md` -> `April 6, 2026 — ACE-039 Mailbox-Index Freshness Recovery Accepted`

### Next executable step

- `ACE-039` is accepted and closed.
- Preserve the mailbox-index freshness recovery contract as the governing stable fix for recent-period `1W` / `1M` truth.
- Do not reopen UI grammar-only fixes as the primary hypothesis for `1W` / `1M` unless new live evidence disproves mailbox-index freshness as the fixed source layer.
- Post-`ACE-039` stabilization, visualization parity, and Smart Sync continuity are now governed by `ACE-040`.

## 🚀 April 6 — ACE-038 Time Context Fixed-Slot UI Grammar Recovery Accepted

### Current governing state

- `ACE-038` is now preserved as accepted historical context for the narrow Time Context fixed-slot UI grammar recovery.
- `ACE-037` remains historically correct as the accepted narrow chart-only fix for `1D` / `Custom`.
- `ACE-038` now explicitly clarifies the product grammar split for accepted Time Context surfaces:
  - `1D` and `Custom` remain compressed compare-only/chart-only continuity surfaces
  - `1W` must preserve a fixed 7-day frame with 7 visible daily buckets, including visible zero slots
  - `1M` must preserve a fixed 30-day frame with 30 visible daily buckets, including visible zero slots
- This was a UI grammar clarification only.
- This pass did **not** approve runtime/data-path changes, sender-universe changes, or newsletter parent-universe reconstruction changes.
- Workflow-driving chip architecture remains unchanged in this pass:
  - `All indexed`
  - `1Y`
  - `1Q`
  - `1M`
  - `1W`

### Execution status

- Implementation is complete in:
  - `web/src/components/runtime/GmailCleanupComponents.tsx`
- Live runtime/UI verification on the exact canonical review route confirmed:
  - `1W` final settled state preserved `compressedMode = false`, `granularity = day`, `rawBucketCount = 7`, and `renderBucketCount = 7`
  - `1M` final settled state preserved `compressedMode = false`, `granularity = day`, `rawBucketCount = 30`, and `renderBucketCount = 30`
  - visible bars stay contained within each day slot on `1W` and `1M`
  - zero days remain visibly reserved on `1W` and `1M`
  - `1D` and `Custom` remain compressed and still disclose hidden inactive periods
  - no `409` guard churn was observed during the accepted flow
- `CURRENT_STATE.md`, `TODO.md`, `PROJECT_MANAGER_CONTEXT.md`, `ACTIVE_CHANGE_EVENTS.md`, and `CHANGELOG.md` now align on:
  - `ACE-038` as the accepted fixed-slot UI grammar recovery
  - `ACE-037` as the narrow accepted historical fix
  - the explicit continuity grammar split across accepted surfaces

### Next executable step

- `ACE-038` is accepted and closed.
- Preserve this pass as historical accepted context only.
- Future `1W` / `1M` recovery work is now governed by `ACE-039`.

## 🚀 April 6 — ACE-037 Time Context Chart-Only Continuity Recovery Accepted

### Current governing state

- `ACE-037` is now completed as the narrow Time Context chart-only continuity recovery pass.
- Time Context `1D` and `Custom` now render compressed active timelines so active periods flow continuously without reserved zero-gap slots.
- Raw bucket truth remains authoritative for hover, focus, and lower-card reads.
- This pass did **not** change:
  - backend aggregation
  - route/query behavior
  - Sender Distribution / workflow totals / sender rows logic
  - workflow-driving windows:
    - `All indexed`
    - `1Y`
    - `1Q`
    - `1M`
    - `1W`
  - interpolation / synthetic continuity

### Execution status

- Implementation is complete in:
  - `web/src/components/runtime/GmailCleanupComponents.tsx`
- Live runtime/UI verification on the exact canonical review route confirmed:
  - `1D` cold load settles with no reserved visible gaps between active periods
  - sparse `Custom` settles with no reserved visible gaps between active periods
  - inactive periods are disclosed explicitly in compressed mode
  - lower-card values remain tied to raw bucket truth
  - explicit empty-state behavior appears when a compressed custom window has no active periods
  - no `409` guard churn was observed during the accepted flow

### Next executable step

- `ACE-037` is accepted and closed.
- Keep the chart-only continuity contract stable for `1D` / `Custom`.
- Do not widen this continuity adapter into workflow-driving windows or interpolation without a new approved plan.

## 🚀 April 6 — ACE-036 Gmail Marketing Classification Coverage + Sender Distribution `1W` UI Consistency Recovery Accepted

### Current governing state

- `ACE-036` is now completed as the narrow Gmail marketing-classification and Sender Distribution `1W` UI consistency recovery pass.
- `semantic.marketing_subscriptions` now rescues broader-row promotional/newsletter senders when the broader sender evidence already resolves to `subscription-senders` and the sender does not look human.
- Sender Distribution workflow-scope chips remain workflow-driving and no longer depend on detached comparison rail-package readiness to restore truthful `workflow_scope`.
- This pass did **not** change:
  - artifact publication
  - Smart Sync ingestion
  - workflow-window logic
  - route shape

### Execution status

- Implementation is complete in:
  - `web/src/lib/integrations/gmail/inboxAnalysis.ts`
  - `web/src/app/agents/[id]/operations/review/page.tsx`
- Live classification verification confirmed:
  - published `30d` marketing artifact moved `subscription-senders` from `192` to `248`
  - published `30d` marketing artifact moved `needs-review-senders` from `177` to `121`
  - live recent marketing coverage now reports `missing_promotional_days = []`
- Live runtime/UI verification on the exact canonical marketing review route confirmed:
  - Sender Distribution `1W` is clickable
  - final route settles to `workflow_scope=7d`
  - final active tab remains `sender_distribution`
  - final `1W` chip is active (`ariaPressed = true`)
  - no `409` guard churn was observed during the accepted click flow

### Next executable step

- `ACE-036` is accepted and closed.
- Return the shared-analysis lane to the already-governing next step under `ACE-032` / `ACE-030`:
  - fresh `PLAN MODE` for `1D` Time Context correction and stability

## 🚀 April 6 — ACE-035 Gmail Artifact Integrity Incremental Refresh Recovery Accepted

### Current governing state

- `ACE-035` is now completed as the narrow Gmail artifact-integrity recovery pass.
- Incremental Gmail artifact refresh now rebuilds impacted preview rows, headers, cluster summaries, and mailbox intelligence from the same projected preview dataset.
- Incremental artifact validation now counts cleanup-candidate preview rows using the same cleanup-group reference rules the mailbox-intelligence snapshot builder uses:
  - direct cleanup-group cluster ids
  - projected rows that still reference cleanup groups through `cleanup_group_source_cluster_ids`
- Integrity checks remain active and unchanged in spirit:
  - partial artifacts are still rejected
  - inconsistent preview/header states are still rejected
  - inconsistent candidate-universe counts are still rejected

### Execution status

- Backend-only implementation is complete in:
  - `web/src/lib/integrations/gmail/gmailArtifactIncrementalUpdater.ts`
- Live artifact verification confirmed:
  - Smart Sync produced a real incremental mailbox delta (`rows_after: 234516`, `growth_delta: 3`, `processed_messages: 4`, `upserted_messages: 3`)
  - `30d` and `7d` incremental artifact rebuilds published successfully with continuous daily bucket coverage
  - a live bounded incremental artifact recheck published `all_indexed` successfully as `incremental-20260405231945344`
  - `all_indexed` moved from:
    - `build_status = failed`
    - `freshness_state = refresh_failed`
    - `freshness_reason = Mailbox intelligence candidate message count no longer matches preview rows.`
    to:
    - `build_status = published`
    - `freshness_state = fresh`
    - `freshness_reason = published_artifact_current`
  - live logs no longer emitted:
    - `references missing header`
    - `candidate message count no longer matches preview rows`
  - live bucket continuity passed:
    - `1W / 7d` = `7` daily buckets
    - `1M / 30d` = `30` daily buckets

### Next executable step

- Gmail artifact freshness / integrity recovery is now accepted.
- Return the shared-analysis lane to the already-governing next step under `ACE-032` / `ACE-030`:
  - fresh `PLAN MODE` for `1D` Time Context correction and stability

## 🚀 April 6 — ACE-034 Gmail Analysis Rail Smart Sync Freshness Recovery Accepted

### Current governing state

- `ACE-034` is now completed as the narrow Gmail Analysis Rail freshness recovery pass.
- Successful artifact publish now clears stale failed freshness metadata for the build/version that actually published.
- Smart Sync artifact refresh planning now manages recent-scope publication rows instead of skipping missing recent scopes:
  - `7d`
  - `30d`
  - `90d`
  - `180d`
  - `365d`
  - `all_indexed`
- `unavailable_scope` remains an integrity safeguard and is preserved.

### Execution status

- Backend-only implementation is complete in:
  - `web/src/lib/integrations/gmail/gmailArtifactStore.ts`
  - `web/src/app/api/integrations/gmail/mailbox-index/route.ts`
- Repo verification confirmed stale failed freshness metadata no longer survives a later successful publish.
- Live verification confirmed:
  - recent-scope publication rows are now created/queued for the required recent windows
  - live `7d` full rebuild published successfully
  - live `7d` selected-cluster rail state no longer fails through missing publication truth
  - an injected live `refresh_failed` state on `7d` is cleared by a later successful publish

### Next executable step

- Keep the separate `all_indexed` incremental artifact integrity failure isolated from `ACE-034`:
  - `Preview row 1919a35fe8973469 references missing header semantic.marketing_subscriptions. | Mailbox intelligence candidate message count no longer matches preview rows.`
- Do not reopen the accepted recent-scope publication fix while that separate integrity lane is diagnosed.

## 🚀 April 5 — ACE-033 Protected Files Enforcement System Active

### Current governing state

- `ACE-033` is now active as a system-integrity enforcement event in the control plane.
- Protected-file read-only boundaries are now accepted operating truth for Codex execution and propagation behavior.
- Protected files must not be modified unless Oliver explicitly places them in scope for the current pass.
- The protected-file boundary now governs system-rule and turnover-layer assets including:
  - `AGENTS.md`
  - `CODEX_PROMPT_TEMPLATES.md`
  - all `SKILL.md` files
  - architect / PM turnover protocol documents
- This enforcement change is behavioral and control-plane only; it does **not** change product code or runtime behavior.

### Execution status

- Control-plane propagation is now aligned in `CURRENT_STATE.md`, `TODO.md`, and `PROJECT_MANAGER_CONTEXT.md`.
- This pass does **not** modify protected files themselves.
- Codex must now stop and request explicit Oliver approval before any protected-file edit is attempted.

### Next executable step

- Keep future execution and propagation passes inside the protected-file boundary unless Oliver explicitly scopes a protected file for edit.

## 🚀 April 5 — ACE-032 Analysis Rail PM v2 Turnover Alignment Complete

### Current governing state

- `ACE-032` is now completed as a control-plane turnover and lane-reset event.
- `Analysis Rail PM v2` is now the active lane owner for the Shared Analysis Rail / Time Context lane.
- The approved `ACE-030` architecture remains valid:
  - `1D` and `Custom` are chart-only windows
  - `All indexed`, `1Y`, `1Q`, `1M`, `1W` remain the only workflow-driving chips
- The Analysis Rail lane is no longer cleared to continue directly in `EXECUTION MODE`.
- The lane is now reset to require:
  - fresh `PLAN MODE` re-entry
  - narrow `1D` Time Context correction and stability scope
  - full Runtime/UI Closeout Contract proof on subsequent execution passes

### Execution status

- Final control-plane alignment is complete across `CURRENT_STATE.md`, `TODO.md`, `PROJECT_MANAGER_CONTEXT.md`, `CHANGELOG.md`, and `ACTIVE_CHANGE_EVENTS.md`.
- This turnover pass did **not** change product code, runtime behavior, route behavior, or accepted product architecture.
- `ACE-032` records lane ownership and execution reset only.

### Next executable step

- Start a new Analysis Rail `PLAN MODE` thread under `Analysis Rail PM v2`.
- Scope that plan to:
  - `1D` Time Context correctness and stability
  - the smallest safe path back to the approved `ACE-030` Phase 1 architecture
  - strict preservation of Sender Distribution, route/query shape, and workflow-driving chip boundaries unless newly approved

---

## 🚀 April 5 — ACE-031 Verification Hardening Control-Plane Closeout Closed

### Current governing state

- `ACE-031` is now completed as a control-plane closeout alignment event.
- The hardened runtime/UI verification standard is now accepted control-plane truth.
- The authoritative execution-rule sources already contain the hardened verification rules; this pass aligned the control plane to that already-landed state.
- This closeout confirms the governing verification model now includes:
  - Codex self-verification as the default verification authority whenever reasonably possible
  - explicit runtime target and canonical route identity requirements before runtime/UI verification
  - blocked-verification pause-and-resume behavior when authentication or operator assist is required
  - artifact-backed runtime/UI closeout proof requirements for accepted visible state
  - explicit guard-churn reporting and classification in runtime/UI closeout proof
- This pass did **not** reopen or rewrite already-correct source rule files.

### Execution status

- Final control-plane alignment is complete across `CURRENT_STATE.md`, `TODO.md`, `PROJECT_MANAGER_CONTEXT.md`, `CHANGELOG.md`, and `ACTIVE_CHANGE_EVENTS.md`.
- `ACE-031` did not change product code, runtime behavior, route behavior, or source execution-rule documents.
- No pending `ACE-031` implementation or source-rule rewrite work remains.

### Next executable step

- `ACE-031` is closed.
- Continue from the turnover-reset shared-analysis lane tracked under `ACE-032`:
  - `PLAN MODE` for `1D` Time Context correction and stability under `Analysis Rail PM v2`

---

## 🚀 April 4 — ACE-029 Accepted-Fix Recovery Contract Hardening Closed

### Current governing state

- `ACE-029` is now completed as a docs/process control-plane hardening event.
- The Accepted-Fix Recovery Contract system is now active and enforced across:
  - `CHANGELOG.md`
  - `AGENTS.md`
  - `CODEX_PROMPT_TEMPLATES.md`
  - `system_overview.md`
  - `implementation_pass`
  - `change_propagation_pass`
  - `turnover_pack_builder`
  - `PROJECT_MANAGER_CONTEXT.md`
  - `Project Manager Activation & Turnover Protocol.md`
- `CHANGELOG.md` is the authoritative recovery ledger for accepted fixes.
- `CURRENT_STATE.md` and `TODO.md` remain active-truth and next-step continuity documents; they do not store full Recovery Contracts.
- Completed ACE entries must point to the corresponding `CHANGELOG.md` recovery contract when an accepted fix is closed.

### Execution status

- Final control-plane alignment is complete across `CURRENT_STATE.md`, `TODO.md`, `PROJECT_MANAGER_CONTEXT.md`, and `ACTIVE_CHANGE_EVENTS.md`.
- `ACE-029` did not change product code, product behavior, or active product-lane scope.
- No pending `ACE-029` implementation work remains.

### Next executable step

- `ACE-029` is closed.
- Continue from the separately governed product lanes already tracked in the control plane.

## 🚀 April 4 — ACE-030 Sender Overview `1D` / `Custom` Chart-Only Architecture Logged

### Current governing state

- The approved Sender Overview architecture is now explicit:
  - `1D` and `Custom` are approved as chart-only windows
  - existing accepted chips remain workflow-driving:
    - `All indexed`
    - `1Y`
    - `1Q`
    - `1M`
    - `1W`
- `Phase 1` is now the committed next execution step.
- `Phase 1` is limited to Time Context only.
- `Phase 1` does **not** approve:
  - Sender Distribution chart-window rendering for `1D` / `Custom`
  - `workflow_scope` expansion
  - `analysis_scope` expansion
  - route/query changes
- Sender Distribution `1D` / `Custom` chart-window rendering is explicitly deferred to a later phase.

### Execution status

- This was a docs-only control-plane alignment pass.
- No product code, route behavior, or query behavior changed in `ACE-030`.
- Control-plane ambiguity about the next shared-analysis step is now removed.
- The active shared-analysis execution phase is now:
  - `Phase 1 — Time Context chart-only window implementation`

### Next executable step

- Execute `Phase 1 — Time Context only` implementation for Sender Overview.
- Implement `1D` and `Custom` as chart-only windows in Time Context while keeping:
  - `All indexed`, `1Y`, `1Q`, `1M`, `1W` as the only workflow-driving chips
  - Sender Distribution unchanged in this phase
  - no `workflow_scope` or `analysis_scope` expansion
  - no route/query changes

## 🚀 April 4 — ACE-028 Sender Distribution Monthly `30d` Truth Fix Accepted

### Current governing state

- `ACE-027` is now completed and PM-verified as the narrow Sender Distribution scope-congruency pass.
- Sender Distribution now shows the accepted visible chip grammar:
  - `All indexed`
  - `1Y`
  - `1Q`
  - `1M`
  - `1W`
- Visible `2M` and `6M` are now removed from Sender Distribution UI only.
- `1D` and `Custom` were not part of the accepted Sender Distribution grammar in `ACE-027`; chart-only treatment is now approved separately under `ACE-030`.
- `ACE-028` is now completed and PM-verified as the narrow Sender Distribution monthly `30d` truth correction.
- Exact implementation scope for the accepted monthly truth fix:
  - `web/src/lib/integrations/gmail/gmailCleanupWorkspace.ts` only
- Exact accepted correction:
  - `loadGmailSenderDistributionForTenant(...)` now excludes `analysisScope === '30d'` from the persisted snapshot shortcut
  - Sender Distribution `1M` now falls through to the same truthful non-snapshot path already used by workspace truth
- This accepted monthly truth fix did **not** change:
  - Time Context
  - backend/API contracts
  - route/query shape
  - `OperationsAnalysisScope`
  - Decision Mode semantics
  - pagination
  - sender ordering logic
  - lower-card anchoring
  - `1W`, `1Q`, `1Y`, or `all_indexed`

### Execution status

- PM verification confirmed on the protected-trusted review route:
  - Sender Distribution `1M` now shows `48`
  - the workflow below shows `48`
  - Time Context `1M` remains correct
  - the primary monthly mismatch is resolved
- The accepted Sender Distribution monthly truth fix is narrow and backend-only.
- Separate performance follow-up item only:
  - `1Y` still has a significant workflow-load delay; `1Q` is slower than ideal but materially better; `1W` is near-instant. This is a separate future performance diagnosis item and not part of the accepted monthly `30d` Sender Distribution truth fix.

### Next executable step

- Shared-analysis next-step ambiguity is now resolved under `ACE-030`.
- Execute `Phase 1 — Time Context only` implementation for chart-only `1D` / `Custom`.
- Keep Sender Distribution `1D` / `Custom` rendering deferred to a later phase.

---

## 🚀 April 3 — ACE-026 Time Context Pass 1 Scope Congruency Accepted

### Current governing state

- `ACE-026` is now accepted and PM-verified as the Time Context-only Pass 1 scope-congruency implementation.
- The Time Context review rail now exposes the accepted visible scope grammar:
  - `All indexed`
  - `1Y`
  - `1Q`
  - `1M`
  - `1W`
- The accepted Pass 1 mapping is:
  - `all_indexed -> all_indexed`
  - `last_year -> 365d`
  - `last_quarter -> 90d`
  - `last_month -> 30d`
  - `last_week -> 7d`
- `1D` and `Custom` were intentionally hidden in the accepted Pass 1 state; chart-only handling is now approved separately under `ACE-030`.
- This accepted pass is limited to the Time Context chart-scope adapter and does **not** change:
  - Sender Distribution behavior
  - Decision Mode
  - backend/API contracts
  - route/query shape
  - `OperationsAnalysisScope`
  - lower-card anchoring behavior
- Accepted truth remains preserved for:
  - `all_indexed`
  - monthly `30d`
  - weekly `7d`
  - the broad Time Context chart contract

### Validation status

- PM verification confirmed:
  - Time Context chips now show `All indexed`, `1Y`, `1Q`, `1M`, `1W`
  - `1D` and `Custom` are not visible, which is correct for Pass 1
  - `1Y` loaded and clicked-bucket filtering behaved correctly
  - `1Q` loaded and clicked-bucket filtering behaved correctly
  - `1M` still behaves correctly
  - `1W` still behaves correctly
  - `All indexed` still behaves correctly
  - Sender Distribution behavior appears unchanged
- Separate observation only:
  - newly exposed `1Y` and `1Q` scopes still have significant load-time cost
  - PM observed roughly `61s` on `1Y`
  - PM observed roughly `19s` on `1Q`

### Next executable step

- This accepted pass is complete.
- The later Sender Distribution chip-congruency and monthly `30d` truth follow-up are now accepted separately.
- The next shared-analysis execution step is now committed under `ACE-030`:
  - `Phase 1 — Time Context only` implementation for chart-only `1D` / `Custom`
- Do not widen Phase 1 into Sender Distribution rendering, `workflow_scope` expansion, or `analysis_scope` expansion.

### Explicit boundary

- `ACE-026` is Time Context only and accepted.
- `1D` and `Custom` remain outside the accepted Pass 1 workflow-driving surface; the approved next step is chart-only treatment in Time Context under `ACE-030`.
- The observed `1Y` / `1Q` load-time cost is separate from this acceptance and must not be treated as a regression to the accepted Pass 1 functional behavior.
- This pass does not reopen Cleanup Groups, runtime redesign, Sender Distribution implementation, or any already accepted parity work.

## 🚀 April 3 — ACE-025 Weekly `1W` Time Context Truth Alignment Accepted

### Current governing state

- `ACE-025` is now accepted for the narrow weekly `workflow_scope=7d` Sender Overview / Time Context coherence fix only.
- Weekly `1W` is now internally coherent on the accepted protected-trusted review route.
- The visible weekly chart and the counted sender universe now match the same visible UTC-day window semantics.
- The accepted weekly broad baseline on the tested route is now:
  - one populated visible day bucket
  - matching visible sender/workflow totals
  - coherent bucket drilldown after click
- The earlier mixed-truth weekly regression is resolved in the accepted baseline.
- This pass does **not** change:
  - monthly `30d`
  - `all_indexed`
  - label transport
  - visuals
  - backend/API contracts outside the narrow weekly row-backed correction

### Validation status

- Targeted ESLint passed for:
  - `web/src/lib/integrations/gmail/gmailCleanupWorkspace.ts`
  - `web/src/app/agents/[id]/operations/review/page.tsx`
- Focused TypeScript grep produced no errors for:
  - `web/src/lib/integrations/gmail/gmailCleanupWorkspace.ts`
  - `web/src/app/agents/[id]/operations/review/page.tsx`
- The accepted weekly verification route is:
  - `/operations/review?workflow_scope=7d&cluster_id=structural.protected_trust`
- Accepted weekly proof now records the current coherent baseline:
  - fresh Time Context base view shows one populated visible UTC-day bucket (`Mar 29 = 2`)
  - the visible weekly workflow total on that route is `2`
  - clicking the populated visible bucket settles coherently to active senders `2` and workflow total `2`
- Separate non-blocking runtime note only:
  - transient loading jitter or a temporary empty hero state can still appear during route churn
  - that runtime jitter is not part of the accepted weekly `ACE-025` fix and does not reopen it

### Next executable step

- Return the active execution focus to Cleanup Groups Lane B — review entry behavior for decomposed parents.
- Keep auto-scroll / refocus as a separate polish-only follow-up outside the accepted weekly truth fix.
- Do not reopen weekly `1W` truth alignment unless a new parity regression is observed.

### Explicit boundary

- `ACE-025` is weekly-only and accepted.
- This pass does not reopen `ACE-023` or `ACE-024`.
- This pass does not widen into monthly truth, `all_indexed`, runtime redesign, transient route-churn loading jitter, transport redesign, or visual polish.

## 🚀 April 3 — ACE-024 Time Context Lower-Card Anchoring Accepted

### Current governing state

- `ACE-024` is now accepted as completed for the narrow review-page Time Context lower-card anchoring fix.
- `web/src/components/runtime/GmailCleanupComponents.tsx` now treats the selected Time Context bucket as the authoritative lower-card anchor whenever a bucket is active.
- Hover remains preview-only:
  - the quick-read tooltip can still change on hover
  - the lower Time Context cards and interpretation rows no longer switch away from the selected bucket
- Clearing narrowed state now returns the lower Time Context cards to the existing default-focus behavior.
- This pass does **not** change:
  - review-page selection flow
  - route/session behavior
  - workflow narrowing behavior
  - monthly truth logic
  - backend/API behavior
  - chart broadness or render source

### Validation status

- PM/browser validation is now accepted for the validated protected-trusted monthly route:
  - selected bucket stays anchored after click
  - lower-card content follows the selected bucket correctly
  - hover no longer steals the lower-card anchor once a bucket is selected
  - `Clear narrowed state` returns the lower card to the existing default-focus behavior
  - monthly filtering behavior remains correct after selection
- Targeted ESLint passed for:
  - `web/src/components/runtime/GmailCleanupComponents.tsx`

### Next executable step

- Open a new narrow PLAN MODE diagnosis pass for the weekly `1W` lower-card/workflow-scope inconsistency only.
- Keep auto-scroll / refocus as separate polish-only work.

### Explicit boundary

- `ACE-024` is accepted and closed.
- The separate weekly `1W` inconsistency remains open and must not be blended into this accepted fix.
- This pass was limited to the lower Time Context anchoring behavior inside `GmailCleanupComponents.tsx` plus required documentation propagation.
- This pass did not reopen `ACE-023` and did not widen into any other Time Context, workflow, runtime, or backend lane.

## 🚀 April 3 — ACE-023 Monthly `30d` Core Truth Correction Accepted

### Current governing state

- `ACE-023` is now accepted as completed for the monthly `30d` core truth correction.
- The system is operating from the stable rollback baseline restored on April 2, 2026.
- The monthly `30d` chart/filter truth mismatch is now fixed and PM-verified on protected-trusted:
  - `2026-03-06`: `9` in chart, `9` in filtered workflow
  - `2026-03-20`: `8` in chart, `8` in filtered workflow
  - `2026-03-30`: `3` in chart, `3` in filtered workflow
- `All Indexed` still matches after click and remains preserved by the accepted correction.
- The accepted correction remains narrowly scoped to monthly `30d` core truth alignment only.

### Phase status

- Phase 1 — Monthly Trust Diagnosis: completed
- Phase 2 — Monthly Trust Correction: completed
- Phase 3 — Parity Confirmation: completed
- Phase 4 — Scope Consistency: not active under `ACE-023`
- Phase 5 — Polish: not active under `ACE-023`

### Next executable step

- Open a separate narrow PLAN MODE diagnosis pass for possible `1W` lower-card workflow-scope inconsistency.
- Keep auto-scroll / refocus as separate polish work, not part of the accepted monthly truth correction.

### Explicit boundary

- `ACE-023` remains completed and accepted.
- Remaining follow-ups are explicitly separate from the accepted monthly `30d` correction:
  - lower-card anchoring after selection (`ACE-024`)
  - possible weekly `1W` lower-card workflow-scope mismatch
  - auto-scroll / refocus polish
- `ACE-019` remains completed historical context and `ACE-023` is now completed as well.

## Historical Milestone Log

Entries below preserve earlier pass-local implementation history. If any statement below conflicts with the governing state above or `ACTIVE_CHANGE_EVENTS.md`, treat the governing state above as authoritative.

## 🚀 April 2 — Time Context Review-Page Stabilization Rollback Implemented

### What changed

- The unstable April 2 Time Context review-page parity/source-selection regression chain was rolled back in:
  - `web/src/app/agents/[id]/operations/review/page.tsx`
  - `web/src/components/runtime/GmailCleanupComponents.tsx`
- The review page is now restored to the last stable broad-chart / stable-rail baseline before today’s forward Time Context parity/source-selection fixes:
  - bucket-active chart source selection no longer uses the detached-scope broad-overview preference path
  - top summary cards and workflow-panel feedback visuals no longer pulse or mutate around pending narrowing state
  - the Time Context rail no longer re-centers the whole chart read on the clicked bucket or applies the pending selected-bucket visual treatment

### Current implemented state

- The broad chart and Time Context rail are back on the stable pre-regression render contract.
- Clicking a Time Context bucket should no longer mutate the rest of the chart presentation or apply the regressed rail styling layer.
- The original protected-trusted parity mismatch is not considered resolved in the current branch.
- Targeted lint passed for:
  - `web/src/app/agents/[id]/operations/review/page.tsx`
  - `web/src/components/runtime/GmailCleanupComponents.tsx`

### Explicit boundary

- This pass is limited to review-page rollback/stabilization code plus required control-plane propagation.
- This pass does not change backend/API bucket-membership logic, runtime/rehydrate behavior, ACE-005 scope, or introduce any new forward parity fix.
- PM live validation is still required for:
  - protected-trusted / `30d` rail stability after click
  - protected-trusted / `1M` rail stability after click
- Self-serve localhost route proof remains blocked in the current session because the review route is still auth-gated before the protected-trusted rail becomes inspectable.

---

## 🚀 April 2 — Protected-Trusted Time Context Display-State Parity Correction Implemented

### What changed

- The residual protected-trusted `5 -> 9` Time Context parity failure was corrected as a review-page display-state fix, not a server bucket-membership fix.
- On bucket-applied state, the review page now drives narrowed sender totals from the applied bucket workspace total instead of the broad sender-key-derived `sharedWorkflowSubset.resolvedSenderCount` path.
- The Time Context lower-card workflow-universe total now reads from that same applied bucket workspace total.

### Current implemented state

- Protected-trusted bucket apply now keeps the authoritative `sender_count` / `total_senders` response aligned across:
  - top summary sender total
  - Time Context lower-card workflow-scope total
  - row coverage strip totals
- The chart remains broad and unchanged.
- The existing row workflow path remains intact.
- Targeted lint on `review/page.tsx` passed with no new warnings from this pass.

### Explicit boundary

- This pass is limited to review-page display-state composition.
- This pass does not reopen backend/API bucket-membership logic.
- This pass does not change rail visuals, runtime architecture, performance behavior, or ACE-005 scope.

---

## 🚀 April 2 — Protected-Trusted Time Context Parity Correction Implemented

### What changed

- The protected-trusted Time Context parity regression is now corrected in code on the review route.
- Bucket-selected workflow membership now resolves from the same row-backed bucket truth as the visible Time Context chart instead of sender-history inference from `first_seen` / `last_activity`.
- Selecting a Time Context bucket now resets `sender_page` back to the first narrowed page so a non-zero bucket cannot inherit an invalid broad-list page and render as an empty selected state.
- The broad-rail contract remains intact:
  - Time Context stays broad in the rail
  - only the workflow below narrows

### Current implemented state

- Protected-trusted bucket apply now uses the chart-aligned sender universe for:
  - narrowed workflow totals
  - top summary sender totals
  - Decision Mode authoritative sender order
- Later-page bucket selection now restores to a valid narrowed page instead of stranding the workflow on an out-of-range page from the broader sender list.
- Targeted lint on the changed review/runtime files passed with no new warnings from this pass.

### Explicit boundary

- This pass does not redesign rail visuals.
- This pass does not widen into ACE-005, runtime architecture, performance work, or Time Context grammar/polish work.
- Live protected-trusted browser revalidation remains the required final acceptance step outside this implementation pass.

---

## 🚀 April 2 — Review-Page Narrowing Feedback Layer Implemented

### What changed

- Sender Distribution clicks, Time Context bucket clicks, and review-page narrowing/reset controls now show immediate interaction feedback on the review page.
- The review page now uses one scoped pending-interaction model across:
  - rail highlight state
  - rail status pill
  - workflow header copy
  - top summary-card pulse/loading treatment
- The April 2 follow-up correction pass cleaned up the pending presentation:
  - rail targets now register immediately with a stronger but geometry-stable pending treatment
  - Sender Distribution and Time Context remain full-scope context surfaces while the workflow below narrows
  - stacked glow / multi-outline emphasis was removed so the workflow area stays the primary updating surface
  - rail status pills remain obvious, but no longer overpower the chart
  - the workflow area still reacts immediately with a visible updating banner, brighter loading shell, and stronger in-place loading state
- The remaining April 2 rail-context correction pass fixed the actual source of the last collapse regression on the validated `3000` review route:
  - Sender Distribution now renders from the broad rail sender dataset instead of the narrowed workflow sender subset
  - Time Context now prefers the broader coverage workspace for rail context instead of falling back to the narrowed workflow workspace when sender focus is active
  - browser proof on `3000` confirmed the rail stays broad after interaction:
    - Sender Distribution remained `850` ranked slots before and after sender click
    - Time Context remained `20` visible buckets after bucket click
- Pending completion no longer relies on route change alone.
- Pending now clears only after:
  - requested route/session state is present
  - the authoritative sender universe matches that requested narrowed state
  - relevant loading states are clear

### Current accepted state

- The feedback layer is visual/interaction-only and does not change data flow.
- Reset actions clear stale narrowed highlights immediately and show `Returning to broader scope…` while the broader sender universe restores.
- Time Context Lane B parity remains intact:
  - no new rehydrate path
  - no chart/workflow mismatch contract change
  - no backend/runtime redesign in this pass

### Explicit boundary

- This pass does not change narrowing contract, backend behavior, caching, or performance architecture.
- The only behavioral correction beyond pending presentation is the render-source fix that keeps the rails bound to their intended broad-context datasets/workspaces while the workflow below narrows.

---

## 🚀 April 2 — Time Context Lane B Closeout Accepted

### What changed

- Analysis Rail / Time Context Lane B is now accepted as closed for workflow-filtering/parity behavior on the validated scoped review route.
- The accepted closeout covers:
  - bucket-to-workflow parity
  - selected-bucket authority after hover/unhover
  - duplicate authoritative-context chip/key cleanup on the validated route
- The closeout does not include broader runtime simplification and does not require removal of the cold-boot review bootstrap request.

### Current accepted state

- Lane A remains accepted and unchanged.
- Lane B is now closed for Time Context filtering/parity behavior on the validated scoped review route.
- Cold-boot `POST /api/agents/playground` remains accepted as required review-route bootstrap behavior under the current architecture and is not a Lane B blocker.
- ACE-005 remains open as a separate runtime follow-up for any residual malformed inbox-analysis caller outside the narrowed review-route chain.

### Explicit boundary

- This closeout is for Time Context / Shared Analysis Rail workflow-filtering behavior only.
- It does not close the broader Time Context grammar lock.
- It does not close ACE-005.
- It does not imply broader runtime redesign or removal of review-route bootstrap behavior.

---

## 🚀 April 2 — Review-Path Runtime Hygiene Narrowed

### What changed

- The scoped review-path inbox-analysis callers remain guarded against empty actions before fetch.
- `/api/integrations/gmail/inbox-analysis` now distinguishes empty-body runtime noise from true missing actions:
  - `reason: "empty_request_body"` when no body is received or JSON yields `null`/`undefined`
  - `reason: "missing_action"` only when a valid object exists but `action` is missing/blank
  - `reason: "invalid_json"` when a non-empty body cannot be parsed
- Inbox-analysis diagnostics now also log `body_length` and `parse_status` alongside referer/origin/body keys so transport noise is separated cleanly from real caller mistakes.
- Review-path tracing now confirms the cold-boot `/api/agents/playground` request is the review-shell runtime bootstrap request, not Time Context bucket interaction.

### Current accepted state

- The accepted selected-bucket parity fix remains intact.
- Hover/unhover selected-bucket authority remains intact.
- Duplicate authoritative-context chip/key cleanup remains intact.
- Fresh-boot real review-route sessions can still emit malformed inbox-analysis POSTs even though current checked-in callers are guarded before fetch.
- Those malformed requests are now classified as empty-body transport/runtime noise instead of being folded into `missing_action`.
- The only current source-tree callers for `/api/integrations/gmail/inbox-analysis` remain the guarded runtime clients in `operationsWorkspace.ts` and `gmailCleanupWorkspace.ts`, so ACE-005 remains focused on identifying the emitting runtime path rather than relaxing the route contract.

### Explicit boundary

- Fresh review boot still emits one successful `rehydrate_only` `POST /api/agents/playground` request in live probing.
- That request is currently proven required under the present review-route architecture:
  - `OperationsRuntimeProvider` cold-boots by calling `fetchOperationsRuntimeSnapshot`
  - `review/page.tsx` blocks on `runtime.data` / `renderRuntimeData` before it can resolve clusters, cache version, and selected workflow context
- Bucket interaction is not implicated by the scoped callers.
- This pass only separates empty-body runtime noise from true missing-action requests; it does not identify or remove the emitting caller yet.

---

## 🚀 April 1 — Time Context Lane B Single-Universe Enforcement Propagated

### What changed

- Time Context bucket selection now resolves through one explicit authoritative sender universe instead of competing with adjacent workflow filters.
- Session-only bucket state can now combine deterministically with the active workflow scope and focused sender / drilldown state without creating dual workflow truth.
- Sender rows, workflow summary, pagination totals, Sender Distribution ordering/counts, and Decision Mode queue progression now read from the same resolved ordered sender set.
- Bucket highlighting remains visual-only for the chart itself:
  - the chart stays full-scope
  - aggregation does not collapse
- The implementation preserves the locked boundaries:
  - no new route param
  - no bucket-interaction `/api/agents/playground`
  - no page-wide rehydrate
  - no Cleanup Groups identity writes
- The April 2 correction pass tightened the selected-bucket authority path:
  - selected-bucket summary cards now read from the same resolved sender universe as the narrowed workflow
  - the Time Context truth panel now restores the selected bucket after hover instead of falling back to the default/peak read
  - Sender Distribution authoritative-context chips are now deduped with deterministic keys, removing duplicate `1W`/duplicate-key rendering noise
- The April 2 selected-bucket authority correction narrowed the remaining `5 -> 9` drift:
  - bucket filtering now resolves sender membership from the same sender-level Time Context semantics as the clicked chart bucket instead of a broader row-any-message bucket match
  - selected-bucket summary/count surfaces now prefer the currently narrowed bucket workspace over broader coverage fallbacks when bucket truth is active

### Current accepted state

- Lane A Time Context truth/grammar remains accepted and unchanged.
- Lane B contract enforcement is now implemented for:
  - session-only bucket selection
  - pre-bucket route snapshot restore on `Clear narrowed state`
  - one explicit resolved sender universe across active workflow filters
  - Decision Mode queue consumption of the already narrowed authoritative workflow order
  - selected-bucket authority across summary cards and the Time Context truth panel
  - hover preview separation from selected-bucket truth
  - deterministic authoritative-context chip rendering in Sender Distribution
- Cleanup Groups accepted behavior remains locked:
  - Marketing chooser behavior
  - direct-open parents
  - review-unit integrity

### Explicit boundary

- This pass implemented the Lane B contract-enforcement layer that is now accepted.
- Lane B closeout is now captured separately as accepted workflow-filtering/parity behavior.
- Residual empty `action:""` runtime noise remains separate under ACE-005.

---

## 🚀 April 1 — ACE-012 Hot-File Merge System Hardening Propagated

### What changed

- Added `07_reference/Shared_Hot_File_Merge_Protocol.md` as the authoritative operating-model reference for shared hot-file merge work.
- Tightened merge preflight from a one-sided changed-file view to merge-base, two-sided overlap classification.
- Added the hard rule that if classification = `hot_file_integration_required`, full git merge is prohibited and the work must route to a dedicated Codex integration pass.
- Locked the default merge bias rules:
  - UI files prefer `main` unless PM overrides
  - runtime logic prefers the active worktree lane
  - imports union unless the conflict is semantic
  - types/interfaces prefer the superset, not reduction
- Added the failure escalation rule: if Codex fails the same hot-file integration twice, stop and return to PM instead of retrying blindly.

### Current accepted state

- The system still uses the same two-track model:
  - docs / control-plane sync
  - shared hot-file integration
- Shared hot-file merge work now has one authoritative detailed protocol instead of relying on checklist fragments alone.
- PM handoff for shared hot-file integration now requires a preflight packet.
- `ACE-009`, `ACE-010`, and `ACE-011` remain completed historical context and were not reopened.

### Explicit boundary

- This pass hardens documentation, routing, and execution rules only.
- No runtime, UI, schema, API, or product behavior changed in this pass.

---

## 🚀 April 1 — ACE-009 + ACE-010 Worktree Sync And Hot-File Merge Protocol Propagated

### What changed

- The operating model now separates `control-plane / documentation sync` from `shared hot-file code integration`.
- `Docs-only sync` is now the official control-plane propagation path between `main` and active worktrees in both directions.
- The system now defines an explicit `conflict recovery` workflow for aborting unsafe full merges, restoring resolved docs, and finishing docs-only sync safely.
- Shared hot files now require preflight classification before merge attempts, and Codex owns the dedicated hot-file integration workflow instead of Oliver manually reconciling those files.
- `ACE-011` remains preserved as completed historical execution context and is not reopened by this pass.

### Current accepted state

- Worktree sync is now a two-track model:
  - docs / control-plane sync
  - shared hot-file integration
- PM and Codex should use docs-only sync when the task is operating-model or control-plane propagation.
- If a full merge exposes shared hot-file overlap during control-plane alignment, the merge should be aborted and rerouted:
  - complete docs-only sync first
  - run a separate Codex-assisted hot-file integration pass afterward
- Current shared hot files explicitly include:
  - `web/src/app/agents/[id]/operations/review/page.tsx`
  - `web/src/lib/integrations/gmail/gmailCleanupWorkspace.ts`
  - `web/src/lib/integrations/gmail/inboxAnalysis.ts`

### Explicit boundary

- This pass updates documentation and operating-model truth only.
- No runtime, UI, schema, or product behavior changed in this pass.

## 🚀 April 1 — ACE-008 Codex Prompt Standardization Propagated

### What changed

- PM -> Codex non-trivial execution prompts now standardize on `07_reference/CODEX_PROMPT_TEMPLATES.md`.
- Named-skill execution now requires both `Skill` and `Skill Location` in the prompt.
- Codex skill loading is now treated as explicit execution setup, not an implied behavior.
- Verified unchanged during this propagation pass:
  - `AGENTS.md`

### Current accepted state

- The active PM -> Codex communication model remains `Oliver -> Project Manager -> Codex`.
- Non-trivial Codex tasks should be issued through the template structure, not ad hoc execution prompts.
- Documentation-only propagation work should use the change-propagation template/workflow.
- Reduced prompts remain acceptable only for truly lightweight tasks; they do not override the skill-loading requirement when a skill is named.

### Explicit boundary

- This pass standardizes documentation and execution language only.
- No runtime, UI, schema, or product behavior changed in this pass.

## 🚀 April 1 — ACE-007 Context Migration Captured

### What changed

- ACE-007 now captures the active multi-thread work that had been living only in chat.
- Control Plane + `ACTIVE_CHANGE_EVENTS.md` are now the required continuity source for future work.
- The Codex Operating System remains the active project operating model:
  - Control Plane
  - Orientation
  - Routing
  - Skills
- Verified unchanged during this propagation pass:
  - `SYSTEM_MEMORY_MAP.md`
  - `AGENTS.md`
  - `Project Manager Activation & Turnover Protocol.md.`

### Current accepted state

- Cleanup Groups multi-phase rebuild is the live current work stream:
  - Lane A is accepted for root-surface behavior.
  - Lane B is partially closed with marketing unit-only entry, review-unit integrity, spillover as a first-class unit, unit-scoped hero truth, unit-scoped decision handoff, and invalid/missing/blank unit guards.
  - Lane B final closeout remains open.
  - Lane C has not started.
- Analysis Rail / Time Context / Charts is the parallel worktree stream:
  - Lane A Time Context rebuild is implemented.
  - Row-backed monthly aggregation, same-array truth enforcement, non-additive bucket truth, axis readability improvements, and ghost-slot rendering are part of current reality.
  - Lane B is accepted as closed for workflow-filtering/parity behavior on the validated scoped review route.
  - The broader Time Context grammar lock remains open as separate follow-up work.
  - ACE-005 runtime-noise investigation remains open and separate from the Lane B closeout.
- Current active boundaries remain explicit:
  - no new taxonomy work
  - no root-surface redesign
  - no artifact redesign
  - focus stays on correctness, propagation, and system stability

### Explicit boundary

- This pass migrates and aligns system context only; it does not implement new product or runtime behavior.
- Historical milestone entries below are preserved as lane-local snapshots. If any statement below conflicts with this section or `ACTIVE_CHANGE_EVENTS.md`, treat ACE-007 and the control plane as authoritative current reality.

## Historical Milestone Log

Entries below preserve earlier pass-local acceptances and closeouts. They remain useful for reconstruction, but they do not override the active ACE-007 continuity snapshot above.

## 🚀 March 31 — Shared Analysis Rail Time Context Truth-Reconciliation Pass Accepted

### What changed

- The scoped Time Context truth-reconciliation pass is now accepted for the validated Shared Analysis Rail routes.
- `All Indexed` Time Context now reads like a truthful monthly selected-cluster timeline instead of a tiny recent slice on the validated routes.
- `1M` and `1W` remain browser-valid in the validated cases.
- Focused-bucket truth now appears materially aligned with rendered bucket data in the validated cases.

### Current accepted state

- Accepted only for the scoped Time Context truth-reconciliation target.
- Validated routes include:
  - `structural.unresolved`
  - `structural.protected_trust`
  - `semantic.marketing_subscriptions`
- `All Indexed` monthly truth is materially reconciled on those validated routes.
- `1M` and `1W` remain browser-valid in the validated cases.
- No Lane B bucket-driven workflow narrowing behavior was mixed into this pass.
- No route-shape or API-shape widening was introduced in this pass.

### Explicit boundary

- The broader Time Context rebuild remains open.
- This acceptance does **not** close:
  - full Time Context grammar lock
  - filtering-contract lock
  - bucket-driven workflow narrowing
  - interactive chart/workflow parity proof
- Residual empty `action:""` inbox-analysis runtime noise remains open as a separate follow-up and was **not** closed by this pass.

## 🚀 March 31 — Cleanup Groups Lane B Review-Page Unit Truth Accepted

### What changed

- Accepted the narrow Marketing review-page unit-truth correction inside the current **Lane B** review-entry lane.
- Valid Marketing review-unit routes now render unit-scoped hero / top-summary truth instead of broad-parent truth.
- Decision handoff truth is now unit-scoped for valid Marketing review-unit routes.
- `spillover / exceptions` is now accepted as a first-class Marketing review unit at both:
  - review-entry behavior
  - top-summary / hero truth
- Marketing chooser-only parent entry remains preserved.
- Direct-open parents remain preserved.

### Explicit boundary

- This accepted pass did **not** change:
  - Cleanup Groups root-surface behavior
  - taxonomy
  - artifact publication
  - direct-open parent design
- No root-surface, taxonomy, or artifact redesign happened in this pass.
- Residual empty-action inbox-analysis runtime noise remains open as a separate follow-up and was **not** closed by this acceptance:
  - `{"action":"","status":400,"ok":false}`

### Current accepted state

- Cleanup Groups planning Phases 1–4 remain accepted and locked.
- Cleanup Groups Lane A remains implemented and accepted.
- Cleanup Groups Lane B remains active, but is not yet closed.
- The spillover review-unit integrity correction is accepted within Lane B.
- The Marketing review-page hero / handoff truth correction is accepted within Lane B.
- Marketing chooser-only parent entry remains preserved.
- Direct-open parents remain preserved.

## 🚀 March 31 — Cleanup Groups Lane B Spillover Review-Unit Integrity Accepted

### What changed

- Accepted the narrow Marketing review-unit integrity correction inside the current **Lane B** review-entry lane.
- Valid Marketing review units now render coherent selected-state and scoped workflow behavior.
- `spillover / exceptions` now functions as a first-class Marketing review unit:
  - explicit selected-state banner
  - coherent scoped workflow
  - matching sender count surfaced in the live review state
- Marketing chooser-only parent entry remains preserved.
- Direct-open parents remain preserved.

### Explicit boundary

- This accepted pass did **not** change:
  - Cleanup Groups root-surface behavior
  - taxonomy
  - artifact publication
  - direct-open parent design
- No new Cleanup Groups implementation lane started in this pass.

### Current accepted state

- Cleanup Groups planning Phases 1–4 remain accepted and locked.
- Cleanup Groups Lane A remains implemented and accepted.
- Cleanup Groups Lane B is active, but not yet closed.
- The spillover review-unit integrity correction is accepted within Lane B.
- The next unresolved implementation target remains the next explicitly scoped Lane B follow-up thread.

## 🚀 March 31 — Cleanup Groups Lane A Implemented And Accepted

### What changed

- Implemented the narrow **Lane A** contract for Cleanup Groups root behavior only.
- `semantic.marketing_subscriptions` now renders immediate unit-entry behavior at Cleanup Groups root.
- Marketing no longer exposes a broad-parent root review-entry path:
  - no root `Open group` path on the Marketing card
  - no Marketing broad-parent shortcut from root-level recommendation / intent shortcuts
- Marketing parent review entry is now guarded:
  - parent URL renders choose-unit state
  - invalid unit URL renders unavailable-unit state
  - broad-parent fallback is blocked
- Direct-open parents were preserved as honest direct-open parents:
  - `structural.backlog`
  - `structural.unresolved`
  - `structural.protected_trust`
  - `secondary.account_updates`
  - `context.historical`
- No chooser/interstitial was introduced for direct-open parent URL entry.

### Current accepted state

- Cleanup Groups planning Phases 1–4 are accepted and locked.
- Cleanup Groups Lane A is implemented and accepted.
- Marketing is the only root-decomposed parent.
- Direct-open parents remain visually and behaviorally direct-open.
- Lane B is active, with spillover review-unit integrity accepted but the lane not yet closed.

### Explicit boundary

- Lane A changed only Cleanup Groups root-entry behavior plus the locked Marketing parent-route guard.
- This lane did **not** begin Lane B.
- This lane did **not** reopen taxonomy, artifact generation, alias behavior, or generalized review-page redesign.
- The accepted Lane A caveat remains:
  - the unit-review hero counters were still placeholder `—` in the captured snapshot
  - root-entry and route-guard browser proof was sufficient for Lane A acceptance


## 🚧 March 31 — Cleanup Groups Unit-First Pass Rolled Back

### What changed

- Live UI validation found a regression in the latest Cleanup Groups unit-first enforcement pass.
- That pass was rolled back narrowly to the immediate pre-unit-first / post-canonical-presentation state.
- The rollback removed only the rejected unit-first interaction layer:
  - parent chooser-only enforcement
  - review-page `Review Unit Required` guard
  - `review_unit_reason_filter` request plumbing added for that pass
- The rollback preserved the already accepted behavior:
  - canonical publish remains live
  - canonical Cleanup Groups labels and fixed section structure remain in place
  - alias normalization remains intact
  - `retail-commerce-senders` remains redirect-only

### Current accepted state

- Cleanup Groups root is back on the last known-good canonical surface before the rejected unit-first pass.
- Direct parent-open review behavior is restored.
- `semantic.marketing_subscriptions` and `structural.protected_trust` review routes load normally again.
- `secondary.system_notifications` and `system-notification-senders` still normalize to `secondary.account_updates`.
- Future Cleanup Groups decomposition work is paused pending a phased re-plan.


### Explicit boundary

- This rollback lane restored stability only.
- It did **not** begin the next Cleanup Groups decomposition / redesign phase.

## 🚧 March 31 — Cleanup Groups Structural Rebuild Planning (New Baseline)

### What changed

- Cleanup Groups is now intentionally paused at the restored pre-unit-first / post-canonical-presentation baseline.
- A new planning phase has been initiated: **Cleanup Groups Rebuild Phased Execution Plan**.
- The system is no longer attempting incremental fixes to legacy group structures.
- The focus has shifted from:
  - fixing existing cleanup groups
  - renaming / relabeling / surface adjustments
  to:
  - defining a clean, artifact-driven **full inbox re-evaluation and structural decomposition plan**.

### Current reality (important)

- Cleanup Groups are still functionally the **same underlying sender groupings**:
  - `Marketing subscriptions ≈ 850`
  - `Backlog ≈ 993`
  - `Unresolved ≈ 1115`
  - `Protected trust ≈ 1840`
  - `Account updates ≈ ~30`
  - `Historical ≈ ~40`
- The canonical work completed so far:
  - fixed naming
  - fixed section structure
  - fixed identity + alias behavior
- BUT:
  - **no structural decomposition has actually happened yet**
  - the first-step workflow is still effectively “flat” for large groups

### Key insight (locked)

- The previous work was **identity + correctness work**, not **structural transformation**.
- What is missing is a true:
  - inbox-wide re-evaluation
  - artifact-backed regrouping
  - decomposition into smaller, actionable units

### Explicit boundary

- We are no longer iterating on the existing groups directly.
- We are designing a **new decomposition model first**, then implementing it in controlled phases.
- No new Cleanup Groups implementation work should proceed without the new phased plan.
- Planning Phases 1–4 are now complete, and Lane A is the only accepted implementation lane so far.

## 🚀 March 31 — Cleanup Groups Canonical Publish Live

### What changed

- The explicit canonical publish command now completes cleanly and writes its proof payload without crashing.
- The workspace/access acceptance harness now distinguishes between:
  - archive-capable published clusters, which must produce archive impact
  - `context.historical`, which is valid archive-no-op behavior when preview rows are out-of-inbox only
- Canonical cleanup-group publish was rerun successfully for:
  - `full-mailbox-20260330155423600`
- Post-publish validation passed:
  - live audit
  - workspace/access acceptance
  - canonical / alias route matrix
- No rollback was needed in the final lane.

### Current accepted state

- Canonical cleanup-group artifact publish is live.
- `published_version` is `full-mailbox-20260330155423600`.
- `secondary.account_updates` is the canonical live secondary identity.
- `secondary.system_notifications` and `system-notification-senders` normalize safely to `secondary.account_updates`.
- `retail-commerce-senders` remains redirect-only and does not reopen as a live group.

### Explicit boundary

- This lane fixed only:
  - the publish / rollback proof-writing crash
  - the `context.historical` workspace acceptance failure
- It did **not** reopen taxonomy, identity design, route design, redirect design, or artifact mechanics beyond those two fixes.

## 🚀 March 30 — Cleanup Groups Canonical Cutover Preparation Implemented

### What changed

- Canonical cleanup-group publish logic is now implemented for the approved artifact surfaces.
- Secondary canonical identity is now locked in code as `secondary.account_updates`.
- Legacy alias direction is now locked in code:
  - `system-notification-senders -> secondary.account_updates`
  - `secondary.system_notifications -> secondary.account_updates`
- `retail-commerce-senders` is now redirect-only in code and no longer survives as a live runtime group.
- Artifact-backed runtime reads now normalize canonical-first with alias compatibility.
- Incremental publish is now blocked until the first full canonical rebuild exists.
- The live audit now compares against the accepted shadow baseline and correctly blocks the still-old published artifact.

### Current accepted state

- Canonical publish logic is implemented in code.
- Alias inversion is complete.
- Retail redirect-only handling is live in code.
- Runtime identity alignment is in place across the shared artifact-backed read path.
- Live publish has not happened yet.
- The current published artifact is still pre-cutover by design.

### Explicit boundary

- This thread is complete for cutover-preparation implementation only.
- It did **not** execute the first full canonical rebuild.
- It did **not** publish a new artifact version.
- The next required lane is `Cleanup Groups — First Canonical Rebuild + Publish Validation`.
- Taxonomy, UI, alias design, and runtime architecture are not reopened in that follow-on.

## 🚀 March 30 — Cleanup Groups Canonical Candidate Validated / Publish-Ready

### What changed

- The first full canonical rebuild completed successfully as an unpublished candidate:
  - `full-mailbox-20260330155423600`
  - job `full-rebuild:085c8ef7-2fd7-4842-8499-cd605e894a77:all_indexed:full-mailbox-20260330155423600`
- Review-unit publication contract drift was corrected by preferring the non-transitional source id when evaluating canonical cleanup-group source behavior.
- Preview-index integrity mechanics were corrected:
  - canonical preview replacement now completes under statement timeout
  - post-build preview row count matches finalized derived preview row count
  - candidate validator now proves no non-canonical preview rows remain
- The stale incremental publication lock remains cleared and publication prechecks remain compare-and-set ready.
- No live publish happened in this lane.

### Current accepted state

- Candidate-ready: yes
- Publish-ready: yes
- Fresh candidate build proof:
  - `ai-agent-platform-docs/03_gmail_workspace/09_reference/gmail_cleanup_canonical_candidate_build_20260330_v7.json`
- Fresh candidate validation proof:
  - `ai-agent-platform-docs/03_gmail_workspace/09_reference/gmail_cleanup_canonical_candidate_validation_20260330_v6.json`
- Fresh publication-readiness proof:
  - `ai-agent-platform-docs/03_gmail_workspace/09_reference/gmail_cleanup_publication_readiness_20260330_v2.json`
- `published_version` is still intentionally pinned to `full-mailbox-20260329092447406` until explicit approval.

### Explicit boundary

- This lane proved publish readiness only.
- It did **not** flip `published_version`.
- The next step is the explicit publish command plus immediate post-flip live validation.

## 🚀 March 30 — Cleanup Groups Taxonomy Shadow Validation Passed

### What changed

- Cleanup taxonomy shadow rediscovery ran successfully against pinned artifact `full-mailbox-20260329092447406`.
- The approved artifact-driven taxonomy and assignment model validated cleanly:
  - sender coverage preserved at `4,879 / 4,879`
  - no duplicate parent membership
  - only `7` sender movements, all from retired `retail-commerce-senders`
- Review-unit decomposition validated across:
  - `semantic.marketing_subscriptions`
  - `structural.backlog`
  - `structural.protected_trust`
  - `structural.unresolved`
- Cross-surface projection and shadow publish gates both passed.

### Current accepted state

- The next-generation cleanup taxonomy is validated in shadow.
- The new assignment model is validated in shadow.
- `retail-commerce-senders` is confirmed removable in shadow with safe redistribution.
- No live artifact publish happened in this lane.
- No runtime cutover happened in this lane.

### Explicit boundary

- This thread is complete as a shadow validation lane only.
- The next step is a separate canonical publish / safe cutover thread.
- Taxonomy design is not reopened in that follow-on.
- UI work is not part of that follow-on.

## 🚀 March 30 — Cleanup Groups Rediscovery Lane Complete

### What changed

- Cleanup Groups rediscovery / artifact-driven restructure is now complete for the scoped roadmap.
- The canonical cleanup-group runtime model is live.
- Cleanup Groups UI now uses the canonical lane-first structure in production.
- Workflow integration is live across Intelligence, Review, memory persistence, destination execution, and Management reopen handling.
- Alias / canonical hardening is complete and the compatibility window remains intentionally open.
- The future canonical-publish artifact switch is prepared, but remains default-off and was not activated in this lane.

### Current accepted state

- Cleanup Groups Phases A through E are complete.
- Canonical runtime cleanup-group identity is now the live workflow contract.
- Lane-first Cleanup Groups UI is live.
- Workflow integration is live.
- No sender membership drift occurred during the migration lane.
- No hard URL normalization shipped as part of this lane.
- No artifact rebuild or canonical-publish activation shipped as part of this lane.

### Explicit boundary

- This migration lane is complete for the approved scope.
- Deferred as separate future slices:
  - Cleanup Groups card-compression / summary-first UI refinement
  - any later alias-retirement decision after the compatibility window
  - any later activation of the prepared canonical-publish artifact switch

## 🚀 March 30 — Cleanup Groups Rediscovery Phase C Complete

### What changed

- Cleanup Groups UI now renders from the canonical lane-first structure.
- The live page now uses the locked lane order:
  - `Action`
  - `Backlog`
  - `Coverage`
  - `Secondary`
  - `Context`
- The rollout-1 surfaced canonical set is now live:
  - `semantic.marketing_subscriptions`
  - `structural.backlog`
  - `structural.unresolved`
  - `structural.protected_trust`
  - `secondary.account_updates`
  - `context.historical`
- `Secondary` and `Context` are collapsed by default.
- Review units remain nested inside parent groups.
- The live audit harness now validates the canonical cleanup-group runtime contract and still verifies legacy/transitional compatibility.

### Current accepted state

- Cleanup Groups Phase C is complete.
- Cleanup Groups now uses the canonical lane-first structure in UI.
- Secondary/context default collapse is live.
- Canonical cleanup-group ids are now the surfaced UI contract.
- No sender membership drift occurred.
- No hard URL normalization shipped in this phase.

### Explicit boundary

- This lane shipped the Cleanup Groups UI migration only.
- It did **not** ship:
  - workflow integration across Intelligence / Review / Management
  - canonical persistence / management reopen integration
  - card-compression / expand-collapse refinement
  - new query systems
  - sender membership changes
- Phase D is workflow integration.
- Card-compression / detail-collapse refinement remains a future UI follow-on slice after workflow integration.

## 🚀 March 30 — Cleanup Groups Rediscovery Phase A Complete

### What changed

- Cleanup Groups now has a single canonical registry in `web/src/lib/runtime/gmailCleanupClusterIdentity.ts`.
- The registry now owns:
  - canonical ids
  - alias mappings
  - lane
  - group type
  - surfaced status
  - display priority
  - primary-entry eligibility
- The cleanup-cluster resolver now returns canonical descriptor metadata alongside the existing runtime-compatible identity fields.
- `web/src/lib/runtime/gmailCleanupWorkspace.ts` received only the minimal type-safe identity propagation support required for Phase A.

### Current accepted state

- Cleanup Groups Phase A is complete.
- Canonical registry ownership is centralized and no second registry was introduced.
- Alias layer support now exists for rollout-1 normalization.
- No sender membership drift occurred.
- No Cleanup Groups UI behavior changed yet.
- No workflow behavior changed yet.
- No URL behavior changed yet.

### Explicit boundary

- This lane established the canonical registry and alias layer only.
- It did **not** ship:
  - runtime canonical-write normalization
  - UI migration
  - workflow integration changes
  - review-unit rendering changes
  - artifact rebuild work
- Phase B is runtime identity normalization.

## 🚀 March 30 — Shared Analysis Rail Phase 1 Foundation Complete

### What changed

- Sender Overview now has a shared tabbed analysis rail shell with:
  - `Time Context`
  - `Sender Distribution`
- `review/page.tsx` now owns the shared workflow-subset contract as page-session normalized truth for:
  - chart context
  - workflow list integration
  - guided Decision Mode handoff
- `review/page.tsx` also remains the only owner of active rail tab state and no-rehydrate safeguards.
- `GmailCleanupComponents.tsx` stayed presentation-only.

### Current accepted state

- Shared Analysis Rail Phase 1 foundation is complete.
- The tabbed rail shell exists and is live.
- Sender Distribution is still placeholder-only by design in this phase.
- No backend/API/query changes were made in this lane.
- No page-wide rehydrate behavior was introduced.
- Current Time Context rendering and timeframe-chip behavior remain unchanged.
- Current workflow list, contributor/focused-sender behavior, guided Decision Mode behavior, and the existing contributor chart below the rail remain unchanged.

### Explicit boundary

- This lane established the rail foundation only.
- It did **not** ship:
  - Sender Distribution chart logic
  - distribution ranking behavior
  - timeframe-driven workflow behavior changes
  - backend or persistence work
- Phase 2 is the actual Sender Distribution chart implementation on top of this foundation.

## 🚀 March 30 — Subscription-Senders Sender Overview Load Stability Accepted

### What changed

- The accepted load-stability lane is now closed as fixed.
- `subscription-senders` first-entry Sender Overview loading is stable again.
- The final accepted fix combined three narrow behaviors:
  - preserve the warm timeframe-switch behavior that no longer re-triggers `/api/agents/playground`
  - reuse persisted scoped cleanup snapshots for default Sender Overview workspace loads on `60d` / `90d` / `365d`
  - restore the accepted `7d` fallback so `empty_with_index_potential` resolves through fresh read-only scoped discovery instead of terminating as `unavailable_scope`
- `7d` readonly scoped discovery was also tightened so it can recover from recent-truth mismatch without loading the entire indexed corpus.

### Current accepted state

- Pages load correctly again for this lane.
- Chart timeframes open correctly.
- The earlier terminal flood / runtime churn pattern is no longer reproducing in accepted validation.
- `7d` renders again instead of falling into broken unavailable / false-empty state.
- Broader scoped views remain healthy.
- This accepted lane does **not** require any Smart Sync, artifact-publication, cleanup-group restructure, or chart-redesign follow-up to stay valid.

### Runtime / browser proof now locked

- Final terminal proof showed:
  - `7d -> readonly_scoped_discovery`
  - `7d scope_resolution -> snapshot_ready`
  - `runtime_state_total_ms ~ 8.9s`
  - `preferred_cluster_review_bootstrap_ms ~ 5.7s`
- Final broader-scope proof for `subscription-senders` showed:
  - `60d ~1.5s`
  - `90d ~1.6s`
  - `365d ~2.1s`
  - scoped snapshot reuse remained applied
  - `rejected_candidate_count_mismatch` was gone on the accepted default overview path
- Final browser proof on `localhost:3000` showed:
  - `subscription-senders` cold first usable at about `4.7s`
  - `protected-trusted-senders` cold first usable at about `5.5s`
  - no `Failed to load sender workspace`
  - `7d` present as `ready` in runtime-selected cluster rail family for both lanes

### Explicit accepted boundary

- Accepted for this thread:
  - stable first-entry Sender Overview loading for `subscription-senders`
  - preserved `7d` rail recovery
  - preserved faster scoped timeframe switching behavior
  - removed broken runtime churn / regression patterns that were surfacing in this lane
- Explicitly non-blocking for this thread:
  - sparse daily-bar density when recent data is honestly sparse
  - any future presentation/product decision about zero-activity day rendering

## 🚀 March 29 — Sender Overview 7-Day Rail Bootstrap Recovery Accepted

### What changed

- The remaining `1W` Sender Overview failure was traced to selected-cluster rail bootstrap, not Smart Sync freshness and not artifact publication.
- Runtime was reusing a persisted scoped cleanup snapshot that was structurally valid but semantically invalid for current indexed coverage:
  - `visible_cluster_count === 0`
  - indexed coverage already supported non-zero `7d` cluster discovery
- Selected-cluster rail bootstrap now rejects persisted scoped snapshots when they are:
  - expired
  - behind current indexed coverage
  - empty despite indexed coverage showing non-zero cluster potential
- Rejected or missing unpublished scoped snapshots now fall through to read-only scoped discovery with no artifact-layer or persistence-side effects.

### Current accepted distinction

- For this tenant, `7d` should show daily bars right now.
- The prior `snapshot_outside_timeframe` / zero-cluster `1W` result was false-empty, not honest-empty.
- Honest `1W` comparison-only remains acceptable only when fresh scoped discovery truly excludes the selected cleanup group.
- Some live `7d` charts currently render only `2–3` visible day bars.
- That is accepted as non-blocking for this lane and is currently treated as likely honest daily activity visibility, not proof of a broken `7d` bootstrap.
- Whether the chart should render all seven calendar days including explicit zero-activity days remains a separate presentation/product question.
- The `24`-month historical cutoff remains expected bounded-backfill behavior and is unrelated to this fix.

### Thread status

- The `7d` Sender Overview rail lane is accepted as recovered.
- The fix remains isolated to selected-cluster rail bootstrap in `runtimeStateService`.
- Artifact publication, Smart Sync, mailbox-index recovery, and Slice 2 cleanup-group promotion work all remain out of scope for this closed lane.
- The later `subscription-senders` load-stability follow-up is now also accepted as closed in its own lane.

### Runtime validation proof

- Published artifact state remained unchanged:
  - `published_version = full-mailbox-20260329092447406`
- Live runtime proof after the fix showed `7d` resolving `ready` with `day` granularity and visible cluster count `7` for:
  - `subscription-senders`
  - `protected-trusted-senders`
  - `needs-review-senders`
  - `historical-out-of-inbox-senders`
- First-pass bootstrap evidence showed the stale empty `7d` snapshot rejected with:
  - `persisted_snapshot_rejected_reason = empty_with_index_potential`
- Runtime then fell through to:
  - `snapshot_source = readonly_scoped_discovery`

## 🚀 March 29 — Cleanup-Group Legacy Rollup Compatibility Restored

### What changed

- Narrow stabilization fix shipped for the live Gmail artifact-backed cleanup-group read path.
- Root cause was a backward-compatibility break between:
  - legacy published `semantic_rollup` payloads
  - new Slice 2 nested fields:
    - `surface`
    - `promotion`
    - `review_unit_plan`
- Runtime parsing could reconstruct a legacy rollup without those nested fields, then later mirror logic dereferenced `rollup.surface.tier` as if it were always present.
- Fixes now in place:
  - `gmailSemanticRollupContract.ts`
    - compatibility-normalizes legacy rollups before mirroring/validation
    - no longer throws when `semantic_rollup.surface` is absent
  - `gmailCleanupWorkspace.ts`
    - parses nested Slice 2 metadata when present
    - repairs legacy rollups when nested Slice 2 metadata is absent
    - builds cleanup-group mailbox intelligence from normalized parsed analytics instead of assuming mirrored surface fields already exist on the artifact row

### Why it mattered

- This was a live P0 regression:
  - `Sender Overview` cleanup-group loads could fail with `Failed to load sender workspace`
  - `/api/agents/playground` could 500 on the same semantic-rollup mirror path
  - safe-partial fallback could degrade valid artifact-backed groups to zeroed workspace truth
- The correct response was a narrow read-path compatibility repair, not broader Slice 2 rollout work.

### Validation status

- Targeted lint ran on the touched files:
  - `0` errors
  - `4` pre-existing warnings in `gmailCleanupWorkspace.ts`
- Live browser validation on `http://127.0.0.1:3000` succeeded for:
  - `subscription-senders`
  - `system-notification-senders`
  - `protected-trusted-senders`
  - `needs-review-senders`
  - `historical-out-of-inbox-senders`
- Live browser-backed `POST /api/agents/playground` returned `200` during the stabilized intelligence mount.

### Current rule

- Legacy published Gmail artifacts must remain readable even when Slice 2 nested cleanup-group metadata is absent.
- Any new Slice 2 schema expansion must be parse-safe and optional before it is allowed to flow through live artifact-backed runtime paths.
- Forward Slice 2 regrouping work is paused until this stabilization baseline is accepted.

## 🚀 March 29 — Operations Runtime Pressure Incident Resolved + Current Guidance

### What changed

- Root cause summary:
  - the artifact-backed architecture remained broadly correct
  - pressure came from two combined hot-path problems:
    - unnecessary rehydrate triggers in `OperationsRuntimeContext`
      - warm cached remount could force rehydrate
      - focus / visibility could force rehydrate without a change-driven reason
    - timeout-prone preferred-cluster cleanup snapshot lookup behavior in `runtimeStateService`
  - combined effect:
    - repeated `/api/agents/playground` pressure
    - degraded selected-cluster bootstrap on preferred-cluster rehydrates
- Fixes now in place:
  - `OperationsRuntimeContext` trigger regression removed:
    - warm cached remount no longer forces rehydrate
    - focus / visibility no longer force rehydrate without a change-driven reason
  - preferred-cluster snapshot timeout path fixed in `runtimeStateService`:
    - cache-first scoped cleanup snapshot lookup
    - supporting `agent_events` cleanup-snapshot lookup indexes added
      - `20260329131500_agent_events_cleanup_snapshot_lookup_indexes.sql`
  - selected-cluster rail bootstrap optimization was already shipped and remains part of the stable path:
    - cache / versioned rail-family reuse for repeated preferred-cluster rehydrates

### Why it mattered

- The incident looked like a Supabase capacity problem, but the main failure mode was trigger multiplication plus a timeout-prone hot lookup.
- One degraded preferred-cluster runtime lookup was enough to slow or fail selected-cluster bootstrap and make the whole system appear underprovisioned.
- The correct response was to keep the artifact-backed architecture, remove unnecessary rehydrate triggers, and harden the `agent_events` lookup path feeding selected-cluster review bootstrap.

### What to watch next

- Stay on the upgraded Supabase tier for now.
- Treat `/api/agents/playground` as a hot path.
- Treat `agent_events` cleanup snapshot lookup as a hot-path dependency.
- Future runtime changes must capture before / after timing for:
  - total rehydrate
  - `cleanup_plan_ms`
  - `selected_cluster_rail_family_load_ms`
  - `preferred_cluster_review_bootstrap_ms`
- Warm-path validation is mandatory:
  - validate repeated rehydrate behavior
  - do not rely on cold-load validation alone

### Current accepted product state

- Sender Overview timeframe behavior is currently accepted as correct.
- `subscription-senders` UI / productization validation is accepted.
- `subscription-senders` remains one cleanup group in the current artifact-backed model; no taxonomy split shipped.
- Cleanup-group restructuring into smaller artifact-defined groups remains open work.

### Lessons learned

- Do not assume a pressure incident is “just scale” before checking timeout-prone hot queries and trigger multipliers.
- One degraded runtime lookup can make the whole system appear underprovisioned.
- Runtime validation must include repeated rehydrate behavior, not only first-load behavior.

## 🚀 March 28 — Subscription-Senders Semantic Improvement Phase 3 Completed

- Exact artifact baseline used for the accepted Phase 3 pass:
  - `full-mailbox-20260327004328180`
- Scope completed:
  - surgical resolver-only pass in `gmailSenderProfile.ts`
  - production logic changes limited to:
    - `resolveSemanticPatternSelection(...)`
    - `resolveMarketingPromotionalSubtype(...)`
  - verification packet added for target-pool accounting and guardrail proof
- Locked before/after metrics:
  - resolved marketing subtype senders: `472 -> 481`
  - resolved marketing subtype coverage: `59% -> 60%`
  - unresolved promotional remainder: `327 -> 318`
  - `offer_campaign`: `252 -> 252`
  - `product_marketing_update`: `174 -> 179`
  - `editorial_newsletter`: `46 -> 50`
  - pattern clear share: `3% -> 5%`
  - headline family persistence: `provisional -> provisional`
  - headline pattern persistence: `provisional -> provisional`
- Target-pool outcome:
  - execution-start target pool: `123`
  - stayed unresolved: `114`
  - resolved to `product_marketing_update`: `5`
  - resolved to `editorial_newsletter`: `4`
  - resolved to `offer_campaign`: `0`
  - excluded by stronger concrete non-marketing evidence: `18`
  - resolved outside the target pool: `0`
- Guardrails held:
  - weak-history stayed unresolved:
    - `183` before
    - `0` resolved after
  - mixed stayed unresolved:
    - `21` before
    - `0` resolved after
  - already-resolved subtype preservation held:
    - already-resolved before: `472`
    - preserved resolved after: `472`
    - same-subtype preservation: `472`
    - downgraded / churned: `0`
  - offer anti-regression held:
    - target-pool offer gains: `0 / 9`
    - combined product + editorial gains: `9`
- Strategic consequence:
  - this Phase 3 implementation thread is complete and accepted
  - headline persistence is still allowed to remain `provisional` because the remaining blocker stayed outside the targeted pool and outside current scope
  - the correct next step is a new planning thread for subscription semantic rebuild/publication planning
  - that next thread should be limited to:
    - rebuild/publication planning
    - post-rebuild validation against the locked baseline
    - deciding whether a new split-readiness evaluation is needed after publication
  - it should explicitly not be:
    - a taxonomy-split implementation thread
    - a UI thread
    - another broad semantic tuning thread

---

## 🚀 March 28 — Subscription-Senders Split-Readiness Evaluation Completed

- Exact artifact baseline used for the accepted evaluation:
  - `full-mailbox-20260327004328180`
- Evaluation outcome:
  - `subscription-senders` is **not** split-ready yet
  - semantic blockers remain primary
  - operator evidence is still too thin to strengthen a split case
  - the approved next step is a separate `subscription-senders` semantic-improvement planning thread
- Accepted evaluation findings:
  - `subscription-senders` contains `853` senders and `69,089` cleanup-group messages in the published artifact
  - `marketing_promotional` still dominates the lane at `799 / 853` senders (`94%`)
  - published artifact resolved marketing subtype coverage remains only `244 / 799` (`31%`)
  - the published unresolved promotional remainder (`555` senders) is still larger than the strongest candidate internal seam (`offer_campaign` at `151` senders)
  - published headline subtype persistence remains `provisional`, not split-ready
  - current persisted operator evidence is still thin:
    - `16` destination profiles total for the current agent
    - only `3` intersect `subscription-senders`
    - no reviewed senders yet land in `offer_campaign`, `product_marketing_update`, or `editorial_newsletter`
- Explicit non-changes for this evaluation:
  - no resolver change
  - no schema change
  - no rebuild
  - no sender reassignment
  - no UI change
  - no lane promotion
- Strategic consequence:
  - this split-readiness evaluation thread is complete and accepted
  - future work should remain separated into:
    - semantic-improvement implementation first
    - rebuild / publication planning only after the accepted semantic pass

---

## 🚀 March 28 — Cleanup Groups Role Correction + `needs-review-senders` Reframe Completed

- Current accepted Gmail Phase 1 artifact used for this shipped pass:
  - `full-mailbox-20260327004328180`
- Scope completed:
  - Cleanup Groups lane-role language is now explicit and consistent:
    - `Primary action lane`
    - `Backlog lane`
    - `Safety / coverage lane`
  - Existing Cleanup Groups section structure remains intact:
    - `Start Here`
    - `Reduce Backlog`
    - `Exceptions & Coverage`
  - Section summaries, card support copy, and Mailbox Intelligence handoff wording now reflect the locked lane-role model.
  - Sender Overview entry framing now uses the existing bridge-copy seam to explain whether the operator is entering:
    - a default cleanup lane
    - a backlog recovery lane
    - a safety / coverage review
  - `needs-review-senders` is now explicitly framed as low-evidence safety / coverage, not as a default action lane or a coherent semantic bucket.
- Explicit non-changes for this pass:
  - no taxonomy split
  - no artifact change
  - no schema change
  - no sender reassignment
  - no recommendation-logic or ordering change
  - no rebuild
- Validation:
  - targeted ESLint passed for the touched Cleanup Groups / Mailbox Intelligence / Sender Overview files
- Strategic consequence:
  - the Cleanup Groups Phase A+B role-correction pass is now complete and accepted
  - future work on subscription semantic-improvement, taxonomy redesign gates, and rebuild planning should start in separate next-phase threads

---

## 🚀 March 27 — Gmail Rebuild B Completed (Semantic Focus Performance)

- Rebuild B is now completed and published on:
  - `full-mailbox-20260327004328180`
- Accepted Gmail Phase 1 artifact baseline now moves forward to:
  - `full-mailbox-20260327004328180`
- Scope completed:
  - seed-row semantic membership persistence
  - `last_activity_at` seed-row persistence
  - full-build + incremental projector parity
  - focused semantic artifact page read path
  - safe fallback to `full_cluster_materialization` for unsupported or older artifacts
  - no UI, taxonomy, cleanup-group, or `semantic_rollup` redesign
- Migration status:
  - `20260327101500_gmail_sender_workspace_semantic_focus_seed_rows.sql` applied to hosted Supabase
- Rebuild B validation:
  - `protected-trusted-senders` remains `1838` senders
  - focused lanes now read from `focused_semantic_page`
  - focused counts remain correct:
    - `commerce_transactional / invoices_receipts = 167`
    - `commerce_transactional / commerce_shipping_updates = 206`
    - `account_notification / general_updates = 229`
    - `account_notification / remainder = 299`
  - cold focused loads now land around `2.3s–2.7s`
  - previous corrected fallback baseline for the same large protected focused path was ~`20s–26s`
  - focused stats and preview loads are now page-scoped:
    - `seed_row_count: 12`
    - `stats_count: 12`
    - `preview_row_count: 60`

---

## 🚀 March 27 — Gmail Rebuild A Completed (Structural Preview Seeding)

- Rebuild A is now completed and published on:
  - `full-mailbox-20260326221425010`
- Accepted Gmail Phase 1 artifact baseline now moves forward to:
  - `full-mailbox-20260326221425010`
- Scope completed:
  - bounded structural preview seeding for `no_inbox_rows` senders only
  - full-build + incremental projector parity
  - no schema, taxonomy, cleanup-group, or UI changes
- Validated sender outcomes:
  - `oliver@curativemushrooms.com` now has `preview_ready: true`, `preview_message_ids: 5`, `cleanup_group_message_count: 8003`
  - `support@curativemushrooms.com` now has `preview_ready: true`, `preview_message_ids: 5`, `cleanup_group_message_count: 4631`
  - `consumer@e.mail.realtor.com` remained healthy
  - `seaworld@m.seaworldparks.com` remained healthy
- Validated cluster outcomes:
  - `protected-trusted-senders`: `9/9` structural `no_inbox_rows` senders now preview-ready
  - `historical-out-of-inbox-senders`: `34/34` structural `no_inbox_rows` senders now preview-ready
- Count-truth remained correct:
  - structural `no_inbox_rows` senders keep rollup-backed message totals
  - bounded preview evidence does not collapse `cleanup_group_message_count`
- Rebuild B is now complete:
  - semantic-focus cold-load performance is artifact-backed and page-scoped on rebuilt artifacts

---

## 🚀 March 26 — Gmail Phase 1 Artifact Baseline Freeze

- Accepted Gmail Phase 1 artifact baseline was temporarily locked to:
  - `full-mailbox-20260325230627555`
- That March 26 freeze was superseded on March 27 by Rebuild A:
  - `full-mailbox-20260326221425010`
- The March 26 publication restore was the pre-Rebuild-A operating baseline.
- March 26 semantic-refinement variants were informative, but are not adopted as the Gmail Phase 1 freeze candidate.
  - rejected diagnostic variant: `full-mailbox-20260326012615971`
  - reason: reduced `offer_campaign` inflation, but regressed total marketing subtype coverage inside `subscription-senders`
- Operational rule:
  - March 26 UI work validated against `full-mailbox-20260325230627555` until Rebuild A landed
  - future Gmail artifact work must not treat `full-mailbox-20260326012615971` as the accepted baseline
  - before any future Gmail rebuild, the current resolver code must be reconciled with the accepted baseline decision

---

## 🚀 March 26 — Sender Overview UI (Phase 1B) Progress + Active Issues

**Status:** Sender Overview hierarchy and subtype interaction implemented; moving into runtime reliability fixes and UX polish.

### What is Working
- Semantic family → subtype hierarchy is live and expandable in Sender Overview.
- Denominator correctness implemented:
  - parent rows = % of full group
  - child rows = % of parent + % of group (secondary)
- Subtype → sender list linkage implemented:
  - clicking a subtype triggers a focused sender-workspace request
  - sender list updates based on semantic focus
- Backend empty-result bug fixed:
  - no more `safe_partial` empty results when subtype focus is active
- Baseline artifact (`full-mailbox-20260327004328180`) is actively driving UI truth

---

### ⚠️ Active Issues (UI / Runtime Layer)

1. **Subtype Count Mismatch (Expected, Not Fully Resolved)**
   - Top hierarchy uses persisted artifact counts
   - Bottom sender list uses runtime materialization
   - Counts may diverge (e.g., 303 vs 52)
   - Current UI surfaces this difference instead of hiding it

2. **Focused Load Performance (Resolved For Rebuilt Artifacts)**
   - Rebuild B now persists sender-level semantic membership on seed rows
   - Focused subtype queries now use `focused_semantic_page` on rebuilt artifacts
   - Cold load latency for the protected sample lanes now lands around ~2.3s–2.7s
   - Warm load performance remains good

3. **Decision Card Preview Reliability (Partially Resolved)**
   - Structural preview seeding for `no_inbox_rows` senders is now fixed in:
     - `full-mailbox-20260326221425010`
   - High-volume structural senders like `oliver@curativemushrooms.com` and `support@curativemushrooms.com` now have seeded preview evidence
   - Any remaining Decision Card preview issues are now runtime/rendering-quality issues, not missing artifact evidence for this sender class

4. **Sender Workspace Truth Split (Architectural)**
   - Artifact layer = frozen group-level truth
   - Runtime layer = reconstructed sender-level truth
   - UI layer merges both and exposes divergence

---

### 🎯 Immediate Next Steps (Phase 1B Continuation)

1. **Decision Card Preview Follow-up (Narrow)**
   - Browser-verify rebuilt structural preview evidence in Decision Mode
   - Keep any remaining work bounded to runtime rendering / evidence exploration, not artifact seeding

2. **Sender Overview Row-Level UX Polish**
   - Improve readability of sender rows
   - Ensure semantic hierarchy and sender cards feel connected

3. **Subtype Focus Usability Improvements**
   - Maintain current focus behavior
   - Improve clarity of active focus state

4. **Defer Further Performance Optimization**
   - Do NOT widen beyond the new focused semantic page path yet
   - Revisit only if another focused request shape still falls back materially

---

### 🧭 Strategic Note

Sender Overview has now crossed from:
- data visualization

into:
- operational decision surface

Remaining work is focused on:
- reliability (preview evidence)
- usability (sender interaction)
- clarity (UI polish)

Not on further artifact expansion.

---
## 🚀 March 24 — Gmail Workspace Final Architecture Lock

- Gmail Workspace data access is now locked as the platform’s canonical engine pattern.
- Permanent rules now documented in [gmail_workspace_canonical_engine_pattern.md](/Users/olivercarlin/Documents/ai-agent-platform/ai-agent-platform-docs/03_gmail_workspace/09_reference/gmail_workspace_canonical_engine_pattern.md):
  - request-time flows read published artifacts only
  - no request-time mailbox scans or request-time repair scans
  - sync completion drives async artifact refresh
  - incremental refresh is preferred when eligible
  - full rebuild is fallback-only and must preserve parity
  - browser/runtime surfaces reconcile to artifact-backed truth
- Final proof anchors:
  - proven incremental baseline: `incremental-20260324032902895`
  - published full-build artifact: `full-mailbox-20260324073149125`
  - direct parity proof: `cluster_diff_count: 0`, `sender_diff_count: 0`
  - unchanged acceptance harness: `ok: true`
- Gmail Workspace is now the reference implementation future workspaces must reuse via:
  - ingest
  - derive
  - persist
  - publish
  - serve

## 🚀 March 25 — Cleanup Groups Stable, Semantic Layer Mid-Transition

- Cleanup-group coverage is now complete:
  - live model uses 8 cleanup groups
  - sender assignment coverage is 100%
- Grouping is considered stable at the artifact-backed architecture layer:
  - no request-time rebuild path was reintroduced
  - current review/intelligence surfaces still reconcile to published artifact-backed truth plus compatibility enrichment
- Sender semantic architecture is now upgraded at the type and rollup layers:
  - sender-level semantic meaning now uses `semantic_family` and `semantic_pattern`
  - uncertainty is layered separately through `resolution`, `confidence`, and `provenance`
  - umbrella/decomposition metadata now exists so broad categories can be split later instead of becoming permanent dumping grounds
- Cluster/overview analytics now read from semantic rollups instead of legacy fallback-heavy family/pattern sources.
- Current system stance:
  - architecture = stable
  - cleanup-group coverage = stable
  - 8-group grouping model = stable for now
  - semantic presentation layer = not fully stable yet
- Rebuild policy has changed:
  - do not trigger repeated rebuilds while taxonomy and cleanup-group semantics are still being refined
  - lock the plan first, then perform one final rebuild later

## 🚀 March 24 — Sender Surface Unification (Phase L)

- Sender Overview and Decision Mode are now defined as TWO MODES of a single sender card system:
  - Overview Mode = exploration (many senders, scrollable)
  - Decision Mode = execution (one sender, focused)
- Decision Mode is entered in-place (overlay/focus), not via navigation to a separate screen.
- Context is preserved across transitions:
  - same cleanup group
  - same scroll position on exit
- Entry paths:
  - Guided: "Start Guided Review" begins sequential decisions
  - Direct: clicking a sender opens Decision Mode for that sender
- Single card system:
  - same data, layout, and truth layers in both modes
  - Decision Mode adds actions, progress, and auto-advance only
- Protected/Trusted senders are now modeled as a first-class cleanup group (no separate explanation page required).
- UX rule locked:
  - "If a sender is in focus, a decision must be available."

Strategic state update:
- Platform has transitioned from **data stabilization → unified product surface design**.
- Next focus: implement unified sender card + overlay Decision Mode across Sender Overview.

## 🚀 March 19 — Gmail Backfill + System Stabilization Milestone

- Full mailbox ingestion pipeline is now operational and validated at scale:
  - Indexed dataset exceeded 200,000+ messages successfully
  - Multi-slice backfill continuation confirmed working across sessions
  - Resume checkpoint system verified (no longer restarting from page 1)

- Smart Sync is now fully separated from historical backfill:
  - Runs strictly incremental
  - No longer hijacks or resumes full-history traversal
  - Confirmed via live runs (`incremental / incremental` mode only)

- Operator Backfill system is now correct and stable:
  - Dedicated checkpoint system implemented (`backfill_resume_*`)
  - Checkpoints persist across interruptions, limits, and restarts
  - Resume now continues above previous page index instead of restarting
  - 100k slice limit bug fixed (per-run counter reset properly)

- UI + runtime stability improvements:
  - Button lock issues resolved (stale reconnect + local state bugs fixed)
  - Runtime no longer auto-triggers competing jobs (no more preemption)
  - Mailbox index state now accurately reflects backend truth

- Supabase schema fully aligned:
  - All mailbox index and backfill checkpoint migrations applied
  - Missing column issues resolved (no more GET 500 failures)
  - Remote schema verified against local expectations

- System now supports bounded historical ingestion:
  - Default backfill target: 24 months
  - Optional extension: 36 months
  - Stop condition uses Gmail `internalDate` (post-commit boundary rule)
  - Prevents unnecessary deep historical ingestion

- Strategic state:
  - Gmail ingestion system is now considered **stable and production-ready (Phase 1 complete)**
  - Platform is transitioning from **infrastructure stabilization → product experience build phase**

## 🔥 System Stability

- Supabase pressure is currently mitigated on the upgraded tier and latest runtime fixes.
- `/api/agents/playground` remains a hot path.
- `agent_events` cleanup snapshot lookup remains a hot-path dependency.
- Passive runtime no longer triggers heavy mailbox work on page load.
- Warm cached remounts and focus / visibility transitions no longer force rehydrate without a change-driven reason.
- Normal page navigation no longer launches:
  - cleanup discovery rebuilds
  - mailbox-index sync
  - inbox-analysis 100k-row fallback scans
- CPU spike behavior observed during the March runtime incident is now contained for ordinary browsing paths.
- Cleanup Groups and Decision Mode route reliability are restored under the current containment model.
- Sender Overview and Mailbox Intelligence now recover on first open without reintroducing unsafe passive initial-paint heavy requests.
- Sender Overview → Decision Mode now uses a unified interaction model (no context switching).

## ⚙️ Runtime Behavior

- Passive browsing now behaves as cache/runtime only:
  - cached runtime snapshot first
  - no passive heavy refresh escalation
  - no passive mailbox-index POST triggers
- Manual regeneration is now controlled and optimized:
  - explicit user action required
  - no inline mailbox sync
  - no inline sender-stats recompute
  - bounded discovery-row reuse on repeated runs
- Heavy actions are now:
  - guarded by single-flight protection
  - rate-limited by cooldowns
  - observable through structured logs
- Cold first-open on Review and Intelligence now resolves through safe deferred recovery when no usable runtime/cached seed exists:
  - runtime snapshot if available
  - cached snapshot if available
  - safe fallback content otherwise
  - deferred post-mount fetch only when needed
- Warm loads are fast again once runtime/cached state is present.
- Preferred-cluster bootstrap now uses cache-first scoped snapshot lookup, with cache / versioned rail-family reuse on repeated preferred-cluster rehydrates.
- Decision Mode entry no longer requires navigation; it is triggered from Sender Overview via overlay/focus transition.

## 🛠️ First-Open Recovery Status

- Regression root cause:
  - initial-paint containment was correct, but some operations pages lost a deterministic recovery path after blocked live first-open requests were removed
  - the affected pages were depending too heavily on runtime/cached seeds already being present
- Exact files changed for the recovery fix:
  - `web/src/lib/runtime/gmailCleanupWorkspace.ts`
  - `web/src/lib/runtime/operationsWorkspace.ts`
  - `web/src/app/agents/[id]/operations/clusters/page.tsx`
  - `web/src/app/agents/[id]/operations/review/page.tsx`
  - `web/src/app/agents/[id]/operations/intelligence/page.tsx`
- Behavior before:
  - Cleanup Groups could render blank
  - Decision Mode could require repeated clicking
  - Sender Overview could stall in warming state
  - Mailbox Intelligence could hang on first open
- Behavior after:
  - Cleanup Groups opens from safe runtime/cached state
  - Decision Mode opens on first click
  - Sender Overview first-open no longer stalls indefinitely
  - Mailbox Intelligence first-open no longer hangs
- Safety constraint preserved:
  - no unsafe passive initial-paint heavy path was reintroduced

## 🚧 Known Limitations

- Manual cleanup regeneration still costs roughly `~4s` on a cache-hit run, which is now acceptable but not free.
- Preferred-cluster bootstrap is materially better after the cache-first scoped snapshot lookup fix, but `agent_events` cleanup snapshot lookup is still a hot-path dependency that must be measured on every runtime change.
- Cross-tab duplicate requests are still possible because client-side TTL/single-flight protection is strongest within a tab/session rather than across every open browser process.
- Cold first-open on Sender Overview and some Mailbox Intelligence seed-miss cases is still noticeably slower than warm navigation because recovery now happens through deferred safe fetches.
- Sender Overview semantic visualization is currently the least stable layer:
  - semantic rollups underneath are improved
  - but the current semantic row presentation still has a trust regression around denominator/bar/label interpretation
  - treat the visualization layer as unstable until the semantic presentation pass is complete

## ✅ Golden Path Status

- Mailbox Intelligence now loads safely on normal navigation.
- Sender Overview now loads safely on normal navigation.
- Cleanup Groups now opens safely again on first navigation.
- Decision Mode now opens on first click again.
- No currently known trigger multiplier or timeout-prone preferred-cluster snapshot path remains on the validated warm path.
- Manual heavy operations remain available, but now require explicit action and stay inside guarded execution paths.
- Current strategic focus should stay on Sender Overview semantic truth, visualization honesty, and cleanup-group refinement, while treating future runtime hot-path changes as measurement-first work.

---

# 🟢 System Health

Build: Local development stable; Gmail ingestion, Smart Sync, and operator_backfill systems verified end-to-end. Production build still not fully validated due to Next 16 / Turbopack instability.
Golden Path: Passing  
Typecheck: Clean for current Gmail Phase 1 pass (`npx tsc --noEmit` passed)  
Golden Path Health Check:
- Automated validation script implemented (`web/scripts/golden-path.mjs`)
- Run from `/web` directory using:
  AGENT_ID="your-agent-id" npm run golden-path
- Script verifies the full operational pipeline:
    1. Training orchestrator responds
    2. Feedback logging works
    3. Recalculate quality (dry-run) succeeds
    4. Fine‑tune preview endpoint responds
    5. Playground query executes
    6. Usage logging endpoint records activity
- PASS indicates the platform core loop is operational.
- FAIL indicates infrastructure break (API route, env config, or server not running).

Agents: Healthy  
Documentation: Synced  

- March 17 Mailbox Intelligence dashboard alignment summary:
  - Mailbox Intelligence is now converging toward the "AI Intelligent Decision Dashboard" model:
    - command-first layout
    - sender-decision goal explicitly defined (clean inbox = all senders decided)
    - visual intelligence prioritized over raw metrics
  - Visual intelligence layer improvements (UI-only passes):
    - health rail + scale metrics integrated into a single hero layer
    - pressure trend upgraded to full-width bar-based visualization
    - hover behavior now reveals reasoning (driver, intervention, payoff) instead of repeating visible data
  - Remaining UI gaps identified and tracked for next phase:
    - metric bars lack clear denominators and semantic meaning
    - hover panels still under-informative (need multi-line actionable insight)
    - Mission Control lacks consistent CTA hierarchy (buttons for Do Next / Approval / Resume not standardized)
    - management-layer signals (archive, quarantine, rules) not yet surfaced in dashboard
    - double sidebar layout still impacting visual density
  - Strategic decision:
    - Mailbox Intelligence is considered "near-complete for Phase 1"
    - further refinement will be handled under a new Project Manager to avoid context degradation
  - Validation:
    - UI rendering stable
    - TypeScript + ESLint passing
    - cold/warm load acceptable after prior performance passes

---

Gmail Operations (latest pass):
- March 16 Archive execution verification + restore summary:
  - Archive execution is no longer limited to truth-safe `deferred` after a Gmail mutation request.
  - The archive path now:
    - commits destination state first
    - attempts Gmail inbox-label removal
    - verifies targeted Gmail messages directly
    - only marks archive `succeeded` when inbox removal is actually confirmed
  - Archive sender profiles now retain the targeted archive message ids needed for reversal.
  - `/operations/management` now supports a real archive restore path:
    - restore re-adds `INBOX` to the stored archive scope
    - restore is verified before archive state is cleared
    - if restore cannot be confirmed, the destination state stays active with truthful warning state
  - Non-archive destinations remain intentionally non-executing in Phase 1:
    - `KEEP` = `not_applicable`
    - `QUARANTINE` = `deferred`
    - `UNSUBSCRIBE` = `deferred`
    - `CUSTOM_RULE` = `deferred`
  - Validation:
    - targeted archive execution ESLint passed
    - `npx tsc --noEmit` passed
    - production build was intentionally not rerun in this pass

- March 16 Decision Destinations execution-truth summary:
  - Destination state and execution state are now modeled separately in Gmail sender destination profiles.
  - Sender destination profiles now store:
    - destination state
    - execution state
    - execution timestamp/source
    - execution warning
    - last action timestamp
  - Archive is now truth-first:
    - destination state still commits immediately on Confirmation approve
    - archive failures set execution state to `failed`
    - archive requests that were accepted by Gmail but not independently verified are marked `deferred`
    - archive is no longer reported as executed just because the mutation request returned successfully
  - Decision Management now shows execution truth directly:
    - destination state
    - execution state
    - last action timestamp
    - warnings needing follow-up
    - scaffold-level destination removal control
  - Left navigation now reflects the destination model more clearly:
    - `Management` is part of the primary Gmail cleanup workflow
    - `Pending Approvals`, `Executed Actions`, and `History` remain route-safe but are explicitly demoted to legacy/audit surfaces
  - Validation:
    - targeted destination/execution ESLint passed
    - `npx tsc --noEmit` passed
    - production build was intentionally not rerun in this pass

- March 16 Decision Destinations foundation summary:
  - Confirmation approval no longer creates a new Pending Approval request for Gmail cleanup decisions.
  - Approved senders now move directly into durable destination states:
    - `KEEP`
    - `ARCHIVE`
    - `QUARANTINE`
    - `UNSUBSCRIBE`
    - `CUSTOM_RULE`
  - Gmail cleanup memory now persists sender destination state in two layers:
    - sender-level history events in `agent_events`
    - current sender profile documents in `rag_documents`
  - Archive decisions now attempt direct Gmail archive execution immediately after destination-state commit:
    - no new Pending Approval request is created for the archive path
    - non-archive destinations remain durable post-confirmation states only in this pass
  - Sender profile scaffolding now stores:
    - sender identity
    - trust signals snapshot
    - current destination state
    - destination history
    - last action timestamp
  - A new route-safe Decision Management scaffold is available at `/operations/management`:
    - destination summaries
    - sender state overview
    - recent decision activity
    - deferred AI rule recommendation placeholder
  - The active Phase 1 workflow remains unchanged before approval:
    - Mailbox Intelligence
    - Cleanup Groups
    - Sender Decisions
    - Confirmation
  - Validation:
    - targeted destination-layer ESLint passed
    - `npx tsc --noEmit` passed
    - production build was intentionally not rerun in this pass

- March 15 Mailbox Intelligence cold-load performance summary:
  - Cold Mailbox Intelligence no longer depends on strictly sequential indexed-row paging.
  - The indexed `gmail_messages` loader now:
    - reuses in-flight row loads
    - loads pages concurrently on the cold path
    - emits explicit indexed-row load timing logs for future measurement
  - Mailbox Intelligence server caches are now keyed to the actual indexed mailbox snapshot rather than cleanup-plan timestamp churn:
    - raw mailbox context now reuses cache when indexed totals/date span are unchanged
    - derived workspace cache now reuses that mailbox snapshot plus cluster signature
  - Mailbox Intelligence client boot is more resilient:
    - latest stable Intelligence cache can render first if the exact cleanup-snapshot cache misses
    - `/operations/intelligence` now shows a runtime-backed mission boot panel instead of a blank full-page stall while detailed intelligence finishes loading
  - Validation:
    - targeted Gmail performance ESLint passed
    - `npx tsc --noEmit` passed
    - production build was intentionally not rerun in this pass

- March 15 Mailbox Intelligence simplification summary:
  - Mailbox Intelligence now reads as one coherent high-level control surface instead of a mission header stacked on top of an older analytics dashboard.
  - The top mission-control section remains intact:
    - sender-first inbox briefing
    - current status
    - next recommended action
    - top risk
    - inbox health
    - progress
    - approval queue
    - resume work
  - The lower half is now much simpler:
    - one `Inbox Health Outlook` block explains why health is in its current state, what matters most, what improves it fastest, and how pressure is moving
    - one compact pressure-trend visual remains as the supporting mission visual
    - Cleanup Groups is reduced to a minimal handoff preview with one recommended group, one optional alternate, and a CTA
  - Low-value technical hierarchy UI was removed from Mailbox Intelligence:
    - the scope ladder no longer renders on this page
    - the older telemetry-heavy metric/status blocks are gone from this surface
  - Validation:
    - targeted Mailbox Intelligence ESLint passed
    - `npx tsc --noEmit` passed
    - production build was intentionally not rerun in this pass

- March 15 Mailbox Intelligence mission-control summary:
  - Mailbox Intelligence is now more explicitly the high-level mission / status surface for Phase 1:
    - current status
    - inbox health
    - progress
    - next recommended action
    - top risk
    - started work / resume work
    - approval queue
  - Sender-first framing is stronger:
    - sender counts lead the page
    - whole-mailbox senders and inbox rows remain as supporting context only
    - raw message totals no longer dominate the first-view hierarchy
  - Cleanup Groups duplication is reduced again:
    - Intelligence now previews only the single top recommended sender group
    - the page more clearly positions Cleanup Groups as the full cluster-selection surface
  - High-level visuals remain, but are framed as inbox-health drivers instead of deeper sender-review analytics.
  - Validation:
    - targeted Mailbox Intelligence ESLint passed
    - `npx tsc --noEmit` passed
    - production build was intentionally not rerun in this pass

- March 15 Phase 1 UX structure polish summary:
  - Mailbox Intelligence is now more intentionally the high-level mission dashboard:
    - sender-first summary cards lead the page
    - high-level sender volume/timeline context remains
    - low-value `loaded_preview_rows` emphasis is removed from this stage
    - Cleanup Groups is previewed lightly instead of duplicated heavily
  - Cleanup Groups is now more clearly the full sender-group selection surface:
    - Intelligence previews only the top two groups plus a direct CTA into Cleanup Groups
    - cluster cards now expose lightweight expandable sender context and review cautions
  - Sender Decisions is now more clearly the drill-down workspace:
    - cluster-specific hero + briefing
    - saved-decision progress summary
    - quick sender-centric filter chips
    - clearer sender-profile badges and explanation copy
  - Confirmation wording is more operator-facing:
    - `Archive now after approval`
    - keep / quarantine / unsubscribe / custom rule framed as saved Phase 1 preferences for later
    - stored-later copy now says Gmail does not change yet for those actions
  - Navigation wording now reinforces the same hierarchy:
    - Mailbox Intelligence = mission / status / high-level summary
    - Cleanup Groups = full sender-group selection surface
    - Sender Decisions = sender analytics and evidence drill-down
    - Confirmation = archive-now plus saved-later review
  - Validation:
    - targeted Gmail ESLint passed
    - `npx tsc --noEmit` passed
    - full-repo `npm run lint` still fails on unrelated legacy lint debt outside the Gmail workspace
    - production build was intentionally not rerun in this pass

- March 15 Phase 1 runtime stabilization summary:
  - Interactive Phase 1 routes now serve the latest stable cached runtime snapshot immediately instead of auto-refreshing just because the local snapshot aged past a short TTL.
  - Cached runtime refresh is now materially driven:
    - no cached runtime snapshot
    - zero-cluster cleanup plan with indexed mail available
    - or true indexed snapshot advancement
  - “Indexed snapshot advancement” is now based on actual indexed mailbox changes:
    - indexed total rows
    - indexed inbox rows
    - indexed date-span start/end
    not raw sync timestamp movement alone.
  - Cleanup discovery refresh on the server now follows the same stricter rule, which reduces surprise recomputation during normal navigation.
  - Sender Decisions direct entry is more stable:
    - the route now waits for deterministic recommended-cluster resolution instead of beginning sender-workspace fetches for a fallback cluster first
    - this reduces cold-load churn and helps avoid the earlier hanging loading state
  - Net effect:
    - Mailbox Intelligence, Cleanup Groups, and Sender Decisions are more likely to stay on a stable UI-safe snapshot while background refresh work remains separate
  - Validation:
    - targeted Gmail/runtime ESLint passed
    - `npx tsc --noEmit` passed
    - full-repo `npm run lint` still fails on unrelated legacy lint debt outside the Gmail workspace
    - production build was intentionally not rerun in this pass

- March 15 Phase 1 UX validation fix summary:
  - Sender Decisions direct-entry reliability is improved:
    - `/operations/review?stage=senders` now auto-selects a recommended cleanup group when `cluster_id` is missing or stale
    - recommendation prefers the most recently active draft-backed cluster for the current snapshot, otherwise falls back to the first sender cluster
    - the page now shows a loading handoff instead of an empty “no cleanup group selected” state
  - Phase 1 draft persistence restore now behaves correctly:
    - selected cleanup-group drafts hydrate before write-back is allowed
    - this fixes the empty-draft overwrite race that could erase sender decisions on return
    - local Phase 1 decisions now restore more reliably across navigation, reload, and pagination changes
  - Sender Decisions search now keeps focus while remaining debounced.
  - Sender Decisions analytics now own sender-specific operational charts:
    - sender category distribution
    - sender activity timeline
    - cluster contribution
    - chart actions now drive the visible sender list directly
  - Mailbox Intelligence is now high-level only:
    - sender-specific analytics moved out
    - cleanup groups are previewed there, but the full selection surface remains on the Cleanup Groups page
  - Sender workspace performance is further reduced on cold review loads:
    - `sender_page` signal loading now avoids the broad indexed `gmail_messages` scan and uses `gmail_sender_stats` as the fast path
    - sender search can now match category/pattern/verification text without widening the server query scope
  - Navigation-triggered discovery rebuilds are tighter:
    - stale snapshot TTL alone no longer forces cleanup-discovery refresh during normal rehydrate flows
    - runtime refresh now keys off actual indexed snapshot differences, not just sync timestamp movement
  - Confirmation now allows Phase 1-safe editing:
    - change decision type
    - clear a decision
    - jump back into Sender Decisions for that sender
    - archive still remains the only live Gmail executor
  - Validation:
    - targeted Gmail/runtime ESLint passed
    - `npx tsc --noEmit` passed
    - full-repo `npm run lint` still fails on unrelated legacy lint debt outside the Gmail workspace
    - production build was not relied on in this pass because the separate Next 16 / Turbopack build hang remains unresolved

- March 15 Phase 1 follow-up summary:
  - Gmail cleanup cache invalidation for the active Phase 1 routes is now tied to the cleanup snapshot (`runtime_cleanup_plan.generated_at`) instead of broader mailbox-profile freshness.
  - Mailbox Intelligence and Cleanup Groups now prefer exact cached intelligence payloads synchronously before firing new requests.
  - Client Gmail cleanup API caching is now stronger:
    - 10-minute TTL
    - memory cache
    - sessionStorage mirror for same-session warm returns
  - Server Gmail cleanup runtime now has a dedicated mailbox-context cache:
    - indexed mailbox coverage + scoped indexed rows are reused independently of cleanup-cluster derivation
    - derived-workspace cache keys are order-stable across cluster arrays
  - Sender Decisions now has a dedicated cached sender-workspace base state:
    - selected-cluster sender derivation and sender-index signal loading run once per cleanup snapshot + cluster
    - search / filter / sort / pagination now operate on cached derived sender state instead of rebuilding the full sender base
  - Sender Decisions interaction behavior is improved:
    - sender search is debounced
    - sender-workspace requests now support abort / last-request-wins behavior
    - same-cluster interactions keep stale-ready sender data on screen while the next filtered slice loads
  - Phase 1 draft persistence is more durable:
    - drafts now store snapshot version metadata
    - session-scoped draft keys remain primary
    - cluster-level fallback draft keys restore decisions when the operator returns through a slightly different session path
  - Confirmation wording is clearer:
    - archive executes only after approval
    - keep / quarantine / unsubscribe / custom rule are stored-later Phase 1 decisions
    - undecided senders remain untouched
  - Validation:
    - targeted Gmail-surface ESLint passed
    - `npx tsc --noEmit` passed
    - `npm run build` hung again during Next 16 / Turbopack compile and was terminated after diagnostics

- March 15 Phase 1 sender-first foundation stabilization summary:
  - Gmail cleanup is now enforced as sender-first at the cluster-generation layer, not just in UI copy.
  - Cleanup groups now assign each sender to one deterministic sender cluster.
  - Shared cached derived workspace state now powers:
    - `mailbox_intelligence`
    - `sender_workspace`
    - `confirmation_preview`
  - Mailbox Intelligence and Cleanup Groups now reuse the same cached intelligence payload client-side.
  - Sender Decisions now has working server-backed:
    - search
    - filter
    - sort
    - direction
    - filtered pagination metadata
  - Sender evidence is now loaded only for visible sender rows, reducing unnecessary payload on large groups.
  - `/operations/review` now treats only these as active Phase 1 stages:
    - `senders`
    - `confirmation`
  - Direct visits to:
    - `stage=exceptions`
    - `stage=rules`
    - `stage=monitoring`
    now render route-safe Phase 2+ placeholders instead of pretending those later-phase systems are complete.
  - Mailbox Intelligence visuals are restored as lightweight cached analytics:
    - top cleanup senders
    - sender volume distribution
    - category breakdown
    - activity timeline
    - cleanup-group contribution cards
    - searchable/sortable sender ranking table
  - Runtime cleanup snapshot version was bumped so old message-first cleanup snapshots are invalidated.
  - Validation:
    - targeted Gmail-surface ESLint passed
    - full-repo `npx tsc --noEmit` passed
    - full-repo `npm run lint` still fails on unrelated legacy files outside Gmail operations scope
    - `npm run build` was started but did not complete within the observed terminal window, so clean build status is not yet claimed

- March 14 architecture correction summary:
  - Gmail cleanup is now implemented as one sender-first guided product.
  - Primary flow now reads:
    - `Intro & Health`
    - `Mailbox Intelligence`
    - `Cleanup Groups`
    - `Sender Decisions`
    - `Exceptions / Verification`
    - `Confirmation`
    - `Rules / Automation`
    - `Monitoring`
  - `Mailbox Intelligence` is now the true Gmail cleanup dashboard:
    - whole mailbox context
    - cleanup-candidate context
    - protected/safe context
    - cleanup-group contribution cards
    - sender ranking table
  - `/operations/review` is now a staged sender-first workspace:
    - `stage=senders`
    - `stage=exceptions`
    - `stage=confirmation`
    - `stage=rules`
    - `stage=monitoring`
  - Exact current-message impact is now shown in Confirmation, not in sender-review cards.
  - Archive is the only live Gmail mutation in this pass.
  - `Keep`, `Quarantine`, `Unsubscribe`, and `Custom Rule` are learned policies / future automation intents only.
  - Gmail cleanup memory is now explicitly wired:
    - sender policies stored in `agent_events`
    - rule intents stored in `agent_events`
    - active memory mirrored into `rag_documents`
    - Monitoring now reads event memory + semantic Gmail memory to generate recommendations
  - Validation:
    - targeted lint passed for rebuild files
    - full-project `tsc --noEmit` still fails only on unrelated pre-existing files (`fine-tune`, `summary`, `api/rag/run`)

- Gmail Operations naming is now congruent across navigation and page structure:
  - Operations Overview
  - Mailbox Intelligence
  - Cleanup Groups
  - Batch Review
  - Pending Approvals
  - Executed Actions
  - History
- Operations Overview now clearly reads as the operational shell only:
  - health/status
  - indexed mailbox state
  - pending approvals
  - next-step guidance
  - detailed analytics explicitly live in Mailbox Intelligence
- Mailbox Intelligence now clearly reads as the analytics-first layer:
  - it explains the cleanup goal in operator language
  - it explicitly represents the Cleanup Candidate Universe rather than the whole mailbox
  - it bridges into Cleanup Groups and then Batch Review
- Cleanup Groups now clearly reads as the post-intelligence selection step.
- Batch Review now presents a stronger guided flow inside the existing route:
  - Step 1: Batch Overview
  - Step 2: Sender Decisions
  - Step 3: Message Verification
  - Step 4: Approval / Rule Recommendation
- The top workflow strip now mirrors the product navigation labels instead of using a separate internal vocabulary.
- Step 2 sender preview guidance is clearer:
  - preview affordance is explicitly named
  - sender preview tells operators to use the same full preview path as Step 3 when snippet text is not enough
- Inbox Overview is now intentionally operational-first:
  - keeps refresh state, indexed mailbox health, pending approvals, and “what next” guidance
  - no longer acts like the primary analytics page
  - background-prewarms Mailbox Intelligence for the current cleanup-group universe
- Mailbox Intelligence is now explicitly the analytics-first cleanup layer:
  - it is labeled as the **Cleanup Candidate Universe**, not the whole mailbox
  - it explains the cleanup goal in plain English
  - it bridges Whole Mailbox -> Cleanup Candidate Universe -> Cleanup Groups -> Batch Review
- `cleanup_group_intelligence` now uses server-side cache + inflight reuse keyed by:
  - tenant
  - analysis scope
  - cleanup-group universe
  - runtime snapshot/cache version
- Cold-path diagnosis is now explicit:
  - the dominant first-load cost is `indexed_rows_load_ms` when the indexed cleanup-universe rows are first loaded into memory
  - aggregation/build work is comparatively small
- Latest captured evidence for `cleanup_group_intelligence`:
  - pre-patch cold loads: roughly `41.8s` to `42.7s` server-side
  - pre-patch warm loads: roughly `444ms` to `478ms` server-side
  - post-patch normal operator flow after Overview prewarm: roughly `418ms` to `539ms` server-side
  - post-patch first uncached background prewarm can still pay the heavy first indexed-row load (~`42s`) before subsequent requests are warm
- Review sender preview fallback copy is clearer:
  - if Gmail does not return preview text for a sender-row email, the UI now explicitly tells the operator to use full preview instead of implying broken/missing content
- New top-level `Mailbox Intelligence` step now sits between Inbox Overview and Cleanup Groups:
  - route: `/operations/intelligence`
  - purpose: show the full cleanup candidate universe before any bounded batch review starts
  - data source: indexed mailbox rows only (no snippet fetches, no mutation controls)
- Mailbox Intelligence now renders indexed cleanup-universe analytics:
  - top senders across all current cleanup groups
  - sender volume distribution
  - activity timeline
  - category breakdown
  - human vs automation ratio (inferred, explicitly labeled)
  - sender count ranking table
- Intelligence metrics are computed from the union of current cleanup groups across the selected analysis window, deduped by message id, so the page represents the full cleanup universe rather than a 1,000-row review batch.
- Workflow order is now explicitly:
  - Inbox Overview
  - Mailbox Intelligence
  - Cleanup Groups
  - Batch Review
- Live authenticated Chrome screenshot captured for the new intelligence page:
  - `/tmp/gmail-intelligence-auth-fullpage.png`
- Live review UI milestone now visibly landed in Chrome on localhost:
  - bottom Message Review now shows subject + snippet content for hydrated visible rows
  - top analytics are now more legible chart cards (ranked bars, donut charts, column chart)
  - sender/message pagination now use the same visible control pattern with clear range + page-size state
  - signal availability is now explained in plain English (`Gmail tells us directly` / `We infer carefully` / `Gmail does not provide here`)
- Browser-verified live review evidence captured from the active local Chrome tab:
  - `Senders per page` + `Showing senders 1-10 on page 1/5`
  - `Messages per page` + `Showing 1–50 of 1000 messages in this batch`
  - visible chart titles: `Top senders`, `Category distribution`, `Recency distribution`, `Unread / protected mix`
  - visible signal explanation and bottom message snippets copied from the rendered page
- Background regenerate now has stronger index-reuse behavior for cleanup discovery:
  - if the indexed mailbox already covers the selected analysis scope and recent index state is usable, background cleanup refresh can reuse current indexed coverage instead of paying for another heavy sync first
  - operator-triggered background refresh now blocks fallback full-rescan recovery during cleanup analysis recompute
- Cleanup discovery diagnostics now expose whether current indexed coverage was reused:
  - `index_sync_reused_existing_coverage`
- Live snippet hydration is more robust:
  - visible-row snippet requests now retry transient Gmail failures
  - token refresh is attempted on `401`
  - snippet failure logs now include failure buckets and failed id samples
- Sender-detail indexed-history loading is more targeted:
  - request mode now distinguishes single-sender detail vs visible sender-page history
  - indexed row scans are limited to recent 180-day evidence with tighter row caps for sender-detail opens
  - sender-index logs now include `query_mode`
- Latest captured local baseline log evidence before this pass showed:
  - `browse_query_cluster` warm server duration around `399–561ms`
  - `sender_index_signals` single-sender duration around `1364ms`
  - `load_message_snippets` `47` rows around `2310–2507ms`, including one `1/47` success run
  - `cleanup-regenerate-background` around `306744ms` dominated by `index_sync_ms`
- Review page now hydrates Gmail snippets only for visible rows:
  - sender-level “View this sender’s emails” rows
  - main message-review rows
- Snippet loading is deferred and scoped:
  - uses a dedicated inbox-analysis action for visible message ids only
  - avoids broad backend redesign or initial-paint bloat
  - missing snippet states are explicit (`Loading snippet…` / `Snippet unavailable`)
- Sender detail responsiveness improved:
  - expanding a sender card no longer waits on full indexed-history enrichment
  - deeper sender intelligence is loaded lazily per sender or for the current sender page
  - sender preview rows can open independently of indexed-history detail loads
- Review page now has a stronger analytics dashboard at the top using real current-batch data:
  - top senders
  - category distribution
  - unread/protection mix
  - recency distribution
  - sender mix when inferred sender-type evidence is available
  - archive impact summary
- Review UI now includes a compact operator-facing signal availability summary:
  - available vs inferred vs unavailable signals are explained in plain language
- Pagination ergonomics improved:
  - sender workbench now exposes sender page-size control + page indicator
  - message review page-size now supports `10 / 25 / 50 / 100 / 200`
  - sender and message pagination now behave more congruently
- Review logs now include:
  - snippet hydration source/timing
  - review chart data source
  - sender detail expand path attribution
- Review UI now presents the cleanup workflow as `Cleanup Group -> Batch -> Message Page` instead of exposing internal cluster/review-unit language.
- Review detail is now organized into a clearer operator sequence:
  - Analytics Dashboard
  - Batch Summary
  - Filters Panel
  - Sender Workbench
  - Message Review
  - Decision Builder / Approval Request Builder
- Batch summary now states the current working scope in plain language (batch number, batch size, cleanup-group size, current message page, remaining emails outside batch).
- Filters are now positioned directly above the sender workbench so their effect is easier to understand immediately.
- Review analytics are now promoted to the top of the page and include sender/category/attention/impact summaries for the selected batch.
- Operations shell regenerate messaging now uses operator-facing “refresh cleanup analysis in the background” language while keeping current cleanup groups visible.
- Regenerate now serves current snapshot immediately and runs cleanup recompute in background when a fresh snapshot exists, preventing long foreground lockups.
- Runtime/operations logs now include explicit snapshot regenerate lifecycle fields (`snapshot_version_before/after`, recompute timestamps, total background ms).
- Review inbox-analysis diagnostics now log action-level telemetry (`review_query_cluster`, `browse_query_cluster`, `sender_index_signals`) with scope, pagination, rows scanned, cache flags, and duration.
- `review_query_cluster` requests now reuse in-flight promises and short TTL cache entries for identical calls to reduce duplicate fetch churn during review transitions.
- Newsletter browse cold path now attempts a promotions-category narrowed fast path before broader fallback matching.
- Review page now uses explicit count hierarchy (cluster total vs review unit total vs page rows) with exact-in-scope wording.
- Review detail now exposes explicit bounded unit modes for large clusters (30d, 90d, older backlog, highest-volume senders, oldest unread, mixed remainder) with per-unit totals.
- Review analytics are promoted to a top strip; sender workbench and message pagination are clearer and less forensic.
- Message review list now uses normal pagination without inner-scroll trap.
- Interaction filters now surface availability/counts and disable unavailable options to avoid no-op controls.
- Review workflow is now bounded and operator-guided with sender pagination + sender filters + explicit message-page controls.
- Large-cluster review now generates semantic sub-buckets (recent/older promotions, social noise, commerce updates, recurring machine senders, one-off low-value senders, mixed remainder) so operators can process 40k+ clusters in bounded units.
- Sender type/protection filters are now fully wired and reflected in filtered sender counts/coverage feedback.
- Future-rule guidance is now inline at sender/decision points (duplicate recap block removed).
- Browser-loaded message cache is capped to keep long review sessions responsive.
- Regenerate clusters now runs as a background refresh path in Operations shell/overview/clusters, keeping current snapshot visible while refresh completes.
- Review browser fetch path now uses client-side in-flight dedupe + short-lived response caching keyed by cluster/unit/page/filter/sort/scope.
- Review transitions now suppress stale-first cluster flashes when requested cluster context has not yet hydrated into current snapshot.
- Query-cluster browser now uses fast-path indexed filtering for large cluster types (`unread_clutter`, `old_read_mail`, `age_cluster`, `sender_cluster`) plus in-flight/cache dedupe.
- Fast-path candidate narrowing now also covers newsletter/noreply/shopping/social cluster types to reduce expensive full-corpus browse paths.
- Browser diagnostics now expose cache/perf fields (`cache_hit`, `fast_path_applied`, `duration_ms`) for runtime verification.
- Incremental history-list failures now trigger automatic bounded recovery scans; cached indexed rows remain usable during degraded windows.
- Review-page inbox-analysis requests now carry explicit attribution fields (`request_source`, `request_component`, `request_reason`, `request_phase`) so PM can map slow calls to exact review surfaces from terminal logs.
- Initial review paint is slimmer: only the paginated cluster browser is required for first usable paint, while sender-intelligence enrichment is deferred until the operator expands sender details or explicitly requests it.
- Runtime cleanup discovery now exposes per-subphase timing (`index_state_load_ms`, `index_sync_ms`, `indexed_rows_load_ms`, `coverage_load_ms`, `discovery_build_ms`, `total_ms`) and runtime-state logs now include `cleanup_plan_detail_ms` for long regenerate diagnosis.
- Background regenerate can now skip a fresh mailbox index sync when recent usable indexed state already exists, reducing repeated full recompute work during force-background refreshes.

Execution Model:
- Hybrid (ChatGPT direct edits + Codex multi-file execution)
- Codex required only for multi-file, terminal, or schema-impacting tasks
- Single-file edits may be handled directly by Project Manager
- Domain isolation enforced (see Codex Execution Protocol)

Recalculate Quality:
- Fast path enabled (no rewrite if score ≥ TARGET_QUALITY_SCORE = 8)
- Rewrite gating verified (no unnecessary OpenAI refine calls)
- Force Full Rewrite available
- Dry Run supported (no persistence)
- Strict JSON schema enforced
- Circuit breaker active for OpenAI aborts
- Rewrite retry guarded against under-detailed outputs
- Canonical merge protection (no silent field shrink)

RAG Retrieval:
- Embedding + cosine similarity active
- URL boost logic (context-aware)
- Drive-first weighting for book-content queries
- Product-page penalty for non-shopping intent
- Canonical hierarchy enforced:
  Q&A training data > Drive knowledge > Crawled URLs
- Drive chunk retrieval validated against real PDF previews (875 embedded chunks confirmed active)

RAG Sync:
- Delta + Full modes implemented
- Wildcard detection supported
- Job-based ingestion (rag_jobs)
- Supabase polling status updates
- Manual worker trigger retained for dev

Drive ingestion verified:
- 875 embedded Drive chunks
- 541 embedded URL chunks
- Avg chunk size ≈ 1400–1500 chars
- Retrieval validation confirmed via Playground

Dashboard Metrics:
- Session logging (agent_sessions)
- Event logging (agent_events)
- Token usage tracking
- Approx cost + human-time proxy

---

# 🔧 Fully Operational Systems

## Agent Summary
- Recalculate Quality (fast)
- Force Full Rewrite
- Improve with Q&A
- Field-level Clarify threads (persistent)
- Fine-Tune Preview (grouped canonical topics)
- RAG Sync + Job status display
- Non-blocking sync (safe navigation)

## Playground
- RAG retrieval active
- Correct URL retrieval confirmed
- Strict URL safety (no fabrication)
- Usage metrics captured
- Runtime orchestration refactor complete:
  - `route.ts` is now a thinner controller/surface.
  - Runtime loading/discovery/assembly moved to runtime services/modules.
  - Prompt assembly and RAG retrieval stacks moved out of route.
  - OpenAI chat invocation + response/error handling moved out of route into a dedicated chat service.
  - Analytics/session logging moved out of route into a dedicated analytics service.
- Runtime latency hardening (March 9, 2026):
  - Live timing logs confirm `runtime_state_ms` as the dominant phase.
  - Runtime evidence/history loaders now run in parallel in `stateLoaders.ts` (`Promise.all`).
  - API contract and runtime behavior remain unchanged.
- Runtime continuity + performance hardening (March 9, 2026):
  - Session-aware Playground restore is stable across refresh and approvals return flow.
  - Initial mount flicker (dashboard → empty chat → dashboard) has been eliminated.
  - Runtime sub-phase timing is now logged via `[playground][runtime-state-timing]`.
  - Dominant `cleanup_plan_ms` path was optimized by parallel cleanup-cluster discovery sampling.
  - Live post-patch rehydrate timing is now roughly ~2–3 seconds (down from ~8–10 seconds).
- Runtime UI baseline finalized (March 9, 2026):
  - Action-first “Current step” control center anchors runtime decisions.
  - Runtime details/evidence are now organized as a lighter drawer with operator-first ordering.
  - Query cleanup clusters render as compact rows (top 3 by default) with nested query/safety/risk/sample details.
  - Conversation remains the secondary work area below runtime controls.
  - Approvals queue keeps actionable items emphasized and compresses approved/executed rows for scanability.
  - Workflow progress currently represents current workflow-step progress, not total inbox cleanup progress.
- Mailbox Intelligence / Profiling pass (March 9, 2026):
  - New additive `runtime_mailbox_profile` metadata is generated in runtime cleanup discovery.
  - Profiling uses Gmail-native query estimates over a 30-day recent window (60-day compatible shape).
  - Bounded metadata sampling adds sender-frequency and recurring-subject signals.
  - Profile now feeds protection candidates, cleanup candidates, and rule-opportunity recommendations.
  - Query cleanup cluster discovery now uses profiled sender recurrence instead of relying only on tiny inbox samples.
- Mailbox profiling freshness/caching stabilization (March 10, 2026):
  - Cleanup discovery/profile snapshots are cached via `agent_events` (`runtime_cleanup_discovery_snapshot`).
  - Routine rehydrate paths now reuse fresh cached profile snapshots instead of re-running Gmail discovery every time.
  - Default profile cache TTL is 30 minutes; stale fallback + cooldown guard reduce repeated expensive refresh attempts.
  - Explicit profile refresh is available from Playground runtime details.
  - Freshness is surfaced as `fresh` / `cached` / `stale` with last generated timestamp.
- Mailbox indexing data-layer hardening (March 11, 2026):
  - Added directional index-health fields in `gmail_mailbox_index_state`:
    - `mailbox_estimated_total` (Gmail `resultSizeEstimate` baseline)
    - `index_completion_pct` (bounded `0–100`, directional)
    - `last_index_duration_ms`
  - Added `gmail_sender_stats` for tenant-scoped sender intelligence:
    - `message_count`, `recent_count_30d`, `machine_probability`, `human_probability`, `last_seen`
  - Indexer now includes retry/backoff (+ jitter) for Gmail `429` and `5xx` responses.
  - Metadata fetch pipeline now uses simple adaptive concurrency (`20` default, degrades to `10` under retry/latency pressure).
  - Sender stats are recomputed from indexed `gmail_messages` after each successful sync (correctness-first, no complex delta math).
  - `GET /api/integrations/gmail/mailbox-index` now returns additive health/status fields:
    - `indexed_message_count`, `mailbox_estimated_total`, `index_completion_pct`,
      `last_full_scan_at`, `last_incremental_sync_at`, `last_sync_status`, `last_index_duration_ms`.
  - No UI changes in this pass.
- Operator cleanup strategy layer (March 10, 2026):
  - New additive `runtime_cleanup_strategy` is derived from `runtime_mailbox_profile`.
  - Strategy sections: Protect first, Best first cleanup waves, Rule opportunities, Avoid/review carefully.
  - Playground prompt now uses this strategy ordering for clearer, decisive inbox guidance.
  - Playground runtime details now surfaces a compact strategy card for one-glance operator planning.
- Trust + gating hardening (March 10, 2026):
  - Runtime dashboard now surfaces a compact trust snapshot (sample size, profile window, metadata scan basis, confidence).
  - Cleanup action suggestions are not promoted unless a 30-day mailbox profile is present.
  - With sample-only evidence, assistant guidance remains in analysis/review mode (no cleanup-approval push).
  - Agent-aware Playground examples now replace hardcoded domain-specific copy.
- Trust + UX clarity refinement (March 10, 2026):
  - Current Step and review cards now include explicit “What happens next” blocks.
  - Runtime CTA copy is action-specific: `Analyze inbox sample`, `Review sender sample`, `Preview matching emails`.
  - Review steps are explicitly labeled as read-only with no inbox mutation in the current step.
  - Evidence-basis labels now distinguish quick preview sample vs pattern scan basis/profile window/confidence.
  - Query-estimate overlap uncertainty is surfaced when Gmail estimate signals converge.
- Consistency hardening (March 10, 2026):
  - Playground and Approvals now share explicit queue scope semantics:
    - session-scoped queue when `session_id` exists
    - agent-scoped queue fallback when no active session is available
  - Approvals queue UI now displays explicit scope context.
  - Runtime approval queue summary now carries scope metadata and enforces strict session filtering in session mode.
  - Server-authored chat restore added for Playground sessions:
    - `playground.session_snapshot` events are written per session
    - rehydrate responses can return `session_messages` for authoritative session restore
  - `review_query_cluster` approvals are now executable from Approvals.
  - Sessionless dedupe now only reuses other sessionless requests, preventing cross-session dedupe drift.
- Reconciliation stabilization pass (March 10, 2026):
  - Playground now applies a canonical approval-id resolver before rendering candidate/cluster statuses.
  - Rejected approvals clear pending status across queue chips and cluster/candidate rendering once fresh summary lands.
  - Approval submit now updates pending queue state immediately (poll remains fallback verification).
  - Approvals table now updates queue counts and section placement immediately after approve/reject/execute.
  - Clear conversation retains explicit unresolved-approval visibility for the cleared session.
  - `rehydrate_only` path now prioritizes cached/stale cleanup profile snapshots and avoids refresh recomputation unless forced.
  - Follow-up: top Current-Step query-cluster submit now mutates the same immediate cluster-pending state path as manual cluster selection.
  - Follow-up: cleared-session carryover no longer contributes to queue bubble counts, preventing ghost pending after clear/reset.
  - Follow-up (March 11): query cleanup cluster pending header now reconciles with canonical queue pending for first-step sender-review submits.
  - Follow-up (March 11): return-from-approvals runtime refresh now suppresses stale local pending/approved queue state until authoritative summary rehydrates.
  - Follow-up (March 11): clear conversation no longer carries pending/approved count snapshots in cleared-session context (session-id only informational carryover).
  - Follow-up (March 11): clear conversation now behaves as chat-only reset; Runtime Operations Dashboard and approval/workflow state remain mounted and authoritative.
  - Follow-up (March 11): cleared-session message restore suppression prevents old chat transcript repaint while allowing runtime queue/evidence rehydrate.
  - Follow-up (March 11): approval decision summary card added in both Playground Current Step and Approvals cards with explicit action/scope/selection/safety/effect fields.
  - Follow-up (March 11): preview-to-batch relationship is now explicit (representative sample vs total selected/estimated scope), including scalable language for larger approval batches.
  - Follow-up (March 11): approval presentation upgraded to stronger decision-card hierarchy (Action, Scope, Source, Why selected, Risk, Reversible, Safety signals, Exclusions, What happens if approved).
  - Follow-up (March 11): representative examples now render as compact subject/sender/date rows (instead of prose-only summaries) in both Playground and Approvals.
  - Follow-up (March 11): shared `ApprovalDecisionCard` component now drives both Playground and Approvals surfaces for one consistent approval visual language.
  - Follow-up (March 11): hero-row emphasis + collapsible supporting details reduce “debug panel” density and improve large-batch scanability.
  - Final polish (March 11): affected-count/scope is now visually dominant in the hero area, including compact cards.
  - Final polish (March 11): representative examples now use a tighter table-like subject/sender/date scan layout with optional snippet only when present.
  - Workflow correction (March 11): executing a review step now surfaces a dedicated primary **Review Results** state before advancing to next-step approvals.
  - Workflow correction (March 11): current review evidence is isolated from historical evidence, with historical review/archive cards explicitly demoted and labeled.
  - Workflow correction (March 11): Review Results now includes operator summary + cluster makeup + recommended next action + future prevention guidance.
  - Trust correction (March 11): affected counts in approval cards now use structured summary fields with explicit estimate labeling where applicable.
  - Workflow architecture refinement (March 11): reviewed-batch deep context moved to a dedicated detail surface (`/agents/[id]/playground/review`) with prev/next navigation across reviewed results.
  - Workflow architecture refinement (March 11): Playground now keeps reviewed-result depth concise and action-oriented, with a direct CTA into full result detail instead of duplicating full evidence inline.
  - Workflow architecture refinement (March 11): result-scoped chatbot added on review-detail page so Q&A is anchored to one reviewed batch/cluster at a time.
  - Stale-state cleanup (March 11): current-step promotion now suppresses duplicate re-promotion of the currently reviewed sender/query cluster.
  - Follow-up separation (March 11): review-detail chatbot now runs in a distinct session origin namespace (`playground_review_detail`) so result-chat traffic cannot contaminate the main Playground workflow thread.
  - Follow-up lifecycle cleanup (March 11): stale sender/query recommendations are suppressed using reviewed-result history, not only current-item id matching.
  - Follow-up lifecycle cleanup (March 11): batch suggestions are now result-bound and only surfaced when matching the currently viewed reviewed sender-result context; stale cross-result suggestion residue is demoted.
  - Follow-up scope reduction (March 11): lower runtime-details historical evidence was compacted into timeline summaries so Playground remains workflow-first.
  - Final isolation hardening (March 11): added explicit `request_mode` support (`playground` vs `playground_review_detail`) so backend prompt/load behavior is mode-aware, not only session-origin aware.
  - Final isolation hardening (March 11): review-detail mode now uses a dedicated result-scoped system prompt path and no longer uses the full broad Playground workflow prompt guidance.
  - Final isolation hardening (March 11): review-detail mode skips full runtime-state assembly and loads only reviewed-result data needed for detail/rehydrate.
  - Runtime review trust hardening (March 11):
    - Current-step consequence copy now explicitly states approval-request creation vs inbox mutation timing.
    - Sender preference controls (`Keep Sender` / `Neutral` / `Deprioritize Sender`) are now available in review-result context.
    - Review-result summaries now include engagement signals (important/starred/reply-like/unread), evidence mode, confidence, and future-prevention context.
    - Archive approval summaries now include engagement-backed rationale/exclusions rather than pattern-only framing.
  - Runtime UX stabilization follow-up (March 11):
    - Current Step now explicitly separates lifecycle state, next action, and read-only evidence context.
    - Top-level duplicate latest-review cards were removed to reduce self-referential navigation and visual redundancy.
    - Runtime-details current-review duplication was reduced to a compact pointer toward the canonical review-detail page.
    - Main UI recommendation area now surfaces sender preference effect text (Keep/Neutral/Deprioritize) alongside recommendation output.
    - Main UI now surfaces explicit archive trust summary language (evidence mode, confidence, and protected/excluded signals).
  - Operator trust + explicit choice stabilization (March 11):
    - Current Step lifecycle derivation is now centralized via `playgroundWorkflowState.ts` and consumed by Playground UI blocks (lifecycle state, next action, read-only context).
    - Sender preference controls now use operator-facing wording:
      - Always keep newsletters from this sender
      - No preference
      - Lower priority (more likely archive candidate)
    - Added lightweight pre-approval customization for archive requests:
      - exclude senders and representative messages before submitting approval
      - selected/excluded counts shown before submit
      - approval payload carries subset metadata (`selection_customization`).
    - Added explicit trust caveat that opened/open-tracking status is unavailable in this Gmail metadata flow; engagement is inferred from unread/important/starred/reply-like signals.
    - Approval summaries now surface subset scope (selected vs candidates vs excluded) for archive requests.
  - Operator usability/scalability follow-up (March 11):
    - Added grouped archive customization for larger batches (pattern groups + sender groups + message-level controls).
    - Added a primary Decision Summary/Decision Diff panel in Playground archive flow (reviewed/selected/excluded + risk/confidence + included/excluded examples).
    - Sender preference was moved into a clearly separate **Future sender policy** area so it is not mistaken for the immediate archive decision.
    - `ApprovalDecisionCard` now explicitly displays **Total reviewed / Archive selected / Excluded-kept** scope totals.
  - Review-detail grounding follow-up (March 11):
    - Scoped chat contract now requires observed-vs-estimated framing and explicit out-of-scope handling before broader workflow advice.
    - Scoped prompts/context now explicitly include the opened-signal availability caveat to reduce overconfident engagement claims.
  - Runtime lifecycle scope hardening (March 11):
    - Session-scoped Playground runtime now filters review/archive evidence to scoped approval ids to reduce stale cross-session sender/query leakage.
    - Review-detail rehydrate path now applies the same session-scope evidence filtering when a workflow session id is present.
  - Operations Workspace architecture split (March 11):
    - Added dedicated operator workspace routes:
      - `/agents/[id]/operations` (Inbox Overview)
      - `/agents/[id]/operations/clusters` (Review Clusters)
      - `/agents/[id]/operations/review` (Review Result Detail)
      - `/agents/[id]/operations/approvals` (Pending Approvals scope view)
      - `/agents/[id]/operations/history` (Executed/Timeline history)
    - Added shared operations shell with left-rail workflow navigation and right-side contextual AI assistant panel.
    - Playground is now chat-first by default and acts as a handoff surface into Operations workspace.
    - Legacy dense runtime dashboard remains available only behind debug query (`show_legacy_runtime=1`) in non-production.
    - Review-detail workspace now includes explicit previous/next reviewed-result navigation for operator continuity.
    - Operations assistant request mode is now context-aware (`playground` vs `playground_review_detail`) for tighter result-page scoping.
  - Operations Workspace clarity + trust hardening (March 11):
    - Left-rail navigation refined into grouped product sections with clearer hierarchy and active-state clarity.
    - Review Detail now includes sender-level inline sample inspection (`View this sender’s emails`) with exclusion reasoning.
    - Exclusion logic is now explicit across message rows and sender samples:
      - excluded manually
      - excluded by sender setting
      - excluded by pattern setting
      - excluded by keep-sender policy
    - Selection hierarchy is now documented in-page (sender filters → pattern filters → message overrides → final decision summary).
    - Operations Approvals page now supports inline approve/reject/execute actions via runtime APIs (no longer a thin handoff-only wrapper).
    - Operations History page now shows richer audit context (action/target/origin/outcome).
    - Operations pages now share a session-scoped runtime snapshot context with cache + stale-while-revalidate to reduce repeated per-page rehydrate calls.
  - Operations workflow-correctness follow-up (March 11):
    - Cluster review routing is now `cluster_id` authoritative; opening a cluster no longer falls back to unrelated latest reviewed results.
    - Review inspection no longer requires preview approval in Operations; inspection is direct/read-only, while mutation stays approval-gated.
    - Review page navigation is now cluster-queue-first (`Previous cluster` / `Next cluster`) rather than reviewed-result-only stepping.
    - Pattern Breakdown now auto-compacts when only one pattern exists (chip-style include/exclude control).
    - Review detail now exposes interaction filters/signals where available:
      - unread-only
      - starred/important
      - inferred no-interaction-90d
      - thread participation badge when labels indicate sent participation
    - Review action bar now uses consequence-first wording:
      - create archive approval request
      - no inbox mutation until approve + execute
    - Approvals cards now explicitly separate request scope + consequences (`Applies to`, `If approved`, `If approved/executed`, `If rejected`).
    - Operations shell now includes page-contextual assistant prompt suggestions (overview/clusters/review/approvals/history).
    - Runtime snapshot provider now adds an in-memory cache layer + longer SWR window to further reduce remount/navigation rehydrate churn.
  - Operations trust + signal-honesty follow-up (March 11):
    - Left-rail visual overlap/cramping corrected with adjusted nav item spacing/line-height and cleaner active-card layout.
    - Cluster Review Detail + Pending Approvals now both show explicit “request -> approve/reject -> execute” sequence copy to remove double-approval ambiguity.
    - Review detail now includes explicit evidence signal taxonomy:
      - available signals
      - inferred/directional signals
      - unavailable signals
    - Interaction filters now degrade honestly (auto-disabled when metadata isn’t available in the current sample scope).
    - Sender-level analytics expanded with sample share, estimated relationship, pattern mix, signal counts, sender classification, and protected-hint matching.
    - Added first-pass visual analytics:
      - Overview: top cluster volume, pattern mix, low-value vs protected split
      - Review detail: pattern distribution, sender contribution, selected vs excluded split
    - Naming alignment tightened to cluster-first operator flow (Cluster Review Detail as active workflow surface; reviewed-result artifacts remain historical/audit context).
  - Operations data-depth + signal-coverage hardening (March 11):
    - Gmail runtime review/discovery message contract now consistently carries richer metadata fields when available:
      - `thread_id`, `history_id`, `internal_date_ms`
      - `label_ids`, `category_labels`, `is_in_inbox`
      - `is_unread`, `is_important`, `is_starred`
    - Cluster Review Detail now supports expanded read-only evidence loading for unreviewed clusters:
      - default bounded fetch depth: 30
      - operator-triggered deeper bounded fetch: up to 60
      - fallback remains lightweight preview when deeper read-only fetch is unavailable
    - Evidence scope is now explicit:
      - sample reviewed (exact)
      - estimated cluster size (directional)
      - selected-for-request subset (exact)
      - evidence basis mode (executed review vs expanded preview vs fallback sample)
    - Signal coverage section now reports real coverage counts and classification:
      - actual (enabled): unread/starred/important/labels/category/inbox-state/date when present
      - inferred (enabled + labeled): no-interaction-90d, thread-participation hints, estimate-driven sizing
      - unavailable (explicit): opened/click tracking and full behavior timeline
    - Sender analytics upgraded from basic summary to decision-support metrics:
      - sample share, selected share, excluded share
      - sender domain + pattern mix
      - unread/starred/important known-count coverage
      - thread-participation hint counts
      - protected/high-priority overlap hints
    - Pending Approvals now surfaces exact execution-scope details when action args include them:
      - reviewed/candidate/selected/excluded counts
      - exact selected message-id scope label
      - evidence basis + safety signals + protected exclusions
    - Overview now includes operator-question guidance and data-basis disclosure:
      - where to start / largest / safest / most mixed-risky
      - metadata scan-basis surfaced where available
      - charts explicitly framed as directional estimates unless exact counts are available
        - Documentation governance reinforcement (March 11, 2026):
    - Authoritative project docs remain the source of truth in ai-agent-platform-docs/, not /web/docs.
    - After each major milestone, Codex should update CHANGELOG.md, CURRENT_STATE.md, TODO.md, and system_overview.md before handoff.
    - Operations Workspace data-depth pass is now reflected across runtime contract, review detail, approvals, and overview surfaces.
    - Active-tenant mailbox-index root-cause diagnostics are now explicit:
      - Active agent `d256b48e-5acf-4b3d-af22-003d52e7e582` resolves via profile to tenant `085c8ef7-2fd7-4842-8499-cd605e894a77`.
      - `gmail_messages` table exists but had 0 rows for active tenant.
      - `gmail_mailbox_index_state` missing in schema cache for active tenant environment.
  - Operations operator-control + scope transparency pass (March 12):
    - analysis-window controls are now explicit in workspace runtime (`7d`, `30d`, `60d`, `90d`, `180d`, `365d`, `all_indexed`)
    - selected analysis scope now propagates through:
      - overview runtime snapshot reads
      - indexed cleanup cluster generation/recompute
      - query-cluster review evidence fetches
    - cluster regeneration is now operator-triggerable from:
      - workspace rail
      - Overview
      - Clusters
    - review detail now explicitly discloses:
      - analysis window in use
      - matching messages in scope
      - representative examples shown
      - discovery rows and inbox rows considered
      - analyzed date span
    - scope-aware runtime snapshot caching now prevents cross-scope stale reuse.
      - `gmail_sender_stats` table exists but had 0 rows for active tenant.
      - Gmail integration connection exists, but refresh path failed in terminal diagnostics due missing `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` for token refresh.
    - Operations runtime now applies a cooldown-guarded mailbox-index bootstrap when index health is zero to avoid indefinite sample-only mode.
    - Review Detail now loads indexed sender intelligence (`sender_index_signals`) and surfaces:
      - indexed sender totals + 30/60-day counts
      - indexed unread/important/starred/inbox counts
      - indexed category + pattern mix
      - machine/human probabilities
    - Review Detail now includes advisory future-rule recommendations from indexed sender evidence.
    - Pattern Breakdown now compacts when only a single low-information pattern exists.
  - Scope-authoritative recompute + review UX hardening (March 12, 2026):
    - Root cause addressed: scope change refresh race (refresh fired before provider scope re-bind) could recompute with prior scope.
    - Scope refresh now runs only after scope prop changes, preventing `365d` selection from silently reusing `90d` refresh context.
    - Runtime now emits dedicated `[playground][cleanup-scope]` logs with:
      - `selected_analysis_scope`
      - `effective_discovery_window_days`
      - `snapshot_scope`
      - `review_scope`
      - `cleanup_cluster_count`
    - Review detail evidence language now emphasizes deterministic loaded-vs-matching scope counts (not random-sample framing).
    - Pattern controls now collapse by default for multi-pattern clusters to reduce screen waste.
    - Sender-level rule guidance is now inline with sender controls; cluster-level rule guidance is surfaced near decision/action area.
    - Archive approval payloads now include explicit analysis/depth context (`analysis_scope`, `matching_messages_in_scope`, loaded subset metadata).
    - Operations approvals now surface analysis-window context in archive message-scope labels when available.
    - Degraded incremental mailbox sync now triggers cooldown-guarded background recovery attempts while keeping cached indexed discovery usable.
  - Indexed evidence browser + count/date-span truth reconciliation (March 12, 2026):
    - Review detail query clusters now use server-backed paginated message browsing as the primary evidence surface.
    - Review browser controls now expose:
      - filter (`all`, `unread`, `starred_or_important`, `no_recent_interaction_90d`)
      - sort (`newest` / `oldest`)
      - page size + previous/next + range telemetry
      - total matching messages in selected scope
    - Review now tracks and discloses loaded-across-pages message counts separately from total in-scope matches.
    - Overview/Clusters/Review now align on the same canonical indexed fields:
      - `indexed_total_rows`
      - `indexed_inbox_rows`
      - `indexed_date_span_start`
      - `indexed_date_span_end`
      - `effective_discovery_window_days`
      - `discovery_rows_used`
    - Scope honesty messaging now explicitly explains when selected window exceeds available indexed span (e.g., 365d selected but current indexed span is narrower).
    - Incremental history-list failures now support cooldown-guarded full-scan recovery fallback where safe (not only explicit history-too-old cases).
  - Indexed cluster recovery + evidence depth upgrade (March 12, 2026):
    - Fixed zero-cluster cache reuse path:
      - cleanup snapshot cache version advanced to `gmail.cleanup_profile_cache.v3`
      - `rehydrate_only` now refreshes when a fresh cached snapshot has `0` clusters but indexed mailbox rows exist.
      - zero-cluster/index-advanced refresh conditions now bypass normal refresh cooldown gating.
      - runtime timing logs now include snapshot cluster count and indexed row count for diagnosis.
    - Indexed cleanup discovery now includes fallback cluster synthesis when strict query-spec matching returns zero clusters.
    - Cluster discovery now emits explicit rejection diagnostics:
      - source counts (`indexed_total_rows`, `inbox_rows`, `recent_window_rows`, `safety_eligible_rows`)
      - rejection buckets (`not_in_inbox`, `starred_or_important`, `category_primary`, `younger_than_7d`, `no_cluster_pattern_match`)
      - strict/fallback match counts + exploratory fallback flag
      - surfaced in logs and empty-state UI diagnostic summaries.
    - Runtime cleanup clusters now carry indexed window evidence when available:
      - `count_last_30d`, `count_last_90d`, `count_last_180d`, `count_total_indexed`
      - unread/important/starred/inbox counts
      - category mix + first/last seen timestamps
    - Mailbox profile scan basis now reflects total indexed rows (not only inbox subset) to reduce sample-style ambiguity.
    - Sender index signals now include deeper windows (`90d`, `180d`) and `first_seen` for review decisions.
    - Runtime timing logs now include cleanup cluster count for stale/empty-state diagnosis.
    - Operations Approvals now consumes backend-scoped `runtime_approval_queue_items`, so summary counts and actionable rows resolve from the same scoped approval-history source.
    - Mailbox index health now distinguishes degraded-but-usable state:
      - API returns `sync_health`, `usable_with_cached_index`, and `last_sync_error`.
      - Operations Overview now explains when incremental sync is degraded but indexed cache remains usable.
    - Incremental mailbox sync now tolerates isolated metadata fetch misses and records `incremental_sync_degraded` instead of failing the entire sync run.
  - Indexed discovery depth expansion + transparency (March 12, 2026):
    - Root cause fixed: index-backed discovery/sender reads were effectively shallow due single-query retrieval behavior against capped REST row windows.
    - Indexed row loading is now paginated up to configured cap (50,000), so discovery/review analytics can consume the real indexed corpus instead of ~1000-row slices.
    - Sender stats recomputation now uses paged indexed reads, improving sender-level evidence quality.
    - Sender index signal fetches for review now paginate within safe bounds (instead of single-query truncation), improving per-sender 30/60/90/180-day confidence.
    - Discovery now selects broader historical windows (`30/90/180/365`) from indexed inbox depth when available.
    - Safety gating is now clearer:
      - recent mail remains reviewable in discovery clusters
      - mutation safety still enforced by approval + execute flow and explicit exclusions.
    - Operations now auto-schedules cooldown-guarded background full backfill when index exists but remains shallow.
    - Operations Overview / Clusters now expose discovery depth explicitly:
      - discovery rows used
      - inbox rows considered
      - discovery window used
      - indexed oldest/newest date range
      - depth label (shallow/moderate/deep historical evidence)
  - Bounded review-unit workflow + query-browser performance hardening (March 13, 2026):
    - Query-cluster review is now unitized into bounded actionable slices:
      - sender slices
      - domain slices
      - pattern slices
      - recency slices
      - mixed remainder fallback
    - Each review unit is capped to the most recent 5,000 rows to keep operator review bounded and prevent giant-cluster UI overload.
    - Query-cluster browser cache now stores precomputed review-unit manifests (row subsets) so page/filter/sort requests avoid full-cluster re-filtering loops.
    - Review detail now treats paginated unit rows as the primary working surface and explicitly separates:
      - cluster total in scope
      - current review-unit size
      - loaded rows on current page / across visited pages
    - `browse_query_cluster` now supports `review_unit_id` so unit switching remains in-place and stateful.
  - Gmail Operations usability hardening (March 13, 2026):
    - Scope regeneration feedback now exposes deltas directly in workspace shell:
      - cluster count before/after
      - added/removed clusters
      - count-shifted clusters
      - indexed span change summary
    - Review unit selection now has a visible paged unit queue (`Open unit`) to reduce hidden-control ambiguity.
    - Sender breakdown now defaults to compact cards with explicit expansion for deep sender metadata.
    - Sender cards are now paginated to prevent long repetitive scroll walls on high-sender clusters.
    - Non-server-backed message lists now use explicit paging controls (page size + prev/next + range) instead of incremental “load more” scrolling.
    - Review guidance now follows explicit operator sequence (scope -> cluster -> review unit -> paged inspection -> decision -> approval request).

## LLM Training
- Save & Next
- Save & Finish
- Evidence pack integration
- Non-destructive prompt merge
- Quality score persistence
- fine_tune_examples logging

## Backend Stability
- evaluateQuality stable
- finalRefine stable
- Strict JSON schemas enforced
- Evidence compaction active
- Embedding normalization hardened
- Cosine similarity retrieval validated
- Core contract fields protected from shrink (>30%)
- Strict merge preservation validated during forced rewrite (no contract loss observed)

## Agent Runtime (Slice #1 — Approval Queue MVP)
- `/api/runtime/plan` endpoint implemented (generates execution plan and logs `approval_request` events).
- `/api/runtime/approve` endpoint implemented (logs `approval_decision` events).
- `/approvals` dashboard page implemented:
  - Server-side admin reads from `agent_events`.
  - Computes pending approvals (request without decision).
  - Approve/Reject actions call runtime API via `fetch`.
- Schema-free MVP implemented using existing `agent_events` table.
- End‑to‑end validation completed locally (plan → approval → row removal).

## Agent Runtime Execution (Slices 6A–7)

- Runtime supervision ladder now operational:
  - Plan → Approve → Confidence → Eligibility → Execute.
- Sandbox execution pipeline implemented:
  - `/api/runtime/execute` executes sandbox actions safely.
- Execution logging implemented:
  - `execution_result` events stored in `agent_events`.
- UI now displays runtime supervision state:
  - mode
  - confidence
  - approval status
  - execution status.

## Integrations — Gmail

- Tenant-scoped OAuth integration implemented.
- Gmail connection stored in `integration_connections`.
- OAuth flow:
  - `/api/integrations/gmail/start`
  - `/api/integrations/gmail/callback`
- Runtime tool support added:
  - `gmail.draft_email`
- Agent execution can now create Gmail drafts (never sends).
- Inbox analysis runtime tool implemented:
  - `gmail.analyze_inbox`
  - Reads inbox metadata sample and derives sender clusters.
- Mailbox profiling implemented for strategic cleanup planning:
  - Gmail-native categories/labels/states + age-window estimates
  - bounded sender/subject recurrence sampling
  - additive runtime profile metadata for Playground strategy guidance
- Sender cluster review tool implemented:
  - `gmail.review_sender_cluster`
  - Retrieves sample messages for a specific sender.
- Inbox archive runtime tool implemented:
  - `gmail.archive_messages`
  - Removes the `INBOX` label using Gmail `batchModify`.
  - Messages remain in **All Mail** (standard Gmail archive behavior).
- Gmail OAuth scope expanded to support modification:
  - `gmail.modify` permission now requested during OAuth flow.
  - Required for archive operations.

Current limitation:
- Sender preference controls are currently local/UI-scoped and apply strongest to reviewed-sender/archive recommendation suppression. Query-cluster sender-subset splitting is still heuristic and not yet a full deterministic per-sender partition engine.

---

### Runtime Capability Milestone (March 5, 2026)

The platform successfully completed the first **end‑to‑end autonomous workflow milestone**.

Operational chain verified:

Plan → Approve → Confidence → Eligibility → Auto‑Approve → Execute → External Tool Action

Working runtime example:

- Agent proposes Gmail action (`gmail.draft_email`).
- Supervisor approves or auto‑approves based on confidence threshold.
- Execution endpoint validates runtime mode (`guarded`).
- System executes Gmail draft creation through OAuth integration.
- Execution result stored in `agent_events`.

Confirmed output:

- Gmail draft created in connected inbox.
- Execution recorded in `execution_result` event.
- UI status correctly transitions:
  `pending → approved → executed`.

This marks the **first real external tool execution by the AI Agent Platform runtime**.

### Runtime Inbox Assistant Milestone (March 8, 2026)

The platform successfully executed its first **automated inbox management action**.

Verified runtime chain:

Analyze Inbox → Review Sender Cluster → Propose Action → Approve → Execute → Gmail Archive

Working runtime example:

- Agent analyzed Gmail inbox metadata.
- System detected high‑volume sender clusters.
- Runtime assistant recommended archive candidates.
- Approval request generated and approved through `/approvals`.
- `/api/runtime/execute` performed `gmail.archive_messages`.
- Gmail `batchModify` removed the `INBOX` label.

Verified result:

- Target emails disappeared from Inbox.
- Messages remained accessible in **All Mail**.
- Execution recorded in `execution_result` event.
- Playground UI reflected execution evidence.

This represents the **first real autonomous inbox management workflow executed by the runtime system**.

### Runtime Playground Refactor Milestone (March 9, 2026)

Playground runtime architecture has been modularized without changing behavior.

Extracted modules now own the previously in-route runtime internals:
- `src/lib/runtime/suggestionLifecycle.ts`
- `src/lib/runtime/stateLoaders.ts`
- `src/lib/runtime/gmailRuntimeAssembler.ts`
- `src/lib/runtime/runtimeStateService.ts`
- `src/lib/runtime/playgroundPromptBuilder.ts`
- `src/lib/runtime/playgroundRagService.ts`

Current route ownership remains:
- response shaping
- explicit `gmail.analyze_inbox` proposal trigger logic
- chat service invocation
- analytics service invocation

`rehydrate_only` behavior remains preserved.

Reference:
- `ai-agent-platform-docs/playground-runtime-architecture.md`

---

## 🔄 Phase Transition — Decision System Build (Next Phase)

- Gmail ingestion and cleanup infrastructure is now complete and stable.
- The next major system focus is the **Sender Decision Experience (Decision Mode UI)**:
  - Tinder-style rapid decision interface
  - Sender-level classification flow (Keep / Some / None / Unsure)
  - Management system integration (archive, rules, quarantine)
  - Gamified review loop and reinforcement signals

- This marks a transition from:
  - backend-heavy stabilization work
  - → frontend product experience + user workflow optimization

- A new Project Manager (v11) will take ownership of this phase to:
  - maintain clean context
  - operate from finalized documentation
  - execute high-speed UI/product build cycles with Codex

---

# 🚀 Current Strategic Focus

Phase 3 — Controlled Expansion

1. RAG → Prompt Rewrite Integration
   - Drive knowledge influences rewrites
   - Q&A contract remains canonical
   - RAG used as evidence layer, not override

2. Fine-Tune Alignment
   - Drive = knowledge base
   - Q&A = behavioral authority
   - Separation of knowledge vs behavior weighting maintained

3. Project Manager v8 Continuity
   - Maintain authoritative docs as the source of truth
   - Keep Codex aligned to CURRENT_STATE.md, CHANGELOG.md, TODO.md, and system_overview.md after each milestone
   - Preserve clean handoff readiness for future PM transitions
   - PM v8 introduced a new Codex interaction model:
     - Project Manager performs primary product/design review using screenshots
     - User provides minimal UI test signals (load time + click behavior)
     - Codex receives tightly scoped execution instructions
   - New UI reliability rule introduced:
     - Every Codex UI prompt must include:
       "Before changing UI, read the following:" + relevant spec excerpts
     - This prevents UI regression and keeps Codex aligned with design intent
## Mailbox Intelligence — Product Direction Lock

- Mailbox Intelligence is now defined as:
  "AI Intelligent Decision Dashboard"

- Core responsibilities:
  - define the goal (clean inbox = all senders decided)
  - show current state (health, scale, progress)
  - identify bottleneck (what is blocking progress)
  - guide next action (clear CTA-driven workflow)
  - show expected payoff (what improves if user acts)

- Design constraints:
  - must remain command-first, not analytics-heavy
  - must not duplicate Cleanup Groups surface
  - must prioritize sender-level logic over message-level metrics
  - every major metric must have:
    - clear denominator
    - visual representation
    - actionable meaning

- Deferred to next PM:
  - management-layer signals integration
  - advanced hover intelligence (multi-line actionable insights)
  - unified chart system (shared visual components)
  - sidebar layout consolidation

# 🧪 Operational Safety Tools

4. Hybrid Execution Governance
   - Codex reserved for multi-file or system-level changes
   - Direct PM edits allowed for single-file adjustments
   - Supabase schema edits default to Dashboard unless migration required
   - Domain isolation enforced for all Codex threads

5. Agent Runtime Expansion

Current runtime supervision ladder:

Plan → Approve → Confidence → Eligibility → Auto‑Approve → Execute

Completed slices:

Slice #1 — Approval Queue MVP
Slice #2 — UUID validation + approvals UI client component
Slice #3 — Confidence tracking per tool/action
Slice #4 — Runtime mode + eligibility endpoint
Slice #5 — Guarded auto‑approval
Slice 6A — Sandbox execution engine
Slice #7 — Gmail draft execution integration
Slice #8 — Gmail inbox analysis runtime tool
Slice #9 — Sender cluster review runtime tool
Slice #10 — Gmail archive execution tool
Slice #11 — Runtime suggestion lifecycle tracking (ready → pending → approved → executed)

Next capability in development:

Inbox Assistant

- Gmail inbox analysis
- Batch archive recommendations
- Conversational approval workflow
- Runtime assistant agent for operational automation

Current status (March 8, 2026):
- Inbox Assistant MVP is operational.
- Inbox analysis, sender review, and archive execution are implemented.
- Runtime UI suggestions are lifecycle‑aware (ready / pending / approved / executed).
- Remaining improvements focus on UX polish, persistence, and broader batch operations.

This will introduce the **first dedicated Runtime Assistant Agent** responsible for inbox management and workflow assistance.

---

# 🧪 Golden Path (Must Always Pass)

Automated check available via `npm run golden-path` (preferred quick verification).

1. Next training suggestion works.
2. Save & Next works.
3. Save & Finish triggers rewrite.
4. Preview shows canonical grouping.
5. Quality score updates correctly.
6. RAG Sync schedules job.
7. RAG Worker processes documents.
8. Playground retrieves correct Drive content.
9. Usage logging records activity.

If any fail → immediate fix.

---

# ⚠ Acceptable Limitations

- Wildcard domains require discovery scans.
- No precise progress % (document-count proxy used).
- Worker is single-process (no distributed queue yet).
- OpenAI timeouts possible under heavy refine (guarded).
- Playground workflow progress is step-level for the active cleanup flow; total inbox cleanup progress is not implemented yet.
- Mailbox profile coverage is estimate-based (Gmail `resultSizeEstimate` + bounded samples), not an exhaustive full-mailbox classification pass.
- Gmail `resultSizeEstimate` can still produce overlapping counts across related query clusters; UI and assistant now frame these as directional estimates.
- Profile freshness is currently session/runtime-event driven; it is not yet policy-scheduled on a background cadence.
- Cleanup strategy recommendations inherit mailbox-profile estimate limits; they are planning guidance, not exhaustive mailbox truth.
- Bounded mailbox profiling basis is stronger than initial slice (120 metadata messages / 240 id scan), but still intentionally not full-mailbox scanning.

---

# 🧠 Strategic Position

The system is out of debugging mode and in stabilized infrastructure state.

Operational pillars:
- Prompt Engineering Loop
- RAG Retrieval Engine
- Training Canonicalization
- Job-Based Knowledge Sync
- Usage Analytics Foundation

v6 stabilized.  
Platform stabilized under PM v8.

The **runtime supervision system (Slices 1–7)** is now operational and has successfully executed its first real external action (Gmail draft creation).

The platform has transitioned from infrastructure stabilization into **early autonomous workflow capability**.

---

# 🔒 Version Snapshot

v6 is formally archived.

v8 is now active under:
- Codex Hybrid Execution Model
- Domain isolation discipline
- Canonical contract protection rules

All future structural changes must be logged in CHANGELOG.md and reflected here.

---

# 🧪 Operational Safety Tools

Golden Path Script:
- Location: `web/scripts/golden-path.mjs`
- Command: `npm run golden-path`
- Purpose: rapid system health verification before and after structural changes.

Recommended Usage:
- Run before starting development sessions.
- Run after major changes (RAG, prompt pipeline, schema edits).
- Run before activating a new Project Manager agent version.

---

## Gmail Operations Review State - March 13, 2026

Current Gmail Operations review workflow is now organized around three operator-facing stages:

1. Batch Overview
2. Sender Decisions
3. Message Verification + Approval

Current visible behavior:

- Review defaults:
  - sender page size: `10`
  - message page size: `10`
- Both sender and message sections now expose:
  - explicit page-size controls
  - explicit visible-range text
  - consistent pagination language
- Main Message Review uses hydrated snippet rows, matching the sender-preview evidence model.
- Review analytics are batch-scoped and visible at the top of the page:
  - top sender concentration
  - category distribution
  - recency distribution
  - unread/protected mix
- Gmail signal availability is now explained in plain operator language instead of internal/debug wording.

Current live validation state:

- Review page browser proof captured from localhost Chrome session.
- 3-step headings confirmed in rendered page text:
  - Step 1 / Batch Overview
  - Step 2 / Sender Decisions
  - Step 3 / Message Verification + Approval
- Bottom Message Review snippets confirmed present in live rendered page text.
- Sender page-size and message page-size controls confirmed present with default `10`.

Current latency picture from fresh local logs:

- `browse_query_cluster`
  - warm server: `345ms`, `440ms`
  - warm browser: `995ms`, `1158ms`
  - current default `page_size: 10`
- `load_message_snippets`
  - `3` visible rows: `1035ms` server / `1681ms` browser
  - `7` visible rows: `901ms` server / `1662ms` browser

Remaining limitation:

- The 3-step workflow is visibly improved, but the page is still dense for very large cleanup groups and sender detail expansion still depends on deferred enrichment timing.

---

## Gmail Operations Guided Review State - March 13, 2026

The Gmail Operations review page now behaves as a guided inbox cleanup workflow instead of a technical review console.

Current workflow:

1. Step 1 - Batch Overview
2. Step 2 - Sender Decisions
3. Step 3 - Message Verification + Approval

Current visible behavior:

- Step 1 answers:
  - what cleanup group is being reviewed
  - why the current batch exists
  - how large the cleanup group is
  - how large the current batch is
  - what the main cleanup opportunity/risk looks like
- Step 1 charts are tied to the active batch and include:
  - top sender concentration
  - category distribution
  - recency distribution
  - unread/protected mix
- Step 2 is the sender-only workbench:
  - sender page size defaults to `10`
  - sender page-size options are `10 / 25 / 50 / 100`
  - sender sorting options are:
    - highest sender volume
    - most unread
    - most recent
    - highest risk
    - alphabetic
  - sender policy and batch inclusion decisions are separated conceptually
- Step 3 is the verification and approval stage:
  - message page size defaults to `10`
  - message page-size options are `10 / 25 / 50 / 100`
  - visible messages are limited to the operator's current verification scope
  - bottom Message Review uses hydrated snippets
  - full message preview is available in a readable drawer
  - future rule recommendation now appears only here, after verification

Current Gmail field honesty in the UI:

- Actual fields surfaced:
  - sender
  - subject
  - snippet
  - date / age
  - unread
  - starred
  - important
  - Gmail categories / labels where available
- Derived/inferred signals surfaced:
  - machine-like vs human-like sender guidance
  - sender risk framing
  - likely cleanup suitability
- Not currently available as true Gmail-native signals:
  - open history
  - click history
  - exact engagement timeline

Live validation state:

- Browser-verified localhost screenshots captured for:
  - Step 1: `/tmp/cdp-step1.png`
  - Step 2: `/tmp/cdp-step2.png`
  - Step 3: `/tmp/cdp-step3.png`
  - full message preview: `/tmp/cdp-preview-open.png`
  - rule recommendation state: `/tmp/cdp-rule-state.png`

Current remaining limitation:

- Sender detail expansion is improved but still depends on deferred sender-intelligence loading.

---

## Gmail Review Trust State - March 13, 2026

Current sender-metric model is now explicitly unified:

- Authoritative sender-ranking metric:
  - `Batch message volume`
- This same metric now drives:
  - Step 1 top sender chart
  - Step 2 default sender sort
  - sender header batch-volume labels

Current scope labeling across the page:

- Cleanup group:
  - full candidate universe for the selected cleanup group
- Batch:
  - exact current working slice under review
- Page:
  - currently visible rows
- Historical indexed sender evidence:
  - only shown when explicitly labeled as indexed/history

Current sender preview behavior:

- Expanded sender preview now shows:
  - 5 recent examples by default
  - expandable bounded preview up to 8 examples
- Preview rows currently include:
  - subject
  - date
  - snippet when Gmail returns preview text
  - deterministic fallback copy when Gmail snippet is unavailable for that row

Current live browser verification:

- Step 1 chart and Step 2 sender workbench order align on the same top senders:
  - `mike@mikedillard.com`
  - `psb@deltateamtactical.com`
  - `consumer@e.mail.realtor.com`
  - `noreply@skool.com`
  - `info@grantcardone.com`
- Sender preview currently shows multiple examples from the current batch instead of only one row.

---

## Gmail Operations Scope Hierarchy - March 13, 2026

Current Gmail Operations navigation hierarchy is now explicit instead of implied:

- Whole Mailbox
- Cleanup Candidate Universe
- Cleanup Group
- Batch
- Sender
- Message

Current scope behavior by page:

- Mailbox Intelligence:
  - explicitly represents the Cleanup Candidate Universe
  - not the whole mailbox
  - shows how the candidate universe relates to the indexed whole mailbox
- Cleanup Groups:
  - sits one level below the candidate universe
  - inherits the scope strip so the operator can see where group counts come from
- Batch Review:
  - keeps the 3-step workflow
  - now sits under the broader hierarchy rather than replacing it

Current operator-facing count bridge:

- Mailbox Intelligence explains candidate-universe totals in mailbox context
- Batch Review explains:
  - how the current batch relates to the cleanup group
  - how the cleanup group relates to the cleanup candidate universe
- Sender rows explain:
  - messages in the current batch
  - messages in the cleanup group
  - messages in the cleanup candidate universe

Current live browser proof:

- Mailbox Intelligence goal / level explanation:
  - `/tmp/mailbox-intelligence-goal.png`
- Intelligence drill-down:
  - `/tmp/mailbox-intelligence-drilldown.png`
- Review scope strip:
  - `/tmp/review-scope-chain.png`
- Sender scope bridge:
  - `/tmp/review-step2-sender-row.png`
- Sender preview parity with Step 3:
  - `/tmp/review-step2-sender-preview.png`

---

## Gmail Operations IA Correction - March 13, 2026

Current top-level product story:

- `Operations Overview`
  - lightweight operational shell only
  - confirms health, mailbox index state, pending approvals, and next step
  - no longer serves as the main analytics destination
- `Mailbox Intelligence`
  - primary analytics-first entry into Gmail cleanup
  - explicitly represents the Cleanup Candidate Universe
  - owns the bird’s-eye explanation and drill-down behavior
- `Cleanup Groups`
  - explicit selection step after Mailbox Intelligence
- `Batch Review`
  - guided staged workspace underneath the broader hierarchy

Current navigation model:

- Left rail labels, page headers, and workflow path now use the same vocabulary:
  - Operations Overview
  - Mailbox Intelligence
  - Cleanup Groups
  - Batch Review
  - Pending Approvals
  - Executed Actions
  - History

Current Batch Review navigation:

- Global context:
  - compact workflow path back to Overview, Intelligence, and Cleanup Groups
- Local stage control:
  - Step 1: Batch Overview
  - Step 2: Sender Decisions
  - Step 3: Message Verification
  - Step 4: Approval / Rule Recommendation

Current Step 2 preview behavior:

- Sender preview rows now explicitly state they use the same full preview path as Step 3.
- Sender preview buttons now use `Open full preview` language.
- When Gmail does not return preview text, the UI now more clearly tells the operator to use the full preview instead of implying the preview is broken.

Current Mailbox Intelligence interaction clarity:

- An active drill-down now remains visibly summarized near the sender ranking table.
- The affected table auto-scrolls into view when a chart drill-down becomes active.
- The table shows whether the user is seeing:
  - full Cleanup Candidate Universe
  - or a currently active drill-down slice

Current `cleanup_group_intelligence` reuse behavior:

- Stable cache versioning now keys reuse to:
  - cleanup plan generation time
  - mailbox profile freshness generation time
- Normal route flow now reuses the warmed intelligence payload instead of repeatedly paying the old `~42s` cold compute in the user-visible navigation path.
- Latest warmed-flow evidence from local logs:
  - Overview prewarm server duration: `1ms`
  - Intelligence initial-load server duration: `0ms`
  - Cleanup Groups scope-chain server duration: `0ms`
  - Review scope-chain server duration: `1ms`

---

## Build Stabilization State - March 14, 2026

Current runtime-module build state:

- The reported Vercel failures for `@/lib/runtime/*` are not caused by alias configuration, case sensitivity, or renamed files.
- The reported modules already exist locally at the exact imported paths under `web/src/lib/runtime/`.
- The actual failure mode is deployment integrity:
  - the runtime split files exist in the working tree
  - they are currently absent from the tracked `HEAD` tree
  - a Vercel build from the tracked tree cannot resolve them

Additional runtime modules currently sharing this same risk profile:

- `approvalSummary.ts`
- `gmailCleanupMemory.ts`
- `gmailCleanupWorkspace.ts`
- `operationsAnalytics.ts`
- `operationsWorkspace.ts`
- `playgroundWorkflowState.ts`

Current validation snapshot:

- Full-repo `eslint` and `tsc` remain noisy in this local workspace because of unrelated in-progress files outside the stabilization scope.
- Local `next build` no longer reproduced the original missing-module crash in the current tree, but this thread did not produce a fully clean end-to-end build result from the dirty workspace.

---

# 🔄 Handoff Note (PM v8 → Next PM)

The system is stable, and the Gmail Phase 1 workflow is functionally complete.

Key transition state:
- Mailbox Intelligence is visually and structurally close to target, but requires one final polish pass under a fresh context window.
- Management layer is now functionally correct (destination + execution truth + restore), but needs visual intelligence layering.
- Sender Decisions + Confirmation flows are stable and no longer require structural changes.

Next Project Manager should focus on:
1. Final Mailbox Intelligence polish (visual + semantic clarity)
2. Management dashboard visual intelligence layer
3. Shared chart/visual system implementation
4. UI consistency + interaction standardization

Do NOT re-architect Phase 1 flow.
Do NOT regress sender-first model.
Do NOT reintroduce message-first logic.

This is a polish + intelligence layering phase, not a rebuild phase.

---

## Gmail Artifact Refresh Recovery State - March 29, 2026

Current mailbox-index to artifact-refresh state:

- Smart Sync is working.
- Mailbox index is current for the validated tenant:
  - `indexed_total_rows=234341`
  - `last_rows_before=234339`
  - `last_rows_after=234341`
  - `last_upserted_messages=2`
  - `last_deleted_messages=0`
- Artifact publication is no longer stranded behind the old orphaned `building_version` lock.

Current artifact liveness contract:

- `published_version`
  - last fully published artifact version served by artifact-backed readers
- `building_version`
  - candidate artifact version currently being written; not treated as live on its own
- `refresh_in_progress`
  - a refresh attempt has started and publication has moved into build mode
- `refresh_skipped_existing_build_in_progress`
  - planner decision used only when the shared liveness gate confirms a truly live build
- `refresh_completed_at=null`
  - means the current refresh attempt has not yet recorded a terminal result; this is no longer accepted as proof that work is still alive

Current build-liveness behavior:

- All artifact skip/start decisions now flow through `reconcileGmailArtifactBuildLiveness(...)`.
- Raw `building_version` alone is no longer the lock signal for:
  - mailbox-index refresh planning
  - incremental artifact refresh skips
  - stale-build reclaim decisions
- Reclaim is idempotent and safe under concurrent requests because publication updates are compare-and-set scoped to the expected stale `building_version` and `refresh_job_id`.

Current validated publication state:

- `published_version=full-mailbox-20260329092447406`
- `published_at=2026-03-29T10:03:51.301+00:00`
- `building_version=null`
- `build_status=published`
- `freshness_state=fresh`
- `freshness_reason=published_artifact_current`
- linked job:
  - `job_id=full-rebuild:085c8ef7-2fd7-4842-8499-cd605e894a77:all_indexed:full-mailbox-20260329092447406`
  - `status=completed`
  - `phase=published`

Current validation status:

- Deterministic stale-build proof confirms the same sync-completion flow now reclaims a stale build and re-plans refresh instead of skipping forever.
- Live full-mailbox publication proof confirms artifact publication advances beyond the stale pinned version:
  - before: `full-mailbox-20260328080841849`
  - after: `full-mailbox-20260329092447406`
- Runtime acceptance proof confirms artifact-backed readers now resolve the newer published artifact version instead of remaining pinned to the stale one.

---

## Cleanup Groups Canonical Cutover Mechanics State - March 30, 2026

Current scope state:

- This lane implemented cutover mechanics and validation plumbing only.
- This lane did not redesign:
  - taxonomy
  - assignment logic
  - UI
  - workflow behavior
  - alias compatibility

Current candidate-build state:

- `runGmailFullMailboxArtifactBuild(...)` now supports candidate-only completion and defaults to non-publishing behavior unless `publishResult=true` is explicitly requested by code.
- The candidate build path now:
  - creates a side-by-side full artifact version
  - stores the prebuild publication state in the resumable checkpoint
  - restores that publication state after build completion
  - leaves `published_version` unchanged
  - marks the build job `completed` with `phase=candidate_ready`
- Mailbox-index-triggered full rebuilds are explicitly pinned to candidate-only mode for this pre-cutover state.

Current validation-command state:

- Frozen shadow proof command remains available and pinned to:
  - `full-mailbox-20260329092447406`
- New unpublished candidate validation command is available and reads the requested artifact version directly without going through `published_version`.
- Live audit remains published-version-only and still validates runtime/live behavior against the currently published artifact only.

Current publication-control state:

- Explicit publish and explicit rollback paths now exist as compare-and-set publication repoint commands.
- Both paths require the caller to supply:
  - expected current `published_version`
  - expected `last_index_state_updated_at`
  - expected `last_indexed_message_count`
- Both paths refuse to proceed when publication state drifts before the repoint.
- Failed candidate rows are retained; rollback only repoints publication and does not delete candidate data.

Current readiness state:

- Candidate-ready: yes
- Publish-ready: yes

Current publish-ready proof bundle:

- Fresh candidate build proof:
  - `full-mailbox-20260330155423600`
  - `ai-agent-platform-docs/03_gmail_workspace/09_reference/gmail_cleanup_canonical_candidate_build_20260330_v7.json`
- Fresh unpublished candidate validation packet:
  - `ai-agent-platform-docs/03_gmail_workspace/09_reference/gmail_cleanup_canonical_candidate_validation_20260330_v6.json`
  - `safe_to_publish=true`
- Fresh publication-readiness packet:
  - `ai-agent-platform-docs/03_gmail_workspace/09_reference/gmail_cleanup_publication_readiness_20260330_v2.json`
  - `compare_and_set_ready=true`

Pointer-flip boundary remains:

- `published_version` has not been flipped yet.
- Explicit publish approval is still required before running the compare-and-set publish command.
