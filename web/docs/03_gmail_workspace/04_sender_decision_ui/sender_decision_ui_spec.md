

# Sender Decision UI (Actual Build Spec)

## 1. Purpose

This document defines the exact UI behavior and structure for the **Sender Decision Experience**.

This is the core interaction layer of the product.

Goal:
- Make decisions **fast, intuitive, and low-friction**
- Mimic **Tinder-style flow**
- Reduce cognitive load
- Maximize throughput of sender classification

---

## 2. Entry Point

User flow:

1. User selects a **Cleanup Group**
2. Lands on **Sender Overview Dashboard**
3. Sees:
   - Total senders
   - Email volume
   - Category distribution
   - Machine vs Human signals
4. User clicks:

👉 **"Start Reviewing Senders"**

This transitions into **Decision Mode**

---

## 3. Modes

### 3.1 Overview Mode (Default)
- Data-rich dashboard
- Charts + analytics
- No decisions made here

### 3.2 Decision Mode (Primary Experience)
- Full-screen focus mode
- One sender at a time
- Background dimmed
- No distractions

---

## 4. Layout: Decision Mode

## Structure

```
--------------------------------------------------
| Sender Card (Centered)                         |
|                                                |
|  [Hero Image / Logo]                           |
|  Sender Name                                   |
|  Short Description                             |
|                                                |
|  Signals + Stats                               |
|                                                |
|  Expandable Email Categories                   |
|                                                |
|  Action Buttons                                |
--------------------------------------------------
```

---

## 5. Sender Card Components

### 5.1 Hero Section
- Sender logo / avatar
- Fallback: generated initials icon

### 5.2 Identity Block
- Sender name (bold)
- Email domain
- AI-generated description:
  - Example: "Weekly marketing emails from Nike"

---

### 5.3 Signal Indicators

Display as badges:

- Machine Likely (%)
- Human Likely (%)
- Promotions
- Updates
- Alerts

---

### 5.4 Stats Row

- Total emails from sender
- Frequency (daily / weekly / occasional)
- Last seen timestamp

---

### 5.5 Category Breakdown (Expandable)

Each sender grouped into categories:

Example:
- Promotions
- Updates
- Transactions
- Alerts

Each category block:
- Title
- Count
- Expand toggle

When expanded:
- Show sample emails (3–5)
- Subject lines
- Snippet preview

---

## 6. Core Decision Actions

User must choose ONE:

### Buttons (fixed at bottom)

1. ✅ **Keep All**
2. ⚖️ **Keep Some**
3. 📦 **Archive All**
4. ❓ **Not Sure**

---

## 7. Decision Behavior

### Keep All
- Sender added to **Keep Bucket**
- No Gmail action needed

---

### Keep Some
- Sender added to **Custom Rules Bucket**
- Will require category-level decisions later

---

### Archive All
- Sender added to **Archive Bucket**
- Will be executed later

---

### Not Sure
- Sender added to **Quarantine Bucket**
- Deferred decision

---

## 8. Navigation Flow

After ANY decision:

➡️ Immediately load next sender

No confirmation screens  
No modal interruptions  
No delays  

---

## 9. Progress System

### Top Progress Bar

- % complete
- Example:
  - "23 / 120 senders reviewed"

### Optional:
- Estimated time remaining

---

## 10. Exit Behavior

User can exit Decision Mode anytime:

- Progress is saved
- Returns to Overview Mode

---

## 11. Completion State

When all senders processed:

Show completion screen:

- "You're done 🎉"
- Summary:
  - X kept
  - X archived
  - X needs review

CTA:
👉 "Go to Management"

---

## 12. Secondary Flow: Custom Rules (Keep Some)

When user enters Management:

User selects "Review Custom Rules"

Flow mirrors Decision Mode:

### Differences:

- Now reviewing **categories inside a sender**
- Instead of 4 buttons:
  - 👍 Keep
  - 👎 Archive

Per category

---

## 13. Performance Requirements

- Instant transitions (<100ms)
- Preload next sender
- No visible loading between decisions

---

## 14. Design Principles

- One decision at a time
- No clutter
- No multi-select lists
- No tables
- No scrolling overload

This is NOT an inbox UI  
This is a **decision engine UI**

---

## 15. Future Enhancements (Optional)

- Swipe gestures (mobile)
- Keyboard shortcuts:
  - A = Keep All
  - S = Keep Some
  - D = Archive
  - F = Not Sure
- AI confidence hints

---

## 16. Summary

This UI is:

- Fast
- Focused
- Addictive
- Scalable

It converts:

👉 Complex inbox chaos  
into  
👉 Simple binary decisions

This is the core engine of the product.