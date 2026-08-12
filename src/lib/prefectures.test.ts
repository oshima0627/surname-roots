import { describe, it, expect } from "vitest";
import { PREFECTURES, PREFECTURE_NAMES } from "@/lib/prefectures";

describe("PREFECTURES", () => {
  it("47都道府県すべてを持つ", () => {
    expect(PREFECTURES).toHaveLength(47);
  });

  it("県名に重複がない", () => {
    expect(new Set(PREFECTURE_NAMES).size).toBe(47);
  });

  it("タイル座標に重複がない", () => {
    const coords = PREFECTURES.map((p) => `${p.row},${p.col}`);
    expect(new Set(coords).size).toBe(47);
  });

  it("代表的な県を含む", () => {
    expect(PREFECTURE_NAMES).toContain("北海道");
    expect(PREFECTURE_NAMES).toContain("東京");
    expect(PREFECTURE_NAMES).toContain("沖縄");
  });

  it("北海道が最北東、沖縄が最南に置かれている", () => {
    const hokkaido = PREFECTURES.find((p) => p.name === "北海道")!;
    const okinawa = PREFECTURES.find((p) => p.name === "沖縄")!;
    expect(hokkaido.row).toBe(0);
    expect(okinawa.row).toBeGreaterThan(hokkaido.row);
  });
});
