// ===================================
// 統計・分析関連 APIエンドポイント (Day2追加)
// ===================================
// ユーザーの取引データを分析し、統計情報を提供
//
// エンドポイント:
// GET  /api/stats/user/:userId    - ユーザー統計情報
// GET  /api/stats/summary/:userId - サマリー統計（メイン画面用）
// GET  /api/stats/trends/:userId  - 取引トレンド分析
// ===================================

const express = require('express')
const { getDatabase } = require('../database')
const router = express.Router()

/**
 * ユーザー統計情報 API (Day2追加)
 * 
 * URL: GET /api/stats/user/:userId?period=7d
 * 目的: 指定期間のユーザー取引統計を取得
 * 
 * クエリパラメータ:
 * - period: 集計期間 ("7d", "30d", "90d", "all")
 * 
 * レスポンス例:
 * {
 *   "user_id": 1,
 *   "period": "7d",
 *   "total_deposits": 5000,
 *   "total_withdraws": 2000,
 *   "net_change": 3000,
 *   "transaction_count": 25,
 *   "avg_transaction": 280,
 *   "largest_deposit": 1000,
 *   "largest_withdraw": 500,
 *   "daily_breakdown": [...],
 *   "message": "統計情報取得成功"
 * }
 */
router.get('/user/:userId', (req, res) => {
  const userId = parseInt(req.params.userId)
  const period = req.query.period || '30d'

  // バリデーション
  if (isNaN(userId) || userId <= 0) {
    return res.status(400).json({
      error: '無効なユーザーID',
      userId: req.params.userId
    })
  }

  const validPeriods = ['7d', '30d', '90d', 'all']
  if (!validPeriods.includes(period)) {
    return res.status(400).json({
      error: '無効な期間指定',
      received: period,
      valid_periods: validPeriods
    })
  }

  console.log(`📊 ユーザー統計取得: ID=${userId}, 期間=${period}`)

  const db = getDatabase()

  // 期間に応じたWHERE句の構築
  let dateCondition = ''
  let dateParams = []

  if (period !== 'all') {
    const days = parseInt(period.replace('d', ''))
    dateCondition = 'AND created_at >= DATE("now", "-' + days + ' days")'
  }

  // 基本統計情報を取得
  const statsQuery = `
    SELECT 
      COUNT(*) as total_transactions,
      SUM(CASE WHEN type = 'deposit' THEN amount ELSE 0 END) as total_deposits,
      SUM(CASE WHEN type = 'withdraw' THEN amount ELSE 0 END) as total_withdraws,
      COUNT(CASE WHEN type = 'deposit' THEN 1 END) as deposit_count,
      COUNT(CASE WHEN type = 'withdraw' THEN 1 END) as withdraw_count,
      AVG(amount) as avg_transaction,
      MAX(CASE WHEN type = 'deposit' THEN amount END) as largest_deposit,
      MAX(CASE WHEN type = 'withdraw' THEN amount END) as largest_withdraw,
      MIN(created_at) as first_transaction,
      MAX(created_at) as last_transaction
    FROM transactions 
    WHERE user_id = ? ${dateCondition}
  `

  // 日別集計データを取得
  const dailyQuery = `
    SELECT 
      DATE(created_at) as date,
      SUM(CASE WHEN type = 'deposit' THEN amount ELSE 0 END) as daily_deposits,
      SUM(CASE WHEN type = 'withdraw' THEN amount ELSE 0 END) as daily_withdraws,
      COUNT(*) as daily_transactions
    FROM transactions 
    WHERE user_id = ? ${dateCondition}
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `

  // 複数クエリを並行実行
  Promise.all([
    new Promise((resolve, reject) => {
      db.get(statsQuery, [userId, ...dateParams], (err, row) => {
        if (err) reject(err)
        else resolve(row)
      })
    }),
    new Promise((resolve, reject) => {
      db.all(dailyQuery, [userId, ...dateParams], (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      })
    })
  ]).then(([stats, dailyData]) => {
    console.log(`✅ ユーザーID ${userId} の${period}統計: 取引${stats.total_transactions}件, 純増${(stats.total_deposits || 0) - (stats.total_withdraws || 0)}メダル`)
    db.close()

    const response = {
      user_id: userId,
      period: period,
      period_display: period === 'all' ? '全期間' : `過去${period.replace('d', '日')}`,
      total_deposits: stats.total_deposits || 0,
      total_withdraws: stats.total_withdraws || 0,
      net_change: (stats.total_deposits || 0) - (stats.total_withdraws || 0),
      transaction_count: stats.total_transactions || 0,
      deposit_count: stats.deposit_count || 0,
      withdraw_count: stats.withdraw_count || 0,
      avg_transaction: Math.round(stats.avg_transaction || 0),
      largest_deposit: stats.largest_deposit || 0,
      largest_withdraw: stats.largest_withdraw || 0,
      first_transaction: stats.first_transaction,
      last_transaction: stats.last_transaction,
      daily_breakdown: dailyData,
      generated_at: new Date().toISOString(),
      message: '統計情報取得成功'
    }

    res.json(response)
  }).catch(err => {
    console.error('❌ 統計情報取得エラー:', err.message)
    db.close()
    res.status(500).json({
      error: 'データベースエラーが発生しました',
      details: process.env.NODE_ENV === 'development' ? err.message : 'Database error'
    })
  })
})

