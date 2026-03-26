# Playground Runtime Architecture

## 1) Purpose

The Playground API route is now a thin controller for request orchestration, not the owner of runtime derivation internals.

NOTE (Updated Workflow Reality):
The platform no longer relies on multiple specialized agents (Architect, Frontend, Backend, etc.) for execution.
The actual production workflow is now:
- Project Manager (planning, spec, QA, orchestration)
- Codex (execution)
All architecture and runtime boundaries should reflect this simplified execution model.

`src/app/api/agents/playground/route.ts` is currently responsible for:
- request parsing/validation (`agent_id`, `messages`, optional `session_id`, optional `rehydrate_only`)
- agent lookup
- latest playground session lookup (when `session_id` is not provided)
- explicit analyze-inbox proposal trigger detection
- response shaping (runtime metadata + assistant reply)
- `rehydrate_only` short-circuit behavior
- OpenAI chat call (non-rehydrate path)
- analytics/session event logging (non-rehydrate path)

Logic extracted out of the route:
- runtime evidence/session/history loading
- Gmail runtime state orchestration and progression
- suggestion lifecycle status reconciliation
- RAG retrieval (embedding + ranking + fallbacks)
- system prompt construction

## 2) Current Module Boundaries

IMPORTANT:
These module boundaries are consumed and enforced by a single execution loop (PM → Codex).
There is no multi-agent runtime coordination layer in practice.

### `src/app/api/agents/playground/route.ts`
- Thin HTTP surface/controller for Playground POST.
- Calls one runtime-state service (`loadPlaygroundRuntimeState`) and one RAG service (`loadPlaygroundRagContext`).
- Calls one prompt builder (`buildPlaygroundSystemPrompt`).
- Owns explicit `runtime_proposal` (gmail.analyze_inbox) trigger logic and final JSON response assembly.
- Owns OpenAI chat completion call and analytics logging.

### `src/lib/runtime/stateLoaders.ts`
- Loads/parses persisted runtime evidence and lifecycle history from Supabase `agent_events`.
- Exposes typed evidence loaders:
  - analyze inbox evidence
  - sender-cluster review evidence
  - query-cluster review evidence
  - archive execution evidence
- Exposes lifecycle history loader (`approval_request`, `approval_decision`, `execution_result`).
- Exposes latest playground session id lookup and aggregated runtime input loader:
  - `loadLatestPlaygroundSessionId`
  - `loadPlaygroundRuntimeStateInputs`

### `src/lib/runtime/runtimeStateService.ts`
- Service orchestrator for Playground runtime state.
- Owns:
  - loading runtime inputs via `loadPlaygroundRuntimeStateInputs`
  - deciding whether cleanup discovery should run (`shouldRunGmailCleanupDiscovery`)
  - tenant lookup (`profiles.tenant_id`)
  - optional Gmail cleanup discovery call (`discoverGmailCleanupClustersForTenant`)
  - one-pass or two-pass runtime assembly (`assembleGmailRuntimeState`)
- Returns:
  - `runtimeInputs`
  - `runtimeState`

### `src/lib/runtime/gmailRuntimeAssembler.ts`
- Gmail-specific runtime derivation/progression logic.
- Derives:
  - recommendation, review proposal, active batch
  - sender-aligned review/archive evidence
  - batch suggestions and suggestion sets
  - query cleanup plan and cleanup suggestion set status alignment
  - evidence blocks and active work item
  - prompt context derived from lifecycle-aware suggestion sets
- Exposes `assembleGmailRuntimeState` and cleanup-discovery gate helper.

### `src/lib/runtime/suggestionLifecycle.ts`
- Generic lifecycle reconciliation for approval-gated candidates.
- Parses proposed action candidates from event payloads.
- Matches proposed actions to candidates and resolves candidate status:
  - `ready`, `pending_approval`, `approved`, `executed`
- Produces prompt helper context (`ready_actions`, `executed_actions`, `has_executed_archive`).

### `src/lib/runtime/playgroundRagService.ts`
- Owns Playground RAG retrieval stack:
  - embedding generation
  - drive-first retrieval path
  - pgvector RPC retrieval path (`match_rag_documents`)
  - JS cosine fallback retrieval path
  - ranking/boost/penalty heuristics and dedupe
- Formats retrieved rows into Playground `ragContextBlocks`.
- Exposes `loadPlaygroundRagContext`.

### `src/lib/runtime/playgroundPromptBuilder.ts`
- Owns full system prompt assembly for Playground.
- Includes:
  - onboarding summary sections
  - runtime evidence/recommendation/suggestion guidance
  - static RAG/crawl hints
  - URL/link safety rules
  - final appended RAG context blocks
- Exposes `buildPlaygroundSystemPrompt`.

## 3) Request Flow (Normal POST)

