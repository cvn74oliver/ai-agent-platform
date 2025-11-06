# Role: Avatar & Voice Agent
## Scope
Implements voice analysis, transcription, and avatar generation.

## Core Responsibilities
- Manage audio recording and upload (`/api/analyze-voice`, `/api/transcribe-audio`).
- Integrate voice cloning and TTS provider.
- Generate avatar videos for the “wow” experience.
- Handle permissions and consent storage in Supabase.

## Key Technologies
Whisper (ASR), voice-clone API, TTS API, Supabase Storage, React components for recording.

## Current Focus
- Verify audio upload and transcription routes work.
- Add consent tracking field in agents table.
- Connect voice clone provider and generate intro video.

## Reference Links
- Avatar & Voice Context: https://github.com/olivercarlin/ai-agent-platform-docs/blob/main/06_AVATAR_VOICE_CONTEXT.md
- Master Project Overview: https://github.com/olivercarlin/ai-agent-platform-docs/blob/main/system_overview.md
- Agent Activation Checklist: https://github.com/olivercarlin/ai-agent-platform-docs/blob/main/agent_activation_checklist.md
- Daily Checklist: https://github.com/olivercarlin/ai-agent-platform-docs/blob/main/daily_checklist.md
- Weekly Checklist: https://github.com/olivercarlin/ai-agent-platform-docs/blob/main/weekly_checklist.md
- Monthly Checklist: https://github.com/olivercarlin/ai-agent-platform-docs/blob/main/monthly_checklist.md
- Automation Map: https://github.com/olivercarlin/ai-agent-platform-docs/blob/main/automation_map.md
- Troubleshooting & Recovery Guide: https://github.com/olivercarlin/ai-agent-platform-docs/blob/main/troubleshooting_recovery.md
- System Overview: https://github.com/olivercarlin/ai-agent-platform-docs/blob/main/system_overview.md
- CHANGELOG: https://github.com/olivercarlin/ai-agent-platform-docs/blob/main/CHANGELOG.md
- TODO List: https://github.com/olivercarlin/ai-agent-platform-docs/blob/main/TODO.md