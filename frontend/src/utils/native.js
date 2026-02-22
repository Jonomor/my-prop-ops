/**
 * Native Device Integration using Capacitor
 * Provides unified API for camera, push notifications, haptics, and sharing
 */

import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { PushNotifications } from '@capacitor/push-notifications';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Share } from '@capacitor/share';
import { App } from '@capacitor/app';
import { Keyboard } from '@capacitor/keyboard';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

// Check if running on native platform
export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform(); // 'ios', 'android', or 'web'

/**
 * Initialize native app features
 */
export const initializeNativeApp = async () => {
  if (!isNative) return;

  try {
    // Hide splash screen after app is ready
    await SplashScreen.hide();

    // Set status bar style
    await StatusBar.setStyle({ style: Style.Light });
    
    if (platform === 'android') {
      await StatusBar.setBackgroundColor({ color: '#2563eb' });
    }

    // Setup keyboard listeners
    Keyboard.addListener('keyboardWillShow', (info) => {
      document.body.classList.add('keyboard-open');
    });

    Keyboard.addListener('keyboardWillHide', () => {
      document.body.classList.remove('keyboard-open');
    });

    // Handle app state changes
    App.addListener('appStateChange', ({ isActive }) => {
      console.log('App state changed. Is active?', isActive);
    });

    // Handle back button on Android
    App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        App.exitApp();
      }
    });

    console.log('Native app initialized on', platform);
  } catch (error) {
    console.error('Error initializing native app:', error);
  }
};

/**
 * Camera - Take photo or select from gallery
 */
export const takePhoto = async (source = 'prompt') => {
  try {
    // Check permissions first
    const permissions = await Camera.checkPermissions();
    if (permissions.camera !== 'granted') {
      const request = await Camera.requestPermissions();
      if (request.camera !== 'granted') {
        throw new Error('Camera permission denied');
      }
    }

    const image = await Camera.getPhoto({
      quality: 80,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: source === 'camera' ? CameraSource.Camera 
            : source === 'gallery' ? CameraSource.Photos 
            : CameraSource.Prompt,
      width: 1200,
      height: 1200,
      correctOrientation: true
    });

    return {
      base64: image.base64String,
      format: image.format,
      dataUrl: `data:image/${image.format};base64,${image.base64String}`
    };
  } catch (error) {
    console.error('Camera error:', error);
    throw error;
  }
};

/**
 * Push Notifications
 */
export const initializePushNotifications = async (onTokenReceived, onNotificationReceived) => {
  if (!isNative) {
    console.log('Push notifications only available on native platforms');
    return null;
  }

  try {
    // Request permission
    const permission = await PushNotifications.requestPermissions();
    if (permission.receive !== 'granted') {
      throw new Error('Push notification permission denied');
    }

    // Register for push notifications
    await PushNotifications.register();

    // Listen for registration token
    PushNotifications.addListener('registration', (token) => {
      console.log('Push registration token:', token.value);
      if (onTokenReceived) onTokenReceived(token.value);
    });

    // Listen for registration errors
    PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error:', error);
    });

    // Listen for incoming notifications when app is in foreground
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push notification received:', notification);
      if (onNotificationReceived) onNotificationReceived(notification);
    });

    // Listen for notification actions (user tapped notification)
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('Push notification action:', action);
      // Handle navigation based on notification data
      const data = action.notification.data;
      if (data?.route) {
        window.location.href = data.route;
      }
    });

    return true;
  } catch (error) {
    console.error('Push notification setup error:', error);
    return null;
  }
};

/**
 * Haptic Feedback
 */
export const haptics = {
  // Light impact - for UI feedback
  light: async () => {
    if (!isNative) return;
    await Haptics.impact({ style: ImpactStyle.Light });
  },
  
  // Medium impact - for selections
  medium: async () => {
    if (!isNative) return;
    await Haptics.impact({ style: ImpactStyle.Medium });
  },
  
  // Heavy impact - for significant actions
  heavy: async () => {
    if (!isNative) return;
    await Haptics.impact({ style: ImpactStyle.Heavy });
  },
  
  // Success notification
  success: async () => {
    if (!isNative) return;
    await Haptics.notification({ type: NotificationType.Success });
  },
  
  // Warning notification
  warning: async () => {
    if (!isNative) return;
    await Haptics.notification({ type: NotificationType.Warning });
  },
  
  // Error notification
  error: async () => {
    if (!isNative) return;
    await Haptics.notification({ type: NotificationType.Error });
  },

  // Selection feedback
  selection: async () => {
    if (!isNative) return;
    await Haptics.selectionStart();
    await Haptics.selectionEnd();
  }
};

/**
 * Share content
 */
export const shareContent = async ({ title, text, url, files }) => {
  try {
    const canShare = await Share.canShare();
    if (!canShare.value && !isNative) {
      // Fallback for web - copy to clipboard
      if (url) {
        await navigator.clipboard.writeText(url);
        return { shared: false, copied: true };
      }
      throw new Error('Sharing not available');
    }

    const result = await Share.share({
      title,
      text,
      url,
      dialogTitle: title || 'Share'
    });

    return { shared: true, platform: result.activityType };
  } catch (error) {
    if (error.message?.includes('canceled')) {
      return { shared: false, canceled: true };
    }
    throw error;
  }
};

/**
 * App info
 */
export const getAppInfo = async () => {
  if (!isNative) {
    return {
      name: 'MyPropOps',
      version: '1.0.0',
      build: 'web',
      platform: 'web'
    };
  }

  const info = await App.getInfo();
  return {
    name: info.name,
    version: info.version,
    build: info.build,
    platform
  };
};

/**
 * Deep link handling
 */
export const setupDeepLinks = (onDeepLink) => {
  if (!isNative) return;

  App.addListener('appUrlOpen', (event) => {
    console.log('Deep link opened:', event.url);
    if (onDeepLink) onDeepLink(event.url);
    
    // Parse URL and navigate
    const url = new URL(event.url);
    const path = url.pathname;
    if (path) {
      window.location.href = path;
    }
  });
};

export default {
  isNative,
  platform,
  initializeNativeApp,
  takePhoto,
  initializePushNotifications,
  haptics,
  shareContent,
  getAppInfo,
  setupDeepLinks
};
