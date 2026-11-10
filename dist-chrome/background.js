// Chrome runs this file as a service worker and loads the shared scripts here.
// Firefox runs it as a background script and loads the same list from its manifest.
if (typeof importScripts === "function") {
  importScripts(
    "i18n.js",
    "locales/ro.js", "locales/ru.js", "locales/zh.js", "locales/ja.js", "locales/bn.js", "locales/th.js",
    "settings.js"
  );
}

const S = globalThis.ARSettings;
const I = globalThis.ARI18n;
const KEY = "tabs"; // { [tabId]: state }

/* ---------- serialized state access (avoids read/modify/write races) ---------- */
let queue = Promise.resolve();
function withState(fn, write = true) {
  const run = queue.then(async () => {
    const data = (await chrome.storage.session.get(KEY))[KEY] || {};
    const out = await fn(data);
    if (write) await chrome.storage.session.set({ [KEY]: data });
    return out;
  });
  queue = run.catch(() => {});
  return run;
}

const syncTab = (tabId) =>
  chrome.tabs.sendMessage(tabId, { type: "sync" }).catch(() => {});

// The toolbar icon and notification icon are the logo files in icons/, declared in the manifest.

/* ---------- toolbar badge (refresh count or countdown, per tab) ---------- */
const shortNum = (n) =>
  n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "k" : String(n);

// Time until the next refresh, short enough for the badge: "45", "3m", "2h"
function countdownText(st) {
  if (!st.nextAt) return "…";
  const s = Math.max(0, Math.ceil((st.nextAt - Date.now()) / 1000));
  if (s < 100) return String(s);
  if (s < 6000) return Math.ceil(s / 60) + "m";
  return Math.round(s / 3600) + "h";
}

async function applyBadge(tabId, st) {
  try {
    const mode = st?.cfg?.toolbarBadge || "count"; // count | countdown | off
    if (!st || mode === "off") {
      await chrome.action.setBadgeText({ tabId, text: "" });
      return;
    }

    let text, color;
    if (st.running) {
      text = mode === "countdown" && !st.paused ? countdownText(st) : shortNum(st.refreshCount);
      color = st.paused ? "#d97706" : "#16a34a";
    } else if (st.finished?.reason === "match") {
      text = "!";
      color = "#e11d48";
    } else {
      text = "✓";
      color = "#4f46e5";
    }

    await chrome.action.setBadgeText({ tabId, text });
    await chrome.action.setBadgeBackgroundColor({ tabId, color });
    if (chrome.action.setBadgeTextColor) {
      await chrome.action.setBadgeTextColor({ tabId, color: "#ffffff" });
    }
  } catch (e) {
    /* tab may be gone */
  }
}

/* ---------- start / stop ---------- */
async function startTab(tabId, cfg = {}) {
  const c = S.normalize(cfg);
  if (c.max < c.min) [c.min, c.max] = [c.max, c.min];
  const { min, max, durationMin } = c;
  await I.init(); // pick up the user's current language
  const now = Date.now();

  const st = {
    running: true,
    paused: false,
    finished: null,
    cfg: c, // the full settings this run started with
    strings: I.pick("b."), // on-page badge texts, so the content script needs no translations
    min,
    max,
    durationMin,
    maxRefreshes: c.maxRefreshes,
    endTime: durationMin > 0 ? now + durationMin * 60000 : null,
    startedAt: now,
    refreshCount: 0,
    scheduledAt: null,
    nextAt: null,
    willReload: true,
    showBadge: c.showBadge,
    bypassCache: c.bypassCache,
    smartPause: c.smartPause,
    notify: c.notify,
    watch: { mode: c.watchMode, text: c.watchText, baseline: null },
  };

  await withState((d) => {
    d[tabId] = st;
  });
  applyBadge(tabId, st);
  if (c.keepAlive) setDiscardable(tabId, false);

  // A tab opened before the extension was installed or updated has no content script.
  // Starting always begins with a refresh anyway, so do that refresh from here: the
  // reloaded page gets the content script and carries on.
  const alive = await chrome.tabs.sendMessage(tabId, { type: "ping" }).then(() => true, () => false);
  if (alive) {
    syncTab(tabId);
    return st;
  }

  const counted = await withState((d) => {
    const s = d[tabId];
    if (!s?.running) return null;
    s.refreshCount += 1;
    return s;
  });
  if (!counted) return st;
  applyBadge(tabId, counted);
  chrome.tabs.reload(tabId, { bypassCache: !!counted.bypassCache }).catch(() => {});
  return counted;
}

async function stopTab(tabId) {
  const prev = await withState((d) => {
    const s = d[tabId] || null;
    delete d[tabId];
    return s;
  });
  if (prev?.cfg?.keepAlive) setDiscardable(tabId, true);
  applyBadge(tabId, null);
  syncTab(tabId);
  return null;
}

