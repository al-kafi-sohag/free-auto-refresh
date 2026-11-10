/* ================= state ================= */
let st = null; // this tab's state from the background
let runId = 0; // invalidates stale async work
let timer = null;
let ticker = null;
let badgeTicker = null; // keeps the toolbar countdown moving
let startAt = 0;
let nextAt = 0;
let willReload = true;
let lastKeyAt = 0;
let msgText = "";
let dead = false; // true if the extension was reloaded under us
let userScrolled = false; // the user moved the page since it loaded
let scrollRestored = false;
let lastRestartAt = 0;

let host = null;
let root = null;
let lastMode = null;

const SCROLL_KEYS = new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "]);

function isEditable(node) {
  return !!node && (node.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(node.tagName));
}

document.addEventListener("keydown", (e) => {
  lastKeyAt = Date.now();
  if (SCROLL_KEYS.has(e.key) && !isEditable(document.activeElement)) onActivity("scroll", e);
}, true);
document.addEventListener("pointerdown", (e) => onActivity("click", e), true);
// wheel/touch/keys rather than "scroll", so only the user's own scrolling counts
document.addEventListener("wheel", (e) => onActivity("scroll", e), { capture: true, passive: true });
document.addEventListener("touchmove", (e) => onActivity("scroll", e), { capture: true, passive: true });

// Badge texts come from the background in the user's language (state.strings).
// These English ones are only a fallback.
const TEXT = {
  refreshes: "refreshes", nextRefresh: "next refresh", endsIn: "ends in", checking: "checking page",
  starting: "starting", paused: "Paused", resumeHint: "press play to resume", match: "Match found",
  limit: "Limit reached", timeUp: "Time's up", stopped: "stopped", typing: "Waiting… you're typing",
  refreshing: "Refreshing…", resume: "Resume", pause: "Pause", stop: "Stop", dismiss: "Dismiss",
  titleFlash: "🔔 Match found!", restarted: "Countdown restarted", userStop: "You used the page",
};
const T = (key) => st?.strings?.[key] ?? TEXT[key];

