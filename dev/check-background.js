// Development only: runs background.js against a fake `chrome` API and checks its logic.
//   node dev/check-background.js
const assert = require("assert");
const path = require("path");

const root = path.resolve(__dirname, "..");
const clone = (v) => JSON.parse(JSON.stringify(v));

function area() {
  const d = {};
  return {
    d,
    get: async (k) => {
      const list = k == null ? Object.keys(d) : typeof k === "string" ? [k] : k;
      return Object.fromEntries(list.filter((x) => x in d).map((x) => [x, clone(d[x])]));
    },
    set: async (o) => { Object.assign(d, clone(o)); },
  };
}

const L = {};
const ev = (name) => ({ addListener: (fn) => { L[name] = fn; } });
const local = area(), session = area();
const calls = { reload: [], update: [], notes: [], sync: 0 };
const badge = {};
let contentAlive = true;
let uiLang = "en-US";

globalThis.chrome = {
  i18n: { getUILanguage: () => uiLang },
  storage: { local, session },
  runtime: { getURL: (p) => "ext://" + p, onMessage: ev("msg"), onInstalled: ev("installed") },
  tabs: {
    onRemoved: ev("removed"),
    onUpdated: ev("updated"),
    sendMessage: async (_id, msg) => {
      if (!contentAlive) throw new Error("Receiving end does not exist");
      if (msg.type === "sync") calls.sync++;
      return true;
    },
    reload: async (id, opts) => { calls.reload.push(opts); },
    update: async (id, props) => { calls.update.push(props); return { windowId: 1 }; },
    query: async () => [{ id: 7 }],
  },
  action: {
    setBadgeText: async ({ text }) => { badge.text = text; },
    setBadgeBackgroundColor: async ({ color }) => { badge.color = color; },
  },
  notifications: { onClicked: ev("nclick"), create: (id, o) => { calls.notes.push(o); }, clear() {} },
  commands: { onCommand: ev("cmd") },
};
globalThis.importScripts = (...files) => files.forEach((f) => require(path.join(root, f)));
require(path.join(root, "background.js"));

const S = globalThis.ARSettings;
const send = (msg) => new Promise((resolve) => L.msg(msg, { tab: { id: 7 } }, resolve));
const tick = (ms = 20) => new Promise((r) => setTimeout(r, ms));
// A message from the content script of a page: the browser tells the background its address
const from = (tabId, url, msg) => new Promise((resolve) => L.msg(msg, { tab: { id: tabId }, url }, resolve));
const pageLoad = (tabId, url) => from(tabId, url, { type: "getState" });

