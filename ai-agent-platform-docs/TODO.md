# ✅ TODO — AI Agent Platform (Web)
_Last updated: 2026-03-11 (PM v8 review • Operations Data-Depth Hardening Logged)_

- Project Manager — healthy (v8 active)
- Architect — healthy
- Backend — healthy
- Frontend — healthy
- Workflow — healthy
- LLM Trainer — healthy
- Avatar & Voice — healthy
- Prompt Engineer — healthy

## 🔥 Current Focus (This Week)

---

1) Agent Runtime — Supervision Ladder (Slices #1–#6A) (COMPLETE)
   - [x] Plan → approve endpoints + approvals UI
   - [x] Confidence accumulation engine
   - [x] Supervisor mode + eligibility endpoint
   - [x] Guarded auto-approve
   - [x] Sandbox execution pipeline
   - [x] Execution logging + status UI

2) Integrations — Gmail OAuth + Draft Execution (COMPLETE)
   - [x] Tenant-level integration storage
   - [x] Gmail OAuth connect flow
   - [x] Runtime Gmail draft creation

3) Inbox Assistant — Operational Runtime (IN PROGRESS)
   - [x] Gmail inbox metadata analysis tool (gmail.analyze_inbox)
   - [x] Sender-cluster review tool (gmail.review_sender_cluster)
   - [x] Batch archive proposal system
   - [x] Approval → execute pipeline wired end‑to‑end
   - [x] Gmail archive execution implemented (remove INBOX label via Gmail API)
   - [x] Execution evidence returned to Playground
   - [x] Runtime suggestion lifecycle states (ready / pending / approved / executed)
   - [x] Playground state persistence/continuity across refresh and approvals round-trip
   - [ ] Open approvals link should open in new tab
   - [x] Refresh reconciliation so Playground detects executions and runtime state on return

4) Performance Improvements
   - [x] Reduce sequential runtime-state DB loading in Playground (`stateLoaders` now parallelizes evidence/history queries)
   - [x] Reduce cleanup-plan runtime-state latency (parallel cleanup-cluster discovery sampling)
   - [ ] Playground fast-path (skip RAG for simple prompts)
   - [ ] Retrieval caching
   - [ ] Reduce simple prompt latency

## 🧠 Codex Operating Model (Updated Mar 2026)
---
**Execution Philosophy (Hybrid Model):**
- Single-file edits → Project Manager may edit directly in chat (no Codex required).
- Multi-file logic changes → Use Codex with declared Feature Domain.
- Schema / Supabase structural changes → Use Codex only if Supabase CLI is connected.
- Refactors affecting multiple layers → Codex required.

**Feature Domain Discipline (Non-Negotiable):**
Each Codex thread must stay within ONE domain:
1) RAG Ingestion & Retrieval  
2) Prompt Contract / Summary Rewrite Engine  
3) Fine-Tuning System  
4) Agent Runtime (Production Inference)  
5) Workflow / Automation Engine  
6) Dashboard Intelligence Layer  

No cross-domain edits in a single Codex thread.

**Important Clarifications:**
- Docker is NOT required unless running Supabase locally.
- Supabase schema updates require Supabase CLI login (remote projects supported).
- Q&A-derived Prompt Contract fields remain canonical authority.
- RAG is supplemental evidence only.
- Fine-tune dataset generation is a separate domain.

This model reduces bureaucracy, avoids redundant Codex calls, and preserves system integrity.
---
1) **PM v8 Activation + Clean Handoff (PRIMARY PRIORITY)**
   - [x] RAG ingestion verified (Drive + URL, embeddings confirmed)
   - [x] Retrieval weighting hierarchy implemented (Drive boost, product intent tuning)
   - [x] Canonical merge protection in rewrite engine (no silent field shrinking)
   - [x] Strict JSON schema enforcement for evaluate + refine
   - [x] Rewrite gating by quality threshold (fast vs forced path separation)
   - [x] Circuit breaker for OpenAI abort/socket failures
   - [x] Create final v6 tag + snapshot commit
   - [x] Activate Project Manager v8 (fresh context thread)
   - [x] Enforce Feature Domain isolation in Codex tasks (no cross-domain mixing)
   - [x] Confirm v8 adopts Codex Execution Protocol as canonical

