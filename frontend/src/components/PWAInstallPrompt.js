import React, { useState, useEffect } from 'react';
import { X, Download, Share } from 'lucide-react';
import { Button } from './ui/button';

const PWAInstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed or dismissed
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    if (dismissed || isStandalone) return;

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(iOS);

    // For iOS, show custom prompt after delay
    if (iOS) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    // For Android/Desktop, listen for beforeinstallprompt
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show prompt after short delay
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 lg:bottom-4 lg:left-auto lg:right-4 lg:w-80 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-card border border-border rounded-xl shadow-2xl p-4">
        <button 
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
            <Download className="w-6 h-6 text-primary-foreground" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">Install MyPropOps</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {isIOS 
                ? "Tap the share button and select 'Add to Home Screen'"
                : "Add to your home screen for quick access"
              }
            </p>
          </div>
        </div>

        {isIOS ? (
          <div className="mt-3 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>1. Tap</span>
              <Share className="w-4 h-4" />
              <span>at the bottom</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <span>2. Select "Add to Home Screen"</span>
            </div>
          </div>
        ) : (
          <div className="flex gap-2 mt-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={handleDismiss}
            >
              Not now
            </Button>
            <Button 
              size="sm" 
              className="flex-1"
              onClick={handleInstall}
              data-testid="pwa-install-btn"
            >
              Install
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
