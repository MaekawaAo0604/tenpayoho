import { TwitterApi } from "twitter-api-v2";
import fs from "node:fs";

/**
 * Twitter API v2を使って画像付きツイートを投稿
 * @param {string} imagePath - 投稿する画像のパス
 * @param {string} tweetText - 投稿テキスト
 * @param {object} credentials - { apiKey, apiSecret, accessToken, accessSecret }
 */
export async function postToTwitterAPI(imagePath, tweetText, credentials) {
  if (!fs.existsSync(imagePath)) {
    throw new Error(`画像が見つかりません: ${imagePath}`);
  }

  // Twitter API クライアント初期化
  const client = new TwitterApi({
    appKey: credentials.apiKey,
    appSecret: credentials.apiSecret,
    accessToken: credentials.accessToken,
    accessSecret: credentials.accessSecret,
  });

  // Read/Write権限のクライアント
  const rwClient = client.readWrite;

  try {
    console.log("画像をアップロード中...");

    // 画像をアップロード
    const mediaId = await rwClient.v1.uploadMedia(imagePath);
    console.log(`画像アップロード完了: ${mediaId}`);

    console.log("ツイートを投稿中...");

    // ツイート投稿（画像付き）
    const tweet = await rwClient.v2.tweet({
      text: tweetText,
      media: {
        media_ids: [mediaId],
      },
    });

    console.log("✅ ツイート投稿完了!");
    console.log(`ツイートID: ${tweet.data.id}`);
    console.log(`URL: https://twitter.com/user/status/${tweet.data.id}`);

    return tweet;
  } catch (error) {
    console.error("Twitter API エラー:", error);
    throw error;
  }
}