// Asks the browser not to put the tab to sleep (Memory Saver and similar) while it is
// refreshing. Best effort: the browser may still discard it when memory is critically low.
function setDiscardable(tabId, allowed) {
  try {
    Promise.resolve(chrome.tabs.update(tabId, { autoDiscardable: allowed })).catch(() => {});
  } catch (e) {
    /* not supported by this browser */
  }
}

/* ---------- notifications ---------- */
async function notifyMatch(tabId, st) {
  try {
    await I.init();
    const w = st.watch;
    const what =
      w.mode === "appears" ? I.t("n.appeared", { text: w.text })
      : w.mode === "disappears" ? I.t("n.disappeared", { text: w.text })
      : I.t("n.changed");
    chrome.notifications.create(`ar-${tabId}-${Date.now()}`, {
      type: "basic",
      iconUrl: chrome.runtime.getURL("icons/icon-128.png"),
      title: I.t("n.title"),
      message: `${what} ${I.t("n.after", { n: st.refreshCount })}`,
      priority: 2,
    });
  } catch (e) {
    console.warn("Notification failed", e);
  }
}

chrome.notifications.onClicked.addListener(async (id) => {
  const m = /^ar-(\d+)-/.exec(id);
  if (!m) return;
  try {
    const tab = await chrome.tabs.update(Number(m[1]), { active: true });
    await chrome.windows.update(tab.windowId, { focused: true });
  } catch (e) {}
  chrome.notifications.clear(id);
});

/* ---------- message router ---------- */
async function handle(msg, tabId) {
  if (tabId == null) return null;

  switch (msg.type) {
    case "getState": {
      const st = await withState((d) => d[tabId] || null, false);
      applyBadge(tabId, st);
      return st;
    }

    case "start":
      return startTab(tabId, msg.cfg);

    case "stop":
      return stopTab(tabId);

    case "togglePause": {
      const st = await withState((d) => {
        const s = d[tabId];
        if (s?.running) s.paused = !s.paused;
        return s || null;
      });
      applyBadge(tabId, st);
      syncTab(tabId);
      return st;
    }

    case "schedule": {
      const st = await withState((d) => {
        const s = d[tabId];
        if (!s?.running) return null;
        s.scheduledAt = msg.startAt;
        s.nextAt = msg.nextAt;
        s.willReload = msg.willReload;
        return s;
      });
      if (st?.cfg?.toolbarBadge === "countdown") applyBadge(tabId, st);
      return true;
    }

    // Sent once a second by the page while the toolbar shows a countdown
    case "tickBadge": {
      const st = await withState((d) => d[tabId] || null, false);
      if (st?.running) applyBadge(tabId, st);
      return true;
    }

    case "setBaseline":
      await withState((d) => {
        const s = d[tabId];
        if (s?.running) s.watch.baseline = msg.hash;
      });
      return true;

    case "reload": {
      const st = await withState((d) => {
        const s = d[tabId];
        if (s?.running && !s.paused) {
          s.refreshCount += 1;
          s.nextAt = null;
          s.scroll = msg.scroll || null; // where the page was, for "keep scroll position"
          return s;
        }

        return null;
      });
      if (!st) return false;
      applyBadge(tabId, st);
      await chrome.tabs.reload(tabId, { bypassCache: !!st.bypassCache });
      return true;
    }

    case "finish": {
      const st = await withState((d) => {
        const s = d[tabId];
        if (!s?.running) return null;
        s.running = false;
        s.paused = false;
        s.nextAt = null;
        s.finished = { reason: msg.reason, at: Date.now() };
        return s;
      });
      if (!st) return false;
      applyBadge(tabId, st);
      if (st.cfg?.keepAlive) setDiscardable(tabId, true);
      if (msg.reason === "match" && st.notify) notifyMatch(tabId, st);
      syncTab(tabId);
      return true;
    }
  }

  return null;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const tabId = msg.tabId ?? sender.tab?.id;
  handle(msg, tabId).then(sendResponse, (err) => {
    console.error(err);
    sendResponse(null);
  });
  return true; // async response
});

/* ---------- install / update ---------- */
chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  const { pinned } = await chrome.storage.local.get("pinned");
  if (Array.isArray(pinned)) return;
  // Updating from a version without pinning: keep every setting the old popup showed
  // on the main view. New installs start with the simple view.
  await chrome.storage.local.set({ pinned: reason === "update" ? S.LEGACY_PINS : [] });
});

/* ---------- housekeeping ---------- */
chrome.tabs.onRemoved.addListener((tabId) => {
  withState((d) => {
    delete d[tabId];
  });
});

// Chrome can reset the per-tab badge on navigation, so re-apply it
chrome.tabs.onUpdated.addListener((tabId, info) => {
  if (info.status !== "complete") return;
  withState((d) => d[tabId] || null, false).then((st) => st && applyBadge(tabId, st));
});

/* ---------- keyboard shortcut ---------- */
chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "toggle-refresh") return;
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab) return;
  const st = await withState((d) => d[tab.id] || null, false);
  if (st?.running) return stopTab(tab.id);
  const { defaults } = await chrome.storage.local.get("defaults");
  return startTab(tab.id, defaults);
});