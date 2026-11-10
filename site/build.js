// Builds the website into docs/ (served by GitHub Pages) from the content in site/pages.js.
//   npm run build:site
// Output: one index.html per page, sitemap.xml, robots.txt, and site/IMAGES.md (the image list).
const fs = require("fs");
const path = require("path");
const { features, useCases, browsers } = require("./pages");

/* ---------- config: change SITE_URL when you move to your own domain, then rebuild ---------- */
const SITE_URL = "https://al-kafi-sohag.github.io/free-auto-refresh"; // no trailing slash
const NAME = "Free Auto Refresh";
const STORE = {
  chrome: "https://chromewebstore.google.com/detail/kppnomplbmbngkolabchhbfkhkmdemdp",
  firefox: "https://addons.mozilla.org/en-US/firefox/addon/free-auto-refresh-extension/",
};
const GITHUB = "https://github.com/al-kafi-sohag/free-auto-refresh";
const GA_ID = "G-0DTP2D307V";
const OUT = path.resolve(__dirname, "..", "docs");
const TODAY = new Date().toISOString().slice(0, 10);

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const images = []; // every image slot, for IMAGES.md

/* ---------- images: real file if it exists in docs/assets/img, placeholder otherwise ---------- */
function image(page, name, alt, w, h, prompt) {
  const file = `assets/img/${name}.png`;
  const exists = fs.existsSync(path.join(OUT, file));
  images.push({ file: `docs/${file}`, size: `${w}x${h}`, page: page.path || "home", prompt, exists });
  return `<img src="${page.root}${exists ? file : "assets/placeholder.svg"}" alt="${esc(alt)}" width="${w}" height="${h}" loading="lazy" class="w-full rounded-2xl border border-line bg-white">`;
}

const STYLE = "Flat, clean product illustration on a soft light-blue gradient background (#EFF4FC to white), rounded shapes, brand blue #3D7DFB with dark navy #0B1220 accents, plenty of empty space, no text, no logos of other companies";
const prompt = (subject) => `${STYLE}. Subject: ${subject}.`;

/* ---------- shared layout ---------- */
const NAV = [["features/", "Features"], ["use-cases/", "Use cases"], ["chrome/", "Chrome"], ["firefox/", "Firefox"], ["faq/", "FAQ"]];

function layout(page, body) {
  const url = `${SITE_URL}/${page.path}`;
  const schema = [page.schema || []].flat();
  if (page.crumbs) {
    schema.push({
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [["", "Home"], ...page.crumbs, [page.path, page.h1]].map(([p, n], i) => ({
        "@type": "ListItem", position: i + 1, name: n, item: `${SITE_URL}/${p}`,
      })),
    });
  }

  if (page.faqs?.length) {
    schema.push({
      "@context": "https://schema.org", "@type": "FAQPage",
      mainEntity: page.faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    });
  }

  const r = page.root;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.desc)}">
${page.kw ? `<meta name="keywords" content="${esc(page.kw.join(", "))}">\n` : ""}<link rel="canonical" href="${url}">
<meta property="og:site_name" content="${NAME}">
<meta property="og:title" content="${esc(page.title)}">
<meta property="og:description" content="${esc(page.desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE_URL}/assets/poster.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="google-site-verification" content="ww9t1NvE40Omq86n1bNGdVptryQJXYkv5f0-MjdqTqM">
<meta name="msvalidate.01" content="3CB45458A679463A21F05BA747535729">
<link rel="icon" href="${r}assets/logo.png" type="image/png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${r}assets/site.css">
${schema.map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join("\n")}
</head>
<body class="bg-page font-sans text-ink antialiased" data-ga="${GA_ID}">

