// ===================================
// 店舗管理API
// Day5追加: 店舗ごとのデータ分離機能
// ===================================

const express = require('express');
const { getDatabase } = require('../database');
const router = express.Router();

/**
 * 全店舗取得 GET /api/stores
 */
router.get('/', (req, res) => {
  const db = getDatabase();
  
  const query = `
    SELECT 
      s.*,
      COUNT(DISTINCT b.user_id) as user_count,
      COALESCE(SUM(b.amount), 0) as total_balance
    FROM stores s
    LEFT JOIN balance b ON s.id = b.store_id
    GROUP BY s.id
    ORDER BY s.created_at ASC
  `;

  db.all(query, [], (err, stores) => {
    if (err) {
      console.error('店舗取得エラー:', err);
      db.close();
      return res.status(500).json({
        error: '店舗データの取得に失敗しました',
        details: process.env.NODE_ENV === 'development' ? err.message : 'Database error'
      });
    }

    console.log(`✅ 店舗一覧取得: ${stores.length}件`);
    db.close();
    
    res.json({
      stores: stores,
      count: stores.length,
      message: '店舗一覧を取得しました'
    });
  });
});

/**
 * 特定店舗取得 GET /api/stores/:id
 */
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const db = getDatabase();

  const query = `
    SELECT 
      s.*,
      COUNT(DISTINCT b.user_id) as user_count,
      COALESCE(SUM(b.amount), 0) as total_balance
    FROM stores s
    LEFT JOIN balance b ON s.id = b.store_id
    WHERE s.id = ?
    GROUP BY s.id
  `;

  db.get(query, [id], (err, store) => {
    if (err) {
      console.error('店舗取得エラー:', err);
      db.close();
      return res.status(500).json({
        error: '店舗データの取得に失敗しました',
        details: process.env.NODE_ENV === 'development' ? err.message : 'Database error'
      });
    }

    if (!store) {
      db.close();
      return res.status(404).json({
        error: '指定された店舗が見つかりません',
        store_id: id
      });
    }

    console.log(`✅ 店舗取得: ${store.name}`);
    db.close();
    
    res.json({
      store: store,
      message: '店舗情報を取得しました'
    });
  });
});

/**
 * 店舗作成 POST /api/stores
 */
