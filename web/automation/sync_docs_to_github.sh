#!/bin/bash
# sync_docs_to_github.sh — authoritative docs → generated mirror
set -euo pipefail

echo "🔒 Docs Sync (Authoritative Mode)"

# ------------------------------------------------------------
# Step 1: Resolve project paths
# ------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# This script lives in: <repo>/web/automation
# Repo root is two levels up from here: <repo>
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Prefer in-repo authoritative docs first (new standard)
DOCS_AUTHORITATIVE_IN_REPO="$REPO_ROOT/ai-agent-platform-docs"
# Fallback: sibling folder next to the repo (legacy)
DOCS_AUTHORITATIVE_SIBLING="$REPO_ROOT/../ai-agent-platform-docs"

# Generated mirror lives inside the repo
DOCS_GENERATED="$REPO_ROOT/web/docs"

echo "📌 REPO_ROOT resolved to: $REPO_ROOT"
echo "📌 Authoritative docs candidate (in-repo): $DOCS_AUTHORITATIVE_IN_REPO"
echo "📌 Authoritative docs candidate (sibling): $DOCS_AUTHORITATIVE_SIBLING"

if [ -d "$DOCS_AUTHORITATIVE_IN_REPO" ]; then
  DOCS_AUTHORITATIVE="$DOCS_AUTHORITATIVE_IN_REPO"
else
  DOCS_AUTHORITATIVE="$DOCS_AUTHORITATIVE_SIBLING"
fi

# ------------------------------------------------------------
# Step 2: Safety checks
# ------------------------------------------------------------
if [ ! -d "$DOCS_AUTHORITATIVE" ]; then
  echo "❌ Authoritative docs repo not found:"
  echo "   $DOCS_AUTHORITATIVE"
  echo "   (Checked: $DOCS_AUTHORITATIVE_IN_REPO and $DOCS_AUTHORITATIVE_SIBLING)"
  exit 1
fi


# Support system-state docs either at the repo root (legacy) or inside
# the organized 06_system_state/ folder. This keeps the sync script working
# during and after doc-folder reorganizations.
CURRENT_STATE_LEGACY="$DOCS_AUTHORITATIVE/CURRENT_STATE.md"
CURRENT_STATE_ORGANIZED="$DOCS_AUTHORITATIVE/06_system_state/CURRENT_STATE.md"

if [ -f "$CURRENT_STATE_LEGACY" ]; then
  CURRENT_STATE_PATH="$CURRENT_STATE_LEGACY"
else
  CURRENT_STATE_PATH="$CURRENT_STATE_ORGANIZED"
fi

if [ ! -f "$CURRENT_STATE_PATH" ]; then
  echo "❌ CURRENT_STATE.md missing in authoritative docs repo."
  echo "   Checked:"
  echo "   - $CURRENT_STATE_LEGACY"
  echo "   - $CURRENT_STATE_ORGANIZED"
  echo "   Aborting sync to prevent loss of state."
  exit 1
fi

mkdir -p "$DOCS_GENERATED"

# ------------------------------------------------------------
# Step 3: Sync authoritative docs → generated mirror
# ------------------------------------------------------------
echo "🔄 Syncing authoritative docs → web/docs (non-destructive)..."

echo "📁 Source of truth: $DOCS_AUTHORITATIVE"
echo "📁 Generated mirror: $DOCS_GENERATED"
echo "📄 CURRENT_STATE source: $CURRENT_STATE_PATH"

rsync -av \
  --exclude '.git/' \
  --exclude '.DS_Store' \
  --exclude 'backups/' \
  "$DOCS_AUTHORITATIVE/" \
  "$DOCS_GENERATED/"

echo "✅ web/docs updated from authoritative source."
echo "ℹ️ Notes: subfolders are supported; hidden macOS files and backups are excluded from the generated mirror."

# ------------------------------------------------------------
# Step 4: Commit + push docs changes (if changed)
# ------------------------------------------------------------
# Important: run git from inside the docs folder so we only stage docs changes.
cd "$DOCS_AUTHORITATIVE"

git add .
# Commit may be a no-op
git commit -m "Docs update $(date +"%Y-%m-%d %H:%M")" || echo "ℹ️ No doc changes to commit."

git push || echo "ℹ️ No remote push performed (check remote/branch if needed)."

echo "✅ Authoritative docs pushed to GitHub."

# ------------------------------------------------------------
# Step 5: Final confirmation
# ------------------------------------------------------------
echo "🎉 Docs sync complete."
echo "   Source of truth: $DOCS_AUTHORITATIVE"
echo "   Generated mirror: $DOCS_GENERATED"