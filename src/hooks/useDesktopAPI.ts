import { useEffect, useState } from 'react';
import type { DesktopAPI } from '../../types/desktop';

/**
 * Hook to access desktop API functionality in React components
 * Provides safe access to Electron APIs with fallbacks for web environment
 */
export function useDesktopAPI() {
  const [isElectron, setIsElectron] = useState(false);
  const [desktopAPI, setDesktopAPI] = useState<DesktopAPI | null>(null);

  useEffect(() => {
    // Check if running in Electron environment
    const checkElectron = () => {
      if (typeof window !== 'undefined' && window.desktopAPI) {
        setIsElectron(true);
        setDesktopAPI(window.desktopAPI);
      } else {
        setIsElectron(false);
        setDesktopAPI(null);
      }
    };

    checkElectron();

    // Listen for when the desktop API becomes available
    const handleLoad = () => checkElectron();
    window.addEventListener('load', handleLoad);

    return () => {
      window.removeEventListener('load', handleLoad);
    };
  }, []);

  // Safe wrapper functions that work in both web and desktop environments
  const safeDesktopAPI = {
    // System Integration
    showNotification: async (title: string, body: string): Promise<boolean> => {
      if (desktopAPI) {
        return await desktopAPI.showNotification(title, body);
      }
      // Fallback to web notification API
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body });
        return true;
      }
      return false;
    },

    minimizeToTray: async (): Promise<boolean> => {
      if (desktopAPI) {
        return await desktopAPI.minimizeToTray();
      }
      return false;
    },

    showWindow: async (): Promise<boolean> => {
      if (desktopAPI) {
        return await desktopAPI.showWindow();
      }
      return false;
    },

    // File Operations
    showSaveDialog: async (options: any): Promise<any> => {
      if (desktopAPI) {
        return await desktopAPI.showSaveDialog(options);
      }
      // Fallback for web - could implement with File System Access API
      return { canceled: true };
    },

    showOpenDialog: async (options: any): Promise<any> => {
      if (desktopAPI) {
        return await desktopAPI.showOpenDialog(options);
      }
      // Fallback for web - could implement with file input
      return { canceled: true, filePaths: [] };
    },

    // Window Management
    toggleFullscreen: async (): Promise<boolean> => {
      if (desktopAPI) {
        return await desktopAPI.toggleFullscreen();
      }
      // Fallback to web fullscreen API
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return false;
      } else {
        await document.documentElement.requestFullscreen();
        return true;
      }
    },

    getWindowBounds: async (): Promise<any> => {
      if (desktopAPI) {
        return await desktopAPI.getWindowBounds();
      }
      return {
        x: window.screenX,
        y: window.screenY,
        width: window.innerWidth,
        height: window.innerHeight
      };
    },

    setWindowBounds: async (bounds: any): Promise<boolean> => {
      if (desktopAPI) {
        return await desktopAPI.setWindowBounds(bounds);
      }
      return false;
    },

    // App Lifecycle
    getAppVersion: async (): Promise<string> => {
      if (desktopAPI) {
        return await desktopAPI.getAppVersion();
      }
      return '1.0.0-web';
    },

    // Event Listeners
    onMenuAction: (callback: (action: string, data?: any) => void): void => {
      if (desktopAPI) {
        desktopAPI.onMenuAction(callback);
      }
    },

    removeAllListeners: (): void => {
      if (desktopAPI) {
        desktopAPI.removeAllListeners();
      }
    }
  };

  return {
    isElectron,
    desktopAPI: safeDesktopAPI
  };
}

/**
 * Hook to check if the app is running in Electron environment
 */
export function useIsElectron(): boolean {
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    setIsElectron(typeof window !== 'undefined' && window.desktopAPI !== undefined);
  }, []);

  return isElectron;
}