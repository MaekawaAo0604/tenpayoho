import dotenv from "dotenv";
import dayjs from "dayjs";
import path from "node:path";
import { postToTwitter } from "../src/twitter-post.js";

dotenv.config();

/**
 * Twitter投稿スクリプト（GitHub Actions用）
 */
async function main() {
  const imagePath = path.join(
    process.cwd(),
    "out",
    `tenpa-map-${dayjs().format("YYYYMMDD")}.png`
  );

  const tweetText = `今日の天パ予報です🌤️
本日 ${dayjs().format("M月D日")} の天パ指数マップをお届けします!

#天パ予報 #天気予報 #くせ毛`;

  const credentials = {
    email: process.env.TWITTER_EMAIL,
    username: process.env.TWITTER_USERNAME,
    password: process.env.TWITTER_PASSWORD,
  };

  if (!credentials.email || !credentials.username || !credentials.password) {
    throw new Error("Twitter認証情報が設定されていません。環境変数を確認してください。");
  }

  await postToTwitter(imagePath, tweetText, credentials);
  console.log("✅ Twitter投稿完了");
}

main().catch((error) => {
  console.error("❌ エラー:", error);
  process.exit(1);
});
