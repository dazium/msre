# MSRE Roofing CRM — Android Build Guide

The roofing CRM is configured as a **Capacitor Android application** with application ID `ca.msre.roofingcrm`. The Android wrapper is located in `android/`, while the web interface continues to live in `client/` and is copied into the app during every synchronization.

## Day-to-day development

Install project dependencies, then synchronize the current web build into the Android wrapper:

```bash
pnpm install
pnpm run android:sync
pnpm run android:open
```

The final command opens `android/` in Android Studio. Use either an Android emulator or a USB-connected phone with developer mode and USB debugging enabled. Android Studio handles the normal JDK, Android SDK, emulator, and device-tool setup.

The CRM automatically uses the deployed endpoint `https://roofcrm-lzqinayu.manus.space` when running inside a Capacitor Android WebView. This can be overridden for a different environment during a web build with `VITE_API_URL`. Browser deployments retain same-origin API calls.

## Field-device features

The Android app requests camera permission only after the user selects **Take Photo** in a project photo uploader. The existing browser file picker remains available as a fallback.

The **Use Current GPS Location** control in Route Optimization uses Android’s native location service in the packaged app. In a browser it uses `navigator.geolocation` instead. The chosen location is added as the first route stop and can be removed or reordered like any other stop.

## Debug APK

To create a development APK from the command line after installing Android SDK API 36:

```bash
pnpm run android:build:debug
```

The output is normally `android/app/build/outputs/apk/debug/app-debug.apk`. A debug APK is suitable for direct device testing, but it is not the package submitted to Google Play.

## Signed Google Play release

In Android Studio, select **Build → Generate Signed Bundle / APK**, choose **Android App Bundle**, then create or select a private upload keystore. Android Studio creates the release `.aab`, typically under `android/app/release/`.

Upload the `.aab` to Google Play Console’s internal testing track first. Test camera permission, location permission, project photo upload, route planning, PDF download, and all public CRM routes on at least one physical Android phone before promoting the release.

> The current deployment intentionally exposes a public demonstration CRM. Do not distribute the app beyond demos until a private production deployment with authentication and user/role authorization is in place.

## Files to retain and files to keep local

Commit the Capacitor configuration, `android/` source, and app code. Do not commit `android/local.properties`, signing keystores, Play service-account credentials, or any `.env` file containing private values. Each developer or build machine should set its own Android SDK location through Android Studio or `ANDROID_HOME`.
