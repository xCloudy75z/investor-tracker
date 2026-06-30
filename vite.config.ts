/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Build identifier: a UTC build timestamp, unique per deploy.
const BUILD_ID = new Date().toISOString().slice(0, 19).replace("T", " ") + " UTC";

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
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "Investment Tracker",
        short_name: "Investments",
        description: "Honest money-weighted P/L across Sarwa, Baraka, eToro",
        theme_color: "#faf6ef",
        background_color: "#faf6ef",
        display: "standalone",
        icons: [
          // NOTE: owner to replace with final PNG art before publishing.
          // Set base to "/<repo-name>/" in vite.config.ts before deploying to GitHub Pages.
          { src: "favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }
        ]
      }
    })
  ],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"]
  }
});
