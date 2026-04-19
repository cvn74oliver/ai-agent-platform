#!/bin/bash
set -euo pipefail

SOURCE_BASE="$HOME/Dev/ai-agent-platform/.codex/skills"
TARGET_BASE="/Users/olivercarlin/.codex/skills"
SKILLS=(
  "implementation_pass"
  "change_propagation_pass"
  "turnover_pack_builder"
)

echo "==> Syncing custom Codex skills only"
echo "Source base: $SOURCE_BASE"
echo "Target base: $TARGET_BASE"

if [ ! -d "$SOURCE_BASE" ]; then
  echo "ERROR: Source skills directory not found: $SOURCE_BASE" >&2
  exit 1
fi

mkdir -p "$TARGET_BASE"

for skill in "${SKILLS[@]}"; do
  SOURCE_FILE="$SOURCE_BASE/$skill/skill.md"
  TARGET_DIR="$TARGET_BASE/$skill"
  TARGET_FILE="$TARGET_DIR/SKILL.md"

  if [ ! -f "$SOURCE_FILE" ]; then
    echo "ERROR: Missing source skill file: $SOURCE_FILE" >&2
    exit 1
  fi

  mkdir -p "$TARGET_DIR"
  cp -f "$SOURCE_FILE" "$TARGET_FILE"
  echo "Synced: $skill -> $TARGET_FILE"
done

echo ""
echo "==> Sync complete. Current target skill files:"
for skill in "${SKILLS[@]}"; do
  ls -l "$TARGET_BASE/$skill/SKILL.md"
done
