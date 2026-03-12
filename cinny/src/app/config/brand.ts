/**
 * Baked in at build time from cinny/config.json via vite.config.js define injection.
 * To change the app name / version, edit cinny/config.json (brandName + appVersion).
 */
export const DEFAULT_BRAND_NAME = (import.meta.env.VITE_BRAND_NAME as string) ?? 'NekoChat';
export const DEFAULT_APP_VERSION = (import.meta.env.VITE_APP_VERSION as string) ?? '1.0.0';
