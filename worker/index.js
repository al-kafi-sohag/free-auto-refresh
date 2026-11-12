// Entry point of the website's Cloudflare Worker (see wrangler.jsonc).
// The pages themselves are static files; this only answers /api/* requests.
import { onRequestPost } from "../functions/api/contact.js";

const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    if (pathname === "/api/contact") {
      if (request.method !== "POST") return json(405, { ok: false, error: "method" });
      return onRequestPost({ request, env });
    }

    if (pathname.startsWith("/api/")) return json(404, { ok: false, error: "not-found" });
    return env.ASSETS.fetch(request);
  },
};
