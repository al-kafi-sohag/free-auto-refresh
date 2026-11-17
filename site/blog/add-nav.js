// Adds a "Blog" link after "Guides" in the header, mobile menu and footer of every page in docs/ (except docs/blog/).
// Safe to run more than once.
const fs = require("fs");
const path = require("path");

const DOCS = path.resolve(__dirname, "..", "..", "docs");
let changed = 0;

(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (p === path.join(DOCS, "blog")) continue; walk(p); continue; }
    if (!e.name.endsWith(".html")) continue;
    let s = fs.readFileSync(p, "utf8");
    const crlf = s.includes("\r\n");
    if (crlf) s = s.replace(/\r\n/g, "\n");
    const before = s;
    s = s.replace(/<a href="((?:\.\.\/)*)guides\/"( aria-current="page")?>Guides<\/a>(?!<a href="[^"]*blog\/")/g,
      (m, up) => `${m}<a href="${up}blog/">Blog</a>`);
    if (s !== before) {
      fs.writeFileSync(p, crlf ? s.replace(/\n/g, "\r\n") : s);
      changed++;
    }
  }
})(DOCS);

console.log("Blog link added to", changed, "pages");
