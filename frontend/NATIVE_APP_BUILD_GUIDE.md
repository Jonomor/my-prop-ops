# MyPropOps Native App Build Guide

This guide explains how to build and deploy MyPropOps as a native iOS and Android app using Capacitor.

## Prerequisites

### For Android
- Android Studio (latest version)
- Java JDK 17+
- Android SDK (API level 33+)

### For iOS
- macOS (required)
- Xcode 15+ 
- CocoaPods (`sudo gem install cocoapods`)
- Apple Developer account ($99/year for App Store distribution)

## Project Setup

The Capacitor configuration is already set up in `capacitor.config.ts`. Native plugins included:

- **@capacitor/camera** - Take photos for maintenance requests
- **@capacitor/push-notifications** - Push notifications
- **@capacitor/splash-screen** - Native splash screen
- **@capacitor/status-bar** - Status bar customization
- **@capacitor/haptics** - Haptic feedback
- **@capacitor/share** - Native sharing
- **@capacitor/keyboard** - Keyboard handling
- **@capacitor/app** - App lifecycle and deep links

## Building the App

### Step 1: Build the Web App

```bash
cd /app/frontend
yarn build
```

This creates the production build in the `build/` folder.

### Step 2: Add Native Platforms (First Time Only)

```bash
# Add Android
yarn cap:add:android

# Add iOS (requires macOS)
yarn cap:add:ios
```

### Step 3: Sync Web Assets to Native Projects

```bash
yarn cap:sync
```

This copies the web build to the native projects and updates native dependencies.

## Android Build

### Development Build

1. Open Android Studio:
```bash
yarn cap:android
```

2. In Android Studio:
   - Click "Build" > "Build Bundle(s) / APK(s)" > "Build APK(s)"
   - The APK will be in `android/app/build/outputs/apk/debug/`

### Production Build (Signed APK/AAB)

1. Generate a signing key (first time only):
```bash
keytool -genkey -v -keystore mypropops-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias mypropops
```

2. Create `android/key.properties`:
```properties
storePassword=your_store_password
keyPassword=your_key_password
keyAlias=mypropops
storeFile=../mypropops-release-key.jks
```

3. Build release APK:
```bash
yarn app:build:android
```

The signed APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

### Play Store Submission

1. Build AAB (Android App Bundle) in Android Studio:
   - "Build" > "Build Bundle(s) / APK(s)" > "Build Bundle(s)"

2. Upload to Google Play Console:
   - Create app listing with screenshots
   - Upload AAB to Internal/Closed/Open testing track
   - Complete content rating and privacy policy
   - Submit for review

## iOS Build

### Development Build

1. Open Xcode:
```bash
yarn cap:ios
```

2. In Xcode:
   - Select your team in Signing & Capabilities
   - Select a connected device or simulator
   - Click "Run" (▶)

### Production Build

1. In Xcode:
   - Select "Any iOS Device" as build target
   - Product > Archive
   - Distribute App > App Store Connect

### App Store Submission

1. In App Store Connect:
   - Create new app with Bundle ID `com.mypropops.app`
   - Fill in app metadata, screenshots, description
   - Link to privacy policy: `https://yourdomain.com/privacy`
   - Submit for review

## App Store Assets Needed

### Screenshots (Required)
- iPhone 6.5" (1284 x 2778 px) - 3-5 screenshots
- iPhone 5.5" (1242 x 2208 px) - 3-5 screenshots
- iPad 12.9" (2048 x 2732 px) - if supporting iPad

### Icons
Icons are auto-generated from `public/logo512.png`. For best results:
- iOS: 1024x1024 PNG (no alpha)
- Android: 512x512 PNG

### App Store Listing
- **App Name:** MyPropOps
- **Subtitle:** Property Management Made Simple
- **Category:** Business / Productivity
- **Keywords:** property management, landlord, tenant, rental, maintenance, inspection

### Privacy Policy URL
`https://yourdomain.com/privacy`

### Support URL  
`https://yourdomain.com/support`

## Native Features Configuration

### Push Notifications

**Android:** Add Firebase Cloud Messaging
1. Create Firebase project
2. Download `google-services.json` to `android/app/`
3. Add server key to backend for sending notifications

**iOS:** Add Apple Push Notification service
1. Create APNs key in Apple Developer portal
2. Configure in Xcode Signing & Capabilities
3. Add key to backend for sending notifications

### Deep Links

Configure app links for `mypropops.com`:

**Android:** Add to `android/app/src/main/AndroidManifest.xml`
```xml
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="https" android:host="mypropops.com" />
</intent-filter>
```

**iOS:** Add Associated Domains in Xcode

## Environment Variables

The app uses the same backend API. Update `capacitor.config.ts` for production:

```typescript
server: {
  // Remove url for production - uses bundled assets
  // url: 'https://your-api.com',
  androidScheme: 'https'
}
```

## Troubleshooting

### Android Build Fails
- Run `cd android && ./gradlew clean`
- Ensure Java 17+ is installed
- Update Gradle if prompted

### iOS Build Fails
- Run `cd ios/App && pod install`
- Clean Xcode build folder (Cmd+Shift+K)
- Ensure CocoaPods is up to date

### Camera Not Working
- Check permissions in AndroidManifest.xml / Info.plist
- Ensure camera permission is requested at runtime

### Push Notifications Not Received
- Verify Firebase/APNs configuration
- Check device token is being sent to backend
- Ensure notifications are enabled in device settings

## Version Updates

When releasing new versions:

1. Update version in `package.json`
2. Update version in `android/app/build.gradle`:
   ```gradle
   versionCode 2
   versionName "1.0.1"
   ```
3. Update version in Xcode project settings
4. Build and submit new version

---

**Need Help?** Contact support@mypropops.com
