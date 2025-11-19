# Mobile App Build Instructions

This document provides instructions for building and deploying the Airflow Velocity Tester as a native mobile app for iOS and Android.

## Prerequisites

### For Android
- **Android Studio** (latest version)
- **Java Development Kit (JDK)** 17 or later
- **Android SDK** with API level 33+

### For iOS (macOS only)
- **Xcode** 14 or later
- **CocoaPods** installed (`sudo gem install cocoapods`)
- **Apple Developer Account** (for deploying to devices/App Store)

## Build Commands

### 1. Build the Web App
```bash
npm run build
```
This builds the web application to `dist/public/`, which Capacitor will use.

### 2. Sync with Mobile Platforms

**Sync both platforms:**
```bash
npx cap sync
```

**Sync Android only:**
```bash
npx cap sync android
```

**Sync iOS only:**
```bash
npx cap sync ios
```

### 3. Open in Native IDE

**Open Android Studio:**
```bash
npx cap open android
```

**Open Xcode:**
```bash
npx cap open ios
```

### 4. Run on Device/Simulator

**Run on Android:**
```bash
npx cap run android
```

**Run on iOS:**
```bash
npx cap run ios
```

## Complete Workflow

### Development Workflow
1. Make changes to your web app code
2. Build the web app: `npm run build`
3. Sync to mobile platforms: `npx cap sync`
4. Open native IDE and run on device/simulator

### Quick Development Commands
```bash
# Build and sync Android
npm run build && npx cap sync android && npx cap open android

# Build and sync iOS
npm run build && npx cap sync ios && npx cap open ios
```

## Building for Production

### Android (Google Play Store)

1. Open Android Studio:
   ```bash
   npx cap open android
   ```

2. In Android Studio:
   - Go to **Build → Generate Signed Bundle / APK**
   - Select **Android App Bundle** (recommended) or **APK**
   - Create or select your keystore
   - Configure signing settings
   - Build release bundle

3. Upload the `.aab` file to Google Play Console

### iOS (Apple App Store)

1. Open Xcode:
   ```bash
   npx cap open ios
   ```

2. In Xcode:
   - Select your development team in **Signing & Capabilities**
   - Set up App Store Connect record
   - Archive the app: **Product → Archive**
   - Upload to App Store Connect

3. Submit for review in App Store Connect

## App Configuration

### Update App Information
Edit `capacitor.config.ts` to customize:
- `appId`: Bundle identifier (e.g., `com.yourcompany.airflowtester`)
- `appName`: Display name shown on device
- Splash screen settings
- Status bar styling

### Update App Icons

**Android:**
- Place icons in `android/app/src/main/res/mipmap-*/`
- Use Android Studio's Image Asset tool

**iOS:**
- Use Xcode's App Icon asset catalog
- Place icons in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

### Update Splash Screens

**Android:**
- Place splash images in `android/app/src/main/res/drawable-*/`

**iOS:**
- Use Xcode's Launch Screen storyboard
- Or add images to `ios/App/App/Assets.xcassets/Splash.imageset/`

## Troubleshooting

### Android Build Fails
- Ensure Java 17 is installed and `JAVA_HOME` is set
- Update Android SDK tools in Android Studio
- Clean and rebuild: **Build → Clean Project**

### iOS Build Fails
- Run `pod install` in the `ios/App` directory
- Update CocoaPods: `sudo gem install cocoapods`
- Clean build folder in Xcode: **Product → Clean Build Folder**

### Changes Not Appearing in Mobile App
- Make sure you ran `npm run build` after making changes
- Run `npx cap sync` to copy new files to native projects
- In native IDE, clean and rebuild the project

## Platform-Specific Notes

### Android
- Minimum SDK version: 23 (Android 6.0)
- Target SDK version: 34 (Android 14)
- The app uses HTTPS scheme for better compatibility

### iOS
- Minimum iOS version: 13.0
- CocoaPods is required for dependency management
- Status bar style adapts to light/dark mode

## Permissions

The app currently doesn't require special permissions, but if you add features like:
- **File system access**: Update Android manifest and iOS Info.plist
- **Camera**: Add camera permissions
- **Network state**: Already included for connectivity checks

Edit these files for permissions:
- Android: `android/app/src/main/AndroidManifest.xml`
- iOS: `ios/App/App/Info.plist`

## Testing on Devices

### Android
1. Enable Developer Options on your Android device
2. Enable USB Debugging
3. Connect device via USB
4. Run: `npx cap run android --target <device-id>`

### iOS
1. Register device in Apple Developer Portal
2. Add device to provisioning profile
3. Connect device via USB
4. Select device in Xcode and click Run

## Continuous Integration

For automated builds, consider using:
- **Fastlane** - Automate iOS and Android builds
- **GitHub Actions** - CI/CD pipelines
- **Bitrise** - Mobile-focused CI/CD

## Support

For Capacitor-specific issues:
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Capacitor GitHub](https://github.com/ionic-team/capacitor)

For platform-specific issues:
- [Android Developer Documentation](https://developer.android.com)
- [iOS Developer Documentation](https://developer.apple.com/ios)
