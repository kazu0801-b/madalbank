// ===================================
// 取引関連 APIエンドポイント
// ===================================
// 入金・払い出し処理と取引履歴の管理
//
// エンドポイント:
// GET  /api/transactions - 取引履歴取得
// POST /api/transactions - 入金・払い出し処理
// ===================================

const express = require('express')
const { getDatabase } = require('../database')
const router = express.Router()

/**
 * 取引履歴取得 API (Day2 拡張版)
 * 
 * URL: GET /api/transactions?userId=1&limit=10&type=deposit&dateFrom=2024-01-01
 * 目的: 指定ユーザーの取引履歴を新しい順で取得（フィルタ機能付き）
 * 
 * クエリパラメータ:
 * - userId: ユーザーID（必須）
 * - limit: 取得件数（デフォルト10件、最大100件）
 * - type: 取引種別フィルタ（"deposit", "withdraw"）
 * - dateFrom: 開始日時フィルタ（YYYY-MM-DD形式）
 * - dateTo: 終了日時フィルタ（YYYY-MM-DD形式）
 * - includeStats: 統計情報を含める（true/false）
 * 
 * レスポンス例:
 * {
 *   "user_id": 1,
 *   "transactions": [...],
 *   "count": 5,
 *   "total_count": 25,
 *   "stats": {
 *     "total_deposits": 5000,
 *     "total_withdraws": 2000,
 *     "net_change": 3000
 *   },
 *   "filters_applied": {...},
 *   "message": "取引履歴取得成功"
 * }
 */
