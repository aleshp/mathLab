import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // Автоматическое обновление при выходе новой версии
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'meerkat/*.png'], // Что кэшировать кроме кода
      manifest: {
        name: 'MathLab PvP',
        short_name: 'MathLab',
        description: 'PvP битвы по математике и подготовка к ЕНТ',
        theme_color: '#0f172a', // Твой slate-900
        background_color: '#0f172a',
        display: 'standalone', // Убирает интерфейс браузера (адресную строку)
        orientation: 'portrait', // Фиксируем вертикальную ориентацию
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable' // Для круглых иконок Android
          }
        ]
      },
      workbox: {
        // Кэшируем JS, CSS, HTML и картинки. Не кэшируем API запросы (они должны быть онлайн)
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        maximumFileSizeToCacheInBytes: 3000000 // Увеличиваем лимит кэша до 3МБ (у тебя тяжелые либы)
      }
    })
  ],
});