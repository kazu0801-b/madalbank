// ===================================
// 認証関連 APIエンドポイント
// ===================================
// MVP版の簡易ユーザー認証システム
//
// エンドポイント:
// POST /api/auth/login  - ログイン認証
// POST /api/auth/logout - ログアウト
//
// 注意: MVP版のため簡易実装
// - パスワード認証なし（ユーザー名のみ）
// - JWTトークンなし（固定トークン）
// - セッション管理なし
// ===================================

const express = require('express')
const { getDatabase } = require('../database')
const router = express.Router()

/**
 * 簡易ログイン API (MVP版)
 * 
 * URL: POST /api/auth/login
 * 目的: ユーザー名のみでの簡易ログイン認証
 * 
 * リクエストボディ:
 * {
 *   "username": "testuser"
 * }
 * 
 * レスポンス例（成功）:
 * {
 *   "message": "ログイン成功",
 *   "user": {
 *     "id": 1,
 *     "username": "testuser",
 *     "email": "test@example.com"
 *   },
 *   "token": "mvp_token_1_1638360000000"
 * }
 * 
 * レスポンス例（失敗）:
 * {
 *   "error": "ユーザーが見つかりません",
 *   "username": "invaliduser"
 * }
 */
router.post('/login', (req, res) => {
  const { username } = req.body

  console.log(`🔐 ログイン試行: ユーザー名="${username}"`)

  // バリデーション: ユーザー名が入力されているかチェック
  if (!username) {
    console.log('⚠️  ログインエラー: ユーザー名が未入力')
    return res.status(400).json({
      error: 'ユーザー名が必要です',
      received: req.body,
      hint: 'MVP版では "testuser" でログインできます'
    })
  }

  const db = getDatabase()

  // データベースでユーザー存在確認
  // MVP版では全ユーザー情報を返す（パスワードは除く）
  db.get('SELECT id, username, email FROM users WHERE username = ?', [username], (err, row) => {
    if (err) {
      console.error('❌ ログイン時のデータベースエラー:', err.message)
      db.close()
      return res.status(500).json({
        error: 'データベースエラーが発生しました',
        details: process.env.NODE_ENV === 'development' ? err.message : 'Database error'
      })
    }

    // ユーザーが見つからない場合
    if (!row) {
      console.log(`⚠️  ログイン失敗: ユーザー "${username}" は存在しません`)
      db.close()
      return res.status(401).json({
        error: 'ユーザーが見つかりません',
        username: username,
        hint: 'MVP版では "testuser" のみ利用可能です'
      })
    }

    console.log(`✅ ログイン成功: ${row.username} (ID: ${row.id})`)
    db.close()

    // 成功レスポンス
    // MVP版では簡易的な固定形式のトークンを生成
    const mvpToken = `mvp_token_${row.id}_${Date.now()}`
    
    res.json({
      message: 'ログイン成功',
      user: {
        id: row.id,
        username: row.username,
        email: row.email
      },
      // 注意: 本番環境では JWT など適切な認証トークンを使用すること
      token: mvpToken,
      expires_in: '24h', // MVP版では実際の有効期限チェックなし
      login_time: new Date().toISOString()
    })
  })
})

/**
 * ログアウト API (MVP版)
 * 
 * URL: POST /api/auth/logout
 * 目的: ログアウト処理（MVP版では特に処理なし）
 * 
 * レスポンス:
 * {
 *   "message": "ログアウト完了"
 * }
 * 
 * 注意: MVP版では実際のセッション削除やトークン無効化は行わない
 */
router.post('/logout', (req, res) => {
  console.log('👋 ログアウト処理')
  
  // MVP版では特別な処理は行わず、成功レスポンスのみ返す
  // 本番では以下の処理が必要:
  // - セッション削除
  // - トークンのブラックリスト登録
  // - ログアウト履歴の記録
  
  res.json({
    message: 'ログアウト完了',
    logout_time: new Date().toISOString()
  })
})

/**
 * 認証状態チェック API (MVP版)
 * 
 * URL: GET /api/auth/me
 * 目的: 現在のログイン状態を確認（将来の拡張用）
 * 
 * 注意: MVP版では未実装
 */
router.get('/me', (req, res) => {
  res.status(501).json({
    error: 'このエンドポイントはMVP版では未実装です',
    message: 'Not implemented in MVP version',
    available_endpoints: [
      'POST /api/auth/login',
      'POST /api/auth/logout'
    ]
  })
})

// このルーターをエクスポート（server.jsで使用される）
module.exports = router