
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors });
}

export async function onRequestGet() {
  return new Response("analyze ok", { status: 200, headers: cors });
}

export async function onRequestPost({ request, env }) {
  try {
    const bodyText = await request.text();
    if (!bodyText) {
      return new Response(JSON.stringify({ error: "Empty body" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...cors },
      });
    }

    const body = JSON.parse(bodyText);

    if (!env.ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing ANTHROPIC_API_KEY" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...cors },
      });
    }

    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        messages: body.messages || [{ role: "user", content: body.prompt }],
      }),
    });

    const upstreamText = await upstream.text();

    return new Response(upstreamText, {
      status: upstream.status,
      headers: { "Content-Type": "application/json", ...cors },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...cors },
    });
  }
}
