import { app } from 'electron';
import { join } from 'path';

export const isDev = (): boolean => {
  // Check multiple indicators of development mode
  return (
    process.env.NODE_ENV === 'development' || 
    process.env.DEBUG_PROD === 'true' ||
    process.env.ELECTRON_IS_DEV === 'true' ||
    !app.isPackaged
  );
};

export const getAppUrl = (): string => {
  // In production we run a bundled Next.js server on localhost
  // For desktop app, redirect to the desktop landing page
  return 'http://localhost:3000/desktop-landing';
};

export const getPreloadPath = (): string => {
  return isDev()
    ? join(__dirname, '../preload/preload.js')
    : join(__dirname, '../preload/preload.js');
};
