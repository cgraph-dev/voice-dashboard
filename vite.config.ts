import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { fileURLToPath, URL } from "node:url"

export default defineConfig({
  plugins: [react()],
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  build: {
    emptyOutDir: false,
    lib: {
      entry: "src/orb-mount.tsx",
      name: "QubitThinkingOrb",
      formats: ["iife"],
      fileName: () => "thinking-orb.js",
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
    outDir: "frontend",
  },
})
