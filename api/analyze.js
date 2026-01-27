export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: "Missing ANTHROPIC_API_KEY in Vercel env vars" });
    }

    const { prompt, messages } = req.body || {};
    const finalMessages = messages || (prompt ? [{ role: "user", content: prompt }] : null);

    if (!finalMessages) {
      return res.status(400).json({ error: "Provide prompt or messages" });
    }

    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        messages: finalMessages
      })
    });

    const text = await upstream.text();

    return res
      .status(upstream.status)
      .setHeader("Content-Type", "application/json")
      .send(text);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: String(err) });
  }
}
