import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '../../organisms/Toast';
import { storeApi, balanceApi } from '@/utils/api';

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

export const StoreSelectPage: React.FC = () => {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
      const name = localStorage.getItem('userName') || '';
      
      setIsLoggedIn(loggedIn);
      setUserName(name);

      if (!loggedIn) {
        router.push('/login');
      } else {
        loadStores();
      }
    }
  }, [router]);

  const loadStores = async () => {
    setIsLoading(true);
    try {
      const result = await storeApi.getStores();
      if (result.success) {
        setStores(result.data!.stores);
      } else {
        showToast('店舗情報の取得に失敗しました', 'error');
      }
    } catch (err) {
      showToast('店舗情報の取得に失敗しました', 'error');
    } finally {
      setIsLoading(false);
    }
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

  const handleStoreSelect = (storeId: number) => {
    router.push(`/store/${storeId}`);
  };

  const handleAddStore = async () => {
    const storeName = prompt('店舗名を入力してください:');
    if (storeName && storeName.trim()) {
      try {
        const result = await storeApi.createStore({
          name: storeName.trim(),
          description: '新しい店舗',
          color: '#10B981',
          createBalanceForAllUsers: true
        });
        
        if (result.success) {
          await loadStores(); // 店舗一覧を再読み込み
          showToast(`${storeName} を追加しました`, 'success');
        } else {
          showToast('店舗の追加に失敗しました', 'error');
        }
      } catch (err) {
        showToast('店舗の追加に失敗しました', 'error');
      }
    }
  };

  const handleDeleteStore = async (storeId: number, storeName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`${storeName} を削除しますか？取引履歴も含めて完全に削除されます。`)) {
      try {
        const result = await storeApi.deleteStore(storeId, true); // forceDelete = true
        
        if (result.success) {
          await loadStores(); // 店舗一覧を再読み込み
          showToast(`${storeName} を削除しました`, 'success');
        } else {
          showToast('店舗の削除に失敗しました', 'error');
        }
      } catch (err) {
        showToast('店舗の削除に失敗しました', 'error');
      }
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
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="text-gray-600 mt-2">店舗情報を読み込み中...</p>
            </div>
          ) : stores.length > 0 ? (
            stores.map((store) => (
              <div
                key={store.id}
                onClick={() => handleStoreSelect(store.id)}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer group"
                style={{ 
                  borderColor: `${store.color}33`,
                  '&:hover': { borderColor: store.color }
                }}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${store.color}20` }}
                    >
                      <span className="text-2xl">🎮</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 transition-colors">
                        {store.name}
                      </h3>
                      {store.description && (
                        <p className="text-xs text-gray-500 mb-1">{store.description}</p>
                      )}
                      <p className="text-sm text-gray-600">
                        残高: {(store.total_balance || 0).toLocaleString()}メダル
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
                    <div style={{ color: store.color }} className="transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">🏪</div>
              <p className="text-gray-500">店舗がありません</p>
              <p className="text-sm text-gray-400">下のボタンから店舗を追加してください</p>
            </div>
          )}
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