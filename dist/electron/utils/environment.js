"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPreloadPath = exports.getAppUrl = exports.isDev = void 0;
const path_1 = require("path");
const isDev = () => {
    return process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';
};
exports.isDev = isDev;
const getAppUrl = () => {
    // In production we run a bundled Next.js server on localhost
    return 'http://localhost:3000';
};
exports.getAppUrl = getAppUrl;
const getPreloadPath = () => {
    return (0, exports.isDev)()
        ? (0, path_1.join)(__dirname, '../preload/preload.js')
        : (0, path_1.join)(__dirname, '../preload/preload.js');
};
exports.getPreloadPath = getPreloadPath;
