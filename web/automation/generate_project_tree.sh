#!/usr/bin/env bash
# generate_project_tree.sh
#
# Generates a project tree (excluding heavy/ephemeral dirs) and writes it to:
#   ai-agent-platform-docs/project_structure.txt   (SOURCE OF TRUTH)
#
# The docs sync automation mirrors this into:
#   web/docs/project_structure.txt
#
# Do NOT manually edit web/docs/project_structure.txt

set -euo pipefail

# Resolve absolute paths reliably, regardless of current working directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

OUT="$REPO_ROOT/ai-agent-platform-docs/project_structure.txt"

# Ensure destination folder exists
mkdir -p "$(dirname "$OUT")"

# `tree` must be installed (macOS: `brew install tree`)
if ! command -v tree >/dev/null 2>&1; then
  echo "❌ Error: 'tree' is not installed. Install with: brew install tree"
  exit 1
fi

# Generate tree
# -L 6 gives a useful overview without exploding output size
# Exclude: node_modules, .git, .DS_Store, .next, backups (optional), and other bulky build dirs
cd "$REPO_ROOT"
tree -L 6 -I "node_modules|.git|.DS_Store|.next|backups" > "$OUT"

echo "✅ Project structure updated and saved to: $OUT"
echo "ℹ️ Next step: run ./automation/sync_docs_to_github.sh to mirror docs into web/docs/"