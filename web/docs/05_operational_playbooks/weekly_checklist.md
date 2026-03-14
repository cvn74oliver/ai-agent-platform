# 📅 Weekly Checklist – AI Agent Platform

📌 Weekly Source of Truth
Before starting weekly review or planning, read:
`web/docs/CURRENT_STATE.md`

This file confirms:
• What is working right now
• Known issues and recent fixes
• The Golden Path verification
• Immediate next priorities

## Friday Morning
1. Run local dev: `npm run dev`
2. Visit `http://localhost:3000` → verify all key pages load.
3. Run the Golden Path test (from CURRENT_STATE.md):
   • Open an existing agent
   • Next training suggestion → Save & Next
   • Save & Finish → confirm rewrite + quality update

   🚨 If this fails, stop weekly planning and fix regressions first.
4. Open Project Manager Agent:
   > “Summarize overall progress this week and list unresolved items by role.”

## Friday Afternoon
1. Each agent runs `/summarize_session` → paste summaries to their files.
2. Run `./automation/update_memory.sh`
3. Run `./automation/sync_docs_to_github.sh`
4. Review `CHANGELOG.md` → ensure weekly highlights are written.
5. Context & agent version check:
   • If this week involved long chats, heavy debugging, or many file pastes, decide whether to roll to the next agent version.
   • If rolling, ensure CURRENT_STATE.md, TODO.md, and CHANGELOG.md are updated first.
6. Check GitHub repo to confirm latest docs are visible.
7. Optional: record a 2-min Loom video summary for the week.

## Sunday (Optional)
- Skim `CURRENT_STATE.md` and `00_MASTER_PROJECT.md` → confirm next-week priorities and system stability notes are aligned.

## Weekly Stability & Architecture Review

1. Review RAG behavior:
   - Confirm delta sync does not unnecessarily re-scrape non-wildcard URLs.
   - Confirm full resync properly rebuilds ingestion set.
   - Confirm jobs continue server-side even if user leaves page.

2. Review Playground + RAG retrieval:
   - Ask at least one URL-based question.
   - Confirm retrieved links come from actual RAG context.
   - Confirm no hallucinated URLs appear.

3. Review analytics logging:
   - Confirm new playground sessions create:
     • agent_sessions rows
     • agent_events rows
   - Confirm dashboard metrics reflect recent activity.

4. Review UI indicators:
   - Confirm RAG job status, processed count, and timestamps display correctly.
   - Confirm no repeated polling errors in terminal.