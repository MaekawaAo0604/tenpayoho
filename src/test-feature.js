/**
 * テスト用の新機能
 * ユーザーデータを処理する関数
 */

// ユーザー情報を取得する関数
function getUserData(userId) {
  // データベースから取得（仮実装）
  const users = {
    1: { name: "太郎", age: 25, email: "taro@example.com" },
    2: { name: "花子", age: 30, email: "hanako@example.com" },
  };

  return users[userId];
}

// ユーザー情報を表示する関数
function displayUser(userId) {
  const user = getUserData(userId);

  // ユーザーが見つからない場合の処理
  if (!user) {
    console.log("ユーザーが見つかりません");
    return;
  }

  // 情報を表示
  console.log("名前: " + user.name);
  console.log("年齢: " + user.age);
  console.log("メール: " + user.email);
}

// メールアドレスのバリデーション
function validateEmail(email) {
  // 簡易的なメールチェック
  return email.includes("@");
}

// ユーザーを追加する関数
function addUser(name, age, email) {
  // バリデーション
  if (!name || !age || !email) {
    throw new Error("必須項目が入力されていません");
  }

  if (!validateEmail(email)) {
    throw new Error("メールアドレスが無効です");
  }

  // ユーザーを追加（実装は省略）
  console.log("ユーザーを追加しました: " + name);
  return true;
}

module.exports = {
  getUserData,
  displayUser,
  validateEmail,
  addUser,
};
