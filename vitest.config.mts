import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    // 大半は純粋関数なので node。DOMが要るテストはファイル先頭の
    // `// @vitest-environment jsdom` で個別に上書きする
    environment: "node",
    setupFiles: ["./src/test-setup.ts"],
  },
});