<header class="sticky top-0 z-40 border-b border-line bg-page/90 backdrop-blur">
  <div class="wrap flex h-16 items-center justify-between gap-4">
    <a href="${r}" class="flex items-center gap-2.5 font-display text-[17px] font-extrabold">
      <img src="${r}assets/logo.png" alt="" width="30" height="30">${NAME}
    </a>
    <nav id="nav" class="absolute left-0 top-16 hidden w-full flex-col gap-1 border-b border-line bg-page p-4 text-[15px] font-medium text-muted md:static md:flex md:w-auto md:flex-row md:gap-7 md:border-0 md:p-0" aria-label="Main">
      ${NAV.map(([p, n]) => `<a href="${r}${p}" class="rounded px-2 py-2 hover:text-ink md:p-0${page.path.startsWith(p) ? " text-ink" : ""}">${n}</a>`).join("\n      ")}
    </nav>
    <div class="flex items-center gap-2">
      <a href="${STORE.chrome}" class="btn btn-primary btn-sm" target="_blank" rel="noopener">Add to Chrome</a>
      <button id="navToggle" type="button" class="btn btn-ghost btn-sm md:hidden" aria-controls="nav" aria-expanded="false">Menu</button>
    </div>
  </div>
</header>

<main>
${body}
</main>

<footer class="mt-20 border-t border-line bg-white">
  <div class="wrap grid gap-8 py-12 text-sm sm:grid-cols-2 lg:grid-cols-4">
    <div>
      <a href="${r}" class="flex items-center gap-2 font-display font-extrabold"><img src="${r}assets/logo.png" alt="" width="26" height="26">${NAME}</a>
      <p class="mt-3 text-muted">A free, private auto refresh and page monitor extension for Chrome and Firefox.</p>
    </div>
    <div>
      <h2 class="foot-title">Features</h2>
      <ul class="foot-list">${features.map((f) => `<li><a href="${r}features/${f.slug}/">${esc(f.h1)}</a></li>`).join("")}</ul>
    </div>
    <div>
      <h2 class="foot-title">Use cases</h2>
      <ul class="foot-list">${useCases.map((u) => `<li><a href="${r}use-cases/${u.slug}/">${esc(u.nav)}</a></li>`).join("")}</ul>
    </div>
    <div>
      <h2 class="foot-title">Get it</h2>
      <ul class="foot-list">
        <li><a href="${r}chrome/">Chrome extension</a></li>
        <li><a href="${r}firefox/">Firefox add-on</a></li>
        <li><a href="${r}faq/">FAQ</a></li>
        <li><a href="${r}changelog/">Changelog</a></li>
        <li><a href="${r}contact/">Contact</a></li>
        <li><a href="${r}privacy/">Privacy</a></li>
        <li><a href="${GITHUB}" target="_blank" rel="noopener">GitHub</a></li>
      </ul>
    </div>
  </div>
  <p class="border-t border-line py-5 text-center text-xs text-muted">Built by Al Kafi Sohag · MIT licensed · Not affiliated with Google or Mozilla</p>
</footer>

<div id="cookieBanner" class="fixed bottom-4 left-4 right-4 z-50 hidden rounded-2xl border border-line bg-white p-5 shadow-xl sm:left-auto sm:max-w-sm" role="dialog" aria-label="Cookie consent">
  <p class="text-sm text-muted">This site uses Google Analytics to count visits, only if you accept. No ads. The extension itself has no analytics. <a class="font-semibold text-blue-deep" href="${r}privacy/">Privacy</a></p>
  <div class="mt-3 flex gap-2">
    <button id="cookieAccept" type="button" class="btn btn-primary btn-sm">Accept</button>
    <button id="cookieReject" type="button" class="btn btn-ghost btn-sm">Reject</button>
  </div>
</div>