const rand = (a, b) => a + Math.random() * (b - a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function send(msg) {
  if (dead) return undefined;
  try {
    return await chrome.runtime.sendMessage(msg);
  } catch (e) {
    // Extension was reloaded/updated: this script is orphaned
    dead = true;
    stopTimers();
    removeBadge();
    return undefined;
  }
}

/* ================= badge UI (Shadow DOM) ================= */
const ICON = {
  pause: '<svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>',
  play: '<svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>',
  stop: '<svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M6 6h12v12H6z"/></svg>',
  close: '<svg viewBox="0 0 24 24" width="14" height="14"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" fill="none"/></svg>',
};

const BADGE_CSS = `
:host{all:initial}
*{box-sizing:border-box}
.pill{font:12px/1.25 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#fff;background:rgba(15,23,42,.94);border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.35),0 0 0 1px rgba(255,255,255,.09);min-width:196px;overflow:hidden;user-select:none;-webkit-user-select:none}
.row{display:flex;align-items:center;gap:10px;padding:9px 8px 8px 12px;cursor:grab;touch-action:none}
.row:active{cursor:grabbing}
.dot{width:8px;height:8px;border-radius:50%;flex:none;background:#22c55e;animation:pulse 1.6s infinite}
.paused .dot{background:#f59e0b;animation:none}
.finished .dot{background:#818cf8;animation:none}
.finished.match .dot{background:#fb7185}
@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(34,197,94,.55)}70%{box-shadow:0 0 0 7px rgba(34,197,94,0)}100%{box-shadow:0 0 0 0 rgba(34,197,94,0)}}
.col{display:flex;flex-direction:column;gap:1px;min-width:0}
.col.right{margin-left:auto;align-items:flex-end}
.count{display:flex;align-items:baseline;gap:2px;font-variant-numeric:tabular-nums}
.count b{font-size:16px;font-weight:700}
.count small{font-size:11px;opacity:.6}
.time{font-size:13px;font-weight:600;font-variant-numeric:tabular-nums;white-space:nowrap}
.sub{font-size:9.5px;letter-spacing:.06em;text-transform:uppercase;opacity:.55;white-space:nowrap}
button{all:unset;box-sizing:border-box;width:26px;height:26px;display:grid;place-items:center;border-radius:8px;cursor:pointer;color:#e2e8f0}
button:hover{background:rgba(255,255,255,.14)}
button:focus-visible{outline:2px solid #818cf8}
.bar{height:3px;background:rgba(255,255,255,.12)}
.bar i{display:block;height:100%;width:0;background:#818cf8;transition:width .12s linear}
.finished.match .bar i{background:#fb7185}
.msg{padding:0 12px 8px;font-size:11px;color:#fcd34d}
.msg:empty{display:none}
`;

function ensureBadge() {
  if (host) return;
  host = document.createElement("auto-refresh-badge");
  host.style.cssText =
    "all:initial;position:fixed;right:16px;bottom:16px;z-index:2147483647;visibility:hidden;";
  root = host.attachShadow({ mode: "closed" });
  root.innerHTML = `
    <style>${BADGE_CSS}</style>
    <div class="pill running" id="pill">
      <div class="row" id="drag">
        <span class="dot"></span>
        <div class="col">
          <div class="count"><b id="cnt">0</b><small id="max"></small></div>
          <div class="sub" id="lbl"></div>
        </div>
        <div class="col right">
          <div class="time" id="time">--</div>
          <div class="sub" id="sub"></div>
        </div>
        <button id="pp" type="button"></button>
        <button id="stop" type="button"></button>
      </div>
      <div class="bar"><i id="fill"></i></div>
      <div class="msg" id="msg"></div>
    </div>`;

  root.getElementById("pp").addEventListener("click", () => send({ type: "togglePause" }));
  root.getElementById("stop").addEventListener("click", () => send({ type: "stop" }));
  enableDrag(root.getElementById("drag"));

  document.documentElement.appendChild(host);
  lastMode = null;
  restorePosition();
}

function removeBadge() {
  if (host) host.remove();
  host = root = null;
  lastMode = null;
}

function placeBadge(left, top) {
  const w = host.offsetWidth, h = host.offsetHeight;
  const x = Math.min(Math.max(0, left), Math.max(0, innerWidth - w));
  const y = Math.min(Math.max(0, top), Math.max(0, innerHeight - h));
  host.style.left = x + "px";
  host.style.top = y + "px";
  host.style.right = "auto";
  host.style.bottom = "auto";
}

async function restorePosition() {
  try {
    const { badgePos } = await chrome.storage.local.get("badgePos");
    if (badgePos && host) placeBadge(badgePos.left, badgePos.top);
  } catch (e) {}
  if (host) host.style.visibility = "visible";
}

function enableDrag(handle) {
  let dragging = false, sx = 0, sy = 0, ox = 0, oy = 0;

  handle.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button")) return;
    const r = host.getBoundingClientRect();
    dragging = true;
    sx = e.clientX; sy = e.clientY; ox = r.left; oy = r.top;
    handle.setPointerCapture(e.pointerId);
  });

  handle.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    placeBadge(ox + e.clientX - sx, oy + e.clientY - sy);
  });

  const end = () => {
    if (!dragging) return;
    dragging = false;
    const r = host.getBoundingClientRect();
    chrome.storage.local.set({ badgePos: { left: r.left, top: r.top } }).catch(() => {});
  };
  handle.addEventListener("pointerup", end);
  handle.addEventListener("pointercancel", end);
}

