const $ = (id) => document.getElementById(id);
const set = (id, text) => { $(id).textContent = text; };

const S = globalThis.ARSettings;
const UI = globalThis.ARUI;
const I = globalThis.ARI18n;

const PILL_BASE = "badge";
const PILL = {
  stopped: "border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  running: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
  paused: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
  finished: "border-zinc-300 bg-zinc-900 text-zinc-50 dark:border-zinc-300 dark:bg-zinc-100 dark:text-zinc-900",
};

const RESULT_BASE = "mx-4 mt-2.5 rounded-md border px-3 py-2 text-[12px] font-medium";
const RESULT = {
  match: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200",
  done: "border-zinc-200 bg-zinc-50 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200",
};

let tabId = null;
let state = null;

let cfg = S.defaults(); // settings shown in the form
let pinned = [];        // advanced settings shown on the main view
let profiles = {};
let presets = [];       // quick preset buttons: [{ min, max }]
const openGroups = new Set(); // advanced groups currently expanded

/* ---------- helpers ---------- */
function fmt(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h) return `${h}h ${String(m).padStart(2, "0")}m`;
  if (m) return `${m}m ${String(sec).padStart(2, "0")}s`;
  return `${sec}s`;
}

function validate(c) {
  if (!(c.min > 0) || !(c.max > 0)) return I.t("error.interval");
  if ((c.watchMode === "appears" || c.watchMode === "disappears") && !String(c.watchText || "").trim()) {
    return I.t("error.watchText");
  }

  return "";
}

function showError(msg) {
  $("error").textContent = msg;
  $("error").classList.toggle("hidden", !msg);
}

/* ---------- settings form ---------- */
function onChange(key, value) {
  cfg[key] = value;
  S.saveDefaults(cfg);
  $("profile").value = ""; // the form no longer matches a saved profile
  showError("");
}

function onPin(key) {
  pinned = pinned.includes(key) ? pinned.filter((k) => k !== key) : [...pinned, key];
  S.savePinned(pinned);
  buildForm();
}

function buildProfiles() {
  const names = Object.keys(profiles);
  const select = $("profile");
  const current = select.value;
  select.replaceChildren(new Option(I.t("profile.current"), ""), ...names.map((n) => new Option(n, n)));
  select.value = names.includes(current) ? current : "";
  $("profileRow").classList.toggle("hidden", names.length === 0);
}

// The preset buttons are the user's own list, edited on the settings page
function buildPresets() {
  const chips = presets.map((preset) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip";
    chip.textContent = S.presetLabel(preset);
    chip.addEventListener("click", () => {
      cfg.min = preset.min;
      cfg.max = preset.max;
      S.saveDefaults(cfg);
      $("profile").value = "";
      buildForm();
    });
    return chip;
  });

  $("presets").replaceChildren(...chips);
  $("presets").classList.toggle("hidden", chips.length === 0);
}

function buildForm() {
  const base = { cfg, pinned, onChange, onPin };
  UI.renderList($("coreFields"), S.SETTINGS.filter((d) => d.core), { ...base, idPrefix: "core", showPins: false });
  UI.renderPinned($("pinned"), { ...base, idPrefix: "pin", showPins: false });
  $("pinned").classList.toggle("hidden", pinned.length === 0);
  UI.renderGroups($("groups"), { ...base, idPrefix: "adv", showPins: true }, openGroups);
  buildProfiles();
  applyLock();
}

// Settings can't be changed while a refresh is running on this tab
function applyLock() {
  const running = !!state?.running;
  for (const node of document.querySelectorAll("#settings input, #settings select, #settings .chip")) {
    node.disabled = running;
  }

  for (const id of ["profileRow", "core", "pinned", "groups"]) {
    $(id).classList.toggle("opacity-60", running);
  }
}

function showView(advanced) {
  $("viewMain").classList.toggle("hidden", advanced);
  $("viewAdvanced").classList.toggle("hidden", !advanced);
  buildForm(); // a value changed in one view must show in the other
}

/* ---------- rendering ---------- */
function render() {
  const s = state;
  const running = !!s?.running;
  const paused = running && s.paused;
  const finished = !running && s?.finished;

  applyLock();

  const key = paused ? "paused" : running ? "running" : finished ? "finished" : "stopped";
  $("pill").className = PILL_BASE + " " + PILL[key];
  $("pill").textContent = I.t("status." + key);

  $("toggle").textContent = I.t(running ? "btn.stop" : finished ? "btn.startAgain" : "btn.start");
  $("toggle").className = "flex-1 btn " + (running ? "btn-danger" : "btn-primary");
  $("pause").classList.toggle("hidden", !running);
  $("pause").textContent = I.t(paused ? "btn.resume" : "btn.pause");

  if (finished) {
    const f = s.finished;
    $("result").textContent =
      f.reason === "match"
        ? I.t("result.match", { n: s.refreshCount })
        : f.reason === "count"
        ? I.t("result.count", { n: s.maxRefreshes })
        : f.reason === "interaction"
        ? I.t("result.interaction")
        : I.t("result.time");
    $("result").className = RESULT_BASE + " " + RESULT[f.reason === "match" ? "match" : "done"];
  } else {
    $("result").className = "hidden";
  }

  showError("");
  tick();
}

