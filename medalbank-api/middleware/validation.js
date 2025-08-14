// ===================================
// バリデーションミドルウェア
// Day4: バリデーション強化
// ===================================

/**
 * ユーザーIDバリデーション
 */
const validateUserId = (req, res, next) => {
  const userId = parseInt(req.body.user_id || req.query.userId);
  
  if (isNaN(userId) || userId <= 0) {
    return res.status(400).json({
      error: 'ユーザーIDが無効です',
      received: req.body.user_id || req.query.userId,
      requirements: {
        type: '正の整数',
        min: 1,
        examples: [1, 2, 3]
      },
      field: 'user_id または userId'
    });
  }
  
  // MVPでは固定ユーザーのみサポート
  if (userId !== 1) {
    return res.status(403).json({
      error: 'このユーザーIDはサポートされていません',
      received: userId,
      mvp_limitation: 'MVP版では user_id=1 のみサポート',
      supported_ids: [1]
    });
  }
  
  // バリデーション済みのuserIdを保存
  req.validatedUserId = userId;
  next();
};

/**
 * 取引金額バリデーション
 */
const validateAmount = (req, res, next) => {
  const amount = parseInt(req.body.amount);
  
  // 必須チェック
  if (!amount && amount !== 0) {
    return res.status(400).json({
      error: 'amountは必須項目です',
      received: req.body.amount
    });
  }
  
  // 数値チェック
  if (isNaN(amount)) {
    return res.status(400).json({
      error: 'amountは数値である必要があります',
      received: req.body.amount,
      type: typeof req.body.amount
    });
  }
  
  // 正の数チェック
  if (amount <= 0) {
    return res.status(400).json({
      error: 'amountは1以上である必要があります',
      received: amount,
      min: 1
    });
  }
  
  // 上限チェック（MVP版では10万メダルまで）
  const MAX_AMOUNT = 100000;
  if (amount > MAX_AMOUNT) {
    return res.status(400).json({
      error: 'amountが上限を超えています',
      received: amount,
      max: MAX_AMOUNT,
      mvp_limitation: 'MVP版では一回の取引は10万メダルまで'
    });
  }
  
  req.validatedAmount = amount;
  next();
};

/**
 * 取引タイプバリデーション
 */
const validateTransactionType = (req, res, next) => {
  const type = req.body.type || req.query.type;
  const validTypes = ['deposit', 'withdraw'];
  
  // 必須チェック（POST時のみ）
  if (req.method === 'POST' && !type) {
    return res.status(400).json({
      error: 'typeは必須項目です',
      valid_types: validTypes
    });
  }
  
  // タイプチェック（指定されている場合）
  if (type && !validTypes.includes(type)) {
    return res.status(400).json({
      error: 'typeが無効です',
      received: type,
      valid_types: validTypes
    });
  }
  
  req.validatedType = type;
  next();
};

/**
 * 日付バリデーション
 */
const validateDateRange = (req, res, next) => {
  const dateFrom = req.query.dateFrom;
  const dateTo = req.query.dateTo;
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  
  // dateFromバリデーション
  if (dateFrom) {
    if (!datePattern.test(dateFrom)) {
      return res.status(400).json({
        error: 'dateFromの形式が無効です',
        received: dateFrom,
        required_format: 'YYYY-MM-DD',
        example: '2024-01-01'
      });
    }
    
    // 日付として有効かチェック
    const fromDate = new Date(dateFrom);
    if (isNaN(fromDate.getTime())) {
      return res.status(400).json({
        error: 'dateFromは有効な日付ではありません',
        received: dateFrom
      });
    }
  }
  
  // dateToバリデーション
  if (dateTo) {
    if (!datePattern.test(dateTo)) {
      return res.status(400).json({
        error: 'dateToの形式が無効です',
        received: dateTo,
        required_format: 'YYYY-MM-DD',
        example: '2024-01-31'
      });
    }
    
    const toDate = new Date(dateTo);
    if (isNaN(toDate.getTime())) {
      return res.status(400).json({
        error: 'dateToは有効な日付ではありません',
        received: dateTo
      });
    }
  }
  
  // 日付の論理チェック（fromがtoより後ではないか）
  if (dateFrom && dateTo) {
    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);
    
    if (fromDate > toDate) {
      return res.status(400).json({
        error: 'dateFromはdateToより前である必要があります',
        received: {
          dateFrom: dateFrom,
          dateTo: dateTo
        }
      });
    }
  }
  
  next();
};

