# MedalBank - ゲームセンターメダル管理システム

複数のゲームセンター店舗でメダル残高を管理するWebアプリケーション。各店舗でのメダル入金・出金を個別に管理し、取引履歴を追跡できます。

## 🎮 システム概要

ゲームセンターのメダル残高を電子的に管理し、複数店舗での残高を統合管理できるWebアプリケーションです。

## ✨ 実装済み機能

### 1. **ユーザー認証**
   - シンプルなユーザー名ベース認証
   - セッション管理

### 2. **店舗管理**
   - 複数店舗の作成・管理
   - 店舗ごとの残高分離
   - 店舗別統計情報

### 3. **メダル残高管理**
   - 店舗別残高表示
   - 総残高の自動計算
   - リアルタイム残高更新

### 4. **入出金管理**
   - 店舗別メダル入金処理
   - メダル払い出し処理
   - 残高不足チェック

### 5. **取引履歴管理**
   - 店舗別・期間別の取引履歴
   - 取引種別での絞り込み
   - 詳細な検索・フィルタ機能

### 6. **統計情報**
   - 店舗別統計データ
   - 取引サマリー
   - ユーザー別統計

## 🛠 技術スタック

- **フロントエンド**: Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui
- **バックエンド**: Node.js + Express
- **データベース**: SQLite
- **API**: RESTful API
- **開発ツール**: ESLint, Prettier

## 📁 プロジェクト構成

```
medalbank/
├── src/                          # フロントエンド
│   ├── app/                      # Next.js App Router
│   ├── components/               # UIコンポーネント
│   ├── types/                    # TypeScript型定義
│   └── utils/                    # ユーティリティ
└── medalbank-api/                # バックエンドAPI
    ├── routes/                   # APIルート
    ├── middleware/               # ミドルウェア
    ├── utils/                    # ヘルパー関数
    └── medalbank.db              # SQLiteデータベース
```

## 🗄️ データベース構造

- **stores**: 店舗情報
- **users**: ユーザー情報
- **balance**: 店舗別残高
- **transactions**: 取引履歴
- **login_history**: ログイン履歴

## 📡 API仕様

詳細なAPIドキュメントは [`medalbank-api/API_DOCUMENTATION.md`](./medalbank-api/API_DOCUMENTATION.md) を参照してください。

### 主要エンドポイント
```
GET  /api/stores                  - 店舗一覧
GET  /api/balance/:userId         - 残高取得
POST /api/transactions            - 取引作成
GET  /api/transactions            - 取引履歴
POST /api/auth/login              - ログイン
```

## 🚀 セットアップ・起動方法

### 1. リポジトリのクローン
```bash
git clone <repository-url>
cd medalbank
```

### 2. 依存関係のインストール

**フロントエンド（メインディレクトリ）：**
```bash
npm install
```

**バックエンド（APIサーバー）：**
```bash
cd medalbank-api
npm install
```

### 3. 開発サーバーの起動

**バックエンドAPIサーバー（ポート8000）：**
```bash
cd medalbank-api
npm start
```

**フロントエンド開発サーバー（ポート3003）：**
```bash
# メインディレクトリで
npm run dev
```

### 4. アクセス
- **フロントエンド**: http://localhost:3003
- **バックエンドAPI**: http://localhost:8000
- **ヘルスチェック**: http://localhost:8000/health

## 🧪 テスト

### 統合テスト
```bash
# フロントエンドでテストページにアクセス
http://localhost:3003/test
```

### APIテスト
```bash
# ヘルスチェック
curl http://localhost:8000/health

# 店舗一覧取得
curl http://localhost:8000/api/stores

# 残高取得
curl http://localhost:8000/api/balance/1
```

## 📦 デプロイ

### フロントエンド（Vercel）
1. Vercelにプッシュ
2. 環境変数 `NEXT_PUBLIC_API_URL` を設定

### バックエンド（Railway / Render）
1. リポジトリをデプロイプラットフォームに接続
2. ビルドコマンド: `npm install`
3. 開始コマンド: `npm start`
4. ポート: 8000

## 🎯 デモユーザー

- **ユーザー名**: `testuser`
- **パスワード**: 不要（ユーザー名のみでログイン可能）

## 🔧 開発情報

### 利用可能な店舗
1. **ラウンドワン** - メインのゲームセンター (#3B82F6)
2. **セガ** - サブのゲームセンター (#EF4444)
3. **タイトーステーション** - レトロゲーム中心 (#F59E0B)

### 開発時のポート設定
- フロントエンド: 3003 (デフォルト)
- バックエンドAPI: 8000
- 自動CORS設定により、3000-3003, 5173番ポートからのアクセスが許可されています

## 🐛 トラブルシューティング

### CORSエラーが発生する場合
1. バックエンドAPIサーバーが起動していることを確認
2. フロントエンドのポートが3000-3003の範囲内であることを確認

### データベースエラーが発生する場合
1. `medalbank-api/medalbank.db` ファイルの権限を確認
2. APIサーバーを再起動

## 📝 ライセンス

MIT License
