// ===================================
// レスポンス形式統一ミドルウェア
// Day4: レスポンス形式統一
// ===================================

/**
 * 成功レスポンスの統一フォーマット
 */
const successResponse = (data, message = '処理が成功しました', metadata = {}) => {
  return {
    success: true,
    timestamp: new Date().toISOString(),
    message: message,
    data: data,
    ...metadata
  };
};

/**
 * エラーレスポンスの統一フォーマット
 */
const errorResponse = (error, code = 'UNKNOWN_ERROR', details = null) => {
  const response = {
    success: false,
    timestamp: new Date().toISOString(),
    error: {
      code: code,
      message: error,
    }
  };

  // 開発環境でのみ詳細情報を含める
  if (process.env.NODE_ENV === 'development' && details) {
    response.error.details = details;
    response.error.stack = details.stack;
  }

  return response;
};

/**
 * レスポンス形式統一ミドルウェア
 * res.success() と res.error() メソッドを追加
 */
const responseFormatter = (req, res, next) => {
  // 成功レスポンス用メソッド
  res.success = (data, message, metadata) => {
    return res.json(successResponse(data, message, metadata));
  };

  // エラーレスポンス用メソッド
  res.error = (statusCode, error, code, details) => {
    return res.status(statusCode).json(errorResponse(error, code, details));
  };

  // 各種エラー用の便利メソッド
  res.badRequest = (error, details) => {
    return res.error(400, error, 'BAD_REQUEST', details);
  };

  res.unauthorized = (error = '認証が必要です', details) => {
    return res.error(401, error, 'UNAUTHORIZED', details);
  };

  res.forbidden = (error = 'アクセスが拒否されました', details) => {
    return res.error(403, error, 'FORBIDDEN', details);
  };

  res.notFound = (error = 'リソースが見つかりません', details) => {
    return res.error(404, error, 'NOT_FOUND', details);
  };

  res.conflict = (error = 'リソースが競合しています', details) => {
    return res.error(409, error, 'CONFLICT', details);
  };

  res.tooManyRequests = (error = 'レート制限に達しました', details) => {
    return res.error(429, error, 'TOO_MANY_REQUESTS', details);
  };

  res.internalError = (error = 'サーバー内部エラーが発生しました', details) => {
    return res.error(500, error, 'INTERNAL_ERROR', details);
  };

  res.serviceUnavailable = (error = 'サービスが利用できません', details) => {
    return res.error(503, error, 'SERVICE_UNAVAILABLE', details);
  };

  next();
};

/**
 * APIバージョン情報を追加
 */
const addApiVersion = (req, res, next) => {
  res.locals.apiVersion = 'v1.0.0';
  res.locals.buildInfo = {
    version: 'MVP-Day4',
    build_date: new Date().toISOString().split('T')[0],
    environment: process.env.NODE_ENV || 'development'
  };
  next();
};

/**
 * パフォーマンス測定
 */
const performanceTracker = (req, res, next) => {
  const startTime = Date.now();
  
  // レスポンス終了時に処理時間を記録
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`⏱️  ${req.method} ${req.path} - ${duration}ms [${res.statusCode}]`);
    
    // 遅いAPIの警告
    if (duration > 1000) {
      console.warn(`🐌 遅いAPI検出: ${req.method} ${req.path} - ${duration}ms`);
    }
  });
  
  req.startTime = startTime;
  next();
};

/**
 * CORS設定
 */
const corsHeaders = (req, res, next) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001', 
    'http://localhost:3002',
    'http://localhost:3003',
    'http://localhost:5173', // Vite default
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002', 
    'http://127.0.0.1:3003',
    'http://127.0.0.1:5173',
    // Vercel deployment domains
    'https://madalbank-git-main-kmorikawas-projects.vercel.app',
    'https://madalbank.vercel.app',
    // Add pattern for all Vercel domains
    ...(process.env.NODE_ENV === 'production' ? [] : [])
  ];
  
  const origin = req.headers.origin;
  
  // 許可されたオリジンからのリクエストか、環境変数で指定されたURLの場合はアクセス許可
  const isVercelDomain = origin && origin.includes('vercel.app');
  
  if (allowedOrigins.includes(origin) || origin === process.env.FRONTEND_URL || isVercelDomain) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    // オリジンがない場合（同一ドメインなど）はデフォルトを設定
    res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3003');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // OPTIONSリクエスト（プリフライト）への対応
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  next();
};

/**
 * リクエストログ
 */
const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const userAgent = req.get('User-Agent') || 'Unknown';
  const ip = req.ip || req.connection.remoteAddress || 'Unknown';
  
  console.log(`📥 [${timestamp}] ${req.method} ${req.path}`);
  console.log(`   IP: ${ip}`);
  console.log(`   User-Agent: ${userAgent.substring(0, 100)}`);
  
  if (req.body && Object.keys(req.body).length > 0) {
    // パスワードなどの機密情報をマスク
    const safebody = { ...req.body };
    if (safebody.password) safebody.password = '***';
    if (safebody.token) safebody.token = '***';
    
    console.log(`   Body: ${JSON.stringify(safebody)}`);
  }
  
  if (req.query && Object.keys(req.query).length > 0) {
    console.log(`   Query: ${JSON.stringify(req.query)}`);
  }
  
  next();
};

module.exports = {
  successResponse,
  errorResponse,
  responseFormatter,
  addApiVersion,
  performanceTracker,
  corsHeaders,
  requestLogger
};