# 天パ天気予報 Twitter 自動投稿システム

天気データから「天パ指数」地図画像を生成し、毎日決まった時間にTwitterへ自動投稿するシステムです。

## 機能

- 全国主要都市（札幌、仙台、東京、名古屋、大阪、福岡）の天パ指数マップを生成
- 天気API（Open-Meteo）から湿度・露点・降水確率を取得
- 天パ指数を4段階（低・中・高・危険）で可視化
- **GitHub Actions + Claude Code**を使った投稿内容の自動生成
- スケジュール機能で毎日自動実行
- Twitter API v2を使って自動投稿

### 投稿文生成の仕組み

1. GitHub ActionsでIssueを自動作成
2. Claude Code ActionがIssueに投稿文を生成して返信
3. スケジューラーがIssueから投稿文を取得してTwitterに投稿

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. API キーの取得

#### Twitter API

**[TWITTER_API_SETUP.md](TWITTER_API_SETUP.md) を参照してください**

1. Twitter Developer Portal でアプリ作成
2. API Key, API Secret, Access Token, Access Secret を取得
3. App permissions を **Read and Write** に設定

詳しい手順は [TWITTER_API_SETUP.md](TWITTER_API_SETUP.md) に記載しています。

#### Claude Code (GitHub Actions経由で投稿文を自動生成) - 推奨

**[GITHUB_ACTIONS_SETUP.md](GITHUB_ACTIONS_SETUP.md) を参照してください**

GitHub ActionsとClaude Codeを使って、Claudeに自動でツイート文を生成させます。

1. GitHubリポジトリにプッシュ
2. Anthropic APIキーをGitHub Secretsに設定
3. GitHub Actionsが毎日Issueを作成
4. Claude Codeが投稿文を生成

詳しい手順は [GITHUB_ACTIONS_SETUP.md](GITHUB_ACTIONS_SETUP.md) を参照してください。

### 3. 環境変数の設定

`.env.example` をコピーして `.env` を作成し、API認証情報を設定します。

```bash
cp .env.example .env
```

`.env` ファイルを編集:

```env
# Twitter API認証情報
TWITTER_API_KEY=your_api_key_here
TWITTER_API_SECRET=your_api_secret_here
TWITTER_ACCESS_TOKEN=your_access_token_here
TWITTER_ACCESS_SECRET=your_access_secret_here

# GitHub設定（GitHub Issueから投稿文を取得する場合）
GITHUB_OWNER=your_github_username
GITHUB_REPO=tenpa-map
GITHUB_TOKEN=your_github_token_here

# スケジュール設定（cron形式）
SCHEDULE_TIME=0 8 * * *

# 即座に実行（デバッグ用）
RUN_IMMEDIATELY=false
```

**GitHub Tokenの取得:**
1. https://github.com/settings/tokens にアクセス
2. "Generate new token" → "Classic"
3. `repo` 権限にチェック
4. 生成されたトークンを設定

## 使い方

### スケジューラーを起動（常駐）

毎日指定時刻に自動実行されます。

```bash
npm start
```

デフォルトでは毎日8時に実行されます。時刻を変更するには `.env` の `SCHEDULE_TIME` を編集してください。

**cronフォーマット例:**
- `0 8 * * *` - 毎日8時
- `0 7,12,18 * * *` - 毎日7時、12時、18時
- `*/30 * * * *` - 30分ごと

### 画像のみ生成（投稿なし）

```bash
npm run generate
```

生成された画像は `out/tenpa-map-YYYYMMDD.png` に保存されます。

### テスト実行

即座に実行したい場合は、`.env` の `RUN_IMMEDIATELY=true` に設定してから起動:

```bash
npm start
```

## ディレクトリ構成

```
tenpa-map/
├── src/
│   ├── index.js             # 天パ地図生成メイン処理
│   ├── twitter-api-post.js  # Twitter投稿処理
│   ├── generate-tweet.js    # Claude APIで投稿文生成
│   └── scheduler.js         # スケジューラー
├── assets/
│   └── japan_map_base.png   # 日本地図画像
├── icons/
│   ├── low.png             # 低指数アイコン
│   ├── med.png             # 中指数アイコン
│   ├── high.png            # 高指数アイコン
│   └── danger.png          # 危険指数アイコン
├── out/                    # 生成された画像の保存先
├── .env                    # 環境変数（要作成）
├── .env.example            # 環境変数サンプル
└── package.json
```

## 天パ指数の計算方法

天パ指数は以下の要素から計算されます:

- 湿度（50%）
- 露点スコア（30%）: 露点が15°Cを超えた分×3
- 降水確率（20%）

**スコアの分類:**
- 90以上: 危険（赤）
- 70-89: 高（橙）
- 40-69: 中（黄）
- 39以下: 低（緑）

## 注意事項

### セキュリティ

- `.env` ファイルは絶対にGitにコミットしないでください
- Twitter API認証情報は厳重に管理してください
- GitHub Secretsに登録する際は、絶対に公開しないよう注意

### Twitter API

- Twitter API v2を使用（無料プランで月1,500ツイートまで）
- 1日1回の投稿なら無料プランで十分
- より高頻度の投稿が必要な場合はElevated Access（無料・審査あり）を推奨

### 実行環境

- Node.js v20以上を推奨
- Windows環境でテスト済み
- 常駐させる場合はPM2などのプロセスマネージャーの利用を推奨

## PM2での常駐実行（推奨）

```bash
# PM2をグローバルインストール
npm install -g pm2

# アプリを起動
pm2 start src/scheduler.js --name tenpa-bot

# 自動起動設定
pm2 startup
pm2 save

# ログ確認
pm2 logs tenpa-bot

# 停止
pm2 stop tenpa-bot
```

## トラブルシューティング

### Twitter API エラー（403 Forbidden）

1. Developer Portal で App permissions が **Read and Write** か確認
2. Access Token を再生成
3. GitHub Secrets を更新

### Twitter API エラー（401 Unauthorized）

1. API Key/Secret と Access Token/Secret が正しいか確認
2. 必要に応じて再生成
3. GitHub Secrets を更新

### 画像が生成されない

1. `assets/japan_map_base.png` が存在するか確認
2. `icons/` ディレクトリにアイコン画像があるか確認
3. Open-Meteo APIが正常にレスポンスを返しているか確認

## ライセンス

ISC

## 作者

天パbot開発チーム
