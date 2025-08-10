'use client';

import { useRouter } from 'next/navigation';
import { LoginPage } from '@/components';

export default function Login() {
  const router = useRouter();

  const handleLogin = async (email: string, password: string) => {
    console.log('Login attempt:', { email, password });
    
    // TODO: 実際のAPIエンドポイントに送信
    // const response = await fetch('/api/auth/login', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ email, password }),
    // });
    
    // if (!response.ok) {
    //   throw new Error('ログインに失敗しました');
    // }

    // ログイン成功をローカルストレージに保存
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userEmail', email);
    
    // ログイン成功後のリダイレクト
    router.push('/');
  };

  return <LoginPage onLogin={handleLogin} />;
}