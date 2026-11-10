import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Function to create an uncompressed or simple deflated PNG with a given color and drawn glyph
function createPng(width, height, bgColor, primaryColor, text) {
  // We will build a true RGBA PNG
  const rowSize = width * 4;
  const rawData = Buffer.alloc((rowSize + 1) * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (rowSize + 1);
    rawData[rowOffset] = 0; // Filter byte: 0 (None)
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      
      // Calculate distance from center for a rounded badge
      const cx = width / 2;
      const cy = height / 2;
      const dx = (x - cx) / (width * 0.45);
      const dy = (y - cy) / (height * 0.45);
      const distSq = dx * dx + dy * dy;

      // Base background
      let r = bgColor[0];
      let g = bgColor[1];
      let b = bgColor[2];
      let a = 255;

      // Inner calendar/room badge
      if (distSq < 1.0) {
        // Gradient badge
        const grad = (y / height);
        r = Math.round(primaryColor[0] * (1 - grad * 0.3));
        g = Math.round(primaryColor[1] * (1 - grad * 0.2) + 20 * grad);
        b = Math.round(primaryColor[2]);
        
        // Add a subtle border
        if (distSq > 0.92) {
          r = Math.min(255, r + 60);
          g = Math.min(255, g + 60);
          b = Math.min(255, b + 60);
        }

        // Draw a central stylized 'R' or calendar icon pattern
        const nx = (x - cx) / (width * 0.28);
        const ny = (y - cy) / (height * 0.28);
        // Calendar top header bar
        if (ny > -0.65 && ny < -0.35 && Math.abs(nx) < 0.6) {
          r = 255; g = 255; b = 255; // White header
        } else if (ny >= -0.35 && ny < 0.65 && Math.abs(nx) < 0.6) {
          // Calendar body
          if (Math.abs(nx) > 0.52 || ny > 0.57) {
            r = 255; g = 255; b = 255; // border
          } else {
            // Little calendar grid dots
            const gridX = Math.floor((nx + 0.45) * 4);
            const gridY = Math.floor((ny + 0.25) * 4);
            if (gridX >= 0 && gridX < 4 && gridY >= 0 && gridY < 3) {
              const subX = ((nx + 0.45) * 4) % 1;
              const subY = ((ny + 0.25) * 4) % 1;
              if (subX > 0.25 && subX < 0.75 && subY > 0.25 && subY < 0.75) {
                r = 255; g = 255; b = 255; // dot
              }
            }
          }
        }
      }

      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type 6: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = createChunk('IHDR', ihdr);

  // IDAT chunk
  const idatChunk = createChunk('IDAT', deflated);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crc = crc32(chunk.subarray(4, 8 + len));
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (c ^ buf[n]);
    for (let k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1));
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

const publicDir = path.resolve('./public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Background: #0F172A (slate-900), Primary: #0284C7 (sky-600)
const icon192 = createPng(192, 192, [15, 23, 42], [2, 132, 199]);
const icon512 = createPng(512, 512, [15, 23, 42], [2, 132, 199]);
const iconApple = createPng(180, 180, [15, 23, 42], [2, 132, 199]);
const iconMaskable = createPng(512, 512, [15, 23, 42], [2, 132, 199]);

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), icon192);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), icon512);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), iconApple);
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), iconMaskable);

// Also create icon.svg
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284C7" />
      <stop offset="100%" stop-color="#0369A1" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#000" flood-opacity="0.3" />
    </filter>
  </defs>
  <rect width="512" height="512" rx="128" fill="#0A0B10" />
  <rect x="56" y="56" width="400" height="400" rx="96" fill="url(#grad)" filter="url(#shadow)" />
  <g transform="translate(136, 136) scale(10)" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
    <path d="M8 14h.01"></path>
    <path d="M12 14h.01"></path>
    <path d="M16 14h.01"></path>
    <path d="M8 18h.01"></path>
    <path d="M12 18h.01"></path>
    <path d="M16 18h.01"></path>
  </g>
</svg>`;
fs.writeFileSync(path.join(publicDir, 'icon.svg'), svg);

console.log('Icons generated successfully.');