1. Parse request body in `route.ts`.
2. Validate required fields (`agent_id`, and `messages` unless `rehydrate_only=true`).
3. Load agent row from `agents`.
4. Resolve session:
   - use incoming `session_id` if provided
   - otherwise call `loadLatestPlaygroundSessionId`.
5. Build user-intent context from latest user message.
6. Call `loadPlaygroundRuntimeState`:
   - load runtime inputs from events
   - assemble runtime state
   - optionally run cleanup discovery
   - re-assemble runtime state with discovery data.
7. Build `runtime_proposal` (analyze inbox) in route when explicit intent rules match.
8. Shape runtime metadata payload (`runtime_*`) in `responseData`.
9. If not rehydrate:
   - derive `ragSources` / `crawlDomains`
   - call `loadPlaygroundRagContext`
   - build `systemPrompt` via `buildPlaygroundSystemPrompt`
   - call OpenAI chat completion
   - log session/event analytics (`agent_sessions`, `agent_events`).
10. Return `{ ok: true, data: responseData }` with `reply` on non-rehydrate path.

11. UI Contract Enforcement (NEW REQUIREMENT)
    - Before any UI-related changes, execution must reference:
      - Gmail Workspace Visual Intelligence Spec
      - Gmail Workspace Intelligent Dashboard Spec
    - Any deviation from these specs is considered a regression.

## 4) Rehydrate Flow (`rehydrate_only`)

Current behavior when `rehydrate_only === true`:
- request still validates `agent_id`
- route still loads agent and resolves session id
- route still calls `loadPlaygroundRuntimeState` (including lifecycle/evidence re-derivation and optional cleanup discovery if gate conditions are met)
- route still shapes runtime metadata into `responseData`
- route returns early:
  - no RAG retrieval
  - no prompt build
  - no OpenAI call
  - no `playground.call` analytics insert
  - no `reply` field

DESIGN NOTE:
Rehydrate flow must remain fast and deterministic because it powers UI reloads and agent continuity.
Any heavy computation must not block this path.

## 5) Data Contracts

### Runtime inputs (`PlaygroundRuntimeStateInputs`)
From `stateLoaders.ts`:
- `runtimeEvidence`
- `latestRuntimeReviewEvidence`
- `latestRuntimeQueryReviewEvidence`
- `latestRuntimeArchiveEvidence`
- `runtimeSuggestionHistory`

### Runtime assembled state (`AssembledGmailRuntimeState`)
From `gmailRuntimeAssembler.ts`:
- `runtimeRecommendation`
- `runtimeReviewProposal`
- `runtimeActiveBatch`
- `runtimeReviewEvidence`
- `runtimeArchiveEvidence`
- `runtimeBatchSuggestions`
- `runtimeCleanupPlan`
- `runtimeSuggestionSets`
- `runtimeSuggestionPromptContext`
- `runtimeEvidenceBlocks`
- `runtimeActiveWorkItem`

### Runtime proposal (route-owned)
`runtime_proposal` in route:
- `user_request`
- `proposed_actions: [{ tool: "gmail", action: "analyze_inbox" }]`
- `approval_required: true`
- `reason`

### Runtime suggestion sets
From lifecycle + assembler:
- array of suggestion-set objects with lifecycle-aware candidate statuses
- candidates include `proposed_action`, `message_ids`, `status`, optional `approval_id`

### Runtime evidence blocks
From assembler:
- normalized evidence summaries for analyze/review/query-review/archive execution events
- used for UI evidence rendering and active work-item references

### RAG context blocks
From `playgroundRagService.ts`:
- `string[]` formatted as:
  - `Context #N — source_type: ..., source_url: ...`
  - followed by retrieved chunk content
- consumed by `playgroundPromptBuilder.ts`

## 6) Architecture Diagram

```text
+----------------------------------------------+
| Playground API Route                         |
| src/app/api/agents/playground/route.ts       |
+----------------------+-----------------------+
                       |
                       | runtime state
                       v
        +---------------------------------------+
        | runtimeStateService                   |
        | src/lib/runtime/runtimeStateService.ts|
        +------------------+--------------------+
                           |
          +----------------+-------------------+
          |                                    |
          v                                    v
+--------------------------+        +------------------------------+
| stateLoaders             |        | gmailRuntimeAssembler        |
| src/lib/runtime/         |        | src/lib/runtime/             |
| stateLoaders.ts          |        | gmailRuntimeAssembler.ts     |
+--------------+-----------+        +---------------+--------------+
               |                                    |
               v                                    v
      +---------------------+             +-------------------------+
      | suggestionLifecycle |<------------| lifecycle status apply  |
      | src/lib/runtime/    |             | + prompt context        |
      | suggestionLifecycle.ts            +-------------------------+
      +---------------------+

Route (non-rehydrate path) also calls:

+---------------------------------------------+
| playgroundRagService                        |
| src/lib/runtime/playgroundRagService.ts     |
+--------------------+------------------------+
                     |
                     v
+---------------------------------------------+
| playgroundPromptBuilder                     |
| src/lib/runtime/playgroundPromptBuilder.ts  |
+--------------------+------------------------+
                     |
                     v
             OpenAI Chat Completions
```

