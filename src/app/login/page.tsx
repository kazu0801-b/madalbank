'use client';

import { useRouter } from 'next/navigation';
import { LoginPage } from '@/components';

export default function Login() {
  const router = useRouter();

  const handleLogin = async (username: string) => {
    console.log('Login attempt:', { username });
    
    // TODO: 実際のAPIエンドポイントに送信
    // const response = await fetch('/api/auth/login', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ username }),
    // });
    
    // if (!response.ok) {
    //   throw new Error('ログインに失敗しました');
    // }

    // ログイン成功をローカルストレージに保存
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userName', username);
    localStorage.setItem('userEmail', `${username}@example.com`);
    
    // ログイン成功後のリダイレクト
    router.push('/');
  };

  return <LoginPage onLogin={handleLogin} />;
}