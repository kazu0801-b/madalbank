// ===================================
// バッチ処理関連 APIエンドポイント (Day2追加)
// ===================================
// 複数の取引を一括処理するためのエンドポイント
//
// エンドポイント:
// POST /api/batch/transactions  - 複数取引の一括処理
// POST /api/batch/bulk-deposit  - 一括入金処理
// POST /api/batch/bulk-withdraw - 一括払い出し処理
// GET  /api/batch/validate      - バッチ処理前の検証
// ===================================

const express = require('express')
const { getDatabase } = require('../database')
const router = express.Router()

/**
 * 複数取引一括処理 API (Day2追加)
 * 
 * URL: POST /api/batch/transactions
 * 目的: 複数の取引を一度に処理（アトミック実行）
 * 
 * リクエストボディ:
 * {
 *   "user_id": 1,
 *   "transactions": [
 *     {"type": "deposit", "amount": 500, "description": "入金1"},
 *     {"type": "withdraw", "amount": 200, "description": "払い出し1"},
 *     {"type": "deposit", "amount": 300, "description": "入金2"}
 *   ],
 *   "validate_only": false
 * }
 * 
 * レスポンス例:
 * {
 *   "batch_id": "batch_1_1638360000000",
 *   "user_id": 1,
 *   "processed_count": 3,
 *   "balance_before": 1000,
 *   "balance_after": 1600,
 *   "total_net_change": 600,
 *   "transaction_ids": [1, 2, 3],
 *   "processing_time": "0.5s",
 *   "message": "バッチ処理完了"
 * }
 */
