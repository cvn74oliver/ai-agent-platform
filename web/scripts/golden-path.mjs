// web/scripts/golden-path.mjs
// Usage:
//   AGENT_ID="..." node web/scripts/golden-path.mjs
// Optional:
//   BASE_URL="http://localhost:3000" AGENT_ID="..." node web/scripts/golden-path.mjs

// Normalize BASE_URL so we never end up with double slashes
const RAW_BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const BASE_URL = RAW_BASE_URL.endsWith("/") ? RAW_BASE_URL.slice(0, -1) : RAW_BASE_URL;
const AGENT_ID = process.env.AGENT_ID;

if (!AGENT_ID) {
  console.error("❌ Missing AGENT_ID env var.\nExample:\n  AGENT_ID=\"...\" node web/scripts/golden-path.mjs");
  process.exit(1);
}

async function postJson(path, body) {
  const url = `${BASE_URL}${path}`;

  // Helpful diagnostics if the server isn't running or BASE_URL is wrong.
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    });

    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      // ignore
    }

    return { res, json, text, url };
  } catch (err) {
    const msg = String(err?.message || err);
    const causeMsg = err?.cause ? String(err.cause?.message || err.cause) : null;

    // Surface the most common local failure clearly.
    throw new Error(
      `fetch failed for ${url}. ` +
        `Is your dev server running at BASE_URL? ` +
        `Try: (1) in a separate terminal: npm run dev, ` +
        `(2) then rerun this script. ` +
        `Raw error: ${msg}` +
        (causeMsg ? ` | cause: ${causeMsg}` : "")
    );
  }
}

function okOrThrow(label, res, json, text, url) {
  if (!res.ok || !json?.ok) {
    const msg =
      json?.error ||
      json?.message ||
      res.statusText ||
      text?.slice(0, 400) ||
      "Unknown error";
    throw new Error(`${label} failed: ${res.status} ${msg} (url=${url})`);
  }
}

function logStep(name) {
  console.log(`\n=== ${name} ===`);
}

(async () => {
  try {
    console.log("🧪 Golden Path (API) starting...");
    console.log("Node version:", process.version);
    console.log("BASE_URL:", BASE_URL);
    console.log("AGENT_ID:", AGENT_ID);

    // 0) Preflight: ensure server is reachable
    logStep("0) Preflight (server reachable)");
    {
      const url = `${BASE_URL}/`;
      try {
        const res = await fetch(url);
        console.log(`✅ server reachable (${res.status})`, url);
      } catch (err) {
        throw new Error(
          `Cannot reach server at ${url}. Start your dev server (npm run dev) and rerun.`
        );
      }
    }

    // 1) Next training suggestion
    logStep("1) Next training suggestion");
    {
      const { res, json, text, url } = await postJson("/api/agents/fine-tune/orchestrate", { agent_id: AGENT_ID });
      okOrThrow("orchestrate", res, json, text, url);
      const q = json?.data?.suggested_question;
      if (!q || typeof q !== "string") throw new Error("orchestrate returned no suggested_question");
      console.log("✅ suggested_question:", q.slice(0, 120));
      // keep for next step
      globalThis.__SUGGESTED_Q = q;
      globalThis.__TOPIC = json?.data?.topic || null;
      globalThis.__DIMENSION = json?.data?.dimension || null;
    }

    // 2) Save one training example (manual_finetune)
    logStep("2) Save training example");
    {
      const question = globalThis.__SUGGESTED_Q;
      const answer = "Test answer for golden path health check.";
      const { res, json, text, url } = await postJson("/api/agents/feedback", {
        agent_id: AGENT_ID,
        source: "manual_finetune",
        rating: "up",
        user_input: question,
        agent_output: answer,
        tags: {
          topic: globalThis.__TOPIC,
          dimension: globalThis.__DIMENSION,
          mode: "manual_finetune",
          golden_path: true,
        },
      });
      okOrThrow("feedback", res, json, text, url);
      console.log("✅ feedback saved");
    }

    // 3) Recalculate quality (DRY RUN)
    logStep("3) Recalculate quality (dry run)");
    {
      const { res, json, text, url } = await postJson("/api/agents/recalculate-quality", {
        agent_id: AGENT_ID,
        dry_run: true,
        force_refine: false,
      });
      okOrThrow("recalculate-quality", res, json, text, url);

      // Some implementations return { agent }, some might return { data: { agent } }
      const agent = json?.data?.agent || json?.agent || null;
      const score = agent?.quality_score ?? json?.data?.quality_score ?? null;

      console.log("✅ recalc ok", score != null ? `quality_score=${score}` : "(score not returned)");
    }

    // 4) Fine-tune preview loads
    logStep("4) Fine-tune preview");
    {
      const { res, json, text, url } = await postJson("/api/agents/fine-tune/preview", { agent_id: AGENT_ID });
      okOrThrow("fine-tune preview", res, json, text, url);
      const total = json?.data?.total_examples ?? null;
      console.log("✅ preview ok", total != null ? `total_examples=${total}` : "");
    }

    // 5) Playground retrieval sanity check
    // We only verify that the Playground API returns a reply without crashing.
    // This does NOT guarantee a specific RAG source was used — it simply confirms
    // that the agent runtime + retrieval pipeline are operational.
    logStep("5) Playground retrieval");
    {
      const { res, json, text, url } = await postJson("/api/agents/playground", {
        agent_id: AGENT_ID,
        messages: [{ role: "user", content: "In the book/guide PDFs, what are the key steps to fruit Reishi? Please cite sources if available." }],
      });
      okOrThrow("playground", res, json, text, url);
      const reply = json?.data?.reply || "";
      if (!reply || typeof reply !== "string") throw new Error("playground returned empty reply");
      console.log("✅ playground reply:", reply.slice(0, 180).replace(/\s+/g, " ") + (reply.length > 180 ? "…" : ""));
    }

    // 6) Usage endpoint sanity check (optional; depends on your implementation)
    logStep("6) Usage stats (optional)");
    {
      const { res, json, text, url } = await postJson("/api/agents/usage", { agent_id: AGENT_ID });
      if (!res.ok || !json?.ok) {
        console.log("⚠️ usage endpoint not available or failed (non-fatal)");
      } else {
        console.log("✅ usage ok", {
          sessions_7d: json?.data?.last_7_days?.sessions,
          tokens_7d: json?.data?.last_7_days?.total_tokens,
        });
      }
    }

    console.log("\n✅ GOLDEN PATH PASS (API)");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ GOLDEN PATH FAIL");
    console.error(err?.stack || err?.message || err);
    process.exit(1);
  }
})();