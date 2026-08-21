# PRODUCT ROADMAP — AUTOMATA

## Purpose

Define the **end-to-end build sequence** for Automata so development stays:
- focused
- ordered
- non-regressive
- scalable

This roadmap ensures we:
- finish systems fully before expanding
- avoid rework and drift
- build a true platform (not a one-off product)

---

# CORE PRODUCT VISION

Automata is a system that transforms:

```text
Data → Artifacts → Decisions → Actions → Learning → Repeat
```

This loop must work:
- for Gmail
- for any workspace
- for any future data system

---

# PHASED ROADMAP

---

## AUTOMATA REVIVAL CHARTER — ACTIVE BASELINE (2026-08-15)

The renewed product sequence is:

1. **Secure and rebaseline** — contain exposed sessions/credentials, harden privileged routes, move to a patched framework baseline, adjudicate deployment ownership, reconcile schema truth, and establish a safe code baseline.
2. **Finish one Gmail closed loop** — make the mature reference vertical complete from data through action and feedback.
3. **Build the governed learning substrate** — introduce an auditable model-training and feedback lifecycle only after the reference loop is trustworthy.
4. **Build the executable workspace compiler / visual builder** — generalize proven system contracts into configurable executable workspaces.
5. **Validate a second domain** — prove portability beyond Gmail before broader scaling.
6. **Add broader multi-agent company hierarchy** — introduce organizational agent hierarchy only after the substrate and second-domain proof exist.

Current product reality:
- Gmail is the mature reference vertical, not proof that the full generalized platform exists.
- The generalized visual builder is not yet implemented.
- The governed model-training lifecycle is not yet implemented.
- The broader multi-agent company hierarchy is not yet implemented.
- The pre-revival phase descriptions below are retained as historical product design detail. Where sequencing conflicts, this revival charter governs.

---

## 🔹 PHASE 1 — GMAIL SYSTEM COMPLETION (PRE-REVIVAL PRODUCT DESIGN)

### Goal

Build one **fully working intelligent operational system**.

This is the reference implementation for everything else.

---

### Components

- Mailbox Intelligence
- Cleanup Groups
- Sender Overview
- Decision Mode
- Management Layer
- Artifact Engine (IN PROGRESS)
- UI Completion (Sender Overview, Decision Mode, Management)

---

### Current Focus

- Fix artifact accuracy
- Complete marketing decomposition
- Ensure semantic truth is reliable
- Eliminate fallback / “unknown” buckets
- Finalize Sender Overview UI
- Finalize Decision Mode UI
- Finalize Management UI

---

### Exit Criteria

- Data is trustworthy
- Buckets are meaningful
- Decisions are actionable
- UI reflects real truth
- No regressions
- End-to-end workflows feel natural and complete
- UI is validated as stable before enabling learning loop

---

### Phase 1 Breakdown

```text
Phase 1A → Artifact Completion
Phase 1B → UI Completion (Sender / Decision / Management)
```

Note:
- Phase 2 (Intelligence Feedback Loop) must NOT begin until both 1A and 1B are complete.
- The learning system depends on stable workflows and correct UI behavior.

---

---

## 🔹 PHASE 2 — INTELLIGENCE FEEDBACK LOOP

### Goal

### Prerequisite

- Phase 1A (Artifacts) and Phase 1B (UI) must be fully complete and validated.

Connect user interaction → system learning.

---

### System Loop

```text
Operations Panel → Decisions → RAG → LLM → Future Decisions
```

---

### Components

- Decision tracking
- Training signal capture
- RAG integration
- Long-term model learning inputs

---

### Why This Matters

This is what turns Automata from:
- a reporting tool

into:
- an intelligent system that improves over time

---

### Exit Criteria

- User actions influence future outputs
- System adapts to behavior
- Knowledge persists across sessions

---

## 🔹 PHASE 3 — AGENT TRAINING SYSTEM

### Goal

Allow users to shape how agents think and behave.

---

### Components

- RAG editor
- Knowledge ingestion (Drive, PDFs, SOPs)
- Tone / audience / mission settings
- Guardrails and compliance controls

---

### Exit Criteria

- Users can modify agent behavior
- System maintains consistency and safety

---

## 🔹 PHASE 4 — WORKSPACE BUILDER

### Goal

