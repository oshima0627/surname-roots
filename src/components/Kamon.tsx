import fs from "node:fs";
import path from "node:path";

const KAMON_DIR = path.join(process.cwd(), "public/kamon");

/** ファイル名 → 加工済みSVG文字列 のビルド時キャッシュ */
const svgCache = new Map<string, string>();

/**
 * public/kamon/*.svg をビルド時に読み込む。
 * ファイルは `fill="currentColor"` で塗られているため `<img>` では
 * サイトの藍色を継承できず、インラインSVGとして展開する必要がある。
 * サーバーコンポーネントなので `node:fs` で読める。
 */
function loadKamonSvg(file: string): string {
  const cached = svgCache.get(file);
  if (cached !== undefined) return cached;

  const raw = fs.readFileSync(path.join(KAMON_DIR, file), "utf-8");
  const withoutXmlDeclaration = raw.replace(/^<\?xml[^?]*\?>\s*/, "");
  // ルート要素に width/height が無いため、そのままではブラウザ既定の
  // 300x150 で表示されてしまう。コンテナいっぱいに広がるよう明示する。
  const sized = withoutXmlDeclaration.replace(
    /<svg /,
    '<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" ',
  );
  svgCache.set(file, sized);
  return sized;
}

/**
 * 家紋SVGをインライン表示する。装飾要素として扱い、紋名はテキストとして
 * 別途表示される前提で `aria-hidden` にする。
 */
export function Kamon({
  file,
  size,
  className = "",
}: {
  file: string;
  size: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 text-ai ${className}`}
      style={{ width: size, height: size }}
      // 家紋SVGはビルド時に public/kamon/ から読み込んだ信頼済みファイル。
      // currentColor を効かせるため <img> ではなくインラインSVGにする。
      dangerouslySetInnerHTML={{ __html: loadKamonSvg(file) }}
    />
  );
}
