# implementation_pass

## Purpose
Execute a scoped implementation task with full validation and required document updates.

## Rules
- Follow AGENTS.md at all times
- Do NOT expand scope
- Do NOT introduce new abstractions unless required
- Do NOT modify unrelated files

## Steps

1. Load control plane:
   - CURRENT_STATE.md
   - TODO.md
   - PROJECT_MANAGER_CONTEXT.md
   - ACTIVE_CHANGE_EVENTS.md

2. Load routed domain context:
   - Use SYSTEM_MEMORY_MAP.md
   - Load only required docs

3. Restate task:
   - objective
   - constraints
   - exact scope

4. Identify:
   - impacted files
   - impacted subsystems
   - impacted documents

5. Predict:
   - risks
   - regressions
   - side effects

6. Execute:
   - implement changes
   - stay strictly within scope

7. Propagate changes:
   - update CURRENT_STATE.md
   - update TODO.md
   - update PROJECT_MANAGER_CONTEXT.md
   - update ACTIVE_CHANGE_EVENTS.md (if relevant)

8. Validate:
   - confirm no regressions
   - confirm scope adherence

9. Return:
   - PM REVIEW PACKET
   - files changed
   - validation summary
   - outstanding risks

Codex must check ACTIVE_CHANGE_EVENTS.md BEFORE restating the task to ensure alignment with active system changes.