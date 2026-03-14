# 🗓️ Monthly Checklist – AI Agent Platform

📌 Monthly Source of Truth  
Before performing monthly maintenance, review:  
`web/docs/CURRENT_STATE.md`  

This ensures all monthly actions are taken against the known‑good system state.

## First Monday of the Month
1. Backup your local project folder (copy `/ai-agent-platform` to external drive or cloud).
2. Run `./automation/update_memory.sh`
3. Run `./automation/sync_docs_to_github.sh`
4. Verify GitHub repo has all docs up to date.
5. Run the Golden Path test (from CURRENT_STATE.md):  
   • Open an existing agent  
   • Next training suggestion → Save & Next  
   • Save & Finish → confirm rewrite + quality update  

   🚨 If this fails, pause monthly maintenance and fix regressions first.

---
### RAG System Validation (Post‑Phase 3 Requirement)
- Trigger **Sync New/Changed** on a test agent.
- Confirm:
  • A `rag_jobs` row is created.
  • Status transitions from `pending` → `completed`.
  • `rag_documents` count increases only when new URLs exist.
- Trigger **Force Full Resync** and verify:
  • Wildcard domains enqueue correctly.
  • Processed count increases.
- Confirm the RAG status panel shows:
  • Job ID  
  • Status  
  • Processed count  
  • Last update timestamp  
- Verify that RAG retrieval returns a real URL inside Playground (no fabricated links).

🚨 If delta mode re-scrapes everything unexpectedly, inspect wildcard behavior before proceeding.

## Security & Maintenance
- Rotate API keys in `.env.local` (OpenAI, Supabase, Activepieces, etc.).
- Review Supabase RLS policies and ensure no public data leaks.
- Check dependency updates:
  ```bash
  npm outdated
  npm update
  ```
- Review long‑running agent sessions and formally close/roll versions when:
  • Context exceeds recommended token window  
  • Agent behavior begins hallucinating or drifting  
  • Major architectural shifts occur (RAG, analytics, scoring changes)  
  Log version rollover in CHANGELOG.md and append summary to PROJECT_MANAGER_CONTEXT.md.
- After dependency updates, rerun the Golden Path test to ensure no regressions were introduced.

---
## RAG & Retrieval System Audit

- Review `rag_jobs` table for:
  • Stuck jobs (`pending` > 24h)
  • Failed jobs with error messages
  • Duplicate full resync jobs triggered unintentionally
- Confirm delta mode is not re-seeding unchanged exact URLs.
- Confirm wildcard (`/*`) domains are behaving as expected.
- Verify at least one Playground query returns a real URL from RAG context.
- Spot-check 3 recent RAG chunks to ensure:
  • Content is clean (no HTML garbage)
  • Embeddings exist
  • Source URLs are correct

---
## Architecture Review (Quarterly Check-in Within Monthly Cycle)

- Confirm Golden Path still reflects CURRENT_STATE.md.
- Review `PROJECT_MANAGER_CONTEXT.md` for clarity and drift.
- Confirm CHANGELOG.md entries align with actual system behavior.
- Validate no deprecated routes or unused API endpoints remain.
- Ensure no manual buttons exist that should now be automated.

---
## Future Roadmap (Living Review Section)

Review and reprioritize:
- Background RAG worker automation
- RAG TTL-based re-crawl strategy
- Session auto-naming improvements
- Dashboard health indicators
- RLS performance optimizations

NOTE: This section is for roadmap alignment only. Do NOT log history here — use CHANGELOG.md for completed work.