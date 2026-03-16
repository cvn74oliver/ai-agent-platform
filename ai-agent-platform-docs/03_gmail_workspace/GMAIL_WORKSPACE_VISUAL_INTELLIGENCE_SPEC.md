# Gmail Workspace — Visual Intelligence Specification

## Purpose

This document defines the **visual intelligence layer** for the Gmail Workspace.  
The goal is to ensure every major operational page presents **data + visual interpretation** so users can understand the system state in seconds.

The visual layer should:

- Translate large data sets into **immediate visual insight**
- Reduce cognitive load for operators
- Surface trends and risks automatically
- Support hover, drill‑down, and interactive exploration

Every operational page should follow the pattern:

**Raw Data + Visual Interpretation = Operator Understanding**

---

# Core Visual Design Principles

## 1. Visuals Come Before Tables

Every page should begin with **visual summaries** before long lists of records.

Correct hierarchy:

1. Visual intelligence layer
2. Key metrics
3. Supporting explanation
4. Raw data tables

---

## 2. Interactive Visuals

All charts should support:

• Hover tooltips  
• Highlighting segments  
• Drill‑down navigation  
• Click‑to‑filter behavior

Example:

Hovering a sender category should highlight the corresponding senders in the table below.

---

## 3. Immediate Pattern Recognition

Visuals must answer questions instantly:

- What is happening?
- What matters most?
- Where should I act?

A user should understand the page **in under 3 seconds**.

---

# Visual Components Library

The Gmail Workspace will use a standardized set of visual components.

## Trend Charts

Used for:

• Inbox pressure
• Email arrival rate
• Cleanup progress

Type:

Line or area chart

Hover:

Shows exact values for that date.

---

## Distribution Charts

Used for:

• Sender category breakdown
• Decision type distribution

Type:

Donut or stacked bar chart

Hover:

Shows percentage and sender count.

---

## Progress Charts

Used for:

• Cleanup completion
• Approval queue progress

Type:

Horizontal progress bar

---

## Impact Charts

Used for:

• Noise reduction
• Messages removed from inbox

Type:

Bar chart comparing:

Before cleanup vs after cleanup

---

# Page‑Level Visual Requirements

## 1. Mailbox Intelligence Dashboard

Required visuals:

### Inbox Health Gauge

Shows health score (0‑100).

Visual style:

Semi‑circle gauge.

Color zones:

Red – Critical  
Yellow – At risk  
Green – Healthy

---

### Inbox Pressure Trend

Shows message arrival vs cleanup rate over time.

Chart type:

Line graph.

Hover shows:

• message volume
• cleanup volume

---

### Sender Category Distribution

Donut chart showing:

• subscription senders
• system notifications
• retail/commercial
• social platforms

---

### Noise Reduction Projection

Bar chart showing:

Projected inbox reduction after next action.

---

## 2. Cleanup Groups

Required visuals:

### Candidate Cluster Distribution

Donut chart showing the proportion of senders in each cluster.

### Message Volume by Cluster

Bar chart showing message counts per cluster.

### Risk Signals

Small alert chart showing clusters with protection flags.

---

## 3. Sender Decisions

Required visuals:

### Sender Category Breakdown

Distribution chart of senders currently visible in the cluster.

### Message Volume Histogram

Shows senders grouped by message volume.

### Decision Distribution

Shows how many senders are currently marked as:

Archive  
Keep  
Quarantine  
Unsubscribe  
Custom rule

---

## 4. Confirmation

Required visuals:

### Execution Impact Preview

Bar chart showing:

Messages currently visible vs messages removed after approval.

### Decision Summary

Donut chart summarizing decision types in this approval.

---

## 5. Management Dashboard

Required visuals:

### Destination State Overview

Donut chart showing number of senders in:

Keep  
Archive  
Quarantine  
Unsubscribe  
Custom Rule

---

### Execution Status

Bar chart showing:

Succeeded  
Deferred  
Failed  
Not applicable

---

### Decision Activity Timeline

Line chart showing decision activity over time.

---

### Automation Opportunity Signals

Visual highlighting patterns where rule automation is possible.

---

# Interaction Behavior

Charts should support:

Hover → reveal detail  
Click → filter below table  
Legend toggle → hide/show categories

Example:

Clicking the "Archive" segment filters the sender list to archive senders.

---

# Visual Layout Pattern

Every page should follow the same structure.

```
Page Header

Visual Intelligence Layer

Key Metrics

Operational Actions

Raw Data Table
```

This consistency ensures users always know where to look.

---

# Performance Requirements

Visual components must:

• render under 100ms on warm load
• reuse cached datasets
• avoid triggering additional backend queries

Charts should be derived from **already‑loaded page data**.

---

# Future AI Intelligence Layer

Later phases will allow the AI agent to:

• highlight anomalies
• predict inbox risk
• recommend automation rules
• suggest next actions

These AI signals will appear visually on charts as:

• highlighted segments
• alert markers
• recommended action overlays

---

# Summary

The visual intelligence layer transforms the Gmail Workspace from a data viewer into an **AI‑assisted decision system**.

Visuals will allow operators to understand inbox state instantly, act confidently, and trust the system’s recommendations.
