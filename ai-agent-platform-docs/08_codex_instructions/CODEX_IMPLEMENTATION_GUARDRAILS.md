# CODEX IMPLEMENTATION GUARDRAILS

## Purpose
This document defines the **mandatory guardrails Codex must follow** when implementing or modifying the AI Agent Platform. These guardrails exist to prevent architectural drift, uncontrolled refactors, and regressions during large multi‑phase builds such as the Gmail Workspace system.

Codex must treat these rules as **hard constraints**, not suggestions.

---

# 1. Codex Must Not Invent Architecture

Codex **must not redesign or reinterpret the architecture**.

Codex must implement exactly what is defined in:

- `GMAIL_WORKSPACE_PRODUCT_FLOW_SPEC.md`
- `GMAIL_WORKSPACE_UX_SPEC.md`
- `GMAIL_WORKSPACE_ANALYTICS_SPEC.md`
- `GMAIL_WORKSPACE_PERFORMANCE_SPEC.md`
- `GMAIL_WORKSPACE_PHASE_PLAN.md`

If any requirement is unclear, Codex must **stop and ask for clarification instead of guessing**.

---

# 2. Codex Must Follow Phase Isolation

Codex must only implement **the current phase** defined in:

`GMAIL_WORKSPACE_PHASE_PLAN.md`

This means:

Codex must NOT implement:

- Later phases
- Additional features
- “Helpful improvements”
- Architectural refactors

outside the current phase.

Each phase must remain **independently testable**.

---

# 3. Codex Must Protect Existing System Stability

Codex must not break:

- Supabase auth
- existing runtime APIs
- existing database schemas
- working routes

unless the phase specification explicitly requires the change.

If a change could impact existing functionality, Codex must:

1. document the risk
2. isolate the change
3. validate the impact

---

# 4. Codex Must Avoid Large Uncontrolled Refactors

Codex must **not rewrite entire files or folders** unless explicitly required.

Allowed:

- targeted edits
- new modules
- small isolated changes

Forbidden without approval:

- large component rewrites
- moving large directory structures
- replacing core runtime logic

---

# 5. Codex Must Optimize for Developer Testing

All work must remain **easy to test locally**.

This means:

- no changes that require production deployment to verify
- no hard dependencies on external services unless mocked
- no build‑time dependencies on internet resources

---

# 6. Codex Must Maintain Performance Discipline

The Gmail Workspace must feel **instant and responsive**.

Codex must respect the rules in:

`GMAIL_WORKSPACE_PERFORMANCE_SPEC.md`

Key expectations:

- page transitions should be near‑instant
- heavy analytics must be cached
- mailbox scans must not run synchronously in UI routes
- API routes must respond quickly

If Codex introduces a slow operation, it must:

- cache
- background it
- or defer execution

---

# 7. Codex Must Preserve Sender‑First Architecture

The Gmail cleanup system is **sender‑first**.

This means:

Primary decision object:

**Sender**

Messages are only **supporting evidence**.

Codex must not revert to:

- message‑first cleanup
- batch‑first cleanup
- inbox sweep logic

---

# 8. Codex Must Keep UX Consistent

UI changes must follow:

`GMAIL_WORKSPACE_UX_SPEC.md`

Requirements:

- consistent page layout
- consistent navigation
- consistent terminology
- consistent analytics presentation

Codex must not introduce **new UI metaphors** without documentation.

---

# 9. Codex Must Always Produce a PM Review Packet

Every Codex execution must end with a **PM Review Packet** using the format defined in:

`CODEX_PM_REVIEW_PACKET_SPEC.md`

This packet must include:

- files created
- files modified
- architectural changes
- validation steps performed
- remaining risks

Codex must **never skip this step**.

---

# 10. Codex Must Use the Project Tree Script

Before generating the PM Review Packet, Codex must run the project tree script to verify repository structure.

Expected script location:

`scripts/generate_project_tree.sh`

This ensures the packet reflects the **real repository state**.

---

# 11. Codex Must Minimize File Creation

New files should only be created when necessary.

Prefer:

- extending existing modules
- adding small focused files

Avoid:

- unnecessary file fragmentation
- duplicate systems

---

# 12. Codex Must Never Break Build Integrity

Before finishing any implementation, Codex must run:

- ESLint
- TypeScript typecheck
- production build

Example:

```
npm run lint
npx tsc --noEmit
npm run build
```

If any fail, Codex must resolve the issue before concluding the task.

---

# 13. Codex Must Prefer Minimal Changes

Codex should always choose the **smallest safe change** that achieves the objective.

Avoid introducing complexity.

---

# Final Principle

Codex is not the architect.

Codex is the **implementation engine**.

Architecture decisions are defined in the documentation and must be followed exactly.
