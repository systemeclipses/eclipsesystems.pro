import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@core": fileURLToPath(new URL("./src/core", import.meta.url)),
      "@ui": fileURLToPath(new URL("./src/ui", import.meta.url)),
      "@workers": fileURLToPath(new URL("./src/workers", import.meta.url)),
      "@state": fileURLToPath(new URL("./src/state", import.meta.url)),
      "@io": fileURLToPath(new URL("./src/io", import.meta.url)),
      "@commands": fileURLToPath(new URL("./src/commands", import.meta.url)),
      "@utils": fileURLToPath(new URL("./src/utils", import.meta.url))
    }
  },
  build: {
    sourcemap: false,
    target: "es2022",
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("@codemirror")) return "editor";
          if (id.includes("ajv") || id.includes("jsonc-parser") || id.includes("fast-json-patch")) {
            return "validation";
          }
          return undefined;
        }
      }
    }
  },
  worker: {
    format: "es"
  }
});
