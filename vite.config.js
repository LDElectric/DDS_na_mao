import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// BASE_URL vira "/DDS_na_mao/" quando publicado no GitHub Pages do repositório.
export default defineConfig({
  base: process.env.GITHUB_PAGES ? "/DDS_na_mao/" : "/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icon-192.png", "icon-512.png", "icon-512-maskable.png"],
      manifest: {
        name: "DDS na Mão",
        short_name: "DDS",
        description:
          "Diálogos Diários de Segurança com sugestão inteligente e leitura 100% offline.",
        lang: "pt-BR",
        start_url: "./",
        scope: "./",
        display: "standalone",
        orientation: "portrait",
        background_color: "#2c2c2c",
        theme_color: "#2c2c2c",
        categories: ["education", "productivity"],
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icon-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // Casca do app: pré-cache automático de todos os assets gerados.
        globPatterns: ["**/*.{js,css,html,svg,png,webmanifest}"],
        // Catálogo e textos: cacheados sob demanda (permitem 100% offline).
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes("/conteudo/"),
            handler: "CacheFirst",
            options: {
              cacheName: "dds-conteudo",
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
        navigateFallback: "index.html",
        cleanupOutdatedCaches: true,
      },
      devOptions: { enabled: true, type: "module" },
    }),
  ],
  build: {
    target: "es2020",
    sourcemap: false,
  },
});
