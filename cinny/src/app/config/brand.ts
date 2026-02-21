/**
 * Branding is editable in one place:
 * - Runtime: set "brandName" and "appVersion" in config.json (e.g. public/config.json).
 * - Build-time: set VITE_BRAND_NAME and VITE_APP_VERSION in .env.
 */
export const DEFAULT_BRAND_NAME =
  (import.meta.env.VITE_BRAND_NAME as string | undefined)?.trim() || 'Cunny';

export const DEFAULT_APP_VERSION =
  (import.meta.env.VITE_APP_VERSION as string | undefined)?.trim() || '1.0.0';
