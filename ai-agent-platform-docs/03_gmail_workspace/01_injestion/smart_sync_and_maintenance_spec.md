

# Smart Sync & Maintenance Spec

## 1. Purpose
Smart Sync is the **daily maintenance engine** of the system.

It ensures:
- New emails are captured
- New senders are surfaced for decisions
- Existing rules continue to apply correctly
- The inbox stays clean after initial setup

This is what turns the system from a one-time cleanup tool into a **living, self-maintaining product**.

---

## 2. Core Philosophy

There are two distinct modes in the system:

### Initial Mode (Heavy Work)
- Full indexing
- Historical backfill
- Bulk sender decisions

### Maintenance Mode (Smart Sync)
- Incremental updates only
- Lightweight
- Fast
- Continuous

Smart Sync should:
- NEVER feel heavy
- NEVER restart full scans
- ALWAYS feel instant

---

## 3. What Smart Sync Actually Does

### 3.1 Incremental Inbox Updates
Uses Gmail history API to:
- Detect new messages
- Detect label changes
- Detect new senders

Only processes:
- New messages
- Changed messages

Skips:
- Already indexed unchanged messages

---

### 3.2 Sender Detection
When new messages arrive:

System checks:
- Is sender known?
- Has user made a decision?

If NOT:
➡ Add sender to **"New Senders to Review" queue**

---

### 3.3 Rule Application Engine
For known senders:

Apply existing decisions automatically:

| Decision Type | Action |
|------|--------|
| Keep | Leave in inbox |
| Archive | Move to archive |
| Custom Rules | Apply category-level filtering |
| Quarantine | Hold for review |

---

### 3.4 Maintenance Dashboard Updates
Smart Sync updates:
- Inbox Health Score
- Pressure Trend
- New sender alerts
- Pending actions count

---

## 4. Triggering Smart Sync

### 4.1 Automatic Triggers (Primary)
Smart Sync runs automatically:

- Every X minutes (configurable)
- On app open
- After decisions are completed

Recommended:
- **Light polling (5–15 min)**
- Background sync when app is idle
- Opportunistic sync after user actions
- Silent refresh when returning to tab

Future:
- Webhook-based push updates (if Gmail allows)

---

### 4.2 Manual Trigger (Secondary)

Button: `Smart Sync`

Used when:
- User wants immediate refresh
- After reconnecting Gmail

Behavior:
- Runs incremental only
- Never escalates to full scan

---

## 5. Smart Sync Rules (Critical)

### MUST DO
- Incremental only
- Skip unchanged messages
- Be fast (<2–5 seconds ideal)
- Never block UI

### MUST NOT DO
- Trigger full backfill
- Reset indexing
- Reprocess entire mailbox
- Override user decisions

---

## 6. Smart Sync States

### Running
- Fetching updates
- Applying rules

### Completed
- No issues
- Updated state

### Partial
- Some failures (retry later)

### Failed
- Auth issues
- API issues

---

## 7. Failure Handling

### 7.1 Auth Failure
- Show: "Reconnect Gmail"
- Disable sync buttons

### 7.2 API Failure
- Retry automatically
- Exponential backoff

### 7.3 Partial Failure
- Continue successful parts
- Retry failed subset

---

### 7.4 Rate Limit Protection

System must:
- Detect Gmail rate limits early
- Reduce concurrency dynamically
- Back off intelligently

Behavior:
- Never crash entire sync
- Always degrade gracefully

---

## 8. User Experience Layer

### 8.1 Feedback Messages

Examples:
- "Inbox updated"
- "5 new senders detected"
- "3 emails archived automatically"

---

### 8.2 Reward System (Important)

Smart Sync should reinforce behavior:

- "Your inbox is staying clean"
- "No new clutter today"
- "You're fully up to date"
- "You're moving faster than 90% of users"
- "You're on a decision streak (12 senders in a row)"
- "Inbox clarity score improving"
- "You're maintaining a clean inbox for X days"

#### Identity Reinforcement Layer
The system should reinforce identity, not just actions:
- "You are becoming someone who keeps a clean inbox"
- "You are in control of your communication"
- "You are building a distraction-free environment"

#### Velocity Signals
Track and display:
- Decisions per minute
- Streaks (consecutive decisions without pause)
- Completion bursts

Purpose:
- Encourage flow state
- Reduce hesitation
- Increase completion rate

---

### 8.3 Maintenance Prompts

When needed:

- "You have 4 new senders to review"
- "Quick review?"

CTA → opens Tinder-style flow

---

### 8.4 Flow State Mode

When user enters decision mode:
- Background UI fades
- Focus locks onto one sender at a time
- No distractions
- Immediate transition to next decision

Behavior:
- No loading pauses between profiles
- Preload next sender
- Keep momentum high

Goal:
- Replicate "Tinder-style" rapid decision loop
- Maximize speed and engagement

---

## 9. Integration with Sender Decision Flow

Smart Sync feeds directly into:

➡ Sender Decision Engine

Flow:
1. New sender detected
2. Added to queue
3. User reviews sender
4. Decision saved
5. Smart Sync enforces it automatically

---

## 10. Performance Expectations

### Target Performance
- Sync time: < 2 seconds (ideal)
- Max acceptable: < 5 seconds

### Optimization Strategies
- Batch API calls
- Skip unchanged messages
- Cache sender decisions
- Avoid re-fetching metadata

### Smart Optimization Layer

Additional optimizations:
- Preload sender decisions
- Cache classification results
- Avoid duplicate sender evaluations
- Lazy-load email samples only when expanded

Goal:
- Keep perceived performance instant

---

## 11. Data Model Additions

### Smart Sync State

Fields:
- last_sync_at
- last_history_id
- sync_status
- sync_error

---

### Sender Queue

Fields:
- sender_id
- requires_review
- first_seen_at
- message_count

---

## 12. Future Enhancements

### 12.1 Predictive Filtering
- Auto-suggest decisions

### 12.2 AI Classification
- Auto-label senders before review

### 12.3 Silent Mode
- Fully automated inbox (optional)

### 12.4 Fully Automated Inbox Mode

Optional mode where:
- System auto-applies decisions without user input
- User only reviews exceptions

Target:
- Power users
- Advanced automation

### 12.5 Continuous Learning System

System learns from:
- User decisions
- Reversals (undo actions)
- Engagement patterns

Output:
- Better future suggestions
- Smarter default rules

---

## 13. Summary

Smart Sync is:

- The **heartbeat** of the system
- The **maintenance layer**
- The **automation engine**

Without it:
- System becomes stale

With it:
- Inbox stays clean
- Users stay engaged
- Product becomes habit-forming