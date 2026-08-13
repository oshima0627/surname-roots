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
function KamonSvg({
  file,
  size,
  className,
}: {
  file: string;
  size: number;
  className: string;
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

/**
 * PNG（ラスター）の家紋を表示する。SVGと違い currentColor で塗り直せないため、
 * 元のPNGの色（黒）のまま表示する。この見た目の差はオーナーが承知の上での
 * トレードオフであり、隠さず素直にそのまま出す。
 * `<img>` は静的エクスポート（next.config.ts の output: "export"）でも
 * そのまま `public/` 配下を指せるため、ビルド時読み込みなしで扱える。
 */
function KamonImg({
  file,
  size,
  className,
}: {
  file: string;
  size: number;
  className: string;
}) {
  return (
    <img
      src={`/kamon/${file}`}
      alt=""
      aria-hidden="true"
      className={`inline-block shrink-0 object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

/**
 * 家紋を表示する。ファイルの拡張子でSVG（ベクター、サイトの藍色に追従）と
 * PNG（ラスター、元の色のまま）を振り分ける。`svg` フィールドの構造自体は
 * SVG専用のまま拡張せず、ファイル名の拡張子に見た目の描画方式の判断を委ねる
 * （出典情報を必須にするスキーマ制約は形式に関わらずそのまま適用されるため、
 * この振り分けは表示方法だけの話で、出典の必須性には影響しない）。
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
  if (file.toLowerCase().endsWith(".png")) {
    return <KamonImg file={file} size={size} className={className} />;
  }
  return <KamonSvg file={file} size={size} className={className} />;
}
