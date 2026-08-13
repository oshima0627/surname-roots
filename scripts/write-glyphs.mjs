import fs from "node:fs";
import path from "node:path";
import { collectGlyphs } from "./glyphs.mjs";

const text = collectGlyphs();
fs.writeFileSync(path.join(process.cwd(), ".glyphs.txt"), text, "utf-8");
console.log(`収集した文字数: ${new Set([...text]).size}`);
