import { PREFECTURES, TILE_COLS, TILE_ROWS } from "@/lib/prefectures";
import type { Distribution } from "@/lib/schema";

const TILE = 36;
const GAP = 3;

type Level = "high" | "mid" | "none";

const FILL: Record<Level, string> = {
  high: "#b45309",
  mid: "#fbbf24",
  none: "#e7e5e4",
};

const TEXT: Record<Level, string> = {
  high: "#ffffff",
  mid: "#44403c",
  none: "#a8a29e",
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
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
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
                fontSize={pref.name.length > 3 ? 9 : 11}
                fill={TEXT[level]}
              >
                {pref.name}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-3 text-sm text-stone-600">
        <span className="inline-flex items-center gap-4">
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