(async () => {
  /* install / update */
  await L.installed({ reason: "update" });
  assert.deepStrictEqual(local.d.pinned, S.LEGACY_PINS, "update keeps the old popup's settings pinned");
  local.d.pinned = ["notify"];
  await L.installed({ reason: "update" });
  assert.deepStrictEqual(local.d.pinned, ["notify"], "existing pins are never overwritten");
  delete local.d.pinned;
  await L.installed({ reason: "install" });
  assert.deepStrictEqual(local.d.pinned, [], "new installs start with the simple view");

  /* start with a 1.0.0-shaped config: only the old keys, min/max reversed */
  let st = await send({ type: "start", cfg: {
    min: 60, max: 5, durationMin: 2, maxRefreshes: "9", watchMode: "appears", watchText: " hi ",
    showBadge: false, bypassCache: true, smartPause: false, notify: true,
  } });
  assert.strictEqual(st.min, 5);
  assert.strictEqual(st.max, 60);
  assert.strictEqual(st.maxRefreshes, 9);
  assert.ok(st.endTime > Date.now());
  assert.deepStrictEqual(st.watch, { mode: "appears", text: "hi", baseline: null });
  assert.strictEqual(st.cfg.waitLoad, true, "new settings fall back to their defaults");
  assert.strictEqual(st.cfg.toolbarBadge, "count");
  assert.strictEqual(st.refreshCount, 0, "a ready tab is not reloaded by the background");
  assert.strictEqual(calls.reload.length, 0);
  assert.strictEqual(calls.sync, 1);
  assert.deepStrictEqual(calls.update.at(-1), { autoDiscardable: false }, "keeps the tab awake while running");

  /* refresh, with the scroll position remembered */
  assert.strictEqual(await send({ type: "reload", scroll: { x: 0, y: 840 } }), true);
  st = await send({ type: "getState" });
  assert.strictEqual(st.refreshCount, 1);
  assert.deepStrictEqual(st.scroll, { x: 0, y: 840 });
  assert.deepStrictEqual(calls.reload.at(-1), { bypassCache: true });
  assert.strictEqual(badge.text, "1");

  assert.strictEqual((await send({ type: "togglePause" })).paused, true);
  assert.strictEqual(await send({ type: "reload" }), false, "no refresh while paused");
  await send({ type: "togglePause" });

  /* match: notification in the chosen language, tab may sleep again */
  await send({ type: "finish", reason: "match" });
  await tick();
  assert.strictEqual(calls.notes.length, 1);
  assert.strictEqual(calls.notes[0].iconUrl, "ext://icons/icon-128.png");
  assert.deepStrictEqual(calls.update.at(-1), { autoDiscardable: true });
  assert.strictEqual(badge.text, "!");

  /* stop clears everything */
  assert.strictEqual(await send({ type: "stop" }), null);
  assert.strictEqual(badge.text, "");

  /* a tab without a content script is reloaded once, and that counts as the first refresh */
  contentAlive = false;
  calls.reload.length = 0;
  st = await send({ type: "start", cfg: { min: 10, max: 10, keepAlive: false } });
  assert.strictEqual(st.refreshCount, 1);
  assert.strictEqual(calls.reload.length, 1);
  assert.notDeepStrictEqual(calls.update.at(-1), { autoDiscardable: false }, "keepAlive off leaves the tab alone");
  contentAlive = true;
  await send({ type: "stop" });

  /* toolbar badge modes */
  st = await send({ type: "start", cfg: { toolbarBadge: "countdown" } });
  assert.strictEqual(badge.text, "…", "no countdown until the page schedules one");
  await send({ type: "schedule", startAt: Date.now(), nextAt: Date.now() + 42000, willReload: true });
  await tick();
  assert.strictEqual(badge.text, "42");
  await send({ type: "schedule", startAt: Date.now(), nextAt: Date.now() + 5 * 60000, willReload: true });
  await tick();
  assert.strictEqual(badge.text, "5m");
  await send({ type: "tickBadge" });
  assert.strictEqual(badge.text, "5m");
  await send({ type: "finish", reason: "interaction" });
  st = await send({ type: "getState" });
  assert.strictEqual(st.finished.reason, "interaction");
  assert.strictEqual(calls.notes.length, 1, "only a match sends a notification");
  await send({ type: "stop" });

  st = await send({ type: "start", cfg: { toolbarBadge: "off" } });
  await send({ type: "reload" });
  assert.strictEqual(badge.text, "", "badge stays empty when turned off");
  await send({ type: "stop" });

  /* language: follows the browser, unless the user picked one */
  uiLang = "ro-RO";
  st = await send({ type: "start", cfg: {} });
  assert.strictEqual(st.strings.refreshes, "reîncărcări");
  await send({ type: "stop" });
  local.d.lang = "ja";
  st = await send({ type: "start", cfg: {} });
  assert.strictEqual(st.strings.paused, "一時停止中");
  await send({ type: "stop" });
  delete local.d.lang;
  uiLang = "en-US";

  /* keyboard shortcut starts with defaults when nothing is saved, and toggles off */
  await L.cmd("toggle-refresh");
  st = await send({ type: "getState" });
  assert.strictEqual(st.running, true);
  assert.strictEqual(st.min, 30);
  await L.cmd("toggle-refresh");
  assert.strictEqual(await send({ type: "getState" }), null);

  /* quick presets */
  assert.deepStrictEqual(S.cleanPresets(undefined).map(S.presetLabel), ["5–10s", "15–30s", "30–60s", "1–2 min", "5 min"],
    "nothing saved gives the presets every version has had");
  assert.deepStrictEqual(S.cleanPresets([]), [], "an emptied list stays empty");
  assert.deepStrictEqual(
    S.cleanPresets([{ min: 90, max: 45 }, { min: "", max: 20 }, { min: 0.2, max: 0.2 }, {}, null, { min: "x" }, { min: 3600, max: 7200 }]),
    [{ min: 45, max: 90 }, { min: 20, max: 20 }, { min: 1, max: 1 }, { min: 3600, max: 7200 }]);
  assert.strictEqual(S.cleanPresets(Array(20).fill({ min: 5, max: 5 })).length, S.MAX_PRESETS);
  assert.deepStrictEqual(
    [{ min: 45, max: 90 }, { min: 2.5, max: 2.5 }, { min: 3600, max: 7200 }, { min: 60, max: 3600 }].map(S.presetLabel),
    ["45–90s", "2.5s", "1–2 h", "1–60 min"]);

  /* remembered pages */
  const A = "https://example.com/board?id=1";
  const B = "https://example.com/other";
  assert.strictEqual(S.pageKey(A + "#top"), A, "the #fragment is not part of the page");
  assert.strictEqual(S.pageKey("chrome://extensions"), "");
  assert.strictEqual(S.pageKey("not a url"), "");
  const remembered = () => Object.keys(local.d.pages || {});

  // off (the default): nothing is remembered, nothing starts by itself
  await send({ type: "start", cfg: { min: 10, max: 10 } });
  await pageLoad(7, A);
  assert.deepStrictEqual(remembered(), []);
  await send({ type: "stop" });
  assert.strictEqual(await pageLoad(7, A), null);

  // on: the page is remembered once its content script reports in, with its settings
  await send({ type: "start", cfg: { min: 10, max: 20, remember: true } });
  assert.deepStrictEqual(remembered(), [], "not before the page says where it is");
  st = await pageLoad(7, A + "#top");
  assert.strictEqual(st.page, A);
  assert.deepStrictEqual(remembered(), [A]);
  assert.strictEqual(local.d.pages[A].cfg.max, 20);
  assert.strictEqual(await send({ type: "getState", tabId: 7 }).then((s) => s.page), A, "the popup's question changes nothing");

  // the remembered page follows the tab when it goes somewhere else
  await pageLoad(7, B);
  assert.deepStrictEqual(remembered(), [B]);
  await pageLoad(7, A);

  // closing the tab (or the browser) keeps the page; opening it again starts by itself
  L.removed(7);
  await tick();
  assert.deepStrictEqual(remembered(), [A]);
  session.d.tabs = {}; // a browser restart: per-tab state is gone
  delete session.d.held;
  calls.reload.length = 0;
  calls.sync = 0;
  assert.strictEqual(await pageLoad(8, B), null, "other pages don't start");
  st = await pageLoad(8, A);
  assert.ok(st.running && st.cfg.remember, "a remembered page starts when it is opened");
  assert.strictEqual(st.min, 10);
  assert.strictEqual(st.max, 20);
  assert.strictEqual(st.refreshCount, 0);
  assert.ok(st.scheduledAt, "it waits one interval instead of refreshing the page it just loaded");
  assert.strictEqual(calls.reload.length + calls.sync, 0, "the page that asked is neither reloaded nor pinged");
  assert.strictEqual(badge.text, "0");
  st = await pageLoad(8, A);
  assert.strictEqual(st.startedAt, (await send({ type: "getState", tabId: 8 })).startedAt, "later loads carry on with the same run");

  // the same page in a second tab: stopping one keeps it remembered for the other
  st = await pageLoad(9, A);
  assert.ok(st.running);
  await from(8, A, { type: "stop" });
  assert.deepStrictEqual(remembered(), [A]);
  assert.strictEqual(await pageLoad(8, A), null, "a tab the user stopped stays stopped");
  // Stop on the last one forgets the page
  await from(9, A, { type: "stop" });
  assert.deepStrictEqual(remembered(), []);
  assert.strictEqual(await pageLoad(10, A), null);

  // a refresh that ended on its own stays remembered, but doesn't restart in the same tab
  await from(10, A, { type: "start", cfg: { min: 5, max: 5, remember: true, keepAlive: false } });
  await pageLoad(10, A);
  await from(10, A, { type: "finish", reason: "count" });
  assert.strictEqual((await pageLoad(10, A)).finished.reason, "count");
  await from(10, A, { type: "stop" }); // the badge's Dismiss button
  assert.deepStrictEqual(remembered(), [A]);
  assert.strictEqual(await pageLoad(10, A), null);
  assert.ok((await pageLoad(11, A)).running, "it does start in a new tab");

  // forgotten on the settings page while running: it is not remembered again
  local.d.pages = {};
  await pageLoad(11, B);
  assert.deepStrictEqual(remembered(), []);
  await from(11, B, { type: "stop" });

  // pressing Start with "remember" off on a remembered page forgets it
  local.d.pages = { [A]: { cfg: { min: 5, max: 5, remember: true }, at: 1 } };
  session.d.held = {};
  await from(12, A, { type: "start", cfg: { min: 5, max: 5 } });
  await pageLoad(12, A);
  assert.deepStrictEqual(remembered(), []);
  await from(12, A, { type: "stop" });

  // Stop pressed while the page is reloading: the page that loads next must not start again
  await from(13, A, { type: "start", cfg: { min: 5, max: 5, remember: true } });
  await pageLoad(13, A);
  assert.deepStrictEqual(remembered(), [A]);
  const [, afterStop] = await Promise.all([from(13, A, { type: "stop" }), pageLoad(13, A)]);
  assert.strictEqual(afterStop, null);
  assert.deepStrictEqual(remembered(), []);

  // ...also when it was stopped before the page had reported where it is
  local.d.pages = { [A]: { cfg: { min: 5, max: 5, remember: true }, at: 1 } };
  await from(14, A, { type: "start", cfg: { min: 5, max: 5, remember: true } });
  await from(14, A, { type: "stop" });
  assert.strictEqual(await pageLoad(14, A), null);
  local.d.pages = {};

  console.log("background ok");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
