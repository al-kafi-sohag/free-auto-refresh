// Cloudflare Pages Function: receives the website's contact form and forwards the message
// to a Telegram chat. Runs at POST /api/contact on the site's own domain.
//
// Set these in the Cloudflare dashboard (Pages project > Settings > Variables and Secrets),
// as encrypted secrets. They are never stored in this repository:
//   TELEGRAM_BOT_TOKEN   the token @BotFather gave for the bot
//   TELEGRAM_CHAT_ID     the chat the bot should write to (your own chat id, or a private group's)
//
// Nothing is stored here: the message goes to Telegram and is then forgotten.

const LIMITS = { name: 80, email: 120, message: 3000 };

const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

const clean = (value, max) => String(value ?? "").replace(/\r/g, "").trim().slice(0, max);

export async function onRequestPost({ request, env }) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return json(503, { ok: false, error: "not-configured" });

  // Only the site's own pages may post here
  const origin = request.headers.get("Origin");
  if (origin && origin !== new URL(request.url).origin) return json(403, { ok: false, error: "origin" });

  let data;
  try {
    data = await request.json();
  } catch (e) {
    return json(400, { ok: false, error: "bad-request" });
  }

  // "website" is a field people never see. Only bots fill it in: tell them it worked, send nothing.
  if (clean(data.website, 200)) return json(200, { ok: true });

  const name = clean(data.name, LIMITS.name);
  const email = clean(data.email, LIMITS.email);
  const message = clean(data.message, LIMITS.message);
  if (message.length < 5) return json(400, { ok: false, error: "message" });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(400, { ok: false, error: "email" });

  // Plain text (no parse_mode), so nothing a visitor types is treated as formatting or a link
  const text = [
    "New message from freeautorefresh.com",
    "",
    `Name: ${name || "(not given)"}`,
    `Email: ${email || "(not given)"}`,
    "",
    message,
  ].join("\n");

  const sent = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text, disable_web_page_preview: true }),
  }).then((r) => r.ok, () => false);

  return sent ? json(200, { ok: true }) : json(502, { ok: false, error: "send-failed" });
}

// Anything other than POST
export const onRequest = () => json(405, { ok: false, error: "method" });