## 7) What Is Still Playground-Specific

- Route still contains Playground-specific intent regex logic for `runtime_proposal` (`gmail.analyze_inbox` trigger).
- Route still directly calls OpenAI chat completions and handles response parsing.
- Route still directly logs Playground analytics/events (`event_type: playground.call`) and creates `agent_sessions` rows.
- Prompt builder is Playground-specific in phrasing and includes Playground-focused runtime guidance text.
- Runtime assembler is intentionally Gmail-specific (tool/action names and Gmail cleanup/review/archive semantics).

CLARIFICATION:
Playground remains the primary orchestration surface for runtime intelligence, but its architecture should remain reusable for future non-Playground agent execution surfaces.

## 8) Execution Model Alignment (Updated)

The system should evolve toward:

1. Clear separation of concerns:
   - Runtime state (stateLoaders + runtimeStateService)
   - Intelligence derivation (gmailRuntimeAssembler)
   - Retrieval (RAG service)
   - Prompt construction (prompt builder)
   - Execution (Codex)

2. Single execution pipeline:
   - Project Manager defines intent + constraints
   - Codex executes within strict spec boundaries

3. UI Safety Layer:
   - All UI changes must be spec-driven
   - No ad-hoc UI implementations allowed

4. Performance-first runtime:
   - Cold load minimized
   - Rehydrate path prioritized
   - Cached state reused aggressively

5. Future readiness:
   - Architecture remains compatible with:
     - multi-workspace expansion
     - autonomous agent execution
     - cross-tool orchestration

## 9) Key Architectural Truths (DO NOT VIOLATE)

- Sender-first system (not message-first)
- Decision state is the core unit of progress
- UI is a guided system, not a data dump
- Runtime must be fast, predictable, and cache-first
- Codex must follow spec before implementing UI


These rules override all local implementation decisions.

---

## 🏁 PM v11 Turnover Addendum — Runtime Reality (March 26, 2026)

### Current Phase Context

We are in **Phase 1B — UI usability + runtime reliability** for Gmail Workspace.

Key implication:
- The Playground runtime is **stable enough**, but several **runtime-path seams are now exposed by UI interaction**.
- Do NOT introduce new architecture. Fix issues within current boundaries.

---

### Hybrid Truth Model (CRITICAL)

The system currently operates with two layers:

1. **Artifact Layer (Published Truth)**
   - Source: `semantic_rollup` from frozen artifact `full-mailbox-20260325230627555`
   - Used for: hierarchy, top counts, decision framing

2. **Runtime Layer (Live Reconstruction)**
   - Source: `gmail_sender_stats` + preview rows + resolver
   - Used for: sender lists, decision cards, previews

**Rule:**
- Artifact truth is PRIMARY for user understanding
- Runtime truth is SECONDARY for interaction
- Divergence must be **visible and explained**, never hidden

---

### Known Runtime Seams (Do Not Misdiagnose)

1. **Subtype Focus Count Divergence**
   - Top counts (artifact) vs bottom sender counts (runtime) may differ
   - This is expected without persisted per-sender subtype membership

2. **Full-Cluster Materialization Path**
   - Focused subtype queries use:
     - `read_shape: full_cluster_materialization`
   - Cold load latency ~10–15s
   - Warm loads acceptable

3. **Decision Card Preview Gaps (ACTIVE BUG)**
   - Some high-volume senders show no preview
   - Cause: preview selection / fallback, not ingestion

---

### 🚫 Do NOT Fix With Architecture Changes

Do NOT:
- add new persistence layers
- introduce new artifact fields
- rebuild artifacts to fix runtime issues
- change resolver logic unless directly proven necessary

These are Phase 2 concerns.

---

### 🎯 Immediate Runtime Priorities

1. **Decision Card Preview Reliability**
   - Ensure a valid preview is always selected when messages exist
   - Add fallback selection logic if primary candidate fails

2. **Sender Workspace Stability**
   - Keep subtype focus requests reliable
   - Avoid empty or misleading results

3. **Truth Communication**
   - Clearly label:
     - published totals
     - current matching results

---

### Performance Guidance (Deferred)

Performance optimization should NOT be tackled yet.

Future solution (not now):
- persisted per-sender subtype membership
- precomputed subtype membership indexes
- avoiding full-cluster materialization

---

### Execution Rule

> If the system works but is slow → do not redesign it yet.
> If the system is fast but wrong → fix it immediately.

---

### Final Note

The runtime architecture is **correct for Phase 1**.

Remaining work is:
- reliability
- clarity
- usability

Not structural redesign.

---
