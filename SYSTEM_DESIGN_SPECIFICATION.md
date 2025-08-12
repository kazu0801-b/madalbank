# メダルバンク システム設計書

## システム概要

メダルバンクは実績管理とメダル（仮想通貨）の取引を行うWebアプリケーションです。
ユーザーが自身の実績を追跡し、メダルの入出金・送金を管理できるプラットフォームを提供します。

## アーキテクチャ概要

### 技術スタック

#### フロントエンド
- **フレームワーク**: Next.js 15 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **状態管理**: React Hooks (useState, useEffect)
- **ルーティング**: Next.js App Router

#### バックエンド
- **ランタイム**: Node.js
- **フレームワーク**: Express.js
- **データベース**: SQLite (開発)、PostgreSQL (本番想定)
- **認証**: JWT (JSON Web Tokens)
- **API**: RESTful API

#### インフラストラクチャ
- **開発環境**: ローカル開発サーバー
- **データベース**: SQLite (ローカル)
- **本番想定**: Vercel (フロントエンド) + Railway/Render (バックエンド)

## システム構成図

```
┌─────────────────────────────────────────────────────────────────┐
│                        クライアント                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Web Browser   │  │    Mobile App   │  │   Desktop App   │ │
│  │    (React)      │  │     (Future)    │  │    (Future)     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                 │
                            HTTPS/REST API
                                 │
┌─────────────────────────────────────────────────────────────────┐
│                     Next.js Application                        │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    フロントエンド                           │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │ │
│  │  │   Pages     │ │ Components  │ │      Hooks         │  │ │
│  │  │ (App Router)│ │(Atomic Design)│ │  (State Management)│  │ │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                 │
                            HTTP API Calls
                                 │
┌─────────────────────────────────────────────────────────────────┐
│                      Backend API Server                        │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                     Express.js                              │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │ │
│  │  │   Routes    │ │ Controllers │ │     Middleware      │  │ │
│  │  │ (API Endpoints)│ │ (Business Logic)│ │  (Auth, CORS, etc)│  │ │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                 │
                            SQL Queries
                                 │
┌─────────────────────────────────────────────────────────────────┐
│                        Database Layer                          │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    SQLite Database                          │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │ │
│  │  │    Users    │ │ Transactions│ │     Balances        │  │ │
│  │  │    Table    │ │    Table    │ │       Table         │  │ │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## データベース設計

### エンティティ関係図 (ERD)

```
┌─────────────────┐     ┌─────────────────────┐     ┌─────────────────┐
│      Users      │     │    Transactions     │     │    Balances     │
├─────────────────┤     ├─────────────────────┤     ├─────────────────┤
│ id (PK)         │────▶│ id (PK)             │     │ id (PK)         │
│ email (UNIQUE)  │     │ user_id (FK)        │◀────│ user_id (FK)    │
│ password_hash   │     │ type                │     │ amount          │
│ created_at      │     │ amount              │     │ created_at      │
│ updated_at      │     │ description         │     │ updated_at      │
│ is_active       │     │ created_at          │     └─────────────────┘
└─────────────────┘     │ updated_at          │
                        └─────────────────────┘
```

### テーブル定義

#### Users テーブル
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
```

#### Transactions テーブル
```sql
CREATE TABLE transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'deposit', 'withdraw', 'transfer_in', 'transfer_out'
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
```

#### Balances テーブル
```sql
CREATE TABLE balances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    amount DECIMAL(10,2) DEFAULT 0.00,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
```

## API 設計

### 認証エンドポイント

#### POST /api/auth/register
ユーザー登録

**リクエスト:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**レスポンス:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

#### POST /api/auth/login
ユーザーログイン

**リクエスト:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**レスポンス:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

### 残高管理エンドポイント

#### GET /api/balance
現在の残高を取得

**ヘッダー:**
```
Authorization: Bearer <JWT_TOKEN>
```

