import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { wasm } from '@rollup/plugin-wasm';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import inject from '@rollup/plugin-inject';
import topLevelAwait from 'vite-plugin-top-level-await';
import { VitePWA } from 'vite-plugin-pwa';
import fs from 'fs';
import path from 'path';
import buildConfig from './build.config';

const buildBrandName = (process.env.VITE_BRAND_NAME || '').trim() || 'NekoChat';
const buildAppVersion = (process.env.VITE_APP_VERSION || '').trim() || '1.0.0';

const copyFiles = {
  targets: [
    {
      src: 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs',
      dest: '',
      rename: 'pdf.worker.min.js',
    },
    {
      src: 'netlify.toml',
      dest: '',
    },
    {
      src: 'config.json',
      dest: '',
    },
    {
      src: 'public/manifest.json',
      dest: '',
      transform: (content) =>
        content
          .toString()
          .replace(/__VITE_BRAND_NAME__/g, buildBrandName)
          .replace(/__VITE_APP_VERSION__/g, buildAppVersion),
    },
    {
      src: 'public/android',
      dest: '',
    },
    {
      src: 'public/res/apple',
      dest: 'res/',
    },
    {
      src: 'public/favicon.ico',
      dest: '',
    },
    {
      src: 'public/favicon.svg',
      dest: '',
    },
    {
      src: 'public/locales',
      dest: 'public/',
    },
  ],
};

function serverMatrixSdkCryptoWasm(wasmFilePath) {
  return {
    name: 'vite-plugin-serve-matrix-sdk-crypto-wasm',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === wasmFilePath) {
          const resolvedPath = path.join(path.resolve(), "/node_modules/@matrix-org/matrix-sdk-crypto-wasm/pkg/matrix_sdk_crypto_wasm_bg.wasm");

          if (fs.existsSync(resolvedPath)) {
            res.setHeader('Content-Type', 'application/wasm');
            res.setHeader('Cache-Control', 'no-cache');

            const fileStream = fs.createReadStream(resolvedPath);
            fileStream.pipe(res);
          } else {
            res.writeHead(404);
            res.end('File not found');
          }
        } else {
          next();
        }
      });
    },
  };
}

const buildForAndroid = process.env.MODE === 'android';

function brandReplacementPlugin() {
  return {
    name: 'vite-brand-replacement',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return html
          .replace(/__VITE_BRAND_NAME__/g, buildBrandName)
          .replace(/__VITE_APP_VERSION__/g, buildAppVersion);
      },
    },
  };
}

export default defineConfig({
  appType: 'spa',
  publicDir: false,
  base: buildConfig.base,
  define: {
    'import.meta.env.VITE_BUILD_FOR_ANDROID': JSON.stringify(buildForAndroid),
  },
  server: {
    port: 8080,
    host: true,
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['..'],
    },
  },
  plugins: [
    brandReplacementPlugin(),
    serverMatrixSdkCryptoWasm('/node_modules/.vite/deps/pkg/matrix_sdk_crypto_wasm_bg.wasm'),
    topLevelAwait({
      // The export name of top-level await promise for each chunk module
      promiseExportName: '__tla',
      // The function to generate import names of top-level await promise in each chunk module
      promiseImportName: (i) => `__tla_${i}`,
    }),
    viteStaticCopy(copyFiles),
    vanillaExtractPlugin(),
    wasm(),
    react(),
    VitePWA({
      srcDir: 'src',
      filename: 'sw.ts',
      strategies: 'injectManifest',
      injectRegister: false,
      manifest: false,
      injectManifest: {
        injectionPoint: undefined,
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    }),
  ],
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
      plugins: [
        // Enable esbuild polyfill plugins
        NodeGlobalsPolyfillPlugin({
          process: false,
          buffer: true,
        }),
      ],
    },
  },
  build: {
    outDir: 'dist',
    // Disable sourcemaps for Android build to avoid hang (sourcemap resolution errors in deps like @tanstack/react-query)
    sourcemap: !buildForAndroid,
    copyPublicDir: false,
    rollupOptions: {
      plugins: [inject({ Buffer: ['buffer', 'Buffer'] })],
    },
  },
});
