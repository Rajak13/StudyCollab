import { join } from 'path';

export const isDev = (): boolean => {
  return process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';
};

export const getAppUrl = (): string => {
  // For now, use localhost for both dev and prod since studycollab.app doesn't exist
  return 'http://localhost:3000';
};

export const getPreloadPath = (): string => {
  return isDev()
    ? join(__dirname, '../preload/preload.js')
    : join(__dirname, '../preload/preload.js');
};
