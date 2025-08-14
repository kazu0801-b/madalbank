import { useState } from 'react';
import { LoginForm } from '../../molecules/LoginForm';

interface LoginPageProps {
  onLogin?: (email: string, password: string) => Promise<void>;
  onGuestLogin?: () => Promise<void>;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onGuestLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    setError('');

    try {
      if (onLogin) {
        await onLogin(email, password);
      } else {
        // デモ用のダミー認証
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (email === 'demo@example.com' && password === 'password') {
          console.log('ログイン成功');
        } else {
          throw new Error('メールアドレスまたはパスワードが間違っています');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ログインに失敗しました');
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
    <div className="min-h-screen bg-white flex flex-col">
      {/* ヘッダー */}
      <div className="bg-blue-500 text-white p-4 text-center">
        <h1 className="text-2xl font-bold">メダルバンク</h1>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* ロゴセクション */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🏪</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              ログイン
            </h2>
            <p className="text-sm text-gray-600">
              メダル管理を始めましょう
            </p>
          </div>

          {/* ログインフォーム */}
          <LoginForm
            onSubmit={handleLogin}
            onGuestLogin={handleGuestLogin}
            isLoading={isLoading}
            error={error}
          />
        </div>
      </div>

      {/* フッター */}
      <div className="p-4 text-center">
        <p className="text-xs text-gray-500">
          デモ: demo@example.com / password
        </p>
      </div>
    </div>
  );
};