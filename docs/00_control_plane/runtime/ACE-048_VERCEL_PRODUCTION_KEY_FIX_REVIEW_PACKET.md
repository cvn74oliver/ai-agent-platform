# ACE-048 Vercel Production Service-Key Fix — Review Packet

Date: 2026-09-02
Decision: `ACCEPT VERCEL PRODUCTION KEY FIX`
Execution mode: `transitional_self_verification`
Problem class: runtime configuration
Verdict: `ACCEPT / HIGH`

## Executive summary

- What changed: the existing project-matched Supabase service-role key was added as a secret to the canonical Automata Vercel Production environment, then the exact current `main` build was redeployed.
- What the operator gets: the production Gmail-memory API can create its server-side Supabase client again, while the accepted Gmail UI and framework source remain unchanged.
- Why it matters: the framework release was healthy, but one missing production-only secret caused the live route to fail after deployment.

## Locked target and scope

- Canonical Vercel project: `ai-agent-platform`
- Project ID: `prj_L3V4M23PH0qlNcI4AMxkFlpZNQcz`
- Canonical domain evidence: `orinexlabs.com`, `www.orinexlabs.com`
- Variable: `SUPABASE_SERVICE_ROLE_KEY`
- Variable type/scope: Vercel Secret, Production only
- Source deployment: `dpl_GhZjLHzANCnP5ciSoMRpubzuvFwM`
- Source commit: `bf9f401c5fa9fc76170e8303c47a298a351990b9` on `main`
- Redeploy: `dpl_Aa2BVRAZAwwCwLQtTYeCmf9UVSTt`

Excluded and unchanged: Preview variables; duplicate project `ai-agent-platform-e6cc`; domains; Git source; routes; UI; requests/polling/cache/lifecycle logic; Gmail/provider state; Supabase schema/data; artifacts/publication pointers.

## Diagnosis and correction

The route's server-side client factory requires `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Vercel already had the URL and public anon key, but the canonical Production environment lacked the service-role key. Earlier runtime telemetry recorded seven `GET /api/runtime/gmail-memory` failures through `08:46:48Z`, all reporting `supabaseKey is required`.

The existing local service-role key was validated as belonging to the same Supabase project reference as the configured canonical URL, transmitted without terminal output, saved as a Vercel Secret for Production only, and applied by an exact-source redeploy without build cache.

## Verification

- Deployment identity: `dpl_Aa2BVRAZAwwCwLQtTYeCmf9UVSTt`
- Deployment state: `READY`
- Source identity: `main@bf9f401c5fa9fc76170e8303c47a298a351990b9`
- Alias state: canonical production domains attached; `aliasError=null`
- Exact authenticated production route: `/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/review` with the preserved `structural.unresolved` review-unit query
- Ready-state satisfied: YES
- Ready-state signals: canonical URL retained after reload; settled Decision Workspace content present; no runtime overlay; no `supabaseKey is required` text
- Settle strategy: DOM-content load plus eight-second post-load settle
- Deployment-scoped request proof: two `/api/runtime/gmail-memory` responses at HTTP `200`
- Runtime error proof: no `/api/runtime/gmail-memory` runtime errors found in the verification window
- Guard/load result: no new request family, poller, provider action, data mutation, or repeated retry was introduced
- Verification Confidence: HIGH

## Recovery and closeout

Recovery Contract: `ai-agent-platform-docs/06_system_state/CHANGELOG.md` -> `September 2, 2026 — ACE-048 Vercel Production Service-Key Configuration Accepted`.

Pre-propagation snapshot: `/Users/olivercarlin/Documents/Backups/September 2026/2026-09-02/ai-agent-platform-worktree-8642 (incremental 2 September 2026 - ACE-048 Vercel production key fix before Recovery Contract propagation)`.

Accepted-closeout snapshot: `/Users/olivercarlin/Documents/Backups/September 2026/2026-09-02/ai-agent-platform-worktree-8642 (incremental 2 September 2026 - ACE-048 Vercel production key fix accepted control-plane closeout)`.

Rollback is limited to removing the one Production secret from the canonical project and redeploying the same source. Because that restores the known failing configuration, prefer coordinated key replacement if the key itself must change.

Checkpoint Status: propagation required before closeout. Runtime/configuration work is verified; exact-scope control-plane GitHub publication awaits completion of GitHub's email-backed device verification. Merge and any resulting deployment remain separately gated.
