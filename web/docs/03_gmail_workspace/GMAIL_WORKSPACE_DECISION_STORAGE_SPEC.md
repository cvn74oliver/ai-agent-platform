

# Gmail Workspace Decision Storage Specification

## Purpose
This document defines how **sender decisions are stored, surfaced, and modified** inside the Gmail Workspace cleanup system.

The goal is to ensure that decisions made during Phase 1 cleanup are:

- Reversible
- Transparent
- Inspectable
- Editable
- Safe from accidental permanent actions

This spec introduces the **Decision Storage Layer**, which records operator intent separately from Gmail execution.

---

# Core Design Principle

Gmail Workspace operates on **two distinct layers**:

1. **Immediate Actions (Phase 1)**
2. **Stored Intent (Future Automation)**

Phase 1 executes **only archive actions**. All other decisions are stored for later automation.

This prevents destructive automation while the system is still learning the user's behavior.

---

# Decision Types

Every sender decision must be stored with a `decision_type` field.

Possible values:

```
archive_now
keep
quarantine
unsubscribe
custom_rule
undecided
```

Meaning of each:

| Decision | Gmail Action | Storage Behavior |
|--------|--------------|------------------|
| archive_now | Removes INBOX label immediately after approval | Permanent log |
| keep | No Gmail action | Stored preference |
| quarantine | No Gmail action in Phase 1 | Stored quarantine intent |
| unsubscribe | No Gmail action in Phase 1 | Stored unsubscribe intent |
| custom_rule | No Gmail action in Phase 1 | Stored rule template |
| undecided | No action | Sender left untouched |

---

# Sender Decision Object

Each decision is stored as a **sender decision record**.

Example structure:

```
{
  sender_email: "newsletter@example.com",
  decision_type: "quarantine",
  cluster_id: "subscription_senders",
  snapshot_version: "2026-03-15T10:12",
  message_count: 120,
  protected_count: 5,
  last_seen: "2026-03-14",
  decision_timestamp: "2026-03-15T11:02",
  created_by: "user"
}
```

Important fields:

| Field | Purpose |
|------|--------|
| sender_email | canonical sender |
| decision_type | action selected |
| cluster_id | cluster where decision was made |
| snapshot_version | cleanup analysis snapshot |
| message_count | total messages impacted |
| protected_count | protected message exclusions |
| decision_timestamp | audit log |

---

# Decision Persistence Rules

Decisions must persist across:

- Page navigation
- Page refresh
- Session restart
- Cluster re-entry

Persistence layers:

1. **Local Draft Layer**
   - sessionStorage
   - stores in-progress decisions

2. **Server Decision Layer**
   - database storage
   - persists confirmed decisions

Draft decisions should automatically restore when returning to a cluster.

---

# Partial Completion Behavior

Clusters **do not need to be fully processed** before approval.

Example:

```
Cluster: Subscription Senders
Total Senders: 520

Decisions Made: 5
Undecided: 515
```

System behavior:

- Archive decisions execute
- Other decisions stored
- Undecided senders remain untouched

Cluster remains available for later completion.

---

# Decision Management Interface

Users must have access to a **Decision Management Panel**.

This allows them to review and modify stored decisions.

Planned views:

## Quarantined Senders
List of senders marked for quarantine.

Actions:

- Remove quarantine
- Convert to archive
- Convert to custom rule

---

## Unsubscribed Senders
List of senders marked for unsubscribe automation.

Actions:

- Remove unsubscribe
- Convert to archive
- Convert to custom rule

---

## Keep Preferences
Senders explicitly protected by the user.

Actions:

- Remove protection

---

## Custom Rules
User-defined sender policies.

Actions:

- Edit rule
- Disable rule
- Delete rule

---

# Quarantine Concept

Quarantine is a **soft archive queue**.

Meaning:

- Messages remain archived
- Sender behavior is monitored
- Messages can be restored if needed

This creates a reversible safety layer.

---

# Audit Logging

Every decision change must generate an audit event.

Example:

```
{
  event_type: "sender_decision_changed",
  sender: "newsletter@example.com",
  previous_decision: "quarantine",
  new_decision: "keep",
  timestamp: "2026-03-15T11:40"
}
```

This enables full decision history tracking.

---

# Phase Scope

Decision Storage is introduced during:

**Phase 2 — Automation & Policy Layer**

Phase 1 only stores decisions and executes archive approvals.

No automation rules run automatically yet.

---

# Future Extensions

Later phases may include:

- automatic unsubscribe execution
- quarantine review dashboards
- rule automation
- sender reputation scoring

These features depend on the decision storage foundation defined in this document.

---

# Summary

Decision Storage ensures that Gmail cleanup remains:

- reversible
- transparent
- safe
- editable

It transforms the cleanup system from a destructive inbox tool into a **long‑term email intelligence system**.