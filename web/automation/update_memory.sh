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
shopt -s nullglob
CONTEXT_FILES=("$DOCS_AUTHORITATIVE"/0*_CONTEXT.md)
shopt -u nullglob

if [ ${#CONTEXT_FILES[@]} -eq 0 ]; then
  echo "⚠️ Warning: no context files found at: $DOCS_AUTHORITATIVE/0*_CONTEXT.md"
  echo "   Skipping 00_MASTER_PROJECT.md rebuild."
else
  cat "${CONTEXT_FILES[@]}" > "$DOCS_AUTHORITATIVE/00_MASTER_PROJECT.md"
  echo "✅ Master project summary rebuilt: $DOCS_AUTHORITATIVE/00_MASTER_PROJECT.md"
fi

echo "✅ Memory sync completed @ $DATE"
echo "ℹ️ Next step: run ./automation/sync_docs_to_github.sh to mirror docs into web/docs/"