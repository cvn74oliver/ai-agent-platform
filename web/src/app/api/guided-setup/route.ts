import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const supabase = createClient()
    const body = await req.json()

    // Build a basic prompt from answers
    const primaryPrompt = `
You are the AI representative of ${body.company}.
Your mission: ${body.mission}.
Your communication tone: ${body.tone}.
You specialize in: ${body.topics}.
Use information from these sources when relevant: ${body.rag}.
    `.trim()

    const ragSources = body.rag
      ? body.rag.split(/\s+/).filter((r: string) => r.startsWith('http'))
      : []

    const { data, error } = await supabase
      .from('agents')
      .insert([
        {
          name: body.company || 'New Agent',
          description: body.mission || 'AI agent created during guided setup',
          primary_prompt: primaryPrompt,
          rag_sources: ragSources,
          fine_tune_status: 'not_started',
        },
      ])
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ message: 'Agent created', id: data.id })
  } catch (err: any) {
    console.error('[guided-setup] error:', err)
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}