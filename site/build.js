// Builds the website into docs/ (published by GitHub Pages) as plain static HTML.
//   npm run build:site
// Content lives in site/pages.js (base facts per page) and site/content/*.js (long-form sections,
// extra FAQs, guides). Nothing here is loaded by a visitor's browser: this script runs at
// build time and writes one index.html per page, plus sitemap.xml, robots.txt and site/IMAGES.md.
const fs = require("fs");
const path = require("path");
const base = require("./pages");
const more = require("./content/more");
const extraSections = { ...require("./content/extra-features"), ...require("./content/extra-usecases") };
const { guides, comparisons } = require("./content/guides");
const home = require("./content/home");

/* ---------- config: change SITE_URL when you move to your own domain, then rebuild ---------- */
const SITE_URL = "https://freeautorefresh.com"; // no trailing slash
const NAME = "Free Auto Refresh";
const STORE = {
  chrome: "https://chromewebstore.google.com/detail/kppnomplbmbngkolabchhbfkhkmdemdp",
  firefox: "https://addons.mozilla.org/en-US/firefox/addon/free-auto-refresh-extension/",
};
const GITHUB = "https://github.com/al-kafi-sohag/free-auto-refresh";
// Invite link of the Telegram group for users (https://t.me/...). Leave empty to hide it on the contact page.
const TELEGRAM_GROUP = "";
const GA_ID = "G-0DTP2D307V";
const OUT = path.resolve(__dirname, "..", "docs");
const TODAY = new Date().toISOString().slice(0, 10);

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// Content may use **bold** and [text](path) links; paths are relative to the site root.
const rich = (s, root) => esc(s)
  .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
  .replace(/\[(.+?)\]\((.+?)\)/g, (_, t, href) => `<a href="${/^https?:/.test(href) ? href : root + href}">${t}</a>`);

/* ---------- icons: Lucide, inlined as SVG at build time ---------- */
const iconCache = {};
function icon(name) {
  if (!iconCache[name]) {
    const file = path.resolve(__dirname, "..", "node_modules", "lucide-static", "icons", `${name}.svg`);
    iconCache[name] = fs.readFileSync(file, "utf8")
      .replace(/<!--[\s\S]*?-->/, "").replace(/\s+/g, " ").replace(/ width="24" height="24"/, "")
      .replace(/ class="[^"]*"/, "").replace("<svg", '<svg class="ic" aria-hidden="true"').trim();
  }

  return iconCache[name];
}

/* ---------- images: one picture per page ----------
   Cut from the generated sheets by site/make-images.py into docs/assets/img/, named after the
   page path: /features/smart-pause/ uses img/features/smart-pause.webp, the home page img/index.webp
   and the four hub pages img/<hub>/index.webp. Shown inside a browser-style frame with a title and caption. */
const HUBS = ["features/", "use-cases/", "guides/", "faq/"];
const pageImg = (page) => (!page.path ? "index" : HUBS.includes(page.path) ? `${page.path}index` : page.path.replace(/\/$/, ""));
const used = {}; // image name -> pages using it

function shot(page, key, title, caption, alt, cls = "") {
  (used[key] ||= []).push(page.path || "home");
  const src = fs.existsSync(path.join(OUT, "assets", "img", `${key}.webp`)) ? `assets/img/${key}.webp` : "assets/placeholder.svg";
  return `<figure class="shot ${cls}">
        <div class="shot-bar"><span class="shot-dots"><i></i><i></i><i></i></span><span class="shot-title">${esc(title)}</span></div>
        <img src="${page.root}${src}" alt="${esc(alt)}" width="800" height="600"${page.path ? ' loading="lazy"' : ""}>
        <figcaption>${icon("check")}${esc(caption)}</figcaption>
      </figure>`;
}

/* ---------- layout ---------- */
const NAV = [["", "Home"], ["features/", "Features"], ["use-cases/", "Use cases"], ["guides/", "Guides"], ["faq/", "FAQ"]];

