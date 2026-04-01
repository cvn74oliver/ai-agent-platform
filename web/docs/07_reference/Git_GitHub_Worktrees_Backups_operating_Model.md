

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

When doing a manual backup:

1. Close running dev servers
2. Copy:
   - main repo folder
   - all worktree folders
3. Store backup externally (drive, cloud, etc.)

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
3. merge into main
4. test main environment
5. then remove worktree

---

## Key Principles

- GitHub is NOT your full backup
- Local backups are still required
- Worktrees isolate changes, not replace Git
- Merging happens through Git, not folders
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