router.post('/', (req, res) => {
  const { name, description, color, createBalanceForAllUsers } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({
      error: '店舗名は必須です',
      required: ['name'],
      received: req.body
    });
  }

  const db = getDatabase();

  // 既存店舗名の重複チェック
  db.get('SELECT id FROM stores WHERE name = ?', [name.trim()], (checkErr, existingStore) => {
    if (checkErr) {
      console.error('店舗名重複チェックエラー:', checkErr);
      db.close();
      return res.status(500).json({
        error: '店舗名の重複チェックに失敗しました',
        details: process.env.NODE_ENV === 'development' ? checkErr.message : 'Database error'
      });
    }

    if (existingStore) {
      db.close();
      return res.status(400).json({
        error: 'この店舗名は既に使用されています',
        existing_store_name: name.trim(),
        hint: '別の店舗名を指定してください'
      });
    }

    // 店舗作成
    const query = `
      INSERT INTO stores (name, description, color, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `;

    db.run(query, [
      name.trim(),
      description || null,
      color || '#3B82F6'
    ], function(insertErr) {
      if (insertErr) {
        console.error('店舗作成エラー:', insertErr);
        db.close();
        return res.status(500).json({
          error: '店舗の作成に失敗しました',
          details: process.env.NODE_ENV === 'development' ? insertErr.message : 'Database error'
        });
      }

      const newStoreId = this.lastID;
      
      // 全ユーザーに対して店舗別残高レコードを作成するかどうか
      if (createBalanceForAllUsers) {
        console.log(`📝 新店舗 ${name.trim()} の全ユーザー残高レコードを作成中...`);
        
        // 全ユーザーを取得して残高レコードを作成
        db.all('SELECT id FROM users', [], (usersErr, users) => {
          if (usersErr) {
            console.error('ユーザー取得エラー:', usersErr);
            db.close();
            return res.status(500).json({
              error: '新店舗用ユーザー残高の作成に失敗しました'
            });
          }

          if (users.length === 0) {
            // ユーザーがいない場合はそのまま完了
            finishStoreCreation();
            return;
          }

          let completedInserts = 0;
          let hasError = false;

          users.forEach(user => {
            db.run(
              'INSERT INTO balance (user_id, store_id, amount) VALUES (?, ?, 0)',
              [user.id, newStoreId],
              function(balanceErr) {
                if (balanceErr && !hasError) {
                  hasError = true;
                  console.error('残高レコード作成エラー:', balanceErr);
                  db.close();
                  return res.status(500).json({
                    error: '新店舗用残高レコードの作成に失敗しました'
                  });
                }

                completedInserts++;
                if (completedInserts === users.length && !hasError) {
                  console.log(`✅ ${users.length}人のユーザーに店舗 ${name.trim()} の残高レコードを作成しました`);
                  finishStoreCreation();
                }
              }
            );
          });
        });
      } else {
        finishStoreCreation();
      }

      function finishStoreCreation() {
        // 作成した店舗を統計情報付きで取得
        const selectQuery = `
          SELECT 
            s.*,
            COUNT(DISTINCT b.user_id) as user_count,
            COALESCE(SUM(b.amount), 0) as total_balance
          FROM stores s
          LEFT JOIN balance b ON s.id = b.store_id
          WHERE s.id = ?
          GROUP BY s.id
        `;

        db.get(selectQuery, [newStoreId], (selectErr, newStore) => {
          db.close();
          
          if (selectErr) {
            console.error('作成店舗取得エラー:', selectErr);
            return res.status(500).json({
              error: '店舗作成後の取得に失敗しました'
            });
          }

          console.log(`✅ 店舗作成完了: ${newStore.name} (ID: ${newStoreId})`);
          
          res.json({
            store: newStore,
            created_balance_records: createBalanceForAllUsers,
            message: `店舗「${newStore.name}」を作成しました${createBalanceForAllUsers ? '（全ユーザーの残高レコードも作成済み）' : ''}`
          });
        });
      }
    });
  });
});

/**
 * 店舗統計情報 GET /api/stores/:id/stats
 */
router.get('/:id/stats', (req, res) => {
  const { id } = req.params;
  const db = getDatabase();

  // 基本統計
  const statsQuery = `
    SELECT 
      COUNT(DISTINCT b.user_id) as user_count,
      COALESCE(SUM(b.amount), 0) as total_balance,
      COUNT(t.id) as transaction_count,
      COALESCE(SUM(CASE WHEN t.type = 'deposit' THEN t.amount ELSE 0 END), 0) as total_deposits,
      COALESCE(SUM(CASE WHEN t.type = 'withdraw' THEN t.amount ELSE 0 END), 0) as total_withdrawals
    FROM stores s
    LEFT JOIN balance b ON s.id = b.store_id
    LEFT JOIN transactions t ON s.id = t.store_id
    WHERE s.id = ?
    GROUP BY s.id
  `;

  db.get(statsQuery, [id], (err, stats) => {
    if (err) {
      console.error('店舗統計取得エラー:', err);
      db.close();
      return res.status(500).json({
        error: '店舗統計情報の取得に失敗しました',
        details: process.env.NODE_ENV === 'development' ? err.message : 'Database error'
      });
    }

    if (!stats) {
      db.close();
      return res.status(404).json({
        error: '指定された店舗が見つかりません',
        store_id: id
      });
    }

    // 最近の取引
    const transactionsQuery = `
      SELECT 
        t.*,
        u.username
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      WHERE t.store_id = ?
      ORDER BY t.created_at DESC
      LIMIT 10
    `;

    db.all(transactionsQuery, [id], (transErr, recentTransactions) => {
      db.close();
      
      if (transErr) {
        console.error('最近の取引取得エラー:', transErr);
        return res.status(500).json({
          error: '最近の取引の取得に失敗しました'
        });
      }

      console.log(`✅ 店舗統計取得: 店舗ID ${id}`);

      res.json({
        ...stats,
        recent_transactions: recentTransactions,
        message: '店舗統計情報を取得しました'
      });
    });
  });
});

