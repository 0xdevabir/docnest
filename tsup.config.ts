import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    // Public library entrypoint
    index: "src/index.ts",
    // CLI binary entrypoint
    "cli/index": "src/cli/index.ts",
  },
  format: ["esm"],
  target: "node18",
  platform: "node",
  outDir: "dist",

  // Emit type declarations for library consumers
  dts: true,

  // Inline source maps for better stack traces
  sourcemap: true,

  // tsup preserves the #!/usr/bin/env node shebang from src/cli/index.ts automatically.

  // Do NOT bundle — consumers install their own deps; CLI resolves from node_modules
  splitting: false,
  bundle: true,

  // Clean dist on every build
  clean: true,

  // Tree-shake dead code
  treeshake: true,

  // Show build size report
  minify: false,

  esbuildOptions(options) {
    // Preserve the shebang only on the CLI entry
    options.define = {
      ...options.define,
      "process.env.NODE_ENV": JSON.stringify(
        process.env.NODE_ENV ?? "production",
      ),
    };
  },
});
