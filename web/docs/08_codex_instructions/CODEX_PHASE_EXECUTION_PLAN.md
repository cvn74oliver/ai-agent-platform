CODEX Phase Execution Plan

Purpose

This document defines how Codex must execute large system rebuilds in controlled phases.

The AI Agent Platform is a complex architecture with multiple interconnected systems.
Attempting to rebuild or refactor everything at once creates instability, confusion, regression risk, and performance degradation.

To prevent this, all major development work must follow a **phased execution model**.

Each phase focuses on a specific system layer and must pass validation before moving forward.

Codex must **not skip phases** and must **not expand scope beyond the defined phase**.

This document works together with:

ai-agent-platform-docs/08_codex_instructions/
• CODEX_MASTER_INSTRUCTION_PACKET.md  
• CODEX_IMPLEMENTATION_GUARDRAILS.md  
• CODEX_PM_REVIEW_PACKET_SPEC.md  
• CODEX_RELIABILITY_SYSTEM.md  

These documents together define the complete Codex operating protocol.

⸻

CORE EXECUTION PRINCIPLES

1. One Phase At A Time

Codex must complete one phase fully before beginning the next.

A phase is considered complete only when:

• The defined scope is implemented  
• The application compiles successfully  
• TypeScript checks pass  
• Lint checks pass  
• Build succeeds  
• Manual runtime validation succeeds  
• System documentation is updated  

Only after these validations are satisfied may the next phase begin.

⸻

2. No Scope Expansion

Codex must implement **only the scope defined for the current phase**.

If unrelated issues are discovered:

• Document them  
• Add them to TODO.md  
• Do NOT fix them during the current phase  

This prevents destabilizing the system.

⸻

3. Documentation Is Authoritative

All rebuild work must follow documentation in:

ai-agent-platform-docs/

Key folders:

01_workspace_architecture  
03_gmail_workspace  
08_codex_instructions  

If documentation conflicts with existing code:

**Documentation takes priority.**

⸻

4. Phase Completion Updates

After each phase Codex must update:

CHANGELOG.md  
CURRENT_STATE.md  
TODO.md  
system_overview.md  

This ensures future sessions understand the system state.

⸻

PHASE STRUCTURE

Each phase must contain:

Goal  
Scope  
Implementation Targets  
Validation Requirements  
Out-of-Scope Items  

Codex must explicitly confirm these sections when presenting a phase plan.

⸻

CURRENT REBUILD PLAN

The current rebuild focuses on the **Gmail Sender‑First Workspace Architecture**.

The system will be rebuilt in **four controlled phases**.

⸻

PHASE 1 — Performance Foundation

Goal

Fix the core performance problems that currently make testing slow and unstable.

The system must feel **fast and responsive** before UX or AI improvements are implemented.

⸻

Scope

Focus only on:

• Mailbox Intelligence loading  
• Cleanup Groups loading  
• Sender Decision workspace loading  
• Runtime API performance  
• Data caching and memoization  

No UX redesign work occurs in this phase.

⸻

Required Improvements

Data Caching

The following must be cached:

• Mailbox Intelligence analytics  
• Sender cluster analysis  
• Sender statistics  
• Cleanup group discovery  

Cache lifetime:

10–30 minutes

Cache invalidation occurs when:

• Gmail indexing completes  
• Gmail mailbox index changes  
• Cleanup cluster discovery runs  

⸻

API Performance Targets

Initial load < 3 seconds  
Navigation between pages < 1 second  

Current problem:

Pages reload entire mailbox analysis and can take **30–60 seconds**.

This must be eliminated.

⸻

Server-Side Improvements

Codex should implement:

• server-side memoization  
• route-level caching  
• snapshot caching for mailbox intelligence  
• shared cache between intelligence and cluster routes  

⸻

Client Optimizations

Sender workspace must use:

• virtualized lists  
• incremental data loading  
• cached pagination  
• lazy evidence loading  

⸻

Validation

Before Phase 1 is complete:

• Mailbox Intelligence loads under 3 seconds  
• Cleanup Groups load under 1 second after first load  
• Sender Decisions navigation is instant  
• No full mailbox recomputation during navigation  

⸻

PHASE 2 — Product Flow Correction

Goal

Fix the workflow logic of the Gmail cleanup experience.

The system must follow a clear **sender-first decision model**.

⸻

Correct Product Flow

1. Intro / Health  
2. Mailbox Intelligence  
3. Cleanup Groups  
4. Sender Decisions  
5. Confirmation  
6. Rules / Automation  
7. Monitoring  

⸻

Major Fixes

Sender‑First Clustering

Clusters must represent:

**groups of senders**

NOT:

groups of messages.

Messages are categorized **inside senders**, not before.

⸻

Remove Batch Mental Model

The system must never present:

• message batches  
• review units  
• message-first decisions  

Everything revolves around **senders**.

⸻

Simplify Workspace Stages

Sender workspace becomes:

senders  
confirmation  
rules  
monitoring  

Exceptions stage is removed until a clear product purpose is defined.

⸻

Validation

User must be able to:

• choose a sender cluster  
• review senders  
• make sender decisions  
• confirm decisions  
• generate automation rules  

without confusion.

⸻

PHASE 3 — Analytics & Visualization

Goal

Restore visual analytics that were lost during the rebuild.

Analytics must help users understand their mailbox instantly.

⸻

Mailbox Intelligence Visuals

Charts required:

• message volume timeline  
• sender distribution  
• inbox health gauge  
• category breakdown  
• top senders chart  

Purpose:

Provide a **10,000‑foot overview** of the mailbox.

⸻

Sender Dashboard Visuals

Charts required:

• sender message volume  
• sender activity timeline  
• sender comparison charts  
• filterable sender analytics  

Purpose:

Help users make decisions about senders.

⸻

Interaction Requirements

Analytics must support:

• filtering  
• sorting  
• time ranges  
• drill‑downs  

Charts should behave similarly to **Hyros‑style dashboards**.

⸻

PHASE 4 — AI Learning Layer

Goal

Complete the AI automation and learning system.

User decisions must become long‑term AI memory.

⸻

Memory Storage

Decisions must persist in:

agent_events  
rag_documents  

Memory types:

• sender policy  
• rule intent  
• decision frequency  
• domain patterns  

⸻

Monitoring System

Monitoring must display:

• learned policies  
• automation recommendations  
• domain memory  
• AI suggestions  

⸻

Final Vision

Eventually the system should:

• learn user preferences  
• suggest automation  
• auto-clean future inbox activity  

with minimal supervision.

⸻

CODEX EXECUTION RULES

When executing a phase Codex must:

1. Read all relevant documentation  
2. Implement only the current phase  
3. Avoid modifying unrelated code  
4. Run lint / typecheck / build  
5. Update system documentation  
6. Produce a PM Review Packet  

PM Review Packets must follow:

ai-agent-platform-docs/08_codex_instructions/CODEX_PM_REVIEW_PACKET_SPEC.md

⸻

VALIDATION CHECKLIST

Before closing a phase:

Build succeeds  
TypeScript passes  
Lint passes  
Manual UI test passes  
Docs updated  

⸻

WHY THIS PHASE PLAN EXISTS

Large rebuilds fail when:

• scope expands  
• code drifts from product vision  
• multiple layers change simultaneously  

This phase plan prevents that.

⸻

SUMMARY

The Gmail rebuild proceeds through:

Phase 1 — Performance Foundation  
Phase 2 — Product Flow Correction  
Phase 3 — Analytics & Visualization  
Phase 4 — AI Learning Layer  

Each phase must be completed and validated before moving forward.