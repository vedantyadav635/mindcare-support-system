import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Dev server on port 5173, which the backend's CORS_ORIGINS allows
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173 },
  test: {
    environment: "jsdom", // a fake browser, so React components can be rendered in tests
    globals: true, // lets Testing Library clean up after each test automatically
    setupFiles: ["./src/test/setup.js"],
    css: false, // styles don't matter for these tests
  },
});
