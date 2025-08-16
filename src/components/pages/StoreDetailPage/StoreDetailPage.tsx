import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '../../organisms/Toast';
import { LoadingSpinner } from '../../atoms/LoadingSpinner';
import { CompactBalance } from '../../molecules/CompactBalance';
import { Calculator } from '../../molecules/Calculator';
import { KeyboardInput } from '../../molecules/KeyboardInput';
import { TransactionCard } from '../../molecules/TransactionCard';
import { useDeviceType } from '@/hooks/useDeviceType';
import { balanceApi, transactionApi, storeApi } from '@/utils/api';

interface Store {
  id: number;
  name: string;
  description?: string;
  color: string;
  created_at: string;
  updated_at: string;
  user_count?: number;
  total_balance?: number;
}

interface Transaction {
  id: number;
  type: 'deposit' | 'withdraw';
  amount: number;
  balance_before: number;
  balance_after: number;
  description?: string;
  created_at: string;
}

interface Balance {
  user_id: number;
  username: string;
  total_balance: number;
  updated_at: string;
  message: string;
}

interface StoreDetailPageProps {
  storeId: string;
}

export const StoreDetailPage: React.FC<StoreDetailPageProps> = ({ storeId }) => {
  const router = useRouter();
  const { showToast } = useToast();
  const { isMobile } = useDeviceType();
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [store, setStore] = useState<Store | null>(null);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [inputOpen, setInputOpen] = useState(false);
  const [inputType, setInputType] = useState<'deposit' | 'withdraw'>('deposit');
  const [isTransactionLoading, setIsTransactionLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
      const name = localStorage.getItem('userName') || '';
      
      setIsLoggedIn(loggedIn);
      setUserName(name);

      if (!loggedIn) {
        router.push('/login');
        return;
      }

      // 店舗情報をAPIから取得
      loadStoreData();
    }
  }, [storeId, router]);

  const loadStoreData = async () => {
    try {
      const storeIdNum = parseInt(storeId);
      const result = await storeApi.getStore(storeIdNum);
      
      if (result.success) {
        setStore(result.data!.store);
        loadDashboardData();
      } else {
        showToast('店舗が見つかりません', 'error');
        router.push('/');
      }
    } catch (err) {
      showToast('店舗情報の取得に失敗しました', 'error');
      router.push('/');
    }
  };

  // デバッグ用：APIテスト
  useEffect(() => {
    const testAPI = async () => {
      try {
        console.log('API Test: Testing backend connection...');
        const healthResult = await fetch('http://localhost:8000/health');
        const healthData = await healthResult.json();
        console.log('API Test: Health check result:', healthData);
        
        const balanceResult = await fetch('http://localhost:8000/api/balance/1');
        const balanceData = await balanceResult.json();
        console.log('API Test: Balance result:', balanceData);
      } catch (error) {
        console.error('API Test: Connection failed:', error);
      }
    };
    
    if (typeof window !== 'undefined') {
      testAPI();
    }
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    
    try {
      const storeIdNum = parseInt(storeId);
      const [balanceResult, transactionsResult] = await Promise.all([
        balanceApi.getBalance(1, storeIdNum),
        transactionApi.getTransactions(1, { storeId: storeIdNum, limit: 10 })
      ]);

      if (balanceResult.success) {
        setBalance(balanceResult.data!);
      }

      if (transactionsResult.success) {
        setTransactions(transactionsResult.data!.transactions);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'データ取得に失敗しました';
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/');
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('isGuest');
    router.push('/login');
  };

  const handleInputConfirm = async (amount: number) => {
    setIsTransactionLoading(true);
    
    try {
      const storeIdNum = parseInt(storeId);
      const result = await transactionApi.createTransaction({
        store_id: storeIdNum,
        type: inputType,
        amount,
        description: `${inputType === 'deposit' ? '入金' : '出金'} ${amount}メダル`,
      });

      if (result.success) {
        await loadDashboardData();
        showToast(
          `${amount}メダルを${inputType === 'deposit' ? '入金' : '出金'}しました！`, 
          'success'
        );
      } else {
        throw new Error(result.error || '取引に失敗しました');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '取引に失敗しました';
      showToast(errorMessage, 'error');
    } finally {
      setIsTransactionLoading(false);
    }
  };

  if (!isLoggedIn || !store) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="flex justify-between items-center p-4 max-w-4xl mx-auto">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleBack}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-md hover:bg-gray-100 transition-colors"
              title="戻る"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-800">{store.name}</h1>
              <p className="text-sm text-gray-600">こんにちは、{userName}様</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={loadDashboardData}
              disabled={isLoading}
              className="bg-green-500 text-white w-10 h-10 rounded-full flex items-center justify-center text-sm disabled:opacity-50 hover:bg-green-600 transition-colors"
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
              className="text-gray-500 hover:text-gray-700 p-2 rounded-md hover:bg-gray-100 transition-colors"
              title="ログアウト"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="min-h-screen bg-gradient-to-br from-blue-400 to-blue-600 p-6">
        <div className="max-w-md mx-auto">
          {/* メインカード */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* ヘッダー */}
            <div className="p-6 text-white text-center" style={{ 
              background: `linear-gradient(to right, ${store.color}, ${store.color}dd)` 
            }}>
              <h1 className="text-2xl font-bold">{store.name}</h1>
              {store.description && (
                <p className="text-sm opacity-90 mt-1">{store.description}</p>
              )}
            </div>

            {/* 残高表示 */}
            <div className="p-8 text-center">
              <div className="flex items-center justify-center mb-4">
                <span className="text-4xl mr-3">💰</span>
                <span className="text-4xl font-bold text-gray-800">
                  {balance ? balance.total_balance.toLocaleString() : '---'}
                </span>
                <span className="text-lg text-gray-600 ml-2">メダル</span>
              </div>
            </div>

            {/* 操作ボタン */}
            <div className="px-8 pb-6">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    setInputType('deposit');
                    setInputOpen(true);
                  }}
                  disabled={isTransactionLoading}
                  className="bg-green-500 text-white py-4 rounded-2xl font-bold text-lg hover:bg-green-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-lg"
                >
                  入金
                </button>
                <button
                  onClick={() => {
                    setInputType('withdraw');
                    setInputOpen(true);
                  }}
                  disabled={isTransactionLoading}
                  className="bg-red-500 text-white py-4 rounded-2xl font-bold text-lg hover:bg-red-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-lg"
                >
                  払い出し
                </button>
              </div>
            </div>

            {/* 取引履歴 */}
            <div className="px-8 pb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">取引履歴</h3>
              <div className="space-y-3">
                {transactions.length > 0 ? (
                  transactions.slice(0, 5).map((transaction, index) => (
                    <div key={transaction.id} className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <div className={`px-4 py-2 rounded-lg font-medium text-white ${
                          transaction.type === 'deposit' ? 'bg-green-500' : 'bg-red-500'
                        }`}>
                          {transaction.type === 'deposit' ? '入金' : '払い出し'}
                        </div>
                        <span className="font-medium text-gray-800">
                          {transaction.type === 'deposit' ? '入金' : '払い出し'}
                        </span>
                      </div>
                      <span className={`text-xl font-bold ${
                        transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'deposit' ? '+' : '-'}{transaction.amount.toLocaleString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="text-3xl mb-2">📝</div>
                    <p className="text-gray-500 text-sm">まだ取引がありません</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 入力モーダル（デバイスに応じて切り替え） */}
      {isMobile ? (
        <Calculator
          isOpen={inputOpen}
          onClose={() => setInputOpen(false)}
          onConfirm={handleInputConfirm}
          type={inputType}
          currentBalance={balance?.total_balance || 0}
        />
      ) : (
        <KeyboardInput
          isOpen={inputOpen}
          onClose={() => setInputOpen(false)}
          onConfirm={handleInputConfirm}
          type={inputType}
          currentBalance={balance?.total_balance || 0}
        />
      )}
    </div>
  );
};