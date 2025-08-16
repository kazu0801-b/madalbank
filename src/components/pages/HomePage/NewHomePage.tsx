import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '../../organisms/Toast';
import { LoadingSpinner } from '../../atoms/LoadingSpinner';
import { StoreTabs } from '../../molecules/StoreTabs';
import { CompactBalance } from '../../molecules/CompactBalance';
import { Calculator } from '../../molecules/Calculator';
import { TransactionCard } from '../../molecules/TransactionCard';
import { balanceApi, transactionApi } from '@/utils/api';

// 型定義
interface Store {
  id: string;
  name: string;
  balance: number;
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
  updated_at?: string;
  message: string;
}

export const NewHomePage: React.FC = () => {
  const router = useRouter();
  const { showToast } = useToast();
  
  // 認証状態
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  
  // 店舗・残高・取引データ
  const [stores, setStores] = useState<Store[]>([
    { id: '1', name: 'セガ秋葉原', balance: 1850 },
    { id: '2', name: 'タイトー渋谷', balance: 520 },
    { id: '3', name: 'ナムコ池袋', balance: 0 }
  ]);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>('1');
  const [balance, setBalance] = useState<Balance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // UI状態
  const [isLoading, setIsLoading] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [calculatorType, setCalculatorType] = useState<'deposit' | 'withdraw'>('deposit');
  const [isTransactionLoading, setIsTransactionLoading] = useState(false);

  // 初期化
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
      const name = localStorage.getItem('userName') || '';
      
      setIsLoggedIn(loggedIn);
      setUserName(name);

      if (loggedIn) {
        loadDashboardData();
      }
    }
  }, []);

  // データ読み込み
  const loadDashboardData = async () => {
    setIsLoading(true);
    
    try {
      const [balanceResult, transactionsResult] = await Promise.all([
        balanceApi.getBalance(1),
        transactionApi.getTransactions(10)
      ]);

      if (balanceResult.success) {
        setBalance(balanceResult.data!);
        // 選択中店舗の残高を更新
        if (selectedStoreId) {
          setStores(prev => prev.map(store => 
            store.id === selectedStoreId 
              ? { ...store, balance: balanceResult.data!.total_balance }
              : store
          ));
        }
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

  // ログイン・ログアウト
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
    setBalance(null);
    setTransactions([]);
    router.push('/login');
  };

  // 店舗管理
  const handleStoreSelect = (storeId: string) => {
    setSelectedStoreId(storeId);
    // 実際のアプリでは店舗IDに基づいてデータを再読み込み
    loadDashboardData();
  };

  const handleAddStore = () => {
    const storeName = prompt('店舗名を入力してください:');
    if (storeName && storeName.trim()) {
      const newStore: Store = {
        id: Date.now().toString(),
        name: storeName.trim(),
        balance: 0
      };
      setStores(prev => [...prev, newStore]);
      showToast(`${storeName} を追加しました`, 'success');
    }
  };

  const handleDeleteStore = (storeId: string) => {
    const store = stores.find(s => s.id === storeId);
    if (store && confirm(`${store.name} を削除しますか？`)) {
      setStores(prev => prev.filter(s => s.id !== storeId));
      if (selectedStoreId === storeId) {
        const remainingStores = stores.filter(s => s.id !== storeId);
        setSelectedStoreId(remainingStores.length > 0 ? remainingStores[0].id : null);
      }
      showToast(`${store.name} を削除しました`, 'success');
    }
  };

  // 取引処理
  const handleCalculatorConfirm = async (amount: number) => {
    setIsTransactionLoading(true);
    
    try {
      const result = await transactionApi.createTransaction({
        store_id: 1, // デフォルト店舗（ラウンドワン）
        type: calculatorType,
        amount,
        description: `${calculatorType === 'deposit' ? '入金' : '出金'} ${amount}メダル`,
      });

      if (result.success) {
        await loadDashboardData();
        showToast(
          `${amount}メダルを${calculatorType === 'deposit' ? '入金' : '出金'}しました！`, 
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

  // 未ログイン時の表示
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
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

  const currentStore = stores.find(store => store.id === selectedStoreId);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="flex justify-between items-center p-4 max-w-4xl mx-auto">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-800">メダルバンク</h1>
            <p className="text-sm text-gray-600">こんにちは、{userName}様</p>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="p-4 max-w-4xl mx-auto space-y-4">
        {/* 店舗選択 */}
        <StoreTabs
          stores={stores}
          selectedStoreId={selectedStoreId}
          onStoreSelect={handleStoreSelect}
          onAddStore={handleAddStore}
          onDeleteStore={handleDeleteStore}
        />

        {/* 残高表示 */}
        {currentStore && balance && (
          <CompactBalance
            storeName={currentStore.name}
            balance={balance.total_balance}
            lastUpdated={balance.updated_at}
            isLoading={isLoading}
          />
        )}

        {/* 操作ボタン */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => {
              setCalculatorType('deposit');
              setCalculatorOpen(true);
            }}
            disabled={isTransactionLoading}
            className="bg-green-500 text-white py-4 rounded-xl font-semibold text-lg hover:bg-green-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-lg"
          >
            <div className="flex items-center justify-center space-x-2">
              <span className="text-2xl">💰</span>
              <span>入金</span>
            </div>
          </button>
          <button
            onClick={() => {
              setCalculatorType('withdraw');
              setCalculatorOpen(true);
            }}
            disabled={isTransactionLoading}
            className="bg-red-500 text-white py-4 rounded-xl font-semibold text-lg hover:bg-red-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-lg"
          >
            <div className="flex items-center justify-center space-x-2">
              <span className="text-2xl">💸</span>
              <span>出金</span>
            </div>
          </button>
        </div>

        {/* 取引履歴 */}
        <TransactionCard 
          transactions={transactions} 
          isLoading={isLoading}
        />
      </div>

      {/* 電卓モーダル */}
      <Calculator
        isOpen={calculatorOpen}
        onClose={() => setCalculatorOpen(false)}
        onConfirm={handleCalculatorConfirm}
        type={calculatorType}
        currentBalance={balance?.total_balance || 0}
      />
    </div>
  );
};