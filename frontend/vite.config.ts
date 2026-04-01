import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import viteCompression from "vite-plugin-compression";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/",
  plugins: [
    react(),
    viteCompression({
      algorithm: "brotliCompress",
    }),
    svgr({
      svgrOptions: {
        icon: true,
        exportType: "named",
        namedExport: "ReactComponent",
      },
    }),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.svg",
        "robots.txt",
        "pwa-192x192.png",
        "pwa-512x512.png",
      ],
      manifest: {
        name: "Xpilot-Inventa",
        short_name: "XpilotInventa",
        description: "Framers fed the world",
        start_url: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#f2f7ff",
        theme_color: "#465fff",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },

      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
    }),
  ],

  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("redux")) {
              return "vendor";
            }
            if (id.includes("apexcharts")) {
              return "charts";
            }
            if (id.includes("@react-jvectormap")) {
              return "maps";
            }
          }
        },
      },
    },
  },
});
