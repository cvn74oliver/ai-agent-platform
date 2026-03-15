

# CODEX EXECUTION RULES

## Purpose
This document defines the mandatory execution behavior for Codex when working inside the AI Agent Platform repository.  
These rules exist to ensure Codex operates predictably, safely, and in alignment with the documented architecture and phase plans.

Codex must treat this document as a **hard constraint layer** for all execution.

---

# 1. Source of Truth Hierarchy
When Codex encounters conflicting instructions, it must follow this priority order:

1. **Active Phase Document**  
   (Example: `GMAIL_WORKSPACE_IMPLEMENTATION_PHASE_1.md`)

2. **Product Specifications**  
   - `GMAIL_WORKSPACE_PRODUCT_FLOW_SPEC.md`
   - `GMAIL_WORKSPACE_UX_SPEC.md`
   - `GMAIL_WORKSPACE_ANALYTICS_SPEC.md`
   - `GMAIL_WORKSPACE_ENGINEERING_SPEC.md`

3. **Architecture Documents**
   - `AI_WORKSPACE_ARCHITECTURE.md`
   - `AI_WORKSPACE_PRODUCT_ARCHITECTURE.md`
   - `system_overview.md`

4. **Codex Instruction Layer**
   - `CODEX_MASTER_INSTRUCTION_PACKET.md`
   - `CODEX_PHASE_EXECUTION_PLAN.md`
   - `CODEX_IMPLEMENTATION_GUARDRAILS.md`
   - `CODEX_EXECUTION_RULES.md`

5. **Current System State**
   - `CURRENT_STATE.md`
   - `TODO.md`

6. **Runtime Codebase**

If conflicts occur, Codex must **never invent behavior** — it must instead defer to the higher priority source.

---

# 2. Phase-Based Development Rule
Codex must **only implement the current active phase**.

Example:

If Phase 1 is active:

Allowed:

• Mailbox Intelligence
• Cleanup Groups
• Sender Decisions
• Confirmation

Not Allowed:

• Rules Automation
• Monitoring Intelligence
• Exception Workflows

Future phases may remain as **placeholders**, but must not contain full logic.

---

# 3. Sender‑First System Enforcement
The Gmail Workspace is **strictly sender-first**.

Therefore:

Codex must never introduce message-first clustering or message-first workflows.

Allowed structures:

Sender → Messages

Not allowed structures:

Message → Sender grouping

Clusters must represent **groups of senders**, not groups of messages.

---

# 4. Performance Rules
Mailbox Intelligence and Sender Decisions must meet the following constraints.

### Page Load
Warm loads must complete in:

```
< 2 seconds
```

Cold loads must remain under:

```
< 5 seconds
```

### Recompute Rules
Full mailbox analysis must **never re-run during navigation**.

Allowed triggers:

• Mailbox index refresh
• Snapshot invalidation

Not allowed triggers:

• Page navigation
• Pagination
• Stage transitions

### Caching Requirement
The following must be cached per cleanup snapshot:

• Sender universe
• Cleanup clusters
• Mailbox intelligence analytics

---

# 5. Navigation Rules
The Gmail workspace navigation must follow this structure.

```
Dashboard
  ↓
Mailbox Intelligence
  ↓
Cleanup Groups
  ↓
Sender Decisions
  ↓
Confirmation
```

Later phases introduce:

```
Rules
Monitoring
```

Codex must not add additional workflow stages.

---

# 6. UI Consistency Rules
All Gmail workspace pages must maintain consistent layout.

Required elements:

• Scope Ladder
• Stage Navigation
• Sender-first decision surface

Not allowed:

• Message-first tables
• Batch review concepts
• "Typeless" clustering language

---

# 7. Analytics Requirements
Analytics must exist in two locations.

### Mailbox Intelligence
High-level analytics:

• Sender volume
• Category distribution
• Activity timeline
• Cleanup cluster contribution

### Sender Decisions
Decision-support analytics:

• Sender volume chart
• Filterable sender table
• Sender activity timeline

Analytics must be interactive.

Static metrics are not acceptable.

---

# 8. Safety Rules
Codex must not:

• Rewrite architecture documents
• Modify system‑state docs without instruction
• Change database schema outside migration plans

Codex may:

• Modify UI
• Modify routes
• Modify runtime services

if the change aligns with the active phase document.

---

# 9. PM Review Packet Requirement
Every Codex execution must end with a **PM Review Packet** containing:

```
PHASE
SUMMARY
FILES CREATED
FILES MODIFIED
FILES DELETED
KEY IMPLEMENTATION NOTES
VALIDATION PERFORMED
KNOWN LIMITATIONS
NEXT RECOMMENDED STEP
```

Codex should generate this automatically using the project tooling.

---

# 10. Validation Requirements
Every implementation must run:

```
npm run lint
npx tsc --noEmit
npm run build
```

If any fail:

Codex must resolve the issue before finishing execution.

---

# 11. Failure Handling
If Codex detects:

• architectural contradictions
• unclear requirements
• missing documents

Codex must:

1. Stop implementation
2. Produce a clarification report
3. Wait for instruction

Codex must never proceed with speculative changes.

---

# 12. Final Rule
Codex is an **implementation engine**, not a product designer.

Product behavior is defined by the documentation.

Codex must implement the system exactly as specified.

No creative interpretation is permitted.

---

END OF DOCUMENT