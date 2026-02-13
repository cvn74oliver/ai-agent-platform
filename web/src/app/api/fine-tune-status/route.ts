import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function POST(req: Request) {
  try {
    const { agent_id } = await req.json()
    const supabase = createClient()
    const OPENAI_KEY = process.env.OPENAI_API_KEY
    if (!OPENAI_KEY) {
      return NextResponse.json({ error: "Missing OpenAI API key" }, { status: 500 })
    }

    // 1️⃣ Get the job ID from Supabase
    const { data: agent } = await supabase
      .from("agents")
      .select("fine_tune_model_id")
      .eq("id", agent_id)
      .single()

    if (!agent?.fine_tune_model_id) {
      return NextResponse.json({ error: "No fine-tune job found for this agent" }, { status: 400 })
    }

    const jobId = agent.fine_tune_model_id

    // 2️⃣ Check job status from OpenAI
    const resp = await fetch(`https://api.openai.com/v1/fine_tuning/jobs/${jobId}`, {
      headers: { Authorization: `Bearer ${OPENAI_KEY}` },
    })

    const jobData = await resp.json()

    if (!jobData?.status) {
      throw new Error("Invalid response from OpenAI")
    }

    const newStatus =
      jobData.status === "succeeded"
        ? "deployed"
        : jobData.status === "running"
        ? "deploying"
        : jobData.status === "failed"
        ? "failed"
        : jobData.status

    // 3️⃣ Save status back to Supabase
    await supabase
      .from("agents")
      .update({
        fine_tune_status: newStatus,
        fine_tune_model_id: jobData.fine_tuned_model || jobId,
      })
      .eq("id", agent_id)

    return NextResponse.json({
      message: `Fine-tuning job status: ${newStatus}`,
      job: jobData,
    })
  } catch (err: any) {
    console.error("[fine-tune-status] Error:", err)
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 })
  }
}