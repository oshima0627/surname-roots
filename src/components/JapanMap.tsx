import { PREFECTURES, TILE_COLS, TILE_ROWS } from "@/lib/prefectures";
import { COLORS } from "@/lib/colors";
import type { Distribution } from "@/lib/schema";

const TILE = 36;
const GAP = 3;

type Level = "high" | "mid" | "none";

const FILL: Record<Level, string> = {
  high: COLORS.mapHigh,
  mid: COLORS.mapMid,
  none: COLORS.mapNone,
};

const TEXT: Record<Level, string> = {
  high: COLORS.washi,
  mid: COLORS.sumi,
  none: COLORS.mapNoneText,
};

export function JapanMap({ distribution }: { distribution: Distribution }) {
  const levelOf = (name: string): Level => {
    if (distribution.多い.includes(name)) return "high";
    if (distribution.やや多い.includes(name)) return "mid";
    return "none";
  };

  const width = TILE_COLS * (TILE + GAP);
  const height = TILE_ROWS * (TILE + GAP);

  return (
    <figure className="m-0">
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto"
          style={{ minWidth: `${width}px` }}
          role="img"
          aria-label="都道府県別の分布"
        >
          {PREFECTURES.map((pref) => {
            const level = levelOf(pref.name);
            return (
              <g key={pref.name} data-prefecture={pref.name} data-level={level}>
                <rect
                  x={pref.col * (TILE + GAP)}
                  y={pref.row * (TILE + GAP)}
                  width={TILE}
                  height={TILE}
                  rx={4}
                  fill={FILL[level]}
                />
                <text
                  x={pref.col * (TILE + GAP) + TILE / 2}
                  y={pref.row * (TILE + GAP) + TILE / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={11}
                  fill={TEXT[level]}
                >
                  {pref.name}
                </text>
              </g>
            );
          })}
          {/* In-SVG legend for wide screens (sm and above) */}
          <g className="hidden sm:block" data-testid="svg-legend">
            {/* Background for legend */}
            <rect x="10" y="10" width="130" height="70" fill={COLORS.surface} rx="4" opacity="0.95" />
            {/* High level swatch and label */}
            <rect x="20" y="20" width="12" height="12" fill={FILL.high} rx="2" />
            <text x="38" y="28" fontSize="11" fill={COLORS.sumi} fontWeight="500">
              多い
            </text>
            {/* Mid level swatch and label */}
            <rect x="20" y="40" width="12" height="12" fill={FILL.mid} rx="2" />
            <text x="38" y="48" fontSize="11" fill={COLORS.sumi} fontWeight="500">
              やや多い
            </text>
          </g>
        </svg>
      </div>
      <figcaption className="mt-3 text-sm text-sumi-muted">
        {/* HTML swatch legend for narrow screens (below sm) */}
        <span className="inline-flex items-center gap-4 sm:hidden" data-testid="html-legend">
          <span className="inline-flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: FILL.high }} />
            多い
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: FILL.mid }} />
            やや多い
          </span>
        </span>
        <span className="block mt-1">
          ※特に多い地域を示すもので、順位は概略です。着色のない県はデータがないことを意味します。
        </span>
      </figcaption>
    </figure>
  );
}
