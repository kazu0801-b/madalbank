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
 * 簡易ログイン API (Day2 拡張版)
 * 
 * URL: POST /api/auth/login
 * 目的: ユーザー名での簡易ログイン認証 + セッション管理
 * 
 * Day2拡張機能:
 * - セッション情報の記録と管理
 * - ログイン履歴の追跡
 * - トークンの有効性チェック
 * 
 * リクエストボディ:
 * {
 *   "username": "testuser",
 *   "device_info": "optional device identifier",
 *   "remember_me": true
 * }
 * 
 * レスポンス例（成功）:
 * {
 *   "message": "ログイン成功",
 *   "user": {...},
 *   "token": "mvp_token_1_1638360000000",
 *   "session_id": "session_1_1638360000000",
 *   "expires_at": "2024-01-02T12:00:00.000Z",
 *   "login_count": 5,
 *   "last_login": "2024-01-01T11:00:00.000Z"
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

    // Day2 拡張: セッション情報とログイン履歴の更新
    const now = new Date()
    const expiresAt = new Date(now.getTime() + (req.body.remember_me ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000)) // 7日または1日
    const sessionId = `session_${row.id}_${Date.now()}`
    const mvpToken = `mvp_token_${row.id}_${Date.now()}`
    
    // ログイン履歴を取得
    db.get('SELECT COUNT(*) as login_count, MAX(created_at) as last_login FROM login_history WHERE user_id = ?', [row.id], (err, loginStats) => {
      if (err) {
        console.warn('⚠️ ログイン履歴取得エラー:', err.message)
        // エラーでもログインは続行
      }

      // ログイン履歴を記録
      db.run(`
        INSERT INTO login_history (user_id, session_id, device_info, ip_address, created_at)
        VALUES (?, ?, ?, ?, ?)
      `, [
        row.id, 
        sessionId, 
        req.body.device_info || 'Unknown Device',
        req.ip || req.connection.remoteAddress || 'Unknown IP',
        now.toISOString()
      ], function(loginErr) {
        if (loginErr) {
          console.warn('⚠️ ログイン履歴記録エラー:', loginErr.message)
        }

        // Day2 拡張レスポンス
        res.json({
          message: 'ログイン成功',
          user: {
            id: row.id,
            username: row.username,
            email: row.email
          },
          token: mvpToken,
          session_id: sessionId,
          expires_at: expiresAt.toISOString(),
          expires_in: req.body.remember_me ? '7d' : '24h',
          login_count: (loginStats ? loginStats.login_count : 0) + 1,
          last_login: loginStats ? loginStats.last_login : null,
          login_time: now.toISOString(),
          device_info: req.body.device_info || 'Unknown Device'
        })
      })
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
 * 認証状態チェック API (Day2 実装版)
 * 
 * URL: GET /api/auth/me
 * Headers: Authorization: Bearer <token>
 * 目的: トークンの有効性をチェックし、ユーザー情報を返す
 */
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: '認証トークンが必要です',
      hint: 'Authorization: Bearer <token> ヘッダーを追加してください'
    })
  }

  const token = authHeader.substring(7)
  
  // Day2版: 簡易トークン解析（MVP版のみ）
  const tokenMatch = token.match(/^mvp_token_(\d+)_(\d+)$/)
  if (!tokenMatch) {
    return res.status(401).json({
      error: '無効なトークン形式です',
      received_token_format: token.substring(0, 20) + '...'
    })
  }

  const userId = parseInt(tokenMatch[1])
  const tokenTime = parseInt(tokenMatch[2])
  const now = Date.now()
  
  // トークンの有効期限チェック (24時間)
  if (now - tokenTime > 24 * 60 * 60 * 1000) {
    return res.status(401).json({
      error: 'トークンの有効期限が切れています',
      token_age: Math.floor((now - tokenTime) / 1000 / 60) + '分',
      hint: '再ログインしてください'
    })
  }

  const db = getDatabase()
  
  // ユーザー情報を取得
  db.get('SELECT id, username, email FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      console.error('❌ ユーザー情報取得エラー:', err.message)
      db.close()
      return res.status(500).json({ error: 'データベースエラー' })
    }

    if (!user) {
      db.close()
      return res.status(401).json({ error: 'ユーザーが見つかりません' })
    }

    // ログイン履歴情報を取得
    db.get(`
      SELECT COUNT(*) as total_logins, MAX(created_at) as last_login 
      FROM login_history 
      WHERE user_id = ?
    `, [userId], (err, loginStats) => {
      db.close()
      
      if (err) {
        console.warn('⚠️ ログイン統計取得エラー:', err.message)
      }

      console.log(`✅ 認証チェック成功: ${user.username} (ID: ${user.id})`)
      
      res.json({
        message: '認証有効',
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        },
        token_status: '有効',
        token_age: Math.floor((now - tokenTime) / 1000 / 60) + '分',
        remaining_time: Math.floor((24 * 60 * 60 * 1000 - (now - tokenTime)) / 1000 / 60) + '分',
        login_stats: {
          total_logins: loginStats ? loginStats.total_logins : 0,
          last_login: loginStats ? loginStats.last_login : null
        },
        server_time: new Date().toISOString()
      })
    })
  })
})

/**
 * ログイン履歴取得 API (Day2 追加)
 * 
 * URL: GET /api/auth/login-history/:userId?limit=10
 * 目的: ユーザーのログイン履歴を取得
 */
router.get('/login-history/:userId', (req, res) => {
  const userId = parseInt(req.params.userId)
  const limit = Math.min(parseInt(req.query.limit) || 10, 50)

  if (isNaN(userId) || userId <= 0) {
    return res.status(400).json({
      error: '無効なユーザーID',
      userId: req.params.userId
    })
  }

  const db = getDatabase()

  db.all(`
    SELECT 
      id,
      session_id,
      device_info,
      ip_address,
      created_at
    FROM login_history 
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `, [userId, limit], (err, rows) => {
    if (err) {
      console.error('❌ ログイン履歴取得エラー:', err.message)
      db.close()
      return res.status(500).json({ error: 'データベースエラー' })
    }

    console.log(`✅ ユーザーID ${userId} のログイン履歴 ${rows.length}件 取得完了`)
    db.close()

    res.json({
      user_id: userId,
      login_history: rows,
      count: rows.length,
      message: 'ログイン履歴取得成功'
    })
  })
})

// このルーターをエクスポート（server.jsで使用される）
module.exports = router