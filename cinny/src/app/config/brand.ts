/**
 * Display branding (name shown in UI only). Not used for storage or internal keys.
 * Set at build time via .env: VITE_BRAND_NAME=YourApp
 * Or at runtime via config.json: { "brandName": "YourApp" }
 */
export const DEFAULT_BRAND_NAME =
  (import.meta.env.VITE_BRAND_NAME as string | undefined)?.trim() || 'Cunny';
