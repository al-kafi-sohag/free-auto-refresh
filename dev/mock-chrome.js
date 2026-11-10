// Development only: a small stand-in for the extension APIs the popup and settings
// page use, so they can run in a normal browser tab. Not shipped with the extension.
(() => {
  const listeners = [];

  function area(name, persist) {
    const storeKey = "mock-chrome-" + name;
    const data = persist ? JSON.parse(localStorage.getItem(storeKey) || "{}") : {};
    const copy = (v) => (v === undefined ? v : JSON.parse(JSON.stringify(v)));
    return {
      async get(keys) {
        const list = keys == null ? Object.keys(data) : typeof keys === "string" ? [keys] : keys;
        return Object.fromEntries(list.filter((k) => k in data).map((k) => [k, copy(data[k])]));
      },
      async set(items) {
        const changes = {};
        for (const [k, v] of Object.entries(items)) {
          changes[k] = { oldValue: copy(data[k]), newValue: copy(v) };
          data[k] = copy(v);
        }

        if (persist) localStorage.setItem(storeKey, JSON.stringify(data));
        for (const fn of listeners) fn(changes, name);
      },
    };
  }

  const local = area("local", true);
  const session = area("session", false);
  const TAB = 1;

  // A tiny imitation of background.js: enough to drive the popup's states
  async function background(msg) {
    const tabs = (await session.get("tabs")).tabs || {};
    let st = tabs[TAB] || null;

    if (msg.type === "getState") return st;

    if (msg.type === "start") {
      const c = globalThis.ARSettings.normalize(msg.cfg);
      const now = Date.now();
      st = {
        running: true, paused: false, finished: null, cfg: c,
        min: c.min, max: c.max, durationMin: c.durationMin, maxRefreshes: c.maxRefreshes,
        endTime: c.durationMin > 0 ? now + c.durationMin * 60000 : null,
        startedAt: now, refreshCount: 0, scheduledAt: now, nextAt: now + c.min * 1000, willReload: true,
      };
    } else if (msg.type === "stop") {
      st = null;
    } else if (msg.type === "togglePause" && st) {
      st.paused = !st.paused;
    }

    if (st) tabs[TAB] = st;
    else delete tabs[TAB];
    await session.set({ tabs });
    return st;
  }

  window.chrome = {
    storage: { local, session, onChanged: { addListener: (fn) => listeners.push(fn) } },
    runtime: {
      sendMessage: background,
      openOptionsPage() { location.href = "preview.html?page=options"; },
      onMessage: { addListener() {} },
    },
    tabs: {
      async query() { return [{ id: TAB }]; },
      async getCurrent() { return undefined; }, // the preview is not an extension tab
      async sendMessage() { return true; },
      create() {},
    },
    i18n: { getUILanguage: () => navigator.language },
    commands: {
      async getAll() { return [{ name: "toggle-refresh", shortcut: "Alt+Shift+R" }]; },
    },
  };
})();
