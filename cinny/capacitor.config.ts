import type { CapacitorConfig } from '@capacitor/cli';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const _cfg = JSON.parse(readFileSync(resolve(__dirname, 'config.json'), 'utf-8'));
const appName = (process.env.VITE_BRAND_NAME || '').trim() || _cfg.brandName || 'NekoChat';

const config: CapacitorConfig = {
  appId: 'org.nekochat.cinny',
  appName,
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
