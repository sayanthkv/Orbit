import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.resolve(__dirname, '../public');
const sourceSvgPath = path.resolve(publicDir, 'logo.svg');

if (!fs.existsSync(sourceSvgPath)) {
  console.error(`Source SVG not found at ${sourceSvgPath}`);
  process.exit(1);
}

const svgBuffer = fs.readFileSync(sourceSvgPath);

// SVG designed specifically for maskable icons (full bleed background with 80% safe zone)
const maskableSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#09090b" />
      <stop offset="100%" stop-color="#141418" />
    </linearGradient>
    <linearGradient id="planetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34d399" />
      <stop offset="60%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#047857" />
    </linearGradient>
    <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.95" />
      <stop offset="50%" stop-color="#06b6d4" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#10b981" stop-opacity="0.25" />
    </linearGradient>
  </defs>

  <!-- Full-bleed background for maskable safe zones -->
  <rect width="512" height="512" fill="url(#bgGrad)" />

  <!-- Centered elements scaled down to 78% for guaranteed safe-zone inclusion -->
  <g transform="translate(256, 256) scale(0.78) translate(-256, -256)">
    <circle cx="256" cy="256" r="176" fill="none" stroke="#10b981" stroke-opacity="0.15" stroke-width="16" />
    <circle cx="256" cy="256" r="176" fill="none" stroke="url(#ringGrad)" stroke-width="14" stroke-dasharray="720 280" stroke-linecap="round" transform="rotate(-30 256 256)" />
    <circle cx="256" cy="256" r="88" fill="url(#planetGrad)" />
    <circle cx="230" cy="230" r="32" fill="#ffffff" fill-opacity="0.2" />
    <circle cx="396" cy="180" r="28" fill="#38bdf8" />
    <circle cx="396" cy="180" r="14" fill="#ffffff" fill-opacity="0.85" />
    <circle cx="116" cy="332" r="14" fill="#34d399" fill-opacity="0.9" />
  </g>
</svg>
`;

async function generateIcons() {
  console.log('🌌 Generating Orbit PWA icons from vector SVG...');

  // 1. Standard 512x512
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.resolve(publicDir, 'pwa-512x512.png'));
  console.log('✓ Created pwa-512x512.png');

  // 2. Standard 192x192
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.resolve(publicDir, 'pwa-192x192.png'));
  console.log('✓ Created pwa-192x192.png');

  // 3. Apple Touch Icon (180x180)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.resolve(publicDir, 'apple-touch-icon-180x180.png'));
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.resolve(publicDir, 'apple-touch-icon.png'));
  console.log('✓ Created apple-touch-icon.png & apple-touch-icon-180x180.png');

  // 4. Maskable 512x512 with safe-zone margin
  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png()
    .toFile(path.resolve(publicDir, 'maskable-icon-512x512.png'));
  console.log('✓ Created maskable-icon-512x512.png');

  // 5. Favicon 64x64 PNG
  await sharp(svgBuffer)
    .resize(64, 64)
    .png()
    .toFile(path.resolve(publicDir, 'favicon.png'));
  console.log('✓ Created favicon.png');

  console.log('🎉 All PWA icons generated successfully!');
}

generateIcons().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
