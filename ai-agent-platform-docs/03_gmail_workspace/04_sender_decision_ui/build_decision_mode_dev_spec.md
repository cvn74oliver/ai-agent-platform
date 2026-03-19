

# Decision Mode (Sender Review) — Dev Build Spec

## 0. Purpose
This spec translates the Decision Mode UX into concrete implementation details.
Goal: enable fast, single-focus sender decisions with a Tinder-style flow.

---

## 1. Entry Flow

### Trigger
- User clicks: `Start Reviewing Senders`

### Effects
- Dim background (global overlay)
- Lock scroll on underlying page
- Mount DecisionModeRoot

```tsx
<DecisionModeRoot groupId={groupId} />
```

---

## 2. Core Component Tree

```tsx
DecisionModeRoot
 ├── DecisionOverlay
 │    ├── ProgressBar
 │    ├── SenderCard
 │    │    ├── SenderHeader
 │    │    ├── SenderInsights
 │    │    ├── EmailCategoryPreview
 │    │    └── ExpandableExamples
 │    ├── DecisionActions
 │    └── ExitControls
```

---

## 3. Data Model (Frontend)

```ts
interface SenderProfile {
  id: string
  name: string
  avatarUrl?: string

  classification: {
    type: 'machine' | 'human'
    confidence: number
  }

  categories: Array<{
    id: string
    name: string
    percent: number
    sampleSubjects: string[]
  }>

  stats: {
    emailCount: number
    frequency: string
  }
}
```

---

## 4. State Management

```ts
const [currentIndex, setCurrentIndex] = useState(0)
const [decisions, setDecisions] = useState<Record<string, Decision>>()

const currentSender = senders[currentIndex]
```

### Decision Types
```ts
type Decision = 'keep_all' | 'keep_some' | 'archive_all' | 'quarantine'
```

---

## 5. Sender Card UI

### Layout
- Top: avatar + name
- Middle: summary + classification
- Bottom: categories preview

### Example

```tsx
<SenderCard>
  <Avatar />
  <SenderName />
  <ClassificationBadge />

  <CategoryList />

  <ExpandableEmailExamples />
</SenderCard>
```

---

## 6. Decision Actions

### Buttons

```tsx
<Button onClick={() => decide('keep_all')}>Keep All</Button>
<Button onClick={() => decide('keep_some')}>Keep Some</Button>
<Button onClick={() => decide('archive_all')}>Archive All</Button>
<Button onClick={() => decide('quarantine')}>Not Sure</Button>
```

### Behavior

```ts
function decide(choice: Decision) {
  setDecisions(prev => ({
    ...prev,
    [currentSender.id]: choice
  }))

  goToNextSender()
}
```

---

## 7. Navigation Logic

```ts
function goToNextSender() {
  if (currentIndex < senders.length - 1) {
    setCurrentIndex(i => i + 1)
  } else {
    completeDecisionSession()
  }
}
```

---

## 8. Animation System

### Card Transition
- Slide out left/right
- Fade next card in

```ts
// pseudo
animate(currentCard, 'exit-left')
animate(nextCard, 'enter-right')
```

### Timing
- 150–250ms max
- Must feel instant

---

## 9. Progress Tracking

```tsx
<ProgressBar
  value={(currentIndex + 1) / totalSenders}
/>
```

Optional:
- "12 / 47 senders reviewed"

---

## 10. Output Mapping

After session:

```ts
{
  keep_all: SenderID[],
  keep_some: SenderID[],
  archive_all: SenderID[],
  quarantine: SenderID[]
}
```

Route:
- keep_some → Management (custom rules)
- archive_all → Archive bucket
- quarantine → Quarantine bucket

---

## 11. Exit Behavior

### Mid-session exit
- Save partial decisions
- Allow resume

```ts
persistSessionState()
```

---

## 12. Performance Requirements

- Preload next sender
- No blocking network calls between decisions
- All data fetched upfront per group

---

## 13. Edge Cases

- Empty sender list → show completion state
- Missing avatar → fallback initials
- Unknown classification → show "Unknown"

---

## 14. Non-Goals (This Pass)

- No gamification system yet
- No backend rule execution
- No Gmail push logic

---

## 15. Acceptance Criteria

- One sender visible at a time
- Decision triggers instant transition
- No layout shift
- Session completes without reload
- Decisions stored correctly

---

## 16. Next Extensions (Future)

- Decision streak system
- Keyboard shortcuts
- Swipe gestures
- Adaptive pacing

---

End of spec