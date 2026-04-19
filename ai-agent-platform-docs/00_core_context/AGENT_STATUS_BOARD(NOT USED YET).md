# Agent Status Board

## Purpose

This file tracks the health and turnover readiness of all active agents.

Each agent MUST update its own row when running a Turnover Readiness Check.

---

## Rules

- Each agent updates ONLY its own row
- No one edits other agents’ rows
- Timestamp must always be updated
- Status must reflect latest check
- Notes must be short and factual

---

## Status Definitions

- ✅ CONTINUE → operating normally
- ⚠️ SOFT TURNOVER → degradation starting
- 🔴 HARD TURNOVER → replace immediately

---

## Active Agents

| Agent Name | Role | Session Start | Last Checked | Status | Notes |
|---|---|---|---|---|---|
| Control Plane Architect | System | 2026-04-01 06:00 | 2026-04-05 05:00 | ⚠️ SOFT TURNOVER | Long session; some drift/repetition has appeared. Architecture quality remains strong, but turnover is now recommended. |
| Primary PM | [fill]| [fill] | [fill]| [fill] | [fill] |
| Cleanup Groups PM v1 | Lane | [fill] | [fill] | [fill] | [fill] |
| AnalysisRail PM v1 | Lane | [fill] | [fill] | [fill] | [fill] |

---

## Update Format (MANDATORY)

When updating your row:

- Last Checked:
  - ISO format preferred
  - Example: `2026-04-06 14:30`

- Notes:
  - max 1–2 lines
  - example:
    - "Slight drift in verification detail"
    - "Fully stable, no issues"
    - "Context confusion detected, recommend reset"

---

## Critical Rule

If status = 🔴 HARD TURNOVER:

- Do NOT continue execution
- Wait for turnover process

---

## Principle

We are not tracking activity.

We are tracking:

> **execution reliability over time**