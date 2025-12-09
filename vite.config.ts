import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8081,
    historyApiFallback: true,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    mode === "production" && VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        navigateFallback: '/index.html',
        navigateFallbackAllowlist: [
          /^\/$/,
          /^\/login/,
          /^\/dashboard/,
          /^\/students/,
          /^\/collection/,
          /^\/not-collected/,
          /^\/confiscation/,
          /^\/permissions/,
          /^\/import/,
        ],
      },
      manifest: {
        name: "Sistem Pendataan Laptop ABBSKP",
        short_name: "ABBSKP",
        description: "Aplikasi Manajemen Pengumpulan Laptop Siswa",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#21791a",
        orientation: "portrait-primary",
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