2) **Observability + Confidence Layer (Post-v7)**
   - [ ] Add rewrite influence log (which fields were expanded vs preserved)
   - [ ] Add optional debug mode to display RAG chunk influence during rewrite
   - [ ] Add rewrite diff viewer (before vs after comparison)
   - [ ] Add retrieval inspection panel in Playground
   - [ ] Add quality score trend tracking

3) **Fine-Tune Weighting Formalization**
   - [ ] Confirm final weighting hierarchy:
         Q&A refinement (canonical contract)
         → Manual fine-tune examples
         → RAG (Drive prioritized over URL)
         → Crawl-only evidence
   - [ ] Document weighting model inside SYSTEM_OVERVIEW.md
   - [ ] Add automated regression guard for guardrails/escalation policy
---

## ✅ Completed / Major Milestones
- [x] Agent Summary page upgraded: dynamic textarea expansion for long blocks (mission/guardrails/etc.)
- [x] Quality pipeline stabilized:
  - “Recalculate” = fast path
  - “Force Full Rewrite” = expensive path
  - Added guardrails to prevent both buttons behaving like full rewrite
- [x] Fine-tune dataset preview, next training suggestion, and Q&A improvement flow working
- [x] RAG ingestion pipeline working end-to-end (schedule → run → documents ingested)
- [x] Playground RAG retrieval fixed to correctly surface **exact blog URLs** when present
- [x] Agent Runtime Slice #1 shipped: plan → approve endpoints + approvals UI (schema-free via agent_events)
- [x] Tool/Workflow governance spec updated: granular confidence tracked per agent per tool action and per workflow/SOP
- [x] Gmail Inbox Assistant end‑to‑end operational
  - Inbox analysis → sender cluster review → approval → archive execution
- [x] First real Gmail inbox archive executed successfully via runtime pipeline
- [x] Runtime suggestion lifecycle tracking implemented (approval_request → decision → execution_result)
- [x] Archive execution evidence surfaced in Playground UI
- [x] Gmail OAuth scope upgraded to include gmail.modify for write operations
- [x] Playground runtime controller refactor milestone:
  - Runtime lifecycle logic extracted into `suggestionLifecycle.ts`
  - Runtime evidence/history loaders extracted into `stateLoaders.ts`
  - Gmail runtime progression extracted into `gmailRuntimeAssembler.ts`
  - Runtime orchestration service extracted into `runtimeStateService.ts`
  - Prompt assembly extracted into `playgroundPromptBuilder.ts`
  - RAG retrieval stack extracted into `playgroundRagService.ts`
- [x] Playground thin-controller pass:
  - OpenAI chat invocation + response/error handling extracted into `playgroundChatService.ts`
- [x] Playground thin-controller pass:
  - Analytics/session logging extracted into `playgroundAnalyticsService.ts`
- [x] Playground/Approvals UI polish pass:
  - Action-first “Current step” runtime panel
  - Runtime details/evidence drawer with operator-first ordering
  - Query cleanup clusters: compact rows, top-3 default visibility, nested safety/query details
  - Conversation preserved as secondary work area under runtime controls
  - Compact approvals decision card layout with pending emphasis and compressed approved/executed rows
- [x] Mailbox Intelligence / Profiling pass (read-only, pre-cleanup strategy layer):
  - Added additive `runtime_mailbox_profile` metadata in Playground runtime API
  - Default 30-day Gmail-native profile window (60-day compatible contract)
  - Added sender recurrence + subject-pattern bounded sampling
  - Added profile-driven protection candidates, cleanup candidates, and rule opportunities
  - Wired minimal Playground runtime-details profile card (no backend contract break)
- [x] Mailbox profiling freshness/caching hardening:
  - Added cleanup discovery/profile snapshot caching in `agent_events`
  - Added freshness states (`fresh` / `cached` / `stale`) with last-generated visibility
  - Prevented repeated Gmail profiling calls on routine rehydrate while cache is fresh
  - Added explicit mailbox profile refresh affordance in Playground runtime details
