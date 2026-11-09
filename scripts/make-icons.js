// Renders icons/icon-{16,32,48,128}.png with no dependencies.
// The shape mirrors drawIcon() in background.js, so the manifest icons
// match the toolbar icon the extension draws at runtime.
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const SIZES = [16, 32, 48, 128];
const OUT_DIR = "icons";
const SS = 8; // supersampling per axis, for smooth edges

const BG = [0x4f, 0x46, 0xe5];
const FG = [0xff, 0xff, 0xff];

function shapes(size) {
  const cx = size / 2, cy = size / 2;
  const R = size * 0.27;
  const a0 = Math.PI * 0.15, a1 = Math.PI * 1.65;
  const half = (size * 0.11) / 2;
  const radius = size * 0.24;

  const px = cx + R * Math.cos(a1), py = cy + R * Math.sin(a1);
  const tx = -Math.sin(a1), ty = Math.cos(a1);
  const nx = Math.cos(a1), ny = Math.sin(a1);
  const h = size * 0.2, w = size * 0.17;
  const tri = [
    [px + tx * h, py + ty * h],
    [px + nx * w, py + ny * w],
    [px - nx * w, py - ny * w],
  ];
  const caps = [
    [cx + R * Math.cos(a0), cy + R * Math.sin(a0)],
    [px, py],
  ];

  const inRoundRect = (x, y) => {
    if (x < 0 || y < 0 || x > size || y > size) return false;
    const dx = Math.max(radius - x, 0, x - (size - radius));
    const dy = Math.max(radius - y, 0, y - (size - radius));
    return dx * dx + dy * dy <= radius * radius;
  };

  const inArc = (x, y) => {
    for (const [ex, ey] of caps) {
      if ((x - ex) ** 2 + (y - ey) ** 2 <= half * half) return true;
    }

    const dx = x - cx, dy = y - cy;
    if (Math.abs(Math.hypot(dx, dy) - R) > half) return false;
    let a = Math.atan2(dy, dx);
    if (a < 0) a += Math.PI * 2;
    return a >= a0 && a <= a1;
  };

  const side = (p, q, x, y) => (q[0] - p[0]) * (y - p[1]) - (q[1] - p[1]) * (x - p[0]);
  const inTriangle = (x, y) => {
    const d1 = side(tri[0], tri[1], x, y);
    const d2 = side(tri[1], tri[2], x, y);
    const d3 = side(tri[2], tri[0], x, y);
    const neg = d1 < 0 || d2 < 0 || d3 < 0;
    const pos = d1 > 0 || d2 > 0 || d3 > 0;
    return !(neg && pos);
  };

  return { inRoundRect, inFg: (x, y) => inArc(x, y) || inTriangle(x, y) };
}

function render(size) {
  const { inRoundRect, inFg } = shapes(size);
  const rgba = Buffer.alloc(size * size * 4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let fg = 0, bg = 0;
      for (let j = 0; j < SS; j++) {
        for (let i = 0; i < SS; i++) {
          const sx = x + (i + 0.5) / SS, sy = y + (j + 0.5) / SS;
          if (!inRoundRect(sx, sy)) continue;
          if (inFg(sx, sy)) fg++;
          else bg++;
        }
      }

      const cover = fg + bg;
      const o = (y * size + x) * 4;
      if (!cover) continue;
      for (let c = 0; c < 3; c++) {
        rgba[o + c] = Math.round((FG[c] * fg + BG[c] * bg) / cover);
      }
      rgba[o + 3] = Math.round((cover / (SS * SS)) * 255);
    }
  }

  return rgba;
}

/* ---------- minimal PNG encoder ---------- */
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA

  const row = size * 4;
  const raw = Buffer.alloc((row + 1) * size);
  for (let y = 0; y < size; y++) {
    rgba.copy(raw, y * (row + 1) + 1, y * row, (y + 1) * row);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

fs.mkdirSync(OUT_DIR, { recursive: true });
for (const size of SIZES) {
  fs.writeFileSync(path.join(OUT_DIR, `icon-${size}.png`), encodePng(size, render(size)));
}

console.log(`Wrote ${SIZES.length} icons to ${OUT_DIR}/`);
