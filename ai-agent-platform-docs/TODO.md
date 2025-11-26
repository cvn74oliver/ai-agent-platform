# TODO — Active Tasks (as of November 25, 2025)

## 🧠 Clarify UX Enhancements (Edit Agent)
- [x] Add per-field clarify badge (💬 if thread exists)
- [x] Auto-scroll thread to bottom on open and on new message
- [ ] Auto-start microphone when modal opens (optional)

## 🎤 Voice & Modal Polish
- [ ] Add subtle fade/slide animation to ClarifyModal
- [ ] Improve message bubble styling and spacing

## 🧩 Guided Setup – Refine Loop to 10/10
- [ ] Update `finalRefine()` system prompt and output contract so it **always** returns at least one field-targeted followup when `score < 10`.
- [ ] Wire followup handling through `runRefinePhase()` and `parseFollowup()` so followup questions are asked via the guided setup UI (one at a time).
- [ ] Implement a refine loop that:
  - Re-runs `finalRefine()` after each followup answer,
  - Continues until `score >= 10` **or** a max number of passes / followups is reached.
- [ ] Ensure refine followups update `state.fields` and `onboarding_summary` before final agent creation.
- [ ] Log the final quality score and number of refine passes in the agent record, and optionally display it on the Agent Summary page.

## 🧩 Guided Setup Alignments
- [ ] Revisit `/api/guided-setup/clarify` and the ClarifyEngine to ensure prompt logic is aligned between Guided Setup and Edit Agent Clarify flows.
- [ ] Make sure both flows use the same field definitions and tone/goals for agent design.

## ⚙️ Workflow / Backend Roadmap
- [ ] Finalize `/api/workflows` CRUD
- [ ] Add Activepieces integration testing
- [ ] Build workflow visualization payload for UI

## 🧑‍💻 Platform Stability
- [ ] Keep older daily logs and PM summaries moved into archive files instead of cluttering TODO.md.
- [ ] Ensure CHANGELOG.md reflects major guided-setup and clarify milestones through November 25, 2025.
- [ ] Begin planning Phase 3: Agent Analytics + Dashboard (e.g., quality scores, usage metrics, refine-pass stats).