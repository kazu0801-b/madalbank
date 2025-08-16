// ===================================
// MedalBank MVP API Server
// ===================================
// Express.js + SQLite を使用したメダル管理システムのバックエンドAPI
// 
// 主な機能:
// - ユーザー認証（簡易版）
// - メダル残高管理
// - 入金・払い出し処理
// - 取引履歴管理
// Day2拡張:
// - 統計情報API
// - バッチ処理API
// - セッション管理強化
//
// ポート: 8000
// データベース: SQLite (medalbank.db)
// ===================================

const express = require('express')
const cors = require('cors')
require('dotenv').config() // .env ファイルから環境変数を読み込み

const { initDatabase } = require('./database')
// Day4追加: 新しいミドルウェア
const { logger, loggerMiddleware } = require('./utils/logger')
const { 
  responseFormatter, 
  addApiVersion, 
  performanceTracker, 
  corsHeaders, 
  requestLogger 
} = require('./middleware/response')
const { 
  rateLimit, 
  addSecurityHeaders 
} = require('./middleware/validation')

const app = express()
const PORT = process.env.PORT || 8000 // 環境変数からポート取得、デフォルト8000

// ===================================
// ミドルウェア設定（Day4強化版）
// ===================================

// Day4: セキュリティヘッダー追加
app.use(addSecurityHeaders)

// Day4: CORS設定強化
app.use(corsHeaders)

// Day4: レート制限（100リクエスト/分）
app.use(rateLimit(100, 60000))

// Day4: リクエストログ
app.use(requestLogger)

// Day4: パフォーマンス測定
app.use(performanceTracker)

// Day4: APIバージョン情報
app.use(addApiVersion)

// Day4: レスポンス形式統一
app.use(responseFormatter)

// Day4: 構造化ログ
app.use(loggerMiddleware)

// JSON形式のリクエストボディをパース
app.use(express.json())

// 従来のCORS設定（バックアップ）
app.use(cors({
  origin: [
    'http://localhost:3000',     // Next.js開発サーバー
    'http://127.0.0.1:3000'      // 代替アドレス
  ],
  credentials: true // クッキーやセッション情報を含むリクエストを許可
}))

// ===================================
// データベース初期化
// ===================================
console.log('🔄 データベースを初期化しています...')
initDatabase() // テーブル作成 + テストユーザー作成

// ===================================
// エンドポイント定義
// ===================================

// ヘルスチェック用エンドポイント
// 用途: サーバーが正常に動作しているかの確認
// URL: GET /health
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'MedalBank API is running!',
    timestamp: new Date().toISOString()
  })
})

// API ルート設定
// 各機能ごとにファイルを分割して管理
app.use('/api/balance', require('./routes/balance'))         // 残高関連API
app.use('/api/transactions', require('./routes/transactions')) // 取引関連API
app.use('/api/auth', require('./routes/auth'))               // 認証関連API

// Day2拡張エンドポイント
app.use('/api/stats', require('./routes/stats'))             // 統計情報API
app.use('/api/batch', require('./routes/batch'))             // バッチ処理API

// Day5拡張エンドポイント
app.use('/api/stores', require('./routes/stores'))           // 店舗関連API

// ===================================
// エラーハンドリング
// ===================================

// 404エラー: 存在しないエンドポイントへのアクセス
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'エンドポイントが見つかりません',
    path: req.originalUrl,
    method: req.method,
    available_endpoints: [
      'GET /health',
      'GET /api/balance/:userId',
      'POST /api/transactions',
      'GET /api/transactions',
      'POST /api/auth/login',
      'GET /api/auth/me',
      'GET /api/stats/user/:userId',
      'GET /api/stats/summary/:userId',
      'POST /api/batch/transactions'
    ]
  })
})

// 500エラー: サーバー内部エラー
app.use((err, req, res, next) => {
  console.error('❌ サーバーエラー:', err.stack)
  res.status(500).json({
    error: 'サーバー内部エラーが発生しました',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  })
})

// ===================================
// サーバー起動
// ===================================
app.listen(PORT, () => {
  console.log(`🚀 MedalBank API Server running on http://localhost:${PORT}`)
  console.log(`📍 Health Check: http://localhost:${PORT}/health`)
  console.log('📚 Available endpoints:')
  console.log('   💰 残高管理:')
  console.log('     GET  /api/balance/1        - 残高取得')
  console.log('   📄 取引管理:')
  console.log('     POST /api/transactions     - 入金・払い出し処理')
  console.log('     GET  /api/transactions     - 取引履歴取得')
  console.log('   🔐 認証管理:')
  console.log('     POST /api/auth/login       - ログイン認証')
  console.log('     GET  /api/auth/me          - 認証状態チェック')
  console.log('   📊 統計情報 (Day2追加):')
  console.log('     GET  /api/stats/user/1     - ユーザー統計')
  console.log('     GET  /api/stats/summary/1  - サマリー統計')
  console.log('   🚀 バッチ処理 (Day2追加):')
  console.log('     POST /api/batch/transactions - 一括取引処理')
  console.log('')
  console.log('')
  console.log('🔧 開発用テストコマンド:')
  console.log(`   curl http://localhost:${PORT}/health`)
  console.log(`   curl http://localhost:${PORT}/api/balance/1`)
  console.log(`   curl http://localhost:${PORT}/api/stats/summary/1`)
  console.log('')
  console.log('🎉 Day2拡張機能が利用可能です！')
  console.log('   - フィルタ付き取引履歴')
  console.log('   - 統計情報ダッシュボード')
  console.log('   - バッチ処理機能')
  console.log('   - セッション管理強化')
})