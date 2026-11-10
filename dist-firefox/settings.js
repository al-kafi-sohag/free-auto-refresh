/* Shared settings registry, loaded by the popup, the settings page and the background.

   To add a setting, add one entry to SETTINGS and its texts to i18n.js. It is then
   rendered in the UI, saved, exported/imported and passed to the tab state without
   further wiring.

   Stored in chrome.storage.local:
     defaults  last used settings (same shape since 1.0.0; new keys fall back to defaults)
     pinned    keys of advanced settings shown on the popup's main view
     profiles  { [name]: settings }                                                    */
(() => {
  // Group titles are translated as g.<id> in i18n.js
  const GROUPS = [
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

  async function loadPrefs() {
    const stored = await chrome.storage.local.get(["defaults", "pinned", "profiles"]);
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
    };
  }

  const saveDefaults = (cfg) => chrome.storage.local.set({ defaults: normalize(cfg) });
  const savePinned = (pins) => chrome.storage.local.set({ pinned: cleanPins(pins) });
  const saveProfiles = (profiles) => chrome.storage.local.set({ profiles: cleanProfiles(profiles) });

  globalThis.ARSettings = {
    GROUPS, SETTINGS, LEGACY_PINS, MAX_PROFILES, byKey,
    isPinnable, defaults, normalize, cleanPins, cleanProfiles,
    loadPrefs, saveDefaults, savePinned, saveProfiles,
  };
})();