- [x] Operator cleanup strategy layer (profile-driven):
  - Added additive `runtime_cleanup_strategy` contract
  - Strategy sections: protect first / best first cleanup waves / rule opportunities / avoid-review zones
  - Wired into Playground prompt guidance for structured operator recommendations
  - Added compact strategy UI card in Playground runtime details
- [x] Trust + cleanup-promotion guardrails:
  - Added trust snapshot block (sample size / profile window / metadata basis / confidence)
  - Blocked cleanup action-promotion when 30-day mailbox profile is absent
  - Kept analysis/review guidance active without promoting cleanup approvals on sample-only basis
  - Replaced hardcoded Playground examples with agent-aware examples
- [x] Stronger bounded mailbox profiling basis:
  - Raised metadata scan basis from 60 -> 120 messages
  - Raised id scan basis from 120 -> 240 ids
  - Preserved cache TTL and bounded-scan design (no full-mailbox scan)
- [x] Gmail Playground trust + UX clarity refinement:
  - Tightened query specificity for newsletters/no-reply/shopping/social cleanup clusters
  - Added explicit estimate-overlap uncertainty surfacing for Gmail heuristic counts
  - Replaced vague runtime CTA copy with action-specific labels
  - Added “What happens next” consequence blocks on current-step and review cards
  - Standardized read-only language: review only, no inbox changes yet
- [x] Playground consistency hardening (session + approvals scope):
  - Playground → Approvals now carries explicit scope (`session` or `agent`) with visible queue scope labeling.
  - Session-scoped approval summaries now reconcile from the same scoped approval model in both surfaces.
  - Server-authored Playground chat rehydrate added via `playground.session_snapshot` + `session_messages`.
  - `review_query_cluster` approvals are executable from Approvals.
  - Runtime dedupe scope tightened to prevent sessionless requests from reusing session-scoped pending approvals.
- [x] Runtime reconciliation stabilization pass:
  - Immediate in-place approvals queue updates after approve/reject/execute
  - Canonical approval-id resolver applied to Playground candidate/cluster rendering
  - Clear-conversation unresolved approval carry-over visibility for prior session
  - Rehydrate-only cleanup discovery refresh deferral (cached/stale snapshot first)
- [x] Runtime reconciliation follow-up (March 11):
  - Query cleanup cluster pending display now reconciles with canonical queue pending for first-step sender-review submissions.
  - Runtime-refresh return path suppresses stale local pending/approved queue state until authoritative summary rehydrates.
  - Clear-conversation cleared-session context now carries only session identity (no pending/approved ghost-count carryover).
- [x] Clear-conversation semantics correction (March 11):
  - Clear now resets chat transcript/input only, without unmounting runtime dashboard or resetting approval/workflow surfaces.
  - Cleared-session message restore suppression prevents old transcript repaint while preserving authoritative runtime queue/evidence rehydrate.
- [x] Approval-summary clarity pass (March 11):
  - Added plain-English approval summary block to Playground Current Step and Approvals cards.
  - Added explicit representative-preview vs selected-scope wording for review/archive approvals.
  - Added scalable group-approval language (grouped/batch framing with representative examples and safety/exclusion statements).
- [x] Approval decision-surface professionalization (March 11):
  - Upgraded approval UI to high-signal decision cards (Action/Scope/Source/Why/Risk/Reversible/Exclusions/Effect).
  - Added structured representative example rows (subject + sender + date) for faster operator confidence.
  - Preserved runtime/approval semantics; this pass is presentation + supporting data shaping only.
- [x] Shared approval decision-card refinement (March 11):
  - Extracted shared `ApprovalDecisionCard` component and applied it to both Playground and Approvals.
  - Added stronger hero-row emphasis for action/scope/source/risk/reversible facts.
  - Demoted secondary explanatory text into collapsible supporting details for better scanability and reduced density.