Turn Automata into a platform where users can build systems.

---

### Capabilities

- Create new workspace
- Connect data sources
- Define artifacts
- Define decisions
- Define automations

---

### Key Principle

Workspaces are built from:

```text
Data → Artifacts → Decisions → Actions
```

---

### Exit Criteria

- User can create a working workspace from scratch
- System builds operations panel automatically

---

## 🔹 PHASE 4.5 — GMAIL REVERSE ENGINEERING

### Goal

Reconstruct Gmail system inside the Workspace Builder.

---

### Purpose

- Validate builder accuracy
- Create reference template
- Show users what “good” looks like

---

### Outcome

Gmail becomes the **gold-standard workspace template**.

---

## 🔹 PHASE 5 — SECOND DOMAIN VALIDATION

### Goal

Prove system works beyond email.

---

### Example

- Tax / bookkeeping workspace

---

### What Changes

- Different data structure
- Different artifacts
- Different decisions

---

### What Must Stay The Same

- Artifact engine logic
- Decision framework
- Operations panel behavior

---

### Exit Criteria

- System works in a non-email domain
- Artifacts adapt correctly
- Decisions remain meaningful

---

## 🔹 PHASE 6 — BETA RELEASE

### Goal

Release Automata as a functional product.

---

### Requirements

- Gmail system complete
- Training loop active
- Workspace builder working
- At least one additional domain validated

---

### Outcome

- Ready for real users
- Ready for feedback
- Ready for scaling

---

# ARTIFACT STRATEGY (IMPORTANT)

## Gmail Phase

- Fully refine artifacts for Gmail
- Ensure truth and usability

## Structural vs Richer Artifacts (Execution Rule)

- Structural artifacts (families, subtypes, semantic rollups, cleanup groups) must be completed and validated before UI completion.
- Richer artifacts (deep trust breakdowns, advanced pattern_mix views, human vs automated analytics, secondary signals) are **deferred** until after the core Gmail workflow is usable end-to-end.

Rationale:
- The UI must be built on stable, trustworthy structural data.
- Richer signals are valuable, but not required for first real system use.
- Exposing all signals too early increases rebuild cycles and delays completion.

Execution rule:
- Finish structural artifacts → Build UI → Validate full workflow → THEN expose richer artifacts.

## After Gmail

Artifacts are:
- **paused (not abandoned)**
- used as reference system
- richer artifact exposure and refinement resumes after Phase 1 (Gmail system) is fully usable end-to-end

## Future Phase

Artifacts become:
- universal engine
- adaptable to any workspace

---

# DECISION SYSTEM STRATEGY

Current:
- Gmail-specific decisions

Future:
- reusable decision modules

Examples:
- approve / reject
- categorize
- escalate
- route

---

# AGENT ARCHITECTURE STRATEGY

Layered model:

```text
Worker Agents → Manager Agents → System View
```

---

## Worker Agents
- execute tasks

## Manager Agents
- combine outputs
- make higher-level decisions

## System View
- global visibility

---

# BUILD ORDER RULES

Always follow:

1. Build one system fully
2. Close the learning loop
3. Make it configurable
4. Then scale

Never:
- jump ahead
- build builder before system
- add complexity before stability

---

# CURRENT STATUS

Revival status:

```text
Revival Stage 1 → Security and Rebaseline (ACTIVE)
Next → Approved Security Containment execution packet
```

Product work resumes in this order:

```text
Secure/rebaseline → Gmail closed loop → governed learning → executable builder → second domain → broader hierarchy
```

Note:
- The legacy Phase 1A / Phase 1B status is pre-revival historical context and is not current execution authority.
- Richer artifact surfaces are intentionally deferred until after UI completion and end-to-end workflow validation.
- This prevents rework and ensures artifact exposure is driven by real usage rather than speculation.

---

# BIGGEST RISKS

- over-optimizing artifacts for one dataset
- introducing fake precision
- building UI before data truth
- losing traceability between agents
- scaling before system is stable

---

# SUMMARY

Automata is being built in this order:

1. Gmail system (artifacts + UI)
2. Intelligence loop
3. Agent training
4. Workspace builder
5. Multi-domain validation
6. Beta launch

---

This ensures:
- correctness
- scalability
- long-term maintainability

---

# END
