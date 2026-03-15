# Codex Debug Playbook

## Purpose

This playbook defines the standard debugging process Codex must follow when investigating build failures, runtime regressions, deployment mismatches, performance issues, or Gmail Workspace defects inside the AI Agent Platform.

The goal is to make debugging:

- structured
- repeatable
- minimally invasive
- well documented

Codex must use this playbook whenever fixing bugs or production issues.

---

# Debugging Philosophy

Codex must debug using the following principles:

## 1. Fix the smallest real cause
Do not rewrite architecture to solve a narrow bug.

Always identify:

- the failing surface
- the actual root cause
- the smallest safe fix

## 2. Separate symptom from cause
Many issues present as UI errors, but originate in:

- missing env vars
- auth/session drift
- missing committed files
- stale imports
- slow loaders
- incorrect runtime assumptions

Codex must trace errors to the **lowest responsible layer**.

## 3. Validate after every fix
A bug is not fixed until validation proves it.

Required validation after debugging:

- lint or targeted lint
- typecheck or targeted typecheck
- build
- runtime/path validation where possible

## 4. Report uncertainty honestly
If Codex cannot confirm something because of environment limits, it must say so clearly.

---

# Standard Debug Order

Whenever Codex debugs an issue, it must follow this sequence.

## Step 1 — Identify the exact failing surface
Determine whether the problem is:

- build-time
- runtime API
- route rendering
- auth/session
- data contract
- performance
- deployment mismatch

Codex must name the exact failing route, file, or command first.

Example:

- `/api/agents/playground` returning 500
- `/operations/intelligence` slow load
- Vercel build fails with module-not-found

---

## Step 2 — Reproduce the issue as narrowly as possible
Codex must avoid broad guessing.

Examples:

- run the exact build command that fails
- inspect the exact API route producing 500
- inspect the exact import path named in the build log
- inspect the exact loader used by the page

If the issue is production-only, Codex should compare:

- localhost behavior
- deploy tree behavior
- environment assumptions

---

## Step 3 — Check the highest-probability root causes first

### A. Missing committed files
Check whether imports point to files that exist locally but are not committed.

### B. Environment variable mismatch
Check whether Vercel/production is missing env vars required locally.

### C. Service-role dependency
Check whether a route unnecessarily depends on admin/service-role keys.

### D. Auth/session mismatch
Check whether request-scoped auth works in production and local.

### E. Build-only network dependency
Check for dependencies on:

- Google Fonts
- remote fetches at build time
- external APIs needed during build

### F. Performance recomputation
Check for pages rerunning expensive mailbox analysis per navigation.

### G. Contract mismatch
Check for frontend expecting fields that backend does not return.

---

# Build Failure Debug Procedure

Use this process for build failures.

## 1. Read the exact build error
Do not summarize loosely.

Extract:

- failing file
- line number
- import path
- route or command

## 2. Check whether the file exists in git-tracked source
A common failure pattern is:

- file exists locally
- file is imported
- file is not committed
- Vercel cannot resolve it

## 3. Apply the smallest safe fix
Examples:

- add missing files
- fix path
- correct casing
- patch a broken page export
- correct a Next page prop type

## 4. Validate with the strongest available build gate
Preferred order:

```bash
npm run build
```

If Turbopack stalls or environment limitations block that path, use:

```bash
npx next build --webpack
```

Codex must state which gate was used.

---

# Runtime 500 Error Debug Procedure

Use this process for API or route 500 errors.

## 1. Identify the exact failing endpoint
Examples:

- `/api/integrations/gmail/mailbox-index`
- `/api/agents/playground`

## 2. Inspect the route handler and its immediate dependencies
Check:

- auth/session retrieval
- Supabase client used
- required request data
- downstream loaders/services

## 3. Check for environment-only dependencies
Routes should prefer request-scoped authenticated clients whenever possible.

If a route is using `getSupabaseAdmin()` or equivalent admin-only helpers, check whether this is actually necessary.