function layout(page, body) {
  const url = `${SITE_URL}/${page.path}`;
  const r = page.root;
  const schema = [page.schema || []].flat();

  if (page.crumbs) {
    schema.push({
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [["", "Home"], ...page.crumbs, [page.path, page.nav || page.h1]].map(([p, n], i) => ({
        "@type": "ListItem", position: i + 1, name: n, item: `${SITE_URL}/${p}`,
      })),
    });
  }

  if (page.faqs?.length) {
    schema.push({
      "@context": "https://schema.org", "@type": "FAQPage",
      mainEntity: page.faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a.replace(/\*\*|\[(.+?)\]\(.+?\)/g, "$1") } })),
    });
  }

  if (page.steps?.length && page.howName) {
    schema.push({
      "@context": "https://schema.org", "@type": "HowTo", name: page.howName,
      step: page.steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, text: [s].flat().join(". ") })),
    });
  }

  const current = (p) => (p ? page.path.startsWith(p) : page.path === "") ? ' aria-current="page"' : "";
  const links = NAV.map(([p, n]) => `<a href="${r}${p}"${current(p)}>${n}</a>`).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#eef4ff">
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.desc)}">
${page.kw ? `<meta name="keywords" content="${esc(page.kw.join(", "))}">\n` : ""}<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="${url}">
<meta property="og:site_name" content="${NAME}">
<meta property="og:type" content="${page.path ? "article" : "website"}">
<meta property="og:title" content="${esc(page.title)}">
<meta property="og:description" content="${esc(page.desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE_URL}/assets/poster.png">
<meta property="og:image:alt" content="${NAME}: auto refresh and page monitor browser extension">
<meta property="og:locale" content="en_US">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(page.title)}">
<meta name="twitter:description" content="${esc(page.desc)}">
<meta name="twitter:image" content="${SITE_URL}/assets/poster.png">
<meta name="google-site-verification" content="ww9t1NvE40Omq86n1bNGdVptryQJXYkv5f0-MjdqTqM">
<meta name="msvalidate.01" content="3CB45458A679463A21F05BA747535729">
<link rel="icon" href="${r}assets/logo.png" type="image/png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${r}assets/site.css">
${schema.map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join("\n")}
</head>
<body data-ga="${GA_ID}">

<header class="site-header">
  <div class="page-width nav-shell">
    <a class="brand" href="${r}"><img src="${r}assets/logo.png" alt="" width="31" height="31">${NAME}</a>
    <nav class="desktop-nav" aria-label="Main">${links}</nav>
    <a class="nav-cta" href="${STORE.chrome}" target="_blank" rel="noopener">Add to Chrome ${icon("arrow-up-right")}</a>
    <button class="mobile-nav-toggle" id="navToggle" type="button" aria-controls="mobileNav" aria-expanded="false" aria-label="Menu">${icon("menu")}</button>
  </div>
  <nav class="mobile-nav-menu" id="mobileNav" aria-label="Mobile">${links}<a href="${STORE.chrome}" target="_blank" rel="noopener">Add to Chrome</a><a href="${STORE.firefox}" target="_blank" rel="noopener">Add to Firefox</a></nav>
</header>

<main>
${body}
</main>

<footer class="site-footer">
  <div class="page-width footer-main">
    <div>
      <a class="brand" href="${r}"><img src="${r}assets/logo.png" alt="" width="31" height="31">${NAME}</a>
      <p>A free, private auto refresh and page monitor extension for Chrome and Firefox.</p>
      <p>Available in 7 languages.</p>
    </div>
    <div class="footer-links">
      <h2>Explore</h2>
      <a href="${r}features/">Features</a><a href="${r}use-cases/">Use cases</a><a href="${r}guides/">Guides</a><a href="${r}faq/">FAQ</a>
    </div>
    <div class="footer-links">
      <h2>Get the extension</h2>
      <a href="${r}chrome/">Chrome extension</a><a href="${r}firefox/">Firefox add-on</a><a href="${r}changelog/">Changelog</a>
    </div>
    <div class="footer-links">
      <h2>About</h2>
      <a href="${GITHUB}" target="_blank" rel="noopener">GitHub</a><a href="${r}privacy/">Privacy</a><a href="${r}contact/">Contact</a>
    </div>
  </div>
  <div class="footer-bottom"><div class="page-width"><span>© ${TODAY.slice(0, 4)} Al Kafi Sohag · MIT licensed</span><span>Not affiliated with Google or Mozilla</span></div></div>
</footer>

<div class="cookie" id="cookieBanner" role="dialog" aria-label="Cookie consent">
  This site uses Google Analytics to count visits, only if you accept. No ads. The extension itself has no analytics. <a href="${r}privacy/"><strong>Privacy</strong></a>
  <div class="install-links">
    <button class="button-primary" id="cookieAccept" type="button">Accept</button>
    <button class="button-secondary" id="cookieReject" type="button">Reject</button>
  </div>
