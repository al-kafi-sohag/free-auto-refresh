// Draws the website's illustrations as SVG files in docs/assets/img/.
//   node site/make-art.js        (then npm run build:site)
// One shared visual language: the site's background and blues, white cards with soft shadows,
// and green / violet / amber accents. Each picture is reused on several related pages.
const fs = require("fs");
const path = require("path");

const OUT = path.resolve(__dirname, "..", "docs", "assets", "img");
const W = 960, H = 720;
const C = { blue: "#3978f6", blueDark: "#2163e5", sky: "#67a0ff", ink: "#0d1729", muted: "#8a97a9", line: "#dfe8f5", soft: "#edf3ff",
  green: "#27bd81", greenSoft: "#e6f8ef", violet: "#9570df", violetSoft: "#f1ecff", amber: "#f5a524", amberSoft: "#fff4dc", red: "#ef7b75" };

const wrap = (body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="Inter, 'Segoe UI', system-ui, sans-serif">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6f9ff"/><stop offset="1" stop-color="#e3edff"/></linearGradient>
  <linearGradient id="blue" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.sky}"/><stop offset="1" stop-color="${C.blue}"/></linearGradient>
  <linearGradient id="deep" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4f8bff"/><stop offset="1" stop-color="#1f55d6"/></linearGradient>
  <linearGradient id="mint" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5fe0a8"/><stop offset="1" stop-color="#1fae74"/></linearGradient>
  <linearGradient id="grape" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b79cf5"/><stop offset="1" stop-color="#8259e0"/></linearGradient>
  <linearGradient id="sun" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffc85c"/><stop offset="1" stop-color="#f59a1b"/></linearGradient>
  <filter id="sh" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#2f55a0" flood-opacity=".18"/></filter>
  <filter id="sh2" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#2f55a0" flood-opacity=".16"/></filter>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<circle cx="800" cy="120" r="230" fill="#d5e4ff" opacity=".7"/>
<circle cx="120" cy="640" r="190" fill="#d9f5e6" opacity=".7"/>
<circle cx="880" cy="640" r="90" fill="#ece4ff" opacity=".8"/>
${body}
</svg>
`;

const card = (x, y, w, h, r = 22, extra = "") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="#fff" filter="url(#sh)" ${extra}/>`;
const box = (x, y, w, h, fill, r = 12) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"/>`;
const bar = (x, y, w, fill = "#e3eaf6", h = 14) => box(x, y, w, h, fill, h / 2);
const dot = (x, y, r, fill) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;
const text = (x, y, s, size = 22, fill = C.ink, weight = 700, anchor = "start") => `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${s}</text>`;
// the refresh mark, centred on (x, y), radius r
const mark = (x, y, r, stroke = "#fff", sw = r / 4) => `<g transform="translate(${x - r} ${y - r}) scale(${r / 12})" fill="none" stroke="${stroke}" stroke-width="${sw / (r / 12)}" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.750 9.750 0 0 1 6.740 2.740L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.750 9.750 0 0 1-6.740-2.740L3 16"/><path d="M8 16H3v5"/></g>`;
const tick = (x, y, s, stroke = "#fff", sw = 6) => `<path d="M${x - s} ${y}l${s * 0.7} ${s * 0.7}l${s * 1.3} -${s * 1.4}" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`;
const logo = (x, y, s = 56) => box(x, y, s, s, "url(#blue)", s * 0.3) + mark(x + s / 2, y + s / 2, s * 0.27);
const toggle = (x, y, on) => box(x, y, 62, 34, on ? "url(#blue)" : "#d5ddeb", 17) + dot(x + (on ? 45 : 17), y + 17, 12, "#fff");
const browser = (x, y, w, h) => card(x, y, w, h, 24) + box(x, y, w, 58, "#f3f6fc", 24) + box(x, y + 34, w, 24, "#f3f6fc", 0)
  + dot(x + 30, y + 29, 7, "#ff9b8d") + dot(x + 52, y + 29, 7, "#f7ca68") + dot(x + 74, y + 29, 7, "#71d39b") + box(x + 100, y + 16, w - 190, 26, "#fff", 13);
