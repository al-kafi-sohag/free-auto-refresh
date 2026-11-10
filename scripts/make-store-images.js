// Renders the Chrome Web Store images into store-images/ as 24-bit PNGs (no alpha):
//   screenshot-1..5.png  1280x800     promo-small.png  440x280     promo-marquee.png  1400x560
// Each image is a page (dev/store.html?shot=...) captured by headless Chrome.
// Needs the preview server:  npm run preview      then:  node scripts/make-store-images.js
const { spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const zlib = require("zlib");

const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const OUT = path.resolve("store-images");
const SHOTS = [
  ...[1, 2, 3, 4, 5].map((n) => ({ shot: n, file: `screenshot-${n}.png`, w: 1280, h: 800 })),
  { shot: "small", file: "promo-small.png", w: 440, h: 280 },
  { shot: "marquee", file: "promo-marquee.png", w: 1400, h: 560 },
];

/* ---------- PNG: drop the alpha channel ---------- */
const CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const len = Buffer.alloc(4), crc = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function toRgbPng(buf) {
  let off = 8, ihdr;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off), type = buf.toString("ascii", off + 4, off + 8);
    if (type === "IHDR") ihdr = Buffer.from(buf.subarray(off + 8, off + 8 + len));
    if (type === "IDAT") idat.push(buf.subarray(off + 8, off + 8 + len));
    off += 12 + len;
  }

  const w = ihdr.readUInt32BE(0), h = ihdr.readUInt32BE(4), ch = { 2: 3, 6: 4 }[ihdr[9]];
  if (!ch || ihdr[8] !== 8 || ihdr[12]) throw new Error("unexpected PNG format from Chrome");
  if (ch === 3) return buf; // already 24-bit

  const stride = w * 4, raw = zlib.inflateSync(Buffer.concat(idat));
  const px = Buffer.alloc(stride * h);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)];
    for (let x = 0; x < stride; x++) {
      const a = x >= 4 ? px[y * stride + x - 4] : 0;
      const b = y ? px[(y - 1) * stride + x] : 0;
      const c = x >= 4 && y ? px[(y - 1) * stride + x - 4] : 0;
      let p = 0;
      if (f === 1) p = a;
      else if (f === 2) p = b;
      else if (f === 3) p = (a + b) >> 1;
      else if (f === 4) {
        const q = a + b - c, pa = Math.abs(q - a), pb = Math.abs(q - b), pc = Math.abs(q - c);
        p = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }

      px[y * stride + x] = (raw[y * (stride + 1) + 1 + x] + p) & 0xff;
    }
  }

  const rgb = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) px.copy(rgb, y * (w * 3 + 1) + 1 + x * 3, y * stride + x * 4, y * stride + x * 4 + 3);
  }

  ihdr[9] = 2; // RGB
  return Buffer.concat([buf.subarray(0, 8), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(rgb, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}

/* ---------- capture ---------- */
fs.mkdirSync(OUT, { recursive: true });
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "far-store-"));

// Optional: only the shots named on the command line, e.g.  node scripts/make-store-images.js 3 small
const only = process.argv.slice(2);

for (const { shot, file, w, h } of SHOTS.filter((s) => !only.length || only.includes(String(s.shot)))) {
  const out = path.join(OUT, file);
  spawnSync(CHROME, [
    "--headless=new", `--user-data-dir=${profile}`, "--no-first-run", "--hide-scrollbars",
    "--force-device-scale-factor=1", `--window-size=${w},${h}`, "--virtual-time-budget=9000",
    `--screenshot=${out}`, `http://localhost:4173/dev/store.html?shot=${shot}`,
  ], { stdio: "ignore", timeout: 60000 });

  if (!fs.existsSync(out)) {
    console.error("no image for", file, "(is `npm run preview` running?)");
    process.exitCode = 1;
    continue;
  }

  const png = toRgbPng(fs.readFileSync(out));
  fs.writeFileSync(out, png);
  console.log(file, `${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`, "color type", png[25], `${Math.round(png.length / 1024)} KB`);
}

try {
  fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
} catch (e) {}
