// ===================================
// API型定義
// Day5追加: 型安全性の向上
// ===================================

// 共通レスポンス型
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

// 店舗関連型
export interface Store {
  id: number;
  name: string;
  description?: string;
  color: string;
  created_at: string;
  updated_at: string;
  user_count?: number;
  total_balance?: number;
}

export interface StoreStats {
  user_count: number;
  total_balance: number;
  transaction_count: number;
  total_deposits: number;
  total_withdrawals: number;
  recent_transactions: Transaction[];
}

// ユーザー関連型
export interface User {
  id: number;
  username: string;
  email: string;
  created_at?: string;
}

// 残高関連型
export interface Balance {
  user_id: number;
  username: string;
  total_balance: number;
  store_id?: number;
  store_name?: string;
  store_color?: string;
  updated_at?: string;
  message: string;
}

// 取引関連型
export interface Transaction {
  id: number;
  user_id: number;
  store_id?: number;
  store_name?: string;
  store_color?: string;
  type: 'deposit' | 'withdraw';
  type_display?: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  description?: string;
  created_at: string;
}

export interface TransactionRequest {
  user_id: number;
  store_id: number;
  type: 'deposit' | 'withdraw';
  amount: number;
  description?: string;
}

export interface TransactionResponse {
  transaction_id: number;
  user_id: number;
  type: 'deposit' | 'withdraw';
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string;
  message: string;
}

// 認証関連型
export interface LoginRequest {
  username: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface AuthResponse {
  user: User;
}

// API検索パラメータ型
export interface TransactionFilters {
  userId: number;
  storeId?: number;
  limit?: number;
  type?: 'deposit' | 'withdraw';
  dateFrom?: string;
  dateTo?: string;
  includeStats?: boolean;
}

export interface TransactionListResponse {
  user_id: number;
  transactions: Transaction[];
  count: number;
  total_count?: number;
  stats?: {
    total_deposits: number;
    total_withdrawals: number;
    net_change: number;
  };
  filters_applied?: TransactionFilters;
  message: string;
}

// 店舗作成リクエスト型
export interface StoreCreateRequest {
  name: string;
  description?: string;
  color?: string;
  createBalanceForAllUsers?: boolean;
}

// エラー型
export interface ApiError {
  error: string;
  details?: string;
  code?: string;
  timestamp?: string;
}

// ヘルスチェック型
export interface HealthResponse {
  status: string;
  message: string;
  timestamp: string;
}