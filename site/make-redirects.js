// The website moved from GitHub Pages (al-kafi-sohag.github.io/free-auto-refresh) to
// https://freeautorefresh.com. GitHub Pages can't send a real redirect, so this writes a
// tiny stand-in for every page in docs/: it tells search engines where the page lives now
// (canonical) and sends visitors there at once. The GitHub Pages workflow publishes the
// result instead of the site itself.
//   node site/make-redirects.js        ->  _old-site/
const fs = require("fs");
const path = require("path");

const NEW_SITE = "https://freeautorefresh.com";
const OLD_BASE = "/free-auto-refresh"; // the folder the old site lived under
const DOCS = path.resolve(__dirname, "..", "docs");
const OUT = path.resolve(__dirname, "..", "_old-site");

const stub = (url) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Free Auto Refresh has moved</title>
<link rel="canonical" href="${url}">
<meta http-equiv="refresh" content="0; url=${url}">
<script>location.replace(${JSON.stringify(url)} + location.search + location.hash);</script>
</head>
<body>
<p>Free Auto Refresh has moved to <a href="${url}">${url}</a>.</p>
</body>
</html>
`;

function pages(dir, rel = "") {
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) found.push(...pages(path.join(dir, entry.name), `${rel}${entry.name}/`));
    else if (entry.name === "index.html") found.push(rel);
  }

  return found;
}

fs.rmSync(OUT, { recursive: true, force: true });
const list = pages(DOCS);
for (const rel of list) {
  fs.mkdirSync(path.join(OUT, rel), { recursive: true });
  fs.writeFileSync(path.join(OUT, rel, "index.html"), stub(`${NEW_SITE}/${rel}`));
}

// Any other address on the old site: go to the same path on the new one
fs.writeFileSync(path.join(OUT, "404.html"), `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Free Auto Refresh has moved</title>
<meta name="robots" content="noindex">
<script>
  var path = location.pathname.indexOf(${JSON.stringify(OLD_BASE)}) === 0 ? location.pathname.slice(${OLD_BASE.length}) : "/";
  location.replace(${JSON.stringify(NEW_SITE)} + path + location.search + location.hash);
</script>
</head>
<body>
<p>Free Auto Refresh has moved to <a href="${NEW_SITE}/">${NEW_SITE}</a>.</p>
</body>
</html>
`);

console.log(`Wrote ${list.length} redirect pages and 404.html to _old-site/`);
