// Node.js v20+ 推奨（Node20は fetch がグローバル。node-fetch は不要）
// ただし互換のため一旦残してもOK。
// import fetch from "node-fetch";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import { createCanvas, loadImage, registerFont } from "canvas";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

// dayjsのタイムゾーンプラグインを有効化
dayjs.extend(utc);
dayjs.extend(timezone);

// 日本時間を取得するヘルパー関数
const now = () => dayjs().tz("Asia/Tokyo");

// 日本語フォント登録（GitHub Actions Ubuntu環境用）
try {
  // Noto Sans CJK JP（Ubuntu標準）
  registerFont("/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc", {
    family: "Noto Sans CJK JP",
  });
} catch {
  // フォント登録失敗時はデフォルトフォントを使用（文字化けする可能性あり）
  console.warn("日本語フォントの登録に失敗しました。デフォルトフォントを使用します。");
}

/**
 * anchors の (x,y) は、assets/japan_map_base.png の実ピクセル座標を使用
 */
const anchors = [
  { name: "札幌", lon: 141.3544, lat: 43.0621, x: 1300, y: 383 },
  { name: "仙台", lon: 140.8719, lat: 38.2688, x: 1278, y: 740 },
  { name: "東京", lon: 139.6917, lat: 35.6895, x: 1124, y: 1137 },
  { name: "名古屋(愛知)", lon: 136.9066, lat: 35.1815, x: 932, y: 1230 },
  { name: "大阪", lon: 135.5023, lat: 34.6937, x: 782, y: 1260 },
  { name: "福岡", lon: 130.4017, lat: 33.5903, x: 380, y: 1360 },
];

const CITIES = [
  { name: "札幌", lon: 141.3544, lat: 43.0621 },
  { name: "仙台", lon: 140.8719, lat: 38.2688 },
  { name: "東京", lon: 139.6917, lat: 35.6895 },
  { name: "名古屋", lon: 136.9066, lat: 35.1815 },
  { name: "大阪", lon: 135.5023, lat: 34.6937 },
  { name: "福岡", lon: 130.4017, lat: 33.5903 },
];

// ---------- アフィン最小二乗 ----------
function transpose(A) {
  return A[0].map((_, i) => A.map((r) => r[i]));
}
function mul(A, B) {
  const r = A.length,
    c = B[0].length,
    k = A[0].length;
  const out = Array.from({ length: r }, () => Array(c).fill(0));
  for (let i = 0; i < r; i++)
    for (let j = 0; j < c; j++)
      for (let t = 0; t < k; t++) out[i][j] += A[i][t] * B[t][j];
  return out;
}
function mulVec(A, v) {
  const r = A.length,
    c = A[0].length,
    out = Array(r).fill(0);
  for (let i = 0; i < r; i++)
    for (let j = 0; j < c; j++) out[i] += A[i][j] * v[j];
  return out;
}
function solve3x3(A, b) {
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < 3; col++) {
    let piv = col;
    for (let r = col + 1; r < 3; r++)
      if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r;
    [M[col], M[piv]] = [M[piv], M[col]];
    const p = M[col][col];
    for (let j = col; j < 4; j++) M[col][j] /= p;
    for (let r = 0; r < 3; r++) {
      if (r === col) continue;
      const f = M[r][col];
      for (let j = col; j < 4; j++) M[r][j] -= f * M[col][j];
    }
  }
  return [M[0][3], M[1][3], M[2][3]];
}
function solveAffineLSQ(pts) {
  const M = pts.map((p) => [p.lon, p.lat, 1]); // n×3
  const bx = pts.map((p) => p.x);
  const by = pts.map((p) => p.y);
  const MT = transpose(M);
  const MTM = mul(MT, M);
  const MTbx = mulVec(MT, bx);
  const MTby = mulVec(MT, by);
  const [a, b, c] = solve3x3(MTM, MTbx);
  const [d, e, f] = solve3x3(MTM, MTby);
  return { a, b, c, d, e, f };
}
const AFF = solveAffineLSQ(anchors);
function project(lon, lat) {
  return {
    x: AFF.a * lon + AFF.b * lat + AFF.c,
    y: AFF.d * lon + AFF.e * lat + AFF.f,
  };
}

// ---------- 天パ指数 ----------
function tenpaIndex(h, d, p) {
  const dewScore = Math.max(0, (d - 15) * 3);
  return Math.round(0.5 * h + 0.3 * dewScore + 0.2 * p);
}
function band(score) {
  if (score >= 90) return { key: "danger", label: "危険", color: "#DC2626" }; // 赤
  if (score >= 70) return { key: "high", label: "高", color: "#F59E0B" }; // 橙
  if (score >= 40) return { key: "med", label: "中", color: "#FBBF24" }; // 黄
  return { key: "low", label: "低", color: "#10B981" }; // 緑
}

