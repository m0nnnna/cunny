/**
 * Generates favicon, Android Chrome, Apple Touch, and Android native launcher icons from a source PNG.
 * Place your app icon (any size, square; 512×512 or larger recommended) at: cinny/public/nekochat-icon-source.png
 * Then run from cinny/: node scripts/generate-icons.js
 * The script resizes as needed, so 1024×1024, 2048×2048, etc. are all fine.
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
const androidResDir = join(root, 'android', 'app', 'src', 'main', 'res');

const SOURCE_PRIMARY = join(publicDir, 'nekochat-icon-source.png');
const SOURCE_FALLBACK = join(publicDir, 'android-chrome-512x512.png');
const SOURCE = existsSync(SOURCE_PRIMARY) ? SOURCE_PRIMARY : SOURCE_FALLBACK;

const ANDROID_SIZES = [36, 48, 72, 96, 144, 192, 256, 384, 512];
const APPLE_SIZES = [57, 60, 72, 76, 114, 120, 144, 152, 167, 180];
const FAVICON_SIZES = [16, 32, 48];

// Android native: mipmap-*dpi launcher icon (dp → px: mdpi 1:1, hdpi 1.5, xhdpi 2, xxhdpi 3, xxxhdpi 4)
// Adaptive icon foreground is 108dp so: mdpi 108, hdpi 162, xhdpi 216, xxhdpi 324, xxxhdpi 432
const ANDROID_MIPMAP = [
  { dir: 'mipmap-mdpi', launcher: 48, foreground: 108 },
  { dir: 'mipmap-hdpi', launcher: 72, foreground: 162 },
  { dir: 'mipmap-xhdpi', launcher: 96, foreground: 216 },
  { dir: 'mipmap-xxhdpi', launcher: 144, foreground: 324 },
  { dir: 'mipmap-xxxhdpi', launcher: 192, foreground: 432 },
];

async function main() {
  if (!existsSync(SOURCE)) {
    console.warn(
      'No icon source found. Add nekochat-icon-source.png (or android-chrome-512x512.png) in public/ for a custom launcher icon.'
    );
    process.exit(0);
  }
  if (SOURCE === SOURCE_FALLBACK) {
    console.log('Using fallback icon source: android-chrome-512x512.png');
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

  // Android native launcher icons (only if android/ exists, e.g. after cap add android)
  if (existsSync(androidResDir)) {
    for (const { dir: mipmapDir, launcher, foreground } of ANDROID_MIPMAP) {
      const outDir = join(androidResDir, mipmapDir);
      if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
      const launcherPath = join(outDir, 'ic_launcher.png');
      const roundPath = join(outDir, 'ic_launcher_round.png');
      const foregroundPath = join(outDir, 'ic_launcher_foreground.png');
      await sharp(buffer).resize(launcher, launcher).png().toFile(launcherPath);
      await sharp(buffer).resize(launcher, launcher).png().toFile(roundPath);
      await sharp(buffer).resize(foreground, foreground).png().toFile(foregroundPath);
      console.log('Wrote Android native', mipmapDir);
    }
  }

  console.log('Done. Favicon, Android (web + native), and Apple icons generated.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
