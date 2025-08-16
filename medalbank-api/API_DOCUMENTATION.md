# MedalBank API ドキュメント

## 概要
MedalBankは、ゲームセンターのメダル管理システムです。ユーザーが複数の店舗でメダルの残高を管理し、入金・出金の取引履歴を追跡できます。

## ベースURL
- 開発環境: `http://localhost:8000`

## 認証
現在はシンプルなユーザー名ベースの認証を使用しています。

## エンドポイント一覧

### ヘルスチェック

#### GET /health
サーバーの稼働状況を確認します。

**レスポンス例:**
```json
{
  "status": "OK",
  "message": "MedalBank API is running!",
  "timestamp": "2025-08-16T03:00:00.000Z"
}
```

### 認証API

#### POST /api/auth/login
ユーザーログインを行います。

**リクエストボディ:**
```json
{
  "username": "testuser"
}
```

**レスポンス例:**
```json
{
  "token": "sample-token",
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "testuser@example.com"
  }
}
```

#### GET /api/auth/me
現在の認証状態を確認します。

### 店舗API

#### GET /api/stores
全店舗の一覧を取得します。

**レスポンス例:**
```json
{
  "stores": [
    {
      "id": 1,
      "name": "ラウンドワン",
      "description": "メインのゲームセンター",
      "color": "#3B82F6",
      "created_at": "2025-08-16 02:55:31",
      "updated_at": "2025-08-16 02:55:31",
      "user_count": 1,
      "total_balance": 1389
    }
  ],
  "count": 3,
  "message": "店舗一覧を取得しました"
}
```

#### GET /api/stores/:id
特定の店舗情報を取得します。

#### POST /api/stores
新しい店舗を作成します。

**リクエストボディ:**
```json
{
  "name": "新店舗名",
  "description": "店舗の説明",
  "color": "#10B981",
  "createBalanceForAllUsers": true
}
```

#### PUT /api/stores/:id
店舗情報を更新します。

#### DELETE /api/stores/:id
店舗を削除します。強制削除の場合は `?forceDelete=true` を指定。

#### GET /api/stores/:id/stats
店舗の統計情報を取得します。

### 残高API

#### GET /api/balance/:userId
ユーザーの残高を取得します。

**クエリパラメータ:**
- `storeId` (optional): 特定店舗の残高を取得

**レスポンス例:**
```json
{
  "user_id": 1,
  "username": "testuser",
  "total_balance": 1389,
  "store_id": 1,
  "store_name": "ラウンドワン",
  "store_color": "#3B82F6",
  "updated_at": "2025-08-16 02:58:52",
  "message": "残高取得成功"
}
```

### 取引API

#### GET /api/transactions
取引履歴を取得します。

**クエリパラメータ:**
- `userId` (required): ユーザーID
- `storeId` (optional): 店舗ID
- `limit` (optional): 取得件数（デフォルト10、最大100）
- `type` (optional): 取引種別（"deposit", "withdraw"）
- `dateFrom` (optional): 開始日（YYYY-MM-DD）
- `dateTo` (optional): 終了日（YYYY-MM-DD）
- `includeStats` (optional): 統計情報を含める（true/false）

**レスポンス例:**
```json
{
  "user_id": 1,
  "transactions": [
    {
      "id": 11,
      "user_id": 1,
      "store_id": 4,
      "store_name": "ナムコ",
      "store_color": "#10B981",
      "type": "deposit",
      "type_display": "入金",
      "amount": 500,
      "balance_before": 0,
      "balance_after": 500,
      "description": "ナムコ初回入金",
      "created_at": "2025-08-16 03:03:50"
    }
  ],
  "message": "取引履歴取得成功"
}
```

#### POST /api/transactions
新しい取引を作成します。

**リクエストボディ:**
```json
{
  "user_id": 1,
  "store_id": 1,
  "type": "deposit",
  "amount": 500,
  "description": "入金"
}
```

**レスポンス例:**
```json
{
  "transaction_id": 11,
  "user_id": 1,
  "type": "deposit",
  "amount": 500,
  "balance_before": 0,
  "balance_after": 500,
  "description": "入金",
  "message": "入金が完了しました"
}
```

## エラーレスポンス

エラーが発生した場合、以下の形式でレスポンスが返されます：

```json
{
  "success": false,
  "error": "エラーメッセージ",
  "timestamp": "2025-08-16T03:00:00.000Z",
  "details": "詳細情報（開発環境のみ）"
}
```

## ステータスコード

- `200`: 成功
- `400`: リクエストエラー（バリデーション失敗など）
- `401`: 認証エラー
- `404`: リソースが見つからない
- `500`: サーバー内部エラー

## データベース構造

### stores テーブル
- `id`: 店舗ID（主キー）
- `name`: 店舗名
- `description`: 店舗説明
- `color`: 店舗カラー
- `created_at`: 作成日時
- `updated_at`: 更新日時

### users テーブル
- `id`: ユーザーID（主キー）
- `username`: ユーザー名
- `email`: メールアドレス
- `created_at`: 作成日時

### balance テーブル
- `id`: 残高ID（主キー）
- `user_id`: ユーザーID（外部キー）
- `store_id`: 店舗ID（外部キー）
- `amount`: 残高額
- `updated_at`: 更新日時

### transactions テーブル
- `id`: 取引ID（主キー）
- `user_id`: ユーザーID（外部キー）
- `store_id`: 店舗ID（外部キー）
- `type`: 取引種別（deposit/withdraw）
- `amount`: 取引金額
- `balance_before`: 取引前残高
- `balance_after`: 取引後残高
- `description`: 取引説明
- `created_at`: 作成日時

### login_history テーブル
- `id`: ログインID（主キー）
- `user_id`: ユーザーID（外部キー）
- `session_id`: セッションID
- `device_info`: デバイス情報
- `ip_address`: IPアドレス
- `created_at`: ログイン日時