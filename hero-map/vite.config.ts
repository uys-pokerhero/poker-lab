import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/poker-lab/",
  plugins: [react()],
  build: {
    outDir: "dist",
    cssCodeSplit: false,
    rollupOptions: {
      input: "src/index.ts",
      output: {
        entryFileNames: "hero-map-widget.js",
        assetFileNames: "hero-map-widget[extname]",
        format: "iife",
      },
    },
  },
});
