// Development only: checks that every language has every string, with the same
// {placeholders} as English, and that every setting has the texts the UI needs.
//   node dev/check-i18n.js
const assert = require("assert");
const path = require("path");

const root = path.resolve(__dirname, "..");
globalThis.chrome = { storage: { local: { get: async () => ({}) } } };
require(path.join(root, "i18n.js"));
const I = globalThis.ARI18n;
for (const [code] of I.LANGS) {
  if (code !== "en") require(path.join(root, "locales", code + ".js"));
}
require(path.join(root, "settings.js"));
const S = globalThis.ARSettings;

const en = I.messages.en;
const keys = Object.keys(en);
const placeholders = (s) => (s.match(/\{\w+\}/g) || []).sort().join();

for (const [code] of I.LANGS) {
  const m = I.messages[code];
  assert.ok(m, `locale ${code} did not load`);
  assert.deepStrictEqual(keys.filter((k) => !(k in m)), [], `${code}: missing strings`);
  assert.deepStrictEqual(Object.keys(m).filter((k) => !(k in en)), [], `${code}: unknown strings`);
  for (const k of keys) {
    assert.ok(m[k].trim(), `${code}: empty ${k}`);
    assert.strictEqual(placeholders(m[k]), placeholders(en[k]), `${code}: placeholders differ in ${k}`);
  }
}

for (const def of S.SETTINGS) {
  if (def.partOf) {
    assert.ok(I.has(`s.${def.key}.placeholder`), `${def.key}: placeholder`);
    continue;
  }

  assert.ok(I.has(`s.${def.key}.label`), `${def.key}: label`);
  assert.ok(I.has(`s.${def.key}.info`), `${def.key}: info`);
  for (const option of def.options || []) {
    assert.ok(I.has(`s.${def.key}.opt.${option}`), `${def.key}: option ${option}`);
  }
}

for (const group of S.GROUPS) assert.ok(I.has(`g.${group.id}`), `group ${group.id}`);

console.log(`i18n ok: ${I.LANGS.length} languages x ${keys.length} strings, ${S.SETTINGS.length} settings`);