router.post('/transactions', (req, res) => {
  const { user_id, transactions, validate_only = false } = req.body
  const batchId = `batch_${user_id}_${Date.now()}`

  console.log(`🚀 バッチ処理開始: ${batchId}, 件数=${transactions?.length || 0}, 検証のみ=${validate_only}`)
  const startTime = Date.now()

  // バリデーション
  if (!user_id || !Array.isArray(transactions) || transactions.length === 0) {
    return res.status(400).json({
      error: '必要な情報が不足しています',
      required: ['user_id', 'transactions (array)'],
      received: { user_id, transactions_count: transactions?.length || 0 }
    })
  }

  if (transactions.length > 50) {
    return res.status(400).json({
      error: '一度に処理できるのは最大50件です',
      received_count: transactions.length,
      max_allowed: 50
    })
  }

  // 個別取引のバリデーション
  const validationErrors = []
  let totalNetChange = 0

  transactions.forEach((tx, index) => {
    if (!tx.type || !['deposit', 'withdraw'].includes(tx.type)) {
      validationErrors.push(`取引${index + 1}: 無効な種別 "${tx.type}"`)
    }
    if (!tx.amount || tx.amount <= 0) {
      validationErrors.push(`取引${index + 1}: 無効な金額 "${tx.amount}"`)
    } else {
      totalNetChange += tx.type === 'deposit' ? tx.amount : -tx.amount
    }
  })

  if (validationErrors.length > 0) {
    return res.status(400).json({
      error: 'バリデーションエラー',
      batch_id: batchId,
      validation_errors: validationErrors
    })
  }

  const db = getDatabase()

  // 現在残高を取得
  db.get('SELECT amount FROM balance WHERE user_id = ?', [user_id], (err, balanceRow) => {
    if (err) {
      console.error('❌ 残高取得エラー:', err.message)
      db.close()
      return res.status(500).json({ error: 'データベースエラー（残高取得）' })
    }

    if (!balanceRow) {
      db.close()
      return res.status(404).json({ error: 'ユーザーが見つかりません' })
    }

    const currentBalance = balanceRow.amount
    const finalBalance = currentBalance + totalNetChange

    // 残高不足チェック
    if (finalBalance < 0) {
      db.close()
      return res.status(400).json({
        error: 'バッチ処理により残高不足となります',
        batch_id: batchId,
        current_balance: currentBalance,
        total_net_change: totalNetChange,
        would_result_in: finalBalance,
        shortage: Math.abs(finalBalance)
      })
    }

    // 検証のみの場合はここで終了
    if (validate_only) {
      db.close()
      const processingTime = ((Date.now() - startTime) / 1000).toFixed(2)
      
      return res.json({
        message: 'バッチ処理検証完了',
        batch_id: batchId,
        user_id: user_id,
        transaction_count: transactions.length,
        balance_before: currentBalance,
        balance_after: finalBalance,
        total_net_change: totalNetChange,
        validation_status: 'OK',
        processing_time: `${processingTime}s`,
        note: '実際の処理は行われませんでした'
      })
    }

    // 実際のバッチ処理を開始
    console.log(`💾 バッチ処理実行: ${transactions.length}件の取引を処理中...`)

    db.serialize(() => {
      // トランザクション開始
      db.run('BEGIN TRANSACTION')

      let currentRunningBalance = currentBalance
      const processedTransactions = []
      let processedCount = 0

      // 各取引を順次処理
      const processTransaction = (txIndex) => {
        if (txIndex >= transactions.length) {
          // 全取引完了 - 残高を最終更新
          db.run('UPDATE balance SET amount = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
            [finalBalance, user_id],
            (err) => {
              if (err) {
                console.error('❌ 最終残高更新エラー:', err.message)
                db.run('ROLLBACK')
                db.close()
                return res.status(500).json({ 
                  error: 'バッチ処理失敗（残高更新）',
                  batch_id: batchId
                })
              }

              // コミット
              db.run('COMMIT', (err) => {
                if (err) {
                  console.error('❌ コミットエラー:', err.message)
                  db.run('ROLLBACK')
                  db.close()
                  return res.status(500).json({ 
                    error: 'バッチ処理失敗（コミット）',
                    batch_id: batchId
                  })
                }

                const processingTime = ((Date.now() - startTime) / 1000).toFixed(2)
                console.log(`✅ バッチ処理完了: ${batchId}, 処理件数=${processedCount}, 処理時間=${processingTime}s`)
                db.close()

                res.json({
                  batch_id: batchId,
                  user_id: user_id,
                  processed_count: processedCount,
                  balance_before: currentBalance,
                  balance_after: finalBalance,
                  total_net_change: totalNetChange,
                  transaction_ids: processedTransactions.map(t => t.id),
                  transactions_summary: processedTransactions,
                  processing_time: `${processingTime}s`,
                  message: 'バッチ処理完了'
                })
              })
            }
          )
          return
        }

        const tx = transactions[txIndex]
        const balanceBefore = currentRunningBalance
        const balanceAfter = tx.type === 'deposit' 
          ? currentRunningBalance + tx.amount 
          : currentRunningBalance - tx.amount

        // 取引履歴に記録
        db.run(`
          INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, description)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          user_id,
          tx.type,
          tx.amount,
          balanceBefore,
          balanceAfter,
          tx.description || `バッチ処理 ${txIndex + 1}/${transactions.length}`
        ], function(err) {
          if (err) {
            console.error(`❌ 取引${txIndex + 1}処理エラー:`, err.message)
            db.run('ROLLBACK')
            db.close()
            return res.status(500).json({ 
              error: `取引${txIndex + 1}の処理に失敗しました`,
              batch_id: batchId,
              failed_transaction: tx
            })
          }

          // 成功 - 次の取引へ
          currentRunningBalance = balanceAfter
          processedTransactions.push({
            id: this.lastID,
            type: tx.type,
            amount: tx.amount,
            balance_after: balanceAfter
          })
          processedCount++

          console.log(`📝 取引${txIndex + 1}完了: ${tx.type} ${tx.amount}メダル, 新残高=${balanceAfter}`)
          
          // 次の取引を処理
          setImmediate(() => processTransaction(txIndex + 1))
        })
      }

      // バッチ処理開始
      processTransaction(0)
    })
  })
})

/**
 * 一括入金処理 API (Day2追加)
 * 
 * URL: POST /api/batch/bulk-deposit
 * 目的: 同じ金額での複数回入金を簡単に処理
 */
router.post('/bulk-deposit', (req, res) => {
  const { user_id, amount, count, description } = req.body

  if (!user_id || !amount || !count || amount <= 0 || count <= 0 || count > 20) {
    return res.status(400).json({
      error: '無効なリクエスト',
      required: ['user_id', 'amount (> 0)', 'count (1-20)'],
      received: { user_id, amount, count }
    })
  }

  // バッチ処理用のトランザクション配列を生成
  const transactions = Array(count).fill().map((_, index) => ({
    type: 'deposit',
    amount: amount,
    description: description || `一括入金 ${index + 1}/${count}`
  }))

  // 既存のバッチ処理APIを呼び出し
  req.body = { user_id, transactions }
  router.handle({ ...req, url: '/transactions', method: 'POST' }, res)
})

/**
 * 一括払い出し処理 API (Day2追加)
 * 
 * URL: POST /api/batch/bulk-withdraw
 * 目的: 同じ金額での複数回払い出しを簡単に処理
 */
router.post('/bulk-withdraw', (req, res) => {
  const { user_id, amount, count, description } = req.body

  if (!user_id || !amount || !count || amount <= 0 || count <= 0 || count > 20) {
    return res.status(400).json({
      error: '無効なリクエスト',
      required: ['user_id', 'amount (> 0)', 'count (1-20)'],
      received: { user_id, amount, count }
    })
  }

  // バッチ処理用のトランザクション配列を生成
  const transactions = Array(count).fill().map((_, index) => ({
    type: 'withdraw',
    amount: amount,
    description: description || `一括払い出し ${index + 1}/${count}`
  }))

  // 既存のバッチ処理APIを呼び出し
  req.body = { user_id, transactions }
  router.handle({ ...req, url: '/transactions', method: 'POST' }, res)
})

/**
 * バッチ処理検証 API (Day2追加)
 * 
 * URL: GET /api/batch/validate?userId=1&netChange=500
 * 目的: バッチ処理実行前の事前検証
 */
router.get('/validate', (req, res) => {
  const userId = parseInt(req.query.userId)
  const netChange = parseInt(req.query.netChange) || 0

  if (isNaN(userId) || userId <= 0) {
    return res.status(400).json({
      error: '無効なユーザーID',
      userId: req.query.userId
    })
  }

  const db = getDatabase()

  db.get('SELECT amount FROM balance WHERE user_id = ?', [userId], (err, row) => {
    if (err) {
      console.error('❌ 残高チェックエラー:', err.message)
      db.close()
      return res.status(500).json({ error: 'データベースエラー' })
    }

    if (!row) {
      db.close()
      return res.status(404).json({ error: 'ユーザーが見つかりません' })
    }

    const currentBalance = row.amount
    const projectedBalance = currentBalance + netChange

    db.close()

    const validationResult = {
      user_id: userId,
      current_balance: currentBalance,
      net_change: netChange,
      projected_balance: projectedBalance,
      is_valid: projectedBalance >= 0,
      warning: null,
      message: projectedBalance >= 0 ? '検証成功' : '検証失敗'
    }

    if (projectedBalance < 0) {
      validationResult.warning = '残高不足により処理できません'
      validationResult.shortage = Math.abs(projectedBalance)
    } else if (projectedBalance < 100) {
      validationResult.warning = '処理後の残高が100メダルを下回ります'
    }

    console.log(`🔍 バッチ検証: ユーザー${userId}, 現在残高=${currentBalance}, 純変更=${netChange}, 結果=${validationResult.is_valid ? 'OK' : 'NG'}`)

    res.json(validationResult)
  })
})

module.exports = router