/* eslint-disable import/first */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { enableMapSet } from 'immer';
import '@fontsource/inter/variable.css';
import 'folds/dist/style.css';
import { configClass, varsClass } from 'folds';

enableMapSet();

import './index.css';

import { trimTrailingSlash } from './app/utils/common';
import { DEFAULT_BRAND_NAME } from './app/config/brand';
import App from './app/pages/App';

if (typeof document !== 'undefined') document.title = DEFAULT_BRAND_NAME;

// import i18n (needs to be bundled ;))
import './app/i18n';

document.body.classList.add(configClass, varsClass);

// Only include Capacitor/push when building for Android (VITE_BUILD_FOR_ANDROID=true).
// Web build never imports @capacitor/* so it works without Capacitor deps.
if (import.meta.env.VITE_BUILD_FOR_ANDROID) {
  import('./app/utils/pushNotifications').then((m) => m.initPushNotifications());
}

// Register service worker on both web and Android. It intercepts Matrix media requests
// (download/thumbnail) and adds the Bearer token so media loads; without it, Android
// (and any environment where media is fetched via the SW) gets 401 and media is broken.
if ('serviceWorker' in navigator) {
  const swUrl =
    import.meta.env.MODE === 'production'
      ? `${trimTrailingSlash(import.meta.env.BASE_URL)}/sw.js`
      : `/dev-sw.js?dev-sw`;

  navigator.serviceWorker.register(swUrl);
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'token' && event.data?.responseKey) {
      // Get the token for SW.
      const token = localStorage.getItem('cinny_access_token') ?? undefined;
      event.source!.postMessage({
        responseKey: event.data.responseKey,
        token,
      });
    }
  });
}

const mountApp = () => {
  const rootContainer = document.getElementById('root');

  if (rootContainer === null) {
    console.error('Root container element not found!');
    return;
  }

  const root = createRoot(rootContainer);
  root.render(<App />);
};

mountApp();
