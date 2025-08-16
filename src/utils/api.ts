// 動的にAPIベースURLを決定
const getApiBaseUrl = () => {
  // 環境変数が設定されている場合はそれを使用
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // ブラウザ環境でのみ実行
  if (typeof window !== 'undefined') {
    const currentPort = window.location.port;
    
    // フロントエンドポートに応じてAPIポートを自動選択
    switch (currentPort) {
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

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

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
  login: async (username: string) => {
    return apiClient<{ token: string; user: { id: number; username: string; email: string } }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username }),
    });
  },

  checkAuth: async () => {
    return apiClient<{ user: { id: number; username: string; email: string } }>('/api/auth/me');
  },
};

// 残高API
export const balanceApi = {
  getBalance: async (userId: number = 1) => {
    return apiClient<{
      user_id: number;
      username: string;
      total_balance: number;
      updated_at: string;
      message: string;
    }>(`/api/balance/${userId}`);
  },
};

// 取引API
export const transactionApi = {
  createTransaction: async (data: {
    type: 'deposit' | 'withdraw';
    amount: number;
    description?: string;
  }) => {
    return apiClient<{
      transaction: {
        id: number;
        user_id: number;
        type: string;
        amount: number;
        balance_before: number;
        balance_after: number;
        description: string;
        created_at: string;
      };
      message: string;
    }>('/api/transactions', {
      method: 'POST',
      body: JSON.stringify({ ...data, user_id: 1 }),
    });
  },

  getTransactions: async (limit: number = 10) => {
    return apiClient<{
      transactions: Array<{
        id: number;
        user_id: number;
        type: string;
        amount: number;
        balance_before: number;
        balance_after: number;
        description: string;
        created_at: string;
      }>;
      message: string;
    }>(`/api/transactions?userId=1&limit=${limit}`);
  },
};

// ヘルスチェック
export const healthApi = {
  check: async () => {
    return apiClient<{ status: string; message: string; timestamp: string }>('/health');
  },
};