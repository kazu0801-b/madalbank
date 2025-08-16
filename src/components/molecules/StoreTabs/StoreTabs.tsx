import { useState } from 'react';

interface Store {
  id: string;
  name: string;
  balance: number;
}

interface StoreTabsProps {
  stores: Store[];
  selectedStoreId: string | null;
  onStoreSelect: (storeId: string) => void;
  onAddStore: () => void;
  onDeleteStore: (storeId: string) => void;
}

export const StoreTabs: React.FC<StoreTabsProps> = ({
  stores,
  selectedStoreId,
  onStoreSelect,
  onAddStore,
  onDeleteStore
}) => {
  const [showDeleteMode, setShowDeleteMode] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
      {/* ヘッダー */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">🏪 店舗選択</h2>
        <div className="flex space-x-2">
          {stores.length > 0 && (
            <button
              onClick={() => setShowDeleteMode(!showDeleteMode)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                showDeleteMode
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {showDeleteMode ? '完了' : '編集'}
            </button>
          )}
          <button
            onClick={onAddStore}
            className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            + 追加
          </button>
        </div>
      </div>

      {/* 店舗タブ */}
      {stores.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {stores.map((store) => (
            <div
              key={store.id}
              className={`relative group ${
                selectedStoreId === store.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } rounded-lg transition-all duration-200 cursor-pointer`}
              onClick={() => !showDeleteMode && onStoreSelect(store.id)}
            >
              <div className="px-4 py-3">
                <div className="font-medium text-sm">{store.name}</div>
                <div className={`text-xs mt-1 ${
                  selectedStoreId === store.id ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {store.balance.toLocaleString()} メダル
                </div>
              </div>
              
              {/* 削除ボタン */}
              {showDeleteMode && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteStore(store.id);
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold hover:bg-red-600 transition-colors"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🏪</div>
          <p className="text-gray-500 text-sm mb-4">まだ店舗が登録されていません</p>
          <button
            onClick={onAddStore}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            最初の店舗を追加
          </button>
        </div>
      )}
    </div>
  );
};