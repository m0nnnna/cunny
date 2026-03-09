@echo off
REM Build web app, sync to Android, and produce a release APK. Run from repo root.
setlocal
set ROOT=%~dp0
cd /d "%ROOT%cinny"
call npm install
call npm run build -- --mode android
if not exist "android\app" (
  echo Adding Android platform...
  call npx cap add android
)
REM Generate launcher icons (uses nekochat-icon-source.png or android-chrome-512x512.png if present)
call node scripts/generate-icons.js
call npx cap sync android
cd android
REM Android Gradle Plugin 8.x requires Java 11+. Use Android Studio's JBR if present and JAVA_HOME not already set.
if not defined JAVA_HOME (
  if exist "C:\Program Files\Android\Android Studio\jbr\bin\java.exe" (
    set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
    echo Using Java from Android Studio: %JAVA_HOME%
  )
)
REM Skip 'clean' to avoid "Unable to delete directory" on Windows (network drives / file locks).
REM Run 'gradlew.bat clean assembleRelease' manually when you need a full clean.
call gradlew.bat assembleRelease
cd ..
set APK_DEST=%ROOT%NekoChat-release.apk
if exist "android\app\build\outputs\apk\release\app-release.apk" (
  copy /Y "android\app\build\outputs\apk\release\app-release.apk" "%APK_DEST%" >nul
  echo.
  echo Release APK: %APK_DEST%
) else (
  echo Build may have failed. Check output above.
)
endlocal
