import data from "@/data/prefectures.json";

export type Prefecture = { name: string; row: number; col: number };

/** タイルマップの盤面サイズ。SVGのviewBox算出に使う */
export const TILE_COLS = 14;
export const TILE_ROWS = 12;

/**
 * 47都道府県のタイルマップ配置。
 * 実地図のSVGは配布ライセンスの確認が要るため、面積の歪みがなく
 * 小さい県も潰れないタイル配置を自作している。
 * 地理的な正確さより、隣接関係が直感に合うことを優先している。
 * 座標データの実体は src/data/prefectures.json にある。
 */
export const PREFECTURES: readonly Prefecture[] = data;
export const PREFECTURE_NAMES: readonly string[] = PREFECTURES.map((p) => p.name);
