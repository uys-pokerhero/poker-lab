import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    cssCodeSplit: false,
    rollupOptions: {
      input: "src/index.ts",
      output: {
        entryFileNames: "variance-widget.js",
        assetFileNames: "variance-widget[extname]",
        format: "iife",
      },
    },
  },
});
