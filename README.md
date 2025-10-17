# 天パ天気予報 Twitter 自動投稿システム

天気データから「天パ指数」地図画像を生成し、毎日決まった時間にTwitterへ自動投稿するシステムです。

## 機能

- 全国主要都市（札幌、仙台、東京、名古屋、大阪、福岡）の天パ指数マップを生成
- 天気API（Open-Meteo）から湿度・露点・降水確率を取得
- 天パ指数を4段階（低・中・高・危険）で可視化
- スケジュール機能で毎日自動実行
- Playwrightを使ってTwitterに自動投稿

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Playwrightブラウザのインストール

```bash
npx playwright install chromium
```

### 3. 環境変数の設定

`.env.example` をコピーして `.env` を作成し、Twitter認証情報を設定します。

```bash
cp .env.example .env
```

`.env` ファイルを編集:

```env
# Twitter認証情報
TWITTER_EMAIL=your-email@example.com
TWITTER_USERNAME=your_twitter_username
TWITTER_PASSWORD=your_twitter_password

# スケジュール設定（cron形式）
SCHEDULE_TIME=0 8 * * *

# 即座に実行（デバッグ用）
RUN_IMMEDIATELY=false
```

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
│   ├── index.js           # 天パ地図生成メイン処理
│   ├── twitter-post.js    # Twitter投稿処理
│   └── scheduler.js       # スケジューラー
├── assets/
│   └── japan_map_base.png # 日本地図画像
├── icons/
│   ├── low.png           # 低指数アイコン
│   ├── med.png           # 中指数アイコン
│   ├── high.png          # 高指数アイコン
│   └── danger.png        # 危険指数アイコン
├── out/                  # 生成された画像の保存先
├── .env                  # 環境変数（要作成）
├── .env.example          # 環境変数サンプル
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
- Twitter認証情報は厳重に管理してください
- 本番環境では `headless: true` に設定することを推奨

### Twitter認証

- 2段階認証を有効にしている場合、アプリパスワードの利用が必要な場合があります
- Twitterのログインフローは変更される可能性があるため、動作しない場合はセレクタの調整が必要です

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

### Playwrightがブラウザを起動できない

```bash
npx playwright install chromium --with-deps
```

### Twitter投稿が失敗する

1. `.env` の認証情報を確認
2. `src/twitter-post.js` の `headless: false` でブラウザの動作を目視確認
3. エラー時のスクリーンショット `out/twitter-error.png` を確認

### 画像が生成されない

1. `assets/japan_map_base.png` が存在するか確認
2. `icons/` ディレクトリにアイコン画像があるか確認
3. Open-Meteo APIが正常にレスポンスを返しているか確認

## ライセンス

ISC

## 作者

天パbot開発チーム
