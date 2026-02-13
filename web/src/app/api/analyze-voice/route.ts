import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file')
    if (!file) {
      return NextResponse.json({ error: 'No audio file provided.' }, { status: 400 })
    }

    // Quick fake analysis so UI updates
    const fakeTraits = {
      tone: 'friendly',
      pace: 'moderate',
      energy: 0.7,
      confidence: 0.8,
      style: 'approachable',
      summary: 'Sounds friendly and conversational.'
    }

    console.log('[analyze-voice] returning fake traits:', fakeTraits)
    return NextResponse.json({ traits: fakeTraits })
  } catch (err: any) {
    console.error('[analyze-voice] error:', err)
    return NextResponse.json({ error: err.message || 'Voice analysis failed' }, { status: 500 })
  }
}