function renderBadge(v) {
  if (!host) return;
  const el = (id) => root.getElementById(id);
  el("pill").className = "pill " + v.mode + (v.match ? " match" : "");
  el("lbl").textContent = T("refreshes");
  el("cnt").textContent = v.count;
  el("max").textContent = v.max > 0 ? "/" + v.max : "";
  el("time").textContent = v.text;
  el("sub").textContent = v.sub || "";
  el("fill").style.width = Math.min(100, Math.max(0, v.pct * 100)).toFixed(1) + "%";
  el("msg").textContent = v.msg || "";

  if (v.mode !== lastMode) {
    lastMode = v.mode;
    const finished = v.mode === "finished";
    el("pp").innerHTML = v.mode === "paused" ? ICON.play : ICON.pause;
    el("pp").title = T(v.mode === "paused" ? "resume" : "pause");
    el("pp").style.display = finished ? "none" : "grid";
    el("stop").innerHTML = finished ? ICON.close : ICON.stop;
    el("stop").title = T(finished ? "dismiss" : "stop");
  }
}

function fmtLeft(s) {
  if (s >= 3600) return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
  if (s >= 60) return `${Math.floor(s / 60)}m ${String(Math.floor(s % 60)).padStart(2, "0")}s`;
  return s.toFixed(1) + "s";
}

/* ================= helpers ================= */
function stopTimers() {
  clearTimeout(timer);
  clearInterval(ticker);
  clearInterval(badgeTicker);
  timer = ticker = badgeTicker = null;
}

// Resolves when the page has finished loading, or after maxMs if it never does
function pageLoaded(maxMs) {
  if (document.readyState === "complete") return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(id);
      removeEventListener("load", done);
      resolve();
    };
    const id = setTimeout(done, maxMs);
    addEventListener("load", done);
  });
}

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }

  return (h >>> 0).toString(16) + ":" + s.length;
}

function textOf(selector) {
  try {
    const el = selector ? document.querySelector(selector) : document.body;
    return (el ? el.innerText : "").replace(/\s+/g, " ").trim();
  } catch (e) {
    return ""; // invalid selector
  }
}

function isTyping() {
  return isEditable(document.activeElement) && Date.now() - lastKeyAt < 5000;
}

/* ================= smart pause: clicks and scrolling ================= */
function onActivity(kind, e) {
  if (kind === "scroll") userScrolled = true;
  if (dead || !st?.running || st.paused) return;

  const cfg = st.cfg || {};
  if (!(kind === "click" ? cfg.pauseOnClick : cfg.pauseOnScroll)) return;
  if (host && e.composedPath().includes(host)) return; // our own badge and its buttons

  if (cfg.pauseAction === "stop") {
    finish("interaction");
    return;
  }

  // Restart the countdown. Only while one is running, and at most once a second
  // (scrolling fires many events).
  if (!timer || Date.now() - lastRestartAt < 1000) return;
  lastRestartAt = Date.now();
  stopTimers();
  msgText = T("restarted");
  const shown = msgText;
  setTimeout(() => { if (msgText === shown) msgText = ""; }, 2000);
  schedule();
}

/* ================= keep scroll position ================= */
function restoreScroll(pos) {
  if (scrollRestored || !pos) return;
  scrollRestored = true;
  const go = () => { if (!userScrolled) window.scrollTo(pos.x, pos.y); };
  go();
  // Again once the page has its full height, and once more for content that arrives late
  pageLoaded(15000).then(() => {
    go();
    setTimeout(go, 400);
  });
}

function flashTitle(text) {
  const original = document.title;
  let on = false, n = 0;
  const id = setInterval(() => {
    on = !on;
    document.title = on ? text : original;
    if (++n > 60 || (n > 6 && document.hasFocus())) {
      clearInterval(id);
      document.title = original;
    }
  }, 800);
}

/* ================= watching ================= */
async function checkWatch() {
  const w = st.watch;
  if (!w || w.mode === "none") return false;
  const cfg = st.cfg || {};
  if (cfg.waitLoad) await pageLoaded(15000);
  await sleep((cfg.waitDelay ?? 1) * 1000); // let dynamic content render

  if (w.mode === "changes") {
    const sig = hash(textOf((w.text || "").trim()));
    if (w.baseline == null) {
      w.baseline = sig;
      await send({ type: "setBaseline", hash: sig });
      return false;
    }

    return sig !== w.baseline;
  }

  const needle = (w.text || "").trim().toLowerCase();
  if (!needle) return false;
  const found = textOf("").toLowerCase().includes(needle);
  return w.mode === "appears" ? found : !found;
}

