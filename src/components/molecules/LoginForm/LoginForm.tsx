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
        <div className="flex justify-center gap-4">
          <div className="border border-gray-300 rounded-lg p-3 bg-white hover:border-blue-400 transition-colors">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? 'ログイン中...' : 'ログイン'}
            </Button>
          </div>
          
          <div className="border border-gray-300 rounded-lg p-3 bg-white hover:border-gray-400 transition-colors">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={onGuestLogin}
              disabled={isLoading}
            >
              ゲストログイン
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex justify-center">
          <div className="border border-gray-300 rounded-lg p-3 bg-white">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? 'ログイン中...' : 'ログイン'}
            </Button>
          </div>
        </div>
      )}
    </form>
  );
};