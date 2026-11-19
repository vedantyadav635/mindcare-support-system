import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Dev server on port 5173, which the backend's CORS_ORIGINS allows
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173 },
});
