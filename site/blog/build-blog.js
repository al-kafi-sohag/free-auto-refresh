// Builds docs/blog/ (index + one page per post) and adds the blog to docs/sitemap.xml.
// Run: node site/blog/build-blog.js
// It reuses the header, footer, install buttons and analytics block of an existing, finished page
// (docs/guides/how-to-stop-auto-refresh/index.html), so blog pages always match the rest of the site.
// Run site/blog/add-nav.js first if the Blog link is not yet in the site navigation.

const fs = require("fs");
const path = require("path");

const DOCS = path.resolve(__dirname, "..", "..", "docs");
const SITE = "https://freeautorefresh.com";
const DATE = "2026-11-18";
const posts = [...require("./posts-a"), ...require("./posts-b")];

const shell = fs.readFileSync(path.join(DOCS, "guides", "how-to-stop-auto-refresh", "index.html"), "utf8").replace(/\r\n/g, "\n");
const between = (s, a, b, inclusiveEnd = true) => {
  const i = s.indexOf(a);
  if (i < 0) throw new Error("shell marker missing: " + a);
  const j = s.indexOf(b, i);
  if (j < 0) throw new Error("shell end marker missing: " + b);
  return s.slice(i, inclusiveEnd ? j + b.length : j);
};

const headTools = between(shell, '<link rel="icon"', '<link rel="stylesheet" href="../../assets/site.css">');
const analytics = between(shell, '<script async src="https://www.googletagmanager.com/gtm.js', "</head>", false);
let header = between(shell, '<header class="site-header">', "</header>");
const footerToEnd = shell.slice(shell.indexOf('<footer class="site-footer">'));
const installLinks = between(shell, '<div class="install-links">', "</div>");
const ctaCard = between(shell, '<section class="page-width">\n    <div class="cta-card">', "</section>");
const arrow = between(shell, '<svg class="ic" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M5 12h14" /> <path d="m12 5 7 7-7 7" />', "</svg>");

if (!header.includes('href="../../blog/"')) throw new Error("Blog link missing from the site navigation; run site/blog/add-nav.js first");
header = header.split('<a href="../../guides/" aria-current="page">Guides</a>').join('<a href="../../guides/">Guides</a>')
  .split('<a href="../../blog/">Blog</a>').join('<a href="../../blog/" aria-current="page">Blog</a>');
const footerNoCurrent = footerToEnd.replace('<script src="../../assets/site.js"></script>', '<script src="../../assets/site.js"></script>\n<script src="../../assets/blog.js"></script>');

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const plain = (html) => html.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
const fix = (html, up) => html.split("{root}").join(up);
// the shell lives two folders deep; the index is one folder deep
const rebase = (html, up) => (up === "../" ? html.split("../../").join("../") : html);

