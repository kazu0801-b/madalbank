import { useState } from 'react';

interface CalculatorProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  type: 'deposit' | 'withdraw';
  currentBalance?: number;
}

export const Calculator: React.FC<CalculatorProps> = ({
  isOpen,
  onClose,
  onConfirm,
  type,
  currentBalance = 0
}) => {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForNewNumber, setWaitingForNewNumber] = useState(false);

  const inputNumber = (num: string) => {
    if (waitingForNewNumber) {
      setDisplay(num);
      setWaitingForNewNumber(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const inputClear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForNewNumber(false);
  };

  const inputBackspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const handleConfirm = () => {
    const amount = parseFloat(display);
    if (amount > 0) {
      onConfirm(amount);
      inputClear();
      onClose();
    }
  };

  const isInvalidWithdraw = type === 'withdraw' && parseFloat(display) > currentBalance;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
      <div className="bg-white rounded-t-3xl w-full max-w-md p-6 animate-slide-up">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            {type === 'deposit' ? '💰 入金' : '💸 出金'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* 残高表示 */}
        {type === 'withdraw' && (
          <div className="bg-blue-50 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-600">現在残高</p>
            <p className="text-lg font-semibold text-blue-800">
              {currentBalance.toLocaleString()} メダル
            </p>
          </div>
        )}

        {/* ディスプレイ */}
        <div className="bg-gray-100 rounded-lg p-4 mb-4">
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-800 min-h-[1.2em]">
              {parseFloat(display).toLocaleString()}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {type === 'deposit' ? '入金額' : '出金額'}
            </div>
          </div>
        </div>

        {/* エラーメッセージ */}
        {isInvalidWithdraw && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-700 text-sm">
              ⚠️ 残高不足です。最大 {currentBalance.toLocaleString()} メダルまで出金できます。
            </p>
          </div>
        )}

        {/* 電卓ボタン */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {/* 数字・操作ボタン */}
          {[
            ['C', '⌫', '', ''],
            ['7', '8', '9', ''],
            ['4', '5', '6', ''],
            ['1', '2', '3', ''],
            ['00', '0', '.', '']
          ].map((row, rowIndex) => 
            row.map((btn, colIndex) => {
              if (!btn) return <div key={`${rowIndex}-${colIndex}`} />;
              
              let buttonClass = "h-14 rounded-xl font-semibold text-lg flex items-center justify-center transition-all duration-200 ";
              
              if (btn === 'C' || btn === '⌫') {
                buttonClass += "bg-gray-200 text-gray-700 hover:bg-gray-300";
              } else {
                buttonClass += "bg-blue-500 text-white hover:bg-blue-600 active:scale-95";
              }

              return (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  className={buttonClass}
                  onClick={() => {
                    if (btn === 'C') inputClear();
                    else if (btn === '⌫') inputBackspace();
                    else inputNumber(btn);
                  }}
                >
                  {btn}
                </button>
              );
            })
          )}
        </div>

        {/* 確定ボタン */}
        <button
          onClick={handleConfirm}
          disabled={parseFloat(display) <= 0 || isInvalidWithdraw}
          className={`w-full h-14 rounded-xl font-semibold text-lg transition-all duration-200 ${
            parseFloat(display) <= 0 || isInvalidWithdraw
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : type === 'deposit'
                ? 'bg-green-500 text-white hover:bg-green-600 active:scale-95'
                : 'bg-red-500 text-white hover:bg-red-600 active:scale-95'
          }`}
        >
          {type === 'deposit' ? '入金確定' : '出金確定'}
        </button>
      </div>
    </div>
  );
};