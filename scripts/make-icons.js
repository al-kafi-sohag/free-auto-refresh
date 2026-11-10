// Builds icons/icon-{16,32,48,128}.png from the real logo (docs/assets/logo.png).
// No dependencies: a small PNG decoder, an area-average downscaler and a PNG encoder.
//   npm run build:icons
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const SOURCE = "docs/assets/logo.png";
const SIZES = [16, 32, 48, 128];
const OUT_DIR = "icons";

/* ---------- PNG decode (8-bit RGB/RGBA and palette images, non-interlaced) ---------- */
function decodePng(buf) {
  let offset = 8;
  let ihdr, palette, alpha;
  const idat = [];
  while (offset < buf.length) {
    const len = buf.readUInt32BE(offset);
    const type = buf.toString("ascii", offset + 4, offset + 8);
    const data = buf.subarray(offset + 8, offset + 8 + len);
    if (type === "IHDR") ihdr = data;
    else if (type === "PLTE") palette = data;
    else if (type === "tRNS") alpha = data;
    else if (type === "IDAT") idat.push(data);
    offset += 12 + len;
  }

  const width = ihdr.readUInt32BE(0), height = ihdr.readUInt32BE(4);
  const depth = ihdr[8], colorType = ihdr[9], interlace = ihdr[12];
  const channels = { 2: 3, 3: 1, 6: 4 }[colorType];
  if (!channels || interlace || (colorType !== 3 && depth !== 8)) {
    throw new Error(`Unsupported PNG (color type ${colorType}, depth ${depth}, interlace ${interlace})`);
  }

  const bpp = Math.max(1, (channels * depth) / 8); // bytes per pixel, for filtering
  const stride = Math.ceil((width * channels * depth) / 8);
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const rows = Buffer.alloc(stride * height);

  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    for (let x = 0; x < stride; x++) {
      const cur = raw[y * (stride + 1) + 1 + x];
      const a = x >= bpp ? rows[y * stride + x - bpp] : 0;
      const b = y > 0 ? rows[(y - 1) * stride + x] : 0;
      const c = x >= bpp && y > 0 ? rows[(y - 1) * stride + x - bpp] : 0;
      let pred = 0;
      if (filter === 1) pred = a;
      else if (filter === 2) pred = b;
      else if (filter === 3) pred = (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        pred = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }

      rows[y * stride + x] = (cur + pred) & 0xff;
    }
  }

  const rgba = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 4;
      if (colorType === 3) {
        const bit = x * depth;
        const byte = rows[y * stride + (bit >> 3)];
        const index = (byte >> (8 - depth - (bit & 7))) & ((1 << depth) - 1);
        rgba[o] = palette[index * 3];
        rgba[o + 1] = palette[index * 3 + 1];
        rgba[o + 2] = palette[index * 3 + 2];
        rgba[o + 3] = alpha && index < alpha.length ? alpha[index] : 255;
      } else {
        const i = y * stride + x * channels;
        rgba[o] = rows[i];
        rgba[o + 1] = rows[i + 1];
        rgba[o + 2] = rows[i + 2];
        rgba[o + 3] = channels === 4 ? rows[i + 3] : 255;
      }
    }
  }

  return { width, height, rgba };
}

/* ---------- area-average downscale (alpha-weighted so edges don't darken) ---------- */
function resize(src, size) {
  const out = Buffer.alloc(size * size * 4);
  const sx = src.width / size, sy = src.height / size;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const x0 = x * sx, x1 = (x + 1) * sx, y0 = y * sy, y1 = (y + 1) * sy;
      let r = 0, g = 0, b = 0, a = 0, area = 0;

      for (let py = Math.floor(y0); py < Math.ceil(y1); py++) {
        const hy = Math.min(py + 1, y1) - Math.max(py, y0);
        for (let px = Math.floor(x0); px < Math.ceil(x1); px++) {
          const w = (Math.min(px + 1, x1) - Math.max(px, x0)) * hy;
          const i = (py * src.width + px) * 4;
          const alpha = src.rgba[i + 3] / 255;
          r += src.rgba[i] * alpha * w;
          g += src.rgba[i + 1] * alpha * w;
          b += src.rgba[i + 2] * alpha * w;
          a += alpha * w;
          area += w;
        }
      }

      const o = (y * size + x) * 4;
      if (a > 0) {
        out[o] = Math.round(r / a);
        out[o + 1] = Math.round(g / a);
        out[o + 2] = Math.round(b / a);
      }

      out[o + 3] = Math.round((a / area) * 255);
    }
  }

  return out;
}

/* ---------- PNG encode ---------- */
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

/* ---------- main ---------- */
const file = fs.readFileSync(SOURCE);
const logo = decodePng(file);
fs.mkdirSync(OUT_DIR, { recursive: true });

for (const size of SIZES) {
  const out = path.join(OUT_DIR, `icon-${size}.png`);
  if (size === logo.width && size === logo.height) {
    fs.writeFileSync(out, file); // same size: keep the original pixels untouched
  } else {
    fs.writeFileSync(out, encodePng(size, resize(logo, size)));
  }
}

console.log(`Wrote ${SIZES.length} icons to ${OUT_DIR}/ from ${SOURCE} (${logo.width}x${logo.height})`);
