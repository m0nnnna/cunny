#!/usr/bin/env bash
# Build web app, sync to Android, and produce a release APK. Run from repo root.
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/cinny"
npm install
npm run build -- --mode android
if [ ! -d "android/app" ]; then
  echo "Adding Android platform..."
  npx cap add android
fi
npx cap sync android
cd android
./gradlew clean assembleRelease
cd ..
APK_SRC="$SCRIPT_DIR/cinny/android/app/build/outputs/apk/release/app-release.apk"
APK_DEST="$SCRIPT_DIR/NekoChat-release.apk"
if [ -f "$APK_SRC" ]; then
  cp -f "$APK_SRC" "$APK_DEST"
  echo ""
  echo "Release APK: $APK_DEST"
else
  echo "Build may have failed. Check output above."
fi
