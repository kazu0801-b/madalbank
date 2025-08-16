import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BottomNavigation } from '../../organisms/BottomNavigation';
import { useToast } from '../../organisms/Toast';
import { LoadingSpinner } from '../../atoms/LoadingSpinner';
import { balanceApi, transactionApi } from '@/utils/api';

interface Transaction {
  id: number;
  type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  description?: string;
  created_at: string;
  type_display?: string;
}

interface Balance {
  user_id: number;
  username: string;
  total_balance: number;
  updated_at?: string;
  message: string;
}

export const HomePageAPI: React.FC = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [, setUserEmail] = useState('');
  const [balance, setBalance] = useState<Balance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTransactionLoading, setIsTransactionLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
      const name = localStorage.getItem('userName') || '';
      const email = localStorage.getItem('userEmail') || '';
      const isGuest = localStorage.getItem('isGuest') === 'true';
      
      setIsLoggedIn(loggedIn);
      setUserName(name);
      setUserEmail(isGuest ? 'ゲスト' : email);

      if (loggedIn) {
        loadDashboardData();
      }
    }
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // 残高と取引履歴を並行して取得
      const [balanceResult, transactionsResult] = await Promise.all([
        balanceApi.getBalance(1, 1), // ユーザーID=1, 店舗ID=1（ラウンドワン）
        transactionApi.getTransactions(1, { storeId: 1, limit: 10 })
      ]);

      if (balanceResult.success) {
        setBalance(balanceResult.data!);
      } else {
        throw new Error(`残高取得エラー: ${balanceResult.error}`);
      }

      if (transactionsResult.success) {
        setTransactions(transactionsResult.data!.transactions);
      } else {
        throw new Error(`取引履歴取得エラー: ${transactionsResult.error}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'データ取得に失敗しました';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      console.error('Dashboard data loading error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    router.push('/login');
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('isGuest');
    setIsLoggedIn(false);
    setUserName('');
    setUserEmail('');
    setBalance(null);
    setTransactions([]);
    router.push('/login');
  };

  const handleQuickDeposit = async (amount: number) => {
    setIsTransactionLoading(true);
    try {
      const result = await transactionApi.createTransaction({
        store_id: 1, // デフォルト店舗（ラウンドワン）
        type: 'deposit',
        amount,
        description: `クイック入金 ${amount}メダル`,
      });

      if (result.success) {
        // データを再読み込み
        await loadDashboardData();
        showToast(`${amount}メダルを入金しました！`, 'success');
      } else {
        throw new Error(result.error || '入金に失敗しました');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '入金に失敗しました';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsTransactionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🏪</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            メダルバンクへようこそ
          </h2>
          <p className="text-gray-600 mb-8">
            ログインしてメダル管理を始めましょう
          </p>
          <button
            onClick={handleLogin}
            className="bg-blue-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
          >
            ログインする
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      {/* ヘッダー - レスポンシブ対応 */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="flex justify-between items-center p-4 max-w-4xl mx-auto">
          <div className="flex-1">
            <h1 className="text-lg md:text-xl font-bold text-gray-800">メダルバンクMVP</h1>
            <p className="text-sm text-gray-600">こんにちは、{userName}様</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={loadDashboardData}
              disabled={isLoading}
              className="bg-green-500 text-white w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm disabled:opacity-50 hover:bg-green-600 transition-colors"
              title="データを再読み込み"
            >
              {isLoading ? (
                <LoadingSpinner size="small" color="gray" />
              ) : (
                <span className="text-lg">↻</span>
              )}
            </button>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors hidden sm:block"
            >
              ログアウト
            </button>
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-md hover:bg-gray-100 transition-colors sm:hidden"
              title="ログアウト"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 p-4 m-4 rounded-lg">
          <div className="flex items-center">
            <span className="text-red-600 mr-2">⚠️</span>
            <span className="text-red-700 text-sm">{error}</span>
            <button
              onClick={() => setError('')}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* メインコンテンツ - レスポンシブ対応 */}
      <div className="p-4 max-w-4xl mx-auto">
        {/* ローディングオーバーレイ */}
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 shadow-xl">
              <LoadingSpinner size="large" text="データを読み込んでいます..." />
            </div>
          </div>
        )}

        {/* 残高カード - レスポンシブ対応 */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-4 md:p-6 text-white mb-6 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4">
            <div className="flex-1">
              <p className="text-blue-100 text-sm">現在の残高</p>
              <div className="flex items-baseline space-x-2">
                <p className="text-2xl md:text-3xl font-bold">
                  {balance ? balance.total_balance.toLocaleString() : '---'}
                </p>
                <p className="text-blue-100 text-sm">メダル</p>
              </div>
            </div>
            <div className="text-2xl md:text-3xl mt-2 sm:mt-0">💰</div>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:justify-between text-sm text-blue-100 space-y-1 sm:space-y-0">
            <span className="flex items-center">
              <span className="mr-1">👤</span>
              {balance?.username || '---'}
            </span>
            <span className="flex items-center">
              <span className="mr-1">📅</span>
              {balance?.updated_at ? formatDate(balance.updated_at) : '---'}
            </span>
          </div>
        </div>

        {/* クイック操作 - レスポンシブ対応 */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">クイック操作</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            <button
              onClick={() => handleQuickDeposit(100)}
              disabled={isTransactionLoading}
              className="bg-green-500 text-white p-3 md:p-4 rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isTransactionLoading ? (
                <LoadingSpinner size="small" color="gray" />
              ) : (
                '+100'
              )}
            </button>
            <button
              onClick={() => handleQuickDeposit(500)}
              disabled={isTransactionLoading}
              className="bg-green-600 text-white p-3 md:p-4 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isTransactionLoading ? (
                <LoadingSpinner size="small" color="gray" />
              ) : (
                '+500'
              )}
            </button>
            <button
              onClick={() => handleQuickDeposit(1000)}
              disabled={isTransactionLoading}
              className="bg-green-700 text-white p-3 md:p-4 rounded-lg font-medium hover:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isTransactionLoading ? (
                <LoadingSpinner size="small" color="gray" />
              ) : (
                '+1000'
              )}
            </button>
            {/* デスクトップ用の追加ボタン */}
            <button
              onClick={() => handleQuickDeposit(2000)}
              disabled={isTransactionLoading}
              className="hidden md:flex bg-green-800 text-white p-4 rounded-lg font-medium hover:bg-green-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed items-center justify-center"
            >
              {isTransactionLoading ? (
                <LoadingSpinner size="small" color="gray" />
              ) : (
                '+2000'
              )}
            </button>
            <button
              onClick={() => handleQuickDeposit(5000)}
              disabled={isTransactionLoading}
              className="hidden md:flex bg-blue-500 text-white p-4 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed items-center justify-center"
            >
              {isTransactionLoading ? (
                <LoadingSpinner size="small" color="gray" />
              ) : (
                '+5000'
              )}
            </button>
            <button
              onClick={() => handleQuickDeposit(10000)}
              disabled={isTransactionLoading}
              className="hidden md:flex bg-purple-500 text-white p-4 rounded-lg font-medium hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed items-center justify-center"
            >
              {isTransactionLoading ? (
                <LoadingSpinner size="small" color="gray" />
              ) : (
                '+10K'
              )}
            </button>
          </div>
          {isTransactionLoading && (
            <p className="text-sm text-gray-500 mt-2 animate-pulse">
              取引を処理しています...
            </p>
          )}
        </div>

        {/* 取引履歴 */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-gray-800">最近の取引</h2>
            <button 
              onClick={() => router.push('/test')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              詳細テスト
            </button>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            {transactions.length > 0 ? (
              <>
                {transactions.slice(0, 5).map((transaction, index) => (
                  <div key={transaction.id} className={`p-4 ${index < 4 ? 'border-b border-gray-100' : ''}`}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                          transaction.type === 'deposit' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          <span className={`text-sm ${
                            transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'deposit' ? '+' : '-'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            {transaction.type_display || (transaction.type === 'deposit' ? '入金' : '出金')}
                          </p>
                          <p className="text-xs text-gray-600">
                            {formatDate(transaction.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'deposit' ? '+' : '-'}{transaction.amount}
                        </p>
                        <p className="text-xs text-gray-500">
                          残高: {transaction.balance_after}
                        </p>
                      </div>
                    </div>
                    {transaction.description && (
                      <p className="text-xs text-gray-500 mt-2 ml-11">
                        {transaction.description}
                      </p>
                    )}
                  </div>
                ))}
              </>
            ) : (
              <div className="p-8 text-center">
                <div className="text-3xl mb-2">📝</div>
                <p className="text-gray-500 text-sm">まだ取引がありません</p>
                <button
                  onClick={() => handleQuickDeposit(100)}
                  className="mt-3 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm"
                >
                  初回入金してみる
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 統計情報 */}
        {transactions.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">取引統計</h2>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    +{transactions
                      .filter(t => t.type === 'deposit')
                      .reduce((sum, t) => sum + t.amount, 0)}
                  </p>
                  <p className="text-xs text-gray-600">入金合計</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">
                    -{transactions
                      .filter(t => t.type === 'withdraw')
                      .reduce((sum, t) => sum + t.amount, 0)}
                  </p>
                  <p className="text-xs text-gray-600">出金合計</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{transactions.length}</p>
                  <p className="text-xs text-gray-600">取引回数</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 下部ナビゲーション */}
      <BottomNavigation />
    </div>
  );
};