## 4. Check for null-data assumptions
Production often has:

- incomplete profiles
- missing Gmail connection state
- partial mailbox index data
- missing tenant associations

Codex must patch routes to fail gracefully where possible rather than throwing hard 500s.

---

# Performance Debug Procedure

Use this process when pages are slow.

## Common performance smells

- full mailbox analysis on every page visit
- cluster regeneration on every navigation
- sender workspace rebuilding instead of reading cache
- loading too many senders at once
- preview data fetched eagerly for all rows

## Required investigation order

1. Identify the loader/API responsible
2. Measure what recomputes on navigation
3. Check cache layer existence
4. Check pagination/lazy loading strategy
5. Check whether page waits for non-critical data before rendering

## Performance fixes Codex should prefer

- cache intelligence results
- cache cluster results
- page sender rows in batches
- lazy-load evidence drawers
- compute heavy analytics once per session

Codex must not “solve” performance by removing UX features unless explicitly instructed.

---

# Vercel vs Localhost Debug Procedure

When production and localhost differ, Codex must check this order:

## 1. Environment variables
Compare required production env expectations.

## 2. Missing committed files
Confirm deploy tree includes every imported module.

## 3. OAuth redirect configuration
Check callback URLs for Gmail/Supabase auth.

## 4. Build-time network restrictions
Check whether local or sandbox build depends on remote assets.

## 5. Service role or admin client usage
Check whether production routes rely on secrets absent in production.

## 6. Root-route redirect behavior
Check whether auth lands users on the correct page after login.

---

# Gmail Workspace Specific Debug Rules

When debugging Gmail Workspace:

## 1. Preserve sender-first architecture
Never “fix” issues by reverting to message-first logic.

## 2. Preserve analytics requirements
Do not remove charts, filters, or sender insights unless explicitly instructed.

## 3. Preserve decision memory
Ensure sender decisions continue writing to:

- `agent_events`
- `rag_documents`

## 4. Protect archive execution logic
Archive must remain:

- exact
- confirmation-backed
- chunked for Gmail batch limits

---

# Validation Rules After a Debug Fix

After any fix, Codex must report:

## Targeted validation
Examples:

```bash
npx eslint <target files>
npx tsc --noEmit
npm run build
```

## Runtime validation
Examples:

- route returns 200 instead of 500
- page now loads in production
- confirmation totals update correctly

If runtime validation could not be performed, Codex must state that clearly.

---

# PM Review Packet Requirement

Every debug session must end with a PM Review Packet using:

`CODEX_PM_REVIEW_PACKET_SPEC.md`

The packet must include:

- root cause
- files changed
- validation performed
- remaining risks
- deployment readiness

---

# 3-Prompt Codex Control Loop

This is the reliability pattern that makes Codex dramatically more dependable on large projects.

## Prompt 1 — Plan Only
Ask Codex to:

- read the docs
- identify the active phase
- produce an implementation or debug plan only
- list files likely to change
- stop before editing

Purpose:

Prevent uncontrolled first-pass coding.

## Prompt 2 — Implement Only
After reviewing the plan, instruct Codex to:

- implement only the approved scope
- follow the safeguards and guardrails
- validate
- generate the PM Review Packet

Purpose:

Force disciplined execution.

## Prompt 3 — Review / Repair Only
After testing, send Codex only:

- the defects found
- screenshots/logs/terminal output
- the current phase context

Then tell Codex to:

- fix only the reviewed defects
- not widen scope
- revalidate
- produce a fresh PM Review Packet

Purpose:

Turn big rebuilds into controlled feedback loops rather than giant rewrites.

This loop is the main reason Codex becomes 10–20x more reliable on complex rebuilds.

---

# Summary

This playbook makes Codex debug like a disciplined engineer rather than a free-form assistant.

It ensures debugging stays:

- focused
- evidence-based
- minimally invasive
- validated
- well reported

All major bug-fix or stabilization work in the AI Agent Platform should follow this playbook.
