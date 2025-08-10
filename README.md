# MedalBank - メダル管理システム

メダルゲームセンター向けのメダル残高管理システム。顧客のメダル残高を管理し、入金・払い出し履歴を追跡します。

## 要件定義

### システム概要
ゲームセンターのメダル残高を電子的に管理するWebアプリケーション。

### 主要機能
1. **ユーザー認証**
   - ログイン・ログアウト機能
   - セッション管理

2. **メダル残高管理**
   - リアルタイム残高表示
   - 残高照会履歴

3. **入出金管理**
   - メダル入金処理
   - メダル払い出し処理
   - 不正防止（残高不足チェック等）

4. **履歴管理**
   - 全取引履歴の記録
   - 日付・金額・種別での検索・フィルタ

5. **有効期限管理**
   - メダルの有効期限設定
   - 期限切れの自動処理

### 技術要件
- **フロントエンド**: Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui
- **バックエンド**: Go + Gin Framework
- **データベース**: SQLite
- **認証**: NextAuth.js or Firebase Auth
- **デプロイ**: Vercel (フロントエンド) + Render (バックエンド)

### 非機能要件
- レスポンス時間: 3秒以内
- 同時接続: 100ユーザー対応
- データバックアップ: 日次自動
- セキュリティ: HTTPS通信、入力サニタイズ

### API仕様
```
GET  /api/balance/:userId     - 残高取得
POST /api/deposit             - 入金
POST /api/withdraw            - 払い出し  
GET  /api/history/:userId     - 取引履歴
POST /auth/login              - ログイン
POST /auth/logout             - ログアウト
GET  /api/admin/users         - ユーザー一覧（管理者）
GET  /api/admin/stats         - 統計情報（管理者）
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
