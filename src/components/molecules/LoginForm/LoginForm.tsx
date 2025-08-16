import { useState } from 'react';

interface LoginFormProps {
  onSubmit: (username: string) => void;
  onGuestLogin?: () => void;
  isLoading?: boolean;
  error?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  onGuestLogin,
  isLoading = false,
  error,
}) => {
  const [username, setUsername] = useState('testuser');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onSubmit(username.trim());
    }
  };

  return (
    <div className="space-y-6">
      {/* MVP版のシンプルなログインフォーム */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🏪</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">メダルバンクMVP</h1>
        <p className="text-gray-600 text-sm">簡単ログインでメダル管理を始めましょう</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ユーザー名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="testuser"
              disabled={isLoading}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              MVPデモ用: &apos;testuser&apos; でログインできます
            </p>
          </div>
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200 flex items-center">
            <span className="mr-2">⚠️</span>
            {error}
          </div>
        )}

        <div className="space-y-3">
          <button
            type="submit"
            disabled={isLoading || !username.trim()}
            className="w-full bg-blue-500 text-white py-4 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                ログイン中...
              </>
            ) : (
              '🚀 ログイン'
            )}
          </button>
          
          {onGuestLogin && (
            <button
              type="button"
              onClick={onGuestLogin}
              disabled={isLoading}
              className="w-full bg-gray-100 text-gray-700 py-4 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              👤 ゲストとして試す
            </button>
          )}
        </div>

        <div className="text-center text-xs text-gray-500 mt-6">
          <p>🧪 これはMVP（最小機能版）です</p>
          <p>本格的な認証機能は今後実装予定</p>
        </div>
      </form>
    </div>
  );
};