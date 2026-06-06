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
        entryFileNames: "preflop-trainer-widget.js",
        assetFileNames: "preflop-trainer-widget[extname]",
        format: "iife",
      },
    },
  },
});
