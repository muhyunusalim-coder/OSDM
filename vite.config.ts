import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import viteCompression from 'vite-plugin-compression';

const buildTimestamp = Date.now().toString();

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(), 
        tailwindcss(), 
        viteCompression({ algorithm: 'gzip', ext: '.gz' }),
        viteCompression({ algorithm: 'brotliCompress', ext: '.br' }),
        {
          name: 'inject-build-timestamp',
          transformIndexHtml(html) {
            return html.replace(
              '</head>',
              `    <meta name="build-timestamp" content="${buildTimestamp}" />\n  </head>`
            );
          },
        },
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'mask-icon.svg', 'preview.png'],
          manifest: {
            name: 'Monitoring Layanan Kepegawaian BSKJI',
            short_name: 'Kepegawaian BSKJI',
            description: 'Sistem Informasi Terpadu untuk Monitoring Layanan Kepegawaian BSKJI',
            theme_color: '#2563eb',
            background_color: '#020817',
            display: 'standalone',
            icons: [
              {
                src: 'icon-192.png',
                sizes: '192x192',
                type: 'image/png'
              },
              {
                src: 'icon-512.png',
                sizes: '512x512',
                type: 'image/png'
              },
              {
                src: 'icon-maskable-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable'
              },
              {
                src: 'apple-touch-icon.png',
                sizes: '180x180',
                type: 'image/png'
              }
            ]
          },
          workbox: {
            cleanupOutdatedCaches: true,
            additionalManifestEntries: [
              { url: '/index.html', revision: buildTimestamp }
            ],
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/docs\.google\.com\/spreadsheets\/d\/.*/i,
                handler: 'StaleWhileRevalidate',
                options: {
                  cacheName: 'google-sheets-data-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 // 24 hours
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              },
              {
                urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'google-fonts-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              },
              {
                urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'gstatic-fonts-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              }
            ]
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        outDir: 'dist',
        emptyOutDir: true,
        target: 'es2020',
        minify: 'esbuild',
        cssMinify: true,
        modulePreload: { polyfill: false },
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (id.includes('node_modules')) {
                if (id.includes('react') || id.includes('react-dom') || id.includes('zustand')) {
                  return 'react-vendor';
                }
                if (id.includes('lucide-react')) {
                  return 'ui-vendor';
                }
                if (id.includes('recharts') || id.includes('d3-')) {
                  return 'charts-vendor';
                }
                if (id.includes('jspdf') || id.includes('jspdf-autotable') || id.includes('xlsx')) {
                  return 'export-vendor';
                }
              }
            }
          }
        }
      },
      esbuild: {
        drop: mode === 'production' ? ['console', 'debugger'] : [],
        legalComments: 'none',
        minifyIdentifiers: true,
        minifySyntax: true,
        minifyWhitespace: true,
      }
    };
});
