# Claude PR Review セットアップガイド

ClaudeMaxを使ってプルリクエストを自動レビューする機能のセットアップ手順です。

## 📋 概要

ClaudeがPRを自動的にレビューし、以下を提供します：

- コード品質の確認
- セキュリティ上の懸念点の指摘
- パフォーマンス改善の提案
- ベストプラクティスへの準拠確認
- テストの網羅性チェック

## 🚀 セットアップ

### 1. GitHub Secretsの設定

`CLAUDE_CODE_OAUTH_TOKEN` が既に設定済みであれば、追加の設定は不要です。

まだ設定していない場合：

1. ターミナルで以下のコマンドを実行:
   ```bash
   claude setup-token
   ```

2. ブラウザが開くので、認証コードをコピー

3. ターミナルに戻り、コードを貼り付けてEnter

4. 生成された `sk-` で始まるトークンをコピー

5. GitHubリポジトリの **Settings** → **Secrets and variables** → **Actions**

6. **New repository secret** をクリック:
   - Name: `CLAUDE_CODE_OAUTH_TOKEN`
   - Secret: コピーしたトークン

7. **Add secret** をクリック

### 2. ワークフローファイルの確認

以下のワークフローファイルが作成されています：

#### `.github/workflows/claude-pr-review.yml`
- **トリガー**: PR作成・更新、PRへのコメント
- **動作**: `@claude` メンションで対話的にレビュー
- **用途**: 特定の部分について質問したい場合

#### `.github/workflows/claude-auto-review.yml`
- **トリガー**: PR作成・更新時に自動実行
- **動作**: 自動的に包括的なレビューを実施
- **用途**: すべてのPRに対して自動レビュー

## 📖 使い方

### 方法1: 自動レビュー

PRを作成または更新すると、自動的にClaudeがレビューを開始します。

1. 新しいブランチを作成して変更をコミット
2. PRを作成
3. 数分待つとClaudeがコメントでレビュー結果を投稿

### 方法2: 対話的レビュー（@claudeメンション）

PRのコメント欄で `@claude` とメンションして質問できます。

**例**:
```
@claude このロジックで問題ないか確認してください
```

```
@claude セキュリティ上の懸念点をチェックしてください
```

```
@claude このパフォーマンス最適化について意見をください
```

### 方法3: セキュリティレビュー

セキュリティに特化したレビューも可能です：

```
@claude /security-review
```

## 🎯 レビュー項目

Claudeは以下の観点でレビューします：

### 1. コード品質
- バグや潜在的な問題
- コードの可読性と保守性
- 命名規則の適切性

### 2. セキュリティ
- セキュリティ上の懸念点
- 脆弱性の可能性（SQL injection、XSS、etc.）

### 3. パフォーマンス
- パフォーマンス上の問題
- 最適化の余地

### 4. ベストプラクティス
- コーディング規約への準拠
- プロジェクトの既存パターンとの整合性

### 5. テスト
- テストの網羅性
- エッジケースの考慮

## ⚙️ カスタマイズ

### 自動レビューのプロンプトをカスタマイズ

`.github/workflows/claude-auto-review.yml` の `prompt` セクションを編集してください。

例：セキュリティ重視のレビュー
```yaml
prompt: |
  セキュリティの観点からこのPRをレビューしてください。
  特に以下の点に注意してください：
  - SQL injection
  - XSS
  - 認証・認可の問題
  - 機密情報の漏洩
```

### レビュー頻度の調整

自動レビューが不要な場合、`.github/workflows/claude-auto-review.yml` を削除するか、以下のように条件を追加：

```yaml
jobs:
  auto-review:
    # ドラフトPRはスキップ
    if: github.event.pull_request.draft == false
    runs-on: ubuntu-latest
```

## 🔍 トラブルシューティング

### Claudeが応答しない

1. **Actionsタブで実行ログを確認**
   - https://github.com/YOUR_USERNAME/tenpa-map/actions

2. **Secretsが正しく設定されているか確認**
   - Settings → Secrets → `CLAUDE_CODE_OAUTH_TOKEN`

3. **ワークフローファイルの構文エラー確認**
   - YAMLの構文エラーがないか確認

### レビューが遅い

- Claudeの処理には数分かかる場合があります
- 大きなPRの場合、さらに時間がかかることがあります

### レビュー品質を向上させたい

- `.github/workflows/claude-auto-review.yml` のプロンプトを具体的に
- プロジェクト固有のガイドラインをプロンプトに追加
- レビューしてほしい具体的な観点を明記

## 💡 ヒント

- **小さなPR**: 小さく分割したPRの方がレビューの質が高い
- **明確なタイトルと説明**: PRの目的を明確に記載
- **既存パターンに従う**: プロジェクトの既存コードとの一貫性を保つ
- **テストを含める**: テストがあるとレビューがより包括的に

## 🎉 利点

- **無料**: ClaudeMaxサブスクリプションで追加料金なし
- **即時フィードバック**: PR作成後すぐにレビュー開始
- **一貫性**: 毎回同じ基準でレビュー
- **学習機会**: Claudeの指摘から学べる
- **時間節約**: 基本的な問題を自動検出

## 📚 参考リンク

- [Claude Code GitHub Actions 公式ドキュメント](https://docs.claude.com/en/docs/claude-code/github-actions)
- [Anthropic Claude Code Action Repository](https://github.com/anthropics/claude-code-action)
