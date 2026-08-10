import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: ***"VITE_BASE"] || "/hearing_aid_control/",
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.ts"]
  }
});