- [x] Approval decision-card final polish (March 11):
  - Elevated affected count/scope prominence in hero area (archive/review actions).
  - Improved compact-card legibility so action/scope/source/risk remain visible without expansion.
  - Tightened representative examples into a table-like preview scan pattern (subject/sender/date + optional snippet).
- [x] Review-results workflow correction (March 11):
  - Added dedicated post-review “Review Results” primary state before next-step approval prompting.
  - Separated current review evidence from historical evidence in runtime details chronology.
  - Added cluster makeup + objective + recommended next action + future-prevention recommendation in review-results summary.
  - Replaced brittle affected-count parsing with structured count fields + explicit estimate labeling.
- [x] Reviewed-result detail surface extraction (March 11):
  - Added dedicated reviewed-batch detail page with richer operator context and evidence.
  - Added previous/next navigation across reviewed results.
  - Added result-scoped chatbot for reviewed-batch Q&A.
  - Kept Playground focused on high-level workflow + concise latest-review summary + CTA into full detail.
- [x] Review/Playground separation follow-up (March 11):
  - Added `session_origin` namespace support so review-detail chat traffic is isolated from main Playground workflow chat.
  - Suppressed stale sender/query review recommendations using reviewed-result lifecycle history.
  - Bound batch suggestions to the currently viewed reviewed-result context and demoted stale cross-result residue.
  - Further reduced Playground runtime-detail duplication by compacting historical evidence into timeline summaries.
- [x] Review-detail behavior isolation hardening (March 11):
  - Added explicit `request_mode` contract to distinguish main Playground vs review-detail inference behavior.
  - Added dedicated review-detail system prompt path (result-scoped guidance only).
  - Reduced review-detail backend load path to reviewed-result-focused data instead of full broad runtime-state assembly.
- [x] Runtime review trust hardening follow-up (March 11):
  - Current-step consequence copy now explicitly distinguishes approval-request creation vs mutation execution.
  - Added sender preference controls (`Keep Sender` / `Neutral` / `Deprioritize Sender`) in review-result context.
  - Added engagement-backed archive rationale shaping in approval summaries (signals + confidence + exclusions).
- [x] Runtime review UX stabilization follow-up (March 11):
  - Current Step now explicitly separates lifecycle state, next action, and read-only context.
  - Removed remaining duplicate latest-review top-card surface to reduce circular/self-referential navigation.
  - Demoted duplicated current-review details in Runtime details to canonical review-detail pointer.
  - Added explicit sender-preference effect text near recommendation output.
  - Added explicit archive trust summary wording in main UI (evidence mode, confidence, protected/excluded signals).
- [x] Operator trust + explicit choice follow-up (March 11):
  - Added canonical workflow-state helper (`playgroundWorkflowState.ts`) and wired Current Step lifecycle rendering to it.
  - Replaced internal sender-preference wording with operator-facing consequence labels.
  - Added lightweight pre-approval archive customization (exclude sender / exclude message subset) with selected/excluded counts.
  - Added explicit “opened status not available” trust copy in Playground/review-detail evidence context.
  - Extended archive approval summary to show subset scope (selected vs candidates vs excluded).
- [x] Operator usability/scalability follow-up (March 11):
  - Added grouped archive selection controls (pattern groups + sender groups) for faster large-batch customization.
  - Added a primary Decision Diff panel with reviewed/selected/excluded counts and included/excluded examples.
  - Separated sender preference into a distinct **Future sender policy** section.
  - Updated shared `ApprovalDecisionCard` to show Total reviewed / Archive selected / Excluded-kept scope totals.
- [x] Review-detail chat grounding follow-up (March 11):
  - Scoped chat now enforces observed-vs-estimated framing and explicit out-of-scope handling.
- [x] Session-scope stale-evidence suppression follow-up (March 11):
  - Session-scoped runtime evidence/review-results/archive evidence now filtered by scoped approval ids.
  - Review-detail rehydrate now applies scoped evidence filtering when session scope is provided.
