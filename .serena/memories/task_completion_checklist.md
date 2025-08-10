# タスク完了時のチェックリスト

## コード品質チェック
1. **ESLint実行**: `npm run lint`
   - エラー・警告がないことを確認
   - Next.jsとTypeScriptの規約に準拠

2. **TypeScriptコンパイル確認**
   - `npm run build` でビルドエラーがないことを確認
   - 型エラーの解消

3. **開発サーバー動作確認**
   - `npm run dev` で正常に起動することを確認
   - ブラウザでの表示・機能確認

## コードレビューポイント
- アトミックデザインの適切な分類
- TypeScriptの型安全性
- Tailwind CSSのユーティリティファースト原則
- shadcn/uiコンポーネントとの一貫性
- レスポンシブデザインの確認

## ファイル構造の確認
- 適切なディレクトリ配置
- index.tsでのBarrel Export
- 命名規則の遵守（PascalCase）

## パフォーマンス
- 不要なimportの削除
- コンポーネントの最適化
- Next.js 15の機能活用（Turbopack等）