import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '../../organisms/Toast';

interface Store {
  id: string;
  name: string;
  balance: number;
}

export const StoreSelectPage: React.FC = () => {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [stores, setStores] = useState<Store[]>([
    { id: '1', name: 'セガ秋葉原', balance: 1850 },
    { id: '2', name: 'タイトー渋谷', balance: 520 },
    { id: '3', name: 'ナムコ池袋', balance: 0 }
  ]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
      const name = localStorage.getItem('userName') || '';
      
      setIsLoggedIn(loggedIn);
      setUserName(name);

      if (!loggedIn) {
        router.push('/login');
      }
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('isGuest');
    router.push('/login');
  };

  const handleStoreSelect = (storeId: string) => {
    router.push(`/store/${storeId}`);
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

  const handleDeleteStore = (storeId: string, storeName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`${storeName} を削除しますか？`)) {
      setStores(prev => prev.filter(s => s.id !== storeId));
      showToast(`${storeName} を削除しました`, 'success');
    }
  };

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="flex justify-between items-center p-4 max-w-4xl mx-auto">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-800">メダルバンク</h1>
            <p className="text-sm text-gray-600">こんにちは、{userName}様</p>
          </div>
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

      {/* メインコンテンツ */}
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🏪</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            店舗を選択してください
          </h2>
          <p className="text-gray-600">
            管理したい店舗を選択してメダル管理を開始しましょう
          </p>
        </div>

        {/* 店舗一覧 */}
        <div className="grid gap-4 mb-6">
          {stores.map((store) => (
            <div
              key={store.id}
              onClick={() => handleStoreSelect(store.id)}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer group"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🎮</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                      {store.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      残高: {store.balance.toLocaleString()}メダル
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => handleDeleteStore(store.id, store.name, e)}
                    className="text-red-400 hover:text-red-600 p-2 rounded-md hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                    title="店舗を削除"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  <div className="text-blue-400 group-hover:text-blue-600 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 店舗追加ボタン */}
        <button
          onClick={handleAddStore}
          className="w-full bg-blue-500 text-white py-4 rounded-xl font-semibold text-lg hover:bg-blue-600 transition-all duration-200 active:scale-95 shadow-lg border-2 border-dashed border-transparent hover:border-blue-300"
        >
          <div className="flex items-center justify-center space-x-2">
            <span className="text-2xl">+</span>
            <span>新しい店舗を追加</span>
          </div>
        </button>
      </div>
    </div>
  );
};