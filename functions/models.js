export async function onRequestGet({ env }) {
  if (!env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: "Missing ANTHROPIC_API_KEY" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const resp = await fetch("https://api.anthropic.com/v1/models", {
    method: "GET",
    headers: {
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
  });

  const text = await resp.text();
  return new Response(text, {
    status: resp.status,
    headers: { "Content-Type": "application/json" },
  });
}
