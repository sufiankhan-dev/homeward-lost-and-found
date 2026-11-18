import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { SEED_IMAGE_SOURCES } from "./seed-images/sources";

/**
 * One-off maintenance script (not needed to run the app): downloads the demo
 * photos listed in scripts/seed-images/sources.ts from Openverse, normalises
 * them to JPEG and writes CREDITS.md.
 *
 *   npx tsx scripts/fetch-seed-images.ts            download chosen picks
 *   npx tsx scripts/fetch-seed-images.ts --review   contact sheet of candidates
 *
 * Downloads are treated as untrusted data: they are only decoded and
 * re-encoded by sharp, never executed.
 */
const REVIEW = process.argv.includes("--review");
const ONLY = process.argv.find((a) => a.startsWith("--only="))?.slice(7).split(",");
const LIST = process.argv.find((a) => a.startsWith("--list="))?.slice(7).split("|");
const CANDIDATES = Number(process.argv.find((a) => a.startsWith("--candidates="))?.slice(13) ?? 4);
const FROM = Number(process.argv.find((a) => a.startsWith("--from="))?.slice(7) ?? 0);
const outDir = path.resolve("scripts/seed-images");
const reviewDir = path.resolve(".data/seed-image-review");

type Result = {
  title: string;
  url: string;
  foreign_landing_url: string;
  creator?: string;
  license: string;
  license_url?: string;
  width?: number;
  height?: number;
};

async function search(query: string): Promise<Result[]> {
  const url = new URL("https://api.openverse.org/v1/images/");
  url.search = new URLSearchParams({
    q: query,
    license: "cc0,pdm",
    category: "photograph",
    mature: "false",
    page_size: "12",
  }).toString();
  const res = await fetch(url, { headers: { "User-Agent": "homeward-seed-images/1.0" } });
  if (!res.ok) throw new Error(`Openverse ${res.status} for "${query}"`);
  const body = (await res.json()) as { results: Result[] };
  // Prefer reasonably large, landscape-ish photos.
  return body.results.filter((r) => (r.width ?? 0) >= 600 && (r.height ?? 0) >= 400);
}

async function download(url: string): Promise<Buffer> {
  const res = await fetch(url, { headers: { "User-Agent": "homeward-seed-images/1.0" } });
  if (!res.ok) throw new Error(`Download ${res.status}`);
  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.byteLength > 25 * 1024 * 1024) throw new Error("Image too large");
  return bytes;
}

async function review() {
  mkdirSync(reviewDir, { recursive: true });
  type Tile = { input: Buffer; left: number; top: number };
  const tiles: Tile[] = [];
  const W = 240;
  const H = 180;
  const slugs = Object.keys(SEED_IMAGE_SOURCES).filter((s) => !ONLY || ONLY.includes(s));
  for (const [row, slug] of slugs.entries()) {
    const results = (await search(SEED_IMAGE_SOURCES[slug].query)).slice(FROM, FROM + CANDIDATES);
    const label = Buffer.from(
      `<svg width="200" height="${H}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#fff"/><text x="8" y="${H / 2}" font-size="15" font-family="Arial">${slug}</text></svg>`,
    );
    tiles.push({ input: label, left: 0, top: row * H });
    for (const [col, r] of results.entries()) {
      try {
        const img = await sharp(await download(r.url)).resize(W - 6, H - 22, { fit: "cover" }).jpeg().toBuffer();
        const caption = Buffer.from(
          `<svg width="${W - 6}" height="20" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#222"/><text x="4" y="15" font-size="13" fill="#fff" font-family="Arial">#${FROM + col} ${r.license}</text></svg>`,
        );
        tiles.push({ input: img, left: 200 + col * W, top: row * H });
        tiles.push({ input: caption, left: 200 + col * W, top: row * H + H - 22 });
      } catch (error) {
        console.warn(`  ${slug} #${FROM + col}: ${(error as Error).message}`);
      }
    }
    console.log(`reviewed ${slug} (${results.length} candidates)`);
  }
  // Split into two sheets so each stays readable.
  const half = Math.ceil(slugs.length / 2);
  for (const [i, range] of [[0, half], [half, slugs.length]].entries()) {
    const [from, to] = range;
    if (to <= from) continue;
    const sheet = sharp({
      create: { width: 200 + CANDIDATES * W, height: (to - from) * H, channels: 3, background: "#f4f4f4" },
    });
    const part = tiles
      .filter((t) => (t.top ?? 0) >= from * H && (t.top ?? 0) < to * H)
      .map((t) => ({ ...t, top: (t.top ?? 0) - from * H }));
    await sheet.composite(part).jpeg({ quality: 80 }).toFile(path.join(reviewDir, `sheet-${i + 1}.jpg`));
  }
  console.log(`Contact sheets written to ${reviewDir}`);
}

async function fetchPicks() {
  mkdirSync(outDir, { recursive: true });
  const credits: string[] = [
    "# Demo photo credits",
    "",
    "Demo listing photos come from [Openverse](https://openverse.org) and are in the public domain",
    "(CC0 or Public Domain Mark). They are used only as demo data.",
    "",
    "| File | Title | Creator | License | Source |",
    "|---|---|---|---|---|",
  ];
  for (const [slug, { query, pick }] of Object.entries(SEED_IMAGE_SOURCES)) {
    if (ONLY && !ONLY.includes(slug)) continue;
    const results = await search(query);
    const chosen = results[pick];
    if (!chosen) throw new Error(`No result #${pick} for ${slug}`);
    const jpeg = await sharp(await download(chosen.url))
      .rotate()
      .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 78, mozjpeg: true })
      .toBuffer();
    writeFileSync(path.join(outDir, `${slug}.jpg`), jpeg);
    const clean = (s: string | undefined) => (s ?? "Unknown").replace(/\|/g, "/").slice(0, 80);
    credits.push(
      `| ${slug}.jpg | ${clean(chosen.title)} | ${clean(chosen.creator)} | ${chosen.license.toUpperCase()} | [link](${chosen.foreign_landing_url}) |`,
    );
    console.log(`saved ${slug}.jpg (${Math.round(jpeg.byteLength / 1024)} KB)`);
  }
  if (!ONLY) writeFileSync(path.join(outDir, "CREDITS.md"), `${credits.join("\n")}\n`);
}

async function list(queries: string[]) {
  for (const query of queries) {
    const results = await search(query);
    console.log(`\n"${query}" -> ${results.length}`);
    results.slice(0, 12).forEach((r, i) => {
      console.log(`  #${i} [${r.license}] ${r.title} - ${r.creator ?? "?"} (${r.width}x${r.height})`);
    });
  }
}

(REVIEW ? review() : LIST ? list(LIST) : fetchPicks()).catch((error) => {
  console.error(error);
  process.exit(1);
});
