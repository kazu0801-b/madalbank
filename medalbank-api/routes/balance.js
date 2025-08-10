// ===================================
// 残高関連 APIエンドポイント
// ===================================
// ユーザーのメダル残高の取得処理
//
// エンドポイント:
// GET /api/balance/:userId - 指定ユーザーの残高取得
// ===================================

const express = require('express')
const { getDatabase } = require('../database')
const router = express.Router()

/**
 * 残高取得 API
 * 
 * URL: GET /api/balance/:userId
 * 目的: 指定したユーザーの現在のメダル残高を取得
 * 
 * パラメータ:
 * - userId: ユーザーID（数値）
 * 
 * レスポンス例:
 * {
 *   "user_id": 1,
 *   "username": "testuser",
 *   "total_balance": 1500,
 *   "updated_at": "2024-01-01 12:00:00",
 *   "message": "残高取得成功"
 * }
 */
router.get('/:userId', (req, res) => {
  // URLパラメータからユーザーIDを取得
  // req.params.userId = URLの:userId部分（文字列）
  const userId = parseInt(req.params.userId)

  // バリデーション: ユーザーIDが数値かつ正の値かチェック
  if (isNaN(userId) || userId <= 0) {
    console.log(`⚠️  無効なユーザーID: ${req.params.userId}`)
    return res.status(400).json({
      error: '無効なユーザーIDです',
      userId: req.params.userId,
      hint: 'ユーザーIDは1以上の数値で指定してください'
    })
  }

  // データベース接続を取得
  const db = getDatabase()

  // SQLクエリ: ユーザー情報と残高を同時取得
  // LEFT JOIN = ユーザーが存在すれば残高がなくても結果を返す
  const query = `
    SELECT 
      u.id as user_id,           -- ユーザーID
      u.username,                -- ユーザー名
      b.amount as total_balance, -- 現在残高
      b.updated_at               -- 最終更新日時
    FROM users u
    LEFT JOIN balance b ON u.id = b.user_id
    WHERE u.id = ?  -- プレースホルダー（SQLインジェクション対策）
  `

  // SQL実行: db.get() = 1件のレコードを取得
  db.get(query, [userId], (err, row) => {
    if (err) {
      console.error('❌ 残高取得SQLエラー:', err.message)
      db.close() // エラー時もDB接続を閉じる
      return res.status(500).json({
        error: 'データベースエラーが発生しました',
        details: process.env.NODE_ENV === 'development' ? err.message : 'Database error'
      })
    }

    // ユーザーが見つからない場合
    if (!row) {
      console.log(`⚠️  ユーザーID ${userId} は存在しません`)
      db.close()
      return res.status(404).json({
        error: 'ユーザーが見つかりません',
        userId: userId,
        hint: 'MVP版ではユーザーID=1のみ利用可能です'
      })
    }

    // 成功レスポンス
    console.log(`✅ ユーザー ${row.username} の残高: ${row.total_balance || 0}メダル`)
    db.close() // 使用後はDB接続を閉じる

    // JSONレスポンスを返す
    res.json({
      user_id: row.user_id,
      username: row.username,
      total_balance: row.total_balance || 0, // nullの場合ど0を返す
      updated_at: row.updated_at,
      message: '残高取得成功'
    })
  })
})

module.exports = router