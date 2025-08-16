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
 * URL: GET /api/balance/:userId?storeId=店舗ID
 * 目的: 指定したユーザーの現在のメダル残高を取得（店舗別フィルター対応）
 * 
 * パラメータ:
 * - userId: ユーザーID（数値）
 * - storeId: 店舗ID（クエリパラメータ、省略時は全店舗合計）
 * 
 * レスポンス例:
 * {
 *   "user_id": 1,
 *   "username": "testuser",
 *   "total_balance": 1500,
 *   "store_id": 1,
 *   "store_name": "ラウンドワン",
 *   "updated_at": "2024-01-01 12:00:00",
 *   "message": "残高取得成功"
 * }
 */
router.get('/:userId', (req, res) => {
  // URLパラメータからユーザーIDを取得
  const userId = parseInt(req.params.userId)
  const storeId = req.query.storeId ? parseInt(req.query.storeId) : null

  // バリデーション: ユーザーIDが数値かつ正の値かチェック
  if (isNaN(userId) || userId <= 0) {
    console.log(`⚠️  無効なユーザーID: ${req.params.userId}`)
    return res.status(400).json({
      error: '無効なユーザーIDです',
      userId: req.params.userId,
      hint: 'ユーザーIDは1以上の数値で指定してください'
    })
  }

  // storeIdのバリデーション
  if (storeId !== null && (isNaN(storeId) || storeId <= 0)) {
    return res.status(400).json({
      error: '無効な店舗IDです',
      storeId: req.query.storeId,
      hint: '店舗IDは1以上の数値で指定してください'
    })
  }

  // データベース接続を取得
  const db = getDatabase()

  let query, params
  
  if (storeId) {
    // 特定店舗の残高を取得
    query = `
      SELECT 
        u.id as user_id,
        u.username,
        b.amount as total_balance,
        b.store_id,
        s.name as store_name,
        s.color as store_color,
        b.updated_at
      FROM users u
      LEFT JOIN balance b ON u.id = b.user_id AND b.store_id = ?
      LEFT JOIN stores s ON b.store_id = s.id
      WHERE u.id = ?
    `
    params = [storeId, userId]
  } else {
    // 全店舗の残高合計を取得
    query = `
      SELECT 
        u.id as user_id,
        u.username,
        COALESCE(SUM(b.amount), 0) as total_balance,
        MAX(b.updated_at) as updated_at
      FROM users u
      LEFT JOIN balance b ON u.id = b.user_id
      WHERE u.id = ?
      GROUP BY u.id, u.username
    `
    params = [userId]
  }

  // SQL実行
  db.get(query, params, (err, row) => {
    if (err) {
      console.error('❌ 残高取得SQLエラー:', err.message)
      db.close()
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
    const balance = row.total_balance || 0
    const logMessage = storeId 
      ? `✅ ユーザー ${row.username} の${row.store_name}での残高: ${balance}メダル`
      : `✅ ユーザー ${row.username} の総残高: ${balance}メダル`
    console.log(logMessage)
    db.close()

    // JSONレスポンス
    const response = {
      user_id: row.user_id,
      username: row.username,
      total_balance: balance,
      updated_at: row.updated_at,
      message: '残高取得成功'
    }

    // 店舗指定時は店舗情報も含める
    if (storeId && row.store_id) {
      response.store_id = row.store_id
      response.store_name = row.store_name
      response.store_color = row.store_color
    }

    res.json(response)
  })
})

module.exports = router