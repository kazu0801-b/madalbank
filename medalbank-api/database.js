// ===================================
// MedalBank データベース管理
// ===================================
// SQLite3を使用したデータベースの初期化と接続管理
//
// 機能:
// - データベースファイル作成
// - テーブル作成（users, balance, transactions）
// - テストユーザー・初期データ作成
// - データベース接続の提供
// ===================================

const sqlite3 = require('sqlite3').verbose()
const path = require('path')

// データベースファイルのパス設定
// __dirname = 現在のファイル（database.js）があるディレクトリ
const dbPath = path.join(__dirname, 'medalbank.db')

/**
 * データベース初期化関数
 * 
 * 実行内容:
 * 1. SQLiteデータベースファイルに接続
 * 2. 必要なテーブル作成（存在しない場合のみ）
 * 3. テストユーザーとデータを作成
 */
function initDatabase() {
  // データベース接続を開く
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('❌ データベース接続エラー:', err.message)
      return
    }
    console.log('✅ SQLite データベースに接続しました')
    console.log('📁 データベースファイル:', dbPath)
  })

  // ===================================
  // テーブル作成処理
  // ===================================
  // serialize() = SQLの実行を順番に行う（非同期処理の順序保証）
  db.serialize(() => {
    
    // ユーザーテーブル作成
    // 目的: ログインユーザーの基本情報を保存
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,  -- ユーザー固有ID（自動採番）
        username TEXT NOT NULL UNIQUE,         -- ログイン用ユーザー名（重複不可）
        email TEXT NOT NULL,                   -- メールアドレス
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP  -- アカウント作成日時
      )
    `, (err) => {
      if (err) {
        console.error('❌ usersテーブル作成エラー:', err.message)
      } else {
        console.log('✅ usersテーブル作成完了')
      }
    })

    // 残高テーブル作成
    // 目的: 各ユーザーの現在のメダル残高を管理
    db.run(`
      CREATE TABLE IF NOT EXISTS balance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,  -- 残高レコードID
        user_id INTEGER NOT NULL,              -- 対象ユーザーID（usersテーブル参照）
        amount INTEGER DEFAULT 0,              -- 現在のメダル残高
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,  -- 最終更新日時
        FOREIGN KEY (user_id) REFERENCES users(id)      -- 外部キー制約
      )
    `, (err) => {
      if (err) {
        console.error('❌ balanceテーブル作成エラー:', err.message)
      } else {
        console.log('✅ balanceテーブル作成完了')
      }
    })

    // 取引履歴テーブル作成
    // 目的: 入金・払い出しの全履歴を記録（監査・履歴表示用）
    db.run(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,  -- 取引ID（自動採番）
        user_id INTEGER NOT NULL,              -- 取引対象ユーザーID
        type TEXT NOT NULL CHECK(type IN ('deposit', 'withdraw')),  -- 取引種別（入金/払い出し）
        amount INTEGER NOT NULL,               -- 取引金額（メダル数）
        balance_before INTEGER NOT NULL,       -- 取引前残高
        balance_after INTEGER NOT NULL,        -- 取引後残高
        description TEXT,                      -- 取引説明（任意）
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,  -- 取引日時
        FOREIGN KEY (user_id) REFERENCES users(id)      -- 外部キー制約
      )
    `, (err) => {
      if (err) {
        console.error('❌ transactionsテーブル作成エラー:', err.message)
      } else {
        console.log('✅ transactionsテーブル作成完了')
      }
    })

    // テストデータ挿入
    insertTestData(db)
  })
}

/**
 * テストデータ挿入関数
 * 
 * MVP開発用のテストユーザーと初期データを作成
 * - ユーザー名: testuser
 * - 初期残高: 1000メダル
 * 
 * @param {sqlite3.Database} db - データベース接続オブジェクト
 */
function insertTestData(db) {
  // テストユーザーが既に存在するか確認
  // 目的: 重複作成を防ぐため、既存チェックを実行
  db.get('SELECT id FROM users WHERE username = ?', ['testuser'], (err, row) => {
    if (err) {
      console.error('❌ ユーザーチェックエラー:', err.message)
      return
    }

    if (!row) {
      // テストユーザーが存在しない場合のみ作成
      console.log('👤 テストユーザーを作成します...')
      
      db.run('INSERT INTO users (username, email) VALUES (?, ?)', 
        ['testuser', 'test@example.com'],  // MVP用固定データ
        function(err) {
          if (err) {
            console.error('❌ テストユーザー作成エラー:', err.message)
          } else {
            console.log('✅ テストユーザー作成完了 (ID:', this.lastID, ')')
            
            // ユーザー作成後、初期残高を設定
            // this.lastID = 上で作成されたユーザーのID
            console.log('💰 初期残高を設定します...')
            
            db.run('INSERT INTO balance (user_id, amount) VALUES (?, ?)', 
              [this.lastID, 1000],  // 1000メダルで開始
              (err) => {
                if (err) {
                  console.error('❌ 初期残高設定エラー:', err.message)
                } else {
                  console.log('✅ 初期残高 1000メダル 設定完了')
                }
                // データ挿入完了後にDB接続を閉じる
                db.close((err) => {
                  if (err) {
                    console.error('❌ データベース切断エラー:', err.message)
                  } else {
                    console.log('✅ データベース接続を閉じました')
                  }
                })
              }
            )
          }
        }
      )
    } else {
      console.log('✅ テストユーザー既に存在します (ID:', row.id, ')')
      // 既に存在する場合もDB接続を閉じる
      db.close((err) => {
        if (err) {
          console.error('❌ データベース切断エラー:', err.message)
        } else {
          console.log('✅ データベース接続を閉じました')
        }
      })
    }
  })
}

/**
 * データベース接続取得関数
 * 
 * APIエンドポイントから呼び出される関数
 * 新しいDB接続を作成して返す
 * 
 * 使用例:
 * const db = getDatabase()
 * db.get('SELECT * FROM users WHERE id = ?', [1], callback)
 * db.close()  // 使用後は必ず閉じる
 * 
 * @returns {sqlite3.Database} データベース接続オブジェクト
 */
function getDatabase() {
  return new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('❌ データベース接続エラー:', err.message)
      throw err
    }
    // 成功時はログ出力しない（頻繁に呼ばれるため）
  })
}

module.exports = {
  initDatabase,
  getDatabase
}