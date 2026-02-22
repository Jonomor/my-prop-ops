# MyPropOps App Store Publishing Guide

Complete guide for publishing MyPropOps to Google Play Store and Apple App Store.

---

## Table of Contents
1. [Pre-Flight Checklist](#pre-flight-checklist)
2. [Google Play Store (Android)](#google-play-store-android)
3. [Apple App Store (iOS)](#apple-app-store-ios)
4. [CI/CD Setup](#cicd-setup)
5. [Post-Launch](#post-launch)

---

## Pre-Flight Checklist

### Required Assets

| Asset | Requirement | Status |
|-------|-------------|--------|
| Privacy Policy URL | `https://yourdomain.com/privacy` | ✅ Available at `/privacy` |
| Terms of Service URL | `https://yourdomain.com/terms` | ✅ Available at `/terms` |
| App Icon | 1024x1024 PNG (no alpha for iOS) | ✅ logo512.png exists |
| Feature Graphic (Android) | 1024x500 PNG | ❌ Need to create |
| Screenshots | Various sizes per platform | ❌ Need to capture |

### Demo Account for Reviewers
```
Email: reviewer@mypropops.com
Password: ReviewerAccess2026!
```
**Create this account before submission** with pre-populated sample data.

### App Information
```
App Name: MyPropOps
Package ID: com.mypropops.app
Category: Business / Productivity
Age Rating: 4+ (iOS) / Everyone (Android)
```

---

## Google Play Store (Android)

### Step 1: Developer Account
1. Go to [Google Play Console](https://play.google.com/console)
2. Pay $25 one-time registration fee
3. Complete identity verification

### Step 2: Create App Listing
1. Create New App → Enter details
2. Set up store listing:
   - **Short description** (80 chars): "Property management made simple for landlords"
   - **Full description** (4000 chars): See template below
   - **Screenshots**: Upload for Phone, Tablet sizes
   - **Feature Graphic**: 1024x500 banner image

### Step 3: Content Rating
Complete the questionnaire:
- Violence: None
- Sexual Content: None
- Language: None
- Controlled Substance: None
- User-Generated Content: Yes (tenant messages, photos)
- Personal Information: Yes (tenant/landlord data)

### Step 4: Data Safety Form
```
Data collected:
- Personal info: Name, email, phone, address
- Financial info: Payment information (via Stripe)
- Photos/Videos: Maintenance request photos
- App activity: Feature usage analytics

Data shared:
- With Stripe for payment processing
- With Mailchimp for email delivery

Security:
- Data encrypted in transit (HTTPS)
- Data encrypted at rest
- Users can request data deletion
```

### Step 5: Closed Testing (REQUIRED for new accounts)
1. Create Internal Testing track
2. Add 12+ email addresses as testers
3. Distribute app for 14 days minimum
4. Collect feedback, fix bugs

### Step 6: Production Release
1. Move to Production track after testing period
2. Upload signed AAB (Android App Bundle)
3. Set rollout percentage (start with 10-20%)
4. Submit for review (typically 1-3 days)

### Android Build Requirements
```gradle
// In android/app/build.gradle
android {
    compileSdkVersion 35
    
    defaultConfig {
        minSdkVersion 26
        targetSdkVersion 35
        versionCode 1
        versionName "1.0.0"
    }
}
```

---

## Apple App Store (iOS)

### Step 1: Developer Account
1. Go to [Apple Developer](https://developer.apple.com)
2. Enroll in Apple Developer Program ($99/year)
3. Complete identity verification (may take 24-48 hours)

### Step 2: App Store Connect Setup
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Create New App:
   - Platform: iOS
   - Name: MyPropOps
   - Primary Language: English (US)
   - Bundle ID: com.mypropops.app
   - SKU: mypropops-ios-001

### Step 3: App Information
- **Subtitle**: Property Management Made Simple
- **Category**: Business (Primary), Productivity (Secondary)
- **Content Rights**: Does not contain third-party content
- **Age Rating**: 4+ (complete questionnaire)

### Step 4: Privacy Policy
- **Privacy Policy URL**: `https://yourdomain.com/privacy`
- **Privacy Choices URL** (optional): `https://yourdomain.com/privacy#choices`

### Step 5: App Privacy (Nutrition Labels)
Data collected:
```
Contact Info:
- Name (Required for account)
- Email (Required for account)
- Phone (Optional for notifications)
- Address (Tenant property info)

Financial Info:
- Payment info (Stripe handles, not stored)

Photos/Videos:
- Photos (Maintenance requests)

Identifiers:
- User ID (Authentication)
- Device ID (Push notifications)

Usage Data:
- Product Interaction (Analytics)
```

### Step 6: Privacy Manifest (iOS 17+)
Create `ios/App/App/PrivacyInfo.xcprivacy`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>NSPrivacyTracking</key>
    <false/>
    <key>NSPrivacyTrackingDomains</key>
    <array/>
    <key>NSPrivacyCollectedDataTypes</key>
    <array>
        <dict>
            <key>NSPrivacyCollectedDataType</key>
            <string>NSPrivacyCollectedDataTypeEmailAddress</string>
            <key>NSPrivacyCollectedDataTypeLinked</key>
            <true/>
            <key>NSPrivacyCollectedDataTypeTracking</key>
            <false/>
            <key>NSPrivacyCollectedDataTypePurposes</key>
            <array>
                <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
            </array>
        </dict>
        <dict>
            <key>NSPrivacyCollectedDataType</key>
            <string>NSPrivacyCollectedDataTypeName</string>
            <key>NSPrivacyCollectedDataTypeLinked</key>
            <true/>
            <key>NSPrivacyCollectedDataTypeTracking</key>
            <false/>
            <key>NSPrivacyCollectedDataTypePurposes</key>
            <array>
                <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
            </array>
        </dict>
        <dict>
            <key>NSPrivacyCollectedDataType</key>
            <string>NSPrivacyCollectedDataTypePhotosorVideos</string>
            <key>NSPrivacyCollectedDataTypeLinked</key>
            <true/>
            <key>NSPrivacyCollectedDataTypeTracking</key>
            <false/>
            <key>NSPrivacyCollectedDataTypePurposes</key>
            <array>
                <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
            </array>
        </dict>
    </array>
    <key>NSPrivacyAccessedAPITypes</key>
    <array>
        <dict>
            <key>NSPrivacyAccessedAPIType</key>
            <string>NSPrivacyAccessedAPICategoryUserDefaults</string>
            <key>NSPrivacyAccessedAPITypeReasons</key>
            <array>
                <string>CA92.1</string>
            </array>
        </dict>
    </array>
</dict>
</plist>
```

### Step 7: Screenshots
Required sizes:
- **6.7" (iPhone 15 Pro Max)**: 1290 x 2796 px (required)
- **6.5" (iPhone 14 Plus)**: 1284 x 2778 px (required)
- **5.5" (iPhone 8 Plus)**: 1242 x 2208 px (required for older devices)
- **iPad Pro 12.9"**: 2048 x 2732 px (if supporting iPad)

### Step 8: Build & Submit
1. Archive in Xcode: Product → Archive
2. Distribute App → App Store Connect
3. In App Store Connect, select build
4. Add "What's New" notes
5. Submit for Review

### iOS Build Requirements
- Xcode 15.4+ (for iOS 17+)
- Minimum deployment target: iOS 17.0
- Required capabilities: Push Notifications, Camera

---

## CI/CD Setup

### GitHub Secrets Required

**Android:**
| Secret | Description |
|--------|-------------|
| `ANDROID_KEYSTORE_BASE64` | Base64 encoded .jks keystore file |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password |
| `ANDROID_KEY_PASSWORD` | Key password |
| `ANDROID_KEY_ALIAS` | Key alias name |
| `PLAY_STORE_SERVICE_ACCOUNT_JSON` | Google Play API service account |

**iOS:**
| Secret | Description |
|--------|-------------|
| `IOS_BUILD_CERTIFICATE_BASE64` | Base64 encoded .p12 certificate |
| `IOS_P12_PASSWORD` | Certificate password |
| `IOS_PROVISION_PROFILE_BASE64` | Base64 encoded .mobileprovision |
| `IOS_KEYCHAIN_PASSWORD` | Temporary keychain password |
| `IOS_TEAM_ID` | Apple Developer Team ID |
| `IOS_PROVISION_PROFILE_NAME` | Provisioning profile name |
| `APP_STORE_CONNECT_API_KEY_ID` | App Store Connect API Key ID |
| `APP_STORE_CONNECT_API_ISSUER_ID` | API Issuer ID |
| `APP_STORE_CONNECT_API_KEY_BASE64` | Base64 encoded .p8 API key |

**General:**
| Secret | Description |
|--------|-------------|
| `PRODUCTION_API_URL` | Production backend URL |

### Generate Android Keystore
```bash
keytool -genkey -v \
  -keystore mypropops-release.jks \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -alias mypropops

# Convert to base64
base64 -i mypropops-release.jks -o keystore.base64.txt
```

### Create Google Play Service Account
1. Go to Google Cloud Console
2. Create Service Account with "Service Account User" role
3. Generate JSON key
4. In Play Console → Users & Permissions → Invite Service Account
5. Grant "Release Manager" permissions

### Create iOS Certificates
1. In Apple Developer → Certificates
2. Create "Apple Distribution" certificate
3. Download and export as .p12
4. Create App Store provisioning profile
5. Create App Store Connect API Key

### Trigger Build
```bash
# Tag a release to trigger CI/CD
git tag v1.0.0
git push origin v1.0.0
```

---

## Post-Launch

### Monitor
- Google Play Console → Android Vitals (crashes, ANRs)
- App Store Connect → App Analytics
- Check review feedback daily for first week

### Respond to Reviews
- Reply to all negative reviews within 24 hours
- Thank positive reviewers
- Document common issues for updates

### Update Cycle
1. Fix critical bugs immediately
2. Plan feature releases every 2-4 weeks
3. Update screenshots when UI changes
4. Increment version numbers properly

### Version Numbering
```
v1.0.0 - Initial release
v1.0.1 - Bug fixes
v1.1.0 - New features
v2.0.0 - Major changes
```

---

## Description Templates

### Short Description (80 chars)
```
Property management made simple for landlords & managers
```

### Full Description
```
MyPropOps is the all-in-one property management platform trusted by landlords and property managers.

KEY FEATURES:

📋 Property Management
• Track unlimited properties and units
• Manage tenant information and leases
• Store important documents securely

🔧 Maintenance Requests
• Tenants submit requests with photos
• Assign to contractors automatically
• Track status from request to completion

📊 Inspections & Compliance
• Schedule regular inspections
• Digital checklists with photo evidence
• Generate professional reports

💰 Rent Tracking
• Monitor payment status
• Track late payments
• Generate financial reports

🏠 Tenant Portal
• Tenants access their own dashboard
• Submit maintenance requests
• View lease documents

👷 Contractor Portal
• Contractors manage assigned jobs
• Communicate directly with managers
• Update job status in real-time

🤖 AI-Powered Insights
• Predictive maintenance suggestions
• Portfolio performance analytics
• Smart recommendations

WHY CHOOSE MYPROPOPS?

✓ Setup in 15 minutes
✓ No credit card required to start
✓ Free plan for up to 5 units
✓ Bank-level security
✓ 24/7 customer support

Whether you manage 1 property or 100, MyPropOps scales with you.

Download now and simplify your property management today!
```

---

## Support

**Email:** support@mypropops.com
**Website:** https://mypropops.com
**Documentation:** https://docs.mypropops.com
