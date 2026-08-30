

# Git + GitHub + Worktrees + Backups Operating Model

## Purpose
This document defines a simple, safe, and scalable way to:
- work in parallel using Codex threads
- protect against data loss
- keep the system stable while moving fast

This is the official operating model for:
- local development
- Git usage
- GitHub usage
- worktrees
- backups

---

## Core Concepts

### 1. Local Repository (Your Computer)
This is your **working environment**:
- where code is edited
- where Codex operates
- where servers run (`npm run dev`)

Example:
```
/ai-agent-platform
```

---

### 2. Git (Local Version Control)
Git manages:
- branches
- commits
- merges
- worktrees

Git runs locally in your terminal.

---

### 3. GitHub (Remote Repository)
GitHub is:
- a **remote backup of committed code**
- a **history of changes**
- the **source Vercel deploys from**

Important:
- GitHub only contains **committed + pushed files**
- it does NOT include:
  - node_modules
  - .next
  - local caches
  - uncommitted work

---

### 4. Vercel (Production)
Vercel:
- pulls code from GitHub
- builds it
- deploys it

Flow:
```
Local → Git → GitHub → Vercel
```

---

## Worktrees (Parallel Development)

### What a Worktree Is
A worktree is:
- a separate local folder
- connected to the same Git repository
- on a different branch

Example structure:
```
/ai-agent-platform                  (main)
/ai-agent-platform-rail             (rail work)
/ai-agent-platform-cleanup          (cleanup work)
```

Each folder:
- contains the full project
- runs independently
- is isolated from other worktrees

---

### Why Use Worktrees
They allow:
- multiple Codex threads to run safely
- isolation of risky changes
- easier debugging
- parallel development without overwriting each other

---

### Creating Worktrees (Concept)
You do NOT copy folders manually.

Git creates them:

Example:
```
git worktree add ../ai-agent-platform-rail rail-phase-2
git worktree add ../ai-agent-platform-cleanup cleanup-phase-a
```

---

### Running Worktrees
Each worktree runs separately:

```
cd ai-agent-platform-rail
npm run dev
```

```
cd ai-agent-platform-cleanup
npm run dev -- --port 3001
```

---

### Merging Work Back
Worktrees merge through Git:

1. commit changes in worktree
2. push branch
3. merge into main
4. test main
5. deploy

### Two Sync Classes (ACE-009 / ACE-010)

Not every worktree sync should use the same merge path.

We now treat sync as two separate classes:
- `docs / control-plane sync`
- `shared hot-file code integration`

Docs / control-plane sync includes:
- `ai-agent-platform-docs/`
- `AGENTS.md`
- other approved operating-model or proof files for the current pass

Shared hot files currently include:
- `web/src/app/agents/[id]/operations/review/page.tsx`
- `web/src/lib/integrations/gmail/gmailCleanupWorkspace.ts`
- `web/src/lib/integrations/gmail/inboxAnalysis.ts`

Authoritative detailed workflow:
- `07_reference/Shared_Hot_File_Merge_Protocol.md`

Rule:
- do not use the default full-merge path when the immediate goal is only control-plane or documentation alignment
- do not force shared hot-file integration just to complete a docs sync

### Docs-Only Sync Procedure

Use this when the change is documentation / control-plane propagation only.

1. Fetch the latest branches.
2. Review the diff and confirm the sync scope is limited to approved docs / operating files.
3. Copy only the approved docs paths from the source branch into the target branch.
4. Review the docs-only diff.
5. Commit and push the docs-only sync.

This procedure is valid in both directions:
- `worktree -> main`
- `main -> worktree`

### Shared Hot-File Preflight

Before any attempted full merge between `main` and a worktree:

1. compare both sides from the merge base
2. check whether overlap touches any shared hot file
3. classify the merge:
   - safe for docs-only sync
   - unsafe for full merge
   - requires dedicated hot-file integration

If shared hot files overlap:
- stop treating the task as a normal merge
- full git merge is prohibited
- route it to a dedicated Codex-assisted hot-file integration pass

### Conflict Recovery For Unsafe Full Merges

If a full merge has already started and the conflict set includes shared hot files while you are trying to align control-plane docs:

