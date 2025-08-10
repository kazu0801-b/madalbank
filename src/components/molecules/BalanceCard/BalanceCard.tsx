import { Button } from '../../atoms/Button';

interface BalanceCardProps {
  balance: number;
  currency?: string;
  showActions?: boolean;
  onDeposit?: () => void;
  onWithdraw?: () => void;
  onTransfer?: () => void;
  className?: string;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  balance,
  currency = 'メダル',
  showActions = true,
  onDeposit,
  onWithdraw,
  onTransfer,
  className = '',
}) => {
  const formatBalance = (amount: number) => {
    return amount.toLocaleString('ja-JP');
  };

  const getBalanceColor = (amount: number) => {
    if (amount >= 10000) return 'text-green-600';
    if (amount >= 1000) return 'text-blue-600';
    if (amount >= 100) return 'text-orange-600';
    return 'text-gray-600';
  };

  return (
    <div className={`bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl shadow-lg p-6 ${className}`}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-500 rounded-full p-2">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800">メダル残高</h3>
        </div>
        <div className="bg-white/50 backdrop-blur-sm rounded-lg px-3 py-1">
          <span className="text-sm font-medium text-gray-600">残高</span>
        </div>
      </div>

      {/* 残高表示 */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center space-x-2">
          <span className={`text-4xl font-bold ${getBalanceColor(balance)}`}>
            {formatBalance(balance)}
          </span>
          <span className="text-xl font-semibold text-gray-600">
            {currency}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {balance >= 10000 && '🏆 リッチユーザー'}
          {balance >= 1000 && balance < 10000 && '💰 標準ユーザー'}
          {balance >= 100 && balance < 1000 && '🥉 ビギナー'}
          {balance < 100 && '🌱 スターター'}
        </p>
      </div>

      {/* アクションボタン */}
      {showActions && (
        <div className="grid grid-cols-3 gap-3">
          <Button
            variant="success"
            size="sm"
            onClick={onDeposit}
          >
            入金
          </Button>
          <Button
            variant="warning"
            size="sm"
            onClick={onWithdraw}
          >
            出金
          </Button>
          <Button
            variant="info"
            size="sm"
            onClick={onTransfer}
          >
            送金
          </Button>
        </div>
      )}

      {/* 残高レベルプログレスバー */}
      <div className="mt-4 bg-white/30 rounded-full h-2">
        <div 
          className="bg-gradient-to-r from-blue-400 to-indigo-500 h-2 rounded-full transition-all duration-500"
          style={{ width: `${Math.min((balance / 10000) * 100, 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-600 mt-1">
        <span>0</span>
        <span className="font-medium">次のレベルまで: {Math.max(0, 10000 - balance)}メダル</span>
        <span>10,000</span>
      </div>
    </div>
  );
};