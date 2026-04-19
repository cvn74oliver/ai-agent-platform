# Simple Worktrees Setup Checklist

Use this checklist whenever you want to start a new isolated Codex thread in its own worktree, and whenever you want to close that worktree out cleanly afterward.

---

## Part 1 — Start a New Worktree

### A. Save and clean the main repo first

1. Open Terminal.
2. Go to the main repo:

   ```bash
   cd /Users/olivercarlin/Dev/ai-agent-platform
   ```

3. Check your branch:

   ```bash
   git branch --show-current
   ```

4. Check whether the repo is clean:

   ```bash
   git status
   ```

5. If you have changes you want to keep, save them first:

   ```bash
   git add .
   git commit -m "Checkpoint before new worktree"
   git push origin main
   ```

6. Optional safety tag:

   ```bash
   git tag pre-worktree-checkpoint
   git push origin pre-worktree-checkpoint
   ```

7. Confirm you are clean before creating the worktree:

   ```bash
   git status
   ```

   You want to see:

   ```bash
   nothing to commit, working tree clean
   ```

---

### B. Create the worktree in Terminal

1. From the main repo, create the new worktree and branch:

   ```bash
   git worktree add -b cleanup-taxonomy-rebuild ../ai-agent-platform-cleanup-taxonomy-rebuild
   ```

2. Move into the new worktree:

   ```bash
   cd ../ai-agent-platform-cleanup-taxonomy-rebuild
   ```

3. Confirm the new branch:

   ```bash
   git branch --show-current
   ```

4. Confirm the new worktree is clean:

   ```bash
   git status
   ```

---

### C. Copy local env/config files if needed

Worktrees do **not** automatically copy ignored local files like `.env.local`.

1. Copy the web env file:

   ```bash
   cp /Users/olivercarlin/Dev/ai-agent-platform/web/.env.local /Users/olivercarlin/Dev/ai-agent-platform-cleanup-taxonomy-rebuild/web/.env.local
   ```

2. Confirm it exists:

   ```bash
   ls -la /Users/olivercarlin/Dev/ai-agent-platform-cleanup-taxonomy-rebuild/web/.env.local
   ```

3. If your project uses any other ignored local config files, copy those too.

---

### D. Open the worktree in VS Code

1. Open a **new VS Code window**.
2. Open this folder only:

   ```
   /Users/olivercarlin/Dev/ai-agent-platform-cleanup-taxonomy-rebuild
   ```

3. Keep your main repo in a separate VS Code window.
4. Do **not** load both folders into the same VS Code workspace.

---

### E. Add the worktree to Codex correctly

1. In Codex, click **Add new project**.
2. Select the worktree folder:

   ```
   /Users/olivercarlin/Dev/ai-agent-platform-cleanup-taxonomy-rebuild
   ```

3. Give it a clear name, for example:

   ```
   ai-agent-platform-cleanup-taxonomy
   ```

4. Make sure Codex is pointing to the new worktree project, **not** the main repo.

### Important

- Do **not** click **Create worktree and save as a project** if you already created the worktree in Terminal.
- We are using **Git-created worktrees** and then telling Codex to use that folder.
- Codex project setup is just pointing AI to the correct directory.

---

### F. Start the new thread

1. Open a new Codex thread.
2. Make sure you are inside the correct worktree-backed project.
3. Set the thread to the correct mode (usually **Plan** first).
4. Paste the activation message.

---

### G. Run the dev server in the worktree

1. Navigate to the web directory inside the worktree:

   ```bash
   cd /Users/olivercarlin/Dev/ai-agent-platform-cleanup-taxonomy-rebuild/web
   ```

2. Install dependencies (first time only):

   ```bash
   npm install
   ```

   or (preferred if it works):

   ```bash
   npm ci
   ```

3. Run the dev server on a different port (important if main repo is running):

   ```bash
   PORT=3001 npm run dev
   ```

4. Open in browser:

   ```
   http://localhost:3001
   ```

Notes:
- Main repo typically runs on `localhost:3000`
- Each worktree must use a different port (3001, 3002, etc.)

---

### H. Fix login / magic link redirect (Supabase)

If login redirects to the wrong URL (for example production instead of localhost), do this:

1. Go to your Supabase project dashboard
2. Navigate to:
   Authentication → URL Configuration

3. In "Redirect URLs" (or "Additional Redirect URLs"), add all local ports you plan to use:

   ```
   http://localhost:3000
   http://localhost:3000/**
   http://localhost:3001
   http://localhost:3001/**
   ```

4. Save changes

5. Restart your local dev server if needed

6. Generate a NEW magic link (old ones will still use the wrong redirect)

Notes:
- Each worktree runs on a different port, so each port must be whitelisted in Supabase
- This is usually the only step needed to fix login issues across worktrees

---

## Part 2 — Close Out a Worktree

### A. Finish the thread work inside the worktree

1. In the worktree repo, check status:

   ```bash
   cd /Users/olivercarlin/Dev/ai-agent-platform-cleanup-taxonomy-rebuild
   git status
   ```

2. Stage changes:

   ```bash
   git add .
   ```

3. Commit them:

   ```bash
   git commit -m "Complete cleanup taxonomy rebuild work"
   ```

4. Push the worktree branch:

   ```bash
   git push origin cleanup-taxonomy-rebuild
   ```

---

### B. Merge the worktree back into main locally

1. Go back to the main repo:

   ```bash
   cd /Users/olivercarlin/Dev/ai-agent-platform
   ```

