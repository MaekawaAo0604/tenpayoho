import Anthropic from "@anthropic-ai/sdk";

/**
 * Claude APIを使って天パ予報の投稿文を自動生成
 * @param {Array} cityData - 都市データ [{name, score, band, hum, dew, pop}, ...]
 * @param {string} date - 日付文字列（例: "10/20(日)"）
 * @returns {Promise<string>} - 生成されたツイート文
 */
export async function generateTweetText(cityData, date) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.warn("⚠️ ANTHROPIC_API_KEYが設定されていません。デフォルトの投稿文を使用します。");
    return generateFallbackTweet(date);
  }

  const anthropic = new Anthropic({
    apiKey: apiKey,
  });

  // 都市データを文章化
  const cityInfo = cityData
    .map(
      (city) =>
        `${city.name}: 天パ指数${city.score}（${city.band.label}）、湿度${city.hum}%、露点${city.dew}°C、降水確率${city.pop}%`
    )
    .join("\n");

  const prompt = `あなたは天パ（天然パーマ）に悩む人を応援するTwitterアカウント「天パ予報bot」です。

今日の全国主要6都市の天パ指数データに基づいて、明るく親しみやすい投稿文を作成してください。

【データ】
日付: ${date}
${cityInfo}

【要件】
- 文字数は140文字以内（画像添付があるため短めに）
- 挨拶と日付を含める
- 天パに悩む人に寄り添う温かいトーン
- 都市名や具体的な数値は不要（画像で表示されるため）
- ハッシュタグは以下を必ず含める: #天パ予報 #日本天パ協会 #くせ毛
- 絵文字を適度に使用（使いすぎない）
- 全国規模の傾向を簡潔に伝える（例: 全国的に高め、西日本は注意など）

投稿文のみを出力してください（説明や前置きは不要）。`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const generatedText = message.content[0].text.trim();
    console.log("✅ Claude APIで投稿文を生成しました");
    console.log("---");
    console.log(generatedText);
    console.log("---");

    return generatedText;
  } catch (error) {
    console.error("❌ Claude API呼び出しエラー:", error.message);
    console.log("⚠️ フォールバック: デフォルトの投稿文を使用します");
    return generateFallbackTweet(date);
  }
}

/**
 * APIが使えない場合のフォールバック投稿文
 */
function generateFallbackTweet(date) {
  return `おはようございます☀️
【${date}の天パ予報】

全国主要6都市の天パ指数マップをチェック!
札幌・仙台・東京・名古屋・大阪・福岡🗾

外出前に確認してね👀

#天パ予報 #日本天パ協会 #くせ毛`;
}
