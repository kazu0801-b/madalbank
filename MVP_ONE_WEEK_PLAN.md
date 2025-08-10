# 🚀 MedalBank MVP - 1週間リリース計画

**目標**: 1週間で最低限の機能を持つMVPをリリースする

## 🎯 MVP機能範囲（最小限）

### ✅ 実装する機能
1. **ユーザー認証**（簡単版）
   - ハードコードユーザーでログイン
   - セッション管理

2. **残高表示**
   - 固定ユーザーの残高表示
   - リアルタイム更新

3. **入金・払い出し**
   - 基本的な増減機能
   - 簡単なバリデーション

4. **取引履歴**
   - 最新10件表示
   - シンプルなリスト

### ❌ 今回は実装しない機能
- ユーザー登録機能
- 複数ユーザー対応
- 有効期限管理
- 管理者機能
- CSV出力
- 複雑なエラーハンドリング
- 本格的なセキュリティ
- デプロイ

## 🛠 技術スタック（最小構成）

### フロントエンド
- **Next.js 15** + TypeScript
- **Tailwind CSS** （既存設定使用）
- **shadcn/ui** （必要最低限のコンポーネントのみ）
- **認証**: 簡易セッション（NextAuth.js使わず）

### バックエンド
- **Node.js** + **Express** （Goではなく慣れてるNode.js）
- **SQLite** （ファイルベース、設定簡単）
- **JWT** なし → **シンプルなセッション**

### なぜ技術変更？
- **Go学習時間を節約** → Node.js/Expressで高速開発
- **Next.jsチームが慣れてる**技術で確実にリリース
- **MVPリリース後**にGoに移行も可能

## 📅 1週間スケジュール

### Day 1 (月) - 基盤構築
**鈴木担当:**
- Express + SQLite バックエンド構築
- 基本API（残高取得）作成
- テストユーザーデータ作成

**森川担当:**
- フロントエンド基本レイアウト
- ログイン画面UI作成
- 残高表示コンポーネント

**成果物:**
- バックエンド起動確認
- フロントエンド基本画面表示

### Day 2 (火) - コア機能実装
**鈴木担当:**
- 入金・払い出しAPI実装
- 取引履歴API実装
- 簡易認証機能

**森川担当:**
- 入金・払い出しフォーム
- 取引履歴表示
- API連携テスト

**成果物:**
- 全API動作確認
- フロント・バック連携完了

### Day 3 (水) - 統合・調整
**両者合同:**
- フロント・バック統合テスト
- UI/UX調整
- エラー処理追加

**成果物:**
- 基本機能完全動作
- 簡単なエラーハンドリング

### Day 4 (木) - 品質向上
**鈴木担当:**
- バリデーション強化
- レスポンス形式統一
- 簡単なログ機能

**森川担当:**
- UIデザイン改善
- レスポンシブ対応
- ローディング状態追加

**成果物:**
- 品質向上版完成
- ユーザビリティ改善

### Day 5 (金) - 最終調整・リリース
**両者合同:**
- 最終動作確認
- バグ修正
- 簡単なデプロイ（Vercel + Railway）

**成果物:**
- **MVP完成・リリース** 🎉

### Day 6-7 (土日) - 予備日
- バグ修正
- 小さな改善
- 次のイテレーション計画

## 🏗 アーキテクチャ（簡易版）

```
┌─────────────────┐     HTTP Request      ┌─────────────────┐
│   Frontend      │  ───────────────→    │    Backend      │
│   (Next.js)     │                      │   (Express)     │
│   Port: 3000    │  ←─────────────────    │   Port: 8000    │
└─────────────────┘     JSON Response     └─────────────────┘
                                                   │
                                                   ▼
                                          ┌─────────────────┐
                                          │     SQLite      │
                                          │  (medalbank.db) │
                                          └─────────────────┘
```

## 📋 具体的な実装手順

### 1. バックエンド構築（Node.js/Express）

#### 1-1. プロジェクトセットアップ
```bash
mkdir medalbank-api
cd medalbank-api
npm init -y

# 必要最低限のパッケージ
npm install express sqlite3 cors dotenv
npm install -D nodemon @types/node typescript
```

