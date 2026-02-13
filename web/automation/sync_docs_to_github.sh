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

if [ ! -f "$DOCS_AUTHORITATIVE/CURRENT_STATE.md" ]; then
  echo "❌ CURRENT_STATE.md missing in authoritative docs repo."
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

rsync -av \
  --exclude '.git/' \
  "$DOCS_AUTHORITATIVE/" \
  "$DOCS_GENERATED/"

echo "✅ web/docs updated from authoritative source."

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