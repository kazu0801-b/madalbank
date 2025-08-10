# MedalBank バックエンドAPI 確認ガイド

## 📋 何を作ったのか

### 作成したもの
**MedalBank MVP版のバックエンドAPI** - メダル管理システムのサーバー部分

### 技術構成
- **言語**: Node.js + JavaScript
- **フレームワーク**: Express.js 4.x
- **データベース**: SQLite3（ファイルベース）
- **ポート**: 8000

### 提供機能
1. **ユーザー認証**（簡易版）
2. **メダル残高管理**
3. **入金・払い出し処理**
4. **取引履歴記録・表示**

## 🏗 アーキテクチャ

```
フロントエンド (Next.js:3000)
      ↕ HTTP リクエスト
バックエンドAPI (Express:8000)
      ↕ SQL クエリ
データベース (SQLite:medalbank.db)
```

### ファイル構成
```
medalbank-api/
├── server.js              # メインサーバー（起動ファイル）
├── database.js            # DB初期化・接続管理
├── medalbank.db           # SQLiteデータベースファイル
├── package.json           # Node.js設定
├── .env                   # 環境変数
└── routes/                # API エンドポイント
    ├── auth.js            # 認証API（ログイン・ログアウト）
    ├── balance.js         # 残高API（残高取得）
    └── transactions.js    # 取引API（入金・払い出し・履歴）
```

### データベース構造
```sql
users          balance         transactions
┌─────────┐    ┌─────────┐     ┌─────────────┐
│ id      │    │ user_id │────→│ user_id     │
│ username│    │ amount  │     │ type        │
│ email   │    │updated_at     │ amount      │
└─────────┘    └─────────┘     │ balance_before│
                                │ balance_after │
                                │ created_at   │
                                └─────────────┘
```

## 🔧 動作確認方法

### 前提条件
```bash
# 1. APIサーバーが起動していること
cd medalbank-api
npm start

# 2. ターミナルが2つ必要
# - サーバー起動用
# - テストコマンド実行用
```

### 基本確認手順

#### 1. サーバー正常性確認
```bash
# ヘルスチェック（サーバーが生きているか）
curl http://localhost:8000/health

# 期待されるレスポンス:
{
  "status": "OK",
  "message": "MedalBank API is running!",
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

#### 2. 認証機能確認
```bash
# ログイン（MVP版は簡易認証）
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser"}'

# 期待されるレスポンス:
{
  "message": "ログイン成功",
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com"
  },
  "token": "mvp_token_1_xxxxxxxxxx"
}
```

#### 3. 残高確認
```bash
# テストユーザー(ID=1)の現在残高を取得
curl http://localhost:8000/api/balance/1

# 期待されるレスポンス:
{
  "user_id": 1,
  "username": "testuser",
  "total_balance": 1000,  # 初期値1000メダル
  "updated_at": "2025-01-01 12:00:00",
  "message": "残高取得成功"
}
```

#### 4. 入金処理確認
```bash
# 500メダル入金
curl -X POST http://localhost:8000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"type":"deposit","amount":500,"description":"テスト入金"}'

# 期待されるレスポンス:
{
  "transaction_id": 1,
  "user_id": 1,
  "type": "deposit",
  "amount": 500,
  "balance_before": 1000,  # 入金前残高
  "balance_after": 1500,   # 入金後残高
  "message": "入金が完了しました"
}
```

#### 5. 払い出し処理確認
```bash
# 200メダル払い出し
curl -X POST http://localhost:8000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"type":"withdraw","amount":200,"description":"テスト払い出し"}'

# 期待されるレスポンス:
{
  "transaction_id": 2,
  "user_id": 1,
  "type": "withdraw", 
  "amount": 200,
  "balance_before": 1500,  # 払い出し前残高
  "balance_after": 1300,   # 払い出し後残高
  "message": "払い出しが完了しました"
}
```

#### 6. 取引履歴確認
```bash
# 最新5件の取引履歴を取得
curl "http://localhost:8000/api/transactions?userId=1&limit=5"

# 期待されるレスポンス:
{
  "user_id": 1,
  "transactions": [
    {
      "id": 2,
      "type": "withdraw",
      "amount": 200,
      "balance_before": 1500,
      "balance_after": 1300,
      "description": "テスト払い出し",
      "created_at": "2025-01-01 12:05:00"
    },
    {
      "id": 1,
      "type": "deposit", 
      "amount": 500,
      "balance_before": 1000,
      "balance_after": 1500,
      "description": "テスト入金",
      "created_at": "2025-01-01 12:03:00"
    }
  ],
  "count": 2,
  "message": "取引履歴取得成功"
}
```

#### 7. 最終残高確認
```bash
# 取引後の最終残高を確認
curl http://localhost:8000/api/balance/1

