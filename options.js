const $ = (id) => document.getElementById(id);

const S = globalThis.ARSettings;
const UI = globalThis.ARUI;
const I = globalThis.ARI18n;

const EXPORT_APP = "free-auto-refresh";

let cfg = S.defaults();
let pinned = [];
let profiles = {};
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

  // Settings and pins are replaced; profiles are merged, with imported ones winning on a name clash
  showError("backupError", "");
  cfg = S.normalize(data.settings);
  if (Array.isArray(data.pinned)) pinned = S.cleanPins(data.pinned);
  profiles = S.cleanProfiles({ ...profiles, ...S.cleanProfiles(data.profiles) });

  await Promise.all([S.saveDefaults(cfg), S.savePinned(pinned), S.saveProfiles(profiles)]);
  buildSettings();
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
  ({ cfg, pinned, profiles } = await S.loadPrefs());
  translate();
  buildSettings();
  buildProfiles();
}

load();