- [x] Operations Workspace UI architecture split (March 11):
  - Added dedicated `/agents/[id]/operations/*` workflow surfaces (overview, clusters, review, approvals, history).
  - Added shared operations shell with left-rail operator navigation and right-side contextual AI assistant.
  - Added review-detail result navigation (`Previous result` / `Next result`) for multi-result operator traversal.
  - Shifted Playground to chat-first handoff mode (runtime operations moved to Operations workspace by default).
- [x] Operations Workspace clarity + native approvals follow-up (March 11):
  - Refined left-rail layout/grouping/active hierarchy for product-level navigation clarity.
  - Added sender-level inline message inspection in Review Detail.
  - Added explicit exclusion reason rendering (sender/pattern/manual/keep-policy) in message/sender contexts.
  - Added explicit selection-hierarchy guidance in Review Detail.
  - Reworked reviewed-result action copy to avoid redundant “review request” confusion.
  - Enabled inline approve/reject/execute in `/operations/approvals` via existing runtime APIs.
  - Added richer action audit context in `/operations/history`.
  - Added shared operations runtime snapshot context with cache + stale-while-revalidate to reduce redundant rehydrate calls.
- [x] Operations workflow-correctness + operator-clarity hardening (March 11):
  - Fixed cluster routing so `Open review` always opens requested `cluster_id` context (no unrelated latest-result fallback).
  - Removed review-approval requirement for inspection in Operations review flow (inspection is read-only by default).
  - Switched review navigation model to cluster queue traversal (`Previous cluster` / `Next cluster`).
  - Added compact pattern-breakdown mode when only one pattern is present.
  - Added message interaction filters/badges (unread, starred/important, inferred no-interaction-90d, thread participation).
  - Simplified review action bar to one mutation path (`Create archive approval request`) with explicit no-mutation-until-approve+execute copy.
  - Improved approvals card consequence clarity (`Applies to`, `If approved`, `If approved/executed`, `If rejected`).
  - Added page-contextual assistant suggested prompts in Operations side panel.
  - Added in-memory runtime snapshot cache layer + longer SWR window to reduce navigation/remount rehydrate chatter.
- [x] Operations operator-trust + credibility follow-up (March 11):
  - Fixed left-rail visual overlap/cramped rendering and aligned nav naming to cluster-first workflow language.
  - Added explicit request/approval/execute sequence guidance in both Cluster Review Detail and Pending Approvals.
  - Added signal-honesty block in review detail (available vs inferred vs unavailable signals).
  - Hardened interaction filters to disable gracefully when unsupported by current sample metadata.
  - Expanded sender analytics (sample share, estimated scope relationship, pattern mix, signal counts, classification, protected hints).
  - Added first-pass command-center analytics charts in Overview and Review Detail (all estimate-aware).
- [x] Operations data-depth + signal-coverage hardening (March 11):
  - Expanded Gmail review/discovery metadata contract (thread/history/internal date + labels/category/inbox-state + unread/important/starred).
  - Added read-only review evidence fetch actions in `/api/integrations/gmail/inbox-analysis` for query/sender cluster review loading.
  - Increased bounded review sample depth to 60 and wired review page deep-evidence loading (default 30, optional 60).
  - Added explicit evidence-basis mode (executed review vs expanded preview vs fallback sample) and sample-vs-estimate scope framing.
  - Added stricter signal-availability coverage reporting and filter gating by actual metadata presence.
  - Added sender decision-support metrics (selected/excluded shares, sender domain, thread-hint counts, protected overlap).
  - Added approval-scope detail rendering in Pending Approvals (selected/excluded/reviewed counts, message-id scope, evidence basis, safety exclusions).
  - Added operator-question guidance + metadata scan-basis disclosure in Overview.

---

