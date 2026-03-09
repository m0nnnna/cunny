import type { CapacitorConfig } from '@capacitor/cli';

const appName = (process.env.VITE_BRAND_NAME || '').trim() || 'NekoChat';

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