2. Make sure main is up to date:

   ```bash
   git checkout main
   git pull origin main
   ```

3. Merge the worktree branch into main:

   ```bash
   git merge cleanup-taxonomy-rebuild
   ```

4. Push main to GitHub:

   ```bash
   git push origin main
   ```

---

### C. Retest from the main repo

After merging, run your normal checks from the **main repo**, not the worktree.

Examples:

```bash
cd /Users/olivercarlin/Dev/ai-agent-platform
```

Then run whatever applies for that project, such as:

```bash
npm run dev
npm run lint
npm run build
```

Use the actual commands that make sense for the slice you just merged.

---

### D. Remove the worktree after merge

Only do this after:
- the merge is complete
- main is pushed
- testing looks good
- you are sure you do not need the worktree anymore

1. Remove the worktree folder from Git:

   ```bash
   git worktree remove /Users/olivercarlin/Dev/ai-agent-platform-cleanup-taxonomy-rebuild
   ```

2. Delete the branch locally:

   ```bash
   git branch -d cleanup-taxonomy-rebuild
   ```

3. Optional: delete the remote branch too:

   ```bash
   git push origin --delete cleanup-taxonomy-rebuild
   ```

---

## Part 3 — Syncing Changes Between Main and Worktrees

### A. Run merge preflight first

Before any sync, classify the change.

1. Check the merge base and what changed on both sides:

   ```bash
   git fetch origin
   git merge-base origin/main HEAD
   git diff --name-only "$(git merge-base origin/main HEAD)" origin/main
   git diff --name-only "$(git merge-base origin/main HEAD)" HEAD
   ```

2. Compare the two changed-file lists and identify:
   - overlap
   - overlapping shared hot files
   - whether the task is only docs / control-plane propagation

3. Treat these as shared hot files right now:
   - `web/src/app/agents/[id]/operations/review/page.tsx`
   - `web/src/lib/integrations/gmail/gmailCleanupWorkspace.ts`
   - `web/src/lib/integrations/gmail/inboxAnalysis.ts`

4. Classify the sync:
   - `docs_only_sync`
   - `standard_merge_allowed`
   - `hot_file_integration_required`
   - `stop_and_rescope`

If classification = `hot_file_integration_required`, do **not** use the default full-merge flow below.
Full git merge is prohibited.

---

### B. Docs-only sync from worktree -> main

Use this when the worktree needs to propagate only docs / control-plane files into `main`.

1. In the worktree, commit and push the docs changes:

   ```bash
   cd /Users/olivercarlin/Dev/ai-agent-platform-cleanup-taxonomy-rebuild
   git add ai-agent-platform-docs AGENTS.md
   git commit -m "Docs-only sync from worktree"
   git push origin cleanup-taxonomy-rebuild
   ```

2. In the main repo, pull only the approved docs paths:

   ```bash
   cd /Users/olivercarlin/Dev/ai-agent-platform
   git checkout main
   git pull origin main
   git checkout cleanup-taxonomy-rebuild -- ai-agent-platform-docs AGENTS.md
   git status
   git commit -m "Sync docs from cleanup-taxonomy-rebuild"
   git push origin main
   ```

Review the diff before committing if the docs set is narrower than `ai-agent-platform-docs` plus `AGENTS.md`.

---

### C. Docs-only sync from main -> worktree

Use this when the worktree needs the latest control-plane or operating docs from `main`.

1. In the worktree:

   ```bash
   cd /Users/olivercarlin/Dev/ai-agent-platform-cleanup-taxonomy-rebuild
   git fetch origin
   git checkout origin/main -- ai-agent-platform-docs AGENTS.md
   git status
   git commit -m "Sync docs from main"
   git push origin cleanup-taxonomy-rebuild
   ```

2. If the required docs set is smaller, check out only the approved paths.

---

### D. Shared hot-file overlap -> dedicated Codex-assisted integration

If merge preflight shows shared hot-file overlap:

1. Stop the default merge flow.
2. Do not run a full git merge.
3. Prepare the integration packet required by `07_reference/Shared_Hot_File_Merge_Protocol.md`.
4. Apply the default merge bias rules unless PM explicitly overrides them:
   - UI files prefer `main`
   - Runtime logic prefers the active worktree lane
   - Imports union unless the conflict is semantic
   - Types/interfaces prefer the superset, not reduction
5. If docs still need to move, complete that part as a docs-only sync.
6. Run a dedicated Codex-assisted hot-file integration pass for the shared code files.
7. If Codex fails the same integration twice, stop and return to PM.
8. Do not ask Oliver to manually reconcile the shared files.

---

### E. Conflict recovery after an unsafe full merge

Use this when a full merge already started but the conflict set proves it was the wrong path.

1. Preserve any resolved docs you still need.
2. Abort the full merge:

   ```bash
   git merge --abort
   ```

3. Restore only the approved docs paths from the source branch.
4. Review the docs-only diff.
5. Commit and push the docs-only sync.
6. Handle shared hot-file integration separately afterward.

`ACE-011` is the completed historical example of this recovery path.

---

### Important Sync Rules

- Changes do NOT automatically sync between main and worktrees
- Always run merge preflight before syncing
- Docs-only sync and shared hot-file integration are separate operations
- Shared hot-file preflight must use merge-base, two-sided overlap detection
- If classification = `hot_file_integration_required`, full git merge is prohibited
- Backend data (database, artifacts) may be shared, but code is NOT
- Do not use Oliver as the default manual resolver for shared hot-file conflicts
- Always test after syncing changes

---
