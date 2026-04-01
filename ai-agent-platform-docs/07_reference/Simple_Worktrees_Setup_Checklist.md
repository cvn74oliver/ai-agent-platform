# Simple Worktrees Setup Checklist

Use this checklist whenever you want to start a new isolated Codex thread in its own worktree, and whenever you want to close that worktree out cleanly afterward.

---

## Part 1 — Start a New Worktree

### A. Save and clean the main repo first

1. Open Terminal.
2. Go to the main repo:

   ```bash
   cd /Users/olivercarlin/Documents/ai-agent-platform
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
   cp /Users/olivercarlin/Documents/ai-agent-platform/web/.env.local /Users/olivercarlin/Documents/ai-agent-platform-cleanup-taxonomy-rebuild/web/.env.local
   ```

2. Confirm it exists:

   ```bash
   ls -la /Users/olivercarlin/Documents/ai-agent-platform-cleanup-taxonomy-rebuild/web/.env.local
   ```

3. If your project uses any other ignored local config files, copy those too.

---

### D. Open the worktree in VS Code

1. Open a **new VS Code window**.
2. Open this folder only:

   ```
   /Users/olivercarlin/Documents/ai-agent-platform-cleanup-taxonomy-rebuild
   ```

3. Keep your main repo in a separate VS Code window.
4. Do **not** load both folders into the same VS Code workspace.

---

### E. Add the worktree to Codex correctly

1. In Codex, click **Add new project**.
2. Select the worktree folder:

   ```
   /Users/olivercarlin/Documents/ai-agent-platform-cleanup-taxonomy-rebuild
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
   cd /Users/olivercarlin/Documents/ai-agent-platform-cleanup-taxonomy-rebuild/web
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
   cd /Users/olivercarlin/Documents/ai-agent-platform-cleanup-taxonomy-rebuild
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
   cd /Users/olivercarlin/Documents/ai-agent-platform
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
cd /Users/olivercarlin/Documents/ai-agent-platform
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
   git worktree remove /Users/olivercarlin/Documents/ai-agent-platform-cleanup-taxonomy-rebuild
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

### A. Push changes from worktree → main

Use this when you finish work in a worktree and want it in main.

1. In the worktree:

   ```bash
   cd /Users/olivercarlin/Documents/ai-agent-platform-cleanup-taxonomy-rebuild
   git add .
   git commit -m "Worktree changes"
   git push origin cleanup-taxonomy-rebuild
   ```

2. In the main repo:

   ```bash
   cd /Users/olivercarlin/Documents/ai-agent-platform
   git checkout main
   git pull origin main
   git merge cleanup-taxonomy-rebuild
   git push origin main
   ```

---

### B. Pull changes from main → worktree

Use this when main has new changes and your worktree needs them.

1. In the worktree:

   ```bash
   cd /Users/olivercarlin/Documents/ai-agent-platform-cleanup-taxonomy-rebuild
   git fetch origin
   git merge origin/main
   ```

Alternative (cleaner history):

```bash
git fetch origin
git rebase origin/main
```

---

### Important Sync Rules

- Changes do NOT automatically sync between main and worktrees
- You must manually merge or rebase
- Backend data (database, artifacts) may be shared, but code is NOT
- Always test after syncing changes

---