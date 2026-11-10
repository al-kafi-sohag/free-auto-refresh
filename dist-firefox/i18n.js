/* Translations and language switching, shared by the popup, the settings page and the background.

   English lives here and is the fallback for any missing string. Other languages are in
   locales/<code>.js and register themselves with ARI18n.add().

   The browser's own extension i18n (_locales) can't switch language at runtime, so the
   user's choice is stored in chrome.storage.local as `lang` ("auto" or a language code).

   Naming: s.<setting>.label / .desc / .info / .placeholder / .opt.<value> for settings,
   g.<group> for setting groups, b.* for the on-page badge, n.* for notifications.       */
(() => {
  const LANGS = [
    ["en", "English"],
    ["ro", "Română"],
    ["ru", "Русский"],
    ["zh", "简体中文"],
    ["ja", "日本語"],
    ["bn", "বাংলা"],
    ["th", "ไทย"],
  ];

  const HTML_LANG = { zh: "zh-CN" };

  const messages = {
    en: {
      "app.title": "Auto Refresh",
      "app.subtitle": "Fixed or random intervals",

      "status.stopped": "Stopped",
      "status.running": "Running",
      "status.paused": "Paused",
      "status.finished": "Finished",

      "stat.refreshes": "Refreshes",
      "stat.next": "Next in",
      "stat.elapsed": "Elapsed",
      "stat.timeLeft": "Time left",

      "btn.start": "Start",
      "btn.stop": "Stop",
      "btn.startAgain": "Start again",
      "btn.pause": "Pause",
      "btn.resume": "Resume",

      "presets.label": "Quick presets",
      "interval.hint": "Same value = fixed interval. Different values = a new random wait every time.",

      "adv.open": "Advanced settings",
      "adv.hint": "Pin a setting to keep it on the main view.",
      "pin.add": "Pin to the main view",
      "pin.remove": "Unpin from the main view",
      "pin.count": "{n} pinned",
      "info.show": "What does this do?",

      "profile.label": "Profile",
      "profile.current": "Current settings",

      "shortcut.toggle": "Toggle with",
      "shortcut.change": "change",
      "shortcut.notSet": "not set",
      "options.open": "All settings",

      "lang.label": "Language",
      "lang.auto": "Auto (browser language)",

      "error.interval": "Enter valid interval times.",
      "error.watchText": "Enter the text you want to watch for.",

      "result.match": "Match found. Refreshes: {n}.",
      "result.count": "Refresh limit reached ({n}).",
      "result.time": "Time limit reached.",
      "result.interaction": "Stopped because you clicked or scrolled.",

      "notice.notReady": "Auto refresh can't run on this page. Browser pages (chrome://, about:) and the extension store are off limits to extensions.",

      "g.limits": "Limits",
      "g.watch": "Watch the page",
      "g.alerts": "Alerts",
      "g.pause": "Smart pause",
      "g.display": "Display",
      "g.reload": "Reloading",

      "s.min.label": "Min (sec)",
      "s.min.info": "The shortest wait between two refreshes, in seconds.",
      "s.max.label": "Max (sec)",
      "s.max.info": "The longest wait between two refreshes, in seconds. Set it to the same value as Min for a fixed interval.",

      "s.durationMin.label": "Stop after (min)",
      "s.durationMin.placeholder": "0 = never",
      "s.durationMin.info": "Stops refreshing on its own after this many minutes. 0 means it keeps going until you stop it.",
      "s.maxRefreshes.label": "Max refreshes",
      "s.maxRefreshes.placeholder": "0 = unlimited",
      "s.maxRefreshes.info": "Stops after the page has been refreshed this many times. 0 means no limit.",

      "s.watchMode.label": "Watch the page",
      "s.watchMode.info": "Checks the page after every refresh and stops when your condition is met. Handy when you are waiting for stock, tickets or results.",
      "s.watchMode.opt.none": "Don't watch",
      "s.watchMode.opt.appears": "Stop when text appears",
      "s.watchMode.opt.disappears": "Stop when text disappears",
      "s.watchMode.opt.changes": "Stop when content changes",
      "s.watchText.placeholder": "Text to look for",
      "s.watchText.placeholder.changes": "CSS selector (optional), e.g. #price",

      "s.waitLoad.label": "Wait for the page to load",
      "s.waitLoad.desc": "Check only after the page has finished loading",
      "s.waitLoad.info": "Waits until the page has fully loaded before looking for your text or changes. Turn it off only if a page never finishes loading.",
      "s.waitDelay.label": "Extra wait (sec)",
      "s.waitDelay.info": "After the page has loaded, waits this many more seconds before checking it. Raise it for pages that show their content late.",

      "s.notify.label": "Notify on match",
      "s.notify.desc": "Desktop notification and title flash",
      "s.notify.info": "When the watched condition is met, shows a desktop notification and flashes the tab title so you notice it.",

      "s.smartPause.label": "Pause while typing",
      "s.smartPause.desc": "Wait if you're typing in a form field",
      "s.smartPause.info": "If you are typing in a form when a refresh is due, it waits until you stop, so you don't lose what you typed.",

      "s.pauseOnClick.label": "Pause when you click",
      "s.pauseOnClick.desc": "Clicking the page holds back the next refresh",
      "s.pauseOnClick.info": "If you click anywhere on the page, the refresh is held back so the page doesn't reload while you are using it. What happens next is set by the option below.",
      "s.pauseOnScroll.label": "Pause when you scroll",
      "s.pauseOnScroll.desc": "Scrolling the page holds back the next refresh",
      "s.pauseOnScroll.info": "If you scroll the page, the refresh is held back so you don't lose your place while reading. What happens next is set by the option below.",
      "s.pauseAction.label": "When you click or scroll",
      "s.pauseAction.info": "Restart the countdown: the wait starts again from the beginning each time you click or scroll. Stop refreshing: auto refresh turns off until you press Start again.",
      "s.pauseAction.opt.restart": "Restart the countdown",
      "s.pauseAction.opt.stop": "Stop refreshing",

      "s.showBadge.label": "On-page badge",
      "s.showBadge.desc": "Live counter and countdown on the page",
      "s.showBadge.info": "Shows a small movable counter on the page with the number of refreshes, the countdown, and pause and stop buttons.",

      "s.toolbarBadge.label": "Toolbar icon shows",
      "s.toolbarBadge.info": "Chooses the small number shown on the extension's icon in the browser toolbar.",
      "s.toolbarBadge.opt.count": "Number of refreshes",
      "s.toolbarBadge.opt.countdown": "Time until the next refresh",
      "s.toolbarBadge.opt.off": "Nothing",

      "s.bypassCache.label": "Hard reload",
      "s.bypassCache.desc": "Bypass the cache on every refresh",
      "s.bypassCache.info": "Loads everything fresh from the website instead of using saved copies. Slower, but always shows the newest version.",

      "s.keepScroll.label": "Keep scroll position",
      "s.keepScroll.desc": "Return to the same place after each refresh",
      "s.keepScroll.info": "After each refresh, the page scrolls back to where you were, so you don't have to find your place again.",
      "s.keepAlive.label": "Keep the tab awake",
      "s.keepAlive.desc": "Stop the browser from putting this tab to sleep",
      "s.keepAlive.info": "Browsers put unused tabs to sleep to save memory, which stops refreshing. This asks the browser to keep the tab awake while auto refresh is running.",

      "opt.back": "Back",
      "opt.title": "Free Auto Refresh settings",
      "opt.subtitle": "Stored only in this browser. No account, nothing sent anywhere.",
      "opt.settings.title": "Settings",
      "opt.settings.hint": "Used the next time you press Start. A tab that is already refreshing keeps the settings it started with. Pinned settings appear on the popup's main view.",
      "opt.profiles.title": "Profiles",
      "opt.profiles.hint": "Save the settings above under a name, then switch between profiles from the popup.",
      "opt.profiles.placeholder": "Profile name, e.g. Ticket watch",
      "opt.profiles.save": "Save profile",
      "opt.profiles.none": "No saved profiles yet.",
      "opt.profiles.use": "Use",
      "opt.profiles.delete": "Delete",
      "opt.profiles.errName": "Enter a name for the profile.",
      "opt.profiles.errMax": "You can save up to {n} profiles. Delete one first.",
      "opt.profiles.confirmDelete": "Delete the profile \"{name}\"?",
      "opt.profiles.confirmReplace": "Replace the existing profile \"{name}\"?",
      "opt.backup.title": "Backup",
      "opt.backup.hint": "Export your settings, pins and profiles to a file, or import them on another browser.",
      "opt.backup.export": "Export to file",
      "opt.backup.import": "Import from file",
      "opt.backup.errJson": "That file isn't valid JSON.",
      "opt.backup.errApp": "That file wasn't exported from Free Auto Refresh.",

      "flash.saved": "Saved",
      "flash.pinned": "Pinned to the popup",
      "flash.unpinned": "Unpinned",
      "flash.loaded": "Loaded \"{name}\"",
      "flash.profileSaved": "Profile saved",
      "flash.profileDeleted": "Profile deleted",
      "flash.exported": "Exported",
      "flash.imported": "Imported",

      "b.refreshes": "refreshes",
      "b.nextRefresh": "next refresh",
      "b.endsIn": "ends in",
      "b.checking": "checking page",
      "b.starting": "starting",
      "b.paused": "Paused",
      "b.resumeHint": "press play to resume",
      "b.match": "Match found",
      "b.limit": "Limit reached",
      "b.timeUp": "Time's up",
      "b.stopped": "stopped",
      "b.typing": "Waiting… you're typing",
      "b.refreshing": "Refreshing…",
      "b.resume": "Resume",
      "b.pause": "Pause",
      "b.stop": "Stop",
      "b.dismiss": "Dismiss",
      "b.titleFlash": "🔔 Match found!",
      "b.restarted": "Countdown restarted",
      "b.userStop": "You used the page",

      "n.title": "Auto Refresh: match found",
      "n.appeared": "\"{text}\" appeared.",
      "n.disappeared": "\"{text}\" disappeared.",
      "n.changed": "The watched content changed.",
      "n.after": "Refreshes: {n}. Click to jump to the tab.",
    },
  };

  let choice = "auto"; // what the user picked: "auto" or a language code
  let current = "en";  // the language actually in use

  function add(code, dict) {
    messages[code] = dict;
  }

  function detect() {
    let ui = "en";
    try {
      ui = chrome.i18n?.getUILanguage?.() || globalThis.navigator?.language || "en";
    } catch (e) {}
    const base = ui.toLowerCase().split(/[-_]/)[0];
    return messages[base] ? base : "en";
  }

  async function init() {
    let saved;
    try {
      saved = (await chrome.storage.local.get("lang")).lang;
    } catch (e) {}
    choice = saved && messages[saved] ? saved : "auto";
    current = choice === "auto" ? detect() : choice;
    return current;
  }

  async function setLang(code) {
    choice = messages[code] ? code : "auto";
    current = choice === "auto" ? detect() : choice;
    await chrome.storage.local.set({ lang: choice });
    return current;
  }

  const has = (key) => key in messages.en;

  function t(key, vars) {
    const text = messages[current]?.[key] ?? messages.en[key] ?? key;
    return vars ? text.replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? "") : text;
  }

  // All strings under a prefix, e.g. pick("b.") -> { refreshes: "...", ... }
  function pick(prefix) {
    const out = {};
    for (const key of Object.keys(messages.en)) {
      if (key.startsWith(prefix)) out[key.slice(prefix.length)] = t(key);
    }

    return out;
  }

  // Translates static markup:
  //   data-i18n="key"                         -> text content
  //   data-i18n-attr="title:key;aria-label:key" -> attributes
  function apply(root = document) {
    for (const node of root.querySelectorAll("[data-i18n]")) node.textContent = t(node.dataset.i18n);
    for (const node of root.querySelectorAll("[data-i18n-attr]")) {
      for (const pair of node.dataset.i18nAttr.split(";")) {
        const [attr, key] = pair.split(":").map((s) => s.trim());
        if (attr && key) node.setAttribute(attr, t(key));
      }
    }

    if (root === document) document.documentElement.lang = HTML_LANG[current] || current;
  }

  // Fills a <select> with "Auto" plus every language, each shown in its own name
  function fillSelect(select) {
    select.replaceChildren(
      new Option(t("lang.auto"), "auto"),
      ...LANGS.map(([code, name]) => new Option(name, code))
    );
    select.value = choice;
  }

  globalThis.ARI18n = {
    LANGS, messages, add, init, setLang, has, t, pick, apply, fillSelect,
    get lang() { return current; },
    get choice() { return choice; },
  };
})();
