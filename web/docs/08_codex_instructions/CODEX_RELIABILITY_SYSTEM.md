

# Codex Reliability System

## Purpose
This document defines the operating discipline that makes Codex significantly more reliable when executing large architectural rebuilds or multi‑phase platform work. It standardizes how Codex plans work, executes changes, validates results, and reports outcomes so that large tasks do not drift, regress, or silently break unrelated parts of the system.

This system is mandatory for all major implementation phases in the AI Agent Platform.

---

# Core Reliability Principles

## 1. Narrow Execution Surface
Codex must only modify files explicitly listed in the phase plan or prompt packet.

This prevents unintended architectural drift.

Allowed changes:

• Files listed in the phase execution prompt
• Supporting files required for compilation
• Minimal dependency wiring

Disallowed changes:

• Refactoring unrelated code
• Reorganizing folders
• Editing unrelated runtime systems

If additional files appear required, Codex must stop and report them before proceeding.

---

# 2. Phase Isolation
Large rebuilds must be split into isolated phases.

Each phase must focus on a single concern such as:

• architecture scaffolding
• analytics layer
• sender workspace
• performance optimization
• rules automation

A phase should never attempt to finish the entire product.

Goal of each phase:

"Make one part perfect without breaking anything else."

---

# 3. Deterministic Planning
Before writing code, Codex must produce a structured plan including:

• routes affected
• components affected
• API contracts added or changed
• runtime state changes
• data model changes

This prevents implementation drift.

The plan must be approved before implementation begins.

---

# 4. Smallest Safe Patch
When fixing bugs or resolving build failures, Codex must apply the smallest possible change.

Never rewrite architecture to solve a narrow issue.

Example:

Correct:

• add missing module
• fix type signature
• patch route logic

Incorrect:

• rewrite runtime service
• redesign data model

---

# 5. Clean Build Verification
Every implementation phase must end with build verification.

Required validation:

• TypeScript check
• ESLint pass (targeted)
• production build

If a full lint pass fails due to unrelated code, Codex must clearly state that and isolate the scope.

---

# 6. Deploy Tree Validation
Local environments often contain files that are not committed to the repository.

Codex must validate that the deployable git tree includes:

• all imported modules
• runtime helpers
• integration modules

This prevents "module not found" failures during Vercel builds.

---

# 7. Runtime Safety Rules
When modifying API routes or runtime execution paths:

Codex must avoid introducing hard dependencies on:

• service‑role keys
• admin clients
• environment‑specific secrets

Routes should prefer request‑scoped authenticated clients whenever possible.

---

# 8. Environment Awareness
Production failures often occur due to environment differences.

Codex must always check for:

• missing environment variables
• Supabase service role usage
• OAuth redirect mismatches
• build‑time network dependencies

Example:

Google Fonts can break builds in restricted environments.

Use environment‑safe validation when necessary.

---

# 9. Data Safety
Codex must never perform destructive operations without explicit confirmation.

Examples:

• deleting database tables
• truncating data
• bulk archiving Gmail messages

All destructive actions must pass through approval mechanisms.

---

# 10. Documentation Synchronization
After each phase, Codex must update the authoritative documentation:

Required files:

• CHANGELOG.md
• CURRENT_STATE.md
• TODO.md
• system_overview.md

These documents represent the system's source of truth.

---

# Codex Execution Loop

Every implementation cycle follows the same structure.

1. Read architecture documents
2. Generate an execution plan
3. Wait for approval
4. Implement changes
5. Run validation
6. Produce a PM Review Packet

This loop prevents uncontrolled modifications.

---

# PM Review Packet

At the end of every Codex run, the response must include a structured summary called the **PM Review Packet**.

Required sections:

## Root Cause
What problem was identified.

## Files Changed
List of modified files.

## Files Added
List of new files.

## Validation
Commands executed and their results.

## Remaining Risks
Anything not addressed in this phase.

## Deployment Readiness
Whether production should now succeed.

---

# Build Validation Commands

Typical validation commands:

```
npx eslint <target files>
npx tsc --noEmit
npm run build
```

If Turbopack stalls locally, a secondary verification gate can be used:

```
npx next build --webpack
```

This ensures production‑equivalent validation.

---

# Safe Debug Strategy

When production fails but localhost works:

Codex should check the following order:

1. Missing environment variables
2. Service role dependencies
3. Missing committed files
4. OAuth redirect mismatch
5. Build‑time network dependencies

Most deployment failures fall into one of these categories.

---

# Codex Reliability Multiplier

Using this system dramatically improves Codex reliability because it:

• prevents architecture drift
• isolates changes to specific surfaces
• ensures reproducible builds
• maintains system documentation

Without this structure, large AI‑assisted rebuilds tend to degrade over time.

With this system, Codex becomes a reliable engineering executor rather than a free‑form code generator.

---

# Summary

This reliability system transforms Codex into a structured engineering collaborator.

It ensures that:

• large rebuilds remain stable
• debugging remains predictable
• deployments remain reproducible
• architectural intent is preserved

All future Codex implementation phases must follow this document.