# 期待されるレスポンス:
{
  "user_id": 1,
  "username": "testuser", 
  "total_balance": 1300,   # 1000 + 500 - 200 = 1300
  "updated_at": "2025-01-01 12:05:00",
  "message": "残高取得成功"
}
```

### エラーケース確認

#### 1. 存在しないユーザー
```bash
curl http://localhost:8000/api/balance/999

# 期待されるレスポンス:
{
  "error": "ユーザーが見つかりません",
  "userId": 999,
  "hint": "MVP版ではユーザーID=1のみ利用可能です"
}
```

#### 2. 残高不足エラー
```bash
# 残高以上の金額を払い出し
curl -X POST http://localhost:8000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"type":"withdraw","amount":9999}'

# 期待されるレスポンス:
{
  "error": "残高不足です",
  "current_balance": 1300,
  "requested_amount": 9999,
  "shortage": 8699
}
```

#### 3. 無効なログイン
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"invalid"}'

# 期待されるレスポンス:
{
  "error": "ユーザーが見つかりません",
  "username": "invalid",
  "hint": "MVP版では \"testuser\" のみ利用可能です"
}
```

## 📊 サーバーログの読み方

### 正常時のログ例
```
🚀 MedalBank API Server running on http://localhost:8000
✅ SQLite データベースに接続しました
✅ テストユーザー既に存在します (ID: 1)
📥 GET /api/balance/1
✅ ユーザー testuser の残高: 1000メダル
📥 POST /api/transactions
📥 取引処理リクエスト: ユーザーID=1, 種別=deposit, 金額=500
🔍 ユーザーID 1 の現在残高を取得中...
💰 入金処理: 1000 + 500 = 1500
🔄 残高を 1000 → 1500 に更新中...
📝 取引履歴を記録中...
✅ 取引完了: ID=1, 新残高=1500メダル
```

### ログの見方
- 🚀 = サーバー起動
- ✅ = 正常処理完了
- 📥 = APIリクエスト受信
- 🔍 = データベース検索中
- 💰 = 入金処理
- 💸 = 払い出し処理  
- 🔄 = データ更新中
- 📝 = 履歴記録中
- ⚠️ = 警告・エラー
- ❌ = 処理失敗

## 🔍 デバッグ方法

### よくある問題と対処法

#### 1. サーバーが起動しない
```bash
# ポート8000が使用されていないか確認
lsof -i :8000

# 使用されている場合、プロセスを終了
kill -9 [PID]

# 依存関係を再インストール
rm -rf node_modules package-lock.json
npm install
```

#### 2. データベースエラー
```bash
# データベースファイルを削除して初期化
rm medalbank.db
npm start  # 自動でテーブル・テストデータが再作成される
```

#### 3. APIレスポンスが返らない
```bash
# CURLコマンドで直接確認
curl -v http://localhost:8000/health

# サーバーログを確認
# ターミナルのサーバー起動画面でエラーメッセージをチェック
```

## 🎯 確認のポイント

### 成功の判断基準
1. **サーバー起動**: ログに "🚀 MedalBank API Server running" が表示
2. **DB初期化**: "✅ テストユーザー作成完了" または "既に存在します" が表示
3. **API応答**: 各エンドポイントがJSONを返す
4. **データ整合性**: 残高計算が正確（入金で増加、払い出しで減少）
5. **履歴記録**: 取引履歴が正しい順序で記録される

### 注意事項
- **MVP版の制限**: ユーザーID=1（testuser）のみ対応
- **セキュリティ**: 本格的な認証なし（開発用）
- **データ永続化**: SQLiteファイルにデータ保存

## 🔄 日常的な確認手順

```bash
# 1. プロジェクトディレクトリに移動
cd medalbank-api

# 2. サーバー起動
npm start

# 3. 別ターミナルで基本チェック（30秒で完了）
curl http://localhost:8000/health
curl http://localhost:8000/api/balance/1
curl -X POST http://localhost:8000/api/transactions -H "Content-Type: application/json" -d '{"user_id":1,"type":"deposit","amount":100}'
curl http://localhost:8000/api/balance/1

# 4. 問題なければ開発続行、問題があればログ確認
```

この手順で**バックエンドAPIが正常に動作している**ことが確認できます。