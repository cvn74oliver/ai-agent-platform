# Agent Turnover Readiness Check

## Purpose

This prompt is used to evaluate whether an agent session should:
- continue
- prepare for turnover
- be immediately replaced

This prevents drift, degradation, and wasted cycles.

---

## How To Use

1. Copy the prompt below  
2. Send it to ANY active agent  
3. Review the returned status report

---

## Prompt (COPY / PASTE)

```text
Turnover Readiness Check — Execute Now

Critical rules:
- Your agent name MUST match EXACTLY (including spacing and version suffix, e.g. "AnalysisRail PM v1")
- You MUST search the table and confirm the exact row exists BEFORE editing

Hard constraints:
- Do NOT update the "Primary PM" row unless your exact name is "Primary PM"
- Do NOT update the "Control Plane Architect" row unless that is your role
- Do NOT update any row that is not an exact match

If your row is NOT found:
- STOP immediately
- return: "ROW NOT FOUND — NO UPDATE PERFORMED"
- do NOT edit any part of the file

You are performing a self-assessment of your current operating quality.

Evaluate:

1. Context Clarity
- Are you still operating with a clear, consistent understanding of system state?

2. Drift Risk
- Are you introducing assumptions or inconsistencies?
- Are you relying on chat memory instead of control plane docs?

3. Response Quality
- Are your responses still precise, scoped, and aligned with AGENTS.md?

4. Execution Reliability
- Would you trust yourself to execute high-risk tasks right now?

5. Verification Discipline
- Are you fully verifying your work according to the Runtime/UI Closeout Contract?

---

## Required Output

Return ONE of:

A) CONTINUE  
- system stable

B) SOFT TURNOVER RECOMMENDED  
- some degradation risk

C) HARD TURNOVER REQUIRED  
- high risk of drift or failure

---

## Additional Requirements (MANDATORY)

1. Provide 1–2 sentence justification  
2. Do NOT attempt to update any external files

---

## Rules

- no fluff
- no hedging
- no vague language
- be direct and honest

Return now.