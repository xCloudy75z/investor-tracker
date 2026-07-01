/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Build identifier: a UAE-time (GST, UTC+4) build timestamp, unique per deploy.
const BUILD_ID = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString().slice(0, 16).replace("T", " ") + " (UAE)";

// Deployed to GitHub Pages project site at /investor-tracker/.
export default defineConfig({
  base: "/investor-tracker/",
  define: { __APP_VERSION__: JSON.stringify(BUILD_ID) },
  plugins: [
    react(),
    {
      name: "emit-version-json",
      generateBundle() {
        this.emitFile({ type: "asset", fileName: "version.json", source: JSON.stringify({ version: BUILD_ID }) });
      }
    },
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "apple-touch-icon.png", "icon-192.png", "icon-512.png"],
      manifest: {
        name: "Investment Tracker",
        short_name: "Portfolio",
        description: "Honest money-weighted P/L across your brokers",
        theme_color: "#f4eee2",
        background_color: "#f4eee2",
        display: "standalone",
        icons: [
          { src: "favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
          { src: "icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
          { src: "apple-touch-icon.png", sizes: "180x180", type: "image/png" }
        ]
      }
    })
  ],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"]
  }
});