<script src="https://code.jquery.com/jquery-3.7.1.min.js" integrity="sha256-/JqT3SQfawRcv/BIHPThkBvs0OEvtFFmqPF/lYI/Cxo=" crossorigin="anonymous"></script>
<script src="${r}assets/site.js"></script>
</body>
</html>
`;
}

/* ---------- blocks ---------- */
const cta = (page, heading = "Stop clicking reload") => `
  <section class="wrap mt-16">
    <div class="rounded-3xl bg-ink px-6 py-12 text-center text-white sm:px-12">
      <h2 class="font-display text-3xl font-extrabold">${heading}</h2>
      <p class="mx-auto mt-3 max-w-xl text-white/70">Free for Chrome and Firefox. No account, no ads, no tracking.</p>
      <div class="mt-6 flex flex-wrap justify-center gap-3">
        <a class="btn btn-primary" href="${STORE.chrome}" target="_blank" rel="noopener">Add to Chrome</a>
        <a class="btn btn-light" href="${STORE.firefox}" target="_blank" rel="noopener">Add to Firefox</a>
      </div>
    </div>
  </section>`;

const faqBlock = (faqs) => `
  <section class="wrap mt-14 max-w-3xl">
    <h2 class="h2">Questions</h2>
    <div class="mt-5 space-y-3">
      ${faqs.map(([q, a]) => `<details class="faq"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("\n      ")}
    </div>
  </section>`;

const cards = (root, items) => `
    <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      ${items.map(([href, title, text]) => `<a href="${root}${href}" class="card block hover:border-blue"><h3 class="font-display text-lg font-bold">${esc(title)}</h3><p class="mt-1.5 text-sm text-muted">${esc(text)}</p></a>`).join("\n      ")}
    </div>`;

const crumbsHtml = (page) => `
    <nav class="text-sm text-muted" aria-label="Breadcrumb">
      <a href="${page.root}" class="hover:text-ink">Home</a>${page.crumbs.map(([p, n]) => ` <span aria-hidden="true">/</span> <a href="${page.root}${p}" class="hover:text-ink">${n}</a>`).join("")}
    </nav>`;

/* ---------- page: feature / use case / browser ---------- */
function article(page, related) {
  const store = page.store ? STORE[page.store] : null;
  return layout(page, `
  <section class="wrap pt-10">
    ${crumbsHtml(page)}
    <div class="mt-6 grid items-center gap-10 lg:grid-cols-2">
      <div>
        <p class="kicker">${page.kicker}</p>
        <h1 class="h1">${esc(page.h1)}</h1>
        <p class="lede">${esc(page.lede)}</p>
        <div class="mt-7 flex flex-wrap gap-3">
          <a class="btn btn-primary" href="${store || STORE.chrome}" target="_blank" rel="noopener">${page.store === "firefox" ? "Add to Firefox" : "Add to Chrome"}</a>
          ${store ? "" : `<a class="btn btn-ghost" href="${STORE.firefox}" target="_blank" rel="noopener">Add to Firefox</a>`}
        </div>
      </div>
      ${image(page, page.imgName, page.h1, 1200, 750, prompt(page.art))}
    </div>
  </section>

  <section class="wrap mt-14">
    <div class="grid gap-4 md:grid-cols-3">
      ${page.points.map(([t, d]) => `<div class="card"><h2 class="font-display text-lg font-bold">${esc(t)}</h2><p class="mt-1.5 text-sm text-muted">${esc(d)}</p></div>`).join("\n      ")}
    </div>
  </section>

  <section class="wrap mt-14 grid gap-10 lg:grid-cols-2">
    <div>
      <h2 class="h2">How to set it up</h2>
      <ol class="steps">
        ${page.steps.map((s) => `<li>${esc(s)}</li>`).join("\n        ")}
      </ol>
    </div>
    <div>
      <h2 class="h2">${page.store ? "Details" : "Suggested settings"}</h2>
      <table class="settings">
        <tbody>
          ${page.settings.map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`).join("\n          ")}
        </tbody>
      </table>
    </div>
  </section>

  <section class="wrap mt-14 max-w-3xl">
    ${page.body.map(([h, p]) => `<h2 class="h2">${esc(h)}</h2>\n    <p class="mt-3 text-[17px] leading-relaxed text-muted">${esc(p)}</p>`).join("\n    ")}
  </section>
  ${faqBlock(page.faqs)}

  <section class="wrap mt-14">
    <h2 class="h2">Related</h2>${cards(page.root, related)}
  </section>
  ${cta(page)}`);
}

/* ---------- assemble pages ---------- */
const pages = [];
const add = (p, html) => pages.push({ path: p.path, html, priority: p.priority || "0.7" });
const base = (pathname) => ({ path: pathname, root: "../".repeat(pathname.split("/").filter(Boolean).length) });

for (const u of useCases) u.nav = u.h1.replace(/^(Auto refresh for |Get |Be |Find |See |Catch |Follow |Keep |A )/i, "").replace(/^./, (c) => c.toUpperCase());

const linkOf = (dir) => (x) => [`${dir}/${x.slug}/`, x.h1, x.lede.split(". ")[0] + "."];
const pick = (list, i, n = 3) => Array.from({ length: n }, (_, k) => list[(i + 1 + k) % list.length]);

features.forEach((f, i) => {
  const p = { ...f, ...base(`features/${f.slug}/`), kicker: "Feature", crumbs: [["features/", "Features"]], imgName: `feature-${f.slug}` };
  const related = [...pick(features, i, 2).map(linkOf("features")), linkOf("use-cases")(useCases[i % useCases.length])];
  add(p, article(p, related));
});

useCases.forEach((u, i) => {
  const p = { ...u, ...base(`use-cases/${u.slug}/`), kicker: "Use case", crumbs: [["use-cases/", "Use cases"]], imgName: `use-case-${u.slug}` };
  const related = [...pick(useCases, i, 2).map(linkOf("use-cases")), linkOf("features")(features[2])];
  add(p, article(p, related));
});

const app = (os) => ({
  "@context": "https://schema.org", "@type": "SoftwareApplication", name: NAME,
  applicationCategory: "BrowserApplication", operatingSystem: os, softwareVersion: "1.1.0",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  description: "Free auto refresh and page monitor browser extension with keyword alerts.",
  url: SITE_URL + "/", author: { "@type": "Person", name: "Al Kafi Sohag" },
});

browsers.forEach((b) => {
  const p = { ...b, ...base(`${b.slug}/`), kicker: "Download", crumbs: [], imgName: `browser-${b.slug}`, priority: "0.9",
    schema: app(b.slug === "chrome" ? "Chrome" : "Firefox") };
  add(p, article(p, [linkOf("features")(features[0]), linkOf("features")(features[2]), linkOf("use-cases")(useCases[0])]));
});

/* hubs */
function hub(pathname, h1, title, desc, lede, list, dir, kw) {
  const p = { ...base(pathname), h1, title, desc, kw, crumbs: [], priority: "0.8" };
  add(p, layout(p, `
  <section class="wrap pt-10">
    ${crumbsHtml(p)}
    <h1 class="h1 mt-6">${h1}</h1>
    <p class="lede max-w-2xl">${lede}</p>${cards(p.root, list.map(linkOf(dir)))}
  </section>
  ${cta(p)}`));
}

hub("features/", "Features", "Features – Free Auto Refresh Extension", "Everything Free Auto Refresh can do: refresh timer, random intervals, page monitor, keyword alerts, smart pause, scroll restore and more.",
  "Every feature is free. Pick one to see how it works and how to set it up.", features, "features", ["auto refresh features", "page monitor extension", "auto reload extension"]);
hub("use-cases/", "Use cases", "Use Cases – What People Use Auto Refresh For", "Restock and price alerts, tickets, appointment slots, results, dashboards, development and more: set-up guides for Free Auto Refresh.",
  "Step-by-step set-ups for the things people most often refresh a page for.", useCases, "use-cases", ["auto refresh use cases", "what is auto refresh used for"]);

/* FAQ: general questions plus one from each page */
{
  const general = [
    ["What is Free Auto Refresh?", "A free browser extension for Chrome and Firefox that reloads a tab on a timer or random interval and can alert you when the page changes."],
    ["Is it free?", "Yes, completely. It is open source, with no ads, no account and no paid tier."],
    ["Does it collect my data?", "No. It collects nothing and makes no network requests. Settings are stored only in your browser."],
    ["Which browsers are supported?", "Chrome 111 or newer, other Chromium browsers such as Edge and Brave, and desktop Firefox 140 or newer."],
    ["Does it keep running after I close the popup?", "Yes. It keeps refreshing until you press Stop, a limit is reached, or a watch rule matches."],
    ["Does it resume after I restart the browser?", "Not yet. Open the page and press Start again, or use Alt+Shift+R."],
    ["Can it click buttons or fill in forms for me?", "No. It reloads pages and alerts you; it does not act on the page."],
  ];
  const faqs = [...general, ...features.map((f) => f.faqs[0]), ...useCases.slice(0, 6).map((u) => u.faqs[0])];
  const p = { ...base("faq/"), h1: "Frequently asked questions", title: "FAQ – Free Auto Refresh Extension",
    desc: "Answers about Free Auto Refresh: price, privacy, supported browsers, intervals, page watching, alerts and limits.", crumbs: [], faqs,
    kw: ["auto refresh faq", "how to auto refresh a page", "is auto refresh extension safe"] };
  add(p, layout(p, `
  <section class="wrap pt-10">
    ${crumbsHtml(p)}
    <h1 class="h1 mt-6">${p.h1}</h1>
  </section>${faqBlock(faqs).replace('<h2 class="h2">Questions</h2>', "")}
  ${cta(p)}`));
}

/* changelog */
{
  const p = { ...base("changelog/"), h1: "Changelog", title: "Changelog – Free Auto Refresh", desc: "What changed in each version of the Free Auto Refresh extension.", crumbs: [] };
  const log = [
    ["1.1.0", ["Simpler popup, with advanced settings you can pin", "7 languages and an (i) explanation on every setting", "Waits for the page to load before checking it", "Keep scroll position, pause on click or scroll, toolbar countdown, keep the tab awake", "Profiles, export and import, and a full settings page"]],
    ["1.0.0", ["First release: refresh timer, random intervals, page watching, smart pause, limits, on-page counter, notifications"]],
  ];
  add(p, layout(p, `
  <section class="wrap max-w-3xl pt-10">
    ${crumbsHtml(p)}
    <h1 class="h1 mt-6">${p.h1}</h1>
    ${log.map(([v, items]) => `<h2 class="h2 mt-10">Version ${v}</h2>\n    <ul class="mt-3 list-disc space-y-1.5 pl-5 text-muted">${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`).join("\n    ")}
  </section>
  ${cta(p)}`));
}

/* contact: placeholder form, no backend yet */
{
  const p = { ...base("contact/"), h1: "Contact", title: "Contact – Free Auto Refresh", desc: "Report a bug, suggest a feature or ask a question about Free Auto Refresh.", crumbs: [] };
  add(p, layout(p, `
  <section class="wrap max-w-2xl pt-10">
    ${crumbsHtml(p)}
    <h1 class="h1 mt-6">${p.h1}</h1>
    <p class="lede">Found a bug or have an idea? The fastest route is a <a class="font-semibold text-blue-deep" href="${GITHUB}/issues" target="_blank" rel="noopener">GitHub issue</a>.</p>
    <!-- TODO: connect this form to a backend or form service. It does not send anything yet. -->
    <form id="contactForm" class="card mt-8 space-y-4" novalidate>
      <div><label class="label" for="cName">Name</label><input class="input" id="cName" name="name" autocomplete="name"></div>
      <div><label class="label" for="cEmail">Email</label><input class="input" id="cEmail" name="email" type="email" autocomplete="email" placeholder="name@example.com"></div>
      <div><label class="label" for="cMsg">Message</label><textarea class="input h-32" id="cMsg" name="message"></textarea></div>
      <button class="btn btn-primary" type="submit">Send message</button>
      <p id="contactNote" class="hidden text-sm text-muted" role="status">The contact form is not connected yet. Please open a GitHub issue instead.</p>
    </form>
  </section>`));
}

/* privacy */
{
  const p = { ...base("privacy/"), h1: "Privacy", title: "Privacy – Free Auto Refresh", desc: "Free Auto Refresh collects no data and makes no network requests. What the extension and this website do with information.", crumbs: [] };
  const items = [
    ["The extension", "It reads the visible text of a page only in the tab where you turned on page watching, and only inside your browser. It never records what you type. Settings, profiles and your language choice are stored locally. Nothing is sent to the developer or anyone else."],
    ["Permissions", "Storage saves your settings. Notifications show an alert when a watch rule matches. Website access lets the timer and counter run on the page you choose."],
    ["This website", "It loads Google Analytics to count visits, and only after you click Accept on the cookie banner. Your choice is remembered in your browser."],
  ];
  add(p, layout(p, `
  <section class="wrap max-w-3xl pt-10">
    ${crumbsHtml(p)}
    <h1 class="h1 mt-6">${p.h1}</h1>
    ${items.map(([h, t]) => `<h2 class="h2 mt-10">${h}</h2>\n    <p class="mt-3 text-[17px] leading-relaxed text-muted">${t}</p>`).join("\n    ")}
    <p class="mt-8 text-muted">The full policy is in <a class="font-semibold text-blue-deep" href="${GITHUB}/blob/main/PRIVACY.md" target="_blank" rel="noopener">PRIVACY.md</a> on GitHub.</p>
  </section>`));
}

/* home */
{
  const p = { ...base(""), priority: "1.0",
    title: "Free Auto Refresh – Auto Reload Tabs & Page Monitor Extension",
    desc: "Free auto refresh extension for Chrome and Firefox. Reload any tab on a timer or random interval and get alerted when a page changes. No tracking.",
    kw: ["auto refresh", "auto refresh extension", "auto refresh chrome", "auto reload page", "page monitor", "keyword alert", "free auto refresh"],
    schema: [app("Chrome, Firefox"), { "@context": "https://schema.org", "@type": "WebSite", name: NAME, url: SITE_URL + "/" }],
    faqs: [
      ["Is Free Auto Refresh really free?", "Yes. Every feature is free, with no ads, account or paid tier."],
      ["Does it collect any data?", "No. It makes no network requests and stores settings only in your browser."],
      ["Can it tell me when a page changes?", "Yes. It can stop and notify you when text appears, disappears, or the page content changes."],
      ["Which browsers does it support?", "Chrome and other Chromium browsers, and desktop Firefox."],
    ] };
  add(p, layout(p, `
  <section class="wrap grid items-center gap-10 pt-14 lg:grid-cols-2">
    <div>
      <p class="kicker">Free · Chrome &amp; Firefox · 7 languages</p>
      <h1 class="h1">Auto refresh any tab.<br>Know when the page changes.</h1>
      <p class="lede">Free Auto Refresh reloads a page on a fixed or random timer, stops the moment your text appears or the content changes, and waits while you are typing. No account, no ads, no tracking.</p>
      <div class="mt-7 flex flex-wrap gap-3">
        <a class="btn btn-primary" href="${STORE.chrome}" target="_blank" rel="noopener">Add to Chrome</a>
        <a class="btn btn-ghost" href="${STORE.firefox}" target="_blank" rel="noopener">Add to Firefox</a>
      </div>
      <p class="mt-5 text-sm text-muted"><b class="text-ink">0</b> trackers · <b class="text-ink">0</b> network requests · <b class="text-ink">100%</b> free · Open source</p>
    </div>
    ${image(p, "home-hero", "Free Auto Refresh popup open over a browser tab", 1200, 900, "Screenshot-style mockup: the extension popup (white rounded card with a refresh counter, interval presets and a black Start button) open over a blurred browser window. Soft light-blue background, brand blue #3D7DFB, no other logos.")}
  </section>

  <section class="wrap mt-20">
    <p class="kicker">Features</p>
    <h2 class="h2">Not just a timer</h2>${cards(p.root, features.slice(0, 9).map(linkOf("features")))}
    <p class="mt-6"><a class="font-semibold text-blue-deep" href="features/">All features →</a></p>
  </section>

  <section class="wrap mt-20">
    <p class="kicker">How it works</p>
    <h2 class="h2">Three steps, ten seconds</h2>
    <ol class="steps max-w-2xl">
      <li>Open the page you want refreshed and click the Free Auto Refresh icon.</li>
      <li>Pick a preset or set your own minimum and maximum seconds. Add a limit or a watch rule if you like.</li>
      <li>Press Start. Pause or stop from the popup, the on-page counter, or with Alt+Shift+R.</li>
    </ol>
  </section>

  <section class="wrap mt-20">
    <p class="kicker">Use cases</p>
    <h2 class="h2">What people use it for</h2>${cards(p.root, useCases.slice(0, 9).map(linkOf("use-cases")))}
    <p class="mt-6"><a class="font-semibold text-blue-deep" href="use-cases/">All use cases →</a></p>
  </section>

  <section class="wrap mt-20 grid items-center gap-10 lg:grid-cols-2">
    ${image(p, "home-watch", "Page watching settings with a match notification", 1200, 750, prompt("a web page with one highlighted element, an eye icon above it, and a notification card reading a match was found"))}
    <div>
      <p class="kicker">Page watching</p>
      <h2 class="h2">It tells you when something changes</h2>
      <table class="settings">
        <tbody>
          <tr><th scope="row">Text appears</th><td>Stops when the text shows up on the page</td></tr>
          <tr><th scope="row">Text disappears</th><td>Stops when the text is gone</td></tr>
          <tr><th scope="row">Content changes</th><td>Stops when the page, or one element, differs from the first load</td></tr>
        </tbody>
      </table>
      <p class="mt-5"><a class="font-semibold text-blue-deep" href="features/page-monitor-keyword-alert/">How page watching works →</a></p>
    </div>
  </section>
  ${faqBlock(p.faqs)}
  ${cta(p, "Install it in ten seconds")}`));
}

/* ---------- write files ---------- */
for (const { path: p, html } of pages) {
  const dir = path.join(OUT, p);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html);
}

fs.writeFileSync(path.join(OUT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url><loc>${SITE_URL}/${p.path}</loc><lastmod>${TODAY}</lastmod><priority>${p.priority}</priority></url>`).join("\n")}
</urlset>
`);
fs.writeFileSync(path.join(OUT, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);

fs.writeFileSync(path.join(OUT, "assets", "placeholder.svg"), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 750"><rect width="1200" height="750" fill="#E6EEFB"/><g fill="none" stroke="#3D7DFB" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" transform="translate(540 315)"><path d="M105 60a45 45 0 1 1-45-45c12.600 0 24.650 5 33.700 13.700L105 40"/><path d="M105 15v25H80"/></g><text x="600" y="480" text-anchor="middle" font-family="sans-serif" font-size="30" fill="#5B6B85">Image placeholder</text></svg>\n`);

fs.writeFileSync(path.join(__dirname, "IMAGES.md"), `# Website images

Save each file at the path shown, then run \`npm run build:site\`. A page uses the real file as soon as it exists; until then it shows the placeholder.

| # | File | Size | Page | Prompt |
|---|---|---|---|---|
${images.map((im, i) => `| ${i + 1} | \`${im.file}\` | ${im.size} | ${im.page} | ${im.prompt} |`).join("\n")}
| ${images.length + 1} | \`docs/assets/poster.png\` | 1200x630 | all pages (link preview) | Social share card: the blue refresh logo, the words "Free Auto Refresh" and "Auto reload tabs. Get alerted when a page changes." on a soft light-blue gradient. |
`);

console.log(`Built ${pages.length} pages, sitemap.xml, robots.txt and site/IMAGES.md (${images.length + 1} images)`);
