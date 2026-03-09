import React from 'react';
import { Provider as JotaiProvider } from 'jotai';
import { OverlayContainerProvider, PopOutContainerProvider, TooltipContainerProvider } from 'folds';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// Lazy-load devtools only when not Android so the package is not transformed during android build (avoids freeze)
const ReactQueryDevtools = import.meta.env.VITE_BUILD_FOR_ANDROID
  ? () => null
  : React.lazy(() =>
      import('@tanstack/react-query-devtools').then((m) => ({ default: m.ReactQueryDevtools }))
    );

import { ClientConfigLoader } from '../components/ClientConfigLoader';
import { ClientConfigProvider } from '../hooks/useClientConfig';
import { DEFAULT_BRAND_NAME } from '../config/brand';
import { ConfigConfigError, ConfigConfigLoading } from './ConfigConfig';
import { FeatureCheck } from './FeatureCheck';
import { createRouter } from './Router';
import { ScreenSizeProvider, useScreenSize } from '../hooks/useScreenSize';
import { useCompositionEndTracking } from '../hooks/useComposingCheck';

const queryClient = new QueryClient();

function App() {
  const screenSize = useScreenSize();
  useCompositionEndTracking();

  const portalContainer = document.getElementById('portalContainer') ?? undefined;

  return (
    <TooltipContainerProvider value={portalContainer}>
      <PopOutContainerProvider value={portalContainer}>
        <OverlayContainerProvider value={portalContainer}>
          <ScreenSizeProvider value={screenSize}>
            <FeatureCheck>
              <ClientConfigLoader
                fallback={() => <ConfigConfigLoading />}
                error={(err, retry, ignore) => (
                  <ConfigConfigError error={err} retry={retry} ignore={ignore} />
                )}
              >
                {(clientConfig) => {
                  const brandName = clientConfig.brandName?.trim() || DEFAULT_BRAND_NAME;
                  if (typeof document !== 'undefined') {
                    document.title = brandName;
                    const metaApp = document.querySelector('meta[name="application-name"]');
                    if (metaApp) metaApp.setAttribute('content', brandName);
                    const metaApple = document.querySelector('meta[name="apple-mobile-web-app-title"]');
                    if (metaApple) metaApple.setAttribute('content', brandName);
                  }
                  return (
                  <ClientConfigProvider value={clientConfig}>
                    <QueryClientProvider client={queryClient}>
                      <JotaiProvider>
                        <RouterProvider router={createRouter(clientConfig, screenSize)} />
                      </JotaiProvider>
                      {!import.meta.env.VITE_BUILD_FOR_ANDROID && (
                        <React.Suspense fallback={null}>
                          <ReactQueryDevtools initialIsOpen={false} />
                        </React.Suspense>
                      )}
                    </QueryClientProvider>
                  </ClientConfigProvider>
                  );
                }}
              </ClientConfigLoader>
            </FeatureCheck>
          </ScreenSizeProvider>
        </OverlayContainerProvider>
      </PopOutContainerProvider>
    </TooltipContainerProvider>
  );
}

export default App;
