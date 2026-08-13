// src/data/surnames/*.json の sources に載っている URL をすべて fetch して
// 生きているか確認する。公開前の手動チェック用スクリプト（npm test / npm run build
// には組み込まない。ネットワークに数百件のリクエストを投げるため、CIやサブ問い合わせの
// 度に走らせると third-party サイトの一時的な不調でスイートが赤くなってしまう）。
//
// 実行: npm run check:links
//
// - shell の curl は日本語を含む生URLを壊すことがあり、encodeURI() は
//   name-power.net のようにすでにパーセントエンコード済みのURLを二重エンコードして
//   誤った400を報告することがある。両方とも Node の fetch ならそのまま扱えるため、
//   このスクリプトは常に Node の fetch を使う。
// - リダイレクト（301/302など）は追跡する。追跡先が生きていればそれで良い
// - 大量のリクエストが同じホストに集中しないよう、同時実行数を絞り、
//   リクエスト間隔を空ける（相手サイトに攻撃のように見えないようにする）
import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "src/data/surnames");
const CONCURRENCY = 4;
const DELAY_MS = 200;
const TIMEOUT_MS = 15000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** slug ごとの sources URL を集める。同じURLを複数の苗字が参照していれば全員分記録する */
function collectSourceRefs() {
  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".json"));
  /** @type {Map<string, string[]>} url -> [slug, ...] */
  const refs = new Map();

  for (const file of files) {
    const raw = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf-8"));
    const slug = raw.slug ?? file.replace(/\.json$/, "");
    for (const url of raw.sources ?? []) {
      if (!refs.has(url)) refs.set(url, []);
      refs.get(url).push(slug);
    }
  }
  return refs;
}

async function checkUrl(url) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    let res;
    try {
      // 一部サイトが HEAD を拒否する（405など）ことがあるため GET を使う
      res = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "user-agent": "Mozilla/5.0 (compatible; surname-roots-linkcheck/1.0)",
        },
      });
    } finally {
      clearTimeout(timer);
    }
    return { ok: res.ok, status: res.status, finalUrl: res.url };
  } catch (error) {
    return { ok: false, status: null, error: error instanceof Error ? error.message : String(error) };
  }
}

/** 同時実行数を CONCURRENCY 件に絞りつつ、各リクエストの間に DELAY_MS 空けて回す */
async function checkAllUrls(urls) {
  const results = new Map();
  let next = 0;

  async function worker() {
    while (next < urls.length) {
      const i = next++;
      const url = urls[i];
      results.set(url, await checkUrl(url));
      await sleep(DELAY_MS);
    }
  }

  const workers = Array.from({ length: Math.min(CONCURRENCY, urls.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

async function main() {
  const refs = collectSourceRefs();
  const urls = [...refs.keys()];
  console.log(`${urls.length}件のURL（延べ${[...refs.values()].reduce((n, s) => n + s.length, 0)}件の参照）を確認する...`);

  const results = await checkAllUrls(urls);

  const failures = [];
  for (const url of urls) {
    const result = results.get(url);
    if (!result.ok) {
      failures.push({ url, slugs: refs.get(url), ...result });
    }
  }

  if (failures.length === 0) {
    console.log(`OK: すべてのURL（${urls.length}件）が生きている`);
    return;
  }

  console.error(`\n失敗: ${failures.length}件のURLが到達不能`);
  for (const f of failures) {
    const statusText = f.status !== null && f.status !== undefined ? f.status : `エラー: ${f.error}`;
    console.error(`- [${statusText}] ${f.url}`);
    console.error(`    引用元: ${f.slugs.join(", ")}`);
  }
  process.exitCode = 1;
}

main();
