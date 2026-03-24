

# Sender Surface Unification Spec

## Purpose

This document defines the unified sender-surface model for Gmail Workspace.

It resolves the previous split between:
- Sender Overview
- Decision Mode

The final product model is:
- ONE sender card system
- TWO modes
  - Overview Mode = exploration / comparison / context
  - Decision Mode = focused execution / one sender at a time

This spec is the canonical bridge between product flow, sender card structure, decision flow, and implementation sequencing.

---

## Core Product Rule

There is only ONE sender decision system.

Users must never experience:
- context loss
- navigation reset
- duplicate card systems
- different sender truths between overview and execution

Instead, the system must behave like this:

```text
Mailbox Intelligence
→ Cleanup Groups
→ Sender Overview (Explore)
→ Click Sender OR Start Guided Review
→ Decision Mode (overlay / focus state)
→ Next → Next → Next
→ Management
```

This creates a continuous "slippery slide" from understanding → decision → completion.

---

## The Problem This Solves

Historically, the product drifted toward two separate surfaces:
- Sender Overview = rich context
- Decision Mode = simplified action screen

That created UX friction:
- users could drill into senders but not act where they were
- entering Decision Mode felt like leaving context and starting over
- Decision Mode risked becoming a second, weaker card system
- overview and execution could diverge in data, layout, and user trust

This spec eliminates that split.

---

## Unified Model

## Mode A — Overview Mode

Purpose:
- explore a cleanup group
- compare senders
- understand patterns
- inspect evidence and signals

Behavior:
- multiple senders visible
- scrollable list
- sender rows may expand for quick context
- user may scan, filter, and compare

Key UX rule:
If a sender is visible in Overview Mode, that sender must be promotable directly into Decision Mode.

---

## Mode B — Decision Mode

Purpose:
- focus attention on one sender
- make a decision
- preserve momentum
- advance quickly through the group

Behavior:
- one sender in focus
- same sender card truth as Overview Mode
- decision actions enabled
- progress visible
- next sender auto-loads after decision

Key UX rule:
Decision Mode is not a new page conceptually.
It is a promoted / focused state of the same sender card.

---

## Shared Sender Card System

The sender card must be shared across both modes.

That means:
- same sender identity
- same signals
- same category truth
- same proof/evidence
- same impact data
- same explanation / AI summary

Decision Mode may add:
- action controls
- progress system
- execution state
- auto-advance behavior

But it must NOT introduce:
- a different sender truth model
- a second card design language
- a second interpretation system

---

## Transition Model

There are only two valid entry paths into Decision Mode.

### 1. Guided Path
User enters a cleanup group, reviews top-level context, and clicks:
- **Start Guided Review**

Result:
- Decision Mode begins with the first sender in the guided sequence
- system auto-advances through the group

### 2. Direct Path
User is in Sender Overview and clicks a specific sender.

Result:
- Decision Mode opens for that exact sender
- same cleanup group context is preserved
- user does not lose place in the overview list

---

## Overlay / Focus Behavior

Decision Mode should open in-place.

Preferred model:
- overlay or focus-state promotion above Sender Overview

Required behaviors:
- no full navigation reset
- no disconnected page transition
- same cleanup group remains active
- exit returns user to same scroll position / same location in overview

This is essential to preserve momentum and trust.

---

## Relationship Between Surfaces

### Mailbox Intelligence
Role:
- explains the whole mailbox
- introduces candidate universe vs protected context
- sets up why cleanup groups exist

### Cleanup Groups
Role:
- define the lane the user is entering
- explain the group story
- provide cluster-level context and expectations

### Sender Overview
Role:
- context layer
- helps user understand who is inside the chosen group
- provides scan/compare/drill-down behavior

### Decision Mode
Role:
- execution layer
- converts sender understanding into an explicit decision

### Management
Role:
- destination for decisions
- where actions, approvals, and rule outputs become operational

---

## Protected / Trusted Senders

Protected / Trusted Senders must be modeled as a first-class cleanup group, not as a separate explanation page.

Why:
- users should not have hidden sender populations with no visible explanation
- protected senders are still part of inbox understanding
- users may still want to override the system’s recommendation

This group should explain:
- why senders were protected
- which signals caused protection
- why they are outside the standard cleanup candidate universe

And it should still support sender-level inspection and decision override.

---

## Data Responsibilities

### Overview Mode prioritizes:
- comparison
- scanability
- pattern recognition
- group understanding

### Decision Mode prioritizes:
- action clarity
- proof visibility
- progress
- low-friction execution

The data is the same.
The presentation priority changes.

---

## Non-Negotiable Rules

- No separate decision card system may be introduced.
- No sender may require a page/context reset just to be decided.
- No different data/truth layer may exist between Overview and Decision modes.
- If a sender is in focus, a decision must be available.
- Guided review and direct sender click must converge into the same Decision Mode system.
- Decision Mode must preserve cleanup group context.
- Returning from Decision Mode must restore user context in Sender Overview.

---

## Recommended Build Sequence

### Phase L1 — Unified Sender Card Foundation
- define shared sender card contract
- confirm same data model for both modes

### Phase L2 — Sender Overview Layout
- strengthen top context section
- improve sender list rows and group explanation

### Phase L3 — Decision Mode Overlay
- implement promoted/focused sender card
- attach decision actions and progress system

### Phase L4 — Transition + Flow Logic
- click sender → open exact sender in Decision Mode
- Start Guided Review → launch first sender in guided sequence
- exit → return to same overview position

### Phase L5 — Protected / Trusted Senders Group
- expose hidden protected universe as first-class cleanup group

### Phase L6 — UX Polish
- validate slippery-slide behavior end to end
- remove friction and competing priorities

---

## Supersession Note

This spec supersedes any older interpretation that treated Sender Overview and Decision Mode as separate systems.

Older docs may still contain useful implementation details, but when conflicts exist, this unified sender-surface model wins.

---

## Final Product Statement

The Gmail Workspace sender experience is:
- one sender card system
- two modes
- one continuous workflow

Users should feel like they are moving deeper into the same system:
- from map
- to focus
- to action
- to completion

Not switching tools.