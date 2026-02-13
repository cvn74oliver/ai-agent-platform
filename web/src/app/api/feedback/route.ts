import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const supabase = createClient()

    const { agent_id, question, ai_answer, correct_answer, helpful } = body

    if (!agent_id || !question || !ai_answer) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // 1️⃣ Save feedback to training_data
    await supabase.from("training_data").insert([
      {
        agent_id,
        example_text: JSON.stringify({ question, ai_answer, correct_answer }),
        example_type: "feedback",
        is_relevant: helpful,
        relevance_score: helpful ? 1 : 0.5,
      },
    ])

    // 2️⃣ Increment feedback counter on agent
    await supabase.rpc("increment_feedback", { agent_id_param: agent_id })

    return NextResponse.json({ message: "Feedback saved successfully!" })
  } catch (err: any) {
    console.error("[feedback] error:", err)
    return NextResponse.json(
      { error: err.message || "Unknown error" },
      { status: 500 }
    )
  }
}