#### 1-2. 基本構造
```
medalbank-api/
├── server.js           # メインサーバー
├── database.js         # DB接続・初期化
├── routes/
│   ├── auth.js        # 認証
│   ├── balance.js     # 残高
│   └── transactions.js # 取引
└── medalbank.db       # SQLiteファイル
```

#### 1-3. server.js（シンプル版）
```javascript
const express = require('express')
const cors = require('cors')
const { initDatabase } = require('./database')

const app = express()
const PORT = 8000

// ミドルウェア
app.use(cors())
app.use(express.json())

// DB初期化
initDatabase()

// 基本テスト
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'MedalBank API is running!' })
})

// API routes
app.use('/api/auth', require('./routes/auth'))
app.use('/api/balance', require('./routes/balance'))
app.use('/api/transactions', require('./routes/transactions'))

app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`)
})
```

### 2. データベース設計（最小限）

#### 2-1. テーブル設計
```sql
-- users（今回は固定1ユーザーのみ）
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  email TEXT NOT NULL
);

-- balance（シンプル版）
CREATE TABLE balance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  amount INTEGER DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- transactions（基本版）
CREATE TABLE transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('deposit', 'withdraw')),
  amount INTEGER NOT NULL,
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### 2-2. 初期データ
```sql
-- テストユーザー
INSERT INTO users (username, email) VALUES ('testuser', 'test@example.com');

-- 初期残高
INSERT INTO balance (user_id, amount) VALUES (1, 1000);
```

### 3. API設計（最小限）

```
GET  /api/balance/1          # 残高取得
POST /api/transactions       # 入金・払い出し
GET  /api/transactions       # 履歴取得（最新10件）
POST /api/auth/login         # 簡易ログイン
```

### 4. フロントエンド（最小限）

#### 4-1. 画面構成
1. **ログイン画面** (`/login`)
   - ユーザー名入力のみ（パスワードなし）
   - 固定で "testuser" が使用可能

2. **メイン画面** (`/dashboard`)
   - 現在残高表示
   - 入金・払い出しボタン
   - 取引履歴（最新5件）

#### 4-2. 必要コンポーネント
```typescript
// 最小限のコンポーネント
- LoginForm          # ログインフォーム
- BalanceCard        # 残高表示
- TransactionForm    # 入金・払い出し
- TransactionList    # 取引履歴
- Layout            # 基本レイアウト
```

## 🎨 UI設計（最小限）

### ログイン画面
```
┌─────────────────────────┐
│      MedalBank MVP      │
├─────────────────────────┤
│  Username: [testuser  ] │
│  [      ログイン      ]  │
└─────────────────────────┘
```

### メイン画面
```
┌─────────────────────────┐
│  現在の残高: 1,500 メダル │
├─────────────────────────┤
│  [入金]  [払い出し]      │
├─────────────────────────┤
│  取引履歴:              │
│  ・入金 +500 (今日)      │
│  ・払い出し -200 (昨日)  │
│  ・入金 +1000 (昨日)     │
└─────────────────────────┘
```

## 🚧 制限事項（MVP版）

### セキュリティ
- 本格的な認証なし
- パスワード暗号化なし
- HTTPS未対応

### 機能
- ユーザー1人のみ
- エラーハンドリング最小限
- バリデーション基本のみ

### 運用
- ローカル開発環境のみ
- バックアップ機能なし
- ログ機能最小限

## 🎯 成功定義

### Day 5 の終わりまでに：
1. **ログイン → メイン画面表示**
2. **残高が正確に表示**される
3. **入金・払い出しが動作**する
4. **取引履歴が表示**される
5. **基本的なエラーが出ない**

### デモ可能な状態：
- 「残高1000メダルから500メダル入金して1500メダルになる」
- 「履歴に取引が記録される」
- 「見た目がある程度整っている」

## 🚀 リリース後の拡張計画

### Week 2-3: セキュリティ・UX改善
- 本格的な認証実装
- エラーハンドリング強化
- UI/UXブラッシュアップ

### Week 4-5: 高度機能
- 複数ユーザー対応
- 有効期限管理
- CSV出力

### Week 6-7: 本格運用
- Go言語への移行（希望があれば）
- 本番デプロイ
- 監視・ログ

これなら**1週間で確実に動くMVP**ができます！技術的な難易度を下げて、機能を絞ることで現実的なスケジュールにしました。

どうでしょうか？この方針で進めますか？