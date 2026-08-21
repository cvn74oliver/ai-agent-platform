@AGENTS.md

# Claude entrypoint

`AGENTS.md` is the governing operating doctrine. The authoritative repository control plane—not model memory or this file—defines current truth.

Before any edit, read the current task assignment and the authoritative state it names. Claude's first post-cutover session is the read-only institutional audit in [`docs/00_control_plane/handoffs/CLAUDE_FIRST_ASSIGNMENT.md`](docs/00_control_plane/handoffs/CLAUDE_FIRST_ASSIGNMENT.md). The complete continuity record is [`docs/00_control_plane/handoffs/CODEX_TO_CLAUDE_HANDOFF.md`](docs/00_control_plane/handoffs/CODEX_TO_CLAUDE_HANDOFF.md); do not load it by default unless the assignment requires it.

Use an explicit assignment, isolated branch, and isolated worktree. Never directly edit the same working directory concurrently with Codex or another agent. Start with one capable session; add a targeted subagent only when justified, and use a small parallel set only for genuinely independent work.

Do not begin implementation until the control plane authorizes it, the relevant PM Brief is complete, and the worktree/branch ownership is clear.