</div>

<script src="https://code.jquery.com/jquery-3.7.1.min.js" integrity="sha256-/JqT3SQfawRcv/BIHPThkBvs0OEvtFFmqPF/lYI/Cxo=" crossorigin="anonymous"></script>
<script src="${r}assets/site.js"></script>
</body>
</html>
`;
}

/* ---------- blocks ---------- */
const installLinks = (firefoxFirst) => {
  const c = `<a class="button-primary" href="${STORE.chrome}" target="_blank" rel="noopener">Add to Chrome ${icon("arrow-right")}</a>`;
  const f = `<a class="button-secondary" href="${STORE.firefox}" target="_blank" rel="noopener">Add to Firefox</a>`;
  return firefoxFirst ? f.replace("button-secondary", "button-primary") + c.replace("button-primary", "button-secondary") : c + f;
};

const crumbs = (page) => `<nav class="crumbs" aria-label="Breadcrumb"><a href="${page.root}">Home</a>${page.crumbs.map(([p, n]) => `<span>/</span><a href="${page.root}${p}">${n}</a>`).join("")}<span>/</span><span>${esc(page.nav || page.h1)}</span></nav>`;

function hero(page, art, extra = "") {
  const [a, b] = [page.h1].flat();
  return `
  <section class="hero-section${page.path ? "" : " home"}">
    <div class="page-width hero-grid">
      <div class="hero-copy">
        ${page.crumbs ? crumbs(page) : ""}
        <span class="eyebrow">${esc(page.eyebrow)}</span>
        <h1>${esc(a)}${b ? ` <span>${esc(b)}</span>` : ""}</h1>
        <p class="hero-description">${esc(page.lede)}</p>
        ${extra}
      </div>
      ${art}
    </div>
  </section>`;
}

const cardGrid = (root, items) => `<div class="card-grid">
      ${items.map(([href, ic, title, text, link], i) => `<a class="info-card" href="${root}${href}"><span class="card-icon${ic ? "" : " num"}">${ic ? icon(ic) : String(i + 1).padStart(2, "0")}</span><h3>${esc(title)}</h3><p>${esc(text)}</p><span class="text-link">${esc(link)} ${icon("arrow-right")}</span></a>`).join("\n      ")}
    </div>`;

const faq = (page, faqs, heading = "Questions, answered.", intro = "") => `
  <section class="page-width faq-section" id="faq">
    <div>
      <span class="eyebrow">Good to know</span>
      <h2 class="h2">${heading}</h2>
      ${intro ? `<p class="lead">${esc(intro)}</p>` : ""}
    </div>
    <div class="faq-list">
      ${faqs.map(([q, a], i) => `<details class="faq-item"${i === 0 ? " open" : ""}><summary><h3>${esc(q)}</h3>${icon("plus")}</summary><p>${rich(a, page.root)}</p></details>`).join("\n      ")}
    </div>
  </section>`;

const cta = (heading, sub) => `
  <section class="page-width">
    <div class="cta-card">
      <span class="eyebrow">Less checking. More doing.</span>
      <h2>${esc(heading)}</h2>
      <p>${esc(sub)}</p>
      <div class="install-links">${installLinks()}</div>
      <div class="assurance"><span>${icon("check")}Free forever</span><span>${icon("check")}Private by design</span><span>${icon("check")}Open source</span></div>
    </div>
  </section>`;

const idea = (heading, text, label) => `
  <section class="page-width">
    <div class="idea-card">
      <div><span class="eyebrow">Your idea matters</span><h2>${heading}</h2><p>${text}</p></div>
      <a class="button-primary" href="${GITHUB}/issues" target="_blank" rel="noopener">${label} ${icon("arrow-up-right")}</a>
    </div>
  </section>`;

const section = (page, s) => `
      <h2>${esc(s.h)}</h2>
      ${(s.p || []).map((p) => `<p>${rich(p, page.root)}</p>`).join("\n      ")}
      ${s.list ? `<ul>${s.list.map((li) => `<li>${rich(li, page.root)}</li>`).join("")}</ul>` : ""}
      ${(s.sub || []).map(([h, p]) => `<h3>${esc(h)}</h3>\n      <p>${rich(p, page.root)}</p>`).join("\n      ")}`;

/* ---------- detail page: features, use cases, browsers, guides, comparisons ---------- */
function detail(page) {
  const steps = page.steps.map((s) => [s].flat());
  return layout(page, `${hero(page, shot(page, pageImg(page), page.shotTitle || page.nav, page.caption || "Runs in your browser", page.alt), `<div class="install-links">${installLinks(page.store === "firefox")}</div>`)}

  <section class="page-width content-section" style="padding-top:48px">
    <div class="detail-grid">
      <div class="panel prose">
        <h2>${esc(page.how.h)}</h2>
        ${page.how.p.map((p) => `<p>${rich(p, page.root)}</p>`).join("\n        ")}
        <h3>${esc(page.stepsTitle || "Quick setup")}</h3>
        <div class="steps-list">
          ${steps.map(([t, d], i) => `<div class="step-item"><span class="step-number">${String(i + 1).padStart(2, "0")}</span><div>${d ? `<h4 class="font-bold text-[15.5px] text-[#1b2940]">${esc(t)}</h4><p>${esc(d)}</p>` : `<p style="margin:0;padding-top:8px">${esc(t)}</p>`}</div></div>`).join("\n          ")}
        </div>
      </div>
      <aside class="panel side">
        <span class="eyebrow">${esc(page.side.label)}</span>
        <h2>${esc(page.side.h)}</h2>
        <p>${esc(page.side.p)}</p>
        <div class="side-links">${page.side.links.map(([href, t]) => `<a href="${page.root}${href}">${esc(t)} ${icon("arrow-right")}</a>`).join("")}</div>
        ${page.settings ? `<h2 style="margin-top:28px">${page.store ? "Details" : "Suggested settings"}</h2>
        <table class="settings"><tbody>${page.settings.map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`).join("")}</tbody></table>` : ""}
      </aside>
    </div>
  </section>

  <section class="page-width content-section" style="padding-top:22px">
    <div class="panel prose">
      <span class="eyebrow">Practical guide</span>${page.sections.map((s) => section(page, s)).join("\n")}
    </div>
  </section>
  ${faq(page, page.faqs, "Questions, answered.", page.faqIntro)}
  ${cta(...page.cta)}
  ${idea(page.ideaTitle || "Not seeing the feature you need?", "Share the browser task you would like to make easier. Your idea helps guide what gets built next.", page.ideaLabel || "Request a feature")}`);
}

