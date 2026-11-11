const $ = (id) => document.getElementById(id);

const S = globalThis.ARSettings;
const UI = globalThis.ARUI;
const I = globalThis.ARI18n;

const EXPORT_APP = "free-auto-refresh";

let cfg = S.defaults();
let pinned = [];
let profiles = {};
let presets = []; // [{ min, max }], as typed: a value may be NaN while a field is being edited
let pages = {};   // remembered pages, { [address]: { cfg, at } }
let statusTimer = null;

/* ---------- helpers ---------- */
function flash(text) {
  $("status").textContent = text;
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => { $("status").textContent = ""; }, 2500);
}

function showError(id, msg) {
  $(id).textContent = msg;
  $(id).classList.toggle("hidden", !msg);
}

/* ---------- settings ---------- */
function onChange(key, value) {
  cfg[key] = value;
  S.saveDefaults(cfg);
  flash(I.t("flash.saved"));
}

function onPin(key) {
  const wasPinned = pinned.includes(key);
  pinned = wasPinned ? pinned.filter((k) => k !== key) : [...pinned, key];
  S.savePinned(pinned);
  buildSettings();
  flash(I.t(wasPinned ? "flash.unpinned" : "flash.pinned"));
}

function buildSettings() {
  const ctx = { cfg, pinned, onChange, onPin, idPrefix: "opt", showPins: true };
  UI.renderList($("coreFields"), S.SETTINGS.filter((d) => d.core), ctx);
  UI.renderGroups($("groups"), ctx, true);
}

/* ---------- quick presets ---------- */
function savePresets() {
  S.savePresets(presets); // rows that aren't valid yet are left out of what is saved
  flash(I.t("flash.saved"));
}

function presetRow(row) {
  const item = document.createElement("li");
  item.className = "flex items-center gap-2";

  // What the button in the popup will say
  const preview = document.createElement("span");
  preview.className = "chip min-w-0 truncate";

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "btn btn-ghost btn-sm ml-auto shrink-0";
  remove.textContent = I.t("opt.presets.remove");
  remove.addEventListener("click", () => {
    presets = presets.filter((p) => p !== row);
    savePresets();
    buildPresets();
  });

  const inputs = {};
  const show = () => {
    const [valid] = S.cleanPresets([row]);
    preview.textContent = valid ? S.presetLabel(valid) : "–";
    remove.setAttribute("aria-label", `${I.t("opt.presets.remove")}: ${preview.textContent}`);
  };

  for (const key of ["min", "max"]) {
    const input = document.createElement("input");
    input.type = "number";
    input.className = "field w-24 shrink-0";
    input.min = S.byKey[key].min;
    input.step = S.byKey[key].step;
    input.value = Number.isFinite(row[key]) ? row[key] : "";
    input.setAttribute("aria-label", I.t(`s.${key}.label`));
    input.addEventListener("input", () => {
      row[key] = parseFloat(input.value);
      show();
      savePresets();
    });
    // Leaving the field tidies the row in place: swaps a reversed pair, fills in a missing
    // value. The list isn't rebuilt here, so the field being moved to keeps the focus.
    input.addEventListener("change", () => {
      const [valid] = S.cleanPresets([row]);
      if (!valid) return;
      Object.assign(row, valid);
      inputs.min.value = row.min;
      inputs.max.value = row.max;
    });
    inputs[key] = input;
  }

  show();
  item.append(inputs.min, inputs.max, preview, remove);
  return item;
}

function buildPresets() {
  const head = document.createElement("li");
  head.className = "hint flex items-center gap-2";
  for (const key of ["min", "max"]) {
    const cell = document.createElement("span");
    cell.className = "w-24 shrink-0";
    cell.textContent = I.t(`s.${key}.label`);
    head.append(cell);
  }

  const rows = presets.map(presetRow);
  $("presetList").replaceChildren(...(rows.length ? [head, ...rows] : []));
  $("noPresets").classList.toggle("hidden", rows.length > 0);
  $("addPreset").disabled = presets.length >= S.MAX_PRESETS;
}

