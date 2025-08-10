# MedalBank API サーバー

MedalBank MVP版のバックエンドAPIサーバーです。

## 📋 概要

- **技術スタック**: Node.js + Express.js + SQLite3
- **目的**: メダル管理システムのAPI提供
- **開発フェーズ**: MVP（Minimum Viable Product）
- **ポート**: 8000

## 🚀 クイックスタート

### 1. 依存関係インストール
```bash
cd medalbank-api
npm install
```

### 2. サーバー起動
```bash
# 通常起動
npm start

# 開発モード（ファイル変更時自動再起動）
npm run dev
```

### 3. 動作確認
```bash
# ヘルスチェック
curl http://localhost:8000/health

# テストユーザーの残高確認
curl http://localhost:8000/api/balance/1
```

## 📚 API仕様書

### 基本情報
- **ベースURL**: `http://localhost:8000`
- **レスポンス形式**: JSON
- **文字エンコーディング**: UTF-8

### エンドポイント一覧

#### 🏥 ヘルスチェック
```
GET /health
```
**説明**: サーバーの動作状況を確認

**レスポンス例**:
```json
{
  "status": "OK",
  "message": "MedalBank API is running!",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

#### 💰 残高取得
```
GET /api/balance/:userId
```
**説明**: 指定ユーザーの現在のメダル残高を取得

**パラメータ**:
- `userId` (必須): ユーザーID（数値）

**レスポンス例**:
```json
{
  "user_id": 1,
  "username": "testuser", 
  "total_balance": 1500,
  "updated_at": "2024-01-01 12:00:00",
  "message": "残高取得成功"
}
```

#### 🔐 ログイン
```
POST /api/auth/login
```
**説明**: ユーザー認証（MVP版は簡易実装）

**リクエストボディ**:
```json
{
  "username": "testuser"
}
```

**レスポンス例**:
```json
{
  "message": "ログイン成功",
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com"
  },
  "token": "mvp_token_1_1638360000000",
  "expires_in": "24h"
}
```

#### 💳 入金・払い出し
```
POST /api/transactions
```
**説明**: メダルの入金または払い出し処理

**リクエストボディ**:
```json
{
  "user_id": 1,
  "type": "deposit",     // "deposit" | "withdraw"
  "amount": 500,
  "description": "入金"  // 任意
}
```

**レスポンス例**:
```json
{
  "transaction_id": 1,
  "user_id": 1,
  "type": "deposit",
  "amount": 500,
  "balance_before": 1000,
  "balance_after": 1500,
  "message": "入金が完了しました"
}
```

#### 📊 取引履歴
```
GET /api/transactions?userId=1&limit=10
```
**説明**: ユーザーの取引履歴を取得

**クエリパラメータ**:
- `userId` (必須): ユーザーID
- `limit` (任意): 取得件数（デフォルト10）

**レスポンス例**:
```json
{
  "user_id": 1,
  "transactions": [
    {
      "id": 1,
      "type": "deposit",
      "amount": 500,
      "balance_before": 1000,
      "balance_after": 1500,
      "description": "入金",
      "created_at": "2024-01-01 12:00:00"
    }
  ],
  "count": 1,
  "message": "取引履歴取得成功"
}
```

#### 👋 ログアウト
```
POST /api/auth/logout
```
**説明**: ログアウト処理

**レスポンス例**:
```json
{
  "message": "ログアウト完了",
  "logout_time": "2024-01-01T12:00:00.000Z"
}
```

## 🗄️ データベース構造

### users テーブル
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,  -- ユーザーID
  username TEXT NOT NULL UNIQUE,         -- ユーザー名
  email TEXT NOT NULL,                   -- メールアドレス
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### balance テーブル
```sql
CREATE TABLE balance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,              -- ユーザーID（外部キー）
  amount INTEGER DEFAULT 0,              -- メダル残高
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### transactions テーブル
```sql
CREATE TABLE transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,  -- 取引ID
  user_id INTEGER NOT NULL,              -- ユーザーID（外部キー）
  type TEXT NOT NULL CHECK(type IN ('deposit', 'withdraw')), -- 取引種別
  amount INTEGER NOT NULL,               -- 取引金額
  balance_before INTEGER NOT NULL,       -- 取引前残高
  balance_after INTEGER NOT NULL,        -- 取引後残高
  description TEXT,                      -- 取引説明
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## 🧪 テストデータ

### デフォルトユーザー
- **ユーザーID**: 1
- **ユーザー名**: testuser
- **メール**: test@example.com
- **初期残高**: 1000メダル

### テストコマンド例
```bash
# 残高確認
curl http://localhost:8000/api/balance/1

# ログイン
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser"}'

# 入金（500メダル）
curl -X POST http://localhost:8000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"type":"deposit","amount":500,"description":"テスト入金"}'

# 払い出し（200メダル）
curl -X POST http://localhost:8000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"type":"withdraw","amount":200,"description":"テスト払い出し"}'

# 取引履歴確認
curl "http://localhost:8000/api/transactions?userId=1&limit=5"
```

## 📁 ファイル構造

```
medalbank-api/
├── server.js           # メインサーバーファイル
├── database.js         # データベース初期化・接続
├── package.json        # Node.js設定
├── .env               # 環境設定
├── README.md          # このファイル
├── medalbank.db       # SQLiteデータベースファイル
└── routes/            # APIエンドポイント定義
    ├── auth.js        # 認証関連API
    ├── balance.js     # 残高関連API
    └── transactions.js # 取引関連API
```

## 🔧 環境設定

### .env ファイル
```env
PORT=8000
NODE_ENV=development
DB_PATH=./medalbank.db
FRONTEND_URL=http://localhost:3000
```

## ⚠️ MVP版の制限事項

### セキュリティ
- パスワード認証なし（ユーザー名のみ）
- JWT認証なし（固定トークン）
- セッション管理なし
- HTTPS未対応

### 機能
- 単一ユーザー対応（testuser のみ）
- 基本的なバリデーションのみ
- エラーハンドリング最小限
- ログ機能最小限

### 今後の改善予定
- 本格的な認証システム
- 複数ユーザー対応
- セキュリティ強化
- 詳細なログ・監視機能

## 🐛 トラブルシューティング

### サーバーが起動しない
1. ポート8000が使用中でないか確認
   ```bash
   lsof -i :8000
   ```

2. 依存関係を再インストール
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### データベースエラー
1. データベースファイルを削除して再作成
   ```bash
   rm medalbank.db
   npm start  # 自動でテーブル・テストデータが作成される
   ```

### API接続エラー
1. CORSエラーの場合、フロントエンドのURLを確認
2. .envファイルのFRONTEND_URLを更新

## 📞 サポート

- 開発者: 鈴木（バックエンド担当）
- 関連ファイル: `DEVELOPMENT_PLAN.md`、`MVP_ONE_WEEK_PLAN.md`