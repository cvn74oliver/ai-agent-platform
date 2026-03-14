#!/bin/bash
# update_memory.sh
#
# Purpose:
# - Back up the authoritative docs folder
# - Rebuild the master project summary from role context files
#
# ✅ Source of truth:
#   ai-agent-platform-docs/ (inside this repo)
#   OR ../ai-agent-platform-docs (sibling repo)
#
# 🚫 Do NOT treat /web/docs as authoritative (it is a generated mirror).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"   # web/
REPO_ROOT="$(cd "$PROJECT_ROOT/.." && pwd)"     # repo root

DATE="$(date +"%Y-%m-%d_%H-%M-%S")"

# Resolve authoritative docs folder (support both layouts)
# 1) Preferred: inside repo (ai-agent-platform-docs/)
# 2) Fallback: sibling repo (../ai-agent-platform-docs)
DOCS_IN_REPO="$REPO_ROOT/ai-agent-platform-docs"
DOCS_SIBLING="$REPO_ROOT/../ai-agent-platform-docs"

if [ -d "$DOCS_IN_REPO" ]; then
  DOCS_AUTHORITATIVE="$DOCS_IN_REPO"
elif [ -d "$DOCS_SIBLING" ]; then
  DOCS_AUTHORITATIVE="$DOCS_SIBLING"
else
  echo "❌ Error: authoritative docs folder not found."
  echo "   Looked for:"
  echo "   - $DOCS_IN_REPO"
  echo "   - $DOCS_SIBLING"
  echo "   Fix: ensure ai-agent-platform-docs exists in-repo, or as a sibling folder."
  exit 1
fi

echo "🔒 Memory Sync (Authoritative Mode)"
echo "📁 Using authoritative docs: $DOCS_AUTHORITATIVE"

# 1) Backup current authoritative docs (exclude backups to prevent nesting)
mkdir -p "$DOCS_AUTHORITATIVE/backups"
BACKUP_PATH="$DOCS_AUTHORITATIVE/backups/docs_${DATE}.tgz"

tar \
  --exclude="./backups" \
  -czf "$BACKUP_PATH" \
  -C "$DOCS_AUTHORITATIVE" \
  .

echo "✅ Docs backup created: $BACKUP_PATH"

# 2) Rebuild master summary from all role contexts
# (0*_CONTEXT.md files are the stitched memory backbone)
# Support contexts either in root or inside subfolders.
# If the docs are organized into 00_core_context/, treat that as the canonical
# location for 00_MASTER_PROJECT.md, but also maintain a legacy root copy so
# older markdown links do not break.

# macOS ships with an older Bash that does not support `mapfile`, so build the
# array using a POSIX-safe read loop instead.
CONTEXT_FILES=()
while IFS= read -r context_file; do
  CONTEXT_FILES+=("$context_file")
done < <(find "$DOCS_AUTHORITATIVE" -type f -name "0*_CONTEXT.md" | sort)

MASTER_CONTEXT_DIR="$DOCS_AUTHORITATIVE"
if [ -d "$DOCS_AUTHORITATIVE/00_core_context" ]; then
  MASTER_CONTEXT_DIR="$DOCS_AUTHORITATIVE/00_core_context"
fi

MASTER_PROJECT_CANONICAL="$MASTER_CONTEXT_DIR/00_MASTER_PROJECT.md"
MASTER_PROJECT_LEGACY="$DOCS_AUTHORITATIVE/00_MASTER_PROJECT.md"

if [ ${#CONTEXT_FILES[@]} -eq 0 ]; then
  echo "⚠️ Warning: no context files found under: $DOCS_AUTHORITATIVE"
  echo "   Skipping 00_MASTER_PROJECT.md rebuild."
else
  mkdir -p "$MASTER_CONTEXT_DIR"
  cat "${CONTEXT_FILES[@]}" > "$MASTER_PROJECT_CANONICAL"
  echo "✅ Master project summary rebuilt: $MASTER_PROJECT_CANONICAL"

  if [ "$MASTER_PROJECT_CANONICAL" != "$MASTER_PROJECT_LEGACY" ]; then
    cp "$MASTER_PROJECT_CANONICAL" "$MASTER_PROJECT_LEGACY"
    echo "✅ Legacy compatibility copy refreshed: $MASTER_PROJECT_LEGACY"
  fi
fi

echo "✅ Memory sync completed @ $DATE"
echo "ℹ️ Next step: run ./web/automation/sync_docs_to_github.sh to mirror docs into web/docs/"