// ---------- 天気API（Open-Meteo） ----------
async function fetchCity(c) {
  const u = new URL("https://api.open-meteo.com/v1/forecast");
  u.searchParams.set("latitude", c.lat);
  u.searchParams.set("longitude", c.lon);
  u.searchParams.set(
    "hourly",
    "relative_humidity_2m,dew_point_2m,precipitation_probability"
  );
  u.searchParams.set("timezone", "Asia/Tokyo");
  u.searchParams.set("forecast_days", "2");

  let j;
  try {
    const r = await fetch(u.toString(), {
      headers: { "User-Agent": "tenpa-bot/1.0" },
    });
    if (!r.ok) throw new Error(`weather fetch failed: ${r.status}`);
    j = await r.json();
  } catch (e) {
    console.error("Open-Meteo取得失敗:", e);
    // フェイルセーフ：適当な値で続行（404回避）
    return { ...c, hum: 60, dew: 16, pop: 20, score: 55, band: band(55) };
  }

  const hours = j?.hourly?.time?.map((t) => +t.slice(11, 13)) ?? [];
  const idxs = [7, 8, 9]
    .map((h) => hours.findIndex((H) => H === h))
    .filter((i) => i >= 0);
  const avg = (arr) =>
    Math.round(
      (idxs.length ? idxs.reduce((a, i) => a + arr[i], 0) : 0) /
        (idxs.length || 1) || 0
    );

  const hum = avg(j.hourly.relative_humidity_2m ?? []);
  const dew = avg(j.hourly.dew_point_2m ?? []);
  const pop = avg(j.hourly.precipitation_probability ?? []);
  const score = tenpaIndex(hum, dew, pop);

  return { ...c, hum, dew, pop, score, band: band(score) };
}

// ---------- 描画ユーティリティ ----------
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// ---------- PNGバイナリ保存 + ヘッダ検査 ----------
async function savePngBinary(absPath, canvas) {
  const dir = path.dirname(absPath);
  if (!fs.existsSync(dir)) await fsp.mkdir(dir, { recursive: true });

  const buffer = canvas.toBuffer("image/png"); // ★ バイナリ
  await fsp.writeFile(absPath, buffer);

  // 署名チェック（‰PNG\r\n\032\n = 89 50 4E 47 0D 0A 1A 0A）
  const head = buffer.subarray(0, 8);
  const sig = [...head].map((b) => b.toString(16).padStart(2, "0")).join(" ");
  const ok = sig.toUpperCase() === "89 50 4E 47 0D 0A 1A 0A".toUpperCase();
  if (!ok) {
    throw new Error(`PNGヘッダ不正: ${sig}（文字化け保存の可能性）`);
  }
  return buffer.length;
}

async function main() {
  // ベース地図
  let map;
  try {
    map = await loadImage("./assets/japan_map_base.png");
  } catch (e) {
    console.error("地図画像の読み込みに失敗しました。パスを確認:", e);
    process.exit(1);
  }
  const W = map.width,
    H = map.height;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // 背景
  ctx.drawImage(map, 0, 0, W, H);

  // タイトル帯（視認性UP）
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillRect(0, 0, Math.min(W, 560), 56);

  // タイトル
  ctx.fillStyle = "#0F172A";
  ctx.font = 'bold 28px "Noto Sans CJK JP", sans-serif';
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(`点パ天気予報 ${now().format("YYYY/MM/DD")}`, 16, 28);

  // マスコット読み込み（失敗時は代替丸）
  const iconPaths = {
    low: "./icons/low.png",
    med: "./icons/med.png",
    high: "./icons/high.png",
    danger: "./icons/danger.png",
  };
  const icons = {};
  for (const k of Object.keys(iconPaths)) {
    try {
      icons[k] = await loadImage(iconPaths[k]);
    } catch {
      icons[k] = null;
    }
  }

  // 都市データ
  const rows = await Promise.all(CITIES.map(fetchCity));

  // スケール
  const ICON = Math.max(70, Math.round(W * 0.075));
  const PADY = Math.round(ICON * 0.06);

  for (const r of rows) {
    const { x, y } = project(r.lon, r.lat);

    // マスコット or 代替描画
    const im = icons[r.band.key];
    if (im) {
      ctx.drawImage(im, x - ICON / 2, y - ICON * 0.95, ICON, ICON);
    } else {
      ctx.fillStyle = r.band.color;
      ctx.beginPath();
      ctx.arc(x, y - ICON * 0.6, ICON * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }

    // 都市名
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillStyle = "#111827";
    ctx.font = 'bold 20px "Noto Sans CJK JP", sans-serif';
    ctx.fillText(r.name, x, y - ICON * 0.98 - 6);

    // ラベル帯
    const label = `天パ指数：${r.band.label}（${r.score}）`;
    ctx.font = 'bold 22px "Noto Sans CJK JP", sans-serif';
    const padX = 12,
      bh = 38;
    const tw = ctx.measureText(label).width;
    const bw = tw + padX * 2;
    const bx = Math.round(x - bw / 2);
    const by = Math.round(y + PADY);

    roundRect(ctx, bx, by, bw, bh, 10);
    ctx.fillStyle = r.band.color;
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x, by + bh / 2);

    // 補足
    ctx.font = 'bold 14px "Noto Sans CJK JP", sans-serif';
    ctx.fillStyle = "#374151";
    ctx.fillText(`湿${r.hum}% 露${r.dew}°C 降${r.pop}%`, x, by + bh + 14);
  }

  const outDir = "./out";
  const outPath = path.join(
    outDir,
    `tenpa-map-${now().format("YYYYMMDD")}.png`
  );
  const bytes = await savePngBinary(outPath, canvas);
  console.log(`saved: ${outPath} (${bytes} bytes)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
