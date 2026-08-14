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
    // 既定の5秒では足りない。収録件数ぶんの行を jsdom で描画するテストが
    // 単体で数秒かかり、テストファイルが並列実行されると互いに待たされて
    // 5秒を超える。単独では通るのに全体実行だけ落ちる、という紛らわしい
    // 失敗になっていた。実測（530件で約8秒）に対して余裕を持たせる。
    // ここを緩めても、遅さそのものは surnames.test.ts の
    // 「全件を slug 引きしても1秒以内に終わる」が別途見張っている
    testTimeout: 30_000,
  },
});
