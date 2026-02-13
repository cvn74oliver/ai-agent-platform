async function handleLlmTrainingSubmit(answer: string, mode: 'next' | 'finish') {
  if (!agent?.id || !nextSuggestion?.suggested_question) {
    setShowLlmTrainingModal(false)
    return
  }

  const trimmed = answer.trim()
  if (!trimmed) {
    // No answer provided – just close the modal
    setShowLlmTrainingModal(false)
    return
  }

  try {
    await fetch('/api/agents/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent_id: agent.id,
        source: 'manual_finetune',
        rating: 'up',
        user_input: nextSuggestion.suggested_question,
        agent_output: trimmed,
        tags: {
          topic: nextSuggestion.topic || null,
          dimension: nextSuggestion.dimension || null,
          mode: 'manual_finetune',
        },
      }),
    })

    // For "Save & Next", immediately fetch a new suggestion and keep the modal flow going
    if (mode === 'next') {
      await askNextTrainingStep()
    } else {
      // For "Save & Finish", close the modal
      setShowLlmTrainingModal(false)
    }
  } catch (err) {
    console.error('[llm-training] feedback log failed:', err)
    // On error, close the modal to avoid trapping the user
    setShowLlmTrainingModal(false)
  }
}
