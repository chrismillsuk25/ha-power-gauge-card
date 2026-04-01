import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  build: {
    target: "es2020",
    minify: true,
    sourcemap: false,
    lib: {
      entry: path.resolve(__dirname, "src/ha-power-gauge-card.ts"),
      formats: ["es"],
      fileName: () => "ha-power-gauge-card.js"
    },
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      external: []
    }
  }
});