function page({ depth, title, desc, kw, canonical, ogType, ld, main }) {
  const up = depth === 1 ? "../" : "../../";
  const head = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#eef4ff">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="keywords" content="${esc(kw.join(", "))}">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="${canonical}">
<meta property="og:site_name" content="Free Auto Refresh">
<meta property="og:type" content="${ogType}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${SITE}/assets/poster.png">
<meta property="og:image:alt" content="Free Auto Refresh: auto refresh and page monitor browser extension">
<meta property="og:locale" content="en_US">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${SITE}/assets/poster.png">
<meta name="google-site-verification" content="ww9t1NvE40Omq86n1bNGdVptryQJXYkv5f0-MjdqTqM">
<meta name="msvalidate.01" content="3CB45458A679463A21F05BA747535729">
${headTools}
<link rel="stylesheet" href="../../assets/site.css">
<link rel="stylesheet" href="../../assets/blog.css">
${ld.map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join("\n")}
${analytics}</head>
<body data-ga="G-0DTP2D307V">

${header}

<main>
${main}
</main>

${footerNoCurrent}`;
  return rebase(head, up);
}

const crumb = (items) => ({
  "@context": "https://schema.org", "@type": "BreadcrumbList",
  itemListElement: items.map(([name, url], i) => ({ "@type": "ListItem", position: i + 1, name, item: url })),
});

const DATE_LABEL = "Nov 18, 2026";
const FEATURED = "auto-refresh-chrome-without-extension";
const slugify = (s) => s.toLowerCase().replace(/&amp;/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const readMin = (p) => Math.max(2, Math.round(plain(p.sections.map((s) => s[1]).join(" ")).split(" ").length / 190));
const meta = (p) => `<div class="bl-meta"><span>Al Kafi Sohag</span><i></i><span>${DATE_LABEL}</span><i></i><span>${readMin(p)} min read</span></div>`;

function card(p, up) {
  const text = (p.title + " " + p.desc + " " + p.kw.join(" ") + " " + p.cat).toLowerCase();
  return `<a class="bl-card" href="${up}blog/${p.slug}/" data-cat="${esc(p.cat)}" data-text="${esc(text)}"><div class="bl-card-img"><img src="${up}assets/img/${p.img}" alt="${esc(p.imgAlt)}" width="800" height="600" loading="lazy"></div><div class="bl-card-body"><span class="bl-badge">${esc(p.cat)}</span><h3>${esc(p.title)}</h3><p>${esc(p.desc)}</p><div class="bl-meta"><span>${readMin(p)} min read</span><i></i><span>${DATE_LABEL}</span></div></div></a>`;
}

function buildPost(p, idx) {
  const up = "../../";
  const url = `${SITE}/blog/${p.slug}/`;
  const ids = p.sections.map(([h]) => slugify(h));
  const inlineCta = `<aside class="bl-inline-cta"><h3>Skip the manual reloads</h3><p>Free Auto Refresh reloads a tab on a timer and can alert you when a page changes. Free, private, no account.</p>${installLinks}</aside>`;
  const body = p.sections.map(([h, html], i) =>
    `<h2 id="${ids[i]}">${esc(h)}</h2>\n        ${fix(html, up)}` + (i === 1 ? `\n        ${inlineCta}` : "")).join("\n        ");
  const toc = p.sections.map(([h], i) => `<a href="#${ids[i]}">${esc(h)}</a>`).join("");
  const faq = p.faqs.map(([q, a], i) => `      <details class="faq-item"${i === 0 ? " open" : ""}><summary><h3>${esc(q)}</h3><svg class="ic" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M5 12h14" /> <path d="M12 5v14" /> </svg></summary><p>${esc(a)}</p></details>`).join("\n");
  const related = p.related.map(([label, href]) => `<a href="${up}${href}"><span>${esc(label)}</span>${arrow}</a>`).join("");
  const prev = posts[(idx - 1 + posts.length) % posts.length];
  const next = posts[(idx + 1) % posts.length];
  const more = [2, 3, 4].map((k) => posts[(idx + k) % posts.length]);
  const ld = [
    crumb([["Home", SITE + "/"], ["Blog", SITE + "/blog/"], [p.title, url]]),
    {
      "@context": "https://schema.org", "@type": "BlogPosting", headline: p.title, description: p.desc,
      datePublished: DATE, dateModified: DATE, mainEntityOfPage: url, image: SITE + "/assets/poster.png",
      author: { "@type": "Person", name: "Al Kafi Sohag" },
      publisher: { "@type": "Organization", name: "Free Auto Refresh", logo: { "@type": "ImageObject", url: SITE + "/assets/logo.png" } },
    },
    {
      "@context": "https://schema.org", "@type": "FAQPage",
      mainEntity: p.faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    },
  ];
  const main = `
  <section class="page-width bl-head">
    <nav class="crumbs" aria-label="Breadcrumb" style="justify-content:center"><a href="../../">Home</a><span>/</span><a href="../../blog/">Blog</a><span>/</span><span>${esc(p.cat)}</span></nav>
    <span class="bl-badge" style="margin-top:18px">${esc(p.cat)}</span>
    <h1>${esc(p.h1[0])} <span>${esc(p.h1[1])}</span></h1>
    <p class="hero-description">${esc(p.lede)}</p>
    ${meta(p)}
    ${installLinks}
    <figure class="bl-banner"><img src="../../assets/img/${p.img}" alt="${esc(p.imgAlt)}" width="800" height="600"><figcaption>${esc(p.cap)}</figcaption></figure>
  </section>

  <section class="page-width bl-layout">
    <article class="bl-content">
        ${body}
    </article>
    <aside class="bl-side">
      <div class="bl-box bl-toc-box"><h2>On this page</h2><nav class="bl-toc" aria-label="On this page">${toc}</nav></div>
      <div class="bl-box bl-install"><h2>Free for Chrome and Firefox</h2><p>Auto refresh and page alerts in one small extension. No account.</p>${installLinks}</div>
      <div class="bl-box"><h2>Related</h2><div class="bl-rel">${related}</div></div>
    </aside>
  </section>

  <section class="page-width" style="margin-top:8px">
    <div class="bl-pn" style="max-width:700px;margin-inline:auto">
      <a href="../../blog/${prev.slug}/"><small>&larr; Previous</small><strong>${esc(prev.title)}</strong></a>
      <a class="next" href="../../blog/${next.slug}/"><small>Next &rarr;</small><strong>${esc(next.title)}</strong></a>
    </div>
  </section>

  <section class="page-width faq-section" id="faq">
    <div>
      <span class="eyebrow">Good to know</span>
      <h2 class="h2">Questions, answered.</h2>
    </div>
    <div class="faq-list">
${faq}
    </div>
  </section>

  ${ctaCard}

  <section class="page-width content-section" style="padding-top:32px">
    <div class="bl-more-heading"><h2 class="h2">More from the blog</h2><a class="bl-arrow" href="../../blog/">All posts ${arrow}</a></div>
    <div class="bl-grid">
      ${more.map((m) => card(m, up).replace(/ data-cat="[^"]*" data-text="[^"]*"/, "")).join("\n      ")}
    </div>
  </section>`;
  return page({ depth: 2, title: p.title, desc: p.desc, kw: p.kw, canonical: url, ogType: "article", ld, main });
}