function addPreset() {
  if (presets.length >= S.MAX_PRESETS) return;
  presets.push({ min: cfg.min, max: cfg.max }); // starts as the interval set above
  savePresets();
  buildPresets();
  $("presetList").lastElementChild?.querySelector("input")?.focus();
}

function resetPresets() {
  presets = S.defaultPresets();
  S.savePresets(presets);
  buildPresets();
  flash(I.t("flash.presetsReset"));
}

/* ---------- remembered pages ---------- */
function buildPages() {
  const urls = Object.keys(pages).sort((a, b) => pages[b].at - pages[a].at);
  $("noPages").classList.toggle("hidden", urls.length > 0);

  const rows = urls.map((url) => {
    const row = document.createElement("li");
    row.className = "flex items-center justify-between gap-2 py-2";

    const text = document.createElement("span");
    text.className = "min-w-0";
    const address = document.createElement("span");
    address.className = "block truncate font-medium";
    address.textContent = url.replace(/^https?:\/\//, "");
    address.title = url;
    const interval = document.createElement("span");
    interval.className = "hint block";
    interval.textContent = S.presetLabel(pages[url].cfg);
    text.append(address, interval);

    const forget = document.createElement("button");
    forget.type = "button";
    forget.className = "btn btn-ghost btn-sm shrink-0";
    forget.textContent = I.t("opt.pages.forget");
    forget.setAttribute("aria-label", `${I.t("opt.pages.forget")}: ${url}`);
    forget.addEventListener("click", async () => {
      // Read again first: the background adds and removes pages while tabs are refreshing
      const latest = S.cleanPages((await chrome.storage.local.get("pages")).pages);
      delete latest[url];
      pages = latest;
      await S.savePages(pages);
      buildPages();
      flash(I.t("flash.forgotten"));
    });

    row.append(text, forget);
    return row;
  });

  $("pageList").replaceChildren(...rows);
}

// The list follows what the background remembers and forgets while this page is open
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local" || !changes.pages) return;
  pages = S.cleanPages(changes.pages.newValue);
  buildPages();
});

/* ---------- profiles ---------- */
function buildProfiles() {
  const names = Object.keys(profiles).sort((a, b) => a.localeCompare(b));
  $("noProfiles").classList.toggle("hidden", names.length > 0);

  const rows = names.map((name) => {
    const row = document.createElement("li");
    row.className = "flex items-center justify-between gap-2 py-2";

    const label = document.createElement("span");
    label.className = "min-w-0 truncate font-medium";
    label.textContent = name;

    const actions = document.createElement("span");
    actions.className = "flex shrink-0 gap-1.5";

    const apply = document.createElement("button");
    apply.type = "button";
    apply.className = "btn btn-ghost btn-sm";
    apply.textContent = I.t("opt.profiles.use");
    apply.setAttribute("aria-label", `${I.t("opt.profiles.use")}: ${name}`);
    apply.addEventListener("click", () => {
      cfg = S.normalize(profiles[name]);
      S.saveDefaults(cfg);
      buildSettings();
      flash(I.t("flash.loaded", { name }));
    });

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "btn btn-ghost btn-sm";
    remove.textContent = I.t("opt.profiles.delete");
    remove.setAttribute("aria-label", `${I.t("opt.profiles.delete")}: ${name}`);
    remove.addEventListener("click", () => {
      if (!confirm(I.t("opt.profiles.confirmDelete", { name }))) return;
      delete profiles[name];
      S.saveProfiles(profiles);
      buildProfiles();
      flash(I.t("flash.profileDeleted"));
    });

    actions.append(apply, remove);
    row.append(label, actions);
    return row;
  });

  $("profileList").replaceChildren(...rows);
}

