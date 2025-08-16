import { useState, useEffect } from 'react';

interface KeyboardInputProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  type: 'deposit' | 'withdraw';
  currentBalance: number;
}

export const KeyboardInput: React.FC<KeyboardInputProps> = ({
  isOpen,
  onClose,
  onConfirm,
  type,
  currentBalance
}) => {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setError('');
    }
  }, [isOpen]);

  const handleConfirm = () => {
    const numAmount = parseInt(amount);
    
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError('有効な金額を入力してください');
      return;
    }

    if (type === 'withdraw' && numAmount > currentBalance) {
      setError('残高が不足しています');
      return;
    }

    onConfirm(numAmount);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {type === 'deposit' ? '入金' : '払い出し'}
          </h2>
          <p className="text-gray-600">
            現在の残高: {currentBalance.toLocaleString()}メダル
          </p>
        </div>

        <div className="mb-6">
          <input
            type="number"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setError('');
            }}
            onKeyDown={handleKeyDown}
            placeholder="金額を入力"
            className="w-full text-center text-3xl font-bold border-2 border-gray-300 rounded-xl p-4 focus:border-blue-500 focus:outline-none"
            autoFocus
          />
          <p className="text-center text-gray-500 mt-2">メダル</p>
          {error && (
            <p className="text-red-500 text-sm text-center mt-2">{error}</p>
          )}
        </div>

        <div className="flex space-x-4">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleConfirm}
            className={`flex-1 text-white py-3 rounded-xl font-semibold transition-colors ${
              type === 'deposit' 
                ? 'bg-green-500 hover:bg-green-600' 
                : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            確定
          </button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            Enterキーで確定 / Escキーでキャンセル
          </p>
        </div>
      </div>
    </div>
  );
};