/**
 * 店舗更新 PUT /api/stores/:id
 */
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, color } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({
      error: '店舗名は必須です',
      required: ['name'],
      received: req.body
    });
  }

  const db = getDatabase();

  // 店舗の存在確認
  db.get('SELECT * FROM stores WHERE id = ?', [id], (checkErr, existingStore) => {
    if (checkErr) {
      console.error('店舗存在確認エラー:', checkErr);
      db.close();
      return res.status(500).json({
        error: '店舗の存在確認に失敗しました',
        details: process.env.NODE_ENV === 'development' ? checkErr.message : 'Database error'
      });
    }

    if (!existingStore) {
      db.close();
      return res.status(404).json({
        error: '指定された店舗が見つかりません',
        store_id: id
      });
    }

    // 重複店舗名チェック（自分以外）
    db.get('SELECT id FROM stores WHERE name = ? AND id != ?', [name.trim(), id], (dupErr, duplicateStore) => {
      if (dupErr) {
        console.error('重複チェックエラー:', dupErr);
        db.close();
        return res.status(500).json({
          error: '店舗名の重複チェックに失敗しました'
        });
      }

      if (duplicateStore) {
        db.close();
        return res.status(400).json({
          error: 'この店舗名は既に使用されています',
          existing_store_name: name.trim(),
          hint: '別の店舗名を指定してください'
        });
      }

      // 店舗情報を更新
      const query = `
        UPDATE stores 
        SET name = ?, description = ?, color = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      db.run(query, [
        name.trim(),
        description || null,
        color || existingStore.color,
        id
      ], function(updateErr) {
        if (updateErr) {
          console.error('店舗更新エラー:', updateErr);
          db.close();
          return res.status(500).json({
            error: '店舗の更新に失敗しました',
            details: process.env.NODE_ENV === 'development' ? updateErr.message : 'Database error'
          });
        }

        // 更新された店舗を取得
        const selectQuery = `
          SELECT 
            s.*,
            COUNT(DISTINCT b.user_id) as user_count,
            COALESCE(SUM(b.amount), 0) as total_balance
          FROM stores s
          LEFT JOIN balance b ON s.id = b.store_id
          WHERE s.id = ?
          GROUP BY s.id
        `;

        db.get(selectQuery, [id], (selectErr, updatedStore) => {
          db.close();
          
          if (selectErr) {
            console.error('更新店舗取得エラー:', selectErr);
            return res.status(500).json({
              error: '店舗更新後の取得に失敗しました'
            });
          }

          console.log(`✅ 店舗更新: ${updatedStore.name} (ID: ${id})`);
          
          res.json({
            store: updatedStore,
            message: `店舗「${updatedStore.name}」を更新しました`
          });
        });
      });
    });
  });
});

/**
 * 店舗削除 DELETE /api/stores/:id
 */
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const { forceDelete } = req.query; // クエリパラメータで強制削除を指定

  const db = getDatabase();

  // 店舗の存在確認
  db.get('SELECT * FROM stores WHERE id = ?', [id], (checkErr, existingStore) => {
    if (checkErr) {
      console.error('店舗存在確認エラー:', checkErr);
      db.close();
      return res.status(500).json({
        error: '店舗の存在確認に失敗しました',
        details: process.env.NODE_ENV === 'development' ? checkErr.message : 'Database error'
      });
    }

    if (!existingStore) {
      db.close();
      return res.status(404).json({
        error: '指定された店舗が見つかりません',
        store_id: id
      });
    }

    // 関連データの確認
    db.get(`
      SELECT 
        COUNT(DISTINCT b.id) as balance_count,
        COUNT(DISTINCT t.id) as transaction_count,
        COALESCE(SUM(b.amount), 0) as total_balance
      FROM stores s
      LEFT JOIN balance b ON s.id = b.store_id
      LEFT JOIN transactions t ON s.id = t.store_id
      WHERE s.id = ?
    `, [id], (dataErr, relatedData) => {
      if (dataErr) {
        console.error('関連データ確認エラー:', dataErr);
        db.close();
        return res.status(500).json({
          error: '関連データの確認に失敗しました'
        });
      }

      const hasData = relatedData.balance_count > 0 || relatedData.transaction_count > 0;
      const hasBalance = relatedData.total_balance > 0;

      if (hasData && !forceDelete) {
        db.close();
        return res.status(400).json({
          error: 'この店舗には関連データが存在するため削除できません',
          store_name: existingStore.name,
          related_data: {
            balance_records: relatedData.balance_count,
            transactions: relatedData.transaction_count,
            total_balance: relatedData.total_balance
          },
          hint: 'forceDelete=true を指定すると関連データも含めて削除されます',
          warning: '強制削除は元に戻せません'
        });
      }

      if (hasBalance && !forceDelete) {
        db.close();
        return res.status(400).json({
          error: 'この店舗には残高が残っているため削除できません',
          store_name: existingStore.name,
          total_balance: relatedData.total_balance,
          hint: 'すべての残高を0にしてから削除するか、forceDelete=true を指定してください',
          warning: '強制削除は残高データも削除されます'
        });
      }

      // 強制削除または関連データがない場合は削除実行
      console.log(`🗑️ 店舗削除開始: ${existingStore.name} (強制削除: ${!!forceDelete})`);

      // トランザクション的に削除（逆順で削除）
      if (forceDelete) {
        // 1. 取引履歴を削除
        db.run('DELETE FROM transactions WHERE store_id = ?', [id], (transErr) => {
          if (transErr) {
            console.error('取引履歴削除エラー:', transErr);
            db.close();
            return res.status(500).json({
              error: '取引履歴の削除に失敗しました'
            });
          }

          // 2. 残高レコードを削除
          db.run('DELETE FROM balance WHERE store_id = ?', [id], (balanceErr) => {
            if (balanceErr) {
              console.error('残高レコード削除エラー:', balanceErr);
              db.close();
              return res.status(500).json({
                error: '残高レコードの削除に失敗しました'
              });
            }

            // 3. 店舗を削除
            deleteStore();
          });
        });
      } else {
        deleteStore();
      }

      function deleteStore() {
        db.run('DELETE FROM stores WHERE id = ?', [id], function(deleteErr) {
          if (deleteErr) {
            console.error('店舗削除エラー:', deleteErr);
            db.close();
            return res.status(500).json({
              error: '店舗の削除に失敗しました',
              details: process.env.NODE_ENV === 'development' ? deleteErr.message : 'Database error'
            });
          }

          if (this.changes === 0) {
            db.close();
            return res.status(404).json({
              error: '削除対象の店舗が見つかりません',
              store_id: id
            });
          }

          console.log(`✅ 店舗削除完了: ${existingStore.name} (ID: ${id})`);
          db.close();

          res.json({
            deleted_store: {
              id: existingStore.id,
              name: existingStore.name
            },
            force_deleted: !!forceDelete,
            deleted_data: forceDelete ? {
              balance_records: relatedData.balance_count,
              transactions: relatedData.transaction_count
            } : null,
            message: `店舗「${existingStore.name}」を削除しました${forceDelete ? '（関連データも削除済み）' : ''}`
          });
        });
      }
    });
  });
});

module.exports = router;