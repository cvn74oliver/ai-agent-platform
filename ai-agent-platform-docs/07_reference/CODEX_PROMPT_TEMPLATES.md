# Codex Prompt Templates

## Purpose
This file standardizes how the Project Manager communicates with Codex.

It ensures:
- consistent execution
- no ambiguity
- proper use of Skills
- predictable outcomes

---

## Control Plane Requirement (MANDATORY)

Before executing any task, Codex MUST load the control plane:

- CURRENT_STATE.md
- TODO.md
- PROJECT_MANAGER_CONTEXT.md
- ACTIVE_CHANGE_EVENTS.md

Codex must not assume system state outside these files.

---

# 1. Implementation Pass

Feature Domain: [DOMAIN]  
Reasoning Level: [LOW / MEDIUM / HIGH / EXTRA-HIGH]  
Skill: implementation_pass  
Skill Location: /Users/olivercarlin/.codex/skills/implementation_pass/SKILL.md  
Codex MUST explicitly load this skill file before execution.  
Control Plane: Must be loaded before execution

Files:
@file1
@file2

Objective:
- what is wrong
- desired outcome
- constraints
- what must NOT change

Instructions:
- implement the required changes
- stay strictly within scope

Validation:
- no regressions
- feature works as intended
- scope respected

---

# 2. Change Propagation Pass

Feature Domain: SYSTEM  
Reasoning Level: HIGH  
Skill: change_propagation_pass  
Skill Location: /Users/olivercarlin/.codex/skills/change_propagation_pass/SKILL.md  
Codex MUST explicitly load this skill file before execution.  
Control Plane: Must be loaded before execution

Files:
@ACTIVE_CHANGE_EVENTS.md
@CURRENT_STATE.md
@TODO.md

Objective:
- propagate a logged change event
- align all affected documentation

Instructions:
- locate the target ACE
- update all listed docs
- ensure consistency across system

Validation:
- no conflicting language remains
- propagation status updated
- system reflects current truth

---

# 3. Shared Hot-File Integration Pass

Feature Domain: [DOMAIN]
Reasoning Level: HIGH
Skill: implementation_pass
Skill Location: /Users/olivercarlin/.codex/skills/implementation_pass/SKILL.md
Codex MUST explicitly load this skill file before execution.
Control Plane: Must be loaded before execution

Files:
@hot_file_1
@hot_file_2

Preflight Packet:
- target branch
- source branch
- merge-base commit
- overlapping hot files
- non-hot companion files explicitly allowed in scope
- preserve-from-main notes
- preserve-from-worktree notes
- validation surfaces
- related ACEs/specs

Objective:
- integrate overlapping edits in shared hot files safely
- preserve accepted behavior on both sides
- keep docs-only sync separate from code integration

Instructions:
- run hot-file preflight before implementation
- classify overlap against the shared hot-file list using merge-base, two-sided overlap detection
- if classification = `hot_file_integration_required`, full git merge is prohibited
- use intentional comparison against merge base, target, and source instead of blind merge resolution
- apply the default merge bias rules unless PM explicitly overrides them:
  - UI files prefer `main`
  - runtime logic prefers the active worktree lane
  - imports union unless the conflict is semantic
  - types/interfaces prefer the superset, not reduction
- if docs/control-plane files also need syncing, handle that through docs-only sync separately
- do not use Oliver as the default manual merge resolver

Validation:
- hot-file overlap is reconciled intentionally
- regressions are checked for the affected shared surfaces
- if Codex fails the same hot-file integration twice, stop and return to PM
- PM REVIEW PACKET explains what was preserved, changed, and still needs product review

---

# 4. Turnover Pack Builder

Feature Domain: SYSTEM  
Reasoning Level: MEDIUM  
Skill: turnover_pack_builder  
Skill Location: /Users/olivercarlin/.codex/skills/turnover_pack_builder/SKILL.md  
Codex MUST explicitly load this skill file before execution.  
Control Plane: Must be loaded before execution

Files:
@CURRENT_STATE.md
@TODO.md
@PROJECT_MANAGER_CONTEXT.md

Objective:
- prepare PM activation package
- reduce turnover time

Instructions:
- summarize current state
- identify next task
- assemble 3-message activation

Validation:
- no unnecessary docs included
- context is clear and minimal
- activation ready to send

---

# Usage Rule

Every Codex instruction should:
1. Specify a Skill
2. Include the Skill Location
3. Follow this structure when the task is complex

When the task is worktree sync related:
- use `Change Propagation Pass` for docs-only sync or conflict recovery at the docs/control-plane layer
- use `Shared Hot-File Integration Pass` for overlapping shared runtime files

For simple or lightweight tasks, a reduced prompt may be used, but if a Skill is referenced the corresponding Skill Location must still be provided.

Do NOT send ambiguous or unscoped prompts to Codex.

---

# Summary

This file ensures:
- PM → Codex communication is standardized
- Skills are used correctly
- Execution is predictable and repeatable
