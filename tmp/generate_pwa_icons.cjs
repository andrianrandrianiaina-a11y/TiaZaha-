const fs = require('fs');
const zlib = require('zlib');

function createPNG(width, height, drawFn) {
  const lineLength = 1 + width * 4;
  const rawData = Buffer.alloc(lineLength * height);

  for (let y = 0; y < height; y++) {
    const lineStart = y * lineLength;
    rawData[lineStart] = 0; // Filter None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawFn(x, y, width, height);
      const pixelStart = lineStart + 1 + x * 4;
      rawData[pixelStart] = r;
      rawData[pixelStart + 1] = g;
      rawData[pixelStart + 2] = b;
      rawData[pixelStart + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  const crcTable = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[i] = c;
  }
  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const typeAndData = Buffer.concat([typeBuf, data]);
    crcBuf.writeUInt32BE(crc32(typeAndData), 0);
    return Buffer.concat([len, typeAndData, crcBuf]);
  }

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    sig,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', deflated),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

function renderTiaZahaIcon(x, y, w, h, isMaskable = false) {
  const cx = w / 2, cy = h / 2;
  const dist = Math.hypot(x - cx, y - cy);
  const maxR = isMaskable ? w * 0.38 : w * 0.46;

  // Background
  if (isMaskable) {
    if (dist > maxR) return [9, 9, 11, 255]; // solid dark bleed
  } else {
    if (dist > maxR) return [0, 0, 0, 0]; // transparent outside circle
  }

  // Outer Gold border
  if (dist > maxR - w * 0.03) {
    return [245, 158, 11, 255]; // Gold #f59e0b
  }
  // Red border
  if (dist > maxR - w * 0.07) {
    return [220, 38, 38, 255]; // Red #dc2626
  }
  // Deep dark inner field
  if (dist > maxR - w * 0.12) {
    return [15, 23, 42, 255]; // #0f172a
  }

  // Center crest - red gradient with soccer ball motif
  const normX = (x - cx) / (maxR * 0.85);
  const normY = (y - cy) / (maxR * 0.85);
  const innerDist = Math.hypot(normX, normY);

  if (innerDist < 0.35) {
    // Center emblem (Gold star/ball)
    return [251, 191, 36, 255]; // #fbbf24
  } else if (innerDist < 0.75) {
    // Red core
    const blend = Math.floor(220 - innerDist * 60);
    return [blend, 38, 38, 255];
  }

  return [17, 24, 39, 255];
}

const pwa192 = createPNG(192, 192, (x, y, w, h) => renderTiaZahaIcon(x, y, w, h, false));
const pwa512 = createPNG(512, 512, (x, y, w, h) => renderTiaZahaIcon(x, y, w, h, false));
const pwaMaskable = createPNG(512, 512, (x, y, w, h) => renderTiaZahaIcon(x, y, w, h, true));
const appleTouch = createPNG(180, 180, (x, y, w, h) => renderTiaZahaIcon(x, y, w, h, true));

fs.writeFileSync('public/pwa-192x192.png', pwa192);
fs.writeFileSync('public/pwa-512x512.png', pwa512);
fs.writeFileSync('public/pwa-maskable-512x512.png', pwaMaskable);
fs.writeFileSync('public/apple-touch-icon.png', appleTouch);

// Copy to dist/
if (!fs.existsSync('dist')) fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync('dist/pwa-192x192.png', pwa192);
fs.writeFileSync('dist/pwa-512x512.png', pwa512);
fs.writeFileSync('dist/pwa-maskable-512x512.png', pwaMaskable);
fs.writeFileSync('dist/apple-touch-icon.png', appleTouch);

console.log('All PWA and Apple icons generated and copied successfully!');
