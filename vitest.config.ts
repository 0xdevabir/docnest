import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts", "src/**/*.test.ts"],
    exclude: ["node_modules", "dist"],
    coverage: {
      provider: "v8",
      include: ["src/**"],
      exclude: ["src/cli/index.ts", "src/index.ts"],
      reporter: ["text", "lcov", "html"],
    },
    // Shorter timeout for unit tests; integration tests can override
    testTimeout: 5000,
  },
  resolve: {
    alias: {
      "@": "/src",
      "@core": "/src/core",
      "@commands": "/src/commands",
      "@plugins": "/src/plugins",
      "@utils": "/src/utils",
    },
  },
});
