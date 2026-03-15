

# CODEX PM REVIEW PACKET SPEC

## Purpose
This document defines the exact structure Codex must use when reporting work back to the Project Manager (PM). Every implementation phase must end with a **PM Review Packet** so the PM can quickly validate what was done, what changed, and what still needs attention.

Codex must never finish a phase without generating this packet.

The goal is to eliminate vague summaries and ensure consistent, verifiable reporting.

---

# When Codex Must Generate a PM Review Packet
Codex must generate a PM Review Packet whenever:

• A phase task is completed
• Code changes were made
• A build or validation run occurred
• Documentation was modified
• A system behavior changed

The packet must appear **at the end of the response**.

---

# PM Review Packet Structure
Every packet must follow this exact structure.

```
PM REVIEW PACKET

PHASE
<phase name>

SUMMARY
<plain English summary of what was accomplished>

FILES CREATED
<list>

FILES MODIFIED
<list>

FILES DELETED
<list>

KEY IMPLEMENTATION NOTES
<important technical details>

VALIDATION PERFORMED
<lint/build/tests/manual verification>

KNOWN LIMITATIONS
<any temporary limitations>

NEXT RECOMMENDED STEP
<what Codex believes should happen next>
```

---

# File Change Reporting Rules
Codex must report **only files actually changed in this phase**.

Do NOT list unrelated files.

File paths must be absolute relative to the repo root.

Example:

```
FILES CREATED
web/src/components/runtime/GmailCleanupComponents.tsx
web/src/lib/runtime/gmailCleanupMemory.ts

FILES MODIFIED
web/src/app/api/runtime/execute/route.ts
web/src/components/runtime/OperationsWorkspaceShell.tsx

FILES DELETED
web/src/app/agents/[id]/operations/oldReviewPage.tsx
```

---

# Validation Section Requirements
Codex must report the **actual commands run**.

Example:

```
VALIDATION PERFORMED

ESLint
npx eslint src/app/api/runtime/execute/route.ts

TypeScript
npx tsc --noEmit

Production Build
npm run build

Manual Verification
Mailbox Intelligence page loads successfully
Sender decisions update confirmation preview
```

---

# Critical Rule: No Silent Assumptions
If Codex could not verify something (for example because of environment limitations), it must explicitly state that.

Example:

```
I could not validate Gmail API responses because the sandbox environment does not contain real Gmail credentials.
```

---

# Critical Rule: Do Not Claim Success Without Evidence
Codex must not state that something "works" unless it verified it with:

• build
• lint
• runtime validation

Otherwise it must say:

```
This change compiles but has not been runtime verified.
```

---

# Relationship to Codex Phase Execution Plan
Each implementation phase in:

```
GMAIL_WORKSPACE_PHASE_PLAN.md
```

must end with a PM Review Packet.

---

# Relationship to Codex Master Instruction Packet
The Codex Master Instruction Packet instructs Codex **how to behave globally**.

This document defines **how Codex must report work back to the PM**.

---

# Example Completed Packet

```
PM REVIEW PACKET

PHASE
Phase 1 — Mailbox Intelligence

SUMMARY
Implemented sender-first Mailbox Intelligence dashboard and Scope Ladder component.

FILES CREATED
web/src/components/runtime/GmailScopeLadder.tsx
web/src/components/runtime/MailboxIntelligenceDashboard.tsx

FILES MODIFIED
web/src/app/agents/[id]/operations/intelligence/page.tsx
web/src/lib/integrations/gmail/inboxAnalysis.ts

FILES DELETED
web/src/app/agents/[id]/operations/oldDashboard.tsx

KEY IMPLEMENTATION NOTES
Dashboard now loads sender analytics from mailbox_intelligence API.

VALIDATION PERFORMED
npm run build
npx eslint
npx tsc --noEmit

KNOWN LIMITATIONS
Charts currently use static rendering; interactive filtering will be added in Phase 2.

NEXT RECOMMENDED STEP
Begin Phase 2: Sender Decision Workspace.
```

---

# Final Rule

If a response from Codex does not contain a PM Review Packet, it should be considered incomplete.

This rule exists to maintain reliability during large architecture rebuilds.