# TODO — Active Tasks (as of December 2025)

## 🧠 Clarify UX Enhancements (Edit Agent)
- [x] Add per-field clarify badge (💬 if thread exists)
- [x] Auto-scroll thread to bottom on open and on new message
- [ ] Auto-start microphone when modal opens (optional)

## 🎤 Voice & Modal Polish
- [ ] Add subtle fade/slide animation to ClarifyModal
- [ ] Improve message bubble styling and spacing

## 🧩 Guided Setup – Refine Loop to 10/10
- [ ] Update `finalRefine()` system prompt and output contract so it always returns at least one field-targeted followup when score < 10
- [ ] Wire followup handling through `runRefinePhase()` and `parseFollowup()`
- [ ] Implement refine loop until score >= 10 or max passes reached
- [ ] Ensure followups update `state.fields` + `onboarding_summary`
- [ ] Log final quality score + refine pass count in agent record; optionally show in UI

## 🧩 Guided Setup Alignments
- [ ] Align `/api/guided-setup/clarify` logic with Edit Agent Clarify flow
- [ ] Ensure both flows share the same field definitions and tone/goals

## 🧬 LLM Training UX & Data Integrity
- [x] Add “Processing…” state for Save & Next/Finish
- [x] Add dedupe guard: don’t ask the exact same question twice in a row
- [ ] Canonicalize fine-tune preview topics (group variants using normalizeTopic)
- [ ] Ensure Improve Quality Q&A answers are logged as evidence in fine_tune_examples with a consistent source/tag

## 🧠 Prompt Engineer: Use All Evidence
- [x] recalculate-quality uses evidence pack from fine_tune_examples
- [ ] Enhance evidence pack to include key RAG/crawl summaries (and later product catalog)
- [ ] Improve rewrite quality (less “short/childlike”): add minimum depth rules for company/mission/topics/guardrails and “FAQ examples” section

## 🛒 Product Catalog (First-class, not guesswork)
- [ ] Create `agent_products` (agent_id, name, category, url, active, last_seen_at, source)
- [ ] Crawl store → populate agent_products
- [ ] Inject product catalog into Prompt Engineer evidence pack
- [ ] Render products in UI (clickable/editable) and generate product_list

## ⚙️ Workflow / Backend Roadmap
- [ ] Finalize `/api/workflows` CRUD
- [ ] Add Activepieces integration testing
- [ ] Build workflow visualization payload for UI

## 🧑‍💻 Platform Stability & PM Hygiene
- [ ] Fix dev determinism (remove duplicate lockfile warning / set turbopack.root / disable Turbopack fallback doc)
- [ ] Keep CURRENT_STATE.md updated before rolling agent versions

## ▶️ Next Logical Steps (Post-Stabilization)
- [ ] Canonicalize Fine-Tune Preview using same normalizeTopic logic as orchestrator
- [ ] Centralize shared helpers (normalizeTopic, evidence builder) into `/web/src/lib/`
- [ ] Prepare Project Manager Agent v5 activation