import { Octokit } from "@octokit/rest";

/**
 * GitHub IssueからClaudeが生成したツイート文を取得
 * @param {string} owner - リポジトリオーナー
 * @param {string} repo - リポジトリ名
 * @param {string} token - GitHub Personal Access Token
 * @returns {Promise<string|null>} - 取得したツイート文、または null
 */
export async function fetchTweetFromIssue(owner, repo, token) {
  const octokit = new Octokit({ auth: token });

  try {
    // tweet-generationラベルがついた最新のIssueを取得
    const { data: issues } = await octokit.rest.issues.listForRepo({
      owner,
      repo,
      labels: "tweet-generation",
      state: "open",
      sort: "created",
      direction: "desc",
      per_page: 1,
    });

    if (issues.length === 0) {
      console.log("⚠️ tweet-generation ラベルのIssueが見つかりません");
      return null;
    }

    const issue = issues[0];
    console.log(`📋 Issue #${issue.number} を確認中...`);

    // Issueのコメントを取得
    const { data: comments } = await octokit.rest.issues.listComments({
      owner,
      repo,
      issue_number: issue.number,
    });

    if (comments.length === 0) {
      console.log("⚠️ Claudeの応答がまだありません");
      return null;
    }

    // 最新のコメントからコードブロック内のテキストを抽出
    const latestComment = comments[comments.length - 1];
    const codeBlockMatch = latestComment.body.match(/```(?:\w+)?\n([\s\S]*?)```/);

    if (!codeBlockMatch) {
      console.log("⚠️ コードブロックが見つかりません");
      return null;
    }

    const tweetText = codeBlockMatch[1].trim();
    console.log("✅ ツイート文を取得しました:");
    console.log("---");
    console.log(tweetText);
    console.log("---");

    // Issueをクローズ
    await octokit.rest.issues.update({
      owner,
      repo,
      issue_number: issue.number,
      state: "closed",
    });
    console.log(`✅ Issue #${issue.number} をクローズしました`);

    return tweetText;
  } catch (error) {
    console.error("❌ GitHub API エラー:", error.message);
    return null;
  }
}
