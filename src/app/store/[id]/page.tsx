'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { dataStore } from '@/utils/database';
import { Store, MedalRecord } from '@/types';

export default function StoreDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [store, setStore] = useState<Store | null>(null);
  const [records, setRecords] = useState<MedalRecord[]>([]);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [medalCount, setMedalCount] = useState('');
  const [transactionType, setTransactionType] = useState<'deposit' | 'withdraw'>('deposit');
  const [expiryDate, setExpiryDate] = useState('');
  const [memo, setMemo] = useState('');

  useEffect(() => {
    if (params.id) {
      const storeData = dataStore.getStoreById(params.id);
      if (storeData) {
        setStore(storeData);
        setRecords(dataStore.getMedalRecordsByStoreId(params.id));
        
        const defaultExpiryDate = new Date();
        defaultExpiryDate.setMonth(defaultExpiryDate.getMonth() + 6);
        setExpiryDate(defaultExpiryDate.toISOString().split('T')[0]);
      }
    }
  }, [params.id]);

  const handleAddTransaction = () => {
    if (store && medalCount && expiryDate) {
      dataStore.addMedalRecord({
        storeId: store.id,
        medalCount: parseInt(medalCount),
        transactionType,
        transactionDate: new Date(),
        expiryDate: new Date(expiryDate),
        memo
      });
      
      setMedalCount('');
      setMemo('');
      setShowAddTransaction(false);
      setRecords(dataStore.getMedalRecordsByStoreId(store.id));
    }
  };

  if (!store) {
    return <div>店舗が見つかりません</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <button onClick={() => router.back()} className="mr-3">
            ←
          </button>
          <h1 className="text-xl font-semibold">{store.name}</h1>
        </div>
        <button 
          onClick={() => setShowAddTransaction(true)}
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
        >
          追加
        </button>
      </div>

      {/* Balance */}
      <div className="bg-white mx-4 mt-4 p-6 rounded-lg shadow-sm text-center">
        <p className="text-gray-600 mb-2">現在の残高</p>
        <p className="text-3xl font-bold text-blue-600">
          {dataStore.getStoreMedalBalance(store.id)}枚
        </p>
      </div>

      {/* Transaction History */}
      <div className="mt-4 bg-white mx-4 rounded-lg shadow-sm">
        <div className="px-4 py-3 border-b">
          <h2 className="font-semibold">取引履歴</h2>
        </div>
        <div className="divide-y">
          {records.map((record) => (
            <div key={record.id} className="px-4 py-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className={`font-medium ${
                      record.transactionType === 'deposit' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {record.transactionType === 'deposit' ? '入金' : '出金'}
                    </span>
                    <span className="font-medium">{record.medalCount}枚</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    期限: {new Date(record.expiryDate).toLocaleDateString('ja-JP')}
                  </p>
                  {record.memo && (
                    <p className="text-xs text-blue-600 mt-1">{record.memo}</p>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(record.transactionDate).toLocaleDateString('ja-JP')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showAddTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-4">取引追加</h2>
            
            {/* Transaction Type */}
            <div className="mb-4">
              <div className="flex rounded-lg bg-gray-100 p-1">
                <button
                  onClick={() => setTransactionType('deposit')}
                  className={`flex-1 py-2 rounded-md text-sm ${
                    transactionType === 'deposit' ? 'bg-white shadow-sm' : ''
                  }`}
                >
                  入金
                </button>
                <button
                  onClick={() => setTransactionType('withdraw')}
                  className={`flex-1 py-2 rounded-md text-sm ${
                    transactionType === 'withdraw' ? 'bg-white shadow-sm' : ''
                  }`}
                >
                  出金
                </button>
              </div>
            </div>

            {/* Medal Count */}
            <input
              type="number"
              placeholder="メダル数"
              value={medalCount}
              onChange={(e) => setMedalCount(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4"
            />

            {/* Expiry Date */}
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4"
            />

            {/* Memo */}
            <input
              type="text"
              placeholder="メモ（任意）"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4"
            />

            <div className="flex space-x-3">
              <button
                onClick={() => setShowAddTransaction(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg"
              >
                キャンセル
              </button>
              <button
                onClick={handleAddTransaction}
                disabled={!medalCount || !expiryDate}
                className="flex-1 bg-blue-500 text-white py-2 rounded-lg disabled:bg-gray-300"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}