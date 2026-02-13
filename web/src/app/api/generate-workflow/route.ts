import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const onboarding = body?.onboarding || {}
    const goal = body?.goal || ''

    const company = onboarding?.company || 'a business'
    const tone = onboarding?.tone || 'professional'

    console.log('[generate-workflow] incoming:', { onboarding, goal })

    if (!process.env.OPENAI_API_KEY) {
      console.warn('[generate-workflow] OPENAI_API_KEY missing. Returning fallback steps.')
      return NextResponse.json({
        steps: [
          { step: 'Trigger', description: `Start when relevant data is available for ${company}` },
          { step: 'AI Processing', description: `Analyze input using a ${tone} tone and categorize it` },
          { step: 'Action', description: 'Send results to Slack and save in database' },
        ],
        title: 'AI Workflow',
        subtitle: 'Automation built by AI',
      })
    }

    // -------- 1️⃣ Generate workflow steps --------
    const prompt = `
Return ONLY a valid JSON array (no markdown, no extra text).
Each item must have "step" and "description".
3 to 6 items max.

Example:
[
  {"step":"Trigger","description":"Detect new customer form submission"},
  {"step":"AI Processing","description":"Analyze and classify the message"},
  {"step":"Action","description":"Send summary to Slack and store in DB"}
]

Company: ${company}
Tone: ${tone}
Goal: ${goal || 'General automation for the business'}
`

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
      cache: 'no-store',
    })

    const data = await resp.json()
    const rawMessage = data?.choices?.[0]?.message?.content?.trim() || ''
    console.log('[generate-workflow] openai status:', resp.status)
    console.log('[generate-workflow] rawMessage:', rawMessage)

    let steps
    try {
      steps = JSON.parse(rawMessage)
      if (!Array.isArray(steps)) throw new Error('Parsed result is not an array')
    } catch (err) {
      console.warn('[generate-workflow] parse failed; returning fallback steps')
      steps = [
        { step: 'Trigger', description: `Begin when new relevant event occurs for ${company}` },
        { step: 'AI Processing', description: `Process the input with a ${tone} tone based on goal "${goal}"` },
        { step: 'Action', description: 'Send result to Slack and persist to DB' },
      ]
    }

    // -------- 2️⃣ Generate title & subtitle --------
    let aiTitle = 'AI Workflow'
    let aiSubtitle = 'Automation built by AI'

    try {
      const titlePrompt = `
You are naming an automation workflow.

Goal: "${goal}"

Return a JSON object with two fields:
{
  "title": "A short professional workflow title (max 6 words)",
  "subtitle": "A one-line description or tagline for this automation"
}

Examples:
{
  "title": "BTCUSD MACD Signal Alert",
  "subtitle": "Monitor TradingView and send Slack alerts"
}

Return ONLY valid JSON.
`

      const titleResp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: titlePrompt }],
          temperature: 0.5,
        }),
      })

      const titleData = await titleResp.json()
      const rawTitle = titleData?.choices?.[0]?.message?.content?.trim() || '{}'
      const parsed = JSON.parse(rawTitle)
      aiTitle = parsed?.title || 'AI Workflow'
      aiSubtitle = parsed?.subtitle || 'Automation built by AI'
    } catch (e) {
      console.warn('[generate-workflow] title/subtitle generation failed:', e)
    }

    // -------- 3️⃣ Return final combined JSON --------
    return NextResponse.json({ steps, title: aiTitle, subtitle: aiSubtitle })
  } catch (err: any) {
    console.error('[generate-workflow] fatal error:', err)
    return NextResponse.json(
      {
        steps: [
          { step: 'Trigger', description: 'Local fallback: start when a new item arrives' },
          { step: 'Action', description: `Local fallback: ${err?.message || 'Unknown error'}` },
        ],
        title: 'AI Workflow',
        subtitle: 'Automation built by AI',
        error: err?.message || 'Unknown error',
      },
      { status: 200 },
    )
  }
}