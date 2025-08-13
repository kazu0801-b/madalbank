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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Medal Bank
            </h1>
            <p className="text-gray-600">
              アカウントにログインしてください
            </p>
          </div>

          <LoginForm
            onSubmit={handleLogin}
            onGuestLogin={handleGuestLogin}
            isLoading={isLoading}
            error={error}
          />

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              アカウントをお持ちでない方は{' '}
              <a href="#" className="text-blue-600 hover:text-blue-500 font-medium">
                こちらから登録
              </a>
            </p>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            デモ用: demo@example.com / password
          </p>
        </div>
      </div>
    </div>
  );
};