/* ---------- assemble ---------- */
const pages = [];
const at = (pathname) => ({ path: pathname, root: "../".repeat(pathname.split("/").filter(Boolean).length) });
const add = (page, html) => pages.push({ path: page.path, html, priority: page.priority || "0.7" });
const plain = (h1) => [h1].flat().join(" ");

function build(list, dir, crumb, defaults) {
  return list.map((raw) => {
    const extra = more[raw.slug] || {};
    const p = { ...defaults, ...raw, ...extra, ...at(`${dir}${raw.slug}/`), crumbs: crumb ? [crumb] : [] };
    p.faqs = [...(extra.faqs || []), ...(raw.faqs || [])];
    p.nav = p.nav || plain(raw.h1);
    p.h1 = extra.h1 || raw.h1;
    p.how = p.how || { h: `How ${p.nav.toLowerCase()} works`, p: [raw.lede, ...(raw.body || []).map(([, t]) => t)] };
    p.sections = [...(p.sections || []), ...(extraSections[raw.slug] || []), ...(raw.points ? [{ h: "At a glance", list: raw.points.map(([t, d]) => `**${t}.** ${d}`) }] : [])];
    p.howName = `How to set up ${p.nav.toLowerCase()} with ${NAME}`;
    p.alt = p.alt || `${p.nav}: ${NAME} browser extension illustration`;
    return p;
  });
}

const app = (os) => ({
  "@context": "https://schema.org", "@type": "SoftwareApplication", name: NAME, applicationCategory: "BrowserApplication",
  operatingSystem: os, softwareVersion: "1.2.0", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  description: "Free auto refresh and page monitor browser extension with website change alerts.",
  url: `${SITE_URL}/`, downloadUrl: STORE.chrome, author: { "@type": "Person", name: "Al Kafi Sohag" },
});

