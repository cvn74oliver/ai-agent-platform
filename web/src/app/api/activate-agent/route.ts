import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { image_gen } from '@/tools/image_gen'
// import { image_gen } from "@/tools/image_gen" // existing helper

export async function POST(req: Request) {
  try {
    const supabase = createClient()
    const formData = await req.formData()
    const agent_id = formData.get("agent_id") as string
    const uploadOption = formData.get("uploadOption") as string
    const voiceOption = formData.get("voiceOption") as string || "default"

    let avatarUrl: string | null = null
    let avatarDescription: string | null = null
    let voiceId: string | null = null
    let wowVideoUrl: string | null = null

    // --- 1️⃣ handle avatar (image upload or AI portrait) ---
    if (uploadOption === "image") {
      const file = formData.get("file") as File
      if (!file) throw new Error("No file uploaded")

      const fileName = `${agent_id}_${Date.now()}.jpg`
      const arrayBuffer = await file.arrayBuffer()

      const { data: uploaded, error } = await supabase.storage
        .from("avatars")
        .upload(fileName, arrayBuffer, { contentType: "image/jpeg" })
      if (error) throw error

      const { data: publicUrl } = supabase.storage.from("avatars").getPublicUrl(fileName)
      avatarUrl = publicUrl.publicUrl
    } else if (uploadOption === "description") {
      avatarDescription = formData.get("description") as string
      const img = await image_gen.text2im({
        prompt: `portrait of ${avatarDescription}`,
        size: "512x512",
      })
      avatarUrl = img[0].url
    } else {
      throw new Error("Missing avatar option")
    }

    // --- 2️⃣ handle voice selection ---
    if (voiceOption === "clone") {
      // assume a cloned voice exists for the user
      const { data: voiceData } = await supabase
        .from("user_voices")
        .select("voice_id")
        .eq("user_id", agent_id)
        .single()
      voiceId = voiceData?.voice_id || "default"
    } else if (voiceOption === "preset") {
      voiceId = "Rachel" // example preset; change to any TTS voice ID
    } else {
      voiceId = "default"
    }

    // --- 3️⃣ generate greeting video (wow factor) ---
    const greetingText = `Hi! I’m your new digital teammate. I’m ready to start helping you!`

    const didRes = await fetch("https://api.d-id.com/talks", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.DID_API_KEY}` },
      body: JSON.stringify({
        source_url: avatarUrl,
        script: { type: "text", input: greetingText },
        voice: { voice_id: voiceId },
      }),
    })

    const didData = await didRes.json()
    wowVideoUrl = didData?.result_url || null

    // --- 4️⃣ update the agent record ---
    const { error: updateErr } = await supabase
      .from("agents")
      .update({
        avatar_image_url: avatarUrl,
        avatar_description: avatarDescription,
        voice_id: voiceId,
        wow_video_url: wowVideoUrl,
        is_active: true,
      })
      .eq("id", agent_id)
    if (updateErr) throw updateErr

    return NextResponse.json({
      message: "Agent activated successfully!",
      avatar: avatarUrl,
      voice: voiceId,
      video: wowVideoUrl,
    })
  } catch (err: any) {
    console.error("[activate-agent] error:", err)
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 })
  }
}