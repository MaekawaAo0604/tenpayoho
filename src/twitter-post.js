import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

/**
 * Playwrightを使ってTwitterに画像を投稿
 * @param {string} imagePath - 投稿する画像のパス
 * @param {string} tweetText - 投稿テキスト
 * @param {object} credentials - { email, username, password }
 */
export async function postToTwitter(imagePath, tweetText, credentials) {
  if (!fs.existsSync(imagePath)) {
    throw new Error(`画像が見つかりません: ${imagePath}`);
  }

  const browser = await chromium.launch({
    headless: process.env.CI === "true", // CI環境では自動的にheadless
    slowMo: process.env.CI === "true" ? 0 : 100,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    locale: "ja-JP",
  });

  const page = await context.newPage();

  try {
    console.log("Twitterにログイン中...");

    // Twitterログインページへ
    await page.goto("https://twitter.com/i/flow/login", {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(3000);

    // デバッグ用スクリーンショット
    await page.screenshot({ path: "./out/debug-login-page.png" });
    console.log("ログインページのスクリーンショットを保存: ./out/debug-login-page.png");

    // メールアドレス/電話番号入力（複数のセレクタを試行）
    let emailInput;
    try {
      emailInput = page.locator('input[autocomplete="username"]');
      await emailInput.waitFor({ state: "visible", timeout: 5000 });
    } catch {
      console.log("セレクタ1失敗、代替セレクタを試行...");
      try {
        emailInput = page.locator('input[name="text"]');
        await emailInput.waitFor({ state: "visible", timeout: 5000 });
      } catch {
        console.log("セレクタ2失敗、最終セレクタを試行...");
        emailInput = page.locator('input[type="text"]').first();
        await emailInput.waitFor({ state: "visible", timeout: 5000 });
      }
    }

    await emailInput.fill(credentials.email);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "./out/debug-after-email.png" });

    await page.keyboard.press("Enter");
    await page.waitForTimeout(3000);

    // ユーザー名入力（要求された場合）
    try {
      const usernameInput = page.locator('input[data-testid="ocfEnterTextTextInput"]');
      if (await usernameInput.isVisible({ timeout: 3000 })) {
        console.log("ユーザー名を入力中...");
        await usernameInput.fill(credentials.username);
        await page.keyboard.press("Enter");
        await page.waitForTimeout(2000);
      }
    } catch {
      // ユーザー名入力が不要な場合はスキップ
    }

    // パスワード入力
    const passwordInput = page.locator('input[autocomplete="current-password"]');
    await passwordInput.waitFor({ state: "visible", timeout: 10000 });
    await passwordInput.fill(credentials.password);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(3000);

    // ログイン完了確認
    await page.waitForURL("https://twitter.com/home", { timeout: 15000 });
    console.log("ログイン成功");

    // ツイート作成画面へ
    await page.waitForTimeout(2000);

    // ツイート入力エリアをクリック
    const tweetBox = page.locator('div[data-testid="tweetTextarea_0"]');
    await tweetBox.waitFor({ state: "visible", timeout: 10000 });
    await tweetBox.click();
    await page.waitForTimeout(1000);

    // テキスト入力
    await tweetBox.fill(tweetText);
    await page.waitForTimeout(1000);

    // 画像アップロード
    console.log("画像をアップロード中...");
    const fileInput = page.locator('input[data-testid="fileInput"]');
    await fileInput.setInputFiles(path.resolve(imagePath));
    await page.waitForTimeout(3000);

    // 画像処理完了を待つ
    await page.waitForSelector('div[data-testid="attachments"]', {
      timeout: 10000,
    });
    console.log("画像アップロード完了");

    // ツイートボタンをクリック
    const tweetButton = page.locator('button[data-testid="tweetButtonInline"]');
    await tweetButton.click();
    await page.waitForTimeout(3000);

    console.log("ツイート投稿完了!");

    // スクリーンショット（確認用）
    await page.screenshot({ path: "./out/twitter-posted.png" });
  } catch (error) {
    // エラー時スクリーンショット
    await page.screenshot({ path: "./out/twitter-error.png" });
    throw error;
  } finally {
    await browser.close();
  }
}