const features = build(base.features, "features/", ["features/", "Features"], { eyebrow: "Feature", cta: ["Try it on your next open tab.", "Free for Chrome and Firefox, with no account required."] });
const useCases = build(base.useCases, "use-cases/", ["use-cases/", "Use cases"], { eyebrow: "Use case", ideaTitle: "Have a different use case in mind?", ideaLabel: "Suggest a use case", cta: ["Let the page check itself.", "Use the free extension for Chrome or Firefox."] });
const browsers = build(base.browsers, "", null, { eyebrow: "Download", priority: "0.9", cta: ["Install it in ten seconds.", "Free for Chrome and Firefox. No account, no ads, no tracking."] });
browsers.forEach((b) => { b.schema = app(b.slug === "chrome" ? "Chrome" : "Firefox"); });
const guidePages = build(guides, "guides/", ["guides/", "Guides"], { eyebrow: "Guide", priority: "0.8", cta: ["Skip the manual reloads.", "Free Auto Refresh does it on a timer, for Chrome and Firefox."] });
const comparePages = build(comparisons, "compare/", ["guides/", "Guides"], { eyebrow: "Comparison", cta: ["Try the free alternative.", "Every feature included. No account, no ads, no tracking."] });

features.forEach((f, i) => { f.eyebrow = `Feature ${String(i + 1).padStart(2, "0")}`; });
useCases.forEach((u, i) => { u.eyebrow = `Use case ${String(i + 1).padStart(2, "0")}`; });

const sideLinks = (p, own, other, ownDir, otherDir) => {
  const i = own.indexOf(p);
  const pick = [own[(i + 1) % own.length], own[(i + 2) % own.length]].map((x) => [`${ownDir}${x.slug}/`, x.nav]);
  const o = other[i % other.length];
  return [...pick, [`${otherDir}${o.slug}/`, o.nav]];
};

for (const p of features) p.side = p.side || { label: "A good fit for", h: "Routine page checks", p: "Combine this with the other controls to match the page you are watching.", links: sideLinks(p, features, useCases, "features/", "use-cases/") };
for (const p of useCases) p.side = p.side || { label: "Useful features", h: "Watch, then stop", p: "These controls make this job easier to set up and safer to leave running.", links: sideLinks(p, useCases, features, "use-cases/", "features/") };
for (const p of [...browsers, ...guidePages, ...comparePages]) p.side = p.side || { label: "Keep exploring", h: "Popular next steps", p: "The most used features and set-ups.", links: [["features/auto-refresh-timer/", "Auto refresh timer"], ["features/page-monitor-keyword-alert/", "Page change monitor"], ["use-cases/restock-alerts/", "Restock alerts"]] };

for (const p of [...features, ...useCases, ...browsers, ...guidePages, ...comparePages]) add(p, detail(p));

/* hubs */
function hub(cfg, list, dir, linkWord) {
  const p = { ...cfg, ...at(cfg.path), crumbs: [], priority: "0.9" };
  const items = list.map((x) => [`${dir}${x.slug}/`, null, x.nav, x.lede.split(". ")[0] + ".", linkWord(x)]);
  add(p, layout(p, `${hero(p, shot(p, pageImg(p), cfg.shotTitle, cfg.caption, cfg.alt))}

  <section class="page-width content-section" style="padding-top:64px">
    <div class="section-heading"><h2 class="h2">${esc(cfg.gridTitle)}</h2><p>${esc(cfg.gridText)}</p></div>
    ${cardGrid(p.root, items)}
  </section>

  <section class="page-width content-section" style="padding-top:32px">
    <div class="panel prose"><span class="eyebrow">Explore ${NAME}</span>${cfg.sections.map((s) => section(p, s)).join("\n")}</div>
  </section>
  ${faq(p, cfg.faqs)}
  ${cta(...cfg.cta)}
  ${idea(cfg.ideaTitle, cfg.ideaText, cfg.ideaLabel)}`));
}

hub(home.featuresHub, features, "features/", (x) => `Explore ${x.nav.toLowerCase()}`);
hub(home.useCasesHub, useCases, "use-cases/", () => "See the setup");
hub(home.guidesHub, [...guidePages, ...comparePages.map((c) => ({ ...c, slug: `../compare/${c.slug}` }))], "guides/", () => "Read the guide");

/* FAQ page: grouped */
{
  const groups = home.faqPage.groups;
  const all = groups.flatMap((g) => g.items);
  const p = { ...home.faqPage, ...at("faq/"), crumbs: [], faqs: all, priority: "0.8" };
  add(p, layout(p, `${hero(p, shot(p, pageImg(p), "Help centre", "Answers in plain words", `Frequently asked questions about ${NAME}`))}
  ${groups.map((g) => faq(p, g.items, esc(g.title), g.intro).replace(' id="faq"', "")).join("\n")}
  ${cta("Still curious? Try it.", "Free for Chrome and Firefox. Nothing to sign up for.")}
  ${idea("Question not answered?", "Ask on GitHub and it will be added here.", "Ask a question")}`));
}

