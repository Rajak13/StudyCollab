import { join } from 'path';

export const isDev = (): boolean => {
  return process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';
};

export const getAppUrl = (): string => {
  // In production we run a bundled Next.js server on localhost
  return 'http://localhost:3000';
};

export const getPreloadPath = (): string => {
  return isDev()
    ? join(__dirname, '../preload/preload.js')
    : join(__dirname, '../preload/preload.js');
};
