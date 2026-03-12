/**
 * Generates favicon, Android Chrome, Apple Touch, and Android native launcher icons.
 * Source image: image.png in the repo root (one level above cinny/).
 * Run from cinny/: node scripts/generate-icons.js
 */
import sharp from 'sharp';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import toIco from 'to-ico';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const repoRoot = join(root, '..');
const publicDir = join(root, 'public');
const androidDir = join(publicDir, 'android');
const appleDir = join(publicDir, 'res', 'apple');
const androidResDir = join(root, 'android', 'app', 'src', 'main', 'res');

// Primary source: image.png at repo root. Fallbacks for safety.
const SOURCE =
  existsSync(join(repoRoot, 'image.png')) ? join(repoRoot, 'image.png') :
  existsSync(join(publicDir, 'nekochat-icon-source.png')) ? join(publicDir, 'nekochat-icon-source.png') :
  join(publicDir, 'android-chrome-512x512.png');

console.log('Icon source:', SOURCE);

const ANDROID_SIZES = [36, 48, 72, 96, 144, 192, 256, 384, 512];
const APPLE_SIZES = [57, 60, 72, 76, 114, 120, 144, 152, 167, 180];
const FAVICON_SIZES = [16, 32, 48];

const ANDROID_MIPMAP = [
  { dir: 'mipmap-mdpi',    launcher: 48,  foreground: 108 },
  { dir: 'mipmap-hdpi',    launcher: 72,  foreground: 162 },
  { dir: 'mipmap-xhdpi',   launcher: 96,  foreground: 216 },
  { dir: 'mipmap-xxhdpi',  launcher: 144, foreground: 324 },
  { dir: 'mipmap-xxxhdpi', launcher: 192, foreground: 432 },
];

function roundedMask(size) {
  const r = Math.round(size * 0.22);
  return Buffer.from(
    `<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="white"/></svg>`
  );
}

function circleMask(size) {
  const r = Math.floor(size / 2);
  return Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${r}" cy="${r}" r="${r}" fill="white"/></svg>`
  );
}

async function makeRounded(src, size, dest) {
  await sharp(src)
    .resize(size, size, { fit: 'cover', position: 'top' })
    .composite([{ input: roundedMask(size), blend: 'dest-in' }])
    .png()
    .toFile(dest);
}

async function makeCircle(src, size, dest) {
  await sharp(src)
    .resize(size, size, { fit: 'cover', position: 'top' })
    .composite([{ input: circleMask(size), blend: 'dest-in' }])
    .png()
    .toFile(dest);
}

async function makeForeground(src, iconSize, fgSize, dest) {
  const pad = Math.floor((fgSize - iconSize) / 2);
  await sharp(src)
    .resize(iconSize, iconSize, { fit: 'cover', position: 'top' })
    .extend({
      top: pad,
      bottom: fgSize - iconSize - pad,
      left: pad,
      right: fgSize - iconSize - pad,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(dest);
}

async function main() {
  if (!existsSync(SOURCE)) {
    console.error('No icon source found.');
    process.exit(1);
  }

  [androidDir, appleDir].forEach((d) => {
    if (!existsSync(d)) mkdirSync(d, { recursive: true });
  });

  // Web android-chrome icons (rounded rect)
  for (const size of ANDROID_SIZES) {
    const out = join(androidDir, `android-chrome-${size}x${size}.png`);
    await makeRounded(SOURCE, size, out);
    console.log('Wrote', out);
  }

  // Also write the root-level 512 used by manifest
  await makeRounded(SOURCE, 512, join(publicDir, 'android-chrome-512x512.png'));

  // Apple touch icons (rounded rect)
  for (const size of APPLE_SIZES) {
    const out = join(appleDir, `apple-touch-icon-${size}x${size}.png`);
    await makeRounded(SOURCE, size, out);
    console.log('Wrote', out);
  }

  // favicon-64.png (used by favicon.svg)
  await makeRounded(SOURCE, 64, join(publicDir, 'favicon-64.png'));
  console.log('Wrote favicon-64.png');

  // favicon.ico
  const icoBuffers = await Promise.all(
    FAVICON_SIZES.map((size) =>
      sharp(SOURCE).resize(size, size).png().toBuffer()
    )
  );
  const ico = await toIco(icoBuffers);
  writeFileSync(join(publicDir, 'favicon.ico'), ico);
  console.log('Wrote favicon.ico');

  // Android native launcher icons
  if (existsSync(androidResDir)) {
    for (const { dir: mipmapDir, launcher, foreground } of ANDROID_MIPMAP) {
      const outDir = join(androidResDir, mipmapDir);
      if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
      await makeRounded(SOURCE, launcher, join(outDir, 'ic_launcher.png'));
      await makeCircle(SOURCE, launcher, join(outDir, 'ic_launcher_round.png'));
      await makeForeground(SOURCE, launcher, foreground, join(outDir, 'ic_launcher_foreground.png'));
      console.log('Wrote Android native', mipmapDir);
    }
  }

  console.log('\nAll icons generated from', SOURCE);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
