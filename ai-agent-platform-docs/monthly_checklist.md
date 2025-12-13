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

## Security & Maintenance
- Rotate API keys in `.env.local` (OpenAI, Supabase, Activepieces, etc.).
- Review Supabase RLS policies and ensure no public data leaks.
- Check dependency updates:
  ```bash
  npm outdated
  npm update
  ```
- Review long‑running agent sessions and decide whether to formally close and roll to the next agent version (based on context/token guidance in CURRENT_STATE.md).
- After dependency updates, rerun the Golden Path test to ensure no regressions were introduced.