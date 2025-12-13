# CURRENT_STATE — AI Agent Platform

Last updated: 2025-12-13  
Project Manager: v4

## What is working

### LLM Training (Agent Summary → Training Readiness)
- Next training suggestion returns high-quality questions (dynamic LLM wording).
- Save & Next: logs example + moves to next question with visible Processing state.
- Save & Finish: triggers Prompt Engineer sync + re-score with visible “Updating…” banner.
- Close/Esc in LLM mode prompts to Save & Finish if draft exists.
- If user clicks Save & Finish with empty answer AFTER saving >=1 example in session, rewrite still runs.

### Prompt Engineer (Prompt/RAG quality)
- recalculate-quality:
  - uses evidence pack from fine_tune_examples (recent examples)
  - merges rewritten fields onto existing onboarding_summary (preserves dynamic fields)
  - stores finalRefine score/comment
- improve-quality:
  - evaluator uses recent fine_tune_examples evidence for better followups

### Orchestrator
- Canonical topic normalization + question bank exist
- Avoids repeating last question verbatim
- Avoids repeating last topic when close in score
- Dynamic question generation via LLM (topic/dimension + evidence)

## Known pain points / pending
- Fine-tune preview shows many raw topic variants (needs canonical grouping).
- Product list not yet sourced from a product catalog crawler (needs agent_products table + crawl ingestion).
- Dev environment: multiple lockfiles warning; Turbopack panic has occurred (“Item already exists”).

## Golden path test (5 minutes)
1) Open an existing agent summary.
2) Click “Next training suggestion”.
3) Answer one → Save & Next → confirm new question appears.
4) Save & Finish → confirm rewrite runs + quality updates.
5) Preview fine-tune data → confirm counts increment.

## Agent version & context window guidance
Roll to next agent version when:
- chat is long and code-heavy (many file pastes/debug loops),
- drift symptoms appear,
- or after a clean milestone (golden path passes).
Ask: “Ballpark how close are we to token/context limit?”

## PM handoff note
Any new PM should read CURRENT_STATE.md first, then TODO.md and CHANGELOG.md, then run the golden path.