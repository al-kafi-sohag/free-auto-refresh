/* Shared settings registry, loaded by the popup, the settings page and the background.

   To add a setting, add one entry to SETTINGS and its texts to i18n.js. It is then
   rendered in the UI, saved, exported/imported and passed to the tab state without
   further wiring.

   Stored in chrome.storage.local:
     defaults  last used settings (same shape since 1.0.0; new keys fall back to defaults)
     pinned    keys of advanced settings shown on the popup's main view
     profiles  { [name]: settings }
     presets   [{ min, max }] the popup's quick preset buttons (absent = the built-in five)
     pages     { [page address]: { cfg, at } } pages that start refreshing by themselves
               when they are opened; kept by the background, see "remember" below      */
(() => {
  // Group titles are translated as g.<id> in i18n.js
  const GROUPS = [
    { id: "startup" },
    { id: "limits" },
    { id: "watch" },
    { id: "alerts" },
    { id: "pause" },
    { id: "display" },
    { id: "reload" },
  ];

  // core: always on the main view. group: lives under Advanced and can be pinned.
  //
  // All text is in i18n.js (and locales/), keyed by the setting's key:
  //   s.<key>.label         required
  //   s.<key>.info          required: plain-language explanation behind the (i) button
  //   s.<key>.desc          optional one-line subtitle (toggles)
  //   s.<key>.placeholder   optional
  //   s.<key>.opt.<value>   one per option of a select
  const SETTINGS = [
    { key: "min", type: "number", default: 30, min: 1, step: 0.5, core: true },
    { key: "max", type: "number", default: 60, min: 1, step: 0.5, core: true },

    // Start again by itself when the page is reopened (also after a browser restart).
    // Off by default, so nothing starts on its own unless the user asks for it.
    { key: "remember", group: "startup", type: "toggle", default: false },

    { key: "durationMin", group: "limits", type: "number", default: 0, min: 0, step: 1 },
    { key: "maxRefreshes", group: "limits", type: "int", default: 0, min: 0, step: 1 },

    { key: "watchMode", group: "watch", type: "select", default: "none",
      options: ["none", "appears", "disappears", "changes"], companion: "watchText" },
    // Text input that belongs to watchMode; its placeholder can vary per mode
    // (s.watchText.placeholder.<mode>, falling back to s.watchText.placeholder)
    { key: "watchText", type: "text", default: "", partOf: "watchMode", hideWhen: "none" },
    // When to look at the page after a refresh: after it has loaded, plus an extra wait
    { key: "waitLoad", group: "watch", type: "toggle", default: true },
    { key: "waitDelay", group: "watch", type: "number", default: 1, min: 0, step: 0.5 },

    { key: "notify", group: "alerts", type: "toggle", default: true },

    // Hold back a refresh while the user is busy on the page
    { key: "smartPause", group: "pause", type: "toggle", default: true }, // typing
    { key: "pauseOnClick", group: "pause", type: "toggle", default: false },
    { key: "pauseOnScroll", group: "pause", type: "toggle", default: false },
    { key: "pauseAction", group: "pause", type: "select", default: "restart", options: ["restart", "stop"] },

    { key: "showBadge", group: "display", type: "toggle", default: true },
    { key: "toolbarBadge", group: "display", type: "select", default: "count", options: ["count", "countdown", "off"] },

    { key: "bypassCache", group: "reload", type: "toggle", default: false },
    { key: "keepScroll", group: "reload", type: "toggle", default: false },
    { key: "keepAlive", group: "reload", type: "toggle", default: true },
  ];

  // Everything the 1.0.0 popup showed on its main view, in its original order.
  // Users updating from 1.0.0 start with these pinned so nothing appears to go missing.
  const LEGACY_PINS = [
    "durationMin", "maxRefreshes", "watchMode", "showBadge", "bypassCache", "smartPause", "notify",
  ];

  const MAX_PROFILES = 50;
  const MAX_PRESETS = 8;
  const MAX_PAGES = 100;

  // The quick presets every install starts with (seconds)
  const DEFAULT_PRESETS = [[5, 10], [15, 30], [30, 60], [60, 120], [300, 300]];

  const byKey = Object.fromEntries(SETTINGS.map((d) => [d.key, d]));
  const isPinnable = (key) => !!byKey[key]?.group;

  function defaults() {
    return Object.fromEntries(SETTINGS.map((d) => [d.key, d.default]));
  }

  function coerce(def, value) {
    switch (def.type) {
      case "number":
      case "int": {
        const n = def.type === "int" ? parseInt(value, 10) : parseFloat(value);
        if (!Number.isFinite(n)) return def.default;
        return def.min != null ? Math.max(def.min, n) : n;
      }

      case "toggle":
        return value == null ? def.default : !!value;

      case "select":
        return def.options.includes(value) ? value : def.default;

      case "text":
        return typeof value === "string" ? value.trim().slice(0, 500) : def.default;
    }

    return def.default;
  }

  // Always returns a complete, valid settings object with only known keys
  function normalize(raw) {
    const src = raw && typeof raw === "object" ? raw : {};
    const out = {};
    for (const def of SETTINGS) {
      out[def.key] = def.key in src ? coerce(def, src[def.key]) : def.default;
    }

    return out;
  }

  function cleanPins(list) {
    return Array.isArray(list) ? [...new Set(list)].filter(isPinnable) : [];
  }

  function cleanProfiles(obj) {
    const out = {};
    if (!obj || typeof obj !== "object") return out;
    for (const [name, value] of Object.entries(obj).slice(0, MAX_PROFILES)) {
      const clean = String(name).trim().slice(0, 40);
      if (clean) out[clean] = normalize(value);
    }

    return out;
  }

  const defaultPresets = () => DEFAULT_PRESETS.map(([min, max]) => ({ min, max }));

  // Anything that isn't a list (nothing saved yet) gives the built-in presets. An empty
  // list stays empty: the user removed them all.
  function cleanPresets(list) {
    if (!Array.isArray(list)) return defaultPresets();
    const lowest = byKey.min.min;
    const out = [];
    for (const item of list) {
      let min = parseFloat(item?.min);
      let max = parseFloat(item?.max);
      if (!(min > 0)) min = max; // only one value given: a fixed interval
      if (!(max > 0)) max = min;
      if (!(min > 0)) continue;
      min = Math.max(lowest, min);
      max = Math.max(lowest, max);
      if (max < min) [min, max] = [max, min];
      out.push({ min, max });
      if (out.length === MAX_PRESETS) break;
    }

    return out;
  }

  // Button text for a preset: "5–10s", "1–2 min", "5 min", "1 h"
  function presetLabel({ min, max }) {
    const [size, unit] =
      min % 3600 === 0 && max % 3600 === 0 ? [3600, " h"]
      : min % 60 === 0 && max % 60 === 0 ? [60, " min"]
      : [1, "s"];
    const a = min / size, b = max / size;
    return (a === b ? String(a) : `${a}–${b}`) + unit;
  }

  // What identifies a remembered page: its address without the #fragment. "" for
  // addresses that can't be refreshed (browser pages, extension pages).
  function pageKey(url) {
    try {
      const u = new URL(url);
      if (!["http:", "https:", "file:"].includes(u.protocol)) return "";
      return `${u.protocol}//${u.host}${u.pathname}${u.search}`;
    } catch (e) {
      return "";
    }
  }

  function cleanPages(obj) {
    if (!obj || typeof obj !== "object") return {};
    const rows = [];
    for (const [url, value] of Object.entries(obj)) {
      if (!value || typeof value !== "object" || pageKey(url) !== url) continue;
      rows.push([url, { cfg: normalize(value.cfg), at: Number(value.at) || 0 }]);
    }

    // Over the limit, the pages remembered longest ago go first
    rows.sort((x, y) => y[1].at - x[1].at);
    return Object.fromEntries(rows.slice(0, MAX_PAGES));
  }

  async function loadPrefs() {
    const stored = await chrome.storage.local.get(["defaults", "pinned", "profiles", "presets", "pages"]);
    let pins = stored.pinned;
    if (!Array.isArray(pins)) {
      // The background normally sets this on install/update; this covers the case where it hasn't
      pins = stored.defaults ? LEGACY_PINS : [];
      await chrome.storage.local.set({ pinned: pins });
    }

    return {
      cfg: normalize(stored.defaults),
      pinned: cleanPins(pins),
      profiles: cleanProfiles(stored.profiles),
      presets: cleanPresets(stored.presets),
      pages: cleanPages(stored.pages),
    };
  }

  const saveDefaults = (cfg) => chrome.storage.local.set({ defaults: normalize(cfg) });
  const savePinned = (pins) => chrome.storage.local.set({ pinned: cleanPins(pins) });
  const saveProfiles = (profiles) => chrome.storage.local.set({ profiles: cleanProfiles(profiles) });
  const savePresets = (presets) => chrome.storage.local.set({ presets: cleanPresets(presets) });
  const savePages = (pages) => chrome.storage.local.set({ pages: cleanPages(pages) });

  globalThis.ARSettings = {
    GROUPS, SETTINGS, LEGACY_PINS, MAX_PROFILES, MAX_PRESETS, MAX_PAGES, byKey,
    isPinnable, defaults, normalize, cleanPins, cleanProfiles,
    defaultPresets, cleanPresets, presetLabel, pageKey, cleanPages,
    loadPrefs, saveDefaults, savePinned, saveProfiles, savePresets, savePages,
  };
})();
