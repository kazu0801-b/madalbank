import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '../../molecules/Card';
import { BalanceCard } from '../../molecules/BalanceCard';
import { Button } from '../../atoms/Button';
import { MainLayout } from '../../templates/MainLayout';

export const HomePage: React.FC = () => {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [balance, setBalance] = useState(2450); // モックデータ
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
      const email = localStorage.getItem('userEmail') || '';
      const isGuest = localStorage.getItem('isGuest') === 'true';
      setIsLoggedIn(loggedIn);
      setUserEmail(isGuest ? 'ゲスト' : email);
    }
  }, []);

  const handleSearch = (query: string) => {
    console.log('Searching for:', query);
  };

  const handleLogin = () => {
    router.push('/login');
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('isGuest');
    setIsLoggedIn(false);
    setUserEmail('');
    router.push('/login');
  };

  const handleDeposit = () => {
    console.log('入金処理');
    // TODO: 入金モーダル表示
  };

  const handleWithdraw = () => {
    console.log('出金処理');
    // TODO: 出金モーダル表示
  };

  const handleTransfer = () => {
    console.log('送金処理');
    // TODO: 送金モーダル表示
  };

  return (
    <MainLayout title="メダルバンク" showSearch onSearch={handleSearch}>
      <div className="space-y-8">
        {/* ログイン状態表示 */}
        {isLoggedIn && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-green-900">
                  ログイン中: {userEmail}
                </h3>
                <p className="text-green-700">メダルバンクへようこそ！</p>
              </div>
              <Button 
                variant="danger" 
                size="sm" 
                onClick={handleLogout}
              >
                ログアウト
              </Button>
            </div>
          </div>
        )}

        <section className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {isLoggedIn ? `おかえりなさい、${userEmail}様！` : 'メダルバンクへようこそ'}
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            {isLoggedIn ? 'あなたの実績とメダルを管理しましょう' : 'あなたの実績とメダルを追跡・管理できます'}
          </p>
          {!isLoggedIn ? (
            <Button size="lg" onClick={handleLogin}>
              ログインして始める
            </Button>
          ) : (
            <Button size="lg">
              今すぐ始める
            </Button>
          )}
        </section>

        {/* 残高表示（ログイン時のみ） */}
        {isLoggedIn && (
          <section>
            <BalanceCard
              balance={balance}
              onDeposit={handleDeposit}
              onWithdraw={handleWithdraw}
              onTransfer={handleTransfer}
            />
          </section>
        )}

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card title="最近の実績">
            <p className="text-gray-600">最新のメダルと実績を確認できます。</p>
            <div className="mt-4">
              <Button variant="secondary">すべて見る</Button>
            </div>
          </Card>

          <Card title="統計情報">
            <p className="text-gray-600">あなたの進捗と統計を追跡します。</p>
            <div className="mt-4">
              <Button variant="secondary">統計を見る</Button>
            </div>
          </Card>

          <Card title="ランキング">
            <p className="text-gray-600">他のユーザーとの順位を確認できます。</p>
            <div className="mt-4">
              <Button variant="secondary">ランキングを見る</Button>
            </div>
          </Card>
        </section>
      </div>
    </MainLayout>
  );
};