/**
 * Generates favicon, Android Chrome, and Apple Touch icons from a source PNG.
 * Place a 512×512 (or larger) source at: cinny/public/nekochat-icon-source.png
 * Then run from cinny/: node scripts/generate-icons.js
 */
import sharp from 'sharp';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import toIco from 'to-ico';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const publicDir = join(root, 'public');
const androidDir = join(publicDir, 'android');
const appleDir = join(publicDir, 'res', 'apple');

const SOURCE = join(publicDir, 'nekochat-icon-source.png');

const ANDROID_SIZES = [36, 48, 72, 96, 144, 192, 256, 384, 512];
const APPLE_SIZES = [57, 60, 72, 76, 114, 120, 144, 152, 167, 180];
const FAVICON_SIZES = [16, 32, 48];

async function main() {
  if (!existsSync(SOURCE)) {
    console.error('Source image not found at:', SOURCE);
    console.error('Please add a 512×512 (or larger) PNG as nekochat-icon-source.png in public/');
    process.exit(1);
  }

  [androidDir, appleDir].forEach((d) => {
    if (!existsSync(d)) mkdirSync(d, { recursive: true });
  });

  const buffer = await sharp(SOURCE).ensureAlpha().png().toBuffer();

  for (const size of ANDROID_SIZES) {
    const out = join(androidDir, `android-chrome-${size}x${size}.png`);
    await sharp(buffer).resize(size, size).png().toFile(out);
    console.log('Wrote', out);
  }

  for (const size of APPLE_SIZES) {
    const out = join(appleDir, `apple-touch-icon-${size}x${size}.png`);
    await sharp(buffer).resize(size, size).png().toFile(out);
    console.log('Wrote', out);
  }

  const icoBuffers = await Promise.all(
    FAVICON_SIZES.map((size) =>
      sharp(buffer).resize(size, size).png().toBuffer()
    )
  );
  const ico = await toIco(icoBuffers);
  const icoPath = join(publicDir, 'favicon.ico');
  writeFileSync(icoPath, ico);
  console.log('Wrote', icoPath);

  console.log('Done. Favicon, Android, and Apple icons generated.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
