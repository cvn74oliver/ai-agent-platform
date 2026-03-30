#!/bin/zsh
set -euo pipefail

AGENT_ID="${AGENT_ID:-d256b48e-5acf-4b3d-af22-003d52e7e582}"
CLUSTER_ID="${CLUSTER_ID:-subscription-senders}"
OUTPUT_DIR="${OUTPUT_DIR:-/tmp/runtime-selected-cluster-rail-family}"

SUPABASE_URL="$(rg '^NEXT_PUBLIC_SUPABASE_URL=' .env.local -N --no-line-number | cut -d= -f2-)"
SERVICE_KEY="$(rg '^SUPABASE_SERVICE_ROLE_KEY=' .env.local -N --no-line-number | cut -d= -f2-)"

mkdir -p "$OUTPUT_DIR"

curl_json() {
  local endpoint="$1"
  local output_path="$2"
  shift 2
  echo "fetching ${endpoint}" >&2
  curl -s --fail --max-time 20 --get "${SUPABASE_URL}/rest/v1/${endpoint}" \
    -H "apikey: ${SERVICE_KEY}" \
    -H "Authorization: Bearer ${SERVICE_KEY}" \
    "$@" > "$output_path"
}

curl_json "agents" "$OUTPUT_DIR/agents.json" \
  --data-urlencode "select=id,user_id" \
  --data-urlencode "id=eq.${AGENT_ID}"

USER_ID="$(jq -r '.[0].user_id // empty' "$OUTPUT_DIR/agents.json")"
if [[ -z "$USER_ID" ]]; then
  echo "agent_lookup_failed" >&2
  exit 1
fi

curl_json "profiles" "$OUTPUT_DIR/profiles.json" \
  --data-urlencode "select=tenant_id" \
  --data-urlencode "id=eq.${USER_ID}"

TENANT_ID="$(jq -r '.[0].tenant_id // empty' "$OUTPUT_DIR/profiles.json")"
if [[ -z "$TENANT_ID" ]]; then
  echo "tenant_lookup_failed" >&2
  exit 1
fi

curl_json "agent_events" "$OUTPUT_DIR/agent_events.json" \
  --data-urlencode "select=payload,created_at" \
  --data-urlencode "agent_id=eq.${AGENT_ID}" \
  --data-urlencode "event_type=eq.runtime_cleanup_discovery_snapshot" \
  --data-urlencode "order=created_at.desc" \
  --data-urlencode "limit=200"

curl_json "gmail_artifact_publications" "$OUTPUT_DIR/gmail_artifact_publications.json" \
  --data-urlencode "select=*" \
  --data-urlencode "tenant_id=eq.${TENANT_ID}" \
  --data-urlencode "order=analysis_scope.asc"

PUBLISHED_SCOPES_IN="$(jq -r '[.[] | select(.published_version != null and .published_version != "") | .analysis_scope] | unique | "in.(" + join(",") + ")"' "$OUTPUT_DIR/gmail_artifact_publications.json")"
PUBLISHED_VERSIONS_IN="$(jq -r '[.[] | select(.published_version != null and .published_version != "") | .published_version] | unique | "in.(" + join(",") + ")"' "$OUTPUT_DIR/gmail_artifact_publications.json")"

if [[ "$PUBLISHED_SCOPES_IN" == "in.()" || "$PUBLISHED_VERSIONS_IN" == "in.()" ]]; then
  printf '[]' > "$OUTPUT_DIR/gmail_cluster_summaries.json"
  printf '[]' > "$OUTPUT_DIR/gmail_sender_workspace_seed_headers.json"
else
  curl_json "gmail_cluster_summaries" "$OUTPUT_DIR/gmail_cluster_summaries.json" \
    --data-urlencode "select=*" \
    --data-urlencode "tenant_id=eq.${TENANT_ID}" \
    --data-urlencode "analysis_scope=${PUBLISHED_SCOPES_IN}" \
    --data-urlencode "artifact_version=${PUBLISHED_VERSIONS_IN}"

  curl_json "gmail_sender_workspace_seed_headers" "$OUTPUT_DIR/gmail_sender_workspace_seed_headers.json" \
    --data-urlencode "select=*" \
    --data-urlencode "tenant_id=eq.${TENANT_ID}" \
    --data-urlencode "cluster_id=eq.${CLUSTER_ID}" \
    --data-urlencode "analysis_scope=${PUBLISHED_SCOPES_IN}" \
    --data-urlencode "artifact_version=${PUBLISHED_VERSIONS_IN}"
fi

printf '%s\n' "$OUTPUT_DIR"
