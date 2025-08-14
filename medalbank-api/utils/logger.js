// ===================================
// ログ機能（Day4: 簡単なログ機能）
// ===================================

const fs = require('fs');
const path = require('path');

// ログディレクトリの作成
const LOG_DIR = path.join(__dirname, '../logs');
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * ログレベル定義
 */
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

/**
 * 現在のログレベル（環境変数で設定可能）
 */
const CURRENT_LOG_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL || 'INFO'];

/**
 * ログフォーマッター
 */
const formatLog = (level, message, metadata = {}) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...metadata
  };
  return JSON.stringify(logEntry);
};

/**
 * ファイルにログを書き込み
 */
const writeToFile = (filename, logEntry) => {
  const filePath = path.join(LOG_DIR, filename);
  const logLine = logEntry + '\n';
  
  try {
    fs.appendFileSync(filePath, logLine);
  } catch (error) {
    console.error('ログファイル書き込みエラー:', error);
  }
};

/**
 * 日付ベースのファイル名生成
 */
const getLogFileName = (type = 'app') => {
  const date = new Date().toISOString().split('T')[0];
  return `${type}-${date}.log`;
};

/**
 * ログ出力クラス
 */
class Logger {
  constructor(context = 'APP') {
    this.context = context;
  }

  debug(message, metadata = {}) {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.DEBUG) {
      const logEntry = formatLog('DEBUG', message, { context: this.context, ...metadata });
      console.log(`🔍 ${message}`, metadata);
      writeToFile(getLogFileName('debug'), logEntry);
    }
  }

  info(message, metadata = {}) {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.INFO) {
      const logEntry = formatLog('INFO', message, { context: this.context, ...metadata });
      console.log(`ℹ️  ${message}`, metadata);
      writeToFile(getLogFileName('app'), logEntry);
    }
  }

  warn(message, metadata = {}) {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.WARN) {
      const logEntry = formatLog('WARN', message, { context: this.context, ...metadata });
      console.warn(`⚠️  ${message}`, metadata);
      writeToFile(getLogFileName('app'), logEntry);
    }
  }

  error(message, error = null, metadata = {}) {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.ERROR) {
      const errorInfo = error ? {
        error_message: error.message,
        error_stack: error.stack,
        error_name: error.name
      } : {};
      
      const logEntry = formatLog('ERROR', message, { 
        context: this.context, 
        ...errorInfo, 
        ...metadata 
      });
      
      console.error(`❌ ${message}`, error || '', metadata);
      writeToFile(getLogFileName('error'), logEntry);
    }
  }

  // 特定用途のログメソッド
  transaction(action, data) {
    this.info(`Transaction: ${action}`, {
      category: 'TRANSACTION',
      action,
      data
    });
    
    // 取引専用ログファイル
    const logEntry = formatLog('TRANSACTION', action, {
      context: this.context,
      timestamp: new Date().toISOString(),
      data
    });
    writeToFile(getLogFileName('transactions'), logEntry);
  }

  security(event, data) {
    this.warn(`Security Event: ${event}`, {
      category: 'SECURITY',
      event,
      data,
      ip: data.ip || 'unknown',
      userAgent: data.userAgent || 'unknown'
    });
    
    // セキュリティ専用ログファイル
    const logEntry = formatLog('SECURITY', event, {
      context: this.context,
      timestamp: new Date().toISOString(),
      data
    });
    writeToFile(getLogFileName('security'), logEntry);
  }

  performance(operation, duration, metadata = {}) {
    const level = duration > 1000 ? 'WARN' : 'INFO';
    const message = `Performance: ${operation} took ${duration}ms`;
    
    if (level === 'WARN') {
      this.warn(message, { category: 'PERFORMANCE', operation, duration, ...metadata });
    } else {
      this.info(message, { category: 'PERFORMANCE', operation, duration, ...metadata });
    }
  }

  api(method, path, statusCode, duration, metadata = {}) {
    const message = `API: ${method} ${path} [${statusCode}] ${duration}ms`;
    
    this.info(message, {
      category: 'API',
      method,
      path,
      statusCode,
      duration,
      ...metadata
    });
    
    // API専用ログファイル
    const logEntry = formatLog('API', message, {
      context: this.context,
      timestamp: new Date().toISOString(),
      method,
      path,
      statusCode,
      duration,
      ...metadata
    });
    writeToFile(getLogFileName('api'), logEntry);
  }
}

/**
 * グローバルログインスタンス
 */
const logger = new Logger('MEDALBANK');

/**
 * Express用ログミドルウェア
 */
const loggerMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // リクエスト開始ログ
  logger.api(req.method, req.path, 'STARTED', 0, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    query: req.query,
    body: req.method === 'POST' ? req.body : undefined
  });
  
  // レスポンス終了時のログ
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.api(req.method, req.path, res.statusCode, duration, {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  });
  
  next();
};

/**
 * ログファイルのローテーション（簡易版）
 */
const rotateLogsIfNeeded = () => {
  try {
    const files = fs.readdirSync(LOG_DIR);
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7日間
    const now = Date.now();
    
    files.forEach(file => {
      const filePath = path.join(LOG_DIR, file);
      const stats = fs.statSync(filePath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        fs.unlinkSync(filePath);
        console.log(`🗑️  古いログファイルを削除: ${file}`);
      }
    });
  } catch (error) {
    console.error('ログローテーションエラー:', error);
  }
};

// 起動時にログローテーションを実行
rotateLogsIfNeeded();

// 24時間ごとにログローテーションを実行
setInterval(rotateLogsIfNeeded, 24 * 60 * 60 * 1000);

module.exports = {
  Logger,
  logger,
  loggerMiddleware,
  LOG_LEVELS
};