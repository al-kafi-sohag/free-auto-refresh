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
const KEY = "tabs"; // session: { [tabId]: state }
const HELD = "held"; // session: { [tabId]: page } the page the user stopped in that tab
const ANY_PAGE = "*"; // ...or this, when it was stopped before the page said where it is
const PAGES = "pages"; // local: { [page]: { cfg, at } } remembered pages, see settings.js

/* ---------- serialized storage access (avoids read/modify/write races) ---------- */
// Everything the background keeps is read and changed inside transact(). Calls queue up,
// so each one sees the result of the one before, and a step such as "stop this tab and
// forget its page" can't be interleaved with a page load asking whether to start.
// Never call transact() or withState() from inside another one's callback.
let queue = Promise.resolve();

// fn gets { tabs, held, pages() } and changes them in place; whatever changed is saved.
// pages() loads the remembered pages on first use.
function transact(fn) {
  const run = queue.then(async () => {
    const stored = await chrome.storage.session.get([KEY, HELD]);
    const db = { tabs: stored[KEY] || {}, held: stored[HELD] || {} };
    const before = { tabs: JSON.stringify(db.tabs), held: JSON.stringify(db.held), pages: null };
    let pages = null;
    db.pages = async () => {
      if (!pages) {
        pages = S.cleanPages((await chrome.storage.local.get(PAGES))[PAGES]);
        before.pages = JSON.stringify(pages);
      }

      return pages;
    };

    const out = await fn(db);

    const changed = {};
    if (JSON.stringify(db.tabs) !== before.tabs) changed[KEY] = db.tabs;
    if (JSON.stringify(db.held) !== before.held) changed[HELD] = db.held;
    if (Object.keys(changed).length) await chrome.storage.session.set(changed);
    if (pages && JSON.stringify(pages) !== before.pages) {
      await chrome.storage.local.set({ [PAGES]: S.cleanPages(pages) });
    }

    return out;
  });
  queue = run.catch(() => {});
  return run;
}

// The per-tab states only: fn(tabs). The second argument is kept for older callers; changes
// are saved whenever there are any.
const withState = (fn, _write) => transact((db) => fn(db.tabs));

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

/* ---------- remembered pages ---------- */
// With "Remember this page" on, the page a tab is refreshing is saved together with its
// settings. When that page is opened again (a restored tab after a browser restart, a
// bookmark, a link), refreshing starts by itself. Pressing Stop forgets the page.
//
// The page's address comes from its own content script (sender.url), so this needs no
// "tabs" permission.

// Is another tab refreshing this page with "remember" on? Then it stays remembered.
const usedElsewhere = (db, tabId, page) =>
  Object.entries(db.tabs).some(([id, s]) => Number(id) !== tabId && s.running && s.cfg?.remember && s.page === page);

// Called on every page load of a tab. Returns the tab's state (null if it has none) and,
// while it is refreshing, keeps the remembered page in step with where the tab is now:
// people navigate, sites redirect.
function trackPage(tabId, page) {
  return transact(async (db) => {
    const s = db.tabs[tabId] || null;
    if (!s?.running || s.page === page) return s;
    const old = s.page || null;
    s.page = page;

    const pages = await db.pages();
    if (!s.cfg?.remember) {
      // Started here without "remember": an older note about this page no longer applies
      if (!usedElsewhere(db, tabId, page)) delete pages[page];
      return s;
    }

    if (old) {
      if (!(old in pages)) return s; // forgotten from the settings page meanwhile: leave it so
      if (!usedElsewhere(db, tabId, old)) delete pages[old];
    }

    pages[page] = { cfg: s.cfg, at: Date.now() };
    return s;
  });
}

// A page in a tab without a refresh has just loaded. Starts one if the page is remembered,
// and returns the tab's state.
async function resumePage(tabId, page) {
  const rule = S.cleanPages((await chrome.storage.local.get(PAGES))[PAGES])[page];
  if (!rule) return null;

  // The page has only just loaded, so it waits one interval instead of refreshing at once
  const st = await newState({ ...rule.cfg, remember: true });
  st.page = page;
  st.scheduledAt = st.startedAt;

  const current = await transact(async (db) => {
    if (db.tabs[tabId]) return db.tabs[tabId];
    // Checked again here, where nothing can come in between: the user may just have
    // pressed Stop, which forgets the page and holds this tab
    if (db.held[tabId] === page || db.held[tabId] === ANY_PAGE || !(page in (await db.pages()))) return null;
    db.tabs[tabId] = st;
    return st;
  });

  if (current === st) {
    applyBadge(tabId, st);
    if (st.cfg.keepAlive) setDiscardable(tabId, false);
  }

  // No "sync" message: the page's content script is the one asking, and gets this as its answer
  return current;
}

/* ---------- start / stop ---------- */
// The state a tab starts a run with
async function newState(cfg) {
  const c = S.normalize(cfg);
  if (c.max < c.min) [c.min, c.max] = [c.max, c.min];
  const { min, max, durationMin } = c;
  await I.init(); // pick up the user's current language
  const now = Date.now();

  return {
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
}

async function startTab(tabId, cfg = {}) {
  const st = await newState(cfg);
  const c = st.cfg;

  await transact((db) => {
    delete db.held[tabId];
    db.tabs[tabId] = st;
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
  const prev = await transact(async (db) => {
    const s = db.tabs[tabId] || null;
    if (!s) return null;
    delete db.tabs[tabId];

    // Stop forgets the page. Dismissing a refresh that ended on its own (a limit, a match)
    // keeps it for next time. Either way it doesn't start again in this tab by itself.
    db.held[tabId] = s.page || ANY_PAGE;
    if (s.page && s.running && !usedElsewhere(db, tabId, s.page)) delete (await db.pages())[s.page];
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
async function handle(msg, tabId, sender) {
  if (tabId == null) return null;

  switch (msg.type) {
    case "getState": {
      // A page's content script asks this each time the page loads (the popup asks with
      // msg.tabId instead). That is the moment to note where the tab is, or to start a
      // remembered page.
      const page = sender?.tab && msg.tabId == null ? S.pageKey(sender.url || sender.tab.url || "") : "";
      let st;
      if (page) st = (await trackPage(tabId, page)) || (await resumePage(tabId, page));
      else st = await withState((d) => d[tabId] || null);
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
  handle(msg, tabId, sender).then(sendResponse, (err) => {
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
// Closing a tab ends its refresh but keeps its page remembered: closing the browser looks
// the same from here, and the page should start again when it comes back.
chrome.tabs.onRemoved.addListener((tabId) => {
  transact((db) => {
    delete db.tabs[tabId];
    delete db.held[tabId];
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