function buildIndex() {
  const url = `${SITE}/blog/`;
  const title = "Blog: Auto Refresh, Hard Refresh and Page Monitoring Tips";
  const desc = "Practical, short posts on auto refresh, hard refresh shortcuts, fixing pages that reload by themselves, and watching pages for changes in Chrome and Firefox.";
  const ld = [
    crumb([["Home", SITE + "/"], ["Blog", url]]),
    { "@context": "https://schema.org", "@type": "Blog", name: "Free Auto Refresh blog", url,
      blogPost: posts.map((p) => ({ "@type": "BlogPosting", headline: p.title, url: `${SITE}/blog/${p.slug}/`, datePublished: DATE })) },
  ];
  const cats = [...new Set(posts.map((p) => p.cat))];
  const chips = [`<button class="bl-chip" type="button" data-cat="all" aria-pressed="true">All<small>${posts.length}</small></button>`]
    .concat(cats.map((c) => `<button class="bl-chip" type="button" data-cat="${esc(c)}" aria-pressed="false">${esc(c)}<small>${posts.filter((p) => p.cat === c).length}</small></button>`)).join("");
  const f = posts.find((p) => p.slug === FEATURED);
  const featured = `<a class="bl-featured" id="blFeatured" href="../blog/${f.slug}/">
      <div class="bl-featured-img"><img src="../assets/img/${f.img}" alt="${esc(f.imgAlt)}" width="800" height="600"></div>
      <div class="bl-featured-body"><span class="bl-badge">Featured · ${esc(f.cat)}</span><h2>${esc(f.title)}</h2><p>${esc(f.desc)}</p>${meta(f)}<span class="bl-arrow">Read the post ${arrow}</span></div>
    </a>`;
  const main = `
  <section class="page-width bl-hero">
    <nav class="crumbs" aria-label="Breadcrumb" style="justify-content:center"><a href="../">Home</a><span>/</span><span>Blog</span></nav>
    <span class="eyebrow" style="display:block;margin-top:14px">The blog</span>
    <h1>Refreshing, reloading <span>and watching pages.</span></h1>
    <p class="hero-description">Short, practical posts: shortcuts, fixes, browser set-ups and ways to be told when a page changes.</p>
    <div class="bl-tools">
      <input class="bl-search" id="blSearch" type="search" placeholder="Search ${posts.length} posts" aria-label="Search posts">
      <div class="bl-chips" role="group" aria-label="Topics">${chips}</div>
    </div>
  </section>

  <section class="page-width content-section" style="padding-top:36px">
    ${featured}
  </section>

  <section class="page-width content-section" style="padding-top:8px">
    <div class="bl-grid">
      ${posts.map((p) => card(p, "../")).join("\n      ")}
    </div>
    <p class="bl-empty" id="blEmpty">No posts match. Try another word or topic.</p>
  </section>

  ${ctaCard}`;
  return page({ depth: 1, title, desc, kw: ["auto refresh blog", "hard refresh", "page monitor", "auto refresh tips"], canonical: url, ogType: "website", ld, main })
    .split("../../assets/img/").join("../assets/img/");
}

// write pages
const out = path.join(DOCS, "blog");
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, "index.html"), buildIndex());
posts.forEach((p, i) => {
  fs.mkdirSync(path.join(out, p.slug), { recursive: true });
  fs.writeFileSync(path.join(out, p.slug, "index.html"), buildPost(p, i));
});

// sitemap: drop old blog lines, add the new ones
const smPath = path.join(DOCS, "sitemap.xml");
let sm = fs.readFileSync(smPath, "utf8").replace(/\r\n/g, "\n").split("\n").filter((l) => !l.includes("/blog/")).join("\n");
const entries = [`  <url><loc>${SITE}/blog/</loc><lastmod>${DATE}</lastmod><priority>0.8</priority></url>`]
  .concat(posts.map((p) => `  <url><loc>${SITE}/blog/${p.slug}/</loc><lastmod>${DATE}</lastmod><priority>0.7</priority></url>`)).join("\n");
sm = sm.replace("</urlset>", entries + "\n</urlset>");
fs.writeFileSync(smPath, sm);

// quick sanity: titles under 60 chars and descriptions under 160
posts.forEach((p) => {
  if (p.title.length > 70) console.warn("long title:", p.slug, p.title.length);
  if (p.desc.length > 165) console.warn("long description:", p.slug, p.desc.length);
});
console.log(`Built blog index + ${posts.length} posts, sitemap updated.`);
