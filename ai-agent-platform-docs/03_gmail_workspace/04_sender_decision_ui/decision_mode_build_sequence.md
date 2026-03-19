# Decision Mode Build Sequence (Execution Plan)

## Objective
Build the **Sender Decision Mode (Tinder-style flow)** in a safe, staged, non-breaking way.

This is the **core product interaction layer**.

DO NOT:
- touch indexing logic
- modify Gmail sync
- change existing analytics/dashboard behavior
- refactor unrelated UI

This is an **additive, isolated system**.

---

## High-Level Build Strategy
We build in 5 phases:

1. Entry Layer (button + routing)
2. Decision Mode Shell (overlay system)
3. Sender Card (profile UI)
4. Decision Engine (local buffer + state)
5. Management Routing (post-decision flow)

Each phase must be **visually testable before moving on**.

---

## Phase 1 — Entry Layer

### Goal
Add a clear way to enter Decision Mode without breaking the current page.

### Implementation
- On Sender Overview / Cleanup Group page:
  - Add button:
    - Label: `Start Reviewing Senders`

### Behavior
- On click:
  - UI dims / fades
  - Decision Mode overlay activates

### DO NOT
- Remove any existing charts
- Modify existing layout

---

## Phase 2 — Decision Mode Shell

### Goal
Create the isolated interaction layer

### Component
`DecisionModeOverlay`

### Behavior
- Full-screen overlay
- Background dimmed
- Focus locked (no scrolling page behind)

### Structure
```
Overlay
  ├── Progress Bar
  ├── SenderCard
  ├── ActionButtons
```

### UX Details
- subtle zoom-in effect on entry
- smooth fade transitions

---

## Phase 3 — Sender Card (Core UI)

### Goal
Build the “profile card” experience

### Component
`SenderCard`

### Content
1. Sender avatar (logo or fallback)
2. Sender name
3. Short description (auto-generated)
4. Key signals:
   - Human vs Machine
   - Frequency
   - Category mix
5. Expandable sections:
   - Promotions
   - Updates
   - Alerts
   - etc

Each section:
- shows example emails
- expandable preview

---

## Phase 4 — Decision Engine (IMPORTANT)

### Goal
Make interaction fast and frictionless

### Decision Options
1. Keep All
2. Keep Some
3. Archive All
4. Not Sure

### Critical Rule
DO NOT send decisions immediately.

### Implement:
**Decision Buffer System**

```
localBuffer = []

onDecision:
  add to buffer

if buffer.length >= 5:
  send batch to backend
```

### Benefits
- instant UI response
- no lag
- fewer API calls

### After click
- animate card out
- next card slides in

---

## Phase 5 — Management Routing

### Goal
Route decisions into correct buckets

### Mapping
- Keep All → no action
- Keep Some → Custom Rules bucket
- Archive All → Archive bucket
- Not Sure → Quarantine bucket

### Behavior
- No confirmation page
- Direct routing

---

## Phase 6 — Mixed Sender Deep Review

### Trigger
User selects: **Keep Some**

### Flow
- open secondary decision mode
- show categories

For each category:
- Like / Don't Like

### Result
- build rule set
- prepare execution

---

## Phase 7 — Execution Layer (Preview Only for now)

### Goal
Prepare Gmail actions without executing

### Show
- “Ready to archive X emails”
- “Ready to keep Y emails”

### Add
- Execute button
- Undo option

---

## Phase 8 — Completion State

### When all senders processed

Show:
- Completion screen
- Stats
- “Inbox Health Improved”

Then:
- return to dashboard

---

## Safety Rules

DO NOT:
- touch Gmail indexing
- modify mailbox index state
- restart server
- change existing routes

---

## Acceptance Criteria

Before moving forward:

- Can enter Decision Mode
- Cards render correctly
- Decisions feel instant
- Next card loads smoothly
- No crashes

---

## Next Step

After this is implemented:

→ Build animations + gamification layer
→ Add streaks, rewards, progress feedback

---

## Notes

This is the **primary product interaction**.

Everything else supports this.

Build this clean, fast, and focused.
