import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"), // Matches Vue CLI's alias
    },
  },
  server: {
    open: true, // Automatically opens the browser
    port: 3000, // Change port if needed
  },
});
