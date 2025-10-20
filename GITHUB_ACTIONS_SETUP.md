# GitHub Actions + Claude Code セットアップガイド

GitHub ActionsとClaude Codeを使って、Claudeに自動でツイート文を生成させる方法を説明します。

## 仕組み

```
1. GitHub Actions (毎日7時) → Issueを自動作成
2. Claude Code Action → Issueにツイート文を生成して返信
3. スケジューラー (毎日8時) → Issueから取得 → Twitter投稿
```

## セットアップ手順

### 1. GitHubリポジトリの準備

このプロジェクトをGitHubにプッシュします:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/tenpa-map.git
git push -u origin main
```

### 2. Claude Code OAuth トークンの取得（ClaudeMax使用）

**ClaudeMaxサブスクリプションを使用する場合（従量課金なし）:**

1. ターミナルで以下のコマンドを実行:
   ```bash
   claude setup-token
   ```

2. ブラウザが開くので、表示されたコードをコピー

3. ターミナルに戻り、コードを貼り付けてEnter

4. `sk-`で始まるトークンが生成されます

**または、従量課金APIキーを使用する場合:**

1. [Anthropic Console](https://console.anthropic.com/) にアクセス
2. API Keys → Create Key
3. キーをコピー（`sk-ant-api03-...`形式）

### 3. GitHub Secretsの設定

リポジトリの Settings → Secrets and variables → Actions で以下を追加:

**ClaudeMaxを使用する場合:**

| Secret名 | 値 | 説明 |
|---------|-----|------|
| `CLAUDE_CODE_OAUTH_TOKEN` | `sk-...` | `claude setup-token`で生成したトークン |

**従量課金APIを使用する場合:**

| Secret名 | 値 | 説明 |
|---------|-----|------|
| `ANTHROPIC_API_KEY` | `sk-ant-api03-...` | Anthropic APIキー |

### 4. Claude Code Actionの有効化

リポジトリで以下を確認:

1. Settings → Actions → General
2. "Allow all actions and reusable workflows" を選択
3. "Read and write permissions" を有効化

### 5. ローカル環境の設定（投稿実行用）

`.env`ファイルを作成して設定:

```env
# Twitter API認証情報
TWITTER_API_KEY=your_api_key_here
TWITTER_API_SECRET=your_api_secret_here
TWITTER_ACCESS_TOKEN=your_access_token_here
TWITTER_ACCESS_SECRET=your_access_secret_here

# GitHub設定（Issue取得用）
GITHUB_OWNER=your_username
GITHUB_REPO=tenpa-map
GITHUB_TOKEN=ghp_your_token_here

# スケジュール設定
SCHEDULE_TIME=0 8 * * *
```

**GitHub Tokenの取得方法:**
1. https://github.com/settings/tokens にアクセス
2. "Generate new token" → "Classic"
3. `repo` 権限にチェック
4. トークンをコピー

### 6. 依存関係のインストール

```bash
npm install
```

## 使い方

### 手動テスト

#### 1. Issueを手動作成してテスト

GitHub ActionsのUIから手動実行:

1. リポジトリの Actions タブ
2. "Generate Tweet Content with Claude" を選択
3. "Run workflow" → "Run workflow"

#### 2. Claudeの応答を確認

1. Issues タブに新しいIssueが作成される
2. 数秒待つとClaudeがコメントで返信
3. コードブロック内にツイート文が記載される

#### 3. ローカルで投稿テスト

```bash
npm start
```

### 自動運用

以下のスケジュールで自動実行されます:

- **毎日7時(JST)**: GitHub ActionsがIssueを作成
- **数秒後**: Claude Codeが投稿文を生成
- **毎日8時(JST)**: スケジューラーがIssueから取得してTwitter投稿

## フォールバック機能

GitHub Issueから取得できない場合、以下の順で代替処理:

1. Claude API(ANTHROPIC_API_KEY使用)で生成
2. デフォルトの投稿文を使用

## トラブルシューティング

### Issueが作成されない

- Actions → ワークフローの実行ログを確認
- Settings → Actions → General の権限を確認

### Claudeが応答しない

- `CLAUDE_CODE_OAUTH_TOKEN`（または`ANTHROPIC_API_KEY`）がSecretsに正しく設定されているか確認
- Issue に `tweet-generation` ラベルが付いているか確認
- ワークフローファイルで正しいシークレット名を参照しているか確認

### Issueから取得できない

- `.env` の `GITHUB_TOKEN` が正しいか確認
- トークンに `repo` 権限があるか確認
- `GITHUB_OWNER` と `GITHUB_REPO` が正しいか確認

## ワークフローファイル

### `.github/workflows/generate-tweet-content.yml`
毎日7時にIssueを作成

### `.github/workflows/claude-code.yml`
ClaudeがIssueに応答

## セキュリティ注意事項

- **Secretsを絶対にコミットしない**
- GitHub Tokenは最小限の権限のみ付与
- 定期的にトークンをローテーション

## コスト

- **GitHub Actions**: 無料枠内（月2000分まで）
- **Claude API**: 従量課金（1日1回なら月数十円程度）
- **Twitter API**: 無料プラン可

## 参考リンク

- [Claude Code GitHub Actions](https://github.com/anthropics/claude-code-action)
- [GitHub Actions ドキュメント](https://docs.github.com/ja/actions)
- [Anthropic API ドキュメント](https://docs.anthropic.com/)
