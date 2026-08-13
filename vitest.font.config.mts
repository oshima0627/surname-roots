import { defineConfig } from "vitest/config";

// フォントのカバー率検証専用の設定。
// 生成物（public/fonts, .glyphs.txt）に依存するため、通常の `npm test`
// （vitest.config.mts, include: src/**/*.test.{ts,tsx}）の対象には含めない。
// `npm run font:verify` からのみ、この設定で明示的に実行する。
export default defineConfig({
  test: {
    include: ["scripts/font-coverage.test.mjs"],
    environment: "node",
  },
});
