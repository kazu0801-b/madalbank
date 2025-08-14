import { useRouter, usePathname } from 'next/navigation';

interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  path: string;
}

const navigationItems: NavigationItem[] = [
  { id: 'home', label: 'ホーム', icon: '🏠', path: '/' },
  { id: 'deposit', label: '入金', icon: '💰', path: '/deposit' },
  { id: 'withdraw', label: '出金', icon: '💸', path: '/withdraw' },
  { id: 'history', label: '履歴', icon: '📝', path: '/history' },
  { id: 'profile', label: '設定', icon: '⚙️', path: '/profile' },
];

export const BottomNavigation: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="grid grid-cols-5 h-16">
        {navigationItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              className={`flex flex-col items-center justify-center py-2 px-1 transition-colors ${
                isActive 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <span className="text-xl mb-1">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};