function tick() {
  const s = state;
  const now = Date.now();

  if (!s) {
    set("statCount", "0");
    set("statNext", "–");
    set("statTime", "–");
    set("statTimeLabel", I.t("stat.elapsed"));
    $("bar").style.width = "0%";
    return;
  }

  set("statCount", s.maxRefreshes > 0 ? `${s.refreshCount}/${s.maxRefreshes}` : String(s.refreshCount));

  const live = s.running && !s.paused && s.nextAt;
  set(
    "statNext",
    s.running && s.paused ? I.t("status.paused") : live ? (Math.max(0, s.nextAt - now) / 1000).toFixed(1) + "s" : "–"
  );

  let pct = 0;
  if (live && s.scheduledAt && s.nextAt > s.scheduledAt) {
    pct = Math.min(1, Math.max(0, (now - s.scheduledAt) / (s.nextAt - s.scheduledAt)));
  }

  $("bar").style.width = (pct * 100).toFixed(1) + "%";

  if (s.running && s.endTime) {
    set("statTimeLabel", I.t("stat.timeLeft"));
    set("statTime", fmt(s.endTime - now));
  } else {
    set("statTimeLabel", I.t("stat.elapsed"));
    set("statTime", fmt((s.finished?.at ?? now) - s.startedAt));
  }
}

/* ---------- can auto refresh run on this tab? ---------- */
// Start reloads a tab that has no content script yet, so a tab that still doesn't answer
// is a page extensions can't run on. Asks twice, because a page that is in the middle of
// a refresh doesn't answer either.
const ping = () => chrome.tabs.sendMessage(tabId, { type: "ping" }).then(() => true, () => false);

async function checkContent() {
  if (tabId == null || !state?.running) {
    $("notice").classList.add("hidden");
    return;
  }

  let ok = await ping();
  if (!ok) {
    await new Promise((r) => setTimeout(r, 2500));
    ok = !state?.running || (await ping());
  }

  $("notice").classList.toggle("hidden", ok);
  if (!ok) $("notice").textContent = I.t("notice.notReady");
}

/* ---------- events ---------- */
$("editPresets").addEventListener("click", async () => {
  // Tells the settings page which section to show; it ignores a note older than a few seconds
  await chrome.storage.session.set({ optionsFocus: { id: "presetsSection", at: Date.now() } }).catch(() => {});
  chrome.runtime.openOptionsPage();
});

$("profile").addEventListener("change", () => {
  const saved = profiles[$("profile").value];
  if (!saved) return;
  cfg = S.normalize(saved);
  S.saveDefaults(cfg);
  buildForm();
});

$("openAdvanced").addEventListener("click", () => showView(true));
$("closeAdvanced").addEventListener("click", () => showView(false));
$("openOptions").addEventListener("click", () => chrome.runtime.openOptionsPage());

$("lang").addEventListener("change", async () => {
  await I.setLang($("lang").value);
  translate();
  buildForm();
  render();
  checkContent();
});

$("toggle").addEventListener("click", async () => {
  if (tabId == null) return;

  if (state?.running) {
    state = await chrome.runtime.sendMessage({ type: "stop", tabId });
    render();
    return;
  }

  const err = validate(cfg);
  if (err) return showError(err);
  if (cfg.max < cfg.min) [cfg.min, cfg.max] = [cfg.max, cfg.min];
  cfg = S.normalize(cfg);

  await S.saveDefaults(cfg);
  state = await chrome.runtime.sendMessage({ type: "start", tabId, cfg });
  buildForm();
  render();
  setTimeout(checkContent, 500);
});

$("pause").addEventListener("click", async () => {
  state = await chrome.runtime.sendMessage({ type: "togglePause", tabId });
  render();
});

$("changeShortcut").addEventListener("click", () => {
  // Firefox can't open chrome:// URLs; it has its own API for this page
  if (typeof chrome.commands.openShortcutSettings === "function") {
    chrome.commands.openShortcutSettings();
  } else {
    chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
  }
});

// Live updates from the page's content script and the background
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "session" || !changes.tabs) return;
  state = changes.tabs.newValue?.[tabId] ?? null;
  render();
});

/* ---------- language ---------- */
let shortcutKey = "";

function translate() {
  I.apply(document);
  I.fillSelect($("lang"));
  set("shortcut", shortcutKey || I.t("shortcut.notSet"));
}

/* ---------- init ---------- */
async function load() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  tabId = tab?.id ?? null;

  await I.init();
  ({ cfg, pinned, profiles, presets } = await S.loadPrefs());

  if (tabId != null) {
    state = await chrome.runtime.sendMessage({ type: "getState", tabId });
    if (state?.cfg) cfg = S.normalize(state.cfg); // show what this tab is actually running with
  } else {
    $("toggle").disabled = true;
  }

  try {
    const cmds = await chrome.commands.getAll();
    shortcutKey = cmds.find((c) => c.name === "toggle-refresh")?.shortcut || "";
  } catch (e) {}

  translate();

  buildPresets();
  buildForm();
  render();
  checkContent();
  setInterval(tick, 250);
}

load();