**レスポンス:**
```json
{
  "success": true,
  "balance": {
    "user_id": 1,
    "amount": 2450.00,
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

### 取引エンドポイント

#### POST /api/transactions
取引実行（入金・出金・送金）

**リクエスト例（入金）:**
```json
{
  "type": "deposit",
  "amount": 100.00,
  "description": "Medal deposit"
}
```

**レスポンス:**
```json
{
  "success": true,
  "message": "Transaction completed",
  "transaction": {
    "id": 1,
    "user_id": 1,
    "type": "deposit",
    "amount": 100.00,
    "description": "Medal deposit",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "new_balance": 2550.00
}
```

#### GET /api/transactions
取引履歴を取得

**クエリパラメータ:**
- `page`: ページ番号（デフォルト: 1）
- `limit`: 取得件数（デフォルト: 20）
- `type`: 取引タイプフィルター

**レスポンス:**
```json
{
  "success": true,
  "transactions": [
    {
      "id": 1,
      "type": "deposit",
      "amount": 100.00,
      "description": "Medal deposit",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_count": 98
  }
}
```

### 統計エンドポイント

#### GET /api/stats
ユーザー統計を取得

**レスポンス:**
```json
{
  "success": true,
  "stats": {
    "total_transactions": 25,
    "total_deposits": 1500.00,
    "total_withdrawals": 300.00,
    "current_balance": 2450.00,
    "last_transaction_date": "2024-01-15T10:30:00Z"
  }
}
```

## セキュリティ設計

### 認証・認可
- **JWT トークン**: セッション管理
- **パスワードハッシュ化**: bcrypt使用
- **トークン期限**: 24時間
- **リフレッシュトークン**: 7日間

### API セキュリティ
- **CORS**: オリジン制限
- **レート制限**: IP別リクエスト制限
- **入力検証**: バリデーション機能
- **SQL インジェクション対策**: パラメータ化クエリ

### データ保護
- **暗号化**: 本番環境では TLS 1.3
- **環境変数**: 秘密情報の管理
- **ログ管理**: 個人情報の除外

## パフォーマンス設計

### フロントエンド最適化
- **コード分割**: ページベース
- **画像最適化**: Next.js Image
- **キャッシュ戦略**: SWR実装予定
- **バンドルサイズ**: 最適化済み

### バックエンド最適化
- **データベースインデックス**: 主要カラム
- **クエリ最適化**: N+1問題回避
- **接続プール**: データベース接続管理
- **レスポンスキャッシュ**: Redis導入予定

## 監視・ログ設計

### ログレベル
- **ERROR**: エラー発生時
- **WARN**: 警告事項
- **INFO**: 重要な処理
- **DEBUG**: 開発時デバッグ用

### 監視指標
- **レスポンス時間**: API応答速度
- **エラー率**: 4xx, 5xx エラー
- **スループット**: リクエスト処理量
- **リソース使用率**: CPU、メモリ

## デプロイメント設計

### 開発環境
```
Developer Local → Git Push → GitHub Repository
```

### 本番環境（予定）
```
GitHub Repository → Vercel (Frontend) + Railway (Backend) → Production
```

### CI/CD パイプライン（予定）
1. **コードプッシュ**
2. **自動テスト実行**
3. **ビルド処理**
4. **デプロイメント**
5. **ヘルスチェック**

## 拡張性設計

### 水平スケーリング
- **ロードバランサー**: リクエスト分散
- **マイクロサービス**: 機能分割
- **データベースシャーディング**: データ分散

### 機能拡張
- **メダル交換機能**: 他通貨との交換
- **ランキングシステム**: ユーザー順位
- **通知システム**: リアルタイム通知
- **API バージョニング**: 後方互換性

## 障害対応設計

### 障害検知
- **ヘルスチェック**: 定期的な生存確認
- **アラート**: 異常値の通知
- **ログ監視**: エラーパターン検知

### 復旧手順
1. **障害検知・分析**
2. **緊急対応実施**
3. **根本原因調査**
4. **恒久対策実装**
5. **再発防止策策定**

## データバックアップ

### バックアップ戦略
- **フルバックアップ**: 週1回
- **差分バックアップ**: 日1回
- **トランザクションログ**: リアルタイム

### 復旧目標
- **RTO** (Recovery Time Objective): 4時間
- **RPO** (Recovery Point Objective): 1時間

---

## 実装状況

### 完了済み機能
- ✅ 基本認証システム (JWT)
- ✅ ユーザー登録・ログイン
- ✅ 残高管理
- ✅ 基本的な取引機能
- ✅ 取引履歴
- ✅ 統計機能

### 開発中機能
- 🔄 フロントエンド・バックエンド統合
- 🔄 エラーハンドリング強化
- 🔄 バリデーション機能

### 予定機能
- 📋 送金機能
- 📋 ランキングシステム
- 📋 プッシュ通知
- 📋 管理者ダッシュボード