"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPreloadPath = exports.getAppUrl = exports.isDev = void 0;
const electron_1 = require("electron");
const path_1 = require("path");
const isDev = () => {
    // Check multiple indicators of development mode
    return (process.env.NODE_ENV === 'development' ||
        process.env.DEBUG_PROD === 'true' ||
        process.env.ELECTRON_IS_DEV === 'true' ||
        !electron_1.app.isPackaged);
};
exports.isDev = isDev;
const getAppUrl = () => {
    // In production we run a bundled Next.js server on localhost
    // For desktop app, redirect to the desktop landing page
    return 'http://localhost:3000/desktop-landing';
};
exports.getAppUrl = getAppUrl;
const getPreloadPath = () => {
    return (0, exports.isDev)()
        ? (0, path_1.join)(__dirname, '../preload/preload.js')
        : (0, path_1.join)(__dirname, '../preload/preload.js');
};
exports.getPreloadPath = getPreloadPath;
