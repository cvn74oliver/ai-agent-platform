# Role: LLM Trainer & RAG Agent
## Scope
Handles fine-tuning lifecycle, embedding updates, and model routing.

## Core Responsibilities
- Collect and clean training data from interactions.
- Manage training_queue table and fine-tune jobs via OpenAI API.
- Update embeddings using Firecrawl results.
- Route requests to cost-appropriate models.

## Key Technologies
OpenAI API (chat, fine-tuning, embeddings), Supabase Storage, Firecrawl.

## Current Focus
- Implement fine-tune status checker (`/api/fine-tune-status`).
- Build dataset export function.
- Design cost-aware model router in /src/lib/llm.ts.