# change_propagation_pass

## Purpose
Propagate a logged change event across all affected documentation and system layers.

## Rules
- Follow ACTIVE_CHANGE_EVENTS.md as the source of truth
- Do NOT introduce new changes
- Only propagate existing decisions

## Steps

1. Load:
   - ACTIVE_CHANGE_EVENTS.md
   - CURRENT_STATE.md
   - TODO.md
   - PROJECT_MANAGER_CONTEXT.md

2. Select target change event:
   - confirm event is Active
   - confirm propagation scope

3. Identify:
   - listed documents
   - any additional affected docs

4. Update:
   - all listed documents
   - CURRENT_STATE.md
   - TODO.md
   - PROJECT_MANAGER_CONTEXT.md

5. Validate:
   - consistency across documents
   - no conflicting statements

6. Update event:
   - mark completed propagation items
   - update status if fully propagated

7. Return:
   - summary of updates
   - files modified
   - remaining propagation items

If propagation requires creating new documents, Codex must create them following system naming conventions and update SYSTEM_MEMORY_MAP.md if routing changes.