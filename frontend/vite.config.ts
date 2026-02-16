import path from "path";
import { defineConfig } from "vite";

export default defineConfig(() => {
    return {
      server: {
        port: 3000,
        host: "0.0.0.0",
      },
      plugins: [],
      resolve: {
        alias: {
          "@": path.resolve(__dirname, "."),
        }
      },
      test: {
        environment: "jsdom",
        setupFiles: ["./src/test/setup.ts"],
        css: true,
      },
    };
});
