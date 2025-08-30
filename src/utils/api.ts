import type {
  ApiResponse,
  Balance,
  Transaction,
  TransactionRequest,
  TransactionResponse,
  TransactionListResponse,
  LoginRequest,
  LoginResponse,
  AuthResponse,
  HealthResponse,
  Store,
  StoreCreateRequest,
  StoreStats
} from '@/types/api';

// 動的にAPIベースURLを決定
const getApiBaseUrl = (): string => {
  // 環境変数が設定されている場合はそれを使用
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // ブラウザ環境でのみ実行
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const port = window.location.port;
    
    // 本番環境（Vercel + Render構成）の判定
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      // Vercel + Render構成：RenderのAPIサーバーを使用
      return 'https://madalbank.onrender.com';
    }
    
    // 開発環境：フロントエンドポートに応じてAPIポートを自動選択
    switch (port) {
      case '3000':
      case '3001':
      case '3002':
      case '3003':
      case '5173': // Vite default
        return 'http://localhost:8000';
      default:
        return 'http://localhost:8000';
    }
  }
  
  // サーバーサイドレンダリング時のデフォルト
  return 'http://localhost:8000';
};

const API_BASE_URL = getApiBaseUrl();

// 基本的なfetch wrapper
const apiClient = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP error! status: ${response.status}`,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

// 認証API
export const authApi = {
  login: async (username: string): Promise<ApiResponse<LoginResponse>> => {
    return apiClient<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username }),
    });
  },

  checkAuth: async (): Promise<ApiResponse<AuthResponse>> => {
    return apiClient<AuthResponse>('/api/auth/me');
  },
};

// 残高API
export const balanceApi = {
  getBalance: async (userId: number = 1, storeId?: number): Promise<ApiResponse<Balance>> => {
    const url = storeId 
      ? `/api/balance/${userId}?storeId=${storeId}`
      : `/api/balance/${userId}`;
    return apiClient<Balance>(url);
  },
};

// 取引API
export const transactionApi = {
  createTransaction: async (data: Omit<TransactionRequest, 'user_id'>): Promise<ApiResponse<TransactionResponse>> => {
    return apiClient<TransactionResponse>('/api/transactions', {
      method: 'POST',
      body: JSON.stringify({ ...data, user_id: 1 }),
    });
  },

  getTransactions: async (
    userId: number = 1, 
    options: {
      storeId?: number;
      limit?: number;
      type?: 'deposit' | 'withdraw';
      dateFrom?: string;
      dateTo?: string;
      includeStats?: boolean;
    } = {}
  ): Promise<ApiResponse<TransactionListResponse>> => {
    const params = new URLSearchParams({
      userId: userId.toString(),
      limit: (options.limit || 10).toString(),
      ...(options.storeId && { storeId: options.storeId.toString() }),
      ...(options.type && { type: options.type }),
      ...(options.dateFrom && { dateFrom: options.dateFrom }),
      ...(options.dateTo && { dateTo: options.dateTo }),
      ...(options.includeStats && { includeStats: 'true' }),
    });

    return apiClient<TransactionListResponse>(`/api/transactions?${params}`);
  },
};

// 店舗API
export const storeApi = {
  getStores: async (): Promise<ApiResponse<{ stores: Store[]; count: number; message: string }>> => {
    return apiClient<{ stores: Store[]; count: number; message: string }>('/api/stores');
  },

  getStore: async (storeId: number): Promise<ApiResponse<{ store: Store; message: string }>> => {
    return apiClient<{ store: Store; message: string }>(`/api/stores/${storeId}`);
  },

  createStore: async (data: StoreCreateRequest): Promise<ApiResponse<{ store: Store; message: string }>> => {
    return apiClient<{ store: Store; message: string }>('/api/stores', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateStore: async (storeId: number, data: Partial<StoreCreateRequest>): Promise<ApiResponse<{ store: Store; message: string }>> => {
    return apiClient<{ store: Store; message: string }>(`/api/stores/${storeId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteStore: async (storeId: number, forceDelete: boolean = false): Promise<ApiResponse<{ message: string }>> => {
    const url = `/api/stores/${storeId}${forceDelete ? '?forceDelete=true' : ''}`;
    return apiClient<{ message: string }>(url, {
      method: 'DELETE',
    });
  },

  getStoreStats: async (storeId: number): Promise<ApiResponse<StoreStats>> => {
    return apiClient<StoreStats>(`/api/stores/${storeId}/stats`);
  },
};

// ヘルスチェック
export const healthApi = {
  check: async (): Promise<ApiResponse<HealthResponse>> => {
    return apiClient<HealthResponse>('/health');
  },
};