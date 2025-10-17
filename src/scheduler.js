import cron from "node-cron";
import dotenv from "dotenv";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import dayjs from "dayjs";
import { postToTwitter } from "./twitter-post.js";

dotenv.config();

const execAsync = promisify(exec);

/**
 * 天パ地図を生成して画像パスを返す
 */
async function generateTenpaMap() {
  console.log(`[${dayjs().format()}] 天パ地図生成開始...`);

  try {
    const { stdout, stderr } = await execAsync("node src/index.js");
    if (stderr) console.error("stderr:", stderr);
    console.log(stdout);

    // 生成された画像のパス
    const imagePath = path.join(
      process.cwd(),
      "out",
      `tenpa-map-${dayjs().format("YYYYMMDD")}.png`
    );

    console.log(`[${dayjs().format()}] 画像生成完了: ${imagePath}`);
    return imagePath;
  } catch (error) {
    console.error("天パ地図生成エラー:", error);
    throw error;
  }
}

/**
 * 天パ地図を生成してTwitterに投稿
 */
async function generateAndPost() {
  try {
    // 画像生成
    const imagePath = await generateTenpaMap();

    // Twitter認証情報
    const credentials = {
      email: process.env.TWITTER_EMAIL,
      username: process.env.TWITTER_USERNAME,
      password: process.env.TWITTER_PASSWORD,
    };

    // 投稿テキスト
    const tweetText = `おはようございます☀️
【${dayjs().format("M/D(ddd)")}の天パ予報】

全国主要6都市の天パ指数マップをチェック!
札幌・仙台・東京・名古屋・大阪・福岡🗾

外出前に確認してね👀

#天パ予報 #日本天パ協会 #くせ毛 #天気予報 #ヘアケア`;

    // Twitter投稿
    console.log(`[${dayjs().format()}] Twitter投稿開始...`);
    await postToTwitter(imagePath, tweetText, credentials);
    console.log(`[${dayjs().format()}] Twitter投稿完了!`);
  } catch (error) {
    console.error(`[${dayjs().format()}] エラー発生:`, error);
  }
}

/**
 * スケジューラー起動
 */
function startScheduler() {
  const scheduleTime = process.env.SCHEDULE_TIME || "0 8 * * *"; // デフォルト: 毎日8時

  console.log(`スケジューラー起動: ${scheduleTime}`);
  console.log(`次回実行予定: ${cron.getTasks().size === 0 ? "初回実行" : "スケジュール通り"}`);

  // cronジョブ登録
  const task = cron.schedule(
    scheduleTime,
    () => {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`[${dayjs().format()}] スケジュール実行`);
      console.log(`${"=".repeat(60)}\n`);
      generateAndPost();
    },
    {
      scheduled: true,
      timezone: "Asia/Tokyo",
    }
  );

  // 即座にテスト実行したい場合（デバッグ用）
  if (process.env.RUN_IMMEDIATELY === "true") {
    console.log("\n即座に実行します（RUN_IMMEDIATELY=true）\n");
    generateAndPost();
  }

  // プロセスを終了させない
  process.on("SIGINT", () => {
    console.log("\nスケジューラーを停止します...");
    task.stop();
    process.exit(0);
  });
}

// スケジューラー起動
startScheduler();
