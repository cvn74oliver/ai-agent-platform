import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, role, expertise, tone, audience, goal, voice_traits } = body || {}

    if (!process.env.OPENAI_API_KEY) {
      console.warn('[generate-agent] Missing API key — using fallback.')
      return NextResponse.json({
        agent: {
          name: name || 'Your Digital Twin',
          subtitle: 'A reflection of your expertise and personality.',
          personality: {
            role: role || 'Business Owner',
            expertise: expertise || 'General operations and strategy',
            tone: tone || 'Professional, approachable',
            audience: audience || 'Your team and customers',
            goal:
              goal ||
              'Assist in daily operations, communication, and automation tasks.',
          },
        },
      })
    }

    // ---------- Build prompt ----------
    let voiceDescriptor = ''
    if (voice_traits) {
      const vt = voice_traits
      voiceDescriptor = `
Voice analysis summary:
- Tone: ${vt.tone || 'N/A'}
- Pace: ${vt.pace || 'N/A'}
- Energy: ${vt.energy ?? 'N/A'}
- Confidence: ${vt.confidence ?? 'N/A'}
- Style: ${vt.style || 'N/A'}
- Summary: ${vt.summary || ''}
`
    }

    const prompt = `
You are an AI architect building a user's "Digital Twin Agent."

Here is the user's info:
- Name: ${name || 'Unnamed User'}
- Role: ${role || 'Business Owner'}
- Expertise: ${expertise || 'General operations'}
- Tone preference: ${tone || 'Professional'}
- Audience: ${audience || 'Customers and team members'}
- Goal: ${goal || 'Assist with company growth and automation'}
${voiceDescriptor}

Use this information to craft the agent's personality. 
If voice analysis data is present, give extra weight to it when defining tone, energy, and confidence.

Return ONLY valid JSON with this structure:
{
  "name": "Agent Name",
  "subtitle": "Short tagline describing its purpose",
  "personality": {
    "role": "...",
    "expertise": "...",
    "tone": "...",
    "audience": "...",
    "core_values": ["...","...","..."],
    "goal": "...",
    "voice_prompt": "A 2-3 sentence paragraph describing how this agent should think and speak like the user."
  }
}

Example:
{
  "name": "Oliver AI",
  "subtitle": "Your personal executive assistant and strategist",
  "personality": {
    "role": "CEO",
    "expertise": "Mushroom cultivation, marketing, and automation",
    "tone": "Friendly, confident, and insightful",
    "audience": "Customers and internal team",
    "core_values": ["Authenticity", "Education", "Innovation"],
    "goal": "Assist with customer engagement and strategic decisions",
    "voice_prompt": "Speaks like Oliver — calm, knowledgeable, and visionary."
  }
}
`

    // ---------- Call OpenAI ----------
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
    })

    const data = await resp.json()
    const raw = data?.choices?.[0]?.message?.content?.trim() || '{}'
    console.log('[generate-agent] raw:', raw)

    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch (e) {
      console.warn('[generate-agent] Parse failed, returning fallback agent.')
      parsed = {
        name: name || 'Your Digital Twin',
        subtitle: 'A reflection of your expertise and personality.',
        personality: {
          role: role || 'Business Owner',
          expertise: expertise || 'General operations and strategy',
          tone: tone || 'Professional, approachable',
          audience: audience || 'Your team and customers',
          goal:
            goal ||
            'Assist in daily operations, communication, and automation tasks.',
          core_values: ['Authenticity', 'Knowledge', 'Clarity'],
          voice_prompt:
            'Speaks calmly, confidently, and uses language that mirrors the user’s real-world communication style.',
        },
      }
    }

    return NextResponse.json({ agent: parsed })
  } catch (err: any) {
    console.error('[generate-agent] Fatal error:', err)
    return NextResponse.json(
      {
        agent: {
          name: 'Your Digital Twin',
          subtitle: 'A reflection of your expertise and personality.',
          personality: {
            role: 'Business Owner',
            expertise: 'General operations and strategy',
            tone: 'Professional, approachable',
            audience: 'Your team and customers',
            goal: 'Assist in daily operations, communication, and automation.',
          },
          error: err?.message || 'Unknown error',
        },
      },
      { status: 200 },
    )
  }
}