## 🧱 Known Issues / Risks
- Open approvals still navigates in the same tab (continuity preserved, but UX may still prefer new-tab behavior).
- Runtime suggestion status may require manual refresh to reconcile execution events.
- Playground workflow progress currently reflects current workflow-step progress, not total inbox cleanup progress.
- Pre-approval customization is currently V1 (sender/message exclusion only for archive subset); broader keep/archive partition tooling is deferred.
- Grouped pre-approval customization currently supports sender/pattern/message controls, but does not yet provide saved reusable batch policies.
- Gmail opened/replied engagement signals are still limited by available metadata in current integration mode; unread/starred/important/recency signals are used as the current trust basis.
- Interaction filters are intentionally conservative in sparse-signal clusters; disabled states can still occur frequently until richer Gmail engagement metadata is available.
- Runtime mailbox profile is estimate-based by design (Gmail query estimates + bounded sample), not exhaustive full-mailbox classification.
- Mailbox profile cache currently refreshes on demand/reactive triggers; no scheduled background refresh cadence yet.
- Operations approvals now support inline approve/reject/execute; legacy `/approvals` remains available as broader admin/global queue surface.
- Review Detail selection model still depends on single-page controls; dedicated multi-step wizard/state-machine extraction remains deferred.
- Cleanup strategy quality depends on profile coverage and remains estimate-based rather than full-mailbox deterministic classification.
- Gmail query estimate overlap can still occur in some inboxes; current handling is explicit uncertainty framing plus bounded review-first workflow.
- Cleanup-action promotion is intentionally profile-gated; operational throughput may feel slower until profile availability is stable for all sessions.
- Bounded evidence depth is improved (up to 60 in review fetches) but still intentionally not full-mailbox evidence; very large clusters remain estimate-first.
- Support center (support.curativemushrooms.com) often returns **HTTP 403** during crawl → expected unless we add auth/crawler headers.
- In dev, “run_now” fire-and-forget fetch may time out (HeadersTimeout / AbortError). Job can still be queued and run separately.
- Wildcard crawl patterns (/*) inherently require scanning to discover new pages → “delta” cannot magically detect changes without scanning.
- RAG progress tracking currently approximates progress via rag_documents count (not true total-discovered URL count for wildcards).
- Progress bar for wildcard crawls cannot be exact without a pre-discovery phase; current implementation shows processed count + status only.
- Prompt rewrite engine does not yet surface which retrieved RAG chunks influenced rewritten blocks (observability gap).
- Prompt rewrite engine currently relies on truncated RAG evidence pack (top-N chunks) to control token usage; full-document semantic influence is achieved via embeddings, not raw inclusion.

---

## 🗺️ Next Targets (After This Week)
- Dedicated RAG background worker (separate process / queue-driven, no manual trigger required)
- Background worker hardening (retry logic, rate limiting, domain-level error reporting)
- Agent org-tree visualization (roles / hierarchy)
- Better agent naming model (short role-like titles, editable)
- Automations framework MVP (run an agent workflow end-to-end)
- “Aha moment” avatar + face card (image + persona, later voice/video)
- Define and implement true Inbox Cleanup Progress metric (cleaned definition + denominator + session vs cumulative)
- Add configurable profiling window toggle (30/60 day) in Playground runtime controls once UX contract is finalized
- Add optional policy-based auto-refresh schedule for mailbox profile snapshots (without forcing rehydrate-time recomputation)
- Improve Gmail cluster estimate differentiation further (confidence/range modeling when resultSizeEstimate overlap persists)
- Add thread/message-list expansion path beyond 60 bounded review rows (progressive fetch/pagination with explicit cost controls)
- Add richer sender/domain rollups (domain-level risk buckets, sender-family grouping, and cross-cluster recurrence views)
- Add server-backed pagination/filtering for reviewed-result detail history once reviewed-result volume grows.
- Add a migration/cleanup path for legacy approvals without `session_id` so older pending items can be surfaced or archived with clear operator intent
- Add richer server-side approval summary payload with explicit rejected/executed approval ids (not counts only) for stronger deterministic client reconciliation.
- Implement deterministic sender-subset partitioning for query-cluster newsletter flows (keep/deprioritize at per-sender granularity instead of top-sender heuristic).
- Add server-side “queue_version” / monotonic revision for approvals so Playground can skip redundant rehydrate polling when no queue change occurred.
- Consider extracting Current-Step lifecycle rendering into a small dedicated presenter component once workflow semantics stabilize (keep architecture unchanged for now).

Project Manager Agent – v8 review complete • Inbox Assistant operational • TODO aligned for handoff continuity
