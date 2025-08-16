interface CompactBalanceProps {
  storeName: string;
  balance: number;
  lastUpdated?: string;
  isLoading?: boolean;
}

export const CompactBalance: React.FC<CompactBalanceProps> = ({
  storeName,
  balance,
  lastUpdated,
  isLoading = false
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 mb-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-blue-100 text-sm font-medium">{storeName}</span>
            <span className="text-blue-200 text-lg">💰</span>
          </div>
          
          <div className="flex items-baseline space-x-2">
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-blue-400 rounded w-24"></div>
              </div>
            ) : (
              <>
                <span className="text-2xl font-bold text-white">
                  {balance.toLocaleString()}
                </span>
                <span className="text-blue-100 text-sm">メダル</span>
              </>
            )}
          </div>
          
          {lastUpdated && (
            <div className="text-blue-200 text-xs mt-1">
              最終更新: {formatDate(lastUpdated)}
            </div>
          )}
        </div>
        
        {/* アイコンエリア */}
        <div className="text-3xl opacity-80">
          🏪
        </div>
      </div>
      
      {/* 残高バー（視覚的な要素） */}
      <div className="mt-3">
        <div className="w-full bg-blue-400 bg-opacity-30 rounded-full h-1">
          <div 
            className="bg-white bg-opacity-50 h-1 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${Math.min(100, (balance / 10000) * 100)}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};