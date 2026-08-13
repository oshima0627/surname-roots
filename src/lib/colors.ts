/** サイトの配色。Tailwind の @theme と必ず同じ値にすること */
export const COLORS = {
  washi: "#f7f4ed", // 生成り。ページ背景
  surface: "#fffdf8", // 面。カード・表の背景
  sumi: "#1f1c17", // 墨。本文
  sumiMuted: "#6b6255", // 墨の淡い階調。補助文字
  ai: "#1f3f5e", // 藍。アクセント
  keisen: "#ddd6c9", // 罫線
  mapHigh: "#1b3a57", // 分布「多い」
  mapMid: "#7d9fbc", // 分布「やや多い」
  mapNone: "#e3ded3", // 分布 データなし
  mapNoneText: "#5c5449", // データなしタイルの文字
} as const;

/** WCAG 2.x の相対輝度 */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG 2.x のコントラスト比 */
export function contrastRatio(a: string, b: string): number {
  const [la, lb] = [relativeLuminance(a), relativeLuminance(b)];
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}
