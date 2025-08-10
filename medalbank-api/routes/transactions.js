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
 * 取引履歴取得 API
 * 
 * URL: GET /api/transactions?userId=1&limit=10
 * 目的: 指定ユーザーの取引履歴を新しい順で取得
 * 
 * クエリパラメータ:
 * - userId: ユーザーID（必須）
 * - limit: 取得件数（デフォルト10件）
 * 
 * レスポンス例:
 * {
 *   "user_id": 1,
 *   "transactions": [
 *     {
 *       "id": 1,
 *       "type": "deposit",
 *       "amount": 500,
 *       "balance_before": 1000,
 *       "balance_after": 1500,
 *       "description": "入金",
 *       "created_at": "2024-01-01 12:00:00"
 *     }
 *   ],
 *   "count": 1,
 *   "message": "取引履歴取得成功"
 * }
 */
router.get('/', (req, res) => {
  // クエリパラメータから値を取得
  // ?userId=1&limit=5 → req.query.userId = "1", req.query.limit = "5"
  const userId = parseInt(req.query.userId)
  const limit = parseInt(req.query.limit) || 10 // デフォルト10件

  // バリデーション: ユーザーIDが有効かチェック
  if (isNaN(userId) || userId <= 0) {
    console.log(`⚠️  取引履歴取得: 無効なユーザーID - ${req.query.userId}`)
    return res.status(400).json({
      error: 'ユーザーIDが必要です',
      userId: req.query.userId,
      hint: '?userId=1 のようにクエリパラメータで指定してください'
    })
  }

  const db = getDatabase()

  // SQL: 取引履歴を新しい順で取得
  // ORDER BY created_at DESC = 作成日時の降順（新しいものが先）
  const query = `
    SELECT 
      id,              -- 取引ID
      type,            -- 取引種別 (deposit/withdraw)
      amount,          -- 取引金額
      balance_before,  -- 取引前残高
      balance_after,   -- 取引後残高
      description,     -- 取引説明
      created_at       -- 取引日時
    FROM transactions
    WHERE user_id = ?  -- 指定ユーザーのみ
    ORDER BY created_at DESC  -- 新しい順
    LIMIT ?           -- 件数制限
  `

  // SQL実行: db.all() = 複数件のレコードを配列で取得
  db.all(query, [userId, limit], (err, rows) => {
    if (err) {
      console.error('❌ 取引履歴取得SQLエラー:', err.message)
      db.close()
      return res.status(500).json({
        error: 'データベースエラーが発生しました',
        details: process.env.NODE_ENV === 'development' ? err.message : 'Database error'
      })
    }

    console.log(`✅ ユーザーID ${userId} の取引履歴 ${rows.length}件 取得完了`)
    db.close()

    // 成功レスポンス
    res.json({
      user_id: userId,
      transactions: rows,        // 取引履歴配列
      count: rows.length,        // 実際の取得件数
      requested_limit: limit,    // 要求した上限件数
      message: '取引履歴取得成功'
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