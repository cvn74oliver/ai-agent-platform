# 🗓️ Monthly Checklist – AI Agent Platform

## First Monday of the Month
1. Backup your local project folder (copy `/ai-agent-platform` to external drive or cloud).
2. Run `./automation/update_memory.sh`
3. Run `./automation/sync_docs_to_github.sh`
4. Verify GitHub repo has all docs up to date.

## Security & Maintenance
- Rotate API keys in `.env.local` (OpenAI, Supabase, Activepieces, etc.).
- Review Supabase RLS policies and ensure no public data leaks.
- Check dependency updates:
  ```bash
  npm outdated
  npm update