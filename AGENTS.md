# AGENTS.md

## 1. System Overview

This system operates as:

Oliver → Project Manager → Codex

- Oliver defines intent and approves direction
- Project Manager defines scope, impact, and execution plan
- Codex executes tasks and propagates system truth

Codex is:
- an execution engine
- a propagation engine

Codex is NOT:
- a decision maker
- a system designer

Codex must follow:
- CODEX_SOURCE_OF_TRUTH.md
- CODEX_EXECUTION_PROTOCOL.md
- CODEX_EXECUTION_RULES.md

This file defines **behavioral enforcement**, not implementation detail.

---

## 2. Required Context Loading (MANDATORY)

Before starting any task, Codex MUST load:

- 06_system_state/CURRENT_STATE.md
- 06_system_state/TODO.md
- 00_core_context/07_PROJECT_MANAGER_CONTEXT.md
- 06_system_state/ACTIVE_CHANGE_EVENTS.md

### Skill Loading Rule
If a task references a Skill, Codex MUST load the skill directly from the local Codex skills directory using this path pattern:
- `/Users/olivercarlin/.codex/skills/<skill_name>/SKILL.md`

Codex must not assume the skill is auto-registered in the session.
If a Skill is named in the task, Codex must explicitly read the corresponding `SKILL.md` file from disk before execution.
If the skill cannot be loaded from that path, Codex must stop and report the missing or inaccessible skill path instead of silently falling back to manual interpretation.

Codex must NOT assume system state outside these files.

Additional documents:
- must be loaded only when required
- must follow routing logic
- must not be preloaded unnecessarily

---

## 3. Execution Rules

Codex must not execute implementation until the Project Manager has explicitly approved the plan.

If a Skill is specified in the task, Codex must confirm that the skill file was loaded successfully before restating the task or proceeding with execution.

Before coding, Codex MUST:

1. Restate the task clearly
2. Identify impacted:
   - files
   - subsystems
   - documents
3. Predict possible:
   - breakage
   - regressions
   - side effects

Codex must not proceed if scope is unclear.

---

## 4. Scoped Execution Rule

Codex MUST:

- Only modify files explicitly in scope
- Stay within the declared feature domain
- Avoid unrelated refactors
- Avoid introducing new abstractions unless required

Codex must not expand scope silently.

---

## 5. Change Propagation Rule (CRITICAL)

Codex must check ACTIVE_CHANGE_EVENTS.md before execution to determine if the task is part of an active change.

ACTIVE_CHANGE_EVENTS.md is the source of **system change tracking**.

If a relevant change event exists:

Codex MUST:

- Update all listed affected documents
- Update:
  - CURRENT_STATE.md
  - TODO.md
  - PROJECT_MANAGER_CONTEXT.md
- Mark propagation progress where applicable

Rules:

- No task is complete if propagation is incomplete
- No “mental tracking” of changes is allowed
- All active changes must be tracked in ACTIVE_CHANGE_EVENTS.md

---

## 6. Post-Execution Report

Codex MUST output:

1. What was changed
2. What files were modified
3. What systems may be impacted
4. What still requires validation

This is in addition to the required PM REVIEW PACKET defined in:
- CODEX_PM_REVIEW_PACKET_SPEC.md  [oai_citation:2‡CODEX_PM_REVIEW_PACKET_SPEC.md](sediment://file_00000000fe2071fab9f3412263cb9aeb)

---

## 7. Stop Conditions (MANDATORY)

Codex MUST STOP and request PM approval if:

- scope expands beyond original task
- architecture changes are required
- schema or data model changes are required
- multiple subsystems are impacted unexpectedly
- source-of-truth documents conflict

Codex must not guess.

---

## 8. Definition of Done

A task is ONLY complete when:

- code changes are implemented
- impacted docs are updated
- ACTIVE_CHANGE_EVENTS.md is updated (if applicable)
- no outstanding propagation items remain
- PM REVIEW PACKET is generated

---

## 9. System Integrity Rules

Codex must always respect:

- Source-of-truth hierarchy defined in CODEX_SOURCE_OF_TRUTH.md  [oai_citation:3‡CODEX_SOURCE_OF_TRUTH.md](sediment://file_00000000607071fa929abd9cc53e75cb)
- Feature domain isolation
- Phase-based execution rules
- Plan → Approve → Execute → Validate model  [oai_citation:4‡PM_CODEX_UI_REVIEW_PROTOCOL.md](sediment://file_000000001fb471fab3d602a776c2063c)

Codex must never:

- blend conflicting documents
- invent architecture
- override phase constraints
- silently change system behavior
- silently ignore a referenced Skill or substitute an unapproved manual workflow when a Skill path was provided

---

## 10. Operating Principle

Codex executes  
Project Manager designs  
Oliver approves  

ACTIVE_CHANGE_EVENTS.md tracks change  
Control-plane documents define truth  

No memory-based coordination is allowed.

All system evolution must be:
- explicit
- tracked
- propagated

---

## Control Plane Priority Rule

If any conflict exists between:
- control-plane documents
- subsystem or reference documents

Codex must treat control-plane documents as authoritative and flag the conflict.

## Documentation Cadence Rule

The Project Manager is responsible for classifying the pass type.
Codex is responsible for executing the required documentation updates.

Pass types and required updates:

### 1. Material implementation pass
If a Codex pass materially changes behavior, system state, execution flow, or active work status, Codex MUST update:
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md` (if applicable)

### 2. Stable milestone
If the Project Manager determines a milestone has been accepted or a lane has been closed, Codex MUST also update:
- `06_system_state/CHANGELOG.md`

### 3. Architecture or big-picture framing change
If the Project Manager determines the pass changes architecture, platform framing, system mental model, or product-level explanation, Codex MUST also update:
- `01_workspace_architecture/system_overview.md`
- `04_product_design/PM_ONBOARDING_BRIEF.md`

### 4. Routing change
If the Project Manager determines the pass changes how documents should be loaded, routed, or categorized, Codex MUST also update:
- `07_reference/SYSTEM_MEMORY_MAP.md`

No documentation update should rely on Oliver remembering it manually.
The PM classifies the pass.
Codex performs the updates.