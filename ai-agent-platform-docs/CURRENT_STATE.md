# CURRENT_STATE — AI Agent Platform

Last updated: 2026-03-11  
Project Manager: v8 (active — synchronized under Codex Hybrid Execution Model)

---

# 🟢 System Health

Build: Clean  
Golden Path: Passing  
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
