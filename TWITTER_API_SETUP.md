# Twitter API セットアップガイド

Twitter API v2を使用するための手順を説明します。

## 🔑 Twitter API の取得手順

### 1. Twitter Developer Portal にアクセス

https://developer.twitter.com/en/portal/dashboard

### 2. アプリを作成

1. **+ Create App** または **+ Create Project** をクリック
2. プロジェクト名を入力（例: `TenpaBot`）
3. 用途を選択（Making a bot を選択）

### 3. API Keys を取得

アプリ作成後、以下の4つのキーが表示されます：

- **API Key** (Consumer Key)
- **API Secret** (Consumer Secret)
- **Bearer Token**（今回は不要）

⚠️ **重要**: この画面は一度しか表示されないので、必ずコピーして保存してください！

### 4. Access Token を生成

1. アプリの **Keys and tokens** タブに移動
2. **Access Token and Secret** セクションで **Generate** をクリック
3. 以下が表示されます：
   - **Access Token**
   - **Access Secret**

⚠️ **重要**: これも一度しか表示されないので必ずコピーして保存！

### 5. 権限設定の確認

**User authentication settings** で以下を確認：

1. **App permissions**: **Read and Write** に設定
   - Elevated プランの場合は自動的に Read and Write
   - Free プランでも Read and Write は可能

2. 権限を変更した場合は **Access Token を再生成** してください

### 6. Elevated Access の申請（推奨）

Free プランでも動作しますが、Elevated Access（無料）を取得すると安定します：

1. Developer Portal の左メニューから **Products** → **Twitter API v2**
2. **Elevated** の **Apply** をクリック
3. フォームに記入：
   - **What's your use case?**: Building a bot
   - **Describe your use case**: Weather forecast bot that tweets daily weather maps
   - その他の質問に英語で簡潔に回答

⚠️ 申請は通常数時間～数日で承認されます

---

## 🔐 GitHub Secrets の設定

取得したキーをGitHub Secretsに登録します。

### リポジトリの Settings へ移動

```
https://github.com/MaekawaAo0604/tenpayoho/settings/secrets/actions
```

### New repository secret で4つ追加

| Secret名 | 値 |
|---------|-----|
| `TWITTER_API_KEY` | API Key (Consumer Key) |
| `TWITTER_API_SECRET` | API Secret (Consumer Secret) |
| `TWITTER_ACCESS_TOKEN` | Access Token |
| `TWITTER_ACCESS_SECRET` | Access Secret |

---

## 🧪 ローカルでのテスト

`.env` ファイルを作成（`.env.example` をコピー）:

```bash
cp .env.example .env
```

`.env` に取得したキーを入力:

```env
TWITTER_API_KEY=your_api_key_here
TWITTER_API_SECRET=your_api_secret_here
TWITTER_ACCESS_TOKEN=your_access_token_here
TWITTER_ACCESS_SECRET=your_access_secret_here
```

テスト実行:

```bash
# 画像生成のみ
npm run generate

# スケジューラー起動（即座に実行）
RUN_IMMEDIATELY=true npm start
```

---

## ❗ トラブルシューティング

### 403 Forbidden エラー

**原因**: App permissions が Read only になっている

**対処法**:
1. Developer Portal → アプリの Settings
2. **User authentication settings** → Edit
3. **App permissions** を **Read and Write** に変更
4. **Access Token を再生成**
5. GitHub Secrets を新しいトークンで更新

### 401 Unauthorized エラー

**原因**: API Key/Secret または Access Token/Secret が間違っている

**対処法**:
1. Developer Portal でキーを再確認
2. 必要に応じて再生成
3. GitHub Secrets を更新

### Rate Limit エラー

**原因**: APIの使用制限に達した

**対処法**:
- Free プラン: 月間1500ツイートまで
- Elevated: 月間100,000ツイートまで
- 1日1回の投稿なら問題なし

### Media upload エラー

**原因**: 画像サイズが大きすぎる（5MB制限）

**対処法**:
- 現在の実装では問題なし（天パマップは通常500KB以下）

---

## 📊 API使用制限（2024年時点）

| プラン | ツイート数/月 | メディアアップロード | 費用 |
|--------|--------------|-------------------|------|
| Free | 1,500 | 可能 | 無料 |
| Basic | 3,000 | 可能 | $100/月 |
| Elevated | 100,000 | 可能 | 無料（審査必要） |

**天パbot**: 1日1回投稿 = 月30回 → **Free プランで十分!**

---

## ✅ セットアップ完了チェックリスト

- [ ] Twitter Developer Portal でアプリ作成
- [ ] API Key と API Secret を取得
- [ ] Access Token と Access Secret を生成
- [ ] App permissions が Read and Write
- [ ] GitHub Secrets に4つのキーを登録
- [ ] ローカルでテスト実行成功
- [ ] GitHub Actions で手動実行成功

すべてチェックできたら準備完了です！🎉
