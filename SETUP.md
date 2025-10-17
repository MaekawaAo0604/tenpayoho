# セットアップガイド

## 動作環境の選択

このプロジェクトは**2つの動作環境**をサポートしています:

### 🌐 GitHub Actions（推奨）
- サーバー不要、完全クラウド動作
- 無料（パブリックリポジトリ）
- メンテナンス不要

### 💻 ローカル/サーバー常駐
- 自前サーバーで24時間稼働
- より柔軟な制御が可能

---

## 🌐 GitHub Actionsでの設定

### 1. Twitter API の取得

**[TWITTER_API_SETUP.md](TWITTER_API_SETUP.md) を参照してください**

1. Twitter Developer Portal でアプリ作成
2. API Key, API Secret, Access Token, Access Secret を取得
3. App permissions を **Read and Write** に設定

### 2. リポジトリSecretsの設定

GitHubリポジトリの **Settings > Secrets and variables > Actions** で以下を登録:

| Secret名 | 値 |
|---------|-----|
| `TWITTER_API_KEY` | API Key (Consumer Key) |
| `TWITTER_API_SECRET` | API Secret (Consumer Secret) |
| `TWITTER_ACCESS_TOKEN` | Access Token |
| `TWITTER_ACCESS_SECRET` | Access Secret |

### 3. GitHub Pagesの有効化

**Settings > Pages** で:
- Source: Deploy from a branch
- Branch: `gh-pages` / `root`
- Save

### 4. ワークフローの有効化

`.github/workflows/publish-and-tweet.yml` が自動実行されます:
- 毎日JST 7:30に画像生成 → Twitter投稿 → GitHub Pages公開
- 手動実行: **Actions** タブから `workflow_dispatch`

### 5. 動作確認

1. **Actions** タブで実行ログを確認
2. Twitter投稿を確認
3. `https://<username>.github.io/<repo-name>/forecast/latest.png` で画像確認

---

## 💻 ローカル/サーバー常駐での設定

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. 環境変数の設定

```bash
cp .env.example .env
```

`.env` を編集:

```env
TWITTER_API_KEY=your_api_key_here
TWITTER_API_SECRET=your_api_secret_here
TWITTER_ACCESS_TOKEN=your_access_token_here
TWITTER_ACCESS_SECRET=your_access_secret_here
SCHEDULE_TIME=0 8 * * *
RUN_IMMEDIATELY=false
```

### 3. テスト実行

```bash
# 画像生成のみテスト
npm run generate

# スケジューラー起動（即座に実行してテスト）
RUN_IMMEDIATELY=true npm start
```

### 4. 本番運用

#### 方法1: PM2で常駐（推奨）

```bash
# PM2インストール
npm install -g pm2

# 起動
pm2 start src/scheduler.js --name tenpa-bot

# 自動起動設定
pm2 startup
pm2 save

# ログ確認
pm2 logs tenpa-bot

# 停止
pm2 stop tenpa-bot
```

#### 方法2: systemdで常駐（Linux）

`/etc/systemd/system/tenpa-bot.service` を作成:

```ini
[Unit]
Description=Tenpa Weather Forecast Bot
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/tenpa-map
ExecStart=/usr/bin/node src/scheduler.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

有効化:

```bash
sudo systemctl enable tenpa-bot
sudo systemctl start tenpa-bot
sudo systemctl status tenpa-bot
```

---

## トラブルシューティング

### GitHub Actions: Twitter投稿失敗（403 Forbidden）

**原因**: App permissions が Read only になっている

**対処法**:
1. Developer Portal → アプリの Settings
2. **User authentication settings** → Edit
3. **App permissions** を **Read and Write** に変更
4. Access Token を再生成
5. GitHub Secrets を更新

### Twitter API エラー（401 Unauthorized）

**原因**: API Key/Secret または Access Token/Secret が間違っている

**対処法**:
1. Developer Portal でキーを再確認
2. 必要に応じて再生成
3. GitHub Secrets/ローカル .env を更新

### 画像が生成されない

1. `assets/japan_map_base.png` の存在確認
2. Open-Meteo APIのレスポンス確認:
   ```bash
   curl "https://api.open-meteo.com/v1/forecast?latitude=35.6895&longitude=139.6917&hourly=relative_humidity_2m"
   ```

---

## 投稿時刻の変更

### GitHub Actions

`.github/workflows/publish-and-tweet.yml` の `cron` を編集:

```yaml
schedule:
  - cron: "30 22 * * *" # UTC時刻（JSTは+9時間）
```

**例**:
- JST 8:00 → UTC 23:00前日 → `0 23 * * *`
- JST 12:00 → UTC 03:00 → `0 3 * * *`

### ローカル常駐

`.env` の `SCHEDULE_TIME` を編集:

```env
SCHEDULE_TIME=0 8 * * *  # 毎日8時
```

---

## セキュリティ注意事項

- `.env` ファイルは絶対にGitにコミットしない
- Twitter認証情報は厳重に管理
- 本番環境では `headless: true` を推奨（自動設定済み）
- 2段階認証を有効にしている場合はアプリパスワードを利用

---

## どちらの環境を選ぶべきか

| 項目 | GitHub Actions | ローカル/サーバー |
|------|----------------|------------------|
| コスト | 無料 | サーバー代 |
| メンテナンス | 不要 | 必要 |
| 柔軟性 | 制約あり | 高い |
| 初期設定 | 簡単 | やや複雑 |
| おすすめ | 個人プロジェクト | 商用/高頻度投稿 |

**結論**: まずはGitHub Actionsで試して、必要に応じてローカル運用に移行するのが推奨です。