/**
 * サマリー統計 API (Day2追加)
 * 
 * URL: GET /api/stats/summary/:userId
 * 目的: メイン画面表示用の簡潔な統計情報
 */
router.get('/summary/:userId', (req, res) => {
  const userId = parseInt(req.params.userId)

  if (isNaN(userId) || userId <= 0) {
    return res.status(400).json({
      error: '無効なユーザーID',
      userId: req.params.userId
    })
  }

  console.log(`📈 サマリー統計取得: ID=${userId}`)

  const db = getDatabase()

  // 複数の統計を一度に取得
  const summaryQuery = `
    SELECT 
      (SELECT amount FROM balance WHERE user_id = ?) as current_balance,
      (SELECT COUNT(*) FROM transactions WHERE user_id = ?) as total_transactions,
      (SELECT COUNT(*) FROM transactions WHERE user_id = ? AND DATE(created_at) = DATE('now')) as today_transactions,
      (SELECT SUM(amount) FROM transactions WHERE user_id = ? AND type = 'deposit' AND DATE(created_at) >= DATE('now', '-7 days')) as week_deposits,
      (SELECT SUM(amount) FROM transactions WHERE user_id = ? AND type = 'withdraw' AND DATE(created_at) >= DATE('now', '-7 days')) as week_withdraws,
      (SELECT MAX(created_at) FROM transactions WHERE user_id = ?) as last_transaction_time
  `

  db.get(summaryQuery, [userId, userId, userId, userId, userId, userId], (err, row) => {
    if (err) {
      console.error('❌ サマリー統計取得エラー:', err.message)
      db.close()
      return res.status(500).json({ error: 'データベースエラー' })
    }

    if (!row || row.current_balance === null) {
      db.close()
      return res.status(404).json({ error: 'ユーザーが見つかりません' })
    }

    console.log(`✅ ユーザーID ${userId} サマリー: 残高${row.current_balance}メダル, 総取引${row.total_transactions}件`)
    db.close()

    res.json({
      user_id: userId,
      current_balance: row.current_balance,
      total_transactions: row.total_transactions || 0,
      today_transactions: row.today_transactions || 0,
      week_net_change: (row.week_deposits || 0) - (row.week_withdraws || 0),
      week_deposits: row.week_deposits || 0,
      week_withdraws: row.week_withdraws || 0,
      last_transaction_time: row.last_transaction_time,
      is_active_today: row.today_transactions > 0,
      message: 'サマリー統計取得成功'
    })
  })
})

/**
 * 取引トレンド分析 API (Day2追加)
 * 
 * URL: GET /api/stats/trends/:userId?days=30
 * 目的: 時系列での取引パターン分析
 */
router.get('/trends/:userId', (req, res) => {
  const userId = parseInt(req.params.userId)
  const days = Math.min(parseInt(req.query.days) || 30, 365) // 最大365日

  if (isNaN(userId) || userId <= 0) {
    return res.status(400).json({
      error: '無効なユーザーID',
      userId: req.params.userId
    })
  }

  console.log(`📉 トレンド分析: ID=${userId}, 期間=${days}日`)

  const db = getDatabase()

  // 日別トレンドデータを取得
  const trendQuery = `
    SELECT 
      DATE(created_at) as date,
      SUM(CASE WHEN type = 'deposit' THEN amount ELSE 0 END) as deposits,
      SUM(CASE WHEN type = 'withdraw' THEN amount ELSE 0 END) as withdraws,
      COUNT(*) as transactions,
      SUM(CASE WHEN type = 'deposit' THEN amount ELSE -amount END) as net_change
    FROM transactions 
    WHERE user_id = ? 
      AND created_at >= DATE('now', '-${days} days')
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `

  db.all(trendQuery, [userId], (err, rows) => {
    if (err) {
      console.error('❌ トレンド分析エラー:', err.message)
      db.close()
      return res.status(500).json({ error: 'データベースエラー' })
    }

    console.log(`✅ ユーザーID ${userId} の${days}日トレンド: ${rows.length}日分のデータ`)
    db.close()

    // 簡単な傾向分析
    const totalDays = rows.length
    const avgDailyNet = totalDays > 0 ? rows.reduce((sum, day) => sum + day.net_change, 0) / totalDays : 0
    const trend = avgDailyNet > 10 ? '増加傾向' : avgDailyNet < -10 ? '減少傾向' : '安定'

    res.json({
      user_id: userId,
      analysis_period: `${days}日間`,
      data_points: totalDays,
      daily_data: rows,
      trend_analysis: {
        overall_trend: trend,
        avg_daily_net: Math.round(avgDailyNet),
        most_active_day: rows.length > 0 ? rows.reduce((max, day) => day.transactions > max.transactions ? day : max, rows[0]) : null
      },
      message: 'トレンド分析完了'
    })
  })
})

module.exports = router