const pill = (x, y, n, t) => `<g filter="url(#sh2)">${box(x, y, 330, 86, "#101b30", 22)}</g>` + dot(x + 34, y + 40, 9, C.green) + dot(x + 34, y + 40, 16, "#27bd8133")
  + text(x + 62, y + 44, n, 30, "#fff", 800) + text(x + 62, y + 66, "REFRESHES", 11, "#8c9bb5", 700) + text(x + 250, y + 42, t, 24, "#fff", 800, "end") + text(x + 250, y + 66, "NEXT REFRESH", 11, "#8c9bb5", 700, "end")
  + box(x + 272, y + 28, 7, 24, "#fff", 2) + box(x + 285, y + 28, 7, 24, "#fff", 2) + box(x, y + 80, 330, 6, "#26334d", 3) + box(x, y + 80, 210, 6, "url(#blue)", 3);
const toast = (x, y, title, sub, grad = "mint") => `<g filter="url(#sh2)">${box(x, y, 330, 92, "#fff", 20)}</g>` + dot(x + 48, y + 46, 26, `url(#${grad})`) + tick(x + 46, y + 47, 9, "#fff", 5)
  + text(x + 90, y + 42, title, 20) + text(x + 90, y + 66, sub, 15, C.muted, 500);

const art = {
  /* the extension popup */
  popup: () => card(280, 70, 400, 580, 28)
    + logo(312, 104) + text(384, 128, "Free Auto Refresh", 22) + text(384, 152, "Fixed or random intervals", 14, C.muted, 500) + box(574, 112, 78, 30, C.greenSoft, 15) + text(613, 133, "Running", 13, "#1a9a68", 700, "middle")
    + [0, 1, 2].map((i) => box(312 + i * 118, 184, 104, 84, "#f5f8fe", 16) + text(364 + i * 118, 226, ["12", "0:24", "6m"][i], 26, C.ink, 800, "middle") + text(364 + i * 118, 250, ["REFRESHES", "NEXT IN", "ELAPSED"][i], 10, C.muted, 700, "middle")).join("")
    + bar(312, 288, 336, "#e2eafa", 8) + bar(312, 288, 220, "url(#blue)", 8)
    + ["5–10s", "15–30s", "30–60s", "5 min"].map((t, i) => box(312 + i * 86, 322, 76, 36, i === 2 ? C.soft : "#fff", 10) + `<rect x="${312 + i * 86}" y="322" width="76" height="36" rx="10" fill="none" stroke="${i === 2 ? C.blue : C.line}" stroke-width="2"/>` + text(350 + i * 86, 346, t, 14, i === 2 ? C.blueDark : "#44536d", 700, "middle")).join("")
    + [0, 1].map((i) => `<rect x="${312 + i * 174}" y="384" width="162" height="50" rx="12" fill="#fff" stroke="${C.line}" stroke-width="2"/>` + text(330 + i * 174, 416, ["30", "60"][i], 20)).join("")
    + box(312, 458, 336, 58, "#f5f8fe", 14) + dot(342, 487, 13, C.violetSoft) + text(366, 493, "Watch the page", 16) + toggle(574, 470, true)
    + box(312, 540, 336, 62, "url(#deep)", 16) + text(480, 579, "Start", 22, "#fff", 800, "middle"),

  /* countdown ring */
  timer: () => browser(90, 90, 520, 380) + [0, 1, 2, 3].map((i) => bar(130, 190 + i * 44, [380, 440, 320, 400][i])).join("") + bar(130, 190, 220, "#cfdcf3", 18)
    + `<g filter="url(#sh)"><circle cx="680" cy="420" r="190" fill="#fff"/></g><circle cx="680" cy="420" r="140" fill="none" stroke="#e2eafa" stroke-width="26"/>`
    + `<circle cx="680" cy="420" r="140" fill="none" stroke="url(#blue)" stroke-width="26" stroke-linecap="round" stroke-dasharray="600 880" transform="rotate(-90 680 420)"/>`
    + text(680, 418, "0:24", 76, C.ink, 800, "middle") + text(680, 462, "NEXT REFRESH", 16, C.muted, 700, "middle")
    + `<g filter="url(#sh2)">${box(120, 520, 300, 96, "#fff", 22)}</g>` + logo(142, 540) + text(216, 574, "Every 30 seconds", 20) + text(216, 598, "12 refreshes so far", 15, C.muted, 500),

  /* page being watched, with a match */
  monitor: () => browser(110, 80, 600, 470) + bar(150, 176, 240, "#cfdcf3", 20) + bar(150, 222, 500) + bar(150, 256, 440)
    + box(150, 296, 520, 86, C.greenSoft, 18) + `<rect x="150" y="296" width="520" height="86" rx="18" fill="none" stroke="#9fe3c4" stroke-width="3" stroke-dasharray="10 8"/>` + dot(198, 339, 24, "url(#mint)") + tick(196, 340, 8, "#fff", 5) + text(238, 334, "In stock", 24, "#17734f", 800) + text(238, 360, "the text you were waiting for", 15, "#4f9a7b", 500)
    + bar(150, 414, 480) + bar(150, 448, 380) + bar(150, 482, 430)
    + `<g filter="url(#sh2)">${dot(700, 150, 46, "url(#grape)")}</g><ellipse cx="700" cy="150" rx="24" ry="15" fill="none" stroke="#fff" stroke-width="5"/>` + dot(700, 150, 7, "#fff")
    + toast(520, 548, "Match found", "Refreshing stopped"),

  /* the on-page counter */
  counter: () => browser(100, 90, 760, 500) + bar(144, 190, 300, "#cfdcf3", 22) + [0, 1, 2, 3, 4].map((i) => bar(144, 240 + i * 40, [640, 560, 610, 480, 590][i])).join("")
    + box(144, 450, 200, 100, "#f1f5fd", 16) + box(364, 450, 200, 100, "#f1f5fd", 16) + pill(500, 474, "12", "8.4s")
    + `<g filter="url(#sh2)">${box(780, 96, 46, 46, "url(#blue)", 13)}</g>` + mark(803, 119, 12) + box(808, 124, 34, 24, C.green, 8) + text(825, 141, "8", 15, "#fff", 800, "middle"),

  /* settings with toggles and pins */
  controls: () => card(190, 70, 580, 580, 28) + text(230, 128, "Advanced settings", 26) + text(230, 156, "Pin a setting to keep it on the main view", 15, C.muted, 500)
    + [["Pause while typing", "url(#blue)", true], ["Pause when you scroll", "url(#grape)", true], ["Keep scroll position", "url(#mint)", false], ["Hard reload", "url(#sun)", false], ["Notify on match", "url(#blue)", true]]
      .map(([t, g, on], i) => box(222, 190 + i * 86, 516, 72, "#f6f9fe", 18) + dot(264, 226 + i * 86, 20, g) + text(300, 222 + i * 86, t, 19) + bar(300, 236 + i * 86, 170, "#dde6f4", 9)
        + `<path d="M${618} ${214 + i * 86}l14 14m-4 -18l8 8l-10 4l-6 -6z" fill="${i < 2 ? C.blue : "none"}" stroke="${i < 2 ? C.blue : "#a9b6ca"}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>` + toggle(660, 209 + i * 86, on)).join(""),

  /* restock / price / tickets */
  shopping: () => card(150, 100, 380, 500, 28) + box(182, 132, 316, 220, "url(#blue)", 20) + `<rect x="270" y="186" width="140" height="112" rx="16" fill="#fff" opacity=".95"/><path d="M290 186v-16a50 50 0 0 1 100 0v16" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round"/>`
    + bar(182, 380, 220, "#cfdcf3", 20) + bar(182, 416, 150) + text(182, 486, "$249", 38, C.ink, 800) + box(182, 512, 316, 58, "url(#mint)", 16) + text(340, 549, "In stock", 22, "#fff", 800, "middle")
    + `<g filter="url(#sh2)">${box(560, 150, 270, 84, "#fff", 20)}</g>` + box(580, 172, 130, 40, "#eef1f6", 20) + text(645, 199, "Sold out", 16, "#8a97a9", 700, "middle") + `<path d="M724 192h34m-12 -12l12 12l-12 12" fill="none" stroke="${C.blue}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>` + dot(796, 192, 20, "url(#mint)") + tick(794, 193, 7, "#fff", 4)
    + `<g filter="url(#sh2)">${dot(700, 360, 62, "url(#sun)")}</g><path d="M700 326a26 26 0 0 0 -26 26v18l-10 14h72l-10 -14v-18a26 26 0 0 0 -26 -26zm-10 66a10 10 0 0 0 20 0" fill="#fff"/>` + dot(742, 318, 16, C.red)
    + toast(560, 470, "Back in stock", "Alert sent"),

  /* calendar + status tracker */
  calendar: () => card(110, 110, 420, 460, 28) + box(110, 110, 420, 92, "url(#deep)", 28) + box(110, 170, 420, 32, "url(#deep)", 0) + text(150, 168, "Appointments", 26, "#fff", 800)
    + Array.from({ length: 20 }, (_, i) => { const x = 146 + (i % 5) * 72, y = 234 + Math.floor(i / 5) * 76, hit = i === 12; return box(x, y, 58, 58, hit ? "url(#mint)" : "#f1f5fc", 16) + (hit ? tick(x + 27, y + 30, 8, "#fff", 5) : text(x + 29, y + 37, String(i + 3), 18, "#a3b0c4", 700, "middle")); }).join("")
    + `<g filter="url(#sh)">${box(570, 170, 290, 340, "#fff", 26)}</g>` + text(600, 222, "Status", 22)
    + [["Received", "mint", 1], ["In review", "mint", 1], ["Approved", "blue", 2], ["Sent", "", 0]].map(([t, g, st], i) => (i < 3 ? box(629, 268 + i * 62, 4, 44, st ? "#bfe9d6" : "#e3eaf6", 2) : "")
      + dot(631, 258 + i * 62, 16, st ? `url(#${g})` : "#e3eaf6") + (st === 1 ? tick(629, 259 + i * 62, 5.500, "#fff", 4) : "") + text(664, 265 + i * 62, t, 18, st ? C.ink : "#a3b0c4", st === 2 ? 800 : 600)).join("")
    + toast(520, 560, "Slot available", "Tap to open the tab"),

  /* dashboard screen */
  dashboard: () => card(110, 90, 740, 470, 28) + box(110, 90, 740, 70, "#101b30", 28) + box(110, 130, 740, 30, "#101b30", 0) + text(146, 134, "Live dashboard", 22, "#fff", 800) + dot(790, 126, 9, C.green) + dot(790, 126, 17, "#27bd8140")
    + [0, 1, 2].map((i) => box(146 + i * 232, 186, 208, 96, "#f5f8fe", 18) + text(166 + i * 232, 232, ["1,284", "96%", "42"][i], 30, C.ink, 800) + bar(166 + i * 232, 250, 110, ["url(#blue)", "url(#mint)", "url(#grape)"][i], 10)).join("")
    + box(146, 306, 424, 220, "#f5f8fe", 18) + [70, 120, 96, 160, 132, 184, 150].map((h, i) => box(176 + i * 54, 500 - h, 34, h, i === 5 ? "url(#mint)" : "url(#blue)", 9)).join("")
    + box(594, 306, 220, 220, "#f5f8fe", 18) + `<path d="M620 480l40 -50l38 26l44 -78l44 34" fill="none" stroke="url(#grape)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>` + dot(786, 412, 9, C.violet)
    + `<g filter="url(#sh2)">${dot(800, 590, 54, "url(#blue)")}</g>` + mark(800, 590, 24) + text(730, 600, "every 5 min", 20, C.ink, 800, "end"),

  /* editor + preview */
  devtools: () => card(80, 120, 400, 440, 26) + box(80, 120, 400, 440, "#101b30", 26) + dot(112, 152, 7, "#ff9b8d") + dot(134, 152, 7, "#f7ca68") + dot(156, 152, 7, "#71d39b")
    + [["#7fb0ff", 180, 0], ["#5fe0a8", 240, 30], ["#b79cf5", 200, 30], ["#ffc85c", 150, 60], ["#7fb0ff", 220, 30], ["#5fe0a8", 130, 0], ["#b79cf5", 190, 30], ["#7fb0ff", 160, 0]].map(([c, w, ind], i) => bar(116 + ind, 200 + i * 40, w, c, 12)).join("")
    + browser(540, 150, 350, 420) + box(570, 236, 290, 120, "url(#blue)", 16) + bar(570, 380, 200, "#cfdcf3", 18) + bar(570, 418, 290) + bar(570, 448, 240) + box(570, 490, 130, 46, "url(#mint)", 14)
    + `<g filter="url(#sh2)">${dot(510, 340, 58, "#fff")}</g>` + mark(510, 340, 26, C.blue),

  /* toolbar with pinned icon and popup */
  browsers: () => browser(90, 90, 780, 520) + box(782, 104, 50, 34, "url(#blue)", 10) + mark(807, 121, 10) + [0, 1, 2, 3].map((i) => bar(130, 190 + i * 44, [340, 400, 300, 360][i])).join("") + bar(130, 190, 240, "#cfdcf3", 18)
    + `<g filter="url(#sh)">${box(540, 160, 300, 400, "#fff", 24)}</g>` + logo(564, 184, 50) + text(628, 206, "Free Auto Refresh", 18) + text(628, 228, "No account needed", 13, C.muted, 500)
    + [0, 1, 2].map((i) => box(564 + i * 88, 256, 78, 68, "#f5f8fe", 14) + text(603 + i * 88, 298, ["0", "–", "–"][i], 22, C.ink, 800, "middle")).join("")
    + [0, 1].map((i) => `<rect x="${564 + i * 132}" y="346" width="120" height="46" rx="12" fill="#fff" stroke="${C.line}" stroke-width="2"/>` + text(582 + i * 132, 376, ["30", "60"][i], 18)).join("")
    + box(564, 416, 252, 46, "#f5f8fe", 12) + bar(582, 432, 120) + toggle(742, 422, true) + box(564, 486, 252, 52, "url(#deep)", 14) + text(690, 520, "Start", 19, "#fff", 800, "middle")
    + [["url(#mint)", 150], ["url(#grape)", 250], ["url(#sun)", 350]].map(([g, x]) => `<g filter="url(#sh2)">${dot(x, 500, 40, g)}</g>` + dot(x, 500, 16, "#fff")).join(""),

  /* keyboard shortcut for hard refresh */
  keyboard: () => [["Ctrl", 130, 150], ["Shift", 310, 180], ["R", 520, 130]].map(([k, x, w]) => `<g filter="url(#sh)">${box(x, 250, w, 150, "#fff", 26)}</g>` + box(x, 384, w, 16, "#dfe8f5", 8) + text(x + w / 2, 340, k, 44, C.ink, 800, "middle")).join("")
    + text(292, 338, "+", 40, C.muted, 700, "middle") + text(504, 338, "+", 40, C.muted, 700, "middle")
    + `<g filter="url(#sh)">${dot(780, 325, 100, "url(#deep)")}</g>` + mark(780, 325, 46)
    + [0, 1, 2].map((i) => `<g opacity="${0.45 + i * 0.25}">${box(250 + i * 26, 470 + i * 22, 220, 70, "#fff", 16)}${bar(274 + i * 26, 494 + i * 22, 120)}${bar(274 + i * 26, 516 + i * 22, 80, "#cfdcf3")}</g>`).join("")
    + text(560, 548, "skips the saved copies", 22, C.ink, 700) + `<path d="M520 540h24m-10 -10l10 10l-10 10" fill="none" stroke="${C.blue}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`,

  /* two checklists */
  compare: () => [[110, "Others", false], [510, "Free Auto Refresh", true]].map(([x, title, us]) => card(x, 110, 340, 500, 28, us ? `stroke="${C.blue}" stroke-width="4"` : "")
    + (us ? logo(x + 30, 138, 48) + text(x + 92, 170, title, 20) : dot(x + 54, 162, 24, "#e3eaf6") + text(x + 92, 170, title, 20, "#7b889c"))
    + ["Timer", "Random intervals", "Page watching", "Smart pause", "No account"].map((t, i) => { const ok = us || i === 0; const paid = !us && (i === 1 || i === 2);
      return box(x + 30, 214 + i * 74, 280, 58, "#f6f9fe", 16) + dot(x + 62, 243 + i * 74, 16, ok ? "url(#mint)" : paid ? "url(#sun)" : "#e3eaf6") + (ok ? tick(x + 60, 244 + i * 74, 5.500, "#fff", 4) : paid ? text(x + 62, 250 + i * 74, "$", 17, "#fff", 800, "middle") : "")
        + text(x + 92, 250 + i * 74, t, 17, ok ? C.ink : "#93a0b4", 600); }).join("")).join("")
    + `<g filter="url(#sh2)">${dot(480, 360, 34, "#fff")}</g>` + text(480, 368, "vs", 20, C.blueDark, 800, "middle"),
};

fs.mkdirSync(OUT, { recursive: true });
for (const [name, draw] of Object.entries(art)) fs.writeFileSync(path.join(OUT, `${name}.svg`), wrap(draw()));
console.log(`Drew ${Object.keys(art).length} illustrations in docs/assets/img/`);
