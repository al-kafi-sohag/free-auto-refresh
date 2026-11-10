// Stages a clean, loadable folder per browser: dist-chrome/ and dist-firefox/.
// Both are built from the same source files; only the manifest differs.
//
//   node scripts/build.js            both browsers
//   node scripts/build.js chrome     one browser
const fs = require("fs");
const path = require("path");

// Runtime files shared by every browser. Add new source files here.
// The icons/ and locales/ folders are copied whole.
const FILES = [
  "background.js",
  "content.js",
  "i18n.js",
  "settings.js",
  "ui.js",
  "popup.html",
  "popup.js",
  "popup.css",
  "options.html",
  "options.js",
  "LICENSE",
];

const DIRS = ["icons", "locales"];

const TARGETS = {
  chrome: { manifest: "manifest.json" },
  firefox: { manifest: "manifest.firefox.json" },
};

const wanted = process.argv.slice(2);
const names = wanted.length ? wanted : Object.keys(TARGETS);

for (const name of names) {
  const target = TARGETS[name];
  if (!target) {
    console.error(`Unknown target "${name}". Use: ${Object.keys(TARGETS).join(", ")}`);
    process.exit(1);
  }

  const outDir = `dist-${name}`;
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir);

  for (const f of FILES) fs.copyFileSync(f, path.join(outDir, f));
  fs.copyFileSync(target.manifest, path.join(outDir, "manifest.json"));
  for (const dir of DIRS) fs.cpSync(dir, path.join(outDir, dir), { recursive: true });

  console.log(`Staged ${FILES.length + 1} files plus ${DIRS.join("/, ")}/ in ${outDir}/`);
}
