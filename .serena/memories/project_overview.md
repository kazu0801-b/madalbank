# MedalBank プロジェクト概要

## プロジェクトの目的
- Next.js + Tailwind CSS + shadcn/ui を使用したWebアプリケーション
- メダルバンク（MedalBank）という名前のプロジェクト
- コンポーネントライブラリのテスト・デモページとして機能

## 技術スタック
- **フレームワーク**: Next.js 15.4.6 (App Router使用)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS 3.4.1
- **UIライブラリ**: shadcn/ui + 独自コンポーネント
- **ランタイム**: React 19.1.0
- **パッケージマネージャー**: npm
- **リンター**: ESLint (next/core-web-vitals, next/typescript)

## プロジェクト構造
```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx           # メインページ（shadcn/uiデモ）
│   └── globals.css        # Tailwind + CSS Variables
├── components/            # アトミックデザイン構造
│   ├── atoms/            # 基本コンポーネント
│   ├── molecules/        # 複合コンポーネント
│   ├── organisms/        # 大きな機能単位
│   ├── templates/        # レイアウト
│   ├── pages/           # ページコンポーネント
│   └── ui/              # shadcn/ui コンポーネント
├── lib/                 # ユーティリティ
├── types/              # 型定義
└── utils/              # ヘルパー関数
```