function saveProfile() {
  const name = $("profileName").value.trim();
  if (!name) return showError("profileError", I.t("opt.profiles.errName"));

  const exists = name in profiles;
  if (!exists && Object.keys(profiles).length >= S.MAX_PROFILES) {
    return showError("profileError", I.t("opt.profiles.errMax", { n: S.MAX_PROFILES }));
  }

  if (exists && !confirm(I.t("opt.profiles.confirmReplace", { name }))) return;

  showError("profileError", "");
  profiles[name] = S.normalize(cfg);
  S.saveProfiles(profiles);
  $("profileName").value = "";
  buildProfiles();
  flash(I.t("flash.profileSaved"));
}

/* ---------- backup ---------- */
function exportToFile() {
  const data = {
    app: EXPORT_APP,
    format: 1,
    exportedAt: new Date().toISOString(),
    settings: S.normalize(cfg),
    pinned,
    presets: S.cleanPresets(presets),
    profiles,
  };

  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `free-auto-refresh-settings-${data.exportedAt.slice(0, 10)}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  flash(I.t("flash.exported"));
}

async function importFromFile(file) {
  let data;
  try {
    data = JSON.parse(await file.text());
  } catch (e) {
    return showError("backupError", I.t("opt.backup.errJson"));
  }

  if (!data || data.app !== EXPORT_APP) {
    return showError("backupError", I.t("opt.backup.errApp"));
  }

  // Settings, pins and presets are replaced (presets only if the file has them: files from
  // before 1.2.0 don't); profiles are merged, with imported ones winning on a name clash
  showError("backupError", "");
  cfg = S.normalize(data.settings);
  if (Array.isArray(data.pinned)) pinned = S.cleanPins(data.pinned);
  if (Array.isArray(data.presets)) presets = S.cleanPresets(data.presets);
  profiles = S.cleanProfiles({ ...profiles, ...S.cleanProfiles(data.profiles) });

  await Promise.all([S.saveDefaults(cfg), S.savePinned(pinned), S.savePresets(presets), S.saveProfiles(profiles)]);
  buildSettings();
  buildPresets();
  buildProfiles();
  flash(I.t("flash.imported"));
}

/* ---------- back ---------- */
// The settings page opens in its own tab, so "back" means closing that tab: the browser
// then shows the page the user came from. If the page was reached by a normal navigation
// instead (the development preview does that), go back in history.
async function goBack() {
  try {
    const tab = await chrome.tabs.getCurrent();
    if (tab?.id != null) {
      await chrome.tabs.remove(tab.id);
      return;
    }
  } catch (e) {}

  if (history.length > 1) history.back();
  else window.close();
}

/* ---------- events ---------- */
$("back").addEventListener("click", goBack);
$("addPreset").addEventListener("click", addPreset);
$("resetPresets").addEventListener("click", resetPresets);
$("saveProfile").addEventListener("click", saveProfile);
$("profileName").addEventListener("keydown", (e) => {
  if (e.key === "Enter") saveProfile();
});

$("exportBtn").addEventListener("click", exportToFile);
$("importBtn").addEventListener("click", () => $("importFile").click());
$("importFile").addEventListener("change", () => {
  const [file] = $("importFile").files;
  if (file) importFromFile(file);
  $("importFile").value = ""; // allow importing the same file again
});

$("lang").addEventListener("change", async () => {
  await I.setLang($("lang").value);
  translate();
  buildSettings();
  buildPresets();
  buildPages();
  buildProfiles();
});

/* ---------- init ---------- */
function translate() {
  I.apply(document);
  I.fillSelect($("lang"));
  document.title = I.t("opt.title");
}

async function load() {
  await I.init();
  ({ cfg, pinned, profiles, presets, pages } = await S.loadPrefs());
  translate();
  buildSettings();
  buildPresets();
  buildPages();
  buildProfiles();

  // Opened from the popup's "Edit" next to the presets: go straight to that section
  try {
    const { optionsFocus } = await chrome.storage.session.get("optionsFocus");
    if (optionsFocus && Date.now() - optionsFocus.at < 5000) {
      document.getElementById(optionsFocus.id)?.scrollIntoView({ block: "start" });
    }
  } catch (e) {}
}

load();