router.get('/', (req, res) => {
  // Day2 拡張: より多くのクエリパラメータを処理
  const userId = parseInt(req.query.userId)
  const limit = Math.min(parseInt(req.query.limit) || 10, 100) // 最大100件制限
  const type = req.query.type // deposit, withdraw, または undefined
  const dateFrom = req.query.dateFrom // YYYY-MM-DD
  const dateTo = req.query.dateTo // YYYY-MM-DD
  const includeStats = req.query.includeStats === 'true'

  console.log(`📥 取引履歴取得: ユーザー=${userId}, 件数=${limit}, 種別=${type || '全て'}, 期間=${dateFrom || '無制限'}〜${dateTo || '無制限'}`)

  // バリデーション: ユーザーIDが有効かチェック
  if (isNaN(userId) || userId <= 0) {
    console.log(`⚠️  取引履歴取得: 無効なユーザーID - ${req.query.userId}`)
    return res.status(400).json({
      error: 'ユーザーIDが必要です',
      userId: req.query.userId,
      hint: '?userId=1 のようにクエリパラメータで指定してください'
    })
  }

  // Day2 追加: 取引種別バリデーション
  if (type && !['deposit', 'withdraw'].includes(type)) {
    return res.status(400).json({
      error: 'typeは "deposit" または "withdraw" である必要があります',
      received: type,
      valid_types: ['deposit', 'withdraw']
    })
  }

  // Day2 追加: 日付バリデーション
  if (dateFrom && !/^\d{4}-\d{2}-\d{2}$/.test(dateFrom)) {
    return res.status(400).json({
      error: 'dateFromはYYYY-MM-DD形式である必要があります',
      received: dateFrom,
      example: '2024-01-01'
    })
  }
  if (dateTo && !/^\d{4}-\d{2}-\d{2}$/.test(dateTo)) {
    return res.status(400).json({
      error: 'dateToはYYYY-MM-DD形式である必要があります',
      received: dateTo,
      example: '2024-01-31'
    })
  }

  const db = getDatabase()

  // Day2 拡張: 動的なクエリ構築（フィルタ対応）
  let whereConditions = ['user_id = ?']
  let queryParams = [userId]

  // 取引種別フィルタ
  if (type) {
    whereConditions.push('type = ?')
    queryParams.push(type)
  }

  // 日付範囲フィルタ
  if (dateFrom) {
    whereConditions.push('DATE(created_at) >= DATE(?)')
    queryParams.push(dateFrom)
  }
  if (dateTo) {
    whereConditions.push('DATE(created_at) <= DATE(?)')
    queryParams.push(dateTo)
  }

  // メインクエリ: 取引履歴を新しい順で取得
  const query = `
    SELECT 
      id,              -- 取引ID
      type,            -- 取引種別 (deposit/withdraw)
      amount,          -- 取引金額
      balance_before,  -- 取引前残高
      balance_after,   -- 取引後残高
      description,     -- 取引説明
      created_at,      -- 取引日時
      CASE 
        WHEN type = 'deposit' THEN '入金'
        WHEN type = 'withdraw' THEN '払い出し'
        ELSE type
      END as type_display  -- Day2追加: 日本語表示用
    FROM transactions
    WHERE ${whereConditions.join(' AND ')}  -- 動的WHERE句
    ORDER BY created_at DESC  -- 新しい順
    LIMIT ?           -- 件数制限
  `

  queryParams.push(limit)

  console.log(`🔍 実行SQL: ${query}`)  
  console.log(`📝 パラメータ: ${JSON.stringify(queryParams)}`)

  // Day2 拡張: 統計情報も取得（並行処理）
  const promises = []
  
  // メイン取引履歴取得
  const getTransactions = new Promise((resolve, reject) => {
    db.all(query, queryParams, (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
  })
  promises.push(getTransactions)

  // 全件数取得（フィルタ適用）
  const countQuery = `
    SELECT COUNT(*) as total
    FROM transactions
    WHERE ${whereConditions.join(' AND ')}
  `
  const getTotalCount = new Promise((resolve, reject) => {
    db.get(countQuery, queryParams.slice(0, -1), (err, row) => {
      if (err) reject(err)
      else resolve(row ? row.total : 0)
    })
  })
  promises.push(getTotalCount)

  // 統計情報取得（オプション）
  let getStats = Promise.resolve(null)
  if (includeStats) {
    const statsQuery = `
      SELECT 
        SUM(CASE WHEN type = 'deposit' THEN amount ELSE 0 END) as total_deposits,
        SUM(CASE WHEN type = 'withdraw' THEN amount ELSE 0 END) as total_withdraws,
        COUNT(CASE WHEN type = 'deposit' THEN 1 END) as deposit_count,
        COUNT(CASE WHEN type = 'withdraw' THEN 1 END) as withdraw_count,
        AVG(CASE WHEN type = 'deposit' THEN amount END) as avg_deposit,
        AVG(CASE WHEN type = 'withdraw' THEN amount END) as avg_withdraw
      FROM transactions
      WHERE ${whereConditions.join(' AND ')}
    `
    getStats = new Promise((resolve, reject) => {
      db.get(statsQuery, queryParams.slice(0, -1), (err, row) => {
        if (err) reject(err)
        else resolve(row)
      })
    })
    promises.push(getStats)
  }

  // 全ての処理を並行実行
  Promise.all(promises).then(results => {
    const [rows, totalCount, stats] = results
    
    console.log(`✅ ユーザーID ${userId} の取引履歴 ${rows.length}件/${totalCount}件 取得完了`)
    if (includeStats && stats) {
      console.log(`📊 統計: 入金総額=${stats.total_deposits || 0}, 払い出し総額=${stats.total_withdraws || 0}`)
    }
    db.close()

    // Day2 拡張レスポンス
    const response = {
      user_id: userId,
      transactions: rows,
      count: rows.length,
      total_count: totalCount,
      requested_limit: limit,
      filters_applied: {
        type: type || null,
        date_from: dateFrom || null,
        date_to: dateTo || null
      },
      message: '取引履歴取得成功'
    }

    // 統計情報を含める場合
    if (includeStats && stats) {
      response.stats = {
        total_deposits: stats.total_deposits || 0,
        total_withdraws: stats.total_withdraws || 0,
        net_change: (stats.total_deposits || 0) - (stats.total_withdraws || 0),
        deposit_count: stats.deposit_count || 0,
        withdraw_count: stats.withdraw_count || 0,
        avg_deposit: Math.round(stats.avg_deposit || 0),
        avg_withdraw: Math.round(stats.avg_withdraw || 0)
      }
    }

    res.json(response)
  }).catch(err => {
    console.error('❌ 取引履歴取得エラー:', err.message)
    db.close()
    return res.status(500).json({
      error: 'データベースエラーが発生しました',
      details: process.env.NODE_ENV === 'development' ? err.message : 'Database error'
    })
  })
})

/**
 * 入金・払い出し処理 API
 * 
 * URL: POST /api/transactions
 * 目的: メダルの入金または払い出しを処理する
 * 
 * リクエストボディ:
 * {
 *   "user_id": 1,
 *   "type": "deposit",     // "deposit"(入金) または "withdraw"(払い出し)
 *   "amount": 500,         // 金額（メダル数）
 *   "description": "説明"  // 任意の説明文
 * }
 * 
 * レスポンス例:
 * {
 *   "transaction_id": 1,
 *   "user_id": 1,
 *   "type": "deposit",
 *   "amount": 500,
 *   "balance_before": 1000,
 *   "balance_after": 1500,
 *   "message": "入金が完了しました"
 * }
 */
router.post('/', (req, res) => {
  // リクエストボディから必要な値を取得
  const { user_id, type, amount, description } = req.body

  console.log(`📥 取引処理リクエスト: ユーザーID=${user_id}, 種別=${type}, 金額=${amount}`)

  // ===================================
  // バリデーション（入力値チェック）
  // ===================================

  // 必須項目チェック
  if (!user_id || !type || !amount) {
    return res.status(400).json({
      error: '必要な情報が不足しています',
      required: ['user_id', 'type', 'amount'],
      received: req.body
    })
  }

  // 取引種別チェック
  if (!['deposit', 'withdraw'].includes(type)) {
    return res.status(400).json({
      error: 'typeは "deposit" または "withdraw" である必要があります',
      received: type,
      valid_types: ['deposit', 'withdraw']
    })
  }

  // 金額チェック
  if (amount <= 0) {
    return res.status(400).json({
      error: '金額は1以上である必要があります',
      received: amount
    })
  }

  const db = getDatabase()

  // ===================================
  // トランザクション処理
  // ===================================
  // 複数のSQL操作を一括で実行し、エラー時は全てロールバック

  db.serialize(() => {
    // Step 1: 現在の残高を取得
    console.log(`🔍 ユーザーID ${user_id} の現在残高を取得中...`)
    
    db.get('SELECT amount FROM balance WHERE user_id = ?', [user_id], (err, row) => {
      if (err) {
        console.error('❌ 残高取得エラー:', err.message)
        db.close()
        return res.status(500).json({
          error: 'データベースエラー（残高取得）',
          details: process.env.NODE_ENV === 'development' ? err.message : 'Database error'
        })
      }

      if (!row) {
        console.log(`⚠️  ユーザーID ${user_id} の残高情報が見つかりません`)
        db.close()
        return res.status(404).json({
          error: 'ユーザーの残高情報が見つかりません',
          user_id: user_id,
          hint: 'MVP版ではユーザーID=1のみ利用可能です'
        })
      }

      const currentBalance = row.amount
      let newBalance

      // Step 2: 新しい残高を計算
      if (type === 'deposit') {
        // 入金の場合: 現在残高 + 入金額
        newBalance = currentBalance + amount
        console.log(`💰 入金処理: ${currentBalance} + ${amount} = ${newBalance}`)
      } else { // withdraw
        // 払い出しの場合: 残高不足チェック
        if (currentBalance < amount) {
          console.log(`⚠️  残高不足: 現在${currentBalance}メダル、要求${amount}メダル`)
          db.close()
          return res.status(400).json({
            error: '残高不足です',
            current_balance: currentBalance,
            requested_amount: amount,
            shortage: amount - currentBalance
          })
        }
        // 払い出し: 現在残高 - 払い出し額
        newBalance = currentBalance - amount
        console.log(`💸 払い出し処理: ${currentBalance} - ${amount} = ${newBalance}`)
      }

      // Step 3: 残高を更新
      console.log(`🔄 残高を ${currentBalance} → ${newBalance} に更新中...`)
      
      db.run('UPDATE balance SET amount = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?', 
        [newBalance, user_id], 
        function(err) {
          if (err) {
            console.error('❌ 残高更新エラー:', err.message)
            db.close()
            return res.status(500).json({
              error: '残高更新に失敗しました',
              details: process.env.NODE_ENV === 'development' ? err.message : 'Database error'
            })
          }

          // Step 4: 取引履歴を追加
          console.log(`📝 取引履歴を記録中...`)
          
          db.run(`
            INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, description)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [user_id, type, amount, currentBalance, newBalance, description || ''], 
          function(err) {
            if (err) {
              console.error('❌ 取引履歴追加エラー:', err.message)
              db.close()
              return res.status(500).json({
                error: '取引履歴の保存に失敗しました',
                details: process.env.NODE_ENV === 'development' ? err.message : 'Database error'
              })
            }

            console.log(`✅ 取引完了: ID=${this.lastID}, 新残高=${newBalance}メダル`)
            db.close()

            // 成功レスポンス
            const actionText = type === 'deposit' ? '入金' : '払い出し'
            res.json({
              transaction_id: this.lastID,    // 作成された取引レコードのID
              user_id: user_id,
              type: type,
              amount: amount,
              balance_before: currentBalance,
              balance_after: newBalance,
              description: description || '',
              message: `${actionText}が完了しました`
            })
          })
        }
      )
    })
  })
})

// このルーターをエクスポート（server.jsで使用される）
module.exports = router