1. preserve any resolved docs needed for the docs-only sync
2. abort the unsafe full merge
3. restore the approved docs paths only
4. complete and commit the docs-only sync
5. run shared hot-file integration as a separate Codex-assisted pass later

`ACE-011` is the historical example of this recovery path. It is completed context, not open work.

---

## Backup Strategy

We use a **2-layer backup system**

---

### Layer 1 — GitHub Backup
Protects:
- committed code
- version history
- branches

Limitations:
- does NOT include uncommitted work
- does NOT include local environment
- does NOT include ignored files

---

### Layer 2 — Local Full Backup
Protects:
- everything on your machine
- uncommitted work
- local configs
- environment state

---

## How to Backup with Worktrees

### Correct Backup Method

When using worktrees, you should copy:

```
/ai-agent-platform
/ai-agent-platform-rail
/ai-agent-platform-cleanup
```

NOT just the main folder.

---

### Why This Matters
Each worktree may contain:
- uncommitted work
- different branch states
- in-progress changes

If you only back up the main folder:
- you lose work from other worktrees

---

### Recommended Backup Approach

Use the shared script:

```text
/Users/olivercarlin/Documents/Backups/backup-projects.sh
```

This Automata document is supplemental. The script itself is the authoritative shared operator guide because Curative Mushrooms and Curative Genetics project managers may not have access to Automata's control plane. Run the following to read the operating guidance without starting a backup:

```text
/Users/olivercarlin/Documents/Backups/backup-projects.sh --help
```

The selection screen explicitly includes:
- Automata (`/Users/olivercarlin/Dev/ai-agent-platform`)
- Curative Mushrooms (`/Users/olivercarlin/Documents/ChatGPT/Curative Mushrooms`)
- Curative Genetics (`/Users/olivercarlin/Documents/Curative Genetics`)
- active Git worktrees registered to each primary project
- other top-level `~/Dev` projects and shared Codex skills when present

Cadence:
1. Incremental snapshot after each meaningful milestone.
2. Full archive at end of day or after a significant update.
3. Combined incremental + full `KEEP` set for a major accepted recovery point that should remain long-term.

Retention:
- normal incremental snapshots: seven days
- normal full archives: seven days
- pruning applies only to projects refreshed in the current run
- `KEEP` full archives and their notes are never pruned automatically
- the operator sees and confirms the pruning boundary on each run

Verification and restore:
1. Close running dev servers before a significant backup when practical.
2. Select the primary repository and any worktree that contains unique or in-progress state.
3. Require the generated note and verification result; full archives must pass readability verification and include SHA-256.
4. Restore the primary repository first. A linked worktree `.git` pointer is not independently portable; recreate its recorded branch/worktree, then overlay files from the chosen snapshot if needed.

---

## Operational Rules

### When to Use Worktrees
Use worktrees when:
- running multiple Codex implementation threads
- working on risky changes
- debugging complex issues
- separating UI / backend / architecture work

---

### When NOT to Use Worktrees
Do NOT use worktrees when:
- working on small changes
- doing planning-only threads
- editing docs only

---

### Naming Convention

Use clear names:

```
ai-agent-platform-rail
ai-agent-platform-cleanup
ai-agent-platform-ui
```

Branches should match:

```
rail-phase-2
cleanup-phase-a
ui-polish
```

---

### Merge Discipline

Always:
1. finish worktree changes
2. commit
3. classify the sync first:
   - docs-only sync
   - shared hot-file integration
4. merge only through the correct path
5. test main environment
6. then remove worktree

---

## Key Principles

- GitHub is NOT your full backup
- Local backups are still required
- Worktrees isolate changes, not replace Git
- Merging happens through Git, not folders
- Docs-only sync and shared hot-file integration are different operations
- Always test main after merging
- Never trust uncommitted work as safe

---

## Final Mental Model

- Local = workspace
- Git = version control engine
- GitHub = backup + history + deployment source
- Vercel = production
- Worktrees = parallel workspaces

---

## Bottom Line

For your workflow:

- Keep using manual backups
- Keep pushing to GitHub at important checkpoints
- Add worktrees for parallel threads
- Back up ALL worktree folders, not just main

This gives you:
- speed
- safety
- clarity
- control
