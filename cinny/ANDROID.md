# Building NekoChat for Android

Same app as the web version, packaged as an Android app with push notifications (FCM).

## Prerequisites

- **Node.js** 18+ (includes npm)
- **Android Studio** (with Android SDK, API 24+)
- **JDK** 17 (Android Studio usually bundles this)

## First-time setup

### 1. Install dependencies

From the `cinny` directory:

```bash
npm install
```

### 2. Add the Android platform (once)

```bash
npm run build
npx cap add android
```

This creates the `android/` folder. After that you only need to build and sync.

## Build and run

### Option A: One-command release APK (recommended)

From the **repo root** (one level above `cinny`):

- **Windows:** run `build-android.bat` in Command Prompt (or double-click).
- **Linux/macOS:** `./build-android.sh`

The script builds the web app, syncs to Android, runs `gradlew assembleRelease`, and copies the APK to **`NekoChat-release.apk`** in the repo root. No Android Studio needed. The release build is signed with the **debug keystore** so it’s installable for testing; for Play Store you’d use a proper release keystore (e.g. Build → Generate Signed Bundle in Android Studio).

### Option B: From the cinny directory

```bash
cd cinny
npm install
npm run build:android
npm run android
```

Then in Android Studio: pick a device or emulator and click Run.

### Option C: Build, sync, and run from CLI

```bash
cd cinny
npm run android:run
```

(Select device/emulator when prompted.)

### Option D: Manual

```bash
cd cinny
npm run build
npx cap sync android
npx cap open android
```

## Push notifications (FCM)

To get push notifications on Android you need Firebase Cloud Messaging.

### 1. Create a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Add a project (or use an existing one).
3. Add an **Android app** with package name: **`org.nekochat.cinny`** (must match `appId` in `capacitor.config.ts`).
4. Download **`google-services.json`** and place it at:
   ```
   android/app/google-services.json
   ```
5. In Firebase: **Project settings → Cloud Messaging**. Enable the **Cloud Messaging API** if needed. You’ll use the **Server key** (or a newer FCM v1 credential) on your push gateway.

### 2. Matrix push gateway (required for notifications to arrive)

For Matrix messages to trigger FCM pushes you need a push gateway that sends to FCM, e.g.:

- [Sygnal](https://github.com/matrix-org/sygnal) (Matrix’s reference gateway)
- Or a compatible gateway that accepts FCM credentials

Configure your Matrix homeserver to use that gateway (same origin or a dedicated Sygnal URL). The Android app **automatically registers** the FCM token with your homeserver as an HTTP pusher when you're logged in, using `{homeserver}/_matrix/push/v1/notify`. If your gateway uses a different URL, change it in `AndroidPushRegistration` in `ClientNonUIFeatures.tsx`.

### 3. Notification tap (deep link)

When the user taps a notification, the app looks for `room_id` in the notification data and navigates to `#/room/{roomId}`. Your push gateway should send this in the FCM payload so notifications open the right room.

## Release build (signed APK / AAB)

1. In Android Studio: **Build → Generate Signed Bundle / APK**.
2. Create or use a keystore, then build the release variant.
3. Or use the [Capacitor Android docs](https://capacitorjs.com/docs/android/build) for command-line signing.

## App icon (launcher)

The Android app uses the same icon as the web app. After you add the Android platform (`android/` exists):

1. Put your app icon as a **square PNG** at `cinny/public/nekochat-icon-source.png` (any size is fine—512, 1024, 2048, etc.—the script resizes as needed).
2. From `cinny/` run: **`node scripts/generate-icons.js`**
3. That updates web icons and **Android native launcher icons** in `android/app/src/main/res/mipmap-*`.
4. Rebuild the APK in Android Studio (or `gradlew assembleDebug` / `assembleRelease`).

If you don’t have a source PNG yet, add one and run the script; otherwise the default Capacitor icon stays. The build script (build-android.bat / build-android.sh) runs the icon generator automatically; if nekochat-icon-source.png is missing it uses android-chrome-512x512.png when present.

## Troubleshooting

- **“App not installed as package appears to be invalid”**: Usually a **signing mismatch**: you’re installing an APK signed with a different key than the app already on the device. **Fix:** On the device, **uninstall the existing NekoChat app** (Settings → Apps → NekoChat → Uninstall), then install the new APK. If you switch between debug and release builds, uninstall before installing the other.
- **“SDK location not found”**: Set `ANDROID_HOME` (or `ANDROID_SDK_ROOT`) to your Android SDK path (e.g. inside Android Studio’s installation).
- **“compatible with Java 11” / “consumer needed … Java 8”**: The Android Gradle Plugin 8.x needs **Java 11 or 17**. Gradle is currently using Java 8. Fix:
  1. Install JDK 11 or 17 if needed (Android Studio often bundles one).
  2. Point Gradle to it: set **JAVA_HOME** to the JDK 11/17 root (e.g. `C:\Program Files\Android\Android Studio\jbr` on Windows), then run the build again.
  3. Or in `cinny/android/gradle.properties`, uncomment and set `org.gradle.java.home` to that same path (use double backslashes on Windows).
- **WebView blank**: Run `npm run build -- --mode android` then `npx cap sync android` so `android/app/src/main/assets/public` has the latest web build.
- **Push not received**: (1) **`google-services.json`** must be in `android/app/` (from Firebase Console; without it FCM does not initialise and the build log will say "Push Notifications won't work"). (2) Package name must be `org.nekochat.cinny`. (3) On Android 13+ the app will request notification permission; if the user denies it, notifications won't show. (4) The app registers the device with the Matrix homeserver automatically when you're logged in; your **homeserver must use a push gateway** (e.g. Sygnal) configured with your Firebase/FCM credentials so it can send notifications to FCM.
- **“Unable to delete directory” on `:app:clean` (Windows)**: Common on network drives (e.g. `N:\`) or when another process has `cinny/android/app/build` open. The one-command script (**`build-android.bat`**) no longer runs `clean`; it only runs `assembleRelease`, so the build completes without deleting that folder. For a full clean build when needed: close other apps/terminals using that path, then from `cinny/android` run `gradlew.bat --stop`, then `gradlew.bat clean assembleRelease`.
- **Media (images, thumbnails, files) not loading on Android**: The app’s service worker adds your auth token to Matrix media requests. It now intercepts both the older `/_matrix/media/r0/...` and newer `/_matrix/client/v1/media/...` paths. Rebuild the app so the updated `sw.js` is included. If media still fails, ensure your homeserver allows the app origin in CORS and that you’re logged in (token in localStorage).
