import path from "node:path";
import type { Metadata } from "next";
// fontkit の dist/module.mjs は default export を持たず openSync 等を名前付きで
// export しているため、default import ではなく namespace import を使う
// （scripts/build-font.mjs, scripts/font-coverage.test.mjs と同じ理由）。
import * as fontkit from "fontkit";
import type { Font } from "fontkit";

export const metadata: Metadata = {
  title: "クレジット",
  description: "このサイトで使用しているフォントの著作権者とライセンスの表示です。",
  alternates: { canonical: "/credits" },
};

const OFL_URL = "/fonts/OFL.txt";

/**
 * 配布しているサブセットフォントの著作権表示を、フォント本体（vendor/fonts/NotoSerifJP.ttf）
 * の name テーブルから直接読み取る。scripts/build-font.mjs が public/fonts/OFL.txt へ
 * 書き出す表記と同じ変換（"(c)" → "Copyright"）をここでも行い、常に一致させる。
 * public/fonts/ はgitignore対象で `npm test` 単体では生成されないため、そちらではなく
 * リポジトリに入っている vendor/fonts/NotoSerifJP.ttf を直接読む。
 */
function getFontCopyright(): string {
  // vendor/fonts/NotoSerifJP.ttf は単体の .ttf であり .ttc コレクションではないため、
  // 常に Font（FontCollection ではない）が返る。
  const font = fontkit.openSync(path.join(process.cwd(), "vendor/fonts/NotoSerifJP.ttf")) as Font;
  return font.copyright.replace(/^\(c\)/, "Copyright");
}

export default function CreditsPage() {
  const fontCopyright = getFontCopyright();

  return (
    <div>
      <h1 className="text-2xl font-bold">クレジット</h1>

      <section className="mt-8">
        <h2 className="text-lg font-bold">使用フォント</h2>
        <dl className="mt-4 grid grid-cols-[5.5em_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-sumi-muted">フォント名</dt>
          <dd>Noto Serif JP（本文の明朝体として、表示に必要な文字だけを抜き出したサブセット版を配信）</dd>
          <dt className="text-sumi-muted">著作権者</dt>
          <dd>{fontCopyright}</dd>
          <dt className="text-sumi-muted">ライセンス</dt>
          <dd>
            <a href={OFL_URL} className="underline">
              SIL Open Font License, Version 1.1（OFL.txt）
            </a>
          </dd>
        </dl>
      </section>
    </div>
  );
}