/* simple text pages */
function textPage(pathname, cfg, bodyHtml) {
  const p = { ...cfg, ...at(pathname), crumbs: [], priority: "0.4" };
  add(p, layout(p, `
  ${hero(p, shot(p, pageImg(p), cfg.h1, cfg.caption, cfg.alt))}
  <section class="page-width content-section" style="padding-top:48px"><div class="panel prose" style="max-width:820px">${bodyHtml(p)}</div></section>`));
}

textPage("changelog/", { h1: "Changelog", eyebrow: "Releases", title: `Changelog – ${NAME}`, desc: `What changed in each version of the ${NAME} extension.`, lede: "Every release, newest first.", caption: "Every version, newest first", alt: `The ${NAME} extension card in a browser window` },
  (p) => home.changelog.map(([v, items]) => section(p, { h: `Version ${v}`, list: items })).join("\n"));

textPage("privacy/", { h1: "Privacy", eyebrow: "No data collected", title: `Privacy – ${NAME}`, desc: `${NAME} collects no data and makes no network requests. What the extension and this website do with information.`, lede: "The short version: the extension collects nothing and sends nothing.", caption: "Nothing leaves your browser", alt: `${NAME} backup and profile settings beside a shield with a tick` },
  (p) => home.privacy.map((s) => section(p, s)).join("\n") + `<p>The full policy is in <a href="${GITHUB}/blob/main/PRIVACY.md" target="_blank" rel="noopener">PRIVACY.md</a> on GitHub.</p>`);

textPage("contact/", { h1: "Contact", eyebrow: "Get in touch", title: `Contact – ${NAME}`, desc: `Report a bug, suggest a feature or ask a question about ${NAME}.`, lede: "Found a bug or have an idea? Send a message here, or open a GitHub issue.", caption: "Questions and ideas welcome", alt: "An envelope beside a short message form with a send button" },
  () => `${TELEGRAM_GROUP ? `<h2>Join the Telegram group</h2>
      <p>Ask questions, share how you use it and hear about new versions first.</p>
      <p><a class="button-secondary" href="${TELEGRAM_GROUP}" target="_blank" rel="noopener">Open the Telegram group</a></p>
      ` : ""}<h2>Send a message</h2>
      <p>Your message goes straight to the developer. Add your email if you would like a reply.</p>
      <!-- Sent by assets/site.js to /api/contact (functions/api/contact.js), which forwards it to Telegram -->
      <form id="contactForm" novalidate style="display:grid;gap:16px;margin-top:18px">
        <div hidden aria-hidden="true"><label for="cWeb">Leave this empty</label><input id="cWeb" name="website" tabindex="-1" autocomplete="off"></div>
        <div class="field"><label for="cName">Name</label><input id="cName" name="name" autocomplete="name"></div>
        <div class="field"><label for="cEmail">Email (optional)</label><input id="cEmail" name="email" type="email" autocomplete="email" placeholder="name@example.com"></div>
        <div class="field"><label for="cMsg">Message</label><textarea id="cMsg" name="message" rows="5" maxlength="3000" required></textarea></div>
        <div><button class="button-primary" type="submit">Send message</button></div>
        <p id="contactNote" hidden role="status" data-sent="Thank you. Your message has been sent." data-empty="Please write a message first." data-failed="The message could not be sent. Please open a GitHub issue instead: ${GITHUB}/issues"></p>
      </form>`);

