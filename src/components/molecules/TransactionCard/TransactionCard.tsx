interface Transaction {
  id: number;
  type: 'deposit' | 'withdraw';
  amount: number;
  balance_before: number;
  balance_after: number;
  description?: string;
  created_at: string;
}

interface TransactionCardProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({
  transactions,
  isLoading = false
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      return date.toLocaleDateString('ja-JP', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const getTransactionIcon = (type: string) => {
    return type === 'deposit' ? '📈' : '📉';
  };

  const getTransactionLabel = (type: string) => {
    return type === 'deposit' ? '入金' : '出金';
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 取引履歴</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">📋 取引履歴</h3>
        {transactions.length > 5 && (
          <button className="text-blue-500 text-sm font-medium hover:text-blue-600">
            すべて表示
          </button>
        )}
      </div>

      {transactions.length > 0 ? (
        <div className="space-y-3">
          {transactions.slice(0, 5).map((transaction, index) => (
            <div
              key={transaction.id}
              className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 hover:bg-gray-50 ${
                index < transactions.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                {/* アイコン */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  transaction.type === 'deposit' 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-red-100 text-red-600'
                }`}>
                  <span className="text-lg">
                    {getTransactionIcon(transaction.type)}
                  </span>
                </div>

                {/* 取引情報 */}
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-800">
                      {getTransactionLabel(transaction.type)}
                    </span>
                    <span className={`font-bold ${
                      transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'deposit' ? '+' : '-'}
                      {transaction.amount.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                    <span>{formatDate(transaction.created_at)}</span>
                    <span>•</span>
                    <span>残高: {transaction.balance_after.toLocaleString()}</span>
                  </div>
                  
                  {transaction.description && (
                    <div className="text-xs text-gray-400 mt-1">
                      {transaction.description}
                    </div>
                  )}
                </div>
              </div>

              {/* 残高変化の矢印 */}
              <div className="flex items-center space-x-2 text-xs text-gray-400">
                <span>{transaction.balance_before.toLocaleString()}</span>
                <span>→</span>
                <span className={transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'}>
                  {transaction.balance_after.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📝</div>
          <p className="text-gray-500 text-sm">まだ取引がありません</p>
          <p className="text-gray-400 text-xs mt-1">入金・出金ボタンから取引を開始してください</p>
        </div>
      )}
    </div>
  );
};