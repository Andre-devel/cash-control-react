import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode === 'analyze' &&
      visualizer({ filename: 'stats.html', open: false, gzipSize: true, brotliSize: true }),
    VitePWA({
      // 'injectManifest', não 'generateSW': o Web Share Target precisa de um handler de
      // `fetch` escrito à mão (src/sw.ts) para interceptar o POST do compartilhamento antes
      // que ele chegue à rede — o generateSW não permite código de service worker próprio.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectManifest: {
        // Build de desenvolvimento nunca passou por minificação; nada a preservar.
        minify: true,
      },
      devOptions: {
        // Sem isto o service worker só existe no build de produção — testar o share
        // target exigiria um deploy a cada mudança.
        enabled: true,
        type: 'module',
      },
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'Cash Control',
        short_name: 'Cash Control',
        description: 'Controle financeiro pessoal',
        start_url: '/dashboard',
        scope: '/',
        display: 'standalone',
        // Paleta definida em docs/v1/responsive-mobile-phases.md (Phase M8).
        theme_color: '#ff6b35',
        background_color: '#0a0a0b',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        // share_target é o que faz "Cash Control" aparecer na folha de compartilhar do
        // Chrome/Android. Sem PWA instalado ele nunca aparece — ver use-install-prompt.ts.
        share_target: {
          action: '/share-target',
          method: 'POST',
          enctype: 'multipart/form-data',
          params: {
            title: 'title',
            text: 'text',
            url: 'url',
            files: [{ name: 'file', accept: ['image/*', 'application/pdf'] }],
          },
        },
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
}))
