# Gmail Workspace Performance Specification

## Purpose

This document defines the **performance requirements and loading strategy** for the Gmail Workspace so that the system remains fast and testable even with extremely large mailboxes.

The current prototype experiences multi‑minute page loads because each route recomputes heavy mailbox analytics. This specification defines how the system must cache, preload, and progressively load data so that the user experience remains responsive.

The goal is:

- Pages should feel **instant (<1 second)** when navigating between workflow stages.
- Heavy analytics should run **once and be cached**, not recomputed on every route.
- Sender review pages should load **incrementally**, not by scanning the entire mailbox.

---

# Core Performance Principles

## 1. Never recompute the mailbox repeatedly

Mailbox analytics must be computed **once per session** and cached.

The following should be cached objects:

- mailbox_intelligence
- sender_universe
- cleanup_clusters
- sender_stats

These should live in the runtime state layer:

```
RuntimeState
 ├─ mailboxIntelligence
 ├─ senderUniverse
 ├─ cleanupClusters
 └─ senderStats
```

Once computed, navigation between:

- Intelligence
- Cleanup Groups
- Sender Decisions

must **reuse the cached runtime state**.

No full mailbox recomputation should occur on page navigation.

---

# Page Performance Requirements

## Mailbox Intelligence

This page performs the **heavy analysis step**.

Allowed operations:

- mailbox analytics
- sender universe computation
- cluster generation

Expected time:

```
First load: up to 5–10 seconds (acceptable)
Subsequent navigation: < 500ms
```

After analysis completes, results must be stored in runtime state.

---

## Cleanup Groups

This page must load instantly.

It should read from cached data:

```
runtime.mailboxIntelligence
runtime.cleanupClusters
```

No mailbox queries should run here.

Expected load time:

```
< 300ms
```

---

## Sender Decisions

Sender review must use **paginated sender loading**.

Do NOT load every sender at once.

Required behavior:

```
Load 50 senders
Render
Lazy load next page when needed
```

Data required per sender:

- sender email
- message count
- last activity
- unread count
- category hints
- preview snippets

Expected load time:

```
< 500ms per page
```

---

## Exceptions / Verification

This page should simply filter senders already loaded in runtime state.

It must NOT query the mailbox again.

Expected load time:

```
< 300ms
```

---

## Confirmation

Confirmation must compute **decision impact** using cached sender policies.

Allowed calculations:

- message totals per decision
- archive impact

Expected load time:

```
< 500ms
```

---

## Rules / Automation

This page should only operate on decision data already captured in the workflow draft.

Expected load time:

```
< 200ms
```

---

## Monitoring

Monitoring reads the memory layer:

- agent_events
- rag_documents

These should already be indexed and should not require mailbox scans.

Expected load time:

```
< 500ms
```

---

# Sender Cluster Design

Two cluster strategies exist. Only one should be implemented.

---

## Option A: Raw Sender Clusters

Clusters are built **directly from senders**.

Example:

Cluster: "Retail Newsletters"

Contains senders:

- nike.com
- amazon.com
- walmart.com

Each sender appears in **only one cluster**.

Advantages:

- No duplication
- Clean mental model
- Easy review

Disadvantages:

- Less flexible categorization

---

## Option B: AI Behavioral Clusters

Clusters are built from **message behavior patterns**.

Example:

Cluster: "Marketing"

Contains messages from:

- nike.com
- amazon.com

But also:

Cluster: "Unread Backlog"

Contains messages from:

- amazon.com
- reddit.com

The same sender can appear in **multiple clusters**.

Advantages:

- richer AI analysis
- more flexible grouping

Disadvantages:

- confusing duplicates
- harder mental model

---

## Recommended Strategy

The Gmail Workspace should implement **Option A: Raw Sender Clusters**.

Reason:

The system is designed to be **sender‑first**, so clusters should also be sender‑based.

The workflow becomes:

```
Mailbox
 → Sender Universe
 → Sender Clusters
 → Sender Decisions
```

Messages remain **evidence only**, not the decision unit.

---

# Caching Strategy

Required caches:

```
Mailbox Intelligence Cache
TTL: 30 minutes

Sender Cluster Cache
TTL: 30 minutes

Sender Page Cache
TTL: session
```

The runtime system must invalidate caches when:

- mailbox index updates
- user reconnects Gmail

---

# Performance Targets

| Page | Target Load |
|-----|-------------|
| Intelligence | 5–10s first load |
| Cleanup Groups | <300ms |
| Sender Decisions | <500ms |
| Exceptions | <300ms |
| Confirmation | <500ms |
| Rules | <200ms |
| Monitoring | <500ms |

---

# Summary

The Gmail Workspace must behave like a **cached analytics system**, not a live mailbox scanner.

Heavy computation happens once.

All workflow stages reuse cached state.

Sender pagination ensures the interface stays responsive even for extremely large mailboxes.
