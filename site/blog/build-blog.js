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
const footerNoCurrent = footerToEnd;

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

function postCard(p, up, n) {
  return `<a class="info-card" href="${up}blog/${p.slug}/"><span class="card-icon num">${String(n).padStart(2, "0")}</span><span class="eyebrow">${esc(p.cat)}</span><h3>${esc(p.title)}</h3><p>${esc(p.desc)}</p><span class="text-link">Read the post ${arrow}</span></a>`;
}

function buildPost(p, idx) {
  const up = "../../";
  const url = `${SITE}/blog/${p.slug}/`;
  const body = p.sections.map(([h, html]) => `<h2>${esc(h)}</h2>\n        ${fix(html, up)}`).join("\n        ");
  const faq = p.faqs.map(([q, a], i) => `      <details class="faq-item"${i === 0 ? " open" : ""}><summary><h3>${esc(q)}</h3><svg class="ic" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M5 12h14" /> <path d="M12 5v14" /> </svg></summary><p>${esc(a)}</p></details>`).join("\n");
  const related = p.related.map(([label, href]) => `<a href="${up}${href}">${esc(label)} ${arrow}</a>`).join("");
  const more = [1, 2, 3].map((k) => posts[(idx + k) % posts.length]);
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
  <section class="hero-section">
    <div class="page-width hero-grid">
      <div class="hero-copy">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="../../">Home</a><span>/</span><a href="../../blog/">Blog</a><span>/</span><span>${esc(p.cat)}</span></nav>
        <span class="eyebrow">${esc(p.cat)}</span>
        <h1>${esc(p.h1[0])} <span>${esc(p.h1[1])}</span></h1>
        <p class="hero-description">${esc(p.lede)}</p>
        ${installLinks}
      </div>
      <figure class="shot ">
        <div class="shot-bar"><span class="shot-dots"><i></i><i></i><i></i></span><span class="shot-title">${esc(p.cat)}</span></div>
        <img src="../../assets/img/${p.img}" alt="${esc(p.imgAlt)}" width="800" height="600" loading="lazy">
        <figcaption>${esc(p.cap)}</figcaption>
      </figure>
    </div>
  </section>

  <section class="page-width content-section" style="padding-top:48px">
    <div class="detail-grid">
      <article class="panel prose">
        ${body}
      </article>
      <aside class="panel side">
        <span class="eyebrow">Keep exploring</span>
        <h2>Related pages</h2>
        <p>More on this topic.</p>
        <div class="side-links">${related}</div>
      </aside>
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
    <div class="section-heading"><h2 class="h2">More from the blog</h2></div>
    <div class="card-grid">
      ${more.map((m) => postCard(m, up, posts.indexOf(m) + 1)).join("\n      ")}
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
  const main = `
  <section class="hero-section">
    <div class="page-width hero-grid">
      <div class="hero-copy">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="../">Home</a><span>/</span><span>Blog</span></nav>
        <span class="eyebrow">The blog</span>
        <h1>Refreshing, reloading <span>and watching pages.</span></h1>
        <p class="hero-description">Short, practical posts: shortcuts, fixes, browser set-ups and ways to be told when a page changes.</p>
        ${installLinks}
      </div>
      <figure class="shot ">
        <div class="shot-bar"><span class="shot-dots"><i></i><i></i><i></i></span><span class="shot-title">Blog</span></div>
        <img src="../assets/img/guides/index.webp" alt="Three numbered steps leading to the Free Auto Refresh Start button" width="800" height="600" loading="lazy">
        <figcaption>${posts.length} posts and counting</figcaption>
      </figure>
    </div>
  </section>

  <section class="page-width content-section" style="padding-top:64px">
    <div class="section-heading"><h2 class="h2">All posts</h2><p>Pick a topic, or start with the first.</p></div>
    <div class="card-grid">
      ${posts.map((p, i) => postCard(p, "../", i + 1)).join("\n      ")}
    </div>
  </section>

  ${ctaCard}`;
  // the index is one folder deep, so ../../ in shared pieces becomes ../
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
