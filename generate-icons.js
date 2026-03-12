#!/usr/bin/env node
/**
 * Generates all Android + Apple PNG icons from image.png (the neko girl).
 * Also writes a favicon.svg that embeds the image inside a rounded square.
 *
 * Usage:  node generate-icons.js
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SRC_IMG = path.join(__dirname, 'image.png');

const ANDROID_SIZES = [36, 48, 72, 96, 144, 192, 256, 384, 512];
const APPLE_SIZES   = [57, 60, 72, 76, 114, 120, 144, 152, 167, 180];

const ANDROID_DIR_1 = path.join(__dirname, 'cinny/public/android');
const ANDROID_DIR_2 = path.join(__dirname, 'cinny/public/res/android');
const APPLE_DIR     = path.join(__dirname, 'cinny/public/res/apple');
const ROOT_DIR      = path.join(__dirname, 'cinny/public');

// Renders the source image into a rounded-square PNG at the given size.
// Uses a circular/rounded mask so it looks like an app icon.
async function makeIcon(size, dest) {
  const r = Math.round(size * 0.22); // ~22% corner radius — matches the SVG rx=14/64 ratio

  // Build a rounded-rect SVG mask at this size
  const mask = Buffer.from(
    `<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="white"/></svg>`
  );

  await sharp(SRC_IMG)
    .resize(size, size, { fit: 'cover', position: 'top' })
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toFile(dest);

  console.log(`  ✓  ${dest.replace(__dirname, '.')}`);
}

async function main() {
  console.log('Source image:', SRC_IMG);

  for (const s of ANDROID_SIZES) {
    const name = `android-chrome-${s}x${s}.png`;
    await makeIcon(s, path.join(ANDROID_DIR_1, name));
    await makeIcon(s, path.join(ANDROID_DIR_2, name));
  }

  await makeIcon(512, path.join(ROOT_DIR, 'android-chrome-512x512.png'));

  for (const s of APPLE_SIZES) {
    const name = `apple-touch-icon-${s}x${s}.png`;
    await makeIcon(s, path.join(APPLE_DIR, name));
  }

  // Also write a 64x64 version used as favicon.png fallback
  await makeIcon(64, path.join(ROOT_DIR, 'favicon-64.png'));

  console.log('\nAll icons regenerated from image.png.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
