// ===================================
// 共通ヘルパー関数
// Day5追加: コード整理とリファクタリング
// ===================================

/**
 * 入力値バリデーション用ヘルパー
 */
const validators = {
  /**
   * ユーザーIDの検証
   */
  validateUserId: (userId, paramName = 'userId') => {
    const id = parseInt(userId);
    if (isNaN(id) || id <= 0) {
      return {
        isValid: false,
        error: {
          error: `無効な${paramName}です`,
          [paramName]: userId,
          hint: `${paramName}は1以上の数値で指定してください`
        }
      };
    }
    return { isValid: true, value: id };
  },

  /**
   * 店舗IDの検証
   */
  validateStoreId: (storeId, paramName = 'storeId') => {
    if (storeId === null || storeId === undefined) {
      return { isValid: true, value: null };
    }
    
    const id = parseInt(storeId);
    if (isNaN(id) || id <= 0) {
      return {
        isValid: false,
        error: {
          error: `無効な${paramName}です`,
          [paramName]: storeId,
          hint: `${paramName}は1以上の数値で指定してください`
        }
      };
    }
    return { isValid: true, value: id };
  },

  /**
   * 取引種別の検証
   */
  validateTransactionType: (type) => {
    if (type && !['deposit', 'withdraw'].includes(type)) {
      return {
        isValid: false,
        error: {
          error: 'typeは "deposit" または "withdraw" である必要があります',
          received: type,
          valid_types: ['deposit', 'withdraw']
        }
      };
    }
    return { isValid: true, value: type };
  },

  /**
   * 日付形式の検証
   */
  validateDateFormat: (date, paramName = 'date') => {
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return {
        isValid: false,
        error: {
          error: `${paramName}はYYYY-MM-DD形式である必要があります`,
          received: date,
          example: '2024-01-01'
        }
      };
    }
    return { isValid: true, value: date };
  },

  /**
   * 必須フィールドの検証
   */
  validateRequiredFields: (obj, requiredFields) => {
    const missing = requiredFields.filter(field => !obj[field] && obj[field] !== 0);
    if (missing.length > 0) {
      return {
        isValid: false,
        error: {
          error: '必要な情報が不足しています',
          required: requiredFields,
          missing: missing,
          received: obj
        }
      };
    }
    return { isValid: true };
  }
};

/**
 * データベース操作用ヘルパー
 */
const dbHelpers = {
  /**
   * データベースエラー処理
   */
  handleDbError: (err, res, message = 'データベースエラーが発生しました', db = null) => {
    console.error(`❌ ${message}:`, err.message);
    if (db) db.close();
    return res.status(500).json({
      error: message,
      details: process.env.NODE_ENV === 'development' ? err.message : 'Database error'
    });
  },

  /**
   * 店舗別残高の取得または作成
   */
  getOrCreateBalance: (db, userId, storeId, callback) => {
    const query = 'SELECT amount FROM balance WHERE user_id = ? AND store_id = ?';
    
    db.get(query, [userId, storeId], (err, row) => {
      if (err) {
        return callback(err, null);
      }

      if (row) {
        // 既存残高を返す
        return callback(null, row.amount);
      }

      // 残高レコードが存在しない場合は作成
      console.log(`📝 ユーザーID ${userId} の店舗ID ${storeId} 用残高を作成中...`);
      db.run('INSERT INTO balance (user_id, store_id, amount) VALUES (?, ?, 0)', 
        [userId, storeId], 
        function(insertErr) {
          if (insertErr) {
            return callback(insertErr, null);
          }
          // 新規作成された残高（0）を返す
          callback(null, 0);
        }
      );
    });
  }
};

/**
 * レスポンス用ヘルパー
 */
const responseHelpers = {
  /**
   * 成功レスポンス
   */
  success: (res, data, message = '処理が完了しました') => {
    return res.json({
      success: true,
      data: data,
      message: message,
      timestamp: new Date().toISOString()
    });
  },

  /**
   * エラーレスポンス
   */
  error: (res, statusCode, error, details = null) => {
    const response = {
      success: false,
      error: error,
      timestamp: new Date().toISOString()
    };

    if (details && process.env.NODE_ENV === 'development') {
      response.details = details;
    }

    return res.status(statusCode).json(response);
  },

  /**
   * バリデーションエラーレスポンス
   */
  validationError: (res, validationResult) => {
    return res.status(400).json({
      success: false,
      ...validationResult.error,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * 文字列操作用ヘルパー
 */
const stringHelpers = {
  /**
   * 取引種別の日本語変換
   */
  getTransactionDisplayType: (type) => {
    switch (type) {
      case 'deposit': return '入金';
      case 'withdraw': return '払い出し';
      default: return type;
    }
  },

  /**
   * 文字列の安全なトリム
   */
  safeTrim: (str) => {
    return str && typeof str === 'string' ? str.trim() : str;
  }
};

/**
 * 数値操作用ヘルパー
 */
const numberHelpers = {
  /**
   * 安全な数値変換
   */
  safeParseInt: (value, defaultValue = 0) => {
    const parsed = parseInt(value);
    return isNaN(parsed) ? defaultValue : parsed;
  },

  /**
   * 制限付き数値変換
   */
  parseIntWithLimit: (value, min = 0, max = Number.MAX_SAFE_INTEGER, defaultValue = 0) => {
    const parsed = parseInt(value);
    if (isNaN(parsed)) return defaultValue;
    return Math.max(min, Math.min(max, parsed));
  }
};

module.exports = {
  validators,
  dbHelpers,
  responseHelpers,
  stringHelpers,
  numberHelpers
};