/**
 * リミット数バリデーション
 */
const validateLimit = (req, res, next) => {
  const limit = req.query.limit;
  
  if (limit !== undefined) {
    const parsedLimit = parseInt(limit);
    
    if (isNaN(parsedLimit)) {
      return res.status(400).json({
        error: 'limitは数値である必要があります',
        received: limit
      });
    }
    
    if (parsedLimit <= 0) {
      return res.status(400).json({
        error: 'limitは1以上である必要があります',
        received: parsedLimit,
        min: 1
      });
    }
    
    const MAX_LIMIT = 1000;
    if (parsedLimit > MAX_LIMIT) {
      return res.status(400).json({
        error: 'limitが上限を超えています',
        received: parsedLimit,
        max: MAX_LIMIT,
        mvp_limitation: 'MVP版では1回に1000件まで取得可能'
      });
    }
    
    req.validatedLimit = Math.min(parsedLimit, MAX_LIMIT);
  } else {
    req.validatedLimit = 10; // デフォルト値
  }
  
  next();
};

/**
 * 説明文バリデーション
 */
const validateDescription = (req, res, next) => {
  const description = req.body.description;
  
  if (description !== undefined) {
    // 文字列チェック
    if (typeof description !== 'string') {
      return res.status(400).json({
        error: 'descriptionは文字列である必要があります',
        received: description,
        type: typeof description
      });
    }
    
    // 長さチェック
    const MAX_LENGTH = 255;
    if (description.length > MAX_LENGTH) {
      return res.status(400).json({
        error: 'descriptionが長すぎます',
        received_length: description.length,
        max_length: MAX_LENGTH,
        received: description.substring(0, 50) + '...'
      });
    }
    
    // 危険な文字チェック（基本的なサニタイゼーション）
    const dangerousChars = ['<', '>', '&', '"', "'"];
    const containsDangerous = dangerousChars.some(char => description.includes(char));
    
    if (containsDangerous) {
      return res.status(400).json({
        error: 'descriptionに危険な文字が含まれています',
        dangerous_chars: dangerousChars,
        hint: 'HTMLタグや特殊文字は使用できません'
      });
    }
  }
  
  next();
};

/**
 * APIレート制限（簡易版）
 */
const rateLimit = (maxRequests = 100, windowMs = 60000) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const clientId = req.ip || 'unknown';
    const now = Date.now();
    
    // クライアントのリクエスト履歴を取得
    if (!requests.has(clientId)) {
      requests.set(clientId, []);
    }
    
    const clientRequests = requests.get(clientId);
    
    // 古いリクエストを削除（ウィンドウ外のもの）
    const validRequests = clientRequests.filter(time => now - time < windowMs);
    
    // レート制限チェック
    if (validRequests.length >= maxRequests) {
      return res.status(429).json({
        error: 'レート制限に達しました',
        max_requests: maxRequests,
        window_ms: windowMs,
        retry_after: Math.ceil((validRequests[0] + windowMs - now) / 1000),
        current_requests: validRequests.length
      });
    }
    
    // 新しいリクエストを記録
    validRequests.push(now);
    requests.set(clientId, validRequests);
    
    next();
  };
};

/**
 * セキュリティヘッダー追加
 */
const addSecurityHeaders = (req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  });
  next();
};

module.exports = {
  validateUserId,
  validateAmount,
  validateTransactionType,
  validateDateRange,
  validateLimit,
  validateDescription,
  rateLimit,
  addSecurityHeaders
};