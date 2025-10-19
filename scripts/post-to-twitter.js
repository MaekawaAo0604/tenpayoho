import dotenv from "dotenv";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import path from "node:path";
import { postToTwitterAPI } from "../src/twitter-api-post.js";

dotenv.config();

// dayjsのタイムゾーンプラグインを有効化
dayjs.extend(utc);
dayjs.extend(timezone);

// 日本時間を取得するヘルパー関数
const now = () => dayjs().tz("Asia/Tokyo");

/**
 * Twitter投稿スクリプト（GitHub Actions用）
 */
async function main() {
  const imagePath = path.join(
    process.cwd(),
    "out",
    `tenpa-map-${now().format("YYYYMMDD")}.png`
  );

  const tweetText = `おはようございます☀️
【${now().format("M/D(ddd)")}の天パ予報】

全国主要6都市の天パ指数マップをチェック!
札幌・仙台・東京・名古屋・大阪・福岡🗾

外出前に確認してね👀

#天パ予報 #日本天パ協会 #くせ毛 #天気予報 #ヘアケア`;

  const credentials = {
    apiKey: process.env.TWITTER_API_KEY,
    apiSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_SECRET,
  };

  if (!credentials.apiKey || !credentials.apiSecret || !credentials.accessToken || !credentials.accessSecret) {
    throw new Error("Twitter API認証情報が設定されていません。環境変数を確認してください。");
  }

  await postToTwitterAPI(imagePath, tweetText, credentials);
  console.log("✅ Twitter投稿完了");
}

main().catch((error) => {
  console.error("❌ エラー:", error);
  process.exit(1);
});
