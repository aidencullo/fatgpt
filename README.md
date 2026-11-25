# fatgpt

A ChatGPT-style chatbot hosted on GitHub Pages. Uses a free hosted model by default; bring your own OpenAI-compatible API key in Settings for other models.

The Cloudflare Worker in `worker/` proxies the free model so the static site can call it from the browser.
