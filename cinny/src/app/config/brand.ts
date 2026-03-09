/**
 * Single place for branding. All app branding (title, manifest, device names, etc.) flows from here.
 * - Runtime: set "brandName" and "appVersion" in config.json (e.g. public/config.json).
 * - Build-time: set VITE_BRAND_NAME and VITE_APP_VERSION in .env (used for index.html, manifest, Capacitor app name).
 */
export const DEFAULT_BRAND_NAME =
  (import.meta.env.VITE_BRAND_NAME as string | undefined)?.trim() || 'NekoChat';

export const DEFAULT_APP_VERSION =
  (import.meta.env.VITE_APP_VERSION as string | undefined)?.trim() || '1.0.0';
