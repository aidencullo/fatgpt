// Tiny CORS proxy for the free Pollinations OpenAI-compatible endpoint.
// The browser cannot call Pollinations directly: browser origins require a
// Turnstile token. A Worker has no Origin header, so it can relay streamed
// responses straight through to the static GitHub Pages app.

const UPSTREAM = "https://text.pollinations.ai/openai/chat/completions";

function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400"
  };
}

export default {
  async fetch(request) {
    const cors = corsHeaders(request);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: cors });
    }

    try {
      const raw = await request.text();
      if (raw.length > 100_000) {
        return new Response("Payload too large", { status: 413, headers: cors });
      }
      // Strip anything that could turn this into an open proxy.
      const body = JSON.parse(raw);
      delete body.headers;
      delete body.url;

      const upstream = await fetch(UPSTREAM, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const headers = new Headers(cors);
      headers.set("Content-Type", upstream.headers.get("Content-Type") || "text/event-stream; charset=utf-8");
      headers.set("Cache-Control", "no-store");
      return new Response(upstream.body, { status: upstream.status, headers });
    } catch (err) {
      return new Response(JSON.stringify({ error: String(err && err.message || err) }), {
        status: 502,
        headers: { ...cors, "Content-Type": "application/json" }
      });
    }
  }
};
