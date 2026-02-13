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

    // 1️⃣ Fetch curated examples for this agent
    const { data: examples, error } = await supabase
      .from("training_data")
      .select("prompt, completion")
      .eq("agent_id", agent_id)
      .eq("is_relevant", true)

    if (error) throw error
    if (!examples || examples.length === 0) {
      return NextResponse.json({ error: "No relevant training data found" }, { status: 400 })
    }

    // 2️⃣ Convert data to JSONL for OpenAI
    const jsonl = examples.map((e) => JSON.stringify(e)).join("\n")

    // 3️⃣ Upload the training data file to OpenAI
    const upload = await fetch("https://api.openai.com/v1/files", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_KEY}` },
      body: (() => {
        const f = new FormData()
        f.append("file", new Blob([jsonl], { type: "application/jsonl" }), "training_data.jsonl")
        f.append("purpose", "fine-tune")
        return f
      })(),
    })

    const uploaded = await upload.json()
    const fileId = uploaded.id

    if (!fileId) throw new Error("File upload failed.")

    // 4️⃣ Start fine-tune job
    const job = await fetch("https://api.openai.com/v1/fine_tuning/jobs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        training_file: fileId,
        model: "gpt-4o-mini", // you can change this to gpt-4o if desired
      }),
    })

    const jobData = await job.json()

    // 5️⃣ Update agent record
    await supabase
      .from("agents")
      .update({
        fine_tune_status: "deploying",
        fine_tune_model_id: jobData.id || null,
      })
      .eq("id", agent_id)

    return NextResponse.json({
      message: "Fine-tuning deployment started!",
      job: jobData,
    })
  } catch (err: any) {
    console.error("[deploy-fine-tune] Error:", err)
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 })
  }
}