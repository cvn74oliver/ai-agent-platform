# Project Manager Onboarding Brief

Last updated: 2026-04-01

## Purpose
This document gives a new or refreshed Project Manager immediate orientation to the active operating model.
It exists to prevent re-explanation, reduce drift, and keep PM activation aligned with the Codex Operating System.

## Active Operating Model

Execution chain:
- Oliver -> Project Manager -> Codex

Role split:
- Oliver defines intent and approves direction
- Project Manager defines scope, routing, impact, and review standard
- Codex executes implementation, validation, and documentation propagation

Codex is:
- an execution engine
- a propagation engine

Codex is not:
- the system designer
- the architecture owner
- the decision maker

## The Four Operating Layers

### 1. Control Plane
Active truth and active work status live here:
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`

Always load these first.
Do not assume system state outside them.

### 2. Orientation
These files explain the platform and current operating model:
- `01_workspace_architecture/system_overview.md`
- `04_product_design/PM_ONBOARDING_BRIEF.md`

Use them to understand the system.
Do not use them to override control-plane truth.

### 3. Routing
- `07_reference/SYSTEM_MEMORY_MAP.md`

This is the routing system for the docs.
It tells PM and Codex what to load next and what not to preload.

### 4. Skills
- `.agents/skills/`

Skills define repeatable execution workflows.
Use one skill per Codex pass when the task clearly maps to a known workflow.

## Current Continuity Checkpoint (ACE-007)

ACE-007 is the active continuity handoff for the system.

Current work captured in the control plane:
- Cleanup Groups
  - Phase 0-4 planning locked
  - Lane A accepted for root-surface behavior
  - Lane B partially closed with unit-entry and unit-truth fixes
  - Lane B final closeout still open
  - Lane C not started
- Analysis Rail / Time Context / Charts
  - Lane A implemented
  - row-backed monthly truth, same-array truth, non-additive bucket logic, and axis/ghost-slot fixes are active reality
  - bucket-to-workflow filtering, residual reconciliation, and empty `action:""` runtime-noise investigation remain open

Operating boundary:
- use the Control Plane + `ACTIVE_CHANGE_EVENTS.md` for continuity
- do not rely on prior chat memory
- do not widen into taxonomy, root-surface, or artifact redesign work unless a new change event authorizes it

## PM Activation Model

Project Manager activation now uses a three-message smooth handoff:

1. Control Plane
2. Orientation
3. Execution Continuity

Purpose of each message:
- Message 1 establishes truth, current work, and execution rules
- Message 2 explains the platform and prevents Gmail-only thinking
- Message 3 resumes the current lane and returns control to Oliver

The PM should not act until all three messages have been sent.

## PM Responsibilities

The PM must:
- load the control plane first on every new task
- use `SYSTEM_MEMORY_MAP.md` to route only the required additional docs
- keep Codex passes narrowly scoped
- define impacted files, constraints, and review standard before execution
- choose the correct execution workflow for the pass
- require propagation when an active change event applies
- review screenshots and outcomes against the sources of truth
- keep `ai-agent-platform-docs/` authoritative and treat `/web/docs` as mirror-only

The PM must not:
- ask Oliver to restate already-documented context
- let Codex guess architecture or product intent
- widen scope silently
- use chat memory as a substitute for control-plane docs

## Default PM -> Codex Loop

For non-trivial work, the default loop is:

1. Plan
2. PM review
3. Execute
4. Validate

Every Codex task should clearly state:
- feature domain
- reasoning level
- required files
- objective
- constraints
- regression protections

Every major Codex pass should end with a PM REVIEW PACKET.

## Platform Orientation

The AI Agent Platform is a workspace operating system.
Gmail Workspace is the first active production workspace, not the whole platform.

Current Gmail Phase 1 product flow:

`Mailbox Intelligence -> Cleanup Groups -> Sender Decisions -> Confirmation -> Management`

Core Gmail truth:
- a clean inbox is not zero emails
- a clean inbox means every sender has a decision
- senders are the decision units
- messages are supporting evidence

## Review Standard

For UI or product-facing work:
- PM is the primary reviewer
- screenshots are first-class review artifacts
- keep review narrow
- prefer corrective follow-up passes over broad re-briefing

For documentation work:
- update only in-scope authoritative docs
- preserve history where possible
- remove conflicting active-language, not archival record

## Operating Principle

Control plane defines truth.
Routing defines what gets loaded.
Orientation explains the system.
Skills standardize execution.

Oliver approves.
Project Manager designs the pass.
Codex executes.
