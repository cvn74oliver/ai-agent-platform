# 📍 AUTHORITATIVE DOCUMENT

This document is the source of truth for all Gmail artifact rebuild planning.

Location:
ai-agent-platform-docs/09_artifact_engine/ARTIFACT_REBUILD_PLAN.md

This file must be updated BEFORE any rebuild is executed.

🔧 ARTIFACT REBUILD PLAN — GMAIL WORKSPACE

Purpose

Define all rebuild-worthy artifact issues and group them into intentional rebuild passes to avoid repeated rebuild cycles.

⸻

🔹 REBUILD A — Structural Preview Seeding Fix (READY)

Problem

Senders with:
	•	large indexed totals
	•	but no_inbox_rows

→ produce:
	•	preview_ready: false
	•	preview_message_ids: 0

Result:
👉 8,000 emails but zero preview evidence

⸻

Root Cause

Preview seeding uses:

scopedInboxRows

But totals use:

scopedRows

Mismatch = broken preview system.

⸻

Fix

IF scopedInboxRows.length === 0:
→ select preview rows from scopedRows using a bounded policy:

- prioritize most recent messages (recency-first)
- cap at a fixed limit (e.g., 5 messages)
- exclude obviously invalid or empty-content rows where possible
- ensure preview index growth remains bounded

Goal:
Preview evidence must exist for high-volume structural senders without exploding artifact size.

⸻

Required Changes
	•	gmailArtifactFullMailboxProjector.ts
	•	gmailArtifactIncrementalUpdater.ts

⸻

Validation Targets
	•	oliver@curativemushrooms.com
	•	support@curativemushrooms.com
	•	consumer@e.mail.realtor.com
	•	seaworld@m.seaworldparks.com

Additional check:
- at least one sender from `historical-out-of-inbox-senders`
- verify structural preview seeding works outside protected group

⸻

Status

👉 READY TO IMPLEMENT + REBUILD

⸻

🔹 REBUILD B — Semantic Focus Performance (PLANNED)

Problem

Clicking semantic subtype:
	•	triggers full_cluster_materialization
	•	cold load = 10–15 seconds

⸻

Root Cause

No persisted membership:
	•	subtype → sender mapping computed at runtime

⸻

Fix Direction

Persist:

sender → semantic_subtype_membership

Then:
	•	filter using artifact
	•	avoid full recompute

Important:
Determine whether performance bottleneck is:
- artifact membership absence (rebuild required)
- runtime materialization inefficiency (no rebuild required)

Do not assume rebuild until classification is complete.

⸻

Required Work
	•	artifact projector
	•	possibly runtime filtering layer

⸻

Status

👉 DESIGN REQUIRED BEFORE IMPLEMENTATION

⸻

🔹 REBUILD C — Semantic Evidence Mapping (NEW)

Problem

Decision Mode shows:
	•	flat preview list

But system already has:
	•	semantic families
	•	subtypes

👉 Not connected to evidence

⸻

Goal

Change:

sender → preview_messages[]

Into:

sender → {
  updates: [],
  invoices: [],
  marketing: [],
  security: [],
}


⸻

Required Investigation
	•	do preview rows carry semantic metadata?
	•	can grouping be derived?
	•	or requires schema change?

⸻

Status

👉 INVESTIGATION REQUIRED (NO BUILD YET)

Note:
This is a structural enhancement, not a bug fix.
Do NOT bundle into Rebuild A.
Must be designed separately to avoid scope explosion.

⸻

🔹 DEFERRED (NOT PART OF CURRENT REBUILDS)
	•	Cleanup group redesign
	•	Taxonomy restructuring
	•	Distribution balancing (99% bucket issues)
	•	Richer artifact exposure
	•	UI changes

⸻

🔹 REBUILD AUDIT ADDITION — Pressure Trend Verification (NEW)

Problem

Pressure Trend may be reading:
- pre-artifact data
- or partially artifact-backed data

Unclear if it is fully aligned with artifact system.

Required Audit

Determine:
- data source for Pressure Trend
- whether it uses artifact outputs or legacy aggregation
- whether rebuild is required for alignment

Classification

Must be categorized as:
- same rebuild (Rebuild A)
- separate rebuild
- no rebuild needed
- audit only

Status

👉 AUDIT REQUIRED (DO NOT INCLUDE IN REBUILD YET)

⸻

🧭 Execution Order
	1. Artifact Rebuild Bundling Audit (complete first)
	2. Implement Rebuild A
	3. Run ONE rebuild
	4. Validate system thoroughly
	5. Continue product work in parallel
	6. Design Rebuild B (performance)
	7. Design Rebuild C (semantic evidence mapping)
	8. Bundle future rebuilds deliberately

⸻

🧠 Key Rule

Never rebuild for one issue.
Always rebuild for a validated bundle.

Rebuild scope must be locked BEFORE execution.
No mid-rebuild scope expansion.

⸻

🚀 2. Execution Roadmap (What happens now)

Here’s how we move forward efficiently.

⸻

🟢 NOW (Parallel Work)

Thread 1 — Codex (Artifact Work)

👉 Rebuild A implementation + rebuild

Thread 2 — You + Me (Product Work)

While rebuild runs:
	•	test flows
	•	identify next runtime/UI issues
	•	validate decision system

⸻

🔵 AFTER REBUILD A

We immediately validate:
	•	Curative senders now show preview evidence
	•	No regression on Amazon / others
	•	No weird preview inflation

⸻

🟡 NEXT (After validation)

We choose next lane:

Option A (likely):

👉 Performance (Rebuild B design)

Option B:

👉 Continue runtime/UI improvements

⸻

⚠️ Important mindset shift

You said something very important:

“I don’t want to get stuck in rebuild mode all day”

Correct.

So here’s the rule:

👉 Rebuild is a lane, not the whole system

We:
	•	run rebuild
	•	keep working elsewhere
	•	come back and validate

⸻