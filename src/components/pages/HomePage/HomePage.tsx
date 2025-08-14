import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BottomNavigation } from '../../organisms/BottomNavigation';
import { dataStore } from '@/utils/database';
import { Store } from '@/types';

export const HomePage: React.FC = () => {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [stores, setStores] = useState<Store[]>([]);
  const [showAddStore, setShowAddStore] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
      const email = localStorage.getItem('userEmail') || '';
      const isGuest = localStorage.getItem('isGuest') === 'true';
      setIsLoggedIn(loggedIn);
      setUserEmail(isGuest ? 'ゲスト' : email);
    }
    loadStores();
  }, []);

  const loadStores = () => {
    setStores(dataStore.getAllStores());
  };

  const handleLogin = () => {
    router.push('/login');
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('isGuest');
    setIsLoggedIn(false);
    setUserEmail('');
    router.push('/login');
  };

  const handleAddStore = () => {
    if (newStoreName.trim()) {
      dataStore.addStore(newStoreName.trim());
      setNewStoreName('');
      setShowAddStore(false);
      loadStores();
    }
  };

  const handleStoreClick = (storeId: string) => {
    router.push(`/store/${storeId}`);
  };

  const getTotalBalance = () => {
    return stores.reduce((total, store) => total + dataStore.getStoreMedalBalance(store.id), 0);
  };

  const getAllRecentTransactions = () => {
    const allTransactions: Array<{ store: Store; record: any; }> = [];
    stores.forEach(store => {
      const records = dataStore.getMedalRecordsByStoreId(store.id).slice(0, 3);
      records.forEach(record => {
        allTransactions.push({ store, record });
      });
    });
    return allTransactions.sort((a, b) => 
      new Date(b.record.transactionDate).getTime() - new Date(a.record.transactionDate).getTime()
    ).slice(0, 5);
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
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="flex justify-between items-center p-4">
          <div>
            <h1 className="text-lg font-bold text-gray-800">メダルバンク</h1>
            <p className="text-sm text-gray-600">こんにちは、{userEmail}様</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAddStore(true)}
              className="bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm"
            >
              +
            </button>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ログアウト
            </button>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="p-4">
        {/* 総残高カード */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-blue-100 text-sm">総残高</p>
              <p className="text-3xl font-bold">{getTotalBalance().toLocaleString()}</p>
              <p className="text-blue-100 text-sm">メダル</p>
            </div>
            <div className="text-2xl">💰</div>
          </div>
          
          <div className="flex justify-between text-sm text-blue-100">
            <span>🏪 店舗数: {stores.length}</span>
            <span>📅 最新更新: 今日</span>
          </div>
        </div>

        {/* 店舗一覧 */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-gray-800">店舗一覧</h2>
            <button 
              onClick={() => setShowAddStore(true)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              店舗追加
            </button>
          </div>
          
          {stores.length > 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
              {stores.map((store) => (
                <div
                  key={store.id}
                  onClick={() => handleStoreClick(store.id)}
                  className="px-4 py-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 active:bg-gray-100"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-blue-600 text-lg">🏪</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{store.name}</h3>
                      <p className="text-sm text-gray-500">
                        {dataStore.getStoreMedalBalance(store.id)}枚
                      </p>
                    </div>
                  </div>
                  <div className="text-gray-400">→</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-200">
              <div className="text-4xl mb-3">🏪</div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">店舗がありません</h3>
              <p className="text-gray-500 text-sm mb-4">右上の「+」ボタンから店舗を追加してください</p>
              <button
                onClick={() => setShowAddStore(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm"
              >
                店舗を追加
              </button>
            </div>
          )}
        </div>

        {/* 最近の取引 */}
        {stores.length > 0 && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold text-gray-800">最近の取引</h2>
              <button className="text-sm text-blue-600 hover:text-blue-700">
                すべて見る
              </button>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              {getAllRecentTransactions().slice(0, 3).map((transaction, index) => (
                <div key={`${transaction.store.id}-${transaction.record.id}`} className={`p-4 ${index < 2 ? 'border-b border-gray-100' : ''}`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                        transaction.record.transactionType === 'deposit' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        <span className={`text-sm ${
                          transaction.record.transactionType === 'deposit' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.record.transactionType === 'deposit' ? '+' : '-'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {transaction.record.transactionType === 'deposit' ? '入金' : '出金'} - {transaction.store.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {new Date(transaction.record.transactionDate).toLocaleDateString('ja-JP')}
                        </p>
                      </div>
                    </div>
                    <p className={`font-semibold ${
                      transaction.record.transactionType === 'deposit' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.record.transactionType === 'deposit' ? '+' : '-'}{transaction.record.medalCount}
                    </p>
                  </div>
                </div>
              ))}
              
              {getAllRecentTransactions().length === 0 && (
                <div className="p-8 text-center">
                  <div className="text-3xl mb-2">📝</div>
                  <p className="text-gray-500 text-sm">まだ取引がありません</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 統計情報 */}
        {stores.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">今月の統計</h2>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    +{getAllRecentTransactions()
                      .filter(t => t.record.transactionType === 'deposit')
                      .reduce((sum, t) => sum + t.record.medalCount, 0)}
                  </p>
                  <p className="text-xs text-gray-600">入金合計</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">
                    -{getAllRecentTransactions()
                      .filter(t => t.record.transactionType === 'withdraw')
                      .reduce((sum, t) => sum + t.record.medalCount, 0)}
                  </p>
                  <p className="text-xs text-gray-600">出金合計</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{getAllRecentTransactions().length}</p>
                  <p className="text-xs text-gray-600">取引回数</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Store Modal */}
      {showAddStore && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-4">新規店舗追加</h2>
            <input
              type="text"
              placeholder="店舗名を入力"
              value={newStoreName}
              onChange={(e) => setNewStoreName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4"
              autoFocus
            />
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAddStore(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg"
              >
                キャンセル
              </button>
              <button
                onClick={handleAddStore}
                disabled={!newStoreName.trim()}
                className="flex-1 bg-blue-500 text-white py-2 rounded-lg disabled:bg-gray-300"
              >
                追加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 下部ナビゲーション */}
      <BottomNavigation />
    </div>
  );
};