import { useState } from 'react';
import { Button } from '../../atoms/Button';
import { Input } from '../../atoms/Input';

interface LoginFormProps {
  onSubmit: (email: string, password: string) => void;
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  const validateForm = () => {
    let isValid = true;
    
    if (!email || !email.includes('@')) {
      setEmailError(true);
      isValid = false;
    } else {
      setEmailError(false);
    }
    
    if (!password || password.length < 6) {
      setPasswordError(true);
      isValid = false;
    } else {
      setPasswordError(false);
    }
    
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(email, password);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <Input
          type="email"
          label="メールアドレス"
          placeholder="example@mail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={emailError}
          disabled={isLoading}
        />
        
        <Input
          type="password"
          label="パスワード"
          placeholder="6文字以上"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={passwordError}
          disabled={isLoading}
        />
      </div>

      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {onGuestLogin ? (
        <div className="space-y-3">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-500 text-white py-4 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'ログイン中...' : 'ログイン'}
          </button>
          
          <button
            type="button"
            onClick={onGuestLogin}
            disabled={isLoading}
            className="w-full bg-gray-100 text-gray-700 py-4 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            ゲストログイン
          </button>
        </div>
      ) : (
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-500 text-white py-4 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'ログイン中...' : 'ログイン'}
        </button>
      )}
    </form>
  );
};