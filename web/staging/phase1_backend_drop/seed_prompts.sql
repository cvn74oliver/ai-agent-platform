insert into public.prompts
  (id, agent, category, version, status, prompt_body, clarifications_json, metadata)
values
  (
    'd0aa3f4d-15e9-4e91-a241-d2b6a224b981',
    'Frontend',
    'guided_setup',
    '1.0.0',
    'active',
    $$Welcome! Let's design your AI agent together. What problem should it help you solve first?$$,
    $$[
      {
        "question": "Can you describe the primary goal of your agent?",
        "examples": ["Automate email replies","Summarize customer tickets","Generate product descriptions"]
      },
      {
        "question": "Will the agent interact with external tools or stay internal?",
        "examples": ["Integrate with Slack and Google Sheets","Only answer internal questions"]
      }
    ]$$::jsonb,
    $${
      "language": "en",
      "tone": "encouraging",
      "context_tags": ["guided_setup","phase1","user_onboarding"]
    }$$::jsonb
  ),
  (
    '8a29e201-2db9-47f9-bdc4-7cb28d77af7c',
    'Backend',
    'system_prompt',
    '1.0.0',
    'active',
    $$You are the Backend API Agent for the AI Agent Platform. Your role is to maintain API routes, Supabase integration, and security policies. Respond with concise, technical clarity.$$,
    $$[
      {
        "question": "Should responses include code samples or explanations only?",
        "examples": ["Provide TypeScript code for endpoints","Only describe logic and parameters"]
      }
    ]$$::jsonb,
    $${
      "language": "en",
      "tone": "technical",
      "context_tags": ["system","backend","architecture"]
    }$$::jsonb
  )
on conflict (id) do nothing;