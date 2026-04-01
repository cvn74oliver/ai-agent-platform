# turnover_pack_builder

## Purpose
Generate a minimal, correct Project Manager activation package for fast turnover.

## Rules
- Follow agent_activation_checklist.md
- Do NOT overload context
- Always use SYSTEM_MEMORY_MAP.md for routing

## Steps

1. Load control plane:
   - CURRENT_STATE.md
   - TODO.md
   - PROJECT_MANAGER_CONTEXT.md
   - ACTIVE_CHANGE_EVENTS.md

2. Summarize:
   - current system state
   - active changes
   - current phase

3. Identify:
   - next immediate task
   - required domain documents (2–5 max)

4. Build activation package:

Message 1 (Control Plane):
- PROJECT_MANAGER_CONTEXT.md
- CURRENT_STATE.md
- TODO.md
- ACTIVE_CHANGE_EVENTS.md
- SYSTEM_MEMORY_MAP.md
- AGENTS.md

Message 2 (Orientation):
- system_overview.md
- PM_ONBOARDING_BRIEF.md

Message 3 (Execution Continuity):
- last Codex context
- task-specific docs (2–5 max)
- next-step recommendation

5. Return:
   - ready-to-send 3-message activation package
   - no extra documents