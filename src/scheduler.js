import cron from "node-cron";
import dotenv from "dotenv";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import { postToTwitterAPI } from "./twitter-api-post.js";
import { generateTweetText } from "./generate-tweet.js";
import { fetchTweetFromIssue } from "./fetch-tweet-from-issue.js";

dotenv.config();

// dayjsのタイムゾーンプラグインを有効化
dayjs.extend(utc);
dayjs.extend(timezone);

// 日本時間を取得するヘルパー関数
const now = () => dayjs().tz("Asia/Tokyo");

const execAsync = promisify(exec);

/**
 * 天パ地図を生成して画像パスを返す
 */
async function generateTenpaMap() {
  console.log(`[${now().format()}] 天パ地図生成開始...`);

  try {
    const { stdout, stderr } = await execAsync("node src/index.js");
    if (stderr) console.error("stderr:", stderr);
    console.log(stdout);

    // 生成された画像のパス
    const imagePath = path.join(
      process.cwd(),
      "out",
      `tenpa-map-${now().format("YYYYMMDD")}.png`
    );

    console.log(`[${now().format()}] 画像生成完了: ${imagePath}`);
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

    // 都市データを取得（index.jsのglobal経由）
    const cityData = global.lastCityData || [];
    const date = now().format("M/D(ddd)");

    let tweetText;

    // 方法1: GitHub IssueからClaudeの応答を取得（優先）
    if (process.env.GITHUB_OWNER && process.env.GITHUB_REPO && process.env.GITHUB_TOKEN) {
      console.log(`[${now().format()}] GitHub Issueから投稿文を取得中...`);
      tweetText = await fetchTweetFromIssue(
        process.env.GITHUB_OWNER,
        process.env.GITHUB_REPO,
        process.env.GITHUB_TOKEN
      );
    }

    // 方法2: Claude APIで投稿文を生成（フォールバック）
    if (!tweetText) {
      console.log(`[${now().format()}] Claude APIで投稿文を生成中...`);
      tweetText = await generateTweetText(cityData, date);
    }

    // Twitter API認証情報
    const credentials = {
      apiKey: process.env.TWITTER_API_KEY,
      apiSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_SECRET,
    };

    // Twitter投稿
    console.log(`[${now().format()}] Twitter投稿開始...`);
    await postToTwitterAPI(imagePath, tweetText, credentials);
    console.log(`[${now().format()}] Twitter投稿完了!`);
  } catch (error) {
    console.error(`[${now().format()}] エラー発生:`, error);
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
      console.log(`[${now().format()}] スケジュール実行`);
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