/* home */
{
  const p = { ...home.home, ...at(""), priority: "1.0", faqs: home.home.faqs,
    schema: [app("Chrome, Firefox"),
      { "@context": "https://schema.org", "@type": "WebSite", name: NAME, url: `${SITE_URL}/` },
      { "@context": "https://schema.org", "@type": "Organization", name: NAME, url: `${SITE_URL}/`, logo: `${SITE_URL}/assets/logo.png`, sameAs: [GITHUB] }] };
  const h = home.home;
  add(p, layout(p, `${hero(p, shot(p, pageImg(p), "Free Auto Refresh", "Simple controls, right where you need them", `${NAME} popup showing a refresh counter, interval presets and a Start button`),
    `<div class="install-links">${installLinks()}</div>
        <div class="trust-row"><span>${icon("check")}0 trackers</span><span>${icon("check")}0 network requests</span><span>${icon("check")}100% free</span><span>${icon("check")}Open source</span></div>`)}

  <section class="page-width content-section">
    <div class="section-heading"><span class="eyebrow">Made for the way you browse</span><h2 class="h2">${esc(h.featuresTitle)}</h2><p>${esc(h.featuresText)}</p></div>
    ${cardGrid(p.root, features.slice(0, 9).map((f) => [`features/${f.slug}/`, f.icon, f.nav, f.lede.split(". ")[0] + ".", "See how it works"]))}
  </section>

  <section class="band">
    <div class="page-width split">
      <div><span class="eyebrow">Easy from the first click</span><h2 class="h2">${esc(h.stepsTitle)}</h2><p class="lead">${esc(h.stepsText)}</p></div>
      <div class="steps-list">${h.steps.map(([t, d], i) => `<div class="step-item"><span class="step-number">${String(i + 1).padStart(2, "0")}</span><div><h3>${esc(t)}</h3><p>${esc(d)}</p></div></div>`).join("")}</div>
    </div>
  </section>

  <section class="page-width content-section">
    <div class="section-heading"><span class="eyebrow">A handy tab to have around</span><h2 class="h2">${esc(h.usesTitle)}</h2><p>${esc(h.usesText)}</p></div>
    ${cardGrid(p.root, useCases.slice(0, 9).map((u) => [`use-cases/${u.slug}/`, u.icon, u.nav, u.lede.split(". ")[0] + ".", "See the setup"]))}
  </section>

  <section class="page-width content-section">
    <div class="split even">
      ${shot(p, "home-watch", "Page watch", "Stops and tells you on a match", "The Watch the page setting in Free Auto Refresh, next to a page marked as matched", "left")}
      <div class="prose"><span class="eyebrow">Page watching</span><h2 class="h2">${esc(h.watchTitle)}</h2>${h.watchText.map((t) => `<p>${rich(t, p.root)}</p>`).join("")}
        <table class="settings"><tbody>${h.watchRules.map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`).join("")}</tbody></table>
      </div>
    </div>
  </section>

  <section class="page-width content-section">
    <div class="panel prose"><span class="eyebrow">Why ${NAME}</span>${h.sections.map((s) => section(p, s)).join("\n")}</div>
  </section>
  ${faq(p, h.faqs, "Questions, answered.", "A few quick details about the extension and how it works.")}
  ${cta("Install it in ten seconds.", "Free for Chrome and Firefox. No account, no ads, no tracking.")}`));
}

/* ---------- write ---------- */
for (const { path: p, html } of pages) {
  const dir = path.join(OUT, p);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html);
}

fs.writeFileSync(path.join(OUT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url><loc>${SITE_URL}/${p.path.replace(/guides\/\.\.\//, "")}</loc><lastmod>${TODAY}</lastmod><priority>${p.priority}</priority></url>`).join("\n")}
</urlset>
`);
fs.writeFileSync(path.join(OUT, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
fs.writeFileSync(path.join(OUT, "assets", "placeholder.svg"), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 720"><rect width="960" height="720" fill="#eaf1ff"/><g fill="none" stroke="#3978f6" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" transform="translate(420 290) scale(5)"><path d="M3 12a9 9 0 0 1 9-9 9.750 9.750 0 0 1 6.740 2.740L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.750 9.750 0 0 1-6.740-2.740L3 16"/><path d="M8 16H3v5"/></g></svg>\n`);

fs.writeFileSync(path.join(__dirname, "IMAGES.md"), `# Website images

One picture per page, cut from the generated collage sheets by \`site/make-images.py\` (the crop boxes are listed there).
To redo them: \`python site/make-images.py "<folder with the sheets>"\`, then \`npm run build:site\`. A page whose file is missing shows the placeholder.

| File | Used on |
|---|---|
${Object.entries(used).map(([k, where]) => `| \`docs/assets/img/${k}.webp\` | ${where.join(", ")} |`).join("\n")}
| \`docs/assets/poster.png\` | link previews on all pages |
`);
console.log(`Built ${pages.length} pages, sitemap.xml, robots.txt and site/IMAGES.md (${Object.keys(used).length} pictures)`);
