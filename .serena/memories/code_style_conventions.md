# コードスタイルと規約

## アーキテクチャパターン
- **アトミックデザイン**: コンポーネントをatoms、molecules、organisms、templates、pagesに分類
- **Next.js App Router**: 最新のApp Routerを使用
- **Barrel Exports**: 各コンポーネントディレクトリにindex.tsでエクスポート

## TypeScript規約
- 厳格な型付けを使用
- interfaceを使ったProps定義
- React.ReactNodeを子要素の型として使用
- 例：`interface ButtonProps { children: React.ReactNode; }`

## コンポーネント規約
- **命名**: PascalCase（例：Button、SearchBox、MainLayout）
- **Props**: バリアント・サイズ・状態を細かく定義
- **独自コンポーネント**: daisyUIスタイルのvariantを使用
  - variant: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info'
  - size: 'xs' | 'sm' | 'md' | 'lg'
  - 追加オプション: outline, glass, loading, disabled

## CSS・スタイリング
- **Tailwind CSS**: ユーティリティファーストアプローチ
- **CSS Variables**: デザイントークンをCSS Variablesで管理（--primary, --background等）
- **shadcn/ui**: 一貫したデザインシステム
- **レスポンシブ**: md:grid-cols-2などのレスポンシブクラス使用

## ファイル構造
- コンポーネント名と同名のディレクトリ
- ComponentName.tsx + index.ts の組み合わせ
- 例：`src/components/atoms/Button/Button.tsx` + `src/components/atoms/Button/index.ts`