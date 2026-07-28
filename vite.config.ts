import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import reactStart from "@tanstack/react-start/plugin/vite";

export default defineConfig({
  plugins: [reactStart(), react(), tsconfigPaths(), tailwindcss()],
});
