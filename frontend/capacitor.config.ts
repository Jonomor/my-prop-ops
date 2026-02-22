import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mypropops.app',
  appName: 'MyPropOps',
  webDir: 'build',
  bundledWebRuntime: false,
  
  // Server configuration
  server: {
    // For production, the app uses bundled assets (comment out url)
    // For development, you can use live reload:
    // url: 'https://your-dev-server.com',
    cleartext: true,
    androidScheme: 'https'
  },
  
  // iOS specific configuration
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: true,
    scrollEnabled: true,
    limitsNavigationsToAppBoundDomains: false,
    preferredContentMode: 'mobile',
    // iOS 18+ minimum deployment target
    minVersion: '18.0'
  },
  
  // Android specific configuration  
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false, // Set to false for production
    // Target API 35+ for Play Store 2025 requirements
    minSdkVersion: 26,
    targetSdkVersion: 35,
    compileSdkVersion: 35
  },
  
  // Plugins configuration
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#2563eb', // Primary blue color
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'light',
      backgroundColor: '#2563eb'
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    // Camera permissions
    Camera: {
      // iOS camera usage description
      cameraUsageDescription: 'MyPropOps needs camera access to take photos of maintenance issues and property conditions.',
      // iOS photo library usage description  
      photoLibraryUsageDescription: 'MyPropOps needs photo library access to attach existing photos to maintenance requests.',
      // iOS photo library add usage description
      photoLibraryAddUsageDescription: 'MyPropOps needs permission to save photos to your library.'
    }
  }
};

export default config;