/* ================= main flow ================= */
async function init() {
  const myRun = ++runId;
  stopTimers();
  msgText = "";

  const s = await send({ type: "getState" });
  if (myRun !== runId) return;
  st = s || null;

  if (!st) return removeBadge();

  if (!st.running) {
    return st.finished ? showFinished() : removeBadge();
  }

  if (st.cfg?.keepScroll) restoreScroll(st.scroll);
  if (!st.showBadge) removeBadge();
  if (st.paused) return showPaused();

  if (st.showBadge) {
    ensureBadge();
    renderBadge({
      mode: "running",
      count: st.refreshCount,
      max: st.maxRefreshes,
      text: "…",
      sub: T(st.watch.mode !== "none" ? "checking" : "starting"),
      pct: 0,
    });
  }

  const matched = await checkWatch();
  if (myRun !== runId) return;
  if (matched) return finish("match");

  if (st.endTime && Date.now() >= st.endTime) return finish("time");
  if (st.maxRefreshes > 0 && st.refreshCount >= st.maxRefreshes) return finish("count");
  if (st.refreshCount === 0 && st.scheduledAt == null) return fire();

  schedule();
}

function schedule() {
  const now = Date.now();
  let delay = rand(st.min, st.max) * 1000;
  willReload = true;

  // If the total duration ends before the next refresh, stop at the end time
  if (st.endTime && now + delay >= st.endTime) {
    delay = Math.max(0, st.endTime - now);
    willReload = false;
  }

  startAt = now;
  nextAt = now + delay;
  send({ type: "schedule", startAt, nextAt, willReload });

  timer = setTimeout(fire, delay);
  if (st.showBadge) {
    tick();
    ticker = setInterval(tick, 100);
  }

  if (st.cfg?.toolbarBadge === "countdown") {
    badgeTicker = setInterval(() => send({ type: "tickBadge" }), 1000);
  }
}

function tick() {
  if (!host || document.hidden) return;
  const left = Math.max(0, nextAt - Date.now());
  const total = Math.max(1, nextAt - startAt);
  renderBadge({
    mode: "running",
    count: st.refreshCount,
    max: st.maxRefreshes,
    text: fmtLeft(left / 1000),
    sub: T(willReload ? "nextRefresh" : "endsIn"),
    pct: 1 - left / total,
    msg: msgText,
  });
}

async function fire() {
  timer = null;
  if (!st?.running) return;

  if (!willReload || (st.endTime && Date.now() >= st.endTime)) return finish("time");

  if (st.smartPause && isTyping()) {
    startAt = Date.now();
    nextAt = startAt + 3000;
    msgText = T("typing");
    send({ type: "schedule", startAt, nextAt, willReload: true });
    timer = setTimeout(fire, 3000);
    return;
  }

  msgText = T("refreshing");
  tick();
  clearInterval(badgeTicker);
  const scroll = st.cfg?.keepScroll ? { x: window.scrollX, y: window.scrollY } : null;
  await send({ type: "reload", scroll });
}

async function finish(reason) {
  stopTimers();
  if (reason === "match" && st.notify) flashTitle(T("titleFlash"));
  await send({ type: "finish", reason });
}

function showPaused() {
  if (!st.showBadge) return removeBadge();
  ensureBadge();
  renderBadge({
    mode: "paused",
    count: st.refreshCount,
    max: st.maxRefreshes,
    text: T("paused"),
    sub: T("resumeHint"),
    pct: 0,
  });
}

function showFinished() {
  if (!st.showBadge) return removeBadge();
  const f = st.finished;
  ensureBadge();
  renderBadge({
    mode: "finished",
    match: f.reason === "match",
    count: st.refreshCount,
    max: st.maxRefreshes,
    text: T({ match: "match", count: "limit", interaction: "userStop" }[f.reason] || "timeUp"),
    sub: T("stopped"),
    pct: 1,
  });
}

/* ================= wiring ================= */
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "sync") init();
  if (msg.type === "ping") sendResponse(true);
});

init();