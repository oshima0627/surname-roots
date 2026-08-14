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
    // 「全件を slug 引きしても1秒以内に終わる」が別途見張っている。
    //
    // 加えて、この環境ではファイルI/Oの速度が安定しない。同じ680ファイルを
    // 同一プロセスで3回読んだ実測が 2.8秒 / 22.3秒 / 3.4秒 と10倍近く振れる
    // （ウイルス対策のスキャンによるもので、コード側の問題ではない）
    testTimeout: 60_000,

    // テストファイルを並列実行すると、ワーカーごとに収録件数ぶんの JSON を
    // 読み直すため、上記のI/Oの遅さがワーカー数だけ増幅される。
    // 実測では並列で全体110〜150秒かつランキングページのテストが不定に
    // タイムアウトし（単独実行では3.1秒で通る）、直列では179秒で必ず通った。
    // 遅くなっても落ちないほうを採る
    fileParallelism: false,
  },
});
