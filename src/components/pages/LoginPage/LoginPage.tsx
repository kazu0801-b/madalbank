import { useState } from 'react';
import { LoginForm } from '../../molecules/LoginForm';
import { useToast } from '../../organisms/Toast';
import { authApi } from '../../../utils/api';

interface LoginPageProps {
  onLogin?: (username: string) => Promise<void>;
  onGuestLogin?: () => Promise<void>;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onGuestLogin }) => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleLogin = async (username: string) => {
    setIsLoading(true);
    setError('');

    try {
      if (onLogin) {
        await onLogin(username);
      } else {
        // APIを使った実際のログイン処理
        const result = await authApi.login(username);
        
        if (result.success && result.data) {
          // ログイン成功時の処理
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('userToken', result.data.token || '');
          localStorage.setItem('userName', result.data.user.username);
          localStorage.setItem('userEmail', result.data.user.email);
          localStorage.setItem('userId', result.data.user.id.toString());
          
          showToast(`ようこそ、${result.data.user.username}さん！`, 'success');
          
          // ホームページに遷移
          setTimeout(() => {
            window.location.href = '/';
          }, 1000);
        } else {
          throw new Error(result.error || 'ログインに失敗しました');
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ログインに失敗しました';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError('');

    try {
      if (onGuestLogin) {
        await onGuestLogin();
      } else {
        // デモ用のゲストログイン
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // ゲストユーザーとしてローカルストレージに保存
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userEmail', 'guest@medalbank.com');
        localStorage.setItem('isGuest', 'true');
        
        // ページをリロードしてホームページに遷移
        window.location.href = '/';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ゲストログインに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* メインコンテンツ */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* ログインフォーム */}
            <LoginForm
              onSubmit={handleLogin}
              onGuestLogin={handleGuestLogin}
              isLoading={isLoading}
              error={error}
            />
          </div>

          {/* 開発者用メニュー */}
          <div className="mt-6 bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              🔧 開発者メニュー
            </h3>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <a
                href="/test"
                className="text-blue-600 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition-colors"
              >
                📊 統合テストページ
              </a>
              <button
                onClick={() => {
                  localStorage.setItem('isLoggedIn', 'true');
                  localStorage.setItem('userName', 'デモユーザー');
                  localStorage.setItem('userEmail', 'demo@example.com');
                  localStorage.setItem('isGuest', 'true');
                  window.location.href = '/';
                }}
                className="text-left text-green-600 hover:text-green-700 p-2 rounded-lg hover:bg-green-50 transition-colors"
              >
                ⚡ クイックログイン（ローカルのみ）
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* フッター */}
      <div className="p-4 text-center">
        <p className="text-xs text-gray-500 mb-2">
          🧪 MVP版 - バックエンドAPI連携テスト中
        </p>
        <div className="flex justify-center space-x-4 text-xs text-gray-400">
          <span>• testuser でログイン</span>
          <span>• ゲストモードあり</span>
          <span>• 統合テスト可能</span>
        </div>
      </div>
    </div>
  );
};