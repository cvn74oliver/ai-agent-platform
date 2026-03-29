

# Cleanup Groups Discovery Spec (Artifact-Driven)

## Purpose
This spec defines how Cleanup Groups should be rediscovered and restructured now that the Gmail workspace has materially better evidence than the early prototype phase.

The original cleanup groups were useful scaffolding, but they were created from a small and incomplete sample before full mailbox indexing, artifact publication, and semantic rollups were mature. They should no longer be treated as fixed truth.

This document locks the next-phase direction:
- reevaluate all cleanup groups from current artifact truth
- preserve the strongest parts of the current parent-lane framework
- promote groups that are genuinely useful
- demote or replace groups that only survived because the original data was weak
- keep the resulting model transferable to future workspaces beyond Gmail

---

## Core Product Principle
Cleanup Groups are not sacred.

They are a discovery and decision-routing layer. That means they must be allowed to change when the evidence improves.

The new source of truth is not:
- early Gmail heuristics
- old manually named buckets
- historical convenience groupings

The new source of truth is:
- current indexed mailbox coverage
- published artifact outputs
- semantic family and subtype structure
- operator usefulness at the parent, child, and workflow level

---

## What Must Be Reevaluated
This phase must explicitly reevaluate all of the following:

1. **Lanes**
   - Are the current top-level lanes actually the best operator framing?
   - Should some current lanes remain structural only?
   - Should some lanes be split, collapsed, renamed, or replaced?

2. **Buckets**
   - Are the current groups coherent enough to justify their own bucket?
   - Are some current buckets too mixed, too broad, or too weak to remain surfaced?
   - Are there stronger new buckets that should exist now that artifact truth is available?

3. **Cleanup groups**
   - Are the currently surfaced groups the right ones?
   - Are some current groups merely leftovers from an earlier poor-data era?
   - Which groups should be semantic parents, structural lanes, secondaries, or hidden/compatibility only?

4. **Parents and sub-parents**
   - What should become a true parent?
   - Which parents require internal decomposition?
   - Which sub-parents are durable semantic units versus runtime/operator convenience units?

---

## What We Keep From The Current Direction
This rediscovery phase does **not** mean throwing away the good thinking already developed.

The current framework already introduced several strong ideas that should be preserved and refined:
- parent-lane thinking instead of flat equal-weight groups
- structural vs semantic distinction
- operator-first routing instead of taxonomy for taxonomy’s sake
- review-unit decomposition inside large groups
- secondary artifact groups that stay openable without being equal-weight starts
- a framework that can generalize to other workspaces beyond Gmail

So the goal is:
- **keep the framework**
- **replace weak assumptions inside the framework**
- **rerun discovery from better data**

---

## Discovery Questions This Phase Must Answer
The implementation lane should produce clear answers to these questions:

### A. Top-level shape
- What are the best top-level parent lanes for the current mailbox?
- Which of those are true semantic parents?
- Which are structural lanes for safety, coverage, backlog, or special handling?
- Which current surfaced groups should be demoted or removed from equal-weight status?

### B. Group validity
- Which current cleanup groups are still justified by current artifact truth?
- Which current groups only existed because the original sample was too small or noisy?
- Which groups should be renamed because the current label no longer matches the evidence?

### C. Internal decomposition
- Which large groups need sub-parents or review units?
- Are those children true semantic children, descriptive family slices, or operator-only helper views?
- What is the cleanest operator path from parent -> focused unit -> sender workflow?

### D. Future transferability
- Which parts of the model are Gmail-specific?
- Which parts are generic enough to become a reusable workspace framework?
- What vocabulary and data contracts should remain generic so this can later apply to investment, accounting, crypto, Facebook ads, and other workspaces?

---

## Proposed Phases

## Phase 1 — Artifact-Driven Rediscovery
Goal: inspect the current mailbox as if the old cleanup groups do not deserve trust by default.

This phase should:
- reevaluate the entire cleanup-group universe from current artifact and semantic evidence
- identify which current groups remain valid
- identify which current groups are outdated or misleading
- identify candidate new parents, structural lanes, and sub-parents
- produce a proposed end-state map from evidence, not from legacy naming

Deliverable:
- a discovery map showing proposed top-level parents, structural lanes, secondaries, and required decompositions

---

## Phase 2 — Parent / Child Model Redesign
Goal: formalize the best cleanup-group structure for the current mailbox while keeping the framework reusable.

This phase should define:
- final parent-lane model
- semantic parent criteria
- structural lane criteria
- secondary group criteria
- sub-parent / review-unit rules
- promotion / demotion rules
- compatibility rules for legacy groups or IDs if needed

Deliverable:
- a formal artifact-driven cleanup-group model spec

---

## Phase 3 — Runtime and UI Surface Update
Goal: express the new cleanup-group model clearly in the product.

This phase should:
- update Cleanup Groups surface wording and sections
- ensure parent cards and child paths feel obvious
- preserve decision momentum for operators
- make the structure understandable even for users who do not know the internals
- keep the system generic enough for later workspace reuse

Deliverable:
- updated Cleanup Groups product surface and runtime behavior

---

## Phase 4 — Workflow Integration
Goal: make the redesigned grouping system useful throughout the sender workflow.

This phase should connect the new structure into:
- Sender Overview
- Decision Mode
- chart-driven narrowing
- future sender distribution chart interactions
- future chart-to-workspace handoff behavior

Deliverable:
- a consistent path from discovery -> chart/filter -> focused group -> sender workflow

---

## Phase 5 — Generalized Workspace Pattern
Goal: extract the reusable framework from the Gmail implementation.

This phase should define what parts of the grouping model are generic, such as:
- parent lanes
- semantic parents
- structural lanes
- operator sub-views
- chart-driven narrowing
- evidence-backed routing into the workflow

Deliverable:
- generalized workspace decision-group pattern that can be reused in other workspaces

---

## Current Product Direction To Preserve
The following current concepts are still considered strong and should be preserved unless evidence disproves them:

- one or more **semantic parents** when the artifact truth strongly supports them
- **structural lanes** for coverage, trust, backlog, or exceptions
- **secondary artifact groups** that remain accessible but are not equal-weight starts
- **decomposition** for large or umbrella-like parents
- **review units** as operator aids rather than automatically persisted taxonomy
- clear separation between:
  - durable artifact truth
  - runtime/operator convenience structure

---

## Constraints
This lane must stay disciplined about what it is and is not doing.

### It should do
- reevaluate current groups from better data
- improve the cleanup-group model
- preserve the best parts of the framework
- plan for future workspace reuse

### It should not do
- blindly preserve bad early groups just because they already exist
- hard-code Gmail-only assumptions into the long-term model
- confuse operator helper views with durable artifact truth
- turn every small pattern into a top-level surfaced parent
- optimize only for the current mailbox while breaking framework transferability

---

## Success Criteria
This phase is successful when:
- the new cleanup-group model is clearly better than the original heuristic grouping
- large mixed groups are no longer accepted without reevaluation
- parent and sub-parent structure is evidence-backed
- the resulting design feels more intuitive to operators
- the framework is visibly reusable for future workspaces
- the team has a clear phased map for how to move from rediscovery to implementation

---

## Immediate Next Step
Start the cleanup-group rediscovery thread with a plan-first pass that:
- reevaluates all current cleanup groups from artifact truth
- tests whether the current parent lanes are still the best ones
- proposes improved parents, sub-parents, structural lanes, and secondaries
- preserves the strongest ideas from